import { ISchemaNodeConfig } from "./schemaNodeConfig"

export interface IArraySchemaNodeConfig extends ISchemaNodeConfig
{
    /**
     * The array data is increase update
     */
    isIncrUpdate?: boolean
}