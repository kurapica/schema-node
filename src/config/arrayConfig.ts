import { ISchemaNodeConfig } from "./schemaConfig"

export interface IArraySchemaNodeConfig extends ISchemaNodeConfig
{
    /**
     * The array data is increase update
     */
    isIncrUpdate?: boolean
    
    /**
     * The page count
     */
    pageCount?: number

    /**
     * The data total count
     */
    total?: number

    /**
     * Use descend order
     */
    descend?: boolean    
}