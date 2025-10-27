/**
 * Schema types.
 */
export enum SchemaType
{
    /**
     * The namespace node
     */
    Namespace = "namespace",

    /**
     * The scalar node
     */
    Scalar = "scalar",

    /**
     * The num node
     */
    Enum = "enum",

    /**
     * The struct node
     */
    Struct = "struct",

    /**
     * The array node
     */
    Array = "array",

    /**
     * The json node
     */
    Json = "json",

    /**
     * The function node
     */
    Func = "func",
}

export type SchemaTypeValue = `${SchemaType}`