import { ILocaleString } from "../utils/locale"
import { IFunctionCallArgument } from "./functionSchema"

/**
 * The application workflow schema
 */
export interface IAppWorkflowSchema
{
    /**
     * The application name
     */
    app: string

    /**
     * The field name
     */
    name: string

    /**
     * The display name
     */
    display?: ILocaleString

    /**
     * The description
     */
    desc?: ILocaleString

    /**
     * Whether the workflow is active
     */
    active: boolean

    /**
     * The workflow schema
     */
    nodes: IAppWorkflowNodeSchema[]
}

export interface IAppWorkflowNodeSchema
{
    /**
     * The node name
     */
    name: string

    /**
     * The display name
     */
    display?: ILocaleString

    /**
     * The workflow schema type
     */
    type: string

    /**
     * the workflow arguments
     */
    args?: IFunctionCallArgument[]

    /**
     * The workflow payload schema type
     */
    payload: string

    /**
     * The previous nodes
     */
    previous?: string[]

    /**
     * The function used in the node 
     */
    func?: string

    /**
     * The function arguments
     */
    funcArgs?: IFunctionCallArgument[]

    /**
     * The event used to trigger the node
     */
    event?: string

    /**
     * The state data
     */
    state?: any

    /**
     * Whether the node is a fork node
     */
    fork?: boolean

    /**
     * The fork key
     */
    forkKey?: string
}