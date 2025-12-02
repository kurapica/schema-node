import { WorkflowStatus } from "../enum/workflowStatus";
import type { IAppDataFieldPushQuery, IAppDataPushResult, IAppDataQuery, IAppDataResult, IBatchQueryAppDataResult } from "../schema/appSchema";
import { SchemaLoadState } from "../schema/nodeSchema";
import { defaultSchemaProvider, getAppCachedSchema, getSchemaApiBaseUrl, type ISchemaProvider, postSchemaApi, registerAppSchema, registerSchema, useSchemaProvider } from "./schemaProvider";
import { debounce, deepClone, isNull } from "./toolset";

let DEBOUNCE_BATCH_QUERY = 50

//#region App data provider

/**
 * The Application field data schema provider
 */
export interface IAppSchemaDataProvider extends ISchemaProvider
{
    /**
     * Batch query the application data from server
     */
    batchQueryAppData(queries: IAppDataQuery[]): Promise<IBatchQueryAppDataResult>

    /**
     * push the application data to server
     */
    pushAppData(app: string, target: string, datas: { [key:string]: IAppDataFieldPushQuery }): Promise<IAppDataPushResult>

    /**
     * Set the source app and target for an app target
     */
    setSourceTarget(app: string, target: string, sourceApp: string, sourceTarget?: string): Promise<boolean>

    /**
     * Get the source app and target for an app target
     */
    getSourceTarget(app: string, target: string, sourceApp: string): Promise<string | undefined>

    
    /**
     * Process the interaction workflow request
     * @param app The application name
     * @param target The application target
     * @param workflow The workflow name
     * @param node The workflow node name
     * @param workflowId The workflow instance id
     * @param data The interaction form data
     */
    interaction(app: string, target: string, workflow: string, node?: string, workflowId?: string, data?: any): Promise<string|undefined>

    /**
     * Gets the p
     * @param app The application
     * @param workflow The workflow
     * @param workflowId The workflow id
     */
    workflowInfo(app: string, workflow: string, workflowId: string): Promise<WorkflowStatus>
}

let schemaProvider: IAppSchemaDataProvider | null = null

export const defaultAppSchemaProvider: IAppSchemaDataProvider = {
    ...defaultSchemaProvider,

    batchQueryAppData: async function (queries: IAppDataQuery[]): Promise<IBatchQueryAppDataResult> {
        return (await postSchemaApi("/batch-query-app-data", {
            queries
        }))
    },

    pushAppData: async function(app: string, target: string, datas: { [key:string]: IAppDataFieldPushQuery }): Promise<IAppDataPushResult>
    {
        return (await postSchemaApi("/push-app-data", {
            app, target, datas
        }))
    },

    setSourceTarget: async function(app: string, target: string, sourceApp: string, sourceTarget?: string): Promise<boolean>
    {
        return (await postSchemaApi("/set-source-target", {
            app, target, sourceApp, sourceTarget
        }))?.result
    },

    getSourceTarget: async function(app: string, target: string, sourceApp: string): Promise<string | undefined>
    {
        return (await postSchemaApi("/get-source-target", {
            app, target, sourceApp
        }))?.target
    },

    interaction: async function(app: string, target: string, workflow: string, node?: string, workflowId?: string, data?: any): Promise<string|undefined>
    {
        return (await postSchemaApi("/interaction", {
            app, target, workflow, node, workflowId, data
        }))?.workflowId
    },

    workflowInfo: async function(app: string, workflow: string, workflowId: string): Promise<WorkflowStatus>
    {
        return (await postSchemaApi("/workflow-info", {
            app, workflow, workflowId
        }))?.status
    }
}

/**
 * Sets the data schema provider
 */
export function useAppDataProvider(provider: IAppSchemaDataProvider, debounce: number = 50): void {
    schemaProvider = provider
    DEBOUNCE_BATCH_QUERY = debounce || 50
    useSchemaProvider(provider)
}

/**
 * Gets the data schema provider
 */
export function getAppDataProvider(): IAppSchemaDataProvider | null {
    return schemaProvider ?? (getSchemaApiBaseUrl() ? defaultAppSchemaProvider : null)
}

//#endregion

//#region Get app data result api

let appDataQueryQueue: { query: IAppDataQuery, resolve: Function, reject: Function }[] = []

/**
 * Process the app data query with auto combine
 */
export function queryAppData(query: IAppDataQuery): Promise<IAppDataResult>
{
    query.app = query.app.toLowerCase()
    const cacheSchema = getAppCachedSchema(query.app)

    // check
    if (isNull(query.target) || query.schemaOnly)
    {
        if (cacheSchema)
            return new Promise((resolve, _) => resolve({
                app: query.app,
                target: query.target,
                schema: !query.noSchema ? cacheSchema : undefined,
                results: {},
                infos: {}
            }))
        
        query.schemaOnly = true
        query.noSchema = undefined
    }

    if (!getAppDataProvider()) throw "No App data provider"
    if (isNull(query.noSchema) && cacheSchema) query.noSchema = true

    // prepare the query
    processAppDataQueryQueue()
    return new Promise((resolve, reject) => appDataQueryQueue.push({ query, resolve, reject }))
}

// process the app data batch query
const processAppDataQueryQueue = debounce(() => {
    const queue = appDataQueryQueue
    appDataQueryQueue = []
    if (!queue.length) return

    //#region combine
    const combineQueries: IAppDataQuery[] = []
    const schemaLoaded = new Set<string>()

    // with target
    queue.filter(q => !isNull(q.query.target)).forEach(q => {
        // schema only load once
        if (!q.query.noSchema)
        {
            if (schemaLoaded.has(q.query.app))
                q.query.noSchema = true
            else
                schemaLoaded.add(q.query.app)
        }

        // combine query
        const exist = combineQueries.find(c => c.app === q.query.app && c.target === q.query.target)
        if (exist)
        {
            // combine fields, 0 means all
            if (exist.fields.length)
            {
                if (!q.query.fields.length)
                {
                    exist.fields = []
                }
                else
                {
                    exist.fields.splice(exist.fields.length, 0, ...q.query.fields.filter(f => !exist.fields.includes(f)))
                }
            }

            // combine querys
            if (exist.querys) {
                if (q.query.querys)
                {
                    for (let k in q.query.querys)
                    {
                        if (!exist.querys[k])
                            exist.querys[k] = deepClone(q.query.querys[k])
                    }
                }
            }
            else if (q.query.querys)
            {
                exist.querys = deepClone(q.query.querys)
            }
            
            // combine others
            if (isNull(exist.take)) exist.take = q.query.take
            if (isNull(exist.descend)) exist.descend = q.query.descend
            exist.schemaOnly = exist.schemaOnly && q.query.schemaOnly
            exist.noSchema = exist.noSchema && q.query.noSchema
        }
        else
        {
            combineQueries.push(deepClone(q.query))
        }
    })

    // without target, schema only
    queue.filter(q => isNull(q.query.target)).forEach(q => {
        const exist = combineQueries.find(c => c.app === q.query.app)
        if (exist) 
            exist.noSchema = false
        else
            combineQueries.push(deepClone(q.query))
    })
    
    //#endregion

    // process
    let provider = getAppDataProvider()
    provider?.batchQueryAppData(combineQueries)
        .then(res => {
            // reg schema
            if (res.schemas?.length) registerSchema(res.schemas, SchemaLoadState.Server)
            registerAppSchema(res.results?.filter(r => r.schema).map(r => r.schema!) || [], SchemaLoadState.Server)

            // resolve
            queue.forEach(q => {
                if (!isNull(q.query.target))
                {
                    const result = res.results.find(r => r.app === q.query.app && r.target === q.query.target)
                    if (result)
                    {
                        q.resolve(result)
                    }
                    else
                    {
                        q.reject(`Unable to load app data ${q.query.app} for ${q.query.target}`)
                    }
                }
                else
                {
                    const result = res.results.find(r => r.app === q.query.app && r.schema)
                    if (result)
                    {
                        q.resolve({
                            app: q.query.app,
                            target: q.query.target,
                            schema: result.schema,
                            results: {},
                            infos: {}
                        })
                    }
                    else
                    {
                        q.reject(`Unable to get the app schema for ${q.query.app}`)
                    }
                }
            })
        })
        .catch(ex => queue.forEach(q => q.reject(ex)))
}, DEBOUNCE_BATCH_QUERY)

//#endregion

//#region Import app data api

/**
 * Push the app data
 */
export async function pushAppData(app: string, target: string, datas: { [key:string]: IAppDataFieldPushQuery }): Promise<IAppDataPushResult>
{
    let provider = getAppDataProvider()
    if (isNull(target)) throw "Push target must be provided"
    if (!provider) throw "No App data provider"
    return await provider.pushAppData(app, target, datas)
}

/**
 * Active interaction request
 */
export async function interactionWorkflow(app: string, target: string, workflow: string, node?: string, workflowId?: string, data?: any): Promise<string|undefined>
{
    let provider = getAppDataProvider()
    if (!provider) throw "No App data provider"
    return await provider.interaction(app, target, workflow, node, workflowId, data)
}

//#endregion
