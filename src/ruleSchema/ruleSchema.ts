import { ISchemaNodeConfig } from "../config/schemaConfig"
import { RelationType } from "../enum/relationType"
import { SchemaType } from "../enum/schemaType"
import { ArraySchemaNode } from "../node/arrayNode"
import { EnumSchemaNode } from "../node/enumNode"
import { ScalarSchemaNode } from "../node/scalarNode"
import { AnySchemaNode } from "../node/schemaNode"
import { StructSchemaNode } from "../node/structNode"
import { ISchemaInfo } from "../schema/schemaInfo"
import { IStructFieldRelationInfo, IStructSchema } from "../schema/structSchema"
import { NS_SYSTEM_BOOL } from "../utils/schema"
import { callSchemaFunction, getCachedSchema } from "../utils/schemaProvider"
import { debounce, isEqual, isNull } from "../utils/toolset"
import { ArrayRuleSchema } from "./arrayRuleSchema"
import { EnumRulechema } from "./enumRuleSchema"
import { ScalarRuleSchema } from "./scalarRuleSchema"
import { StructRuleSchema } from "./structRuleSchema"

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
        if (node instanceof ArraySchemaNode) {
            if (node.enumArrayNode) {
                node.activeRule(init)
            }
            else {
                node.elements.forEach(e => e.activeRule(init))
            }
        }
        else if (node instanceof StructSchemaNode) {
            node.fields.forEach(f => f.activeRule(init))
        }

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
        rule.default = this.default
        rule.invisible = this.invisible
        rule.disable = this.disable
    }

    /**
     * Load the config
     */
    loadConfig(config: ISchemaNodeConfig) {
        this.default = config.default
        this.invisible = config.invisible
    }
}

/**
 * prepare the rule schema for node
 */
export function prepareRuleSchema(node: AnySchemaNode, parent?: AnySchemaNode): RuleSchema {
    parent = parent || node.parent
    const ruleSchema = (parent instanceof ArraySchemaNode
        ? parent.ruleSchema.element
        : parent instanceof StructSchemaNode
            ? parent.ruleSchema.schemas[node.config.name]
            : null)
        || buildRuleSchema(node.schemaInfo)

    // init rule
    ruleSchema.initNode(node)
    return ruleSchema
}

//#region helper

/**
 * Build the rule schema
 */
function buildRuleSchema(schemaInfo: ISchemaInfo): RuleSchema {
    if (schemaInfo.type == SchemaType.Array) {
        // The array and element share the rule schema
        const elementInfo = getCachedSchema(schemaInfo.array!.element)!
        const eleRuleSchema = buildRuleSchema(elementInfo)
        eleRuleSchema.isArrayElement = true

        // Register relations of the array
        if (elementInfo?.type === SchemaType.Struct && schemaInfo.array?.relations?.length) {
            for (let i = 0; i < schemaInfo.array.relations.length; i++) {
                registerRelation(eleRuleSchema as StructRuleSchema, schemaInfo.array.relations[i], elementInfo)
            }
        }
        return new ArrayRuleSchema(eleRuleSchema)
    }
    else if (schemaInfo.type == SchemaType.Struct) {
        const structTypeInfo = schemaInfo.struct!
        const schema = new StructRuleSchema()
        const schemas = schema.schemas

        // Register for each field
        for (let i = 0; i < structTypeInfo.fields.length; i++) {
            const f = structTypeInfo.fields[i]

            // build rule schema for each field
            const schema = buildRuleSchema(getCachedSchema(f.type)!)
            schemas[f.name] = schema
            schema.loadConfig(f)
        }

        // Register the realtions
        if (structTypeInfo.relations && structTypeInfo.relations.length > 0) {
            for (let i = 0; i < structTypeInfo.relations.length; i++) {
                registerRelation(schema, structTypeInfo.relations[i], schemaInfo)
            }
        }
        return schema
    }
    else if (schemaInfo.type == SchemaType.Scalar) {
        const schema = new ScalarRuleSchema()
        schema.lowLimit = schemaInfo.scalar?.lowLimit
        schema.upLimit = schemaInfo.scalar?.upLimit
        return schema
    }
    else if (schemaInfo.type === SchemaType.Enum) {
        return new EnumRulechema()
    }
    return new RuleSchema()
}

/**
 * Register Relation between fields
 */
function registerRelation(rootSchema: StructRuleSchema, relation: IStructFieldRelationInfo, info: ISchemaInfo) {
    const rootTypeInfo = info.struct!

    // locate the target
    const targetAccessPaths = getAccessPath(rootSchema, relation.field!, rootTypeInfo)
    if (!targetAccessPaths || targetAccessPaths.length == 0) {
        console.error(`The ${relation.field} can't be locate, please check the realtions in ${info.name} type`)
        return
    }

    // locate the refs
    const args: ISchemaNodePushArgSchema[] = []
    relation.funcArgs.forEach(a => {
        if (a.name) {
            // access path
            const accessPaths = getAccessPath(rootSchema, a.name, rootTypeInfo)
            if (accessPaths == null || accessPaths.length == 0 || !isPathAccessable(targetAccessPaths, accessPaths)) {
                console.error(`The ${relation.field} can access path "${a.name}", check the realtions in ${info.name} type`)
                return
            }

            // ref field
            args.push({ schema: rootSchema, field: a.name })
        }
        else {
            // const value
            args.push({ value: a.value })
        }
    })

    if (args.length < relation.funcArgs.length) {
        return
    }

    // register
    const targetSchema = targetAccessPaths[targetAccessPaths.length - 1].schema
    const pushSchema: ISchemaNodePushSchema = { func: relation.func, args, type: relation.relationType }
    targetSchema.pushSchemas = targetSchema.pushSchemas || []
    targetSchema.pushSchemas.push(pushSchema)
}

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
                    if (paths[i].toLowerCase() !== nodePaths[ni].config.name.toLowerCase()) break
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
                    valNode = valNode instanceof StructSchemaNode
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
            if (node instanceof ArraySchemaNode)
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
            if (node instanceof ScalarSchemaNode)
            {
                handler = (res: any) => {
                    node.rule.lowLimit = res
                    node.validate()
                    node.notify()
                }
            }
            break

        case RelationType.Uplimit:
            if (node instanceof ScalarSchemaNode)
            {
                handler = (res: any) => {
                    node.rule.upLimit = res
                    node.validate()
                    node.notify()
                }
            }
            break

        case RelationType.EnumRoot:
            if (node instanceof EnumSchemaNode)
            {
                handler = (res: any) => {
                    node.rule.root = res
                    node.validate().finally(() => {
                        node.notify()
                        node.notifyState()
                    })
                }
            }
            break

        case RelationType.EnumBlackList:
            if (node instanceof EnumSchemaNode)
            {
                handler = (res: any) => {
                    node.rule.blackList = res
                    node.validate().finally(() => {
                        node.notify()
                        node.notifyState()
                    })
                }
            }
            break

        case RelationType.EnumWhiteList:

            if (node instanceof ScalarSchemaNode)
            {
                handler = (res: any) => {
                    node.rule.whiteList = res
                    node.validate()
                    node.notify()
                    node.notifyState()
                }
            }
            else if (node instanceof EnumSchemaNode)
            {
                handler = (res: any) => {
                    node.rule.whiteList = res
                    node.validate().finally(() => {
                        node.notify()
                        node.notifyState()
                    })
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

                                const arrayIndex = (n.parent as ArraySchemaNode).elements.findIndex(v => v === n)
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

/**
 * Get the access path
 */
function getAccessPath(rootSchema: StructRuleSchema, path: string, rootTypeInfo: IStructSchema): IFieldAccessPath[] {
    // Check the array
    if (path.toLocaleLowerCase() === ARRAY_ITSELF) {
        if (rootSchema.isArrayElement) {
            return [{
                name: ARRAY_ITSELF,
                schema: rootSchema
            }]
        }
        else {
            return []
        }
    }

    // The access path
    const paths = path.toLowerCase().split(".").filter(s => !isNull(s))
    const accessPaths: IFieldAccessPath[] = []
    if (!paths || paths.length == 0 || !rootTypeInfo.fields || rootTypeInfo.fields.length == 0) return accessPaths

    // Gets the start
    let field = rootTypeInfo.fields?.find(f => f.name.toLowerCase() == paths[0])
    let fieldType = field ? getCachedSchema(field.type) : null
    if (!field || !fieldType) return accessPaths

    // init
    let schema = rootSchema.schemas![field.name]
    accessPaths.push({ name: field.name, schema })

    // rest
    for (let i = 1; i < paths.length; i++) {
        // array count the same with element
        if (fieldType?.type == SchemaType.Array) {
            fieldType = getCachedSchema(fieldType.array!.element)
        }

        if (fieldType?.type == SchemaType.Struct) {
            field = fieldType.struct!.fields?.find(f => f.name.toLowerCase() == paths[i])
            fieldType = field ? getCachedSchema(field.type) : null
            if (!field || !fieldType) return []

            schema = (schema as StructRuleSchema).schemas![field.name]
            accessPaths.push({ name: field.name, schema: schema })
        }
        else {
            return []
        }
    }

    return accessPaths
}

/**
 * Check if the path accessable
 */
function isPathAccessable(accessor: IFieldAccessPath[], target: IFieldAccessPath[]): boolean {
    // Skip the same path
    let i = 0;
    for (; i < Math.min(accessor.length, target.length); i++) {
        if (accessor[i].name !== target[i].name) break
    }

    // Check the array node
    for (; i < target.length - 1; i++) {
        if (target[i].schema.isArrayElement) {
            return false
        }
    }

    return true
}

//#endregion

//#region inner types

/**
 * The field access path
 */
interface IFieldAccessPath {
    /**
     * The path
     */
    name: string,

    /**
     * The relation schema
     */
    schema: RuleSchema,
}

/**
 * The push schema
 */
interface ISchemaNodePushSchema {
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
interface ISchemaNodePushArgSchema {
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
interface ISchemaNodePushArg {
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