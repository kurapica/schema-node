import { StructSchemaNode } from "../node/structNode"
import { RuleSchema } from "./ruleSchema"

export class StructRuleSchema extends RuleSchema
{
    /**
     * The rule schema for fields
     */
    schemas: { [key: string]: RuleSchema } = {}
}