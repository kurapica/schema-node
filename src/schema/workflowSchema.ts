import { WorkflowModeValue } from "../enum/workflowMode";

/**
 * Interface representing the schema of a workflow.
 */
export interface IWorkflowSchema {
    /**
     * The workflow mode
     */
    mode: WorkflowModeValue,

    /**
     * The payload schema type
     */
    payload?: string,

    /**
     * The state schema type
     */
    state?: string,

    /**
     * The session schema type
     */
    session?: string,
}