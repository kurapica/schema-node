import { ISchemaNodeConfig } from "../interface/ISchemaNodeConfig"

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
  fields: IStructFieldSchema[]
}

/**
 * The struct field schema.
*/
export interface IStructFieldSchema
{
  /**
   * The field name.
  */
  name: string

  /**
   * The field node type.
  */
  type: string

  /**
   * The field node config.
   */
  config: ISchemaNodeConfig
}
