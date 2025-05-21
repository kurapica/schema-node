import { SchemaType } from "../enum/schemaType"
import { INodeSchema } from "../schema/nodeSchema"
import { getCachedSchema } from "../utils/schemaProvider"
import { DataChangeWatcher } from "../utils/dataChangeWatcher"
import { deepClone, isEqual, isNull, debounce, generateGuidPart } from "../utils/toolset"
import { ISchemaConfig } from "../config/schemaConfig"
import { prepareRuleSchema, RuleSchema } from "../ruleSchema/ruleSchema"
import { Rule } from "../rule/rule"
import { ArrayNode } from "./arrayNode"
import { StructNode } from "./structNode"

/**
 * The abstract schema node.
 */
export abstract class SchemaNode<TC extends ISchemaConfig, TRS extends RuleSchema, TR extends Rule> 
{
    //#region Properties

    /**
     * The schema type of the node.
     */
    get schemaType(): SchemaType { return SchemaType.Namespace }

    /**
     * The guid of the node.
     */
    readonly guid: string = generateGuidPart()

    /**
     * Gets the full access path
     */
    get access(): string {
        if (this._parent instanceof ArrayNode)
        {
            if (this._parent.enumArrayNode)
            {
                return this._parent.access
            }
            else
            {
                const index = this._parent.elements.findIndex(e => e === this)
                if (index >= 0)
                    return `${this._parent.access}[${index}].${this._config.name}`
            }
        }
        else if (this._parent instanceof StructNode)
        {
            return `${this._parent.access}.${this._config.name}`
        }
        return this._config.name
     }

    /**
     * The config of the node.
     */
    get config(): TC { return this._config }

    /**
     * The schema info.
     */
    get schemaInfo(): INodeSchema { return this._schemaInfo }

    /**
     * The data of the node.
     */
    get data(): any { return this._data }
    set data(value: any)
    {
        this._data = value
        const res = this.validate()
        if (res instanceof Promise)
            res.finally(() => this.notify())
        else
            this.notify()
    }

    /**
     * The data is changed.
     */
    get changed(): boolean { return !isEqual(this._original, this.data) }

    /**
     * The data is valid.
     */
    get valid(): boolean { return this._valid }

    /**
     * The error data of the node.
     */
    get error(): string | undefined { return this._error }

    /**
     * The parent node of the node.
     */
    get parent(): AnySchemaNode | undefined { return this._parent }

    /**
     * The schema node rule
     */
    get rule(): TR { return this._rule }

    /**
     * The schema node rule schema
     */
    get ruleSchema(): TRS { return this._ruleSchema }

    /**
     * Gets the name of the node
     */
    get name(): string { return this._config.name }
    
    /**
     * Gets the display of the node
     */
    get display(): string { return `${this._config.display}` }

    /**
     * Gets the description of the node
     */
    get desc(): string { return `${this._config.desc}` }

    /**
     * Whether the node is readonly
     */
    get readonly(): boolean { return this._config.readonly  || this._config.displayOnly || this._config.immutable && !isNull(this._original) || false }

    /**
     * Whether the node data is required
     */
    get require(): boolean { return this._config.require || false }

    /**
     * Whether the node is invisible
     */
    get invisible(): boolean { return this._rule.invisible || this._config.invisible || false }

    /**
     * Whether the node is display only
     */
    get displayOnly(): boolean { return this._config.displayOnly || false }

    /**
     * Gets the unit of the data
     */
    get unit(): string { return this._config.unit || "" }

    //#endregion

    //#region Abstract methods

    /**
     * Re-calc the valid state of the node and children.
     */
    abstract validate(): any
    
    //#endregion

    //#region Methods

    /**
     * active the rule schema for the node
     */
    activeRule(init?: boolean): void { return this.ruleSchema.active(this, init) }

    /**
     * Reset the change state of the node and children.
     */
    resetChanges(): void { this._original = deepClone(this.data) }

    /**
     * Subscribe a data change handler
     * 
     * @param func the change handler
     * @param state true means watch the state like invisible, otherwise the data change
     */
    subscribe(func: Function, state?: boolean): Function { return state ? this._stateWatcher.addWatcher(func) : this._watchter.addWatcher(func) }

    /**
     * Watch other node data
     */
    watch(node: AnySchemaNode, func: Function) { return this._watches.push(node.subscribe(func)) }

    /**
     * Notify the data, error, valid may changes
     */
    notify = debounce(() => this._watchter.notify(this), 50)

    /**
     * Notify the state changes
     */
    notifyState = debounce(() => this._stateWatcher.notify(this), 50)

    /**
     * Dispose the node and children.
     */
    dispose(): void {
        this._watches.forEach(w => w())
        this._stateWatcher.dispose()
        this._watchter.dispose() 
    }

    //#endregion

    //#region Field
    
    protected _stateWatcher: DataChangeWatcher = new DataChangeWatcher()
    protected _watchter: DataChangeWatcher = new DataChangeWatcher()
    protected _schemaInfo: INodeSchema = { name: '', type: SchemaType.Namespace }
    protected _parent?: AnySchemaNode
    protected _rule: TR
    protected _ruleSchema: TRS
    protected _config: TC
    protected _error: string | undefined
    protected _valid: boolean = true
    protected _original: any
    protected _data: any
    protected _watches: Function[] = []

    //#endregion

    /**
     * Construct a scalar schema node.
     * @param parent the parent node of the node.
     * @param config the config of the node.
     */
    constructor(parent: AnySchemaNode, config: ISchemaConfig, data: any)
    {
        this._parent = parent
        this._config = config as TC
        this._schemaInfo = getCachedSchema(config.type)!
        this._data = isNull(data) ? deepClone(config.default) : data
        this._rule = {} as any as TR
        this._ruleSchema = prepareRuleSchema(this, parent) as any as TRS
        
        // popup
        if (parent) this.subscribe(() => parent.notify())
    }
}

/**
 * Any schema node
 */
export type AnySchemaNode = SchemaNode<ISchemaConfig, RuleSchema, Rule>