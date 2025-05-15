import { IStructFieldRelationInfo } from "./structSchema"

/**
 * The array schema.
*/
export interface IArraySchema {
  /**
   * The element type of the array.
  */
  element: string

  /**
   * Whether the array should be treated as a whole value,
   * no element schema nodes would be created
   */
  single?: boolean

  /**
   * The primary fields of the array if the element is a struct.
  */
  primary?: string[]

  /**
   * The realtions between the fields
   */
  relations?: IStructFieldRelationInfo[]
}
