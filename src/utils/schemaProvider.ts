import { EnumValueType } from "../enum/enumValueType"
import { ExpressionType, ExpressionTypeValue } from "../enum/expressionType"
import { SchemaType } from "../enum/schemaType"
import { isNull, useQueueQuery } from "./toolset"
import { IEnumValueAccess, IEnumValueInfo, prepareEnumAccesses, prepareEnumValueInfos } from "../schema/enumSchema"
import { IFunctionSchema } from "../schema/functionSchema"
import { INodeSchema, PrepareServerSchemas, SchemaLoadState } from "../schema/nodeSchema"
import { IStructFieldConfig, IStructScalarFieldConfig } from "../schema/structSchema"
import { DataChangeWatcher } from "./dataChangeWatcher"
import { IAppSchema } from "../schema/appSchema"
import { _L, _LS, combineLocaleString, ILocaleString } from "./locale"
import axios from "axios"

export const NS_SYSTEM = "system"

export const REGEX_GENERIC_TYPE = /^T\d*$/
export const REGEX_GENERIC_IMPLEMENT = /^([\w\.]+)<(.+)>$/

export const NS_SYSTEM_ARRAY = "system.array"
export const NS_SYSTEM_LIST = "system.list"
export const NS_SYSTEM_STRUCT = "system.struct"
export const NS_SYSTEM_JSON = "system.json"
export const NS_SYSTEM_BOOL = "system.bool"
export const NS_SYSTEM_DATE = "system.date"
export const NS_SYSTEM_NUMBER = "system.number"
export const NS_SYSTEM_DOUBLE = "system.double"
export const NS_SYSTEM_FLOAT = "system.float"
export const NS_SYSTEM_PERCENT = "system.percent"
export const NS_SYSTEM_FULLDATE = "system.fulldate"
export const NS_SYSTEM_INT = "system.int"
export const NS_SYSTEM_STRING = "system.string"
export const NS_SYSTEM_YEAR = "system.year"
export const NS_SYSTEM_GUID = "system.guid"
export const NS_SYSTEM_YEARMONTH = "system.yearmonth"
export const NS_SYSTEM_RANGEDATE = "system.rangedate"
export const NS_SYSTEM_RANGEFULLDATE = "system.rangefulldate"
export const NS_SYSTEM_RANGEMONTH = "system.rangemonth"
export const NS_SYSTEM_RANGEYEAR = "system.rangeyear"
export const NS_SYSTEM_STRINGS = "system.strings"
export const NS_SYSTEM_NUMBERS = "system.numbers"
export const NS_SYSTEM_INTS = "system.ints"

export const NS_SYSTEM_LANGUAGE = "system.language"
export const NS_SYSTEM_LOCALE_STRING = "system.localestring"
export const NS_SYSTEM_LOCALE_TRAN = "system.localetran"
export const NS_SYSTEM_LOCALE_STRINGS = "system.localestrings"
export const NS_SYSTEM_LOCALE_TRANS = "system.localetrans"
export const NS_SYSTEM_ENTRY = "system.entry"
export const NS_SYSTEM_ENTRIES = "system.entrys"

export const NS_SYSTEM_SCHEMA = "system.schema"
export const NS_SYSTEM_SCHEMA_NS = "system.schema.namespace"

export const NS_SYSTEM_WORKFLOW = "system.workflow"
export const NS_SYSTEM_WORKFLOW_NODE = "system.workflow.node"

//#region Schema Provider

/**
 * The schema information provider interface
 *
 * The schema can be provied by json file or by server.
 * If schema all provied by json file, the provider is not needed.
 *
 * But for enums like administrative divisions code of China, it
 * could be more then 700,000, it's not possible to load all in the json file.
 *
 * For that case, the server should provide apis to fetch the sub list of enum values,
 * and an api to fetch the access list of enum values for displaying.
 *
 * Also some function schema that provided data fetching should be provided
 * by a server.
 */
export interface ISchemaProvider {
    /**
     * Get the schema api protocol information
     */
    protocol(): Promise<ISchemaApiProtocolMeta | undefined>

    /**
     * Load the schema information
     * @param names The names of the schema
     * @returns The schema informations
     */
    loadSchema(names: string[]): Promise<INodeSchema[]>

    /**
     * Load the application schema information
     * @param app the name of the application
     * @return the application schema
     */
    loadAppSchema(app: string, includeTypes?: boolean): Promise<IAppSchema | undefined>

    /**
     * Load the enum value sub list from the server
     * @param schemaName The name of the enum schema
     * @param value The root enum value if provided
     * @param fullList Whether load the full list of enum values
     * @return the enum sub list
     */
    loadEnumSubList(schemaName: string, value?: any, fullList?: boolean): Promise<IEnumValueInfo[]>

    /**
     * Load enum enum value access list from the server
     * @param schemaName the name of the enum schema
     * @param value the enum value to be queried
     * @param noSubList no sub list should be loaded
     * @param withSubList with the value's sub list if existed
     * @return the enum access list
     */
    loadEnumAccessList(schemaName: string, value: any, noSubList?: boolean, withSubList?: boolean): Promise<IEnumValueAccess[]>

    /**
     * Call the function schema from the server with the arguments and type, gets the result
     * @param schemaName the name of the function schema
     * @param args the arguments of the function
     * @param generic the generic type of the function
     * @param target the application target
     * @returns the result
     */
    callFunction(schemaName: string, args: any[], generic?: string | string[], target?: string): Promise<any>
}

let schemaApiBaseUrl: string | undefined = undefined
let schemaProvider: ISchemaProvider | null = null

// default schema provider
export const defaultSchemaProvider: ISchemaProvider = {
    protocol: async (): Promise<ISchemaApiProtocolMeta | undefined> => {
        return (await postSchemaApi("/protocol", {}, true)) || undefined
    },
    
    loadSchema: async (names: string[]): Promise<INodeSchema[]> => {
        return (await postSchemaApi("/load-schema", {
            names: names
        }))?.schemas || []
    },

    loadAppSchema: async (app: string, includeTypes?: boolean): Promise<IAppSchema | undefined> => {
        return (await postSchemaApi("/load-app-schema", {
            name: app,
            includeTypes
        }))?.schema
    },

    loadEnumSubList: async (name: string, value?: any, fullList?: boolean): Promise<IEnumValueInfo[]> => {
        return (await postSchemaApi("/load-enum-sub-list", {
            name, value, fullList
        }))?.values
    },

    loadEnumAccessList: async (name: string, value: any, noSubList?: boolean, withSubList?: boolean): Promise<IEnumValueAccess[]> => {
        return (await postSchemaApi("/load-enum-access-list", {
            name, value, noSubList, withSubList
        }))?.access
    },

    callFunction: async (name: string, args: any[], generic?: string | string[], target?: string): Promise<any> => {
        return (await postSchemaApi("/call-function", {
            name, args, generic, target
        }))?.result
    },
}

/**
 * Sets the schema provider
 */
export function useSchemaProvider(provider: ISchemaProvider): void {
    schemaProvider = provider
}

/**
 * Gets the schema provider
 */
export function getSchemaProvider(): ISchemaProvider | null {
    return schemaProvider ?? (schemaApiBaseUrl ? defaultSchemaProvider : null)
}

//#endregion

//#region Application Schema

const appSchemaCache: { [key: string]: IAppSchema } = {}
const rootAppSchema: IAppSchema = { name: "", apps: [] }
const appSchemaChangeWatcher = new DataChangeWatcher()
const appStructSchemaRoot = "__app_struct"

/**
 * Register the application schemas
 * @param schemas The application schemas
 */
export function registerAppSchema(schemas: IAppSchema[], loadState: SchemaLoadState = SchemaLoadState.Custom): void {
    for (const schema of schemas) {
        const name = schema.name.toLowerCase()
        schema.loadState = (schema.loadState || 0) | loadState

        // for root application without name
        if (isNull(name)) {
            registerAppSchema(schema.apps || [], loadState)
            continue
        }

        const exist = appSchemaCache[name]

        // combine
        if (exist)
        {
            exist.loadState = (exist.loadState || 0) | (schema.loadState) | loadState

            updateAppSchemaRefs(schema, false)

            exist.display = combineLocaleString(exist.display, schema.display)
            exist.desc = combineLocaleString(exist.desc, schema.desc)
            exist.hasApps = schema.hasApps
            exist.hasFields = schema.hasFields
            exist.relations = schema.relations
            exist.fields = schema.fields?.length ? schema.fields : exist.fields
            exist.workflows = schema.workflows?.length ? schema.workflows : exist.workflows
            exist.nodeSchema = undefined

            if (schema.hasFields || schema.fields?.length)
            {
                delete exist.apps
                schema.fields?.forEach(f => f.app = exist.name)
            }
            else if(schema.apps?.length)
                registerAppSchema(schema.apps, loadState)

            updateAppSchemaRefs(schema, true)

            // register type schema
            if (schema.nodeSchemas) registerSchema(schema.nodeSchemas, loadState)
            continue
        }
        
        // root namespace
        const paths = name.split(".").filter(n => !isNull(n))
        let root: IAppSchema = rootAppSchema
        for (let i = 0; i < paths.length - 1; i++)
        {
            const p = paths.slice(0, i + 1).join(".")
            let app = appSchemaCache[p]
            if (!app)
            {
                app = {
                    name: p,
                    apps: []
                }
                appSchemaCache[p] = app
                root.apps = root.apps || []
                root.apps.push(app)
            }
            root = app
        }
        
        schema.nodeSchema = undefined
        appSchemaCache[name] = schema
        root.apps ||= []
        root.apps.push(schema)

        if (schema.hasFields || schema.fields?.length)
        {
            delete schema.apps
            schema.fields?.forEach(f => f.app = schema.name)
            updateAppSchemaRefs(schema, true)
        }
        else if(schema.apps?.length)
        {
            const apps = schema.apps
            schema.apps = []
            registerAppSchema(apps, loadState)
        }

        // register type schema
        if (schema.nodeSchemas) {
            registerSchema(schema.nodeSchemas, loadState)
            schema.nodeSchemas = undefined
        }
    }
    appSchemaChangeWatcher.notify(schemas.map(s => s.name))
}

/**
 * Remove an application schema
 * @param name The application name
 */
export function removeAppSchema(name: string): boolean {
    name = name.toLowerCase()
    const schema = appSchemaCache[name]
    if (!schema) return true
    if (schema === rootSchema) return false
    updateAppSchemaRefs(schema, false)
    
    const paths = name.split(".")
    const pname = paths.slice(0, paths.length - 1).join(".")
    const parent = pname ? appSchemaCache[pname] : rootAppSchema
    if (parent)
    {
        const index = parent.apps?.findIndex(s => s.name === schema.name)
        if (!isNull(index) && index >= 0)
        {
            parent.apps.splice(index, 1)
        }
    }
    delete appSchemaCache[name]
    appSchemaChangeWatcher.notify([name])
    return true
}

/**
 * Subscribe application schema change
 */
export function subscribeAppSchemaChange(handler: Function)
{
    return appSchemaChangeWatcher.addWatcher(handler)
}

/**
 * Gets the schema information
 * @param schemaName The name of the schema
 * @param generic the generic types
 * @returns The schema information
 */
export async function getAppSchema(name: string): Promise<IAppSchema | undefined> {
    // all schema names should be case insensitive
    name = name.toLowerCase()

    let schema = !name ? rootAppSchema : appSchemaCache[name]
    let provider = getSchemaProvider()
    if (schema?.loaded || !provider) return schema
    if (schema) schema.loaded = true

    // load schema from provider
    schema = await provider.loadAppSchema(name, true)
    if (schema) {
        schema.loaded = true
        if (schema.nodeSchemas) PrepareServerSchemas(schema.nodeSchemas)
        registerAppSchema([schema], SchemaLoadState.Server)
    }
    return !name ? rootAppSchema : appSchemaCache[name]
}

/**
 * Gets the cached schema info, when the schema node created, their info and all other required must be cached, avoid async codes
 * @param name The schema name
 * @returns The schema info
 */
export function getAppCachedSchema(name: string): IAppSchema | undefined {
    name = name.toLowerCase()
    return !name ? rootAppSchema : appSchemaCache[name]
}

/**
 * Conv app as struct schema
 */
export function getAppStructSchemaName(name: string)
{
    return `${appStructSchemaRoot}.${name}`
}

//#endregion

//#region Data Schema

const schemaCache: { [key: string]: INodeSchema } = {}
const rootSchema: INodeSchema = { name: "", type: SchemaType.Namespace }
const arraySchemaMap: { [key: string]: INodeSchema } = {}
const serverCallOnly: Set<string> = new Set()
const schemaRefs: { [key:string]: number } = {}
const schemaChangeWatcher = new DataChangeWatcher()

/**
 * Register the frontend schemas
 * @param schemas The schemas to be registered
 */
export function registerSchema(schemas: INodeSchema[], loadState: SchemaLoadState = SchemaLoadState.Custom): void {
    for (const schema of schemas) {
        const name = schema.name.toLowerCase()
        schema.loadState = (schema.loadState || 0) | loadState

        // for root namespace without name
        if (isNull(name)) {
            registerSchema(schema.schemas || [], loadState)
            continue
        }

        // prepare
        switch(schema.type)
        {
            case SchemaType.Enum:
                if (schema.enum?.values)
                    prepareEnumValueInfos(schema.enum.type, schema.enum.values)
                break;
            case SchemaType.Scalar:
                if (schema.scalar?.regex)
                    schema.scalar.regex = schema.scalar.regex.replace(/\\\\/g, '\\')
        }

        const exist = schemaCache[name]

        // combine
        if (exist)
        {
            if (exist.type !== schema.type) continue

            exist.display = combineLocaleString(exist.display, schema.display)
            exist.usedBy = schema.usedBy || exist.usedBy
            exist.usedByApp = schema.usedByApp || exist.usedByApp

            if (schema.type === SchemaType.Namespace)
            {
                exist.loadState = (exist.loadState || 0) | (schema.loadState) | loadState
            }
            else
            {
                if ((exist.loadState || 0) > schema.loadState) continue
                exist.loadState = schema.loadState
            }

            // remove refs
            updateSchemaRefs(exist, false)
            
            switch(exist.type)
            {
                case SchemaType.Namespace:
                    if (schema.schemas)
                        registerSchema(schema.schemas, loadState)
                    break
                
                case SchemaType.Enum:
                    // keep sublist
                    if (!schema.enum) continue
                    if (schema.enum?.values){
                        for(let i = 0; i < schema.enum.values.length; i++)
                        {
                            const value = schema.enum.values[i]
                            value.subList = value.subList || exist.enum?.values?.find(v => v.value == value.value)?.subList
                        }
                    }
                    exist.enum = schema.enum
                    break

                case SchemaType.Scalar:
                    exist.scalar = schema.scalar || exist.scalar
                    break

                case SchemaType.Struct:
                    // since the frontend may define special features that override the backend
                    if (!(((exist.loadState || 0) & SchemaLoadState.System) && exist.struct?.fields?.length))
                        exist.struct = schema.struct || exist.struct
                    break

                case SchemaType.Array:
                    exist.array = schema.array || exist.array
                    break

                case SchemaType.Func:
                    // keep the frontend implementation
                    if (!((exist.loadState || 0) & SchemaLoadState.System) || !exist.func)
                        exist.func = schema.func || exist.func
                    break
            }

            // add refs
            updateSchemaRefs(exist, true)
            continue
        }

        // root namespace
        const paths = name.split(".").filter(n => !isNull(n))
        let root: INodeSchema = rootSchema
        for (let i = 0; i < paths.length - 1; i++)
        {
            const p = paths.slice(0, i + 1).join(".")
            let ns = schemaCache[p]
            if (!ns)
            {
                ns = {
                    name: p,
                    type: SchemaType.Namespace,
                    schemas: [],
                    loadState: loadState
                }
                schemaCache[p] = ns
                if(root) addSchema(root, ns)
            }
            root = ns
            if (root.type !== SchemaType.Namespace) continue
        }
        
        schemaCache[name] = schema

        // append to the namespace
        addSchema(root, schema)

        // Only namespace require another load
        if (schema.type !== SchemaType.Namespace)
            schema.loaded = true

        if (schema.type === SchemaType.Array && !isNull(schema.array?.element))
            arraySchemaMap[schema.array!.element.toLowerCase()] = schema

        // add refs
        updateSchemaRefs(schema, true)
        
        if (schema.type === SchemaType.Namespace && schema.schemas)
        {
            registerSchema([...schema.schemas], loadState)
        }
    }
    schemaChangeWatcher.notify(schemas.map(s => s.name))
}

/**
 * Remove a schema
 * @param name the schema name
 * @return whether the schema is removed
 */
export function removeSchema(name: string): boolean
{
    name = name.toLowerCase()
    const schema = getCachedSchema(name)
    if (!schema) return true
    if (schema.loadState & SchemaLoadState.System) return false
    if (schema === rootSchema || schemaRefs[name]) return false
    updateSchemaRefs(schema, false)
    
    const paths = name.split(".")
    const pname = paths.slice(0, paths.length - 1).join(".")
    const parent = getCachedSchema(pname)
    if (parent)
    {
        const index = parent.schemas?.findIndex(s => s.name === schema.name)
        if (!isNull(index) && index >= 0)
        {
            parent.schemas.splice(index, 1)
        }
    }
    delete schemaCache[name]
    schemaChangeWatcher.notify([name])
    return true
}

/**
 * Subscribe schema change
 */
export function subscribeSchemaChange(handler: Function)
{
    return schemaChangeWatcher.addWatcher(handler)
}

/**
 * Gets the schema information
 * @param schemaName The name of the schema
 * @param generic the generic types
 * @returns The schema information
 */
export async function getSchema(name: string, generic?: string | string[]): Promise<INodeSchema | undefined> {
    // all schema names should be case insensitive
    name = name.toLowerCase()

    // generic type
    if (/^[tT]\d*$/.test(name)) {
        const index = name.length > 1 ? parseInt(name.substring(1)) - 1 : 0
        if (!generic || Array.isArray(generic) && generic.length <= index) return undefined
        name = Array.isArray(generic) ? generic[index] : generic
    }

    // geneiric implement check
    const match = name.match(REGEX_GENERIC_IMPLEMENT)
    let geneiricTypes: string[] = []
    if (match && match.length >= 3)
    {
        geneiricTypes = match[2].split(",").map(t => t.trim())
        name = match[1]
    }

    // cache check
    let schema = !name ? rootSchema : schemaCache[name]
    let provider = getSchemaProvider()
    if (schema?.loaded || !provider) return geneiricTypes.length ? buildGenericType(schema, geneiricTypes) : schema

    // load schema from provider
    if(schema) schema.loaded = true
    if (!provider) throw new Error(`Schema provider not provided to get ${name}`)

    // load schema from provider
    const schemas = await provider.loadSchema([name]) || []
    PrepareServerSchemas(schemas)
    registerSchema(schemas, SchemaLoadState.Server)

    schema = schema?.type === SchemaType.Namespace ? schema : schemaCache[name]
    return geneiricTypes.length ? buildGenericType(schema, geneiricTypes) : schema
}

/**
 * Gets the cached schema info, when the schema node created, their info and all other required must be cached, avoid async codes
 * @param name The schema name
 * @returns The schema info
 */
export function getCachedSchema(name: string): INodeSchema | undefined {
    name = name.toLowerCase()

    // conv app to struct
    if (name.startsWith(appStructSchemaRoot))
    {
        const appName = name.substring(appStructSchemaRoot.length + 1)
        const appSchema = getAppCachedSchema(appName)
        if (appSchema)
        {
            if (!appSchema.nodeSchema && appSchema.fields?.length)
            {
                appSchema.nodeSchema = {
                    name,
                    type: SchemaType.Struct,
                    display: appSchema.display,
                    struct: {
                        fields: appSchema.fields.map(f => ({
                            name: f.name,
                            type: f.type,
                            display: f.display,
                            desc: f.desc,
                        })),
                        relations: appSchema.relations?.map(r => r)
                    }
                }
            }
            return appSchema.nodeSchema
        }
        return
    }

    // geneiric implement check
    const match = name.match(REGEX_GENERIC_IMPLEMENT)
    let geneiricTypes: string[] = []
    if (match && match.length >= 3)
    {
        geneiricTypes = match[2].split(",").map(t => t.trim())
        name = match[1]
    }

    const schema = !name ? rootSchema : schemaCache[name]
    return geneiricTypes.length ? buildGenericType(schema, geneiricTypes) : schema
}

/**
 * Gets an array schema that use the target as element
 */
export async function getArraySchema(name: string | INodeSchema, noautocreate: boolean = false): Promise<INodeSchema | undefined> {
    const schema = typeof name === "string" ? await getSchema(name) : name
    if (!schema) return undefined
    if (schema.type === SchemaType.Array) return schema
    name = schema.name.toLowerCase()
    if (noautocreate || arraySchemaMap[name]) return arraySchemaMap[name]

    // provide the generic
    return getCachedSchema(`system.list<${name}>`)
}

/**
 * Gets the generic parameter names of a schema
 */
export function getGenericParameter(name: string | INodeSchema) : string[] | undefined
{
    const schema = typeof name === "string" ? getCachedSchema(name) : name
    if (schema?.type == SchemaType.Array) {
        if (schema.array.element?.match(REGEX_GENERIC_TYPE)) {
            return ["T"]
        }
    }
    else if (schema?.type == SchemaType.Struct) {
        const temp = new Set<string>()
        const generics = schema.struct?.fields?.filter(f => { 
            if (f.type.match(REGEX_GENERIC_TYPE)) {
                if (!temp.has(f.type)) {
                    temp.add(f.type)
                    return true
                }
            } 
            return false
        })?.map(f => f.type) || []
        return generics.length ? generics : undefined
    }
}

/**
 * Whether the schema type can be used as the target schema
 * @param name the schema type
 * @param target the target schema type
 * @param array check the element type if target is array
 */
export async function isSchemaCanBeUseAs(name: string, target: string, array?: boolean): Promise<boolean> {
    let schema = await getSchema(name)
    let tarSchemInfo = await getSchema(target)
    if (!schema || !tarSchemInfo) return false
    if (schema === tarSchemInfo) return true

    // Compares by type
    if (schema.type === SchemaType.Enum) {
        // Enum > Scalar
        if (tarSchemInfo.type === SchemaType.Scalar) {
            // Enum > string
            if (schema.enum?.type === EnumValueType.String) {
                return await isSchemaCanBeUseAs(target, NS_SYSTEM_STRING)
            }
            // Enum > number
            else {
                return await isSchemaCanBeUseAs(target, NS_SYSTEM_NUMBER)
            }
        }
    }
    else if (schema.type === SchemaType.Scalar) {
        // Scalar > Enum
        if (tarSchemInfo.type === SchemaType.Enum) {
            // String > enum
            if (tarSchemInfo.enum?.type === EnumValueType.String) {
                return await isSchemaCanBeUseAs(name, NS_SYSTEM_STRING)
            }
            // Int > enum
            else if (tarSchemInfo.enum?.type === EnumValueType.Int || tarSchemInfo.enum?.type === EnumValueType.Flags) {
                return await isSchemaCanBeUseAs(name, NS_SYSTEM_INT)
            }
        }
        // Scalar > Scalar
        else if (tarSchemInfo.type === SchemaType.Scalar) {
            let isInt = false
            let isTarInt = false

            // Gets the base type
            while (schema) {
                if (schema.name === NS_SYSTEM_INT)
                    isInt = true
                if (!schema.scalar?.base)
                    break
                schema = await getSchema(schema.scalar.base)
            }

            while (tarSchemInfo) {
                if (tarSchemInfo.name === NS_SYSTEM_INT)
                    isInt = true
                if (!tarSchemInfo.scalar?.base)
                    break
                tarSchemInfo = await getSchema(tarSchemInfo.scalar.base)
            }

            // All can be use as string
            if (tarSchemInfo?.name === NS_SYSTEM_STRING) return true

            // The root type must be the same
            if (schema?.name !== tarSchemInfo?.name) return false

            // number can be coverted
            if (schema?.name === NS_SYSTEM_NUMBER) return isTarInt ? isInt : true
        }
        // Scalar > Array Element
        else if (tarSchemInfo.type === SchemaType.Array && array) {
            return await isSchemaCanBeUseAs(name, tarSchemInfo.array!.element)
        }
    }
    else if (schema.type === SchemaType.Struct) {
        // Array element
        if (tarSchemInfo.type === SchemaType.Array && array)
            tarSchemInfo = await getSchema(tarSchemInfo.array!.element)

        // The target must be struct
        if (tarSchemInfo?.type !== SchemaType.Struct) return false
        if (schema.name === NS_SYSTEM_STRUCT || tarSchemInfo.name === NS_SYSTEM_STRUCT) return true

        // Compare the field
        let match = 0;
        for (let i = 0; i < tarSchemInfo.struct!.fields.length; i++) {
            const tarfield = tarSchemInfo.struct!.fields[i]
            const field = schema.struct!.fields.find(f => f.name === tarfield.name)

            if (!field && !tarfield.require) continue // pass require field
            if (!field || !await isSchemaCanBeUseAs(field.type, tarfield.type)) return false
            match++;
        }
        return match > 1
    }
    else if (schema.type === SchemaType.Array) {
        if (tarSchemInfo.type !== SchemaType.Array) return array ? await isSchemaCanBeUseAs(schema.array!.element, target) : false
        if (schema.name === NS_SYSTEM_ARRAY || tarSchemInfo.name === NS_SYSTEM_ARRAY) return true
        return await isSchemaCanBeUseAs(schema.array!.element, tarSchemInfo.array!.element)
    }
    return false
}

/**
 * Validate the value by schema
 * @param name the schema type
 * @param value the value to be validation
 */
export async function validateSchemaValue(name: string, value: any): Promise<boolean>
{
    const schema = await getSchema(name)
    if (!schema) return true

    if (schema.type === SchemaType.Scalar)
    {
        const valueType = getScalarValueType(name)
        if (!schema.scalar || !valueType) return true
        if (valueType && ScalarValueType.Boolean)
        {
            return typeof value === "boolean"
        }
        else if (valueType && ScalarValueType.Date)
        {
            return value instanceof Date
        }
        else if (valueType && ScalarValueType.Integer)
        {
            return typeof value === "number" && Math.floor(value) === value &&
                (isNull(schema.scalar.lowLimit) || value >= schema.scalar.lowLimit!) &&
                (isNull(schema.scalar.upLimit) || value <= schema.scalar.upLimit!)
        }
        else if (valueType && ScalarValueType.Number)
        {
            return typeof value === "number" &&
                (isNull(schema.scalar.lowLimit) || value >= schema.scalar.lowLimit!) &&
                (isNull(schema.scalar.upLimit) || value <= schema.scalar.upLimit!)
        }
        else if (valueType && ScalarValueType.String)
        {
            return typeof value === "string" &&
                (isNull(schema.scalar.lowLimit) || value.length >= schema.scalar.lowLimit!) &&
                (isNull(schema.scalar.upLimit) || value.length <= schema.scalar.upLimit!)
        }
    }
    else if (schema.type === SchemaType.Enum)
    {
        const access = await getEnumAccessList(name, value)
        return access.length > 0
    }
    else if(schema.type === SchemaType.Struct)
    {
        if (Array.isArray(value) || typeof value !== 'object') return false
        for(let i = 0; i < schema.struct!.fields.length; i++)
        {
            const field = schema.struct!.fields[i]
            const val = value[field.name]
            if (isNull(val)) {
                if (field.require) return false
                continue
            }
            if (!await validateSchemaValue(field.type, val))
                return false
        }
    }
    else if(schema.type === SchemaType.Array)
    {
        if (!Array.isArray(value)) return false
        for(let i = 0; i < value.length; i++)
        {
            if (!await validateSchemaValue(schema.array!.element, value[i]))
                return false
        }
    }
    return true
}

/**
 * Whether the struct field can be used as index
 * @param config The struct field config
 */
export async function isStructFieldIndexable(config: IStructFieldConfig)
{
    let schema = await getSchema(config.type)
    if (!schema) return false
    switch (schema.type) {
        case SchemaType.Scalar:
            const valueType = getScalarValueType(schema.name)
            if (!valueType) return false
            if (valueType & ScalarValueType.String) 
            {
                let uplimit = (config as IStructScalarFieldConfig).upLimit
                if (!isNull(uplimit) && uplimit <= 128) return true

                while (schema && schema.name !== NS_SYSTEM_STRING)
                {
                    uplimit = schema.scalar?.upLimit
                    if (!isNull(uplimit) && uplimit <= 128) return true
                    schema = schema.scalar?.base
                        ? await getSchema(schema.scalar.base)
                        : null
                }

                return false
            }
            return (valueType & INDEX_VALUE_TYPE) !== 0
        case SchemaType.Enum:
            return true
        default:
            return false
    }
}

const genericSchemaCache: { [key: string]: INodeSchema } = {}
function buildGenericType(schema: INodeSchema, genericTypes: string[]): INodeSchema | undefined {
    if (!genericTypes?.length) return undefined
    const genTypes = getGenericParameter(schema)
    if (!genTypes || genTypes.length !== genericTypes.length) return undefined

    const genKey = `${schema.name}<${genericTypes.join(",")}>`.toLowerCase()
    if (genericSchemaCache[genKey]) return genericSchemaCache[genKey]

    if (schema.type === SchemaType.Array) {
        const genSchema: INodeSchema = {
            name: genKey,
            type: SchemaType.Array,
            display: _LS(`{[LIST.PREFIX]}{@${genericTypes[0]}}{[LIST.SUFFIX]}`),
            loaded: true,
            loadState: schema.loadState,
            array: { element: genericTypes[0] }
        }
        genericSchemaCache[genKey] = genSchema
        return genSchema
    }
    else if(schema.type === SchemaType.Struct) {
        const genSchema: INodeSchema = {
            name: genKey,
            type: SchemaType.Struct,
            display: schema.display,
            loaded: true,
            loadState: schema.loadState,
            struct: {
                fields: schema.struct!.fields.map(f => {
                    if (f.type.match(REGEX_GENERIC_TYPE)) {
                        const index = genTypes.indexOf(f.type)
                        return {
                            ...f,
                            type: genericTypes[index]
                        }
                    }
                    return f
                }),
                relations: schema.struct?.relations?.map(r => r)
            }
        }
        genericSchemaCache[genKey] = genSchema
        return genSchema
    }
    return undefined
}

interface IFieldAccessWhiteListItem {
    value: string,
    label: string,
    children?: IFieldAccessWhiteListItem[]
}

/**
 * Gets the field access white list
 * @param type The wanted type
 * @param fields The fields to be checked
 * @returns The field access white list
 */
export async function getFieldAccessWhiteList(type: string, fields: { name: string, display?: ILocaleString, type: string }[], prefix: string = ""): Promise<IFieldAccessWhiteListItem[]>
{
    const result: IFieldAccessWhiteListItem[] = []
    for(const field of fields)
    {
        const value = prefix ? `${prefix}.${field.name}` : field.name
        if (await isSchemaCanBeUseAs(field.type, type))
        {
            result.push({
                value: value,
                label: _L(field.display) || field.name
            })
        }
        else
        {
            const fieldSchema = await getSchema(field.type)
            if (fieldSchema?.type === SchemaType.Struct)
            {
                const subList = await getFieldAccessWhiteList(type, fieldSchema.struct!.fields, value)
                if (subList.length)
                {
                    result.push({
                        value: value,
                        label: _L(field.display) || field.name,
                        children: subList
                    })
                }
            }
        }
    }
    return result
}

//#endregion

//#region scalar

const scalarValueMap:{ [key:string]: ScalarValueType } = {}

/**
 * Gets the value type from scalar type
 * @param type The scalar type
 * @returns the value type
 */
export function getScalarValueType(type: string):ScalarValueType {
    if ((getCachedSchema(type))?.type !== SchemaType.Scalar) return ScalarValueType.None

    let valueType = 0
    type = type.toLowerCase()
    if (scalarValueMap[type]) return scalarValueMap[type]

    // check by name
    let typeName: string | undefined = type
    while (typeName) {
        switch (typeName) {
            case NS_SYSTEM_BOOL:
                valueType |= ScalarValueType.Boolean
                break;
            case NS_SYSTEM_STRING:
                valueType |= ScalarValueType.String
                break;
            case NS_SYSTEM_DATE:
                valueType |= ScalarValueType.Date
                break;
            case NS_SYSTEM_YEAR:
                valueType |= ScalarValueType.Date
                valueType |= ScalarValueType.Year
                break;
            case NS_SYSTEM_FULLDATE:
                valueType |= ScalarValueType.FullDate
                break;
            case NS_SYSTEM_YEARMONTH:
                valueType |= ScalarValueType.YearMonth
                break;
            case NS_SYSTEM_NUMBER:
                valueType |= ScalarValueType.Number
                break;
            case NS_SYSTEM_INT:
                valueType |= ScalarValueType.Integer
                break;
            case NS_SYSTEM_GUID:
                valueType |= ScalarValueType.String
                break;
        }
        typeName = (getCachedSchema(typeName))?.scalar?.base
    }
    scalarValueMap[type] = valueType
    return valueType
}

//#endregion

//#region enum access

/**
 * Gets the enum sublist by given value
 * @param name The enum schema name
 * @param value the enum value, if omit means the root enum list
 * @param deep query deep sub list
 * @returns the sub list of the given enum value
 */
export async function getEnumSubList(name: string, value?: any, deep?: boolean): Promise<IEnumValueInfo[]> {
    const schema = await getSchema(name)
    if (!schema?.enum || schema?.type !== SchemaType.Enum) return []

    // root list
    if (isNull(value))
    {
        if (schema.enum.values && schema.enum.values.length) return schema.enum.values
        
        // check load state
        if (schema.loadState && (schema.loadState & SchemaLoadState.Server) !== SchemaLoadState.Server) return []

        let provider = getSchemaProvider()
        if (!provider) throw new Error("Schema provider not provided")
        const einfos = await provider.loadEnumSubList(name, value, deep)
        prepareEnumValueInfos(schema.enum.type, einfos)
        schema.enum.values = einfos
        return einfos
    }
    
    let search = searchEnumValue(schema.enum.values, value)
    let einfo = search.length ? search[search.length - 1] : undefined
    if (einfo) {
        if (einfo.hasSubList === false || einfo.subList && einfo.subList.length) return einfo.subList || []
    }
    
    // check load state
    if (schema.loadState && (schema.loadState & SchemaLoadState.Server) !== SchemaLoadState.Server) return []

    let provider = getSchemaProvider()
    if (!provider) throw new Error("Schema provider not provided")

    // only require sub list
    if (einfo)
    {
        const einfos = await provider.loadEnumSubList(name, value, deep)
        prepareEnumValueInfos(schema.enum.type, einfos)
        einfo.subList = einfos
        einfo.hasSubList = einfos.length > 0
        return einfos
    }

    // need full access
    const access = await provider.loadEnumAccessList(name, value, false, true)
    if (!access?.length) return []
    prepareEnumAccesses(schema.enum.type, access)
    
    // combine
    schema.enum.values ||= []
    let root = schema.enum.values
    for(let i = 0; i < access.length; i++)
    {
        if (!root.length)
            root.splice(0, 0, ...access[i].subList)

        if (access[i].value){
            let match = root.find(r => r.value == access[i].value)
            if (!match) {
                // rebuild all
                root.splice(0, 0, ...access[i].subList)
                match = root.find(r => r.value == access[i].value)
            }
            
            if (i < access.length - 1) {
                match.hasSubList = true
                match.subList ||= []
                root = match.subList
            }
        }
    }
    
    // check
    search = searchEnumValue(schema.enum.values, value)
     einfo = search.length ? search[search.length - 1] : undefined
    if (!einfo || !einfo.hasSubList) return []
    if (einfo.subList?.length) return einfo.subList

    // try reload
    einfo.subList = await provider.loadEnumSubList(name, value, deep)
    if (!einfo.subList.length) einfo.hasSubList = false
    prepareEnumValueInfos(schema.enum.type, einfo.subList)
    return einfo.subList
}

/**
 * Gets the enum access list for given value
 * @param name The enum schema name
 * @param value the enum value
 */
export async function getEnumAccessList(name: string, value: any): Promise<IEnumValueAccess[]> {
    const schema = await getSchema(name)
    if (!schema?.enum || schema.type !== SchemaType.Enum) return []
    
    // search
    const search = searchEnumValue(schema.enum.values, value)
    if (search.length)
    {
        return search.map((s, i) => ({
            name: schema.enum!.cascade?.length ? schema.enum?.cascade[i]! : _LS(""),
            value: s.value,
            subList: (i == 0 ? schema.enum?.values : search[i - 1].subList) || []
        }))
    }

    // check load state
    if (schema.loadState && (schema.loadState & SchemaLoadState.Server) !== SchemaLoadState.Server) return []

    // query
    let provider = getSchemaProvider()
    if (!provider) throw new Error("Schema provider not provided")
    const access = await provider.loadEnumAccessList(name, value)

    // combine
    if (!access?.length) return []
    prepareEnumAccesses(schema.enum.type, access)
    
    // combine
    schema.enum.values ||= []
    let root = schema.enum.values
    for(let i = 0; i < access.length; i++)
    {
        if (!root.length)
            root.splice(0, 0, ...access[i].subList)

        if (access[i].value){
            let match = root.find(r => r.value == access[i].value)
            if (!match) {
                // rebuild all
                root.splice(0, 0, ...access[i].subList)
                match = root.find(r => r.value == access[i].value)
            }
            
            if (i < access.length - 1) {
                match.hasSubList = true
                match.subList ||= []
                root = match.subList
            }
        }
    }

    return access
}

/**
 * Save the enum sub list, only works for non-server schema 
 */
export function saveEnumSubList(name: string, value: any, subList: IEnumValueInfo[]): boolean {
    if (isNull(value)) return false

    const schema = getCachedSchema(name)
    if (!schema?.enum || schema?.type !== SchemaType.Enum || ((schema.loadState || 0) & SchemaLoadState.System)) return false
    
    let search = searchEnumValue(schema.enum.values, value)
    let einfo = search.length ? search[search.length - 1] : undefined
    if (einfo) {
        subList.forEach(s => {
            const e = einfo.subList?.find(l => l.value == s.value)
            if(e)
            {
                s.subList = s.subList || e.subList
            }
        })

        einfo.subList = subList
        return true
    }
    return false
}

//#endregion

//#region schema function call

const shareFuncCallResult: { [key: string]: any } = {}
const pendingCall: {
    [key: string]: {
        resolve: Function,
        reject: Function
    }[]
} = {}
const pendingComplexCall: any = {}

const callSchemaFunctionQueue = useQueueQuery((schemaName: string, args: any[], generic?: string | string[], target?: string) => getSchemaProvider()!.callFunction(schemaName, args, generic, target))

/**
 * Call the function schema from the server with the arguments and type, gets the result
 * @param schemaName The name of the function schema
 * @param args The arguments of the function
 * @param generic The generic type of the function
 * @returns The schema information
 */
export async function callSchemaFunction(schemaName: string, args: any[], generic?: string | string[], target?: string): Promise<any> {
    const schema = await getSchema(schemaName)
    if (!schema || schema.type !== SchemaType.Func) throw Error(`${schemaName} is not a function schema`)
    const funcInfo = schema.func!

    // Pre-check the function arguments
    for (let i = 0; i < funcInfo.args.length; i++) {
        if (isNull(args[i]) && !funcInfo.args[i].nullable) return null
    }

    // Try build the function
    if (!(funcInfo.func || serverCallOnly.has(schema.name))) {
        if (!await buildFunction(funcInfo)) serverCallOnly.add(schema.name)
    }

    // Client function call it direclty
    if (funcInfo.func && (!funcInfo.server || !getSchemaProvider())) {
        return await callFunc(funcInfo.func, args)
    }
    
    // Schema provider check
    if (!getSchemaProvider()) throw new Error("Schema provider not provided")

    // Combine and queue
    let token = (!args || !args.length) 
        ? schema.name
        : args.findIndex(a => a && typeof a === "object") < 0
            ? `${schema.name}:${JSON.stringify(args)}` 
            : null
    if (token) {
        if (target) token = `${token}->${target}`

        const result = shareFuncCallResult[token]
        if (result !== undefined) return result

        // avoid repeat call in the same time
        if (pendingCall[token])
            return await new Promise((resolve, reject) => pendingCall[token].push({ resolve, reject }))

        // init
        pendingCall[token] = []
        await new Promise((resolve) => setTimeout(resolve, 50))
        try {
            const res = await callSchemaFunctionQueue(schema.name, args, generic)
            if (!funcInfo.nocache) shareFuncCallResult[token] = res
            pendingCall[token].forEach(c => c.resolve(res))
            return res
        }
        catch (ex) {
            pendingCall[token].forEach(c => c.reject(ex))
            throw ex
        }
        finally {
            delete pendingCall[token]
            if (!funcInfo.nocache && !args.length) // reset
                setTimeout(() => delete shareFuncCallResult[token], 1000);
        }
    }
    else
    {
        // Complex arguments
        let root = pendingComplexCall[schema.name]
        if (!root) {
            root = new Map()
            pendingComplexCall[schema.name] = root
        }
        for (let i = 0; i < args.length; i++) {
            const a = isNull(args[i]) ? "NULL_TOKEN" : args[i]
            let next = root.get(a)
            if (!next) {
                next = new Map()
                root.set(a, next)
            }
            root = next
        }

        if (target) {
            let next = root.get(target)
            if (!next) {
                next = new Map()
                root.set(target, next)
            }
            root = next
        }

        // avoid multi call
        let queue = root.get("CALL_QUEUE")
        if (queue) return await new Promise((resolve, reject) => queue.push({ resolve, reject }))

        // init
        queue = []
        root.set("CALL_QUEUE", queue)
        await new Promise(resolve => setTimeout(resolve, 50))

        // reset for next call
        delete pendingComplexCall[schema.name]

        try 
        {
            let res = await callSchemaFunctionQueue(schema.name, parseArgs(funcInfo, args), generic)
            if (res === undefined) res = null
            queue.forEach((c:any) => c.resolve(res))
            return res
        }
        catch (ex) 
        {
            queue.forEach((c:any) => c.reject(ex))
        }
    }
}

/**
 * Whether the schema is deletable
 * @param name the schema name
 * @returns deletable
 */
export function isSchemaDeletable(name: string)
{
    const schema = getCachedSchema(name)
    if (!schema) return false
    if (schema.loadState & SchemaLoadState.System) return false
    if (schemaRefs[schema.name.toLowerCase()]) return false
    if (schema.type === SchemaType.Namespace && schema.schemas?.length) return false
    return !schema.used
}

/**
 * Whether the schema is abstract
 * @param name the schema name
 * @return abstract
 */
export function isAbstractSchema(name: string)
{
    const schema = getCachedSchema(name)
    switch (schema?.type)
    {
        case SchemaType.Array:
            return !schema.array?.element
        case SchemaType.Struct:
            return !schema.struct?.fields?.length
    }
    return false
}

//#endregion

//#region helper

// Add sub schema
function addSchema(root: INodeSchema, schema: INodeSchema)
{
    root.schemas = root.schemas || []
    root.schemas.sort((a, b) => a.name.toLowerCase() < b.name.toLowerCase() ? -1 : 1)
    
    const name = schema.name.toLowerCase()
    for (let j = 0; j < root.schemas.length; j++)
    {
        const n = root.schemas[j].name.toLowerCase()
        if (name === n) return
        if (name < n)
        {
            root.schemas.splice(j, 0, schema)
            return
        }
    }
    root.schemas.push(schema)
}

// build the function schema to function
async function buildFunction(funcInfo: IFunctionSchema): Promise<boolean> {
    // server-side function
    if (!funcInfo.exps.length || (funcInfo.server && getSchemaProvider())) return false

    // arg or exp type map
    const exptypes: { [key: string]: INodeSchema } = {}
    for (let i = 0; i < funcInfo.args.length; i++) {
        const expSchema = await getSchema(funcInfo.args[i].type, funcInfo.generic)
        if (expSchema) exptypes[funcInfo.args[i].name] = expSchema
    }

    // build expressions
    const exps: Expression[] = []
    for (let i = 0; i < funcInfo.exps.length; i++) {
        const fexp = funcInfo.exps[i]
        const retSchema = await getSchema(fexp.return) // every expression must have a result type
        exptypes[fexp.name] = retSchema!

        // get the call func
        const cfinfo = await getSchema(fexp.func)
        if (!cfinfo || !cfinfo.func || serverCallOnly.has(cfinfo.name) || (cfinfo.func.server && getSchemaProvider())) return false

        // try buil the call func
        const cfuncInfo = cfinfo.func
        if (!cfuncInfo.func && !await buildFunction(cfuncInfo)) {
            serverCallOnly.add(cfinfo.name)
            return false
        }

        // array index
        let arrayIndex: number = -1
        if (fexp.type !== ExpressionType.Call) {
            // generic type check
            const generic = cfuncInfo.generic ? Array.isArray(cfuncInfo.generic) ? [...cfuncInfo.generic] : [cfuncInfo.generic] : []

            // use exp type if the ret type is generic
            if (/^[tT]\d*$/.test(cfuncInfo.return)) {
                const gidx = cfuncInfo.return.length > 1 ? parseInt(cfuncInfo.return.substring(1)) - 1 : 0
                if (retSchema) generic[gidx] = retSchema.name
            }

            // argument check
            for (let j = 0; j < Math.min(cfuncInfo.args.length, fexp.args.length); j++) {
                const carg = cfuncInfo.args[j]
                let cargSchema = await getSchema(carg.type, generic) // null means any
                const exp = fexp.args[j]
                if (exp.name) {
                    if (exptypes[exp.name]) {
                        // Check if the exp is array for the arg, no type validation, should be done when define the exp
                        if (exptypes[exp.name].type === SchemaType.Array && cargSchema?.type !== SchemaType.Array) {
                            arrayIndex = j
                        }
                    }
                    // for argument without type, write back
                    else if (cargSchema) {
                        exptypes[exp.name] = cargSchema
                    }
                }
            }
        }

        // prepare
        exps.push({
            name: fexp.name,
            type: fexp.type,
            func: cfuncInfo.func!,
            args: fexp.args?.map((f, i) => ({ ...f, require: !(cfuncInfo.args.length > i && cfuncInfo.args[i]?.nullable) })),
            return: retSchema!,
            arrIndex: arrayIndex
        })
    }

    // check the return type if the func works as struct constructor
    let objFields: string[] = []
    if (funcInfo.return) {
        const retSchema = await getSchema(funcInfo.return, funcInfo.generic)
        if (retSchema?.type === SchemaType.Struct && !(await isSchemaCanBeUseAs(exps[exps.length - 1].return.name, retSchema.name))) {
            objFields = retSchema.struct!.fields.map(f => f.name)
        }
    }
    
    // build the function
    const args = funcInfo.args.map(a => a.name)
    funcInfo.func = async function () {
        const expValues: { [key: string]: any } = {}

        // gets the arguments
        for (let i = 0; i < args.length; i++) {
            expValues[args[i]] = arguments[i]
        }

        // process
        for (let i = 0; i < exps.length; i++) {
            const exp = exps[i]
            const val = []

            if (exp.args) {
                let valid = true

                for (let j = 0; j < exp.args.length; j++) {
                    const e = exp.args[j]
                    const v = e.name ? expValues[e.name] : e.value

                    if (isNull(v) && e.require && !(exp.type == ExpressionType.Reduce && j == 1)) {
                        valid = false
                        break
                    }

                    val.push(v)
                }

                // not valid, pass
                if (!valid) {
                    expValues[exp.name] = null
                    continue
                }
            }

            // call
            switch (exp.type) {
                // direct call
                case ExpressionType.Call:
                    expValues[exp.name] = await callFunc(exp.func, val)
                    break

                // map
                case ExpressionType.Map:
                    {
                        const result = []
                        const array = val[exp.arrIndex]
                        for (let j = 0; j < array.length; j++) {
                            val[exp.arrIndex] = array[j]
                            result.push(await callFunc(exp.func, val))
                        }
                        expValues[exp.name] = result
                    }
                    break

                // reduce
                case ExpressionType.Reduce:
                    {
                        let array = val[exp.arrIndex]
                        let sumIndex = exp.arrIndex == 1 ? 0 : 1
                        let hasInit = !isNull(val[sumIndex])

                        if (!hasInit) {
                            val[sumIndex] = array[0]
                        }

                        for (let j = hasInit ? 0 : 1; j < array.length; j++) {
                            val[exp.arrIndex] = array[j]
                            val[sumIndex] = await callFunc(exp.func, val)
                        }
                        expValues[exp.name] = val[sumIndex]
                    }
                    break

                // first match
                case ExpressionType.First:
                    {
                        const array = val[exp.arrIndex]
                        for (let j = 0; j < array.length; j++) {
                            val[exp.arrIndex] = array[j]
                            if (await callFunc(exp.func, val)) {
                                expValues[exp.name] = array[j]
                                break
                            }
                        }
                    }
                    break

                // last match
                case ExpressionType.Last:
                    {
                        const array = val[exp.arrIndex]
                        for (let j = array.length - 1; j >= 0; j--) {
                            val[exp.arrIndex] = array[j]
                            if (await callFunc(exp.func, val)) {
                                expValues[exp.name] = array[j]
                                break
                            }
                        }
                    }
                    break

                // filter
                case ExpressionType.Filter:
                    {
                        const result = []
                        const array = val[exp.arrIndex]
                        for (let j = 0; j < array.length; j++) {
                            val[exp.arrIndex] = array[j]
                            if (await callFunc(exp.func, val))
                                result.push(array[j])
                        }
                        expValues[exp.name] = result
                    }
                    break
            }
        }

        // generate result
        if (objFields.length > 0) {
            const result: any = {}
            objFields.forEach(f => result[f] = expValues[f])
            return result
        }
        else {
            return expValues[exps[exps.length - 1].name]
        }
    }

    return true
}

// parse args, reduce the size
async function parseArgs(funcInfo: IFunctionSchema, args: any[]) {
    if (!(funcInfo && funcInfo.args && funcInfo.args.length)) return args

    const retArgs: any[] = []
    for (let i = 0; i < funcInfo.args.length; i++) {
        if (args.length <= i) break
        retArgs[i] = args[i]

        // only struct or struct array requrie conversion
        let typeInfo = funcInfo.args[i].type ? await getSchema(funcInfo.args[i].type) : null
        let isArray = false
        if (typeInfo?.type === SchemaType.Array) {
            isArray = true
            typeInfo = typeInfo.array?.element ? await getSchema(typeInfo.array.element) : null
        }
        if (typeInfo?.type !== SchemaType.Struct || !typeInfo.struct || !typeInfo.struct.fields || !typeInfo.struct.fields.length) continue

        // conversion
        const fields = typeInfo.struct.fields.map(f => f.name)
        const origin = args[i]
        if (isArray) {
            const maps: any[] = []
            if (origin && Array.isArray(origin)) {
                for (let j = 0; j < origin.length; j++) {
                    const data = origin[j]
                    if (data && typeof (data) === "object") {
                        const map: any = {}
                        for (let k = 0; k < fields.length; k++) {
                            map[fields[k]] = data[fields[k]]
                        }
                        maps.push(map)
                    }
                }
            }
            retArgs[i] = maps
        }
        else if (origin && typeof (origin) == "object") {
            const map: any = {}
            for (let k = 0; k < fields.length; k++) {
                map[fields[k]] = origin[fields[k]]
            }
            retArgs[i] = map
        }
    }
    return retArgs
}

async function callFunc(func: Function, args: any[]): Promise<any> {
    const res = func(...args)
    if (res instanceof Promise)
        return await res
    else
        return res
}

function searchEnumValue(values: IEnumValueInfo[], value: any): IEnumValueInfo[] {
    for(let i = 0; i < values.length; i++)
    {
        if (values[i].value == value) return [ values[i] ]
        if (values[i].subList?.length)
        {
            const r = searchEnumValue(values[i].subList!, value)
            if (r.length) return [ values[i], ...r ]
        }
    }
    return []
}

function updateRef(name: string, add: boolean)
{
    if (!name) return
    name = name.toLowerCase()
    if (add)
    {
        schemaRefs[name] = (schemaRefs[name] || 0) + 1
    }
    else if (schemaRefs[name])
    {
        schemaRefs[name]--
    }
}

function updateSchemaRefs(schema: INodeSchema, add: boolean)
{
    switch (schema.type)
    {
        case SchemaType.Scalar:
            updateRef(schema.scalar?.base, add)
            break

        case SchemaType.Struct:
            schema.struct?.fields?.forEach(f => updateRef(f.type, add))
            schema.struct?.relations?.forEach(r => updateRef(r.func, add))
            break

        case SchemaType.Array:
            updateRef(schema.array?.element, add)
            schema.array?.relations?.forEach(r => updateRef(r.func, add))
            break

        case SchemaType.Func:
            updateRef(schema.func?.return, add)
            schema.func?.args?.forEach(a => updateRef(a.type, add))
            schema.func?.exps?.forEach(e => {
                updateRef(e.return, add)
                updateRef(e.type, add)
                updateRef(e.func, add)
            })
            break
    }
}

function updateAppSchemaRefs(schema: IAppSchema, add: boolean)
{
    schema.fields?.forEach(f => {
        updateRef(f.type, add)
        updateRef(f.func, add)
    })
}

//#endregion

//#region inner types

// Scalar value type
export enum ScalarValueType {
    None = 0,
    String = 1,
    Number = 2,
    Single = 4,
    Double = 8,
    Integer = 16,
    Boolean = 32,
    Date = 64,
    Year = 128,
    FullDate = 256,
    YearMonth = 512,
    Guid = 1024,
}

const INDEX_VALUE_TYPE = ScalarValueType.Integer | 
    ScalarValueType.Boolean | 
    ScalarValueType.Date |
    ScalarValueType.Year |
    ScalarValueType.FullDate |
    ScalarValueType.YearMonth |
    ScalarValueType.Guid

interface Expression {
    /**
     * The exp name
     */
    name: string

    /**
     * The call type
     */
    type: ExpressionTypeValue

    /**
     * The call func
     */
    func: Function

    /**
     * The arguments
     */
    args: IExpressionArg[]

    /**
     * The return type
     */
    return: INodeSchema

    /**
     * The array index
     */
    arrIndex: number
}

/**
 * The expression argument
 */
interface IExpressionArg {
    /**
     * The exp name
    */
    name?: string

    /**
     * the const value
    */
    value?: any

    /**
     * require
     */
    require: boolean
}

//#endregion

//#region Api schema Protocol

export interface ISchemaApiProtocolRequestMeta
{
    wrap?: string
    fields?: Record<string, any>
}

export interface ISchemaApiProtocolResponseMeta
{
    unwrap?: string
    fields?: Record<string, any>
}

export interface ISchemaApiProtocolMeta
{
    name?: string
    request?: ISchemaApiProtocolRequestMeta
    response?: ISchemaApiProtocolResponseMeta
    error?: string[]
}

let schemaApiHeaders = [] as { key: string, value: string }[]

export function setSchemaApiHeaders(headers: { key: string, value: string }[]) {
    schemaApiHeaders = headers
}

axios.interceptors.request.use(config => {
    // add frontend auth headers
    if (schemaApiHeaders.length) {
        for (const header of schemaApiHeaders) {
            if (header.key && header.value) {
                config.headers[header.key] = header.value
            }
        }
    }
    return config
})

// The schema api base url
if (document.querySelector('meta[name="schema-api-base-url"]'))
{
    schemaApiBaseUrl = document.querySelector('meta[name="schema-api-base-url"]').getAttribute('content') || undefined
}

// check protocol from meta tag
let apiProtocol: ISchemaApiProtocolMeta | undefined = undefined

function scanErrorPaths(fields?: Record<string, any>): string[] {
    let errorPaths: string[] = []
    if (fields)
    {
        for (let field in fields)
        {
            const fieldFmt = fields[field]
            if (typeof fieldFmt === 'string' && fieldFmt.indexOf('[error]') >= 0)
            {
                return [field]
            }
            else if (typeof(fieldFmt) === 'object')
            {
                const subPaths = scanErrorPaths(fieldFmt)
                if (subPaths.length)
                {
                    return [field, ...subPaths]
                }
            }
        }
    }
    return []
}

function generateField(url: string, fmt: any): any | undefined
{
    if (typeof(fmt) !== 'string') return undefined

    let type: string;
    let format: string | null;
    let example: string | null;

    const match = fmt.match(/^(\w+)\[?(\w*)\]?:?(.*)?$/)
    if (match.length >= 2)
    {
        if (match[1] == "string")
        {
            if (match[2] == "uuid")
            {
                return crypto.randomUUID()
            }
            else if(match[2] == "timestamp")
            {
                return new Date().toISOString()
            }
            else if(match[2] == "date")
            {
                return new Date().toISOString().split('T')[0]
            }
            else if(match[2] == "url")
            {
                return url.startsWith("/") ? url.substring(1) : url
            }
            return match[3] || ""
        }
        else if (match[1] == "integer")
        {
            return !isNull(match[3]) ? match[3] : Math.floor(Math.random() * 10000)
        }
    }
    return undefined
}

function setSchemaApiProtocol(protocol: any): boolean {
    if (protocol && typeof protocol === 'object' 
        && protocol.name && typeof protocol.name === 'string'
        && (!protocol.request || typeof protocol.request === 'object')
        && (!protocol.response || typeof protocol.response === 'object'))
    {
        apiProtocol = {
            name: protocol.name,
            request: protocol.request,
            response: protocol.response,
            error: scanErrorPaths(protocol.response?.fields)
        }
        return true
    }
    return false
}

// Read protocol meta if defined
if (document.querySelector('meta[name="schema-api-protocol"]'))
{
    try
    {
        let content = document.querySelector('meta[name="schema-api-protocol"]').getAttribute('content') || ''
        if (content) setSchemaApiProtocol(JSON.parse(content))
    }
    catch(ex)
    {
        console.warn("Invalid schema-api-protocol meta tag content.")
    }
}

/**
 * Sets the schema api base url
 * @param url The schema api base url
 */
export function setSchemaApiBaseUrl(url: string | undefined): void {
    schemaApiBaseUrl = !isNull(url) ? url : undefined
}

/**
 * Gets the schema api base url
 * @returns The schema api base url
 */
export function getSchemaApiBaseUrl(): string | undefined {
    return schemaApiBaseUrl
}

/**
 * Posts query to the schema api, the default implements
 * @param url the request url
 * @param param the request params
 * @param noProtocol whether to ignore protocol processing
 * @returns the result
 */
export async function postSchemaApi(url: string, param: any, noProtocol: boolean = false): Promise<any> {
    try
    {
        let site: string = schemaApiBaseUrl
        if (!site) return null

        if (site.endsWith("/")) site = site.substring(0, site.length - 1)
        if (url.startsWith("/")) url = url.substring(1)

        // Read protocol meta if not yet defined
        if (!noProtocol)
        {
            if (!apiProtocol)
            {
                try
                {
                    const provider = getSchemaProvider()
                    if (provider)
                    {
                        const response = await provider.protocol()
                        if (response) setSchemaApiProtocol(response)
                    }

                    // use default if not provided
                    if (!apiProtocol) setSchemaApiProtocol({ name: "Default" })
                }
                catch(ex)
                {
                    console.warn("Invalid schema-api-protocol meta tag content.")
                    setSchemaApiProtocol({ name: "Default" })
                }
            }

            // build request according to protocol
            if (apiProtocol.request && apiProtocol.request.wrap)
            {
                let requestParam: any = { [apiProtocol.request.wrap]: param }
                for (let field in apiProtocol.request.fields || {})
                {
                    const fieldFmt = apiProtocol.request.fields[field]
                    requestParam[field] = generateField(url, fieldFmt)
                }
                param = requestParam
            }
        }
        
        const result: any = await axios.post(`${site}/${url}`, param, {
            headers: { 'Content-Type': 'application/json' }
        })

        let data = result?.data
        
        // unwrap response according to protocol
        if (!noProtocol && apiProtocol.response && apiProtocol.response.unwrap)
        {
            // check error protocol
            if (apiProtocol.error && apiProtocol.error.length)
            {
                let errorCheck = data
                for (let i = 0; i < apiProtocol.error.length; i++) 
                {
                    if (errorCheck && typeof(errorCheck) === 'object')
                    {
                        errorCheck = errorCheck[apiProtocol.error[i]]
                    }
                }
                if (errorCheck) // 0 or "" means no error
                    throw new Error(errorCheck)
            }

            data = data[apiProtocol.response.unwrap]
        }
        return data
    }
    catch(ex)
    {
        return null
    }
}

//#endregion