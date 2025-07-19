import { RelationTypeValue } from "../enum/relationType"
import { ISchemaConfig } from "../config/schemaConfig"
import { IFunctionCallArgument } from "./functionSchema"
import { IScalarConfig } from "../config/scalarConfig"
import { IEnumConfig } from "../config/enumConfig"
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
  fields: IStructFieldConfig[]

  /**
   * The realtions between the fields
   */
  relations?: IStructFieldRelation[]
}

/**
 * The struct field config
 */
export interface IStructFieldConfig extends ISchemaConfig
{
  /**
   * The field name
   */
  name: string
}

export interface IStructScalarFieldConfig extends IStructFieldConfig, IScalarConfig {}
export interface IStructEnumFieldConfig extends IStructFieldConfig, IEnumConfig {}
//export interface IStructArrayFieldConfig extends IStructFieldConfig, IArrayConfig {}

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
  args: IFunctionCallArgument[]

  /**
   * The realtion type
  */
  type: RelationTypeValue
}
