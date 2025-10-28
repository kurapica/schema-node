export enum DataCombineType
{
    /**
     * Assign, always use last
     */
    Assign = "assign",

    /**
     * Use the first assign value
     */
    Init = "init",

    /**
     * Sum
     */
    Sum = "sum",

    /**
     * Count
     */
    Count = "count",
}

export type DataCombineTypeValue = `${DataCombineType}`
