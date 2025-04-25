//#region Types

import { RelationType } from "../enum/RelationType"
import { SchemaType } from "../enum/SchemaType"

/**
 * 推送用数据参数规则
 */
interface ISchemaNodePushArgSchema
{
  /**
   * 数据容器
   */
  schema?: ISchemaNodeRuleSchema

  /**
   * 访问字段
   */
  field?: string

  /**
   * 常量数据
   */
  value?: any
}

/**
 * 推送规则
 */
interface ISchemaNodePushSchema
{
  /**
   * 函数
   */
  func: string

  /**
   * 函数结果类型
   */
  retType?: SchemaType

  /**
   * 参数
   */
  args: ISchemaNodePushArgSchema[]

  /**
   * 关联类型
   */
  type: RelationType

  /**
   * 需要应用目标
   */
  target: boolean
}

/**
 * 推送用数据参数
 */
interface ISchemaNodePushArg
{
  /**
   * 数据节点
   */
  node?: ISchemaNodeNode

  /**
   * 检查数组变更
   */
  checkArrayNode?: boolean

  /**
   * 常量数据
   */
  value: any
}

/**
 * 字段访问路径信息
 */
interface IFieldAccessPath
{
  name: string,
  schema: ISchemaNodeRuleSchema,
}

/**
 * enum white list item for sclar values
 */
interface IScalarWhiteListItem
{
  /**
   * value
   */
  value: any

  /**
   * label
   */
  label: string
}

/**
 * The schema of the node's rule
 */
export interface ISchemaNodeRuleSchema
{
  /**
   * 数据类型
   */
  type: string

  /**
   * 是数组元素
   */
  isArrayElement?: boolean

  /**
   * 默认值
   */
  default?: any

  /**
   * 枚举值根植
   */
  enumRoot?: string | number | null

  /**
   * 级联枚举值限制层级
   */
  enumCascade?: number | null

  /**
   * 枚举值黑名单
   */
  enumBlackList?: number[] | string[] | null

  /**
   * 枚举值白名单
   */
  enumWhiteList?: number[] | string[] | IScalarWhiteListItem[] | null

  /**
   * 枚举值可用任意级别
   */
  enumAnyLevel?: boolean | null

  /**
   * 标志枚举值仅用单值
   */
  enumSingleFlag?: boolean | null

  /**
   * 不可见
   */
  invisible?: boolean

  /**
   * 下限
   */
  lowLimit?: any

  /**
   * 上限
   */
  upLimit?: any

  /**
   * 不可用
   */
  disable?: boolean

  /**
   * 使用白名单作为建议
   */
  asSuggest?: boolean

  /**
   * 计算上限时计入原始值
   */
  useOriginForUplimit?: boolean

  /**
   * 下级字段规则定义映射
   */
  schemas?: { [key: string]: ISchemaNodeRuleSchema }

  /**
   * 推送用规则
   */
  pushSchemas?: ISchemaNodePushSchema[]
}

/**
 * 数据节点规则
 */
export interface ISchemaNodeRule
{
  /**
   * 默认值
   */
  default?: any

  /**
   * 枚举值根植
   */
  enumRoot?: string | number | null

  /**
   * 级联枚举值限制层级
   */
  enumCascade?: number | null

  /**
   * 枚举值黑名单
   */
  enumBlackList?: number[] | string[] | null

  /**
   * 枚举值白名单
   */
  enumWhiteList?: number[] | string[] | IEnumWhiteListItem[] | null

  /**
   * 枚举值可用任意级别
   */
  enumAnyLevel?: boolean | null

  /**
   * 标志枚举值仅用单值
   */
  enumSingleFlag?: boolean | null

  /**
   * 不可见
   */
  invisible?: boolean

  /**
   * 限
   */
  lowLimit?: any

  /**
   * 上限
   */
  upLimit?: any

  /**
   * 不可用
   */
  disable?: boolean

  /**
   * 使用白名单作为建议
   */
  asSuggest?: boolean

  /**
   * 计算上限时计入原始值
   */
  useOriginForUplimit?: boolean

  /**
   * 以字符串存储
   */
  asString?: boolean

  /**
   * 是否已启用
   */
  _actived?: boolean
}

//#endregion