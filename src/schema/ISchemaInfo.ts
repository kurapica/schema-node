import { SchemaType } from "../enum/SchemaType"
import { LocaleString } from "../utils/Locale"
import { IArraySchema } from "./IArraySchema"
import { IEnumSchema } from "./IEnumSchema"
import { IFunctionSchema } from "./IFunctionSchema"
import { IScalarSchema } from "./IScalarSchema"
import { IStructSchema } from "./IStructSchema"

/**
 * The schema information
 */
export interface ISchemaInfo
{
    /**
     * The schema name
     */
    name: string

    /**
     * The schema type
     */
    type: SchemaType

    /**
     * The schema description
     */
    desc?: string | LocaleString

    /**
     * The scalar schema if type is scalar
     */
    scalar?: IScalarSchema

    /**
     * The enum schema if type is enum
     */
    enum?: IEnumSchema

    /**
     * The struct schema if type is struct
     */
    struct?: IStructSchema

    /**
     * The array schema if type is array
     */
    array?: IArraySchema

    /**
     * The function schema if type is function
     */
    function?: IFunctionSchema
}