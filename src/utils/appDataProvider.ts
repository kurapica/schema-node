import { IAppDataPushQuery, IAppDataPushResult, IAppDataQuery, IAppDataResult } from "../schema/appSchema";
import { ISchemaProvider, useSchemaProvider } from "./schemaProvider";

/**
 * The Application field data schema provider
 */
export interface IAppSchemaDataProvider extends ISchemaProvider
{
    /**
     * Batch query the application data
     */
    batchQueryAppData(querys: IAppDataQuery[]): Promise<IAppDataResult[]>

    /**
     * Batch import the application data
     */
    batchImportAppData(pushes: IAppDataPushQuery[]): Promise<IAppDataPushResult[]>
}

let schemaProvider: IAppSchemaDataProvider | null = null

/**
 * Sets the data schema provider
 */
export function useAppDataProvider(provider: IAppSchemaDataProvider): void {
    schemaProvider = provider
    useSchemaProvider(provider)
}

/**
 * Gets the data schema provider
 */
export function getAppDataProvider(): IAppSchemaDataProvider | null {
    return schemaProvider
}