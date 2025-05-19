import { ISchemaNodeConfig } from "./schemaConfig"

export interface IScalarSchemaNodeConfig extends ISchemaNodeConfig
{
    /**
     * The enum white list
    */
    enumWhiteList?: string[]

    /**
     * The enum white list only used for suggest.
     */
    asSuggest?: boolean

    /**
     * When calculating the up limit, use the original value.
     */
    useOriginForUplimit?: boolean

    /**
     * The low limit of the scalar value.
     */
    lowLimit?: any

    /**
     * The up limit of the scalar value.
     */
    upLimit?: any

}