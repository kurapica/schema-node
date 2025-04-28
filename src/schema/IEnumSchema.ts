import { EnumValueType } from "../enum/EnumValueType"

/**
 * The enum type schema
*/
export interface IEnumSchema
{
  /**
   * The enum value type
  */
  type: EnumValueType

  /**
   * The cascades of the enum value
  */
  cascade: string[]

  /**
   * 枚举字段信息列表
  */
  values: IEnumValueInfo[]
}

/**
 * The enum value info
*/
export interface IEnumValueInfo
{
  /**
   * The value
  */
  value: any;

  /**
   * The name of the enum value
  */
  name: string

  /**
   * Whether the enum value is disabled
  */
  disable?: boolean

  /**
   * Whether the enum value has sub enum values
  */
  hasSubList?: boolean

  /**
   * The sub enum values
  */
  subList?: IEnumValueInfo[]
}

/**
 * The enum value access info
 */
export interface IEnumValueAccess
{
  /**
   * The cascade name
  */
  name: string

  /**
   * The enum value of the cascade
  */
  value: any

  /**
   * The sublist of the enum value
  */
  subList: IEnumValueInfo[]
}
