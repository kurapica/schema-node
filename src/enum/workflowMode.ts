/**
 * The workflow mode
 */
export enum WorkflowMode {
    /**
     * A standard workflow
     */
    Workflow = 'workflow',

    /**
     * A function workflow
     */
    Function = 'function',

    /**
     * An event workflow
     */
    Event = 'event',

    /**
     * An interaction workflow
     */
    Interaction = 'interaction',
}

export type WorkflowModeValue = `${WorkflowMode}`