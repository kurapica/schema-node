/// <summary>
/// The workflow status enum

import { WorkflowMode } from "./workflowMode";

/// </summary>
export enum WorkflowStatus
{
    Waiting,
    Running,
    Done,
    Error,
    Terminated
}

export type WorkflowModeValue = `${WorkflowMode}`