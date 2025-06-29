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
   * As Enum root
   */
  EnumRoot = "enumRoot",

  /**
   * Enum blacklist
   */
  BlackList = "blackList",

  /**
   * Enum whitelist
   */
  WhiteList = "whiteList",
}