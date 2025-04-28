import { ExpressionType } from "../enum/ExpressionType"

/**
 * The schema of function
 */
export interface IFunctionSchema
{
  /**
   * The return type of the function, T T1 T2 means the generic type
   */
  retType: string

  /**
   * The function arguments
   */
  args: IFunctionArgumentInfo[]

  /**
   * The function expressions
   */
  exps: IFunctionExpression[]

  /**
   * The basic type of generic types
   */
  generic?: string | string[]

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
  callFunc: string

  /**
   * The calling type
   */
  callType: ExpressionType

  /**
   * The expression type
  */
  type: string

  /**
   * The argument list, should be exp name or argument name.
  */
  args: IFunctionCallArgument[]
}
  
/**
 * 函数调用参数
*/
export interface IFunctionCallArgument {
  /**
   * 选择函数参数名或者表达式名
  */
  name: string

  /**
   * 常量
  */
  value: any
}