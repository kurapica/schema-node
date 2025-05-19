import { ArraySchemaNode } from "../node/arrayNode"
import { RuleSchema } from "./ruleSchema"

export class ArrayRuleSchema extends RuleSchema
{
    /**
     * The element rule schema
     */
    element: RuleSchema

    /**
     * The constructor
     */
    constructor(ele: RuleSchema){
        super()
        this.element = ele
    }
}