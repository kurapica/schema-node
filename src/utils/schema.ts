import { SchemaType } from "../enum/SchemaType"
import { registerSchema } from "../schema/ISchemaProvider"
import { _L, _LS } from "./Locale"

/**
 * The default schemas
 */
registerSchema([
    //#region Scalar
    {
        name: "system.bool",
        type: SchemaType.Scalar,
        desc: _LS("system.bool.desc"),
        scalar: {
            error: _LS("system.bool.error")
        },
    },
    {
        name: "system.date",
        type: SchemaType.Scalar,
        desc: _LS("system.date.desc"),
        scalar: {
            error: _LS("system.date.error")
        },
    },
    {
        name: "system.number",
        type: SchemaType.Scalar,
        desc: _LS("system.number.desc"),
        scalar: {
            error: _LS("system.number.error"),
            regex: "^(\\-|\\+)?\\d+(\\.\\d+)?(e\\-\\d+)?$",
        },
    },
    {
        name: "system.double",
        type: SchemaType.Scalar,
        desc: _LS("system.double.desc"),
        scalar: {
            base: "system.number",
            error: _LS("system.double.error"),
            regex: "^-?\\d+\\.?\\d+$",
        },
    },
    {
        name: "system.float",
        type: SchemaType.Scalar,
        desc: _LS("system.float.desc"),
        scalar: {
            base: "system.double",
            error: _LS("system.float.error"),
            regex: "^\\d+(\\.\\d+)?$",
        },
    },
    {
        name: "system.fulldate",
        type: SchemaType.Scalar,
        desc: _LS("system.fulldate.desc"),
        scalar: {
            base: "system.date",
            error: _LS("system.fulldate.error"),
        },
    },
    {
        name: "system.int",
        type: SchemaType.Scalar,
        desc: _LS("system.int.desc"),
        scalar: {
            base: "system.number",
            error: _LS("system.int.error"),
            regex: "^(\\-|\\+)?\\d+$",
        },
    },
    {
        name: "system.string",
        type: SchemaType.Scalar,
        desc: _LS("system.string.desc"),
        scalar: {},
    },
    {
        name: "system.year",
        type: SchemaType.Scalar,
        desc: _LS("system.year.desc"),
        scalar: {
            base: "system.int",
            unit: _LS("system.year.unit"),
            lowLimit: 1900,
            regex: "^\\d{4}$",
        },
    },
    {
        name: "system.yearmonth",
        type: SchemaType.Scalar,
        desc: _LS("system.yearmonth.desc"),
        scalar: {
            base: "system.date",
        },
    },
    //#endregion

    //#region Struct
    {
        name: "system.rangedate",
        type: SchemaType.Struct,
        desc: _LS("system.rangedate.desc"),
        struct: {
            fields: [
                {
                    name: "start",
                    require: true,
                    type: "system.date",
                    display: _LS("system.rangedate.start"),
                },
                {
                    name: "stop",
                    require: true,
                    type: "system.date",
                    display: _LS("system.rangedate.stop"),
                }
            ],
        },
    },
    {
        name: "system.rangefulldate",
        type: SchemaType.Struct,
        desc: _LS("system.rangefulldate.desc"),
        struct: {
            fields: [
                {
                    name: "start",
                    require: true,
                    type: "system.fulldate",
                    display: _LS("system.rangedate.start"),
                },
                {
                    name: "stop",
                    require: true,
                    type: "system.fulldate",
                    display: _LS("system.rangedate.stop"),
                }
            ],
        },
    },
    {
        name: "system.rangemonth",
        type: SchemaType.Struct,
        desc: _LS("system.rangemonth.desc"),
        struct: {
            base: "",
            fields: [
                {
                    name: "start",
                    require: true,
                    type: "system.yearmonth",
                    display: _LS("system.rangemonth.start"),
                },
                {
                    name: "stop",
                    require: true,
                    type: "system.yearmonth",
                    display: _LS("system.rangemonth.stop"),
                }
            ],
        },
    },
    {
        name: "system.rangeyear",
        type: SchemaType.Struct,
        desc: _LS("system.rangeyear.desc"),
        struct: {
            base: "",
            fields: [
                {
                    name: "start",
                    require: true,
                    type: "system.year",
                    display: _LS("system.rangeyear.start"),
                },
                {
                    name: "stop",
                    require: true,
                    type: "system.year",
                    display: _LS("system.rangeyear.stop"),
                }
            ],
        },
    },
    //#endregion

    //#region Array
    {
        name: "system.strings",
        type: SchemaType.Array,
        desc: _LS("system.strings.desc"),
        array: {
            base: "system.string",
            primary: [],
        },
    },
    {
        name: "system.numbers",
        type: SchemaType.Array,
        desc: _LS("system.numbers.desc"),
        array: {
            base: "system.number",
            primary: [],
        },
    },
    {
        name: "system.ints",
        type: SchemaType.Array,
        desc: _LS("system.ints.desc"),
        array: {
            base: "system.int",
            primary: [],
        },
    }
    //#endregion
])