/**
 * The value type of the enum.
 */
export enum EnumValueType
{
    /**
     * The enum value is a string.
     */
    String = "string",

    /**
     * The enum value is an integer.
     */
    Int = "int",

    /**
     * The enum value is a float.
     */
    Float = "float",

    /**
     * The enum value is a double.
     */
    Double = "double",

    /**
     * The enum value is flags.
     */
    Flags = "flags",
}

export type EnumValueTypeValue = `${EnumValueType}`