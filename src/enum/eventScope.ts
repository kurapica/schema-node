/**
 * The scope of the event.
 */
export enum EventScope
{
    /**
     * The workflow scope.
     */
    Workflow = "workflow",

    /**
     * The application scope.
     */
    Application = "application",

    /**
     * The server scope.
     */
    Server = "server",

    /**
     * The cluster scope.
     */
    Cluster = "cluster",
}

export type EventScopeValue = `${EventScope}`