/**
 * The field filter modes
 */
export enum FieldFilterMode
{
    Exactly = "exactly",
    Prefix = "prefix",
    Suffix = "suffix",
    Contains = "contains",
    Function = "function",
}

export type FieldFilterModeValue = `${FieldFilterMode}`