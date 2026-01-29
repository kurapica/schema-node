import { IEntry, type IScalarConfig } from "../config/scalarConfig"
import { ScalarNode } from "../node/scalarNode"
import { NODE_SELF, regRuleSchema, RuleSchema } from "./ruleSchema"
import { type INodeSchema } from "../schema/nodeSchema"
import { SchemaType } from "../enum/schemaType"
import { callSchemaFunction, getCachedSchema } from "../utils/schemaProvider"
import { RelationType } from "../enum/relationType"

@regRuleSchema(SchemaType.Scalar)
export class ScalarRuleSchema extends RuleSchema
{
    /**
     * The entries for enum-like scalar values.
     */
    entries?: IEntry[]

    /**
     * The scalar white list
     */
    whiteList?: number[] | string[] | IEntry[]

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
     * The white list func used to init
     */
    whiteListFunc?: string

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
        rule.whiteList = this.whiteList?.length ? [...this.whiteList] as any : undefined
        rule.blackList = this.blackList?.length ? [...this.blackList] as any : undefined
        rule.entries =  this.entries?.length ? [...this.entries] : undefined
        rule.lowLimit = this.lowLimit
        rule.upLimit = this.upLimit
        rule.asSuggest = this.asSuggest
        rule.useOriginForUpLimit = this.useOriginForUpLimit

        // white list init
        if (this.whiteListFunc)
        {
            callSchemaFunction(this.whiteListFunc, []).then(r => {
                if (Array.isArray(r)) {
                    rule.whiteList = r
                    return node.notifyState()
                }
            })
        }
    }

    /**
     * load the config
     */
    override loadConfig(config: IScalarConfig): void {
        super.loadConfig(config)
        this.whiteList = config.whiteList?.length ? [...config.whiteList] as any : undefined
        this.blackList = config.blackList?.length ? [...config.blackList] as any : undefined
        this.entries = config.entries?.length ? [...config.entries] : undefined
        this.lowLimit = config.lowLimit
        this.upLimit = config.upLimit
        this.asSuggest = this.asSuggest || config.asSuggest
        this.useOriginForUpLimit = config.useOriginForUpLimit
    }

    constructor(schema: INodeSchema)
    {
        super(schema)
        this.lowLimit = schema.scalar?.lowLimit
        this.upLimit = schema.scalar?.upLimit
        this.asSuggest = schema.scalar?.asSuggest

        if (schema.scalar?.whiteList)
        {
            const funcInfo = getCachedSchema(schema.scalar.whiteList)
            if (funcInfo?.func?.args?.length)
            {
                this.pushSchemas ||= []
                this.pushSchemas.push({
                    func: schema.scalar.whiteList,
                    type: RelationType.WhiteList,
                    args: [ { field: NODE_SELF } ],
                    source: schema.name
                })
            }
            else
            {
                this.whiteListFunc = schema.scalar.whiteList
            }
        }
    }
}