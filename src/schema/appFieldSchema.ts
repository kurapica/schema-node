import { type DataCombineTypeValue } from "../enum/dataCombineType"
import { type ILocaleString } from "../utils/locale"
import { type IDataCombine } from "./arraySchema"
import { type IPolicyItem } from "./policySchema"

/**
 * The application field scehma
 */
export interface IAppFieldSchema
{
    /**
     * The application name
     */
    app: string

    /**
     * The field name
     */
    name: string

    /**
     * The field type
     */
    type: string

    /**
     * The display name
     */
    display?: ILocaleString

    /**
     * The description
     */
    desc?: ILocaleString

    /**
     * The source application
     */
    sourceApp?: string

    /**
     * The source field
     */
    sourceField?: string

    /**
     * Track the push data to source field
     */
    trackPush?: boolean

    /**
     * The function used to generate data
     */
    func?: string

    /**
     * The argument fields to provide input data
     */
    args?: string[]

    /**
     * The field is using increase update, not full-data update
     */
    incrUpdate?: boolean

    /**
     * The field is front-end only, no need store data
     */
    frontend?: boolean

    /**
     * The field is disabled
     */
    disable?: boolean

    /**
     * The field is readonly
     */
    readonly?: boolean

    /**
     * The combine rule if field type is scalar or enum
     */
    combine?: DataCombineTypeValue

    /**
     * The combine rule if field type is struct or struct-array
     */
    combines?: IDataCombine[]

    /**
     * The data authorization policies for the field, normally the row access policies
     */
    auths: IPolicyItem[]

    /**
     * Row filter policies
     */
    rowAuths?: IRowPolicyItem[]

    /**
     * Column access policies
     */
    colAuths?: IColPolicyItem[]

    /**
     * The field is reference load, load data on demand
     */
    refLoad?: boolean
}

/**
 * The row policy item
 */
export interface IRowPolicyItem
{
    /**
     * The policy evaluatorm, if true will use the filter
     */
    evaluator: string

    /**
     * The row filter function
     */
    filter?: string
}

/**
 * The column policy item
 */
export interface IColPolicyItem
{    
    /**
     * The struct field name
     */
    name: string

    /**
     * The column access evaluators
     */
    evaluators: string[]
}