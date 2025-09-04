import { ISchemaConfig } from "./schemaConfig"

export interface IArrayConfig extends ISchemaConfig
{
    /**
     * The array data is increase update
     * only usable in application
     */
    isIncrUpdate?: boolean

    /**
     * The query count for a page
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