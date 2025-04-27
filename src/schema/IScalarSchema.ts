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
  unit?: string

  /**
   * The low limit of the scalar value
  */
  lowLimit?: number | null

  /**
   * The up limit of the scalar value
  */
  upLimit?: number | null

  /**
   * The error message of the scalar value
  */
  error?: string

  /**
   * The regex of the scalar value
  */
  regex?: string

  /**
   * The eval function to validate the scalar value
  */
  valid?: string

  /**
   * The eval function to convert the scalar value
  */
  conv?: string
}