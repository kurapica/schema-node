/**
 * The config of the schema node.
 */
export interface ISchemaNodeConfig
{
    /**
     * The name of the node.
     */
    name: string

    /**
     * The type name of the node.
     */
    type: string

    /**
     * The label of the node.
     */
    display?: string

    /**
     * The description of the node.
     */
    description?: string

    /**
     * The node data is readonly.
     */
    readonly?: boolean

    /**
     * The node data is immutable.
     */
    immutable?: boolean

    /**
     * The node data is required.
     */
    require?: boolean

    /**
     * The node should be invisible.
     */
    invisible?: boolean

    /**
     * The node should be display only, won't be submitted.
     */
    displayOnly?: boolean

    /**
     * The unit of the node data like 'm/s', '%', '°C'.
     */
    unit?: string

    /**
     * The default value of the node.
     */
    default?: any
}

export interface IScalarSchemaNodeConfig extends ISchemaNodeConfig
{
    /**
     * The enum white list
    */
    enumWhiteList?: string[]

    /**
     * The enum white list only used for suggest.
     */
    asSuggest?: boolean

    /**
     * When calculating the up limit, use the original value.
     */
    useOriginForUplimit?: boolean

    /**
     * The low limit of the scalar value.
     */
    lowLimit?: any

    /**
     * The up limit of the scalar value.
     */
    upLimit?: any

}

export interface IEnumSchemaNodeConfig extends ISchemaNodeConfig
{
  /**
   * The enum cascade limit.
  */
  enumCascade?: number | null

  /**
   * The enum root value.
  */
  enumRoot?: string

  /**
   * The enum white list
  */
  enumWhiteList?: string[]

  /**
   * The enum black list
  */
  enumBlackList?: string[]

  /**
   * Allow use enum value in any level.
   */
  enumAnyLevel?: boolean

  /**
   * Don't allow flags enum value combination.
   */
  enumSingleFlag?: boolean     
}