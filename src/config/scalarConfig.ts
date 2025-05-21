import { ISchemaConfig } from "./schemaConfig"

export interface IScalarConfig extends ISchemaConfig
{
    /**
     * The white list
    */
    whiteList?: string[]

    /**
     * The low limit of the scalar value.
     */
    lowLimit?: any

    /**
     * The up limit of the scalar value.
     */
    upLimit?: any

    /**
     * The enum white list only used for suggest.
     */
    asSuggest?: boolean

    /**
     * When calculating the up limit, use the original value.
     */
    useOriginForUplimit?: boolean

}