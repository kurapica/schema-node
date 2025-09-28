import { SchemaType, SchemaTypeValue } from "../enum/schemaType"
import { ILocaleString } from "../utils/locale"
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
    type: SchemaTypeValue

    /**
     * The schema description
     */
    display?: ILocaleString

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
    func?: IFunctionSchema

    /**
     * The sub schemas of of the namespace
     */
    schemas?: INodeSchema[]

    /**
     * The schema info is loaded from server
     */
    loadState?: SchemaLoadState

    /**
     * Already loaded from the server
     */
    loaded?: boolean
}

/**
 * The schema load state
 */
export enum SchemaLoadState {
    /**
     * From remote server
     */
    Remote = 16,

    /**
     * system defined
     */
    System = 8,

    /**
     * Register by frontend
     */
    Frontend = 4,

    /**
     * Custom defined
     */
    Custom = 2,

    /**
     * Loaded from server
     */
    Server = 1,
}

const schemaLoadStateMap: Record<string, SchemaLoadState> = {
  remote: SchemaLoadState.Remote,
  system: SchemaLoadState.System,
  frontend: SchemaLoadState.Frontend,
  custom: SchemaLoadState.Custom,
  server: SchemaLoadState.Server,
};

export function PrepareServerSchemas(schemas?: INodeSchema[])
{
    if (!schemas?.length) return
    schemas.forEach(s => {
        if (typeof(s.loadState) === "string")
        {
            s.loadState = schemaLoadStateMap[(s.loadState as string).toLowerCase()] || undefined
        }
        if (s.type === SchemaType.Namespace)
        {
            PrepareServerSchemas(s.schemas)
        }
    })
}