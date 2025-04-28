import { SchemaType } from '../enum/SchemaType';
import ISchemaNode from '../interface/ISchemaNode';
import { IScalarSchemaNodeConfig, ISchemaNodeConfig } from '../interface/ISchemaNodeConfig';
import { DataChangeWatcher } from '../utils/DataChangeWatcher';
import { isNull } from '../utils/Toolset';

export class ScalarSchemaNode implements ISchemaNode
{
    //#region Implementation

    // properties
    get data(): any { return this._data }
    get schemaType(): SchemaType { return SchemaType.Scalar }
    get config(): IScalarSchemaNodeConfig { return this._config }
    get changed(): boolean { return this.original !== this.data }
    get valid(): boolean { return this._valid }
    get error(): string | undefined { return this._error }
    get parent(): ISchemaNode | undefined { return this._parent }

    /**
     * Set the data of the node.
     */
    set data(value: any)
    {
        this._data = value
        this.validate()
        this.watchter.notify(value)
    }

    // Methods
    resetChanges(): void { this.original = this.data}
    validate(): void {
        throw new Error('Method not implemented.');
    }
    dispose(): void {
        this.watchter.dispose()
    }
    watch(func: Function): Function {
        return this.watchter.addWatcher(func)
    }

    //#endregion

    //#region Fields

    private watchter: DataChangeWatcher = new DataChangeWatcher()
    private original: any
    private _parent: ISchemaNode | undefined
    private _config: IScalarSchemaNodeConfig
    private _error: string | undefined
    private _valid: boolean = true
    private _data: any

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