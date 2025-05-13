import { SchemaType } from '../enum/schemaType'
import { IArraySchemaNodeConfig } from '../nodeconfig/arraySchemaNodeConfig'
import SchemaNode from '../nodeconfig/schemaNode'
import { ISchemaNodeConfig } from '../nodeconfig/schemaNodeConfig'
import { ISchemaInfo } from '../schema/schemaInfo'
import { getSchema } from '../schema/schemaProvider'
import { _L, _LS } from '../utils/locale'

/**
 * The scalar schema data node
 */
export class ScalarSchemaNode extends SchemaNode<IArraySchemaNodeConfig> {
    //#region Implementation

    get schemaType(): SchemaType { return SchemaType.Array }

    /**
     * Validate the value
     */
    validate(): void {
    }

    //#endregion

    //#region Properties    

    /**
     * The current page no
     */
    page?: number

    /**
     * The page count
     */
    pageCount?: number

    /**
     * The data total count
     */
    total?: number

    /**
     * Use descend order
     */
    descend?: boolean

    //#endregion

    //#region Fields

    private _eleSchemaInfo: ISchemaInfo = { name: '', type: SchemaType.Namespace }

    //#endregion

    /**
     * Construct a scalar schema node.
     * @param parent the parent node of the node.
     * @param config the config of the node.
     */
    constructor(parent: SchemaNode<ISchemaNodeConfig>, config: ISchemaNodeConfig, data: any) {
        super(parent, config, data)
        getSchema(config.type).then(r => {
            this._typeinfo = r!

            getSchema(r!.array!.element).then(s => {
                this._eleSchemaInfo = s!
            })
        })
    }
}