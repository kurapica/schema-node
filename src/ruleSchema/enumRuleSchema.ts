import { IEnumConfig } from "../config/enumConfig"
import { SchemaType } from "../enum/schemaType"
import { EnumNode } from "../node/enumNode"
import { regRuleSchema, RuleSchema } from "./ruleSchema"

@regRuleSchema(SchemaType.Enum)
export class EnumRulechema extends RuleSchema
{
    /**
     * The enum root
     */
    root?: string | number

    /**
     * The enum cascade limit
     */
    cascade?: number

    /**
     * The enum black list
     */
    blackList?: number[] | string[]

    /**
     * The enum white list
     */
    whiteList?: number[] | string[]

    /**
     * The enum can choose any cascade level value
     */
    anyLevel?: boolean

    /**
     * No combine value for flag enum
     */
    singleFlag?: boolean

    /**
     * init the node rule
     */
    override initNode(node: EnumNode)
    {
        super.initNode(node)
        const rule = node.rule
        rule.root = this.root
        rule.cascade = this.cascade
        rule.blackList = (this.blackList ? [...this.blackList] : undefined) as any
        rule.whiteList = (this.whiteList ? [...this.whiteList] : undefined) as any
        rule.anyLevel = this.anyLevel
        this.singleFlag = this.singleFlag
    }

    /**
     * load the config
     */
    override loadConfig(config: IEnumConfig): void {
        super.loadConfig(config)
        this.cascade = config.cascade
        this.root = config.root
        this.whiteList = config.whiteList ? [...config.whiteList] : undefined
        this.blackList = config.blackList ? [...config.blackList] : undefined
        this.anyLevel = config.anyLevel
        this.singleFlag = config.singleFlag
    }
}