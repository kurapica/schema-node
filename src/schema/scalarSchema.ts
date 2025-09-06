import { LocaleString } from "../utils/locale"

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
  unit?: string | LocaleString

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
  error?: string | LocaleString

  /**
   * The regex of the scalar value
  */
  regex?: string

  /**
   * The function to validate the scalar value in frontend
  */
  prevalid?: string

  /**
   * The function to validate the scalar value in backend
  */
  postvalid?: string
}