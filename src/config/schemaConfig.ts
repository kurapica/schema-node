import { LocaleString } from "../utils/locale"

/**
 * The config of the schema node.
 */
export interface ISchemaConfig
{
    /**
     * The type name of the node.
     */
    type: string

    /**
     * The label of the node.
     */
    display?: string | LocaleString

    /**
     * The description of the node.
     */
    desc?: string | LocaleString

    /**
     * The node data is readonly.
     */
    readonly?: boolean

    /**
     * The node data is immutable, unchangable if inited.
     */
    immutable?: boolean

    /**
     * The node data is required.
     */
    require?: boolean

    /**
     * The node should be invisible.
     */
    invisible?: boolean

    /**
     * The node should be display only, won't be submitted.
     */
    displayOnly?: boolean

    /**
     * The unit of the node data like 'm/s', '%', '°C'.
     */
    unit?: string

    /**
     * The default value of the node.
     */
    default?: any

    /**
     * The validation provided by parent
     * return error message if failed
     */
    validation?: Function
}