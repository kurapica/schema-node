import { EnumValueType } from "../enum/enumValueType"
import { LocaleString } from "../utils/locale"

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
  cascade?: string[]

  /**
   * The enum values
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
  value: any

  /**
   * The name of the enum value
  */
  name: string | LocaleString

  /**
   * Whether the enum value is disabled
  */
  disabled?: boolean

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
