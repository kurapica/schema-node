export enum RelationType
{
  /**
   * The node type, only works for struct field
   */
  Type = "type",

  /**
   * Invisible
   */
  Invisible = "invisible",

  /**
   * Visible
   */
  Visible = "visible",

  /**
   * Disable
   */
  Disable = "disable",

  /**
   * As Default
   */
  Default = "default",

  /**
   * Assign
   */
  Assign = "assign",

  /**
   * Only use for init
   */
  InitOnly = "initOnly",

  /**
   * low limit
   */
  LowLimit = "lowLimit",

  /**
   * up limit
   */
  UpLimit = "upLimit",
  
  /**
   * root, for enum or scalar values with tree structure
   */
  Root = "root",

  /**
   * Enum blacklist
   */
  BlackList = "blackList",

  /**
   * Enum whitelist
   */
  WhiteList = "whiteList",

  /**
   * Enum can choose any level
   */
  AnyLevel = "anyLevel",

  /**
   * The cascade limit
   */
  Cascade = "cascade",

  /**
   * Single flag value for enum
   */
  SingleFlag = "singleFlag",

  /**s
   * Validate the value
   */
  Validation = "validation",

  /**
   * App field reference
   */
  Reference = "reference",
}

export type RelationTypeValue = `${RelationType}`