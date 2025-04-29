/**
 * The array schema.
*/
export interface IArraySchema
{
  /**
   * The element type of the array.
  */
  base: string

  /**
   * The primary fields of the array if the element is a struct.
  */
  primary?: string[]
}
