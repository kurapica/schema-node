export abstract class Rule {
    /**
     * The node type
     */
    type: string = ""
    
    /**
     * The default value
     */
    default?: any

    /**
     * Invisible
     */
    invisible?: boolean

    /**
     * Disable the node
     */
    disable?: boolean

    /**
     * Validation failed
     */
    error?: boolean

    /**
     * Already actived
     */
    _actived?: boolean

    /**
     * The active pushes
     */
    _activePushes?: (() => void)[]
}