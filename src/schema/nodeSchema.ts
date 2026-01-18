import { type SchemaNodeStatusValue } from "../enum/schemaNodeStatus"
import { SchemaType, type SchemaTypeValue } from "../enum/schemaType"
import { type ILocaleString } from "../utils/locale"
import { type IArraySchema } from "./arraySchema"
import { type IEnumSchema } from "./enumSchema"
import { type IEventSchema } from "./eventSchema"
import { type IFunctionSchema } from "./functionSchema"
import { type IPolicySchema } from "./policySchema"
import { type IScalarSchema } from "./scalarSchema"
import { type IStructSchema } from "./structSchema"
import { type IWorkflowSchema } from "./workflowSchema"

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
     * The event schema if type is event
     */
    event?: IEventSchema

    /**
     * The workflow schema if type is workflow
     */
    workflow?: IWorkflowSchema

    /**
     * The permission policy schema
     */
    policy?: IPolicySchema

    /**
     * The policy type for the schema
     */
    auth?: string

    /**
     * The compatible schema conversions
     */
    compatibles?: { to: string, convert: string }[]

    /**
     * The sub schemas of of the namespace
     */
    schemas?: INodeSchema[]

    /**
     * Has sub schemas
     */
    hasSchemas?: boolean

    /**
     * The schema info is loaded from server
     */
    loadState?: SchemaLoadState

    /**
     * Already loaded from the server
     */
    loaded?: boolean

    /**
     * The schema node status for diagnosis
     */
    status?: SchemaNodeStatusValue

    /**
     * The schema is used provided by the server
     */
    used?: boolean

    /**
     * The schema is used by other schemas
     */
    usedBy?: string[]

    /**
     * The schema is used by applications
     */
    usedByApp?: string[]


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
        if (typeof(s?.loadState) === "string")
        {
            s.loadState = schemaLoadStateMap[(s.loadState as string).toLowerCase()] || undefined
        }
        if (s?.type === SchemaType.Namespace)
        {
            PrepareServerSchemas(s.schemas)
        }
    })
}