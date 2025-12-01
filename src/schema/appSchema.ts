import { type ILocaleString } from "../utils/locale"
import { type IAppFieldSchema } from "./appFieldSchema"
import { type IAppWorkflowSchema } from "./appWorkflowSchema"
import { type INodeSchema, SchemaLoadState } from "./nodeSchema"
import { type IPolicyItem } from "./policySchema"
import { type IStructFieldRelation } from "./structSchema"

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
    display?: ILocaleString

    /**
     * The description
     */
    desc?: ILocaleString

    /**
     * The authorization policy type
     */
    auth?: string

    /**
     * The data authorization policy type
     */
    auths?: IPolicyItem[]

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
     * The application workflows
     */
    workflows?: IAppWorkflowSchema[]

    /**
     * The types related to the application, loaded from server
     */
    nodeSchemas?: INodeSchema[]

    /**
     * The auto-gen node schema in frontend
     */
    nodeSchema?: INodeSchema
    
    /**
     * The schema info is loaded from server or else
     */
    loadState?: SchemaLoadState

    /**
     * Already loaded from the server
     */
    loaded?: boolean
}

/**
 * The app data query
 */
export interface IAppDataQuery {
    /**
     * The application name
     */
    app: string

    /**
     * The application target
     */
    target: string

    /**
     * The query fields, empty means query all
     */
    fields: string[]

    /**
     * Only query input fields
     */
    onlyInput?: boolean

    /**
     * Only query output fields
     */
    onlyOutput?: boolean

    /**
     * The query detail for array fields
     */
    querys?: { [key:string]: IAppDataFieldQuery }

    /**
     * The default query count
     */
    take?: number

    /**
     * Use descend order as default
     */
    descend?: boolean

    /**
     * Only query the application schema
     */
    schemaOnly?: boolean

    /**
     * Don't include the type schema
     */
    noSchema?: boolean
}

/**
 * The app data field query
 */
export interface IAppDataFieldQuery {
    /**
     * The key to be query, like
     * 
     * filter: { 'name': 'ann', class: 'math' }
     * filter: { 'name': ['ann', 'ben'] }
     */
    filter?: { [key:string]: any }

    /**
     * The order by
     */
    orderBy?: IAppDataQueryOrder[]

    /**
     * The query count
     */
    take?: number

    /**
     * The query data offset
     */
    skip?: number

    /**
     * Use descend order
     */
    descend?: boolean
}

export interface IBatchQueryAppDataResult {
    /**
     * The query results
     */
    results: IAppDataResult[]

    /**
     * The node schemas required
     */
    schemas?: INodeSchema[]
}

/**
 * The app data query result
 */
export interface IAppDataResult {
    /**
     * The application name
     */
    app: string

    /**
     * The application target
     */
    target: string

    /**
     * The application schema
     */
    schema?: IAppSchema

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
    filter?: { [key:string]: any }

    /**
     * The order by
     */
    orderBy?: IAppDataQueryOrder[]

    /**
     * The query count
     */
    take?: number

    /**
     * The query offset
     */
    skip?: number

    /**
     * The data total count
     */
    total?: number
    
    /**
     * Use descend order
     */
    descend?: boolean
}

export interface IAppDataFieldPushQuery {
    /**
     * The update data, include new & update
     */
    data?: any

    /**
     * The delete data from array node
     */
    deletes?: any[]
}

/**
 * The data push result
 */
export interface IAppDataPushResult {
    /**
     * The push result
     */
    result: boolean

    /**
     * The error result
     */
    error?: any
}

/**
 * The query order
 */
export interface IAppDataQueryOrder {
    field: string
    desc: boolean
}