import { ISchemaNodeConfig } from "./schemaConfig"

export interface IEnumSchemaNodeConfig extends ISchemaNodeConfig
{
  /**
   * The enum cascade limit.
  */
  enumCascade?: number | null

  /**
   * The enum root value.
  */
  enumRoot?: string

  /**
   * The enum white list
  */
  enumWhiteList?: string[]

  /**
   * The enum black list
  */
  enumBlackList?: string[]

  /**
   * Allow use enum value in any level.
   */
  enumAnyLevel?: boolean

  /**
   * Don't allow flags enum value combination.
   */
  enumSingleFlag?: boolean

  /**
   * Works as enum array, require multi values
   */
  multiple?: boolean
}