import { RelationType } from "../enum/relationType"
import { SchemaType } from "../enum/schemaType"
import { ArraySchemaNode } from "../node/arraySchemaNode"
import { getSchema } from "../schema/schemaProvider"
import { IStructFieldRelationInfo, IStructSchema } from "../schema/structSchema"
import { isNull } from "../utils/toolset"
import ISchemaNode from "./schemaNode"

//#region apis

/**
 * Generate the rule schema for node
 */
export async function useRuleSchema(node: ISchemaNode, parent: ISchemaNode | null): Promise<ISchemaNodeRuleSchema> {
  const ruleSchema = parent
    ? (
      parent.schemaType == SchemaType.Array
        ? parent.ruleSchema
        : parent.ruleSchema.schemas![node.config.name]
    )
    : await buildRuleSchema(node.config.name)

  // init
  copyRule(ruleSchema, node.rule, true)
  return ruleSchema
}

/**
 * active rule schema
 */
export function activeRuleSchema(node: ISchemaNode, deep?: boolean, isinit?: boolean) {
  if (node.schemaType == SchemaType.Array) {
    const arrayNode = node as unknown as ArraySchemaNode
    if (arrayNode.enumArrayNode) {
      activeRuleSchema(arrayNode.enumArrayNode, false, isinit)
    }
    else if (deep) {
      arrayNode.elements?.forEach(e => activeRuleSchema(e, deep, isinit))
    }
  }
  else if (deep && (node.dataNodeType == SchemaType.Struct || node.dataNodeType == SchemaType.Namspace)) {
    (node as unknown as StructDataNode).fields?.forEach(f => activeRuleSchema(f, deep, isinit))
  }

  // 初始化专用
  if (isinit) {
    const push = node.ruleSchema?.pushSchemas?.find(p => p.type === RelationType.InitOnly)
    if (push && (!push.retType || push.retType === node.dataNodeType)) {
      const res = useTypeDataPush(node, push, node.type)
      const w = watch(res, () => {
        if (isNull(res.value)) return
        w()
        if (isRef(node.data))
          node.data.value = res.value
        else
          node.data = res.value
      }, { immediate: true }
      )
    }
  }

  // 基础数据节点动态规则仅启动一次
  if (node.rule?._actived) return

  // 启用规则
  const ruleSchema = node.ruleSchema
  if (!ruleSchema) return // 已卸载
  node.rule._actived = true

  // 检查推送规则
  if (ruleSchema.pushSchemas && ruleSchema.pushSchemas.length > 0) {
    ruleSchema.pushSchemas.forEach(push => {
      // 检查规则，关联应用的需target存在，否则不关联
      if (push.target) {
        let parent: ISchemaNode | null = node
        while (parent && parent.dataNodeType !== SchemaType.Namspace)
          parent = parent.parent
        if (!parent)
          return
      }

      switch (push.type) {
        // 默认值
        case RelationType.Default:
          if (push.retType && push.retType !== node.dataNodeType)
            break
          if (node.dataNodeType == SchemaType.Array) {
            const res = useTypeDataPush(node, push, node.type)
            node.addWatchHandle(watch(res, () => { if ((node as ArrayDataNode).elements.length == 0) { } node.data = res.value }, { immediate: true }))
          }
          else if (node.dataNodeType === SchemaType.Struct) {
            // 待定
            break;
          }
          else {
            node.rule.default = useTypeDataPush(node, push, node.type, toRaw(node.rule.default))
          }
          break;

        // 根枚举值
        case RelationType.EnumRoot:
          node.rule.enumRoot = useTypeDataPush(node, push, node.type)
          break;

        // 级联枚举值限制层级
        case RelationType.EnumCascade:
          node.rule.enumCascade = useTypeDataPush(node, push, "system.int")
          break;

        // 白名单
        case RelationType.EnumWhiteList:
          node.rule.enumWhiteList = useTypeDataPush(node, push, "system.array")
          break;

        // 黑名单
        case RelationType.EnumBlackList:
          node.rule.enumBlackList = useTypeDataPush(node, push, "system.array")
          break;

        // 下限
        case RelationType.LowLimit:
          node.rule.lowLimit = useTypeDataPush(node, push, node.type)
          break;

        // 上限
        case RelationType.Uplimit:
          node.rule.upLimit = useTypeDataPush(node, push, node.type)
          break;

        // 不可见
        case RelationType.Invisible:
          node.rule.invisible = useTypeDataPush(node, push, "system.bool")
          break;

        // 不可用
        case RelationType.Disable:
          node.rule.disable = useTypeDataPush(node, push, "system.bool")
          break;

        // 强制赋值
        case RelationType.Assign:
          {
            if (push.retType && push.retType !== node.dataNodeType)
              break
            const res = useTypeDataPush(node, push, node.type)
            node.addWatchHandle(watch(res, () => {
              node.rule.default = res.value
              if (isRef(node.data))
                node.data.value = res.value
              else
                node.data = res.value
            }, { immediate: true }))
            break
          }

        // 白名单建议用
        case RelationType.AsSuggest:
          node.rule.asSuggest = useTypeDataPush(node, push, "system.bool")
          break;
      }
    })
  }
}

/**
 * Copy rule
 */
export function copyRule(from: ISchemaNodeRule, to: ISchemaNodeRule, override?: Boolean, source?: Boolean) {
  if (!from || !to) return
  if (source || !isNull(from.default) && (override || isNull(to.default))) to.default = from.default
  if (source || !isNull(from.enumCascade) && (override || isNull(to.enumCascade))) to.enumCascade = from.enumCascade
  if (source || !isNull(from.enumRoot) && (override || isNull(to.enumRoot))) to.enumRoot = from.enumRoot
  if (source || !isNull(from.enumWhiteList) && (override || isNull(to.enumWhiteList))) to.enumWhiteList = from.enumWhiteList
  if (source || !isNull(from.enumBlackList) && (override || isNull(to.enumBlackList))) to.enumBlackList = from.enumBlackList
  if (source || !isNull(from.enumAnyLevel) && (override || isNull(to.enumAnyLevel))) to.enumAnyLevel = from.enumAnyLevel
  if (source || !isNull(from.enumSingleFlag) && (override || isNull(to.enumSingleFlag))) to.enumSingleFlag = from.enumSingleFlag
  if (source || !isNull(from.lowLimit) && (override || isNull(to.lowLimit))) to.lowLimit = from.lowLimit
  if (source || !isNull(from.upLimit) && (override || isNull(to.upLimit))) to.upLimit = from.upLimit
  if (source || !isNull(from.invisible) && (override || isNull(to.invisible))) to.invisible = from.invisible
  if (source || !isNull(from.disable) && (override || isNull(to.disable))) to.disable = from.disable
  if (source || !isNull(from.asString) && (override || isNull(to.asString))) to.asString = from.asString
  if (source || !isNull(from.asSuggest) && (override || isNull(to.asSuggest))) to.asSuggest = from.asSuggest
  if (source || !isNull(from.useOriginForUplimit) && (override || isNull(to.useOriginForUplimit))) to.useOriginForUplimit = from.useOriginForUplimit
}

/**
 * Build the rule schema
 */
async function buildRuleSchema(type: string): Promise<ISchemaNodeRuleSchema> {
  const ruleSchema: ISchemaNodeRuleSchema = { type }
  const schemaInfo = await getSchema(type)
  if (!schemaInfo) return ruleSchema

  if (schemaInfo.type == SchemaType.Array) {
    // The array and element share the rule schema
    const eleRuleSchema = await buildRuleSchema(schemaInfo.array!.element)
    eleRuleSchema.isArrayElement = true

    // Register relations of the array
    const elementInfo = await getSchema(schemaInfo.array!.element)
    if (elementInfo?.type === SchemaType.Struct && elementInfo.struct?.relations?.length)
    {
      for(let i = 0; i < elementInfo.struct.relations.length; i++)
      {
        await registerRelation(eleRuleSchema, elementInfo.struct.relations[i], elementInfo.struct)
      }
    }
    return eleRuleSchema
  }
  else if (schemaInfo.type == SchemaType.Struct) {
    const structTypeInfo = schemaInfo.struct!
    const schemas: { [key: string]: ISchemaNodeRuleSchema } = {}
    ruleSchema.schemas = schemas

    // Register for each field
    for(let i = 0; i < structTypeInfo.fields.length; i++)
    {
      const f = structTypeInfo.fields[i]

      // build rule schema for each field
      const schema = await buildRuleSchema(f.type)
      schemas[f.name] = schema

      // init the schema
      copyRule(f, schema)
    }

    // Register the realtions
    if (structTypeInfo.relations && structTypeInfo.relations.length > 0) {
      for(let i = 0; i < structTypeInfo.relations.length; i++)
      {
        await registerRelation(ruleSchema, registerRelation, structTypeInfo)
      }
    }
  }
  else if (schemaInfo.type == SchemaType.Scalar) {
    ruleSchema.lowLimit = schemaInfo.scalar!.lowLimit
    ruleSchema.upLimit = schemaInfo.scalar!.upLimit
  }

  return ruleSchema
}

/**
 * Register Relation between fields
 */
function registerRelation(rootSchema: ISchemaNodeRuleSchema, relation: IStructFieldRelationInfo, rootTypeInfo: IStructSchema) {
  // Location the target
  const targetAccessPaths = await getAccessPath(rootSchema, relation.field!, rootTypeInfo)
  if (!targetAccessPaths || targetAccessPaths.length == 0) {
    console.error(`路径${relation.field}对应的节点无法定位，请检查关联规则。`)
    return
  }

  // 定位关联字段
  const args: ISchemaNodePushArgSchema[] = []
  relation.funcArgs.forEach(a => {
    if (a.name) {
      // 依赖检查
      const accessPaths = getAccessPath(rootSchema, a.name, rootTypeInfo, typeInfos)
      if (accessPaths == null || accessPaths.length == 0 || !isPathAccessable(targetAccessPaths, accessPaths)) {
        console.error(`路径${relation.field}的依赖路径${a.name}无法定位或访问，请检查关联规则。`)
        return
      }

      // 关联字段
      args.push({ schema: rootSchema, field: a.name })
    }
    else {
      // 常量
      args.push({ value: a.value })
    }
  })

  if (args.length < relation.funcArgs.length) {
    return
  }

  // 注册
  const targetSchema = targetAccessPaths[targetAccessPaths.length - 1].schema
  const retType = typeInfos[relation.func] && typeInfos[relation.func].function && typeInfos[relation.func].function!.retType && typeInfos[typeInfos[relation.func].function!.retType] ? typeInfos[typeInfos[relation.func].function!.retType].type : undefined
  const pushSchema: ITypeDataPushSchema = { func: relation.func, retType: retType, args, type: relation.relationType, target: typeInfos[relation.func]?.function?.isClientOnly || false }
  targetSchema.pushSchemas = targetSchema.pushSchemas || []
  targetSchema.pushSchemas.push(pushSchema)
}

/**
 * 构建推送数据
 */
function useTypeDataPush(node: ISchemaNode, pushSchema: ITypeDataPushSchema, type?: string, dftval?: any): any {
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

          if (argSchema.field === "$array") {
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
async function getAccessPath(rootSchema: ISchemaNodeRuleSchema, path: string, rootTypeInfo: IStructSchema): Promise<IFieldAccessPath[]> {
  // Check the array
  if (path.toLocaleLowerCase() === "$array") {
    if (rootSchema.isArrayElement) {
      return [
        {
          name: "$array",
          schema: rootSchema
        }
      ]
    }
    else {
      return []
    }
  }

  // The access path
  const paths = path.toLowerCase().split(".")
  const accessPaths: IFieldAccessPath[] = []
  if (!paths || paths.length == 0 || !rootTypeInfo.fields || rootTypeInfo.fields.length == 0) return accessPaths

  // Gets the start
  let field = rootTypeInfo.fields?.find(f => f.name.toLowerCase() == paths[0])
  let fieldType = field ? await getSchema(field.type) : null
  if (!field || !fieldType) return accessPaths

  // init
  let schema = rootSchema.schemas![field.name]
  accessPaths.push({ name: field.name, schema })

  // rest
  for (let i = 1; i < paths.length; i++) {
    // array count the same with element
    if (fieldType?.type == SchemaType.Array) {
      fieldType = await getSchema(fieldType.array!.element)
    }

    if (fieldType?.type == SchemaType.Struct) {
      field = fieldType.struct!.fields?.find(f => f.name.toLowerCase() == paths[i])
      fieldType = field ? await getSchema(field.type) : null
      if (!field || !fieldType) return []

      schema = schema.schemas![field.name]
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

//#region types

/**
 * The schema of the node's rule
 */
export interface ISchemaNodeRuleSchema {
  /**
   * The node type
   */
  type: string

  /**
   * For array element
   */
  isArrayElement?: boolean

  /**
   * The default value
   */
  default?: any

  /**
   * The enum root
   */
  enumRoot?: string | number | null

  /**
   * The enum cascade limit
   */
  enumCascade?: number | null

  /**
   * The enum black list
   */
  enumBlackList?: number[] | string[] | null

  /**
   * The enum white list
   */
  enumWhiteList?: number[] | string[] | IScalarWhiteListItem[] | null

  /**
   * The enum can choose any cascade level value
   */
  enumAnyLevel?: boolean | null

  /**
   * No combine value for flag enum
   */
  enumSingleFlag?: boolean | null

  /**
   * Invisible
   */
  invisible?: boolean

  /**
   * The low limit
   */
  lowLimit?: any

  /**
   * The up limit
   */
  upLimit?: any

  /**
   * Disable the node
   */
  disable?: boolean

  /**
   * The whilte list is only a suggest
   */
  asSuggest?: boolean

  /**
   * Calc the origin value for up limit
   */
  useOriginForUplimit?: boolean

  /**
   * The rule schema for fields
   */
  schemas?: { [key: string]: ISchemaNodeRuleSchema }

  /**
   * The push schemas
   */
  pushSchemas?: ISchemaNodePushSchema[]
}

/**
 * The rule for node
 */
export interface ISchemaNodeRule {
  /**
   * The default value
   */
  default?: any

  /**
   * The enum root
   */
  enumRoot?: string | number | null

  /**
   * The enum cascade limit
   */
  enumCascade?: number | null

  /**
   * The enum black list
   */
  enumBlackList?: number[] | string[] | null

  /**
   * The enum white list
   */
  enumWhiteList?: number[] | string[] | IScalarWhiteListItem[] | null

  /**
   * Any cascade level enum value can be use
   */
  enumAnyLevel?: boolean | null

  /**
   * No combine flags enum value
   */
  enumSingleFlag?: boolean | null

  /**
   * Invisible
   */
  invisible?: boolean

  /**
   * The low limit
   */
  lowLimit?: any

  /**
   * The up limit
   */
  upLimit?: any

  /**
   * Disable the node
   */
  disable?: boolean

  /**
   * Only use white list as suggest
   */
  asSuggest?: boolean

  /**
   * Calc the origin value for up limit
   */
  useOriginForUplimit?: boolean

  /**
   * As string as node data, for uni-app
   */
  asString?: boolean

  /**
   * Already actived
   */
  _actived?: boolean
}

/**
 * The push schema argument
 */
interface ISchemaNodePushArgSchema {
  /**
   * The rule schema
   */
  schema?: ISchemaNodeRuleSchema

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
 * The push schema
 */
interface ISchemaNodePushSchema {
  /**
   * The function
   */
  func: string

  /**
   * The result type
   */
  retType?: SchemaType

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
 * The push argument
 */
interface ISchemaNodePushArg {
  /**
   * The node
   */
  node?: ISchemaNode

  /**
   * Whether check array node change
   */
  checkArrayNode?: boolean

  /**
   * The const value
   */
  value?: any
}

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
  schema: ISchemaNodeRuleSchema,
}

/**
 * enum white list item for sclar values
 */
interface IScalarWhiteListItem {
  /**
   * value
   */
  value: any

  /**
   * label
   */
  label: string
}

//#endregion