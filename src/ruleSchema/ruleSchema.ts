import { ISchemaNodeConfig } from "../config/schemaConfig"
import { RelationType } from "../enum/relationType"
import { SchemaType } from "../enum/schemaType"
import { ArraySchemaNode } from "../node/arrayNode"
import { SchemaNode } from "../node/schemaNode"
import { StructSchemaNode } from "../node/structNode"
import { Rule } from "../rule/rule"
import { ISchemaInfo } from "../schema/schemaInfo"
import { IStructFieldRelationInfo, IStructSchema } from "../schema/structSchema"
import { getCachedSchema } from "../utils/schemaProvider"
import { isNull } from "../utils/toolset"
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
    active(node: SchemaNode<ISchemaNodeConfig, RuleSchema, Rule>, init?: boolean)
    {

    }

    /**
     * Init the node rule
     */
    initNode(node: SchemaNode<ISchemaNodeConfig, RuleSchema, Rule>)
    {
        const rule = node.rule
        rule.default = this.default
        rule.invisible = this.invisible
        rule.disable = this.disable
    }

    /**
     * Load the config
     */
    loadConfig(config: ISchemaNodeConfig)
    {
        this.default = config.default
        this.invisible = config.invisible
    }
}

/**
 * prepare the rule schema for node
 */
export function prepareRuleSchema(node: SchemaNode<ISchemaNodeConfig, RuleSchema, Rule>, parent?: SchemaNode<ISchemaNodeConfig, RuleSchema, Rule>): RuleSchema {
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
    else if (schemaInfo.type === SchemaType.Enum)
    {
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
 * 构建推送数据
 */
function useTypeDataPush(node: SchemaNode<ISchemaNodeConfig, RuleSchema, Rule>, pushSchema: ISchemaNodePushSchema, type?: string, dftval?: any): any {
    // 从父节点拿取依赖节点的数据
    return useTypeDataPushResult(
        node,
        pushSchema.func,
        pushSchema.args.map(argSchema => {
            if (argSchema.schema && argSchema.field) {
                // 查询schema对应的父节点，拿到根数据容器
                const nodePaths: ISchemaNode[] = []
                let parent: ISchemaNode | null = node

                // 记录所有路过的节点
                while (parent && parent.ruleSchema !== argSchema.schema) {
                    nodePaths.unshift(parent)
                    parent = parent.parent
                }

                // 定位数据容器
                if (parent && parent.ruleSchema === argSchema.schema) {
                    nodePaths.unshift(parent)

                    if (argSchema.field === ARRAY_ITSELF) {
                        while (parent && parent.dataNodeType !== SchemaType.Array) {
                            parent = parent.parent
                        }
                        if (parent) {
                            return { node: parent, checkArrayNode: true, value: null }
                        }
                        else {
                            console.error(`定位${node.name}(${node.type})依赖的数组节点失败`)
                        }
                    }

                    const paths = argSchema.field!.split(".")
                    let checkArrayNode = false
                    let i = 0
                    let ni = 1

                    // 定位分歧点
                    for (; i < paths.length; i++, ni++) {
                        if (paths[i] !== nodePaths[ni].name) break;
                        if (nodePaths[ni].dataNodeType === SchemaType.Array) {
                            // 检查是否定位到整个数组
                            if (i === paths.length - 1) {
                                checkArrayNode = true
                            }
                            else {
                                ni++
                            }
                        }
                    }

                    // 定位数据节点
                    let valNode: ISchemaNode = nodePaths[ni - 1]
                    for (; i < paths.length; i++)
                        valNode = (valNode as StructDataNode).getField(paths[i])!

                    return { node: valNode, checkArrayNode, value: null }
                }
                else {
                    console.error(`定位${node.name}(${node.type})依赖的父节点失败`)
                }

                return { value: argSchema.value }
            }
            else {
                return { value: argSchema.value }
            }
        }),
        type,
        pushSchema.target,
        dftval
    )
}

/**
 * 生成推送用数据
 */
function useTypeDataPushResult(node: ISchemaNode, func: string, args: ITypeDataPushArg[], type?: string, needtarget?: boolean, dftval?: any) {
    // 返回对象
    const result = ref<any>(dftval)
    let target: string | undefined = undefined

    if (needtarget) {
        let parent: ISchemaNode | null = node
        while (parent && parent.dataNodeType !== SchemaType.Namspace)
            parent = parent.parent
        if (parent)
            target = (parent as CategoryNode).target

        if (!target)
            return result
    }

    // 获取模型数据和结构
    const doFetch = debounce(async function () {
        for (let retry = 0; retry < 5; retry++) {
            if (node.destroyed) return

            try {
                // 请求
                const res = await callDataDictFunc(
                    func,
                    args.map((a, i) => {
                        if (a.node) {
                            let value = a.node.calcData
                            if (isRef(value)) value = value.value
                            if (a.checkArrayNode) {
                                let n = node
                                while (n.parent && n.parent !== a.node)
                                    n = n.parent
                                if (n && n.parent) {
                                    const arrayIndex = (n.parent as ArrayDataNode).elements.findIndex(v => v === n)
                                    if (Array.isArray(value) && arrayIndex >= 0)
                                        return value.slice(0, arrayIndex)
                                    else
                                        return []
                                }
                                else {
                                    console.warn(`${node.display || node.name}和${a.node.display || a.node.name}的归属关系无法明确`)
                                    return []
                                }
                            }
                            return value
                        }
                        else {
                            return a.value
                        }
                    }),
                    type,
                    false,
                    target
                )

                if (dftval)
                    result.value = isNull(res) ? dftval : res
                else
                    result.value = res

                return
            }
            catch (ex) {
                if (retry == 4) throw ex;
                console.error(ex)
                await new Promise(r => setTimeout(r, 200))
            }
        }
    }, 200)

    // 订阅执行
    args.forEach(v => {
        if (v.node) {
            const argNode = v.node
            if (!argNode.rule._actived)
                argNode.activeRule(true)
            if (argNode.dataNodeType === SchemaType.Scalar || argNode.dataNodeType === SchemaType.Enum) {
                node.addWatchHandle(watch(argNode.data, doFetch))
                node.addWatchHandle(watch(() => argNode.data, doFetch))
            }
            else if (argNode.dataNodeType === SchemaType.Array && (argNode as ArrayDataNode).isSingleValue) {
                const tarNode = argNode as ArrayDataNode
                node.addWatchHandle(watch(tarNode.singleValueChangeTime, doFetch))
                node.addWatchHandle(watch(() => tarNode.singleValueChangeTime, doFetch))
            }
            else {
                node.addWatchHandle(watch(argNode.data, doFetch))
            }
        }
    })

    // 首次执行
    doFetch()

    // 返回引用
    return result
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
    node?: SchemaNode<ISchemaNodeConfig, RuleSchema, Rule>

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