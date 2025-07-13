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
        rule.blackList = (Array.isArray(this.blackList) ? [...this.blackList] : this.blackList) as any
        rule.whiteList = (Array.isArray(this.whiteList) ? [...this.whiteList] : this.whiteList) as any
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
        this.whiteList = Array.isArray(config.whiteList) ? [...config.whiteList] : config.whiteList
        this.blackList = Array.isArray(config.blackList) ? [...config.blackList] : config.blackList
        this.anyLevel = config.anyLevel
        this.singleFlag = config.singleFlag
    }
}