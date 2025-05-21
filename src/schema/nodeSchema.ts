import { SchemaType } from "../enum/schemaType"
import { LocaleString } from "../utils/locale"
import { IArraySchema } from "./arraySchema"
import { IEnumSchema } from "./enumSchema"
import { IFunctionSchema } from "./functionSchema"
import { IScalarSchema } from "./scalarSchema"
import { IStructSchema } from "./structSchema"

/**
 * The data node schema
 * The schema is used to describe the data node
 */
export interface INodeSchema
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