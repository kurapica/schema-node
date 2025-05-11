import { SchemaType } from "../enum/schemaType"
import { ISchemaNodeConfig } from "./schemaNodeConfig"
import { ISchemaNodeRule, ISchemaNodeRuleSchema } from "./schemaNodeRule"

/**
 * The schema node interface.
 */
export default interface ISchemaNode 
{
    //#region Properties

    /**
     * The schema type of the node.
     */
    schemaType: SchemaType

    /**
     * The config of the node.
     */
    config: ISchemaNodeConfig

    //#endregion

    //#region Data State

    /**
     * The data of the node.
     */
    data: any

    /**
     * The data is changed.
     */
    changed: boolean

    /**
     * The data is valid.
     */
    valid: boolean

    /**
     * The error data of the node.
     */
    error?: any

    //#endregion

    //#region Relationships

    /**
     * The parent node of the node.
     */
    parent?: ISchemaNode

    /**
     * The schema node rule
     */
    rule: ISchemaNodeRule

    /**
     * The schema node rule schema
     */
    ruleSchema: ISchemaNodeRuleSchema
    
    //#endregion

    //#region Methods

    /**
     * Reset the change state of the node and children.
     */
    resetChanges(): void

    /**
     * Re-calc the valid state of the node and children.
     */
    validate(): void

    /**
     * Dispose the node and children.
     */
    dispose(): void

    /**
     * Subscribe a data change handler
     */
    subscribe(func: Function): Function

    //#endregion
}