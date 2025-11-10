import { EventScopeValue } from "../enum/eventScope";

export interface IEventSchema {
    /**
     * The scope of the event.
     */
    scope: EventScopeValue

    /**
     * The payload schema type
     */
    payload?: string
}