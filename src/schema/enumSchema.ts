import { EnumValueTypeValue } from "../enum/enumValueType"
import { ILocaleString } from "../utils/locale"

/**
 * The enum type schema
*/
export interface IEnumSchema {
    /**
     * The enum value type
    */
    type: EnumValueTypeValue

    /**
     * The cascades of the enum value
    */
    cascade?: ILocaleString[]

    /**
     * The enum values
    */
    values: IEnumValueInfo[]
}

/**
 * The enum value info
*/
export interface IEnumValueInfo {
    /**
     * The value
    */
    value: any

    /**
     * The name of the enum value
    */
    name: ILocaleString

    /**
     * The value color
     */
    color?: string

    /**
     * Whether the enum value is disabled
    */
    disable?: boolean

    /**
     * Whether the enum value has sub enum values
    */
    hasSubList?: boolean

    /**
     * The sub enum values
    */
    subList?: IEnumValueInfo[]
}

/**
 * The enum value access info
 */
export interface IEnumValueAccess {
    /**
     * The cascade name
    */
    name: ILocaleString

    /**
     * The enum value of the cascade
    */
    value: any

    /**
     * The sublist of the enum value
    */
    subList: IEnumValueInfo[]
}
