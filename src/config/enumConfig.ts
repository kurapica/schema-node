import { type ISchemaConfig } from "./schemaConfig"

export interface IEnumConfig extends ISchemaConfig
{
  /**
   * The enum cascade limit.
  */
  cascade?: number

  /**
   * The enum root value.
  */
  root?: string

  /**
   * The enum white list
  */
  whiteList?: string[]

  /**
   * The enum black list
  */
  blackList?: string[]

  /**
   * Allow use enum value in any level.
   */
  anyLevel?: boolean

  /**
   * Don't allow flags enum value combination.
   */
  singleFlag?: boolean

  /**
   * Works as enum array, require multi values
   */
  multiple?: boolean
}