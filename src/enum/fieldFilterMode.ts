/**
 * The field filter modes
 */
export enum FieldFilterMode
{
    Exactly = "exactly",
    Prefix = "prefix",
    Suffix = "suffix",
    Contains = "contains",
    Filter = "filter",
}

export type FieldFilterModeValue = `${FieldFilterMode}`