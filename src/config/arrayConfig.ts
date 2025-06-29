import { ISchemaConfig } from "./schemaConfig"

export interface IArrayConfig extends ISchemaConfig
{
    /**
     * The array data is increase update
     * only usable in application
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