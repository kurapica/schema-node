import { SchemaType } from '../enum/schemaType'
import { IEnumSchemaNodeConfig } from '../nodeconfig/enumSchemaNodeConfig'
import SchemaNode from '../nodeconfig/schemaNode'
import { ISchemaNodeConfig } from '../nodeconfig/schemaNodeConfig'
import { _LS } from '../utils/locale'

/**
 * The scalar schema data node
 */
export default class EnumSchemaNode extends SchemaNode<IEnumSchemaNodeConfig> {
    //#region Implementation

    get schemaType(): SchemaType { return SchemaType.Enum }

    /**
     * Validate the value
     */
    validate(): void {
    }

    //#endregion

    //#region Properties


    //#endregion

    //#region Fields


    //#endregion

    /**
     * Construct a scalar schema node.
     * @param parent the parent node of the node.
     * @param config the config of the node.
     */
    constructor(parent: SchemaNode<ISchemaNodeConfig>, config: ISchemaNodeConfig, data: any) {
        super(parent, config, data)
    }
}