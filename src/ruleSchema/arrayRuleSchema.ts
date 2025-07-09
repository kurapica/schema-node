import { SchemaType } from "../enum/schemaType"
import { ArrayNode } from "../node/arrayNode"
import { AnySchemaNode } from "../node/schemaNode"
import { INodeSchema } from "../schema/nodeSchema"
import { getCachedSchema } from "../utils/schemaProvider"
import { getRuleSchema, regRuleSchema, RuleSchema } from "./ruleSchema"
import { StructRuleSchema } from "./structRuleSchema"

@regRuleSchema(SchemaType.Array)
export class ArrayRuleSchema extends RuleSchema
{
    /**
     * The element rule schema
     */
    element: RuleSchema

    /**
     * Active the rule schema for node
     */
    override active(node: ArrayNode, init?: boolean) {
        super.active(node, init)
        if (node.enumArrayNode) {
            node.enumArrayNode.activeRule(init)
        }
        else {
            node.elements.forEach(e => e.activeRule(init))
        }
    }

    /**
     * Deactive the rule schema
     */
    override deactive(node: ArrayNode): void {
        if (node.enumArrayNode) {
            node.enumArrayNode.deactiveRule()
        }
        else {
            node.elements.forEach(e => e.deactiveRule())
        }

        return super.deactive(node)
    }

    /**
     * Gets the child rule schema
     */
    override getChildRuleSchema(node: AnySchemaNode): RuleSchema | null
    {
        return this.element
    }
    
    /**
     * The constructor
     */
    constructor(schema: INodeSchema, path: string = "",  ruleFields: string[] = []){
        super(schema)
        
        // remove
        ruleFields = ruleFields.filter(r => r !== "")
        if (!ruleFields.length) path = ""

        // The array and element share the rule schema
        const elementInfo = getCachedSchema(schema.array!.element)!

        // update rule fields
        ruleFields = [...ruleFields]
        schema.array?.relations?.forEach(r => {
            if (ruleFields.includes(r.field)) return
            ruleFields.push(r.field)
        })

        // element rule schema
        const eleRuleSchema = getRuleSchema(elementInfo, path, ruleFields)
        eleRuleSchema.isArrayElement = true
        this.element = eleRuleSchema

        // Register relations of the array
        if (eleRuleSchema instanceof StructRuleSchema && schema.array?.relations?.length) {
            for (let i = 0; i < schema.array.relations.length; i++) {
                eleRuleSchema.regRelation(schema.array.relations[i])
            }
        }
    }
}