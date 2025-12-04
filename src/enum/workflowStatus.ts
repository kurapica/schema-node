/// <summary>
/// The workflow status enum

import { WorkflowMode } from "./workflowMode";

/// </summary>
export enum WorkflowStatus
{
    Waiting = "waiting",
    Running = "running",
    Done = "done",
    Error = "error",
    Terminated = "terminated"
}

export type WorkflowModeValue = `${WorkflowMode}`