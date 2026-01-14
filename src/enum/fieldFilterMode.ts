/**
 * The field filter modes
 */
export enum FieldFilterMode
{
    Exactly = "exactly",
    Prefix = "prefix",
    Suffix = "suffix",
    Contains = "contains",
}

export type FieldFilterModeValue = `${FieldFilterMode}`