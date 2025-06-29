export abstract class Rule {
    /**
     * The node type
     */
    type: string
    
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
     * Already actived
     */
    _actived?: boolean
}