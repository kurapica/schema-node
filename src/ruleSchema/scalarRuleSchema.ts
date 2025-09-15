import { splitVendorChunkPlugin } from "vite"
import { IScalarConfig } from "../config/scalarConfig"
import { ISchemaConfig } from "../config/schemaConfig"
import { ScalarNode } from "../node/scalarNode"
import { regRuleSchema, RuleSchema } from "./ruleSchema"
import { INodeSchema } from "../schema/nodeSchema"
import { SchemaType } from "../enum/schemaType"

@regRuleSchema(SchemaType.Scalar)
export class ScalarRuleSchema extends RuleSchema
{
    /**
     * The scalar white list
     */
    whiteList?: number[] | string[] | { value: any, label: string }[]

    /**
     * The black list
     */
    blackList?: string[] | number[]
    
    /**
     * The low limit
     */
    lowLimit?: any

    /**
     * The up limit
     */
    upLimit?: any

    /**
     * The whilte list is only a suggest
     */
    asSuggest?: boolean

    /**
     * Calc the origin value for up limit
     */
    useOriginForUpLimit?: boolean

    /**
     * init the node rule
     */
    override initNode(node: ScalarNode)
    {
        super.initNode(node)
        const rule = node.rule
        rule.whiteList = this.whiteList ? [...this.whiteList] as any : undefined
        rule.blackList = this.blackList ? [...this.blackList] as any : undefined
        rule.lowLimit = this.lowLimit
        rule.upLimit = this.upLimit
        rule.asSuggest = this.asSuggest
        rule.useOriginForUpLimit = this.useOriginForUpLimit
    }

    /**
     * load the config
     */
    override loadConfig(config: IScalarConfig): void {
        super.loadConfig(config)
        this.whiteList = config.whiteList ? [...config.whiteList] as any : undefined
        this.blackList = config.blackList ? [...config.blackList] as any : undefined
        this.lowLimit = config.lowLimit
        this.upLimit = config.upLimit
        this.asSuggest = config.asSuggest
        this.useOriginForUpLimit = config.useOriginForUpLimit
    }

    constructor(schema: INodeSchema)
    {
        super(schema)
        this.lowLimit = schema.scalar?.lowLimit
        this.upLimit = schema.scalar?.upLimit
    }
}