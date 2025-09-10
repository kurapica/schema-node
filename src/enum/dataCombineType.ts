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

    /**
     * The min value
     */
    Min = "min",

    /**
     * The max value
     */
    Max = "max",
}

export type DataCombineTypeValue = `${DataCombineType}`
