import { RelationType } from "../enum/relationType"
import { ISchemaNodeConfig } from "../config/schemaConfig"
import { IFunctionCallArgument } from "./functionSchema"

/**
 * The struct schema.
*/
export interface IStructSchema
{
  /**
   * The base struct type to be inherited from.
  */
  base?: string

  /**
   * The struct fields.
  */
  fields: ISchemaNodeConfig[]

  /**
   * The realtions between the fields
   */
  relations?: IStructFieldRelationInfo[]
}


/**
 * The realtion between fields
*/
export interface IStructFieldRelationInfo
{
  /**
   * The target field, can use . for deep fields
  */
  field: string

  /**
   * The relation function
  */
  func: string

  /**
   * The func arguments
  */
  funcArgs: IFunctionCallArgument[]

  /**
   * The realtion type
  */
  relationType: RelationType
}
