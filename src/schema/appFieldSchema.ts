import { DataCombineTypeValue } from "../enum/dataCombineType"
import { ILocaleString } from "../utils/locale"
import { IDataCombine } from "./arraySchema"

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
}