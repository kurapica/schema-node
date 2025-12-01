import { type ILocaleString } from "../utils/locale"

/**
 * The schema of the scalar type
*/
export interface IScalarSchema
{
  /**
   * The base type of the scalar
  */
  base?: string

  /**
   * The default unit of the scalar value
  */
  unit?: ILocaleString

  /**
   * The default low limit of the scalar value
  */
  lowLimit?: number | null

  /**
   * The default up limit of the scalar value
  */
  upLimit?: number | null

  /**
   * The default error message of the scalar value
  */
  error?: ILocaleString

  /**
   * The regex of the scalar value
  */
  regex?: string

  /**
   * The white list fetch function, it only accept 0-args func or 1-args which the argument is the scalar itself
   */
  whiteList?: string

  /**
   * The white list only used for suggest.
   */
  asSuggest?: boolean

  /**
   * The function to validate the scalar value in frontend
  */
  preValid?: string

  /**
   * The function to validate the scalar value in backend
  */
  postValid?: string
}