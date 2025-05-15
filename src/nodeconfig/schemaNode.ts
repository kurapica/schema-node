import { SchemaType } from "../enum/schemaType"
import { ISchemaInfo } from "../schema/schemaInfo"
import { getCachedSchema } from "../schema/schemaProvider"
import { DataChangeWatcher } from "../utils/dataChangeWatcher"
import { deepClone, isEqual, isNull, debounce } from "../utils/toolset"
import { ISchemaNodeConfig } from "./schemaNodeConfig"
import { activeRuleSchema, ISchemaNodeRule, ISchemaNodeRuleSchema, useRuleSchema } from "./schemaNodeRule"

/**
 * The abstract schema node.
 */
export default abstract class SchemaNode<T extends ISchemaNodeConfig> 
{
    //#region Properties

    /**
     * The schema type of the node.
     */
    get schemaType(): SchemaType { return SchemaType.Namespace }

    /**
     * The config of the node.
     */
    get config(): T { return this._config }

    /**
     * The schema info.
     */
    get schemaInfo(): ISchemaInfo { return this._schemaInfo }

    /**
     * The data of the node.
     */
    get data(): any { return this._data }
    set data(value: any)
    {
        this._data = value
        this.validate()
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
    get parent(): SchemaNode<ISchemaNodeConfig> | undefined { return this._parent }

    /**
     * The schema node rule
     */
    get rule(): ISchemaNodeRule { return this._rule }

    /**
     * The schema node rule schema
     */
    get ruleSchema(): ISchemaNodeRuleSchema { return this._ruleSchema }
    
    //#endregion

    //#region Abstract methods

    /**
     * Re-calc the valid state of the node and children.
     */
    abstract validate(): void
    
    //#endregion

    //#region Methods

    /**
     * active the rule schema for the node
     */
    activeRule(deep?: boolean, init?: boolean): void { return activeRuleSchema(this, deep, init) }

    /**
     * Reset the change state of the node and children.
     */
    resetChanges(): void { this._original = deepClone(this.data) }

    /**
     * Subscribe a data change handler
     */
    subscribe(func: Function): Function { return this._watchter.addWatcher(func) }

    /**
     * Notify the data, error, valid may changes
     */
    notify = debounce(() => this._watchter.notify(this), 50)

    /**
     * Dispose the node and children.
     */
    dispose(): void { return this._watchter.dispose() }

    //#endregion

    //#region Field
    
    protected _watchter: DataChangeWatcher = new DataChangeWatcher()
    protected _schemaInfo: ISchemaInfo = { name: '', type: SchemaType.Namespace }
    protected _parent: SchemaNode<ISchemaNodeConfig> | undefined
    protected _rule: ISchemaNodeRule = {}
    protected _ruleSchema: ISchemaNodeRuleSchema = { type: '' }
    protected _config: T
    protected _error: string | undefined
    protected _valid: boolean = true
    protected _original: any
    protected _data: any

    //#endregion

    /**
     * Construct a scalar schema node.
     * @param parent the parent node of the node.
     * @param config the config of the node.
     */
    constructor(parent: SchemaNode<ISchemaNodeConfig>, config: ISchemaNodeConfig, data: any)
    {
        this._parent = parent
        this._config = config as T
        this._data = isNull(data) ? deepClone(config.default) : data
        this._schemaInfo = getCachedSchema(config.type)!
        this._ruleSchema = useRuleSchema(this, parent)
        
        // popup
        if (parent) this.subscribe(() => parent.notify())
    }
}