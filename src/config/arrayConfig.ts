import { IAppDataFieldInfo } from "../schema/appSchema"
import { ISchemaConfig } from "./schemaConfig"

export interface IArrayConfig extends ISchemaConfig
{
    /**
     * The array data is increase update
     * only usable in application
     */
    incrUpdate?: boolean

    /**
     * The query field info
     */
    fieldInfo?: IAppDataFieldInfo
}