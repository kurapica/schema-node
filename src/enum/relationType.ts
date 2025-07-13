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
  Uplimit = "upLimit",
  
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
}