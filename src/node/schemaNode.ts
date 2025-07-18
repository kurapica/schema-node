import { SchemaType, SchemaTypeValue } from "../enum/schemaType"
import { INodeSchema } from "../schema/nodeSchema"
import { getCachedSchema, getSchema } from "../utils/schemaProvider"
import { DataChangeWatcher } from "../utils/dataChangeWatcher"
import { deepClone, isEqual, isNull, debounce, generateGuid, sformat } from "../utils/toolset"
import { ISchemaConfig } from "../config/schemaConfig"
import { RuleSchema } from "../ruleSchema"
import { Rule } from "../rule/rule"
import { _LS } from "../utils/locale"
import { getRuleSchema } from "../ruleSchema/ruleSchema"

/**
 * The abstract schema node.
 */
export abstract class SchemaNode<TC extends ISchemaConfig, TRS extends RuleSchema, TR extends Rule>
{
    //#region Properties

    /**
     * The schema type of the node.
     */
    get schemaType(): SchemaTypeValue { return SchemaType.Namespace }

    /**
     * The guid of the node.
     */
    readonly guid: string = generateGuid()

    /**
     * Gets the full access path
     */
    get access(): string {
        if (this._parent)
        {
            const parent = this._parent.access
            const index = this._parent.indexof(this)
            if (typeof(index) === "number")
            {
                return index >= 0 ? `${parent}[${index}]` : ""
            }
            else if (typeof(index) === "string")
            {
                return !isNull(parent) 
                    ? (isNull(index) ? parent : `${parent}.${index}`)
                    : index
            }
        }
        return ""
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
     * The schema type name.
     */
    get schemaName(): string { return this._schemaInfo.name }

    /**
     * The data of the node.
     */
    get rawData(): any { return this._data }
    get data(): any { return deepClone(this._data) }
    set data(value: any)
    {
        if (this._data === value) return
        this._data = deepClone(value)
        this.validation().then(this.notify)
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
     * Gets the display of the node
     */
    get display(): string { return `${this._config.display}` }

    /**
     * The placeholder for input
     */
    get inputPlaceHolder(): string { return sformat(_LS("PLACEHOLDER_INPUT"), this.display) }

    /**
     * The placeholder for select
     */
    get selectPlaceHolder(): string { return sformat(_LS("PLACEHOLDER_SELECT"), this.display) }

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
    abstract validate(): void | Promise<void>

    /**
     * indexof the sub node
     */
    indexof(node: AnySchemaNode): number | string | undefined | null { return null }

    /**
     * Common data validation and notify
     */
    async validation()
    {
        // validation
        const valid = this._valid
        const res = this.validate()
        if (res instanceof Promise) await res
        if (valid !== this._valid)
            this.notifyState()
    }

    //#endregion

    //#region Methods

    /**
     * Active the rule schema for the node
     */
    activeRule(init?: boolean): void { return this.ruleSchema.active(this, init) }

    /**
     * Deactive the rule schema
     */
    deactiveRule(): void { return this.ruleSchema.deactive(this) }

    /**
     * Reset the change state of the node and children.
     */
    resetChanges(): void { this._original = deepClone(this._data) }

    /**
     * Subscribe a data change handler
     *
     * @param func the change handler
     * @param immediate whether to call the handler immediately
     */
    subscribe(func: Function, immediate?: boolean): Function {
        const result = this._watcher.addWatcher(func) 
        if (immediate) func()
        return result
    }

    /**
     * Subscribe a state change handler
     */
    subscribeState(func: Function, immediate?: boolean) : Function {
        const result = this._stateWatcher.addWatcher(func) 
        if (immediate) func()
        return result
    }

    /**
     * Watch other node data
     */
    watch(node: AnySchemaNode, func: Function) { return this._watches.push(node.subscribe(func)) }

    /**
     * Clear data watches
     */
    clearWatch(): void {
        this._watches.forEach(w => w())
        this._watches.length = 0
    }

    /**
     * Notify the data changes
     */
    notify = debounce((...args: any[]) => this._watcher.notify(...args), 10)

    /**
     * Notify the state changes like valid, error, invisible and etc
     */
    notifyState = debounce((...args: any[]) => this._stateWatcher.notify(...args), 10)

    /**
     * Swap the watcher, useful when field type changes
     */
    swapWatcher(node: AnySchemaNode) {
        const temp = this._watcher
        this._watcher = node._watcher
        node._watcher = temp
    }

    /**
     * Set the error by parent
     */
    setError (err: string) {
        if (this._valid)
        {
            this._valid = false
            this._error = err
            this.notifyState()
        }
    }

    /**
     * Dispose the node and children.
     */
    dispose(): void {
        this._watches.forEach(w => w())
        this._stateWatcher.dispose()
        this._watcher.dispose()
    }

    //#endregion

    //#region Field

    protected _stateWatcher: DataChangeWatcher = new DataChangeWatcher()
    protected _watcher: DataChangeWatcher = new DataChangeWatcher()
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
    constructor(config: ISchemaConfig, data: any, parent: AnySchemaNode | undefined = undefined)
    {
        this._parent = parent
        this._config = config as TC
        this._schemaInfo = getCachedSchema(config.type)!
        this._data = isNull(data) ? deepClone(config.default) : data
        this._original = data
        this._rule = {} as any as TR
        this._ruleSchema = (parent?.ruleSchema?.getChildRuleSchema(this) ?? getRuleSchema(this.schemaInfo)) as any as TRS
        this._ruleSchema.initNode(this)

        setTimeout(() => this.validation(), 10)
    }
}

/**
 * Any schema node
 */
export type AnySchemaNode = SchemaNode<ISchemaConfig, RuleSchema, Rule>


//#region decorator

const schemaNodeMap: Record<string, new (config: ISchemaConfig, data: any, parent: AnySchemaNode | undefined) => AnySchemaNode> = {}

/**
 * Register a document element
 */
export function regSchemaNode(type: SchemaTypeValue) {
    return function <T extends new (config: ISchemaConfig, data: any, parent: AnySchemaNode | undefined) => AnySchemaNode>(constructor: T) {
      schemaNodeMap[type] = constructor
    }
}

/**
 * Gets a ruleschema type by schema type
 */
export function getSchemaNodeType(type: SchemaTypeValue)
{
    return schemaNodeMap[type]
}

/**
 * Gets the schema node with config
 */
export async function getSchemaNode(config: ISchemaConfig, data: any = null) {
    const schemaInfo = await getSchema(config.type)
    if (!schemaInfo) return undefined

    let schemaType = getSchemaNodeType(schemaInfo.type)
    if (!schemaType) return undefined

    // validate data
    if (schemaInfo.type === SchemaType.Array)
    {
        if (isNull(data) || !Array.isArray(data)) data = []
    }
    else if (schemaInfo.type === SchemaType.Struct)
    {
        if (isNull(data) || typeof(data) !== "object") data = {}
    }

    return new schemaType(config, data, undefined)
}

//#endregion