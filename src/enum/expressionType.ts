/**
 * The expression call type
 */
export enum ExpressionType
{
    /**
     * Call directly
     */
    Call = "call",

    /**
     * Map the array elements by the function
     */
    Map = "map",

    /**
     * Reduce the array elements by the function
     */
    Reduce = "reduce",

    /**
     * Gets the first element matched by the function
     */
    First = "first",

    /**
     * Gets the last element matched by the function
     */
    Last = "last",

    /**
     * Filter the array elements by the function
     */
    Filter = "filter",
}

export type ExpressionTypeValue = `${ExpressionType}`