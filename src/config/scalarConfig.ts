import { ILocaleString } from "../utils/locale"
import { type ISchemaConfig } from "./schemaConfig"

export interface IEntry {
    value: any,
    label: ILocaleString,
    children?: IEntry[]
}

export interface IScalarConfig extends ISchemaConfig
{
    /**
     * The entries for enum-like scalar values.
     */
    entries?: IEntry[]

    /**
     * The white list
    */
    whiteList?: number[] | string[] | IEntry[]

    /**
     * The root value.
     */
    root?: string
    
    /**
     * The black list
     */
    blackList?: string[] | number[]

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
    useOriginForUpLimit?: boolean
}