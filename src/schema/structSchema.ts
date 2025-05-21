import { RelationType } from "../enum/relationType"
import { ISchemaConfig } from "../config/schemaConfig"
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
  fields: ISchemaConfig[]

  /**
   * The realtions between the fields
   */
  relations?: IStructFieldRelation[]
}


/**
 * The realtion between fields
*/
export interface IStructFieldRelation
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
