import { SchemaLoadState } from "./nodeSchema"
import { IStructFieldRelation } from "./structSchema"

/**
 * The application schema
 */
export interface IAppSchema
{
    /**
     * The application name
     */
    name: string

    /**
     * The display name
     */
    display?: string

    /**
     * The description
     */
    desc?: string

    /**
     * Has sub applications, app can only have sub apps or fields
     */
    hasApps?: boolean

    /**
     * Has fields, app can only have sub apps or fields
     */
    hasFields?: boolean

    /**
     * Sub application list
     */
    apps?: IAppSchema[]

    /**
     * The application fields
     */
    fields?: IAppFieldSchema[]
    
    /**
     * The realtions between the fields
     */
    relations?: IStructFieldRelation[]

    /**
     * The schema info is loaded from server
     */
    loadState?: SchemaLoadState    
}

/**
 * The application field scehma
 */
export interface IAppFieldSchema
{
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
    display?: string

    /**
     * The description
     */
    desc?: string

    /**
     * The source application
     */
    sourceApp?: string

    /**
     * The source field
     */
    sourceField?: string

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
}