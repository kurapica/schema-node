import { SchemaType } from "../enum/schemaType"
import { ISchemaInfo } from "../schema/schemaInfo"
import { getSchema } from "../schema/schemaProvider"
import { DataChangeWatcher } from "../utils/dataChangeWatcher"
import { deepClone, isEqual, isNull } from "../utils/toolset"
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
    get schemaInfo(): ISchemaInfo { return this._typeinfo }

    /**
     * The data of the node.
     */
    get data(): any { return this._data }
    set data(value: any)
    {
        this._data = value
        this.validate()
        this._watchter.notify(value)
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
    
    /**
     * initialize the node
     */
    abstract initialize(): Promise<void>

    //#endregion

    //#region Methods

    /**
     * Reset the change state of the node and children.
     */
    resetChanges(): void { 
        this._original = deepClone(this.data)
    }

    /**
     * Dispose the node and children.
     */
    dispose(): void {
        this._watchter.dispose()
    }

    /**
     * Subscribe a data change handler
     */
    subscribe(func: Function): Function {
        return this._watchter.addWatcher(func)
    }

    /**
     * Notify the data, error, valid may changes
     */
    notify(): void {
        return this._watchter.notify(this._data)
    }

    //#endregion

    //#region Field
    
    protected _watchter: DataChangeWatcher = new DataChangeWatcher()
    protected _original: any
    protected _parent: SchemaNode<ISchemaNodeConfig> | undefined
    protected _config: T
    protected _error: string | undefined
    protected _valid: boolean = true
    protected _data: any
    protected _rule: ISchemaNodeRule = {}
    protected _ruleSchema: ISchemaNodeRuleSchema = { type: '' }
    protected _typeinfo: ISchemaInfo = { name: '', type: SchemaType.Namespace }

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
        getSchema(config.type).then(r => this._typeinfo = r! )
        useRuleSchema(this, parent).then(r => {
            this._ruleSchema = r

            // Re do the active
            if (this._rule._actived)
            {
                this._rule._actived = false
                activeRuleSchema(this, true)
            }
        })
    }
}