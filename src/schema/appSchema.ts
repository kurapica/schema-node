import { INodeSchema, SchemaLoadState } from "./nodeSchema"
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

    /**
     * The auto-gen node schema
     */
    nodeSchema?: INodeSchema
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

/**
 * The app data query
 */
export interface IAppDataQuery {
    /**
     * The query fields
     */
    fields: string[]

    /**
     * The query detail for array fields
     */
    querys: { [key:string]: IAppDataFieldQuery }
}

/**
 * The app data field query
 */
export interface IAppDataFieldQuery {
    /**
     * The key to be query, like
     * 
     * query: { 'name': 'ann', class: 'math' }
     * query: { 'name': ['ann', 'ben'] }
     */
    query?: { [key:string]: any }

    /**
     * The query count
     */
    count?: number

    /**
     * The query data offset
     */
    offset?: number

    /**
     * Use descend order
     */
    descend?: boolean
}

/**
 * The app data query result
 */
export interface IAppDataResult {
    /**
     * The app data
     */
    results: { [key:string]: any }

    /**
     * The additional field data info
     */
    infos: { [key:string]: IAppDataFieldInfo }
}

/**
 * The app data field query result info
 */
export interface IAppDataFieldInfo {
    /**
     * The key of the query, like
     */
    query?: { [key:string]: any }

    /**
     * The query count
     */
    count?: number

    /**
     * The query offset
     */
    offset?: number

    /**
     * The data total count
     */
    total?: number
    
    /**
     * Use descend order
     */
    descend?: boolean
}