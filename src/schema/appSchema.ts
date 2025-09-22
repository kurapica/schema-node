import { DataCombineTypeValue } from "../enum/dataCombineType"
import { ILocaleString } from "../utils/locale"
import { IDataCombine } from "./arraySchema"
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
    display?: ILocaleString

    /**
     * The description
     */
    desc?: ILocaleString

    /**
     * No app target, be used standalone
     */
    standalone?: boolean

    /**
     * The main app used for distribution lock
     */
    main?: string

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
     * The schema info is loaded from server or else
     */
    loadState?: SchemaLoadState

    /**
     * The types related to the application, loaded from server
     */
    types?: INodeSchema[]

    /**
     * The auto-gen node schema in frontend
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
     * The combine rule if field type is scalar or enum
     */
    combine?: DataCombineTypeValue

    /**
     * The combine rule if field type is struct or struct-array
     */
    combines?: IDataCombine[]
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
     * The query detail for array fields
     */
    querys?: { [key:string]: IAppDataFieldQuery }

    /**
     * The default query count
     */
    count?: number

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

/**
 * The application field data push query
 */
export interface IAppDataPushQuery {
    /**
     * The application name
     */
    app: string

    /**
     * The application target
     */
    target: string

    /**
     * The push data field
     */
    datas: { [key:string]: IAppDataFieldPushQuery }

    /**
     * Whether a full data push, incr-upate field will ignore this
     */
    full?: boolean
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
     * The application name
     */
    app: string

    /**
     * The application target
     */
    target: string

    /**
     * The push result
     */
    result: boolean

    /**
     * The error result
     */
    error?: any
}