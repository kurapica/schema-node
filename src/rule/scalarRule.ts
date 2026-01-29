import { IEntry } from "../config/scalarConfig"
import { Rule } from "./rule"

export class ScalarRule extends Rule
{
    /**
     * The entries for enum-like scalar values.
     */
    entries?: IEntry[]

    /**
     * The scalar white list
     */
    whiteList?: number[] | string[] | IEntry[]

    /**
     * The black list
     */
    blackList?: string[] | number[]

    /**
     * The root
     */
    root?: any
    
    /**
     * The low limit
     */
    lowLimit?: any

    /**
     * The up limit
     */
    upLimit?: any

    /**
     * The whilte list is only a suggest
     */
    asSuggest?: boolean

    /**
     * Calc the origin value for up limit
     */
    useOriginForUpLimit?: boolean
}