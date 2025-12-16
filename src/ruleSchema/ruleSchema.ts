import { type ISchemaConfig } from "../config/schemaConfig"
import { RelationType, type RelationTypeValue } from "../enum/relationType"
import { SchemaType } from "../enum/schemaType"
import { AppNode } from "../node/appNode"
import { ArrayNode } from "../node/arrayNode"
import { EnumNode } from "../node/enumNode"
import { ScalarNode } from "../node/scalarNode"
import { type AnySchemaNode } from "../node/schemaNode"
import { StructNode } from "../node/structNode"
import { type INodeSchema } from "../schema/nodeSchema"
import { getSchema, NS_SYSTEM_BOOL, NS_SYSTEM_STRING } from "../utils/schemaProvider"
import { callSchemaFunction } from "../utils/schemaProvider"
import { clearDebounce, debounce, deepClone, generateGuid, isEqual, isNull } from "../utils/toolset"

/**
 * The field that point to array itself
 */
export const ARRAY_ITSELF = "$array"
export const ARRAY_ELEMENT = "$ele"
export const NODE_SELF = "$self"

/**
 * The rule schema for schema node
 */
export class RuleSchema {

    /**
     * The guid of the node.
     */
    readonly guid: string = generateGuid()

    /**
     * The schema type
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
        node.ruleSchema.pushSchemas?.forEach(p => activePushSchema(node, p, init))
    }

    /**
     * Deactive the rule schema for node
     */
    deactive(node: AnySchemaNode) {
        node.clearWatch()
        node.rule._actived = false
        node.rule._activePushes?.forEach(clearDebounce)
        node.rule._activePushes = undefined
    }

    /**
     * Init the node rule
     */
    initNode(node: AnySchemaNode) {
        const rule = node.rule
        rule.type = node.schemaName
        rule.default = this.default
        rule.invisible = this.invisible || this.pushSchemas?.some(p => p.type === RelationType.Visible) || undefined
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
    getChildRuleSchema(_: AnySchemaNode): RuleSchema | null
    {
        return null
    }

    /**
     * construct from schema
     */
    constructor(schema: INodeSchema) {
        this.type = schema.name
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
 * Gets the rule schema by schema
 */
export function getRuleSchema(schema: INodeSchema)
{
    // rebuild
    const ctor = ruleSchemaMap[schema.type] || RuleSchema
    return new ctor(schema)
}

//#endregion

//#region helper

/**
 * active
 */
function activePushSchema(node: AnySchemaNode, pushSchema: ISchemaNodePushSchema, init?: boolean) {
    const args: ISchemaNodePushArg[] = pushSchema.args.map(a => {
        if (a.field === NODE_SELF)
        {
            return { node }
        }
        else if (a.schema && a.field) {
            const nodePaths: AnySchemaNode[] = []
            let parent: AnySchemaNode | undefined = node

            // record the nodes on the path
            while (parent && parent.ruleSchema?.guid !== a.schema.guid) {
                nodePaths.unshift(parent)
                parent = parent.parent
            }

            // locate the data node
            if (parent?.ruleSchema?.guid === a.schema.guid) {
                nodePaths.unshift(parent)

                if (a.field === ARRAY_ITSELF) {
                    while (parent && parent.schemaType !== SchemaType.Array) {
                        parent = parent.parent
                    }
                    if (parent) {
                        return { checkArrayNode: true, value: null, node: parent }
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
                    if (paths[i].toLowerCase() !== nodePaths[ni].name.toLowerCase()) break
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
                    valNode = (valNode instanceof StructNode || valNode instanceof AppNode)
                        ? valNode.getField(paths[i])
                        : undefined

                if (valNode)
                    return { node: valNode, checkArrayNode, value: null }
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
    let inited = false

    switch (pushSchema.type)
    {
        case RelationType.Type:
            type = NS_SYSTEM_STRING
            if (node.parent instanceof StructNode)
            {
                handler = (res: any) => {
                    if (!isNull(res) && typeof(res) === "string" && res.toLowerCase() !== node.rule.type.toLowerCase())
                    {
                        getSchema(res).then(schema => {
                            if (!schema) return
                            // replace the node
                            (node.parent as StructNode).rebuildField(node.name, schema.name)
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

                    if (node instanceof ArrayNode && node.enumNode)
                    {
                        node.enumNode.rule.invisible = res
                        node.enumNode.notifyState()
                    }
                }
            }
            break

        case RelationType.Visible:
            type = NS_SYSTEM_BOOL

            // default invisible
            node.rule.invisible = true
            node.notifyState()

            if (node instanceof ArrayNode && node.enumNode)
            {
                node.enumNode.rule.invisible = true
                node.enumNode.notifyState()
            }

            handler = (res: any) => {
                res = !(res ? true : false)
                if (res !== node.rule.invisible)
                {
                    node.rule.invisible = res
                    node.notifyState()

                    if (node instanceof ArrayNode && node.enumNode)
                    {
                        node.enumNode.rule.invisible = res
                        node.enumNode.notifyState()
                    }
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

                    if (node instanceof ArrayNode && node.enumNode)
                    {
                        node.enumNode.rule.disable = res
                        node.enumNode.notifyState()
                    }
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
            else if (node instanceof StructNode)
            {
                handler = (res: any) => {
                    const prev = node.rule.default
                    node.rule.default = deepClone(res)
                    if (!isNull(res) && (node.isEmpty || isEqual(node.data, prev)))
                        node.data = res
                    node.notifyState()
                }
            }
            else
            {
                let dftval: any = node.ruleSchema.default
                handler = (res: any) => {
                    if (isNull(res)) res = dftval
                    const prev = node.rule.default
                    node.rule.default = res
                    if (!isNull(res) && (node.isEmpty || isEqual(node.data, prev)))
                        node.data = res
                    node.notifyState()
                }

                // check display only, they should be handled when batch query, don't work for complex relation now
                if (node.config.displayOnly && !isNull(node.data))
                    inited = true
            }
            break

        case RelationType.Assign:
        case RelationType.InitOnly:
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

        case RelationType.UpLimit:
            if (node instanceof ScalarNode)
            {
                handler = (res: any) => {
                    if (node.isNumber && node.rule.useOriginForUpLimit)
                    {
                        const origin = node.original
                        if (isFinite(res) && isFinite(origin))
                        {
                            res = res + origin
                        }
                    }
                        
                    node.rule.upLimit = res
                    node.validation().finally(() => node.notifyState())
                }
            }
            break

        case RelationType.Root:
            if (node instanceof EnumNode || node instanceof ScalarNode)
            {
                handler = (res: any) => {
                    node.rule.root = res
                    node.validation().finally(() => node.notifyState())
                }
            }
            else if (node instanceof ArrayNode && node.enumNode){
                handler = (res: any) => {
                    node.enumNode!.rule.root = res
                    node.enumNode!.validation().finally(() => node.enumNode!.notifyState())
                }
            }
            break

        case RelationType.BlackList:
            if (node instanceof ScalarNode || node instanceof EnumNode)
            {
                handler = (res: any) => {
                    node.rule.blackList = Array.isArray(res) ? res.filter(r => !isNull(res)) : res
                    node.validation().finally(() => node.notifyState())
                }
            }
            else if (node instanceof ArrayNode && node.enumNode)
            {
                handler = (res: any) => {
                    node.enumNode!.rule.blackList = Array.isArray(res) ? res.filter(r => !isNull(res)) : res
                    node.enumNode!.validation().finally(() => node.enumNode!.notifyState())
                }
            }
            break

        case RelationType.WhiteList:
            if (node instanceof ScalarNode || node instanceof EnumNode)
            {
                handler = (res: any) => {
                    node.rule.whiteList = Array.isArray(res) ? res.filter(r => !isNull(r)) : res
                    node.validation().finally(() => node.notifyState())
                }
            }
            else if (node instanceof ArrayNode && node.enumNode)
            {
                handler = (res: any) => {
                    node.enumNode!.rule.whiteList = Array.isArray(res) ? res.filter(r => !isNull(res)) : res
                    node.enumNode!.validation().finally(() => node.enumNode!.notifyState())
                }
            }
            break
        
        case RelationType.AnyLevel:
            if (node instanceof EnumNode)
            {
                handler = (res: any) => {
                    node.rule.anyLevel = res
                    node.validation().finally(() => node.notifyState())
                }
            }
            else if (node instanceof ArrayNode && node.enumNode)
            {
                handler = (res: any) => {
                    node.enumNode!.rule.anyLevel = res
                    node.enumNode!.validation().finally(() => node.enumNode!.notifyState())
                }
            }
            break

        case RelationType.Cascade:
            if (node instanceof EnumNode)
            {
                handler = (res: any) => {
                    node.rule.cascade = res
                    node.validation().finally(() => node.notifyState())
                }
            }
            else if (node instanceof ArrayNode && node.enumNode)
            {
                handler = (res: any) => {
                    node.enumNode!.rule.cascade = res
                    node.enumNode!.validation().finally(() => node.enumNode!.notifyState())
                }
            }
            break

        case RelationType.SingleFlag:
            if (node instanceof EnumNode)
            {
                handler = (res: any) => {
                    node.rule.singleFlag = res
                    node.validation().finally(() => node.notifyState())
                }
            }
            break

        case RelationType.Validation:
            if (node instanceof EnumNode || node instanceof ScalarNode)
            {
                handler = (res: any) => {
                    if (!res)
                    {
                        if (!node.rule.error)
                        {
                            node.rule.error = true
                            node.validation().finally(() => node.notifyState())
                        }
                    }
                    else if (node.rule.error)
                    {
                        node.rule.error = undefined
                        node.validation().finally(() => node.notifyState())
                    }
                }
            }
    }

    if (!handler) return

    // build the function
    const push = debounce(async function() {
        let root = node
        while (root.parent) root = root.parent
        let target: string | undefined = undefined

        // find the app node
        if (root instanceof AppNode)
            target = root.target

        for (let retry = 0; retry < 5; retry++) {
            try {
                // call data func
                return handler(await callSchemaFunction(
                    pushSchema.func,
                    args.map(a => {
                        if (a.node) {
                            let value = a.node.rawData
                            if (a.checkArrayNode) {
                                let n = node
                                while (n.parent && n.parent !== a.node)
                                    n = n.parent

                                if (!n.parent)
                                {
                                    n = node
                                    while (n.parent && !(n.parent instanceof ArrayNode))
                                        n = n.parent
                                }

                                const arrayIndex = (n.parent as ArrayNode).indexof(n) as number
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
                    [type],
                    target
                ))
            }
            catch (ex) {
                if (retry == 4) throw ex;
                console.error(ex)
                await new Promise(r => setTimeout(r, 200))
            }
        }
    }, 500)

    // subscribe
    if (pushSchema.type !== RelationType.InitOnly)
    {
        node.rule._activePushes = node.rule._activePushes || []
        node.rule._activePushes.push(push)

        args.filter(a => a.node).forEach(a => {
            if (!a.node) return
            a.node.activeRule()
            if (a.node.parent instanceof StructNode)
            {
                const name = a.node.name
                if (a.node.parent.isFieldChangable(name))
                {
                    let handler = a.node.subscribe(push)
                    a.node.parent.subscribeMemberChange((n: string) => {
                        if (n !== name) return
                        handler()
                        a.node = (a.node!.parent as StructNode).getField(name)
                        handler = a.node!.subscribe(push)
                    })
                }
            }
            node.watch(a.node!, push)
        })
    }
    else if(!init)
        return

    // process
    if (!inited) push()
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
    type: RelationTypeValue

    /**
     * The schema source
     */
    source: string
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