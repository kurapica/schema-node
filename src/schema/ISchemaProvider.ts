import { IEnumValueAccess, IEnumValueInfo } from "./IEnumSchema";
import { ISchemaInfo } from "./ISchemaInfo";

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
export interface ISchemaProvider
{
    /**
     * Call the function schema from the server with the arguments and type, gets the result
     * @param schemaName The name of the function schema
     * @param args The arguments of the function
     * @param generic The generic type of the function
     * @returns The schema information
     */
    callFunction(schemaName: string, args: any[], generic?: string | string[]): Promise<any>

    /**
     * Load the schema information
     * @param schemaName The name of the schema
     * @returns The schema information
     */
    loadSchema(schemaName: string): Promise<ISchemaInfo>

    /**
     * Load the enum value sub list from the server
     * @param schemaName The name of the enum schema
     * @param value The root enum value if provided
     * @param fullList Whether load the full list of enum values
     */
    loadEnumSubList(schemaName: string, value?: any, fullList?: boolean): Promise<IEnumValueInfo[]>
    
    /**
     * Load enum enum value access list from the server
     * @param schemaName the name of the enum schema
     * @param value the enum value to be queried
     * @param noSubList no sub list should be loaded
     */
    loadEnumAccessList(schemaName: string, value: any, noSubList?: boolean): Promise<IEnumValueAccess[]>
}

//#region Methods

let schemaProvider: ISchemaProvider | null = null
const schemaCache: { [key: string]: ISchemaInfo } = {}

/**
 * Sets the schema provider
 * @param provider The schema provider
 */
export function useSchemaProvider(provider: ISchemaProvider): void
{
    schemaProvider = provider
}

/**
 * Gets the schema provider
 * @returns The schema provider
 */
export function getSchemaProvider(): ISchemaProvider | null
{
    return schemaProvider
}

/**
 * Register the frontend schemas
 * @param schemas The schemas to be registered
 */
export function registerSchema(schemas: ISchemaInfo[]): void
{
    for (const schema of schemas)
    {
        schemaCache[schema.name.toLowerCase()] = schema
    }
}

/**
 * Gets the schema information
 * @param schemaName The name of the schema
 * @returns The schema information
 */
export async function getSchema(name: string): Promise<ISchemaInfo>
{
    // all schema names should be case insensitive
    name = name.toLowerCase()
    if (schemaCache[name]) return schemaCache[name]
    if (!schemaProvider) throw new Error("Schema provider is not set")

    // load schema from provider
    const schema = await schemaProvider.loadSchema(name)
    schemaCache[name] = schema
    return schema
}

//#endregion

//#region schema function call

/**
 * Call the function schema from the server with the arguments and type, gets the result
 * @param schemaName The name of the function schema
 * @param args The arguments of the function
 * @param generic The generic type of the function
 * @returns The schema information
 */
export function callFunction(schemaName: string, args: any[], generic?: string | string[]): Promise<any>
{
    
}

//#endregion