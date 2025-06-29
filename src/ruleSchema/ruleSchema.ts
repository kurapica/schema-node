import { ISchemaConfig } from "../config/schemaConfig"
import { RelationType } from "../enum/relationType"
import { SchemaType } from "../enum/schemaType"
import { ArrayNode } from "../node/arrayNode"
import { EnumNode } from "../node/enumNode"
import { ScalarNode } from "../node/scalarNode"
import { AnySchemaNode } from "../node/schemaNode"
import { StructNode } from "../node/structNode"
import { INodeSchema } from "../schema/nodeSchema"
import { IStructFieldConfig } from "../schema/structSchema"
import { getSchema, NS_SYSTEM_BOOL, NS_SYSTEM_STRING } from "../utils/schemaProvider"
import { callSchemaFunction } from "../utils/schemaProvider"
import { debounce, isEqual, isNull } from "../utils/toolset"

/**
 * The field that point to array itself
 */
export const ARRAY_ITSELF = "$array"

/**
 * The rule schema for schema node
 */
export class RuleSchema {
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
     * For array element
     */
    isArrayElement?: boolean

    /**
     * The push schemas
     */
    pushSchemas?: ISchemaNodePushSchema[]

    /**
     * Active the rule schema for node
     */
    active(node: AnySchemaNode, init?: boolean) {
        // active once
        if (node.rule._actived) return
        node.rule._actived = true

        // active push schemas
        node.ruleSchema.pushSchemas?.forEach(p => activePushSchema(node, p))
    }

    /**
     * Init the node rule
     */
    initNode(node: AnySchemaNode) {
        const rule = node.rule
        rule.type = node.schemaName
        rule.default = this.default
        rule.invisible = this.invisible
        rule.disable = this.disable
    }

    /**
     * Load the config
     */
    loadConfig(config: ISchemaConfig) {
        this.default = config.default
        this.invisible = config.invisible
    }

    /**
     * Gets the child rule schema
     */
    getChildRuleSchema(node: AnySchemaNode): RuleSchema | null
    {
        return null
    }

    /**
     * construct from schema
     */
    constructor(schema: INodeSchema) {
    }
}

//#region decorator

const ruleSchemaMap: Record<string, new (schema: INodeSchema) => RuleSchema> = {}

/**
 * Register a document element
 */
export function regRuleSchema(type: SchemaType) {
    return function <T extends new (schema: INodeSchema) => RuleSchema>(constructor: T) {
      ruleSchemaMap[type] = constructor
    }
}

/**
 * Gets a ruleschema type by schema type
 */
export function getRuleSchemaType(type: SchemaType)
{
    return ruleSchemaMap[type]
}

//#endregion

//#region helper

/**
 * active
 */
function activePushSchema(node: AnySchemaNode, pushSchema: ISchemaNodePushSchema) {
    const args: ISchemaNodePushArg[] = pushSchema.args.map(a => {
        if (a.schema && a.field) {
            const nodePaths: AnySchemaNode[] = []
            let parent: AnySchemaNode | undefined = node

            // record the nodes on the path
            while (parent && parent.ruleSchema !== a.schema) {
                nodePaths.unshift(parent)
                parent = parent.parent
            }

            // locate the data node
            if (parent?.ruleSchema === a.schema) {
                nodePaths.unshift(parent)

                if (a.field === ARRAY_ITSELF) {
                    while (parent && parent.schemaType !== SchemaType.Array) {
                        parent = parent.parent
                    }
                    if (parent) {
                        return { node: parent, checkArrayNode: true, value: null }
                    }

                    // no way
                    console.error(`The node ${node.access} not in an array`)
                    return { value: a.value }
                }

                const paths = a.field!.split(".")
                let checkArrayNode = false
                let i = 0
                let ni = 1

                // locate the diff point
                for (; i < paths.length; i++, ni++) {
                    if (paths[i].toLowerCase() !== (nodePaths[ni].config as IStructFieldConfig).name.toLowerCase()) break
                    if (nodePaths[ni].schemaType === SchemaType.Array) {
                        // If the last is the array node
                        if (i === paths.length - 1) {
                            checkArrayNode = true
                        }
                        else 
                        {
                            ni++
                        }
                    }
                }

                // locate the rest path
                let valNode: AnySchemaNode | undefined = nodePaths[ni - 1]
                for (; i < paths.length; i++)
                    valNode = valNode instanceof StructNode
                        ? valNode.getField(paths[i])
                        : undefined

                if (valNode)
                {
                    return { node: valNode, checkArrayNode, value: null }
                }
            }

            console.error(`The node ${node.access} can't locate the relation node by path "${a.field}"`)
            return { value: a.value }
        }
        else {
            return { value: a.value }
        }
    })

    // define the value handler
    let handler: Function | undefined = undefined
    let type: string = ""

    switch (pushSchema.type)
    {
        case RelationType.Type:
            type = NS_SYSTEM_STRING
            if (node.parent instanceof StructNode)
            {
                handler = (res: any) => {
                    if (!isNull(res) && res.toLowerCase() !== node.rule.type.toLowerCase())
                    {
                        getSchema(res).then(schema => {
                            // replace the node
                            (node.parent as StructNode).rebuildField((node.config as IStructFieldConfig).name, schema.name)
                        })
                    }
                }
            }
            break

        case RelationType.Invisible:
            type = NS_SYSTEM_BOOL
            handler = (res: any) => {
                res = res ? true : false
                if (res !== node.rule.invisible)
                {
                    node.rule.invisible = res
                    node.notifyState()
                }
            }
            break
        
        case RelationType.Disable:
            type = NS_SYSTEM_BOOL
            handler = (res: any) => {
                res = res ? true : false
                if (res !== node.rule.disable)
                {
                    node.rule.disable = res
                    node.notifyState()
                }
            }
            break

        case RelationType.Default:
            if (node instanceof ArrayNode)
            {
                handler = (res: any) => {
                    if (!node.elements.length)
                        node.data = res
                }
            }
            else 
            {
                let dftval: any = node.ruleSchema.default
                handler = (res: any) => {
                    if (isNull(res)) res = dftval
                    const prev = node.rule.default
                    node.rule.default = res
                    if (!isNull(res) && (isNull(node.data) || isEqual(node.data, prev)))
                        node.data = res
                    node.notifyState()
                }
            }
            break

        case RelationType.Assign, RelationType.InitOnly:
            handler = (res: any) => {
                node.rule.default = res
                node.data = res
            }
            break
        
        case RelationType.LowLimit:
            if (node instanceof ScalarNode)
            {
                handler = (res: any) => {
                    node.rule.lowLimit = res
                    node.validation().finally(() => node.notifyState())
                }
            }
            break

        case RelationType.Uplimit:
            if (node instanceof ScalarNode)
            {
                handler = (res: any) => {
                    node.rule.upLimit = res
                    node.validation().finally(() => node.notifyState())
                }
            }
            break

        case RelationType.EnumRoot:
            if (node instanceof EnumNode)
            {
                handler = (res: any) => {
                    node.rule.root = res
                    node.validation().finally(() => node.notifyState())
                }
            }
            break

        case RelationType.BlackList:
            if (node instanceof EnumNode)
            {
                handler = (res: any) => {
                    node.rule.blackList = res
                    node.validation().finally(() => node.notifyState())
                }
            }
            break

        case RelationType.WhiteList:

            if (node instanceof ScalarNode)
            {
                handler = (res: any) => {
                    node.rule.whiteList = res
                    node.validation().finally(() => node.notifyState())
                }
            }
            else if (node instanceof EnumNode)
            {
                handler = (res: any) => {
                    node.rule.whiteList = res
                    node.validation().finally(() => node.notifyState())
                }
            }
            break
    }

    if (!handler) return

    // build the function
    const push = debounce(async function() {
        for (let retry = 0; retry < 5; retry++) {
            try {
                // call data func
                return handler(await callSchemaFunction(
                    pushSchema.func,
                    args.map((a, i) => {
                        if (a.node) {
                            let value = a.node.data
                            if (a.checkArrayNode) {
                                let n = node
                                while (n.parent && n.parent !== a.node)
                                    n = n.parent

                                const arrayIndex = (n.parent as ArrayNode).elements.findIndex(v => v === n)
                                if (Array.isArray(value) && arrayIndex >= 0)
                                    return value.slice(0, arrayIndex)
                                else
                                    return []
                            }
                            return value
                        }
                        else {
                            return a.value
                        }
                    }),
                    type,
                ))
            }
            catch (ex) {
                if (retry == 4) throw ex;
                console.error(ex)
                await new Promise(r => setTimeout(r, 200))
            }
        }
    }, 200)

    // subscribe
    if (pushSchema.type !== RelationType.InitOnly)
    {
        args.filter(a => a.node).forEach(a => {
            if (!a.node!.rule._actived)
                a.node!.activeRule()
            node.watch(a.node!, push)
        })
    }

    // process
    push()
}

//#endregion

//#region type

/**
 * The push schema
 */
export interface ISchemaNodePushSchema {
    /**
     * The function
     */
    func: string

    /**
     * The argument
     */
    args: ISchemaNodePushArgSchema[]

    /**
     * The realtion type
     */
    type: RelationType
}

/**
 * The push schema argument
 */
export interface ISchemaNodePushArgSchema {
    /**
     * The rule schema
     */
    schema?: RuleSchema

    /**
     * The access field
     */
    field?: string

    /**
     * The const value
     */
    value?: any
}

/**
 * The push argument
 */
export interface ISchemaNodePushArg {
    /**
     * The node
     */
    node?: AnySchemaNode

    /**
     * Whether check array node change
     */
    checkArrayNode?: boolean

    /**
     * The const value
     */
    value?: any
}

//#endregion