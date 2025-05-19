import { Rule } from "./rule"

export class EnumRule extends Rule
{
    /**
     * The enum root
     */
    root?: string | number

    /**
     * The enum cascade limit
     */
    cascade?: number

    /**
     * The enum black list
     */
    blackList?: number[] | string[]

    /**
     * The enum white list
     */
    whiteList?: number[] | string[]

    /**
     * The enum can choose any cascade level value
     */
    anyLevel?: boolean

    /**
     * No combine value for flag enum
     */
    singleFlag?: boolean
}