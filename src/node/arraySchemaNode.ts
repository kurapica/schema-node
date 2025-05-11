import { SchemaType } from "../enum/schemaType";
import { IScalarSchemaNodeConfig } from "../nodeconfig/scalarSchemaNodeConfig";
import ISchemaNode from "../nodeconfig/schemaNode";
import { ISchemaNodeConfig } from "../nodeconfig/schemaNodeConfig";
import { ISchemaNodeRule, ISchemaNodeRuleSchema } from "../nodeconfig/schemaNodeRule";
import { DataChangeWatcher } from "../utils/dataChangeWatcher";
import { isEqual, isNull } from "../utils/toolset";

export class ArraySchemaNode implements ISchemaNode {
    //#region Implementation

    // properties
    get data(): any { return this._data }
    get schemaType(): SchemaType { return SchemaType.Array }
    get config(): IScalarSchemaNodeConfig { return this._config }
    get changed(): boolean { return isEqual(this._original, this.data) }
    get valid(): boolean { return this._valid }
    get error(): string | undefined { return this._error }
    get parent(): ISchemaNode | undefined { return this._parent }
    get rule(): ISchemaNodeRule { return this._rule }
    get ruleSchema(): ISchemaNodeRuleSchema { return this._ruleSchema }

    /**
     * Set the data of the node.
     */
    set data(value: any)
    {
        this._data = value
        this.validate()
        this._watchter.notify(value)
    }

    // Methods
    resetChanges(): void { this._original = this.data}

    validate(): void {
        throw new Error('Method not implemented.');
    }

    dispose(): void {
        this._watchter.dispose()
    }

    subscribe(func: Function): Function {
        return this._watchter.addWatcher(func)
    }

    //#endregion

    //#region Fields

    private _watchter: DataChangeWatcher = new DataChangeWatcher()
    private _original: any
    private _parent: ISchemaNode | undefined
    private _config: IScalarSchemaNodeConfig
    private _error: string | undefined
    private _valid: boolean = true
    private _data: any
    private _rule: ISchemaNodeRule = {}
    private _ruleSchema: ISchemaNodeRuleSchema = { type: '' }

    //#endregion

    /**
     * Construct a scalar schema node.
     * @param parent the parent node of the node.
     * @param config the config of the node.
     */
    constructor(parent: ISchemaNode, config: ISchemaNodeConfig, data: any)
    {
        this._parent = parent
        this._config = config as IScalarSchemaNodeConfig
        this._data = isNull(data) ? config.default : data
    }
}