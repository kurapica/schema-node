import { Rule } from "./rule"

export class ScalarRule extends Rule
{
    /**
     * The scalar white list
     */
    whiteList?: number[] | string[] | { value: any, label: string }[]

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
    useOriginForUplimit?: boolean
}