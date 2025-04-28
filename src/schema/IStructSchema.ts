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
  fields: ISchemaNodeConfig[]
}