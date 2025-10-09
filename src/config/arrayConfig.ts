import { ISchemaConfig } from "./schemaConfig"

export interface IArrayConfig extends ISchemaConfig
{
    /**
     * The array data is increase update
     * only usable in application
     */
    incrUpdate?: boolean

    /**
     * The query count for a page
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

    /**
     * The filter keys
     */
    filter?: { [key:string]: any }
}