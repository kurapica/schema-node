import { ExpressionTypeValue } from "../enum/expressionType"

/**
 * The schema of function
 */
export interface IFunctionSchema
{
  /**
   * The return type of the function, T T1 T2 means the generic type
   */
  return: string

  /**
   * The function arguments
   */
  args: IFunctionArgumentInfo[]

  /**
   * The function expressions
   */
  exps: IFunctionExpression[]

  /**
   * The basic type of generic types, provided to T(single generic type), 
   * T1, T2(for multi generic type)
   */
  generic?: string | string[]

  /**
   * Call server if server provided
   */
  server?: boolean

  /**
   * The client should not cache the result
   */
  nocache?: boolean

  /**
   * The function registered by the frontend
   */
  func?: Function
}

/**
 * The function argument information
 */
export interface IFunctionArgumentInfo
{
  /**
   * The argument name
  */
  name: string

  /**
   * The argument type, T T1 T2 means the generic type
  */
  type: string

  /**
   * Whether the argument is nullable
  */
  nullable?: boolean
}

/**
 * The function expressions
*/
export interface IFunctionExpression {
  /**
   * The expression name
  */
  name: string

  /**
   * The call function
  */
  func: string

  /**
   * The calling type
   */
  type: ExpressionTypeValue

  /**
   * The expression type
  */
  return: string

  /**
   * The argument list, should be exp name or argument name.
  */
  args: IFunctionCallArgument[]
}
  
/**
 * The function call argument
*/
export interface IFunctionCallArgument {
  /**
   * The argument name or expression name
  */
  name?: string

  /**
   * The const value
  */
  value?: any
}