import { BigNumber } from "bignumber.js"
import { SchemaType } from "../enum/schemaType"
import { registerSchema } from "./schemaProvider"
import { _LS } from "./locale"
import { isNull } from "./toolset"
import { ExpressionType } from "../enum/expressionType"

export const NS_SYSTEM_ARRAY = "system.array"
export const NS_SYSTEM_STRUCT = "system.struct"
export const NS_SYSTEM_BOOL = "system.bool"
export const NS_SYSTEM_DATE = "system.date"
export const NS_SYSTEM_NUMBER = "system.number"
export const NS_SYSTEM_DOUBLE = "system.double"
export const NS_SYSTEM_FLOAT = "system.float"
export const NS_SYSTEM_FULLDATE = "system.fulldate"
export const NS_SYSTEM_INT = "system.int"
export const NS_SYSTEM_STRING = "system.string"
export const NS_SYSTEM_YEAR = "system.year"
export const NS_SYSTEM_YEARMONTH = "system.yearmonth"
export const NS_SYSTEM_RANGEDATE = "system.rangedate"
export const NS_SYSTEM_RANGEFULLDATE = "system.rangefulldate"
export const NS_SYSTEM_RANGEMONTH = "system.rangemonth"
export const NS_SYSTEM_RANGEYEAR = "system.rangeyear"
export const NS_SYSTEM_STRINGS = "system.strings"
export const NS_SYSTEM_NUMBERS = "system.numbers"
export const NS_SYSTEM_INTS = "system.ints"

/**
 * The default schemas
 */
registerSchema([
    //#region system
    {
        name: "system",
        type: SchemaType.Namespace,
        desc: _LS("system"),
    },
    {
        name: NS_SYSTEM_ARRAY,
        type: SchemaType.Array,
        desc: _LS(NS_SYSTEM_ARRAY),
        array: {
            element: ""
        }
    },
    {
        name: NS_SYSTEM_STRUCT,
        type: SchemaType.Struct,
        desc: _LS(NS_SYSTEM_STRUCT),
        struct: {
            fields: []
        }
    },

    //#region scalar
    {
        name: NS_SYSTEM_BOOL,
        type: SchemaType.Scalar,
        desc: _LS(NS_SYSTEM_BOOL),
        scalar: {
            error: _LS("system.bool.error")
        },
    },
    {
        name: NS_SYSTEM_DATE,
        type: SchemaType.Scalar,
        desc: _LS(NS_SYSTEM_DATE),
        scalar: {
            error: _LS("system.date.error")
        },
    },
    {
        name: NS_SYSTEM_NUMBER,
        type: SchemaType.Scalar,
        desc: _LS(NS_SYSTEM_NUMBER),
        scalar: {
            error: _LS("system.number.error"),
            regex: "^(\\-|\\+)?\\d+(\\.\\d+)?(e\\-\\d+)?$",
        },
    },
    {
        name: NS_SYSTEM_DOUBLE,
        type: SchemaType.Scalar,
        desc: _LS(NS_SYSTEM_DOUBLE),
        scalar: {
            base: NS_SYSTEM_NUMBER,
            error: _LS("system.double.error"),
            regex: "^-?\\d+\\.?\\d+$",
        },
    },
    {
        name: NS_SYSTEM_FLOAT,
        type: SchemaType.Scalar,
        desc: _LS(NS_SYSTEM_FLOAT),
        scalar: {
            base: NS_SYSTEM_DOUBLE,
            error: _LS("system.float.error"),
            regex: "^\\d+(\\.\\d+)?$",
        },
    },
    {
        name: NS_SYSTEM_FULLDATE,
        type: SchemaType.Scalar,
        desc: _LS(NS_SYSTEM_FULLDATE),
        scalar: {
            base: NS_SYSTEM_DATE,
            error: _LS("system.fulldate.error"),
        },
    },
    {
        name: NS_SYSTEM_INT,
        type: SchemaType.Scalar,
        desc: _LS(NS_SYSTEM_INT),
        scalar: {
            base: NS_SYSTEM_INT,
            error: _LS("system.int.error"),
            regex: "^(\\-|\\+)?\\d+$",
        },
    },
    {
        name: NS_SYSTEM_STRING,
        type: SchemaType.Scalar,
        desc: _LS(NS_SYSTEM_STRING),
        scalar: {},
    },
    {
        name: NS_SYSTEM_YEAR,
        type: SchemaType.Scalar,
        desc: _LS(NS_SYSTEM_YEAR),
        scalar: {
            base: NS_SYSTEM_INT,
            unit: _LS("system.year.unit"),
            lowLimit: 1900,
            regex: "^\\d{4}$",
        },
    },
    {
        name: NS_SYSTEM_YEARMONTH,
        type: SchemaType.Scalar,
        desc: _LS(NS_SYSTEM_YEARMONTH),
        scalar: {
            base: NS_SYSTEM_DATE,
        },
    },
    //#endregion

    //#region struct
    {
        name: NS_SYSTEM_RANGEDATE,
        type: SchemaType.Struct,
        desc: _LS(NS_SYSTEM_RANGEDATE),
        struct: {
            fields: [
                {
                    name: "start",
                    require: true,
                    type: NS_SYSTEM_DATE,
                    display: _LS("system.rangedate.start"),
                },
                {
                    name: "stop",
                    require: true,
                    type: NS_SYSTEM_DATE,
                    display: _LS("system.rangedate.stop"),
                }
            ],
        },
    },
    {
        name: NS_SYSTEM_RANGEFULLDATE,
        type: SchemaType.Struct,
        desc: _LS(NS_SYSTEM_RANGEFULLDATE),
        struct: {
            fields: [
                {
                    name: "start",
                    require: true,
                    type: NS_SYSTEM_FULLDATE,
                    display: _LS("system.rangedate.start"),
                },
                {
                    name: "stop",
                    require: true,
                    type: NS_SYSTEM_FULLDATE,
                    display: _LS("system.rangedate.stop"),
                }
            ],
        },
    },
    {
        name: NS_SYSTEM_RANGEMONTH,
        type: SchemaType.Struct,
        desc: _LS(NS_SYSTEM_RANGEMONTH),
        struct: {
            base: "",
            fields: [
                {
                    name: "start",
                    require: true,
                    type: NS_SYSTEM_YEARMONTH,
                    display: _LS("system.rangemonth.start"),
                },
                {
                    name: "stop",
                    require: true,
                    type: NS_SYSTEM_YEARMONTH,
                    display: _LS("system.rangemonth.stop"),
                }
            ],
        },
    },
    {
        name: NS_SYSTEM_RANGEYEAR,
        type: SchemaType.Struct,
        desc: _LS(NS_SYSTEM_RANGEYEAR),
        struct: {
            base: "",
            fields: [
                {
                    name: "start",
                    require: true,
                    type: NS_SYSTEM_YEAR,
                    display: _LS("system.rangeyear.start"),
                },
                {
                    name: "stop",
                    require: true,
                    type: NS_SYSTEM_YEAR,
                    display: _LS("system.rangeyear.stop"),
                }
            ],
        },
    },
    //#endregion

    //#region array
    {
        name: NS_SYSTEM_STRINGS,
        type: SchemaType.Array,
        desc: _LS(NS_SYSTEM_STRINGS),
        array: {
            element: NS_SYSTEM_STRING,
            primary: [],
        },
    },
    {
        name: NS_SYSTEM_NUMBERS,
        type: SchemaType.Array,
        desc: _LS(NS_SYSTEM_NUMBERS),
        array: {
            element: NS_SYSTEM_NUMBER,
        },
    },
    {
        name: NS_SYSTEM_INTS,
        type: SchemaType.Array,
        desc: _LS(NS_SYSTEM_INTS),
        array: {
            element: NS_SYSTEM_INT
        },
    },
    //#endregion

    //#region function

    {
        name: "system.assign",
        type: SchemaType.Function,
        desc: "=",
        function: {
            retType: "T",
            args: [
                {
                    name: "input",
                    type: "T",
                    nullable: false
                }
            ],
            exps: [],
            func: (a: any) => a
        }
    },
    {
        name: "system.default",
        type: SchemaType.Function,
        desc: _LS("system.default"),
        function: {
            retType: "T",
            args: [
                {
                    name: "input",
                    type: "T",
                    nullable: true
                },
                {
                    name: "default",
                    type: "T",
                    nullable: false
                }
            ],
            exps: [],
            func: (a: any, d: any) => isNull(a) ? d : a
        }
    },
    {
        name: "system.null",
        type: SchemaType.Function,
        desc: _LS("system.null"),
        function: {
            retType: "T",
            args: [],
            exps: [],
            func: () => null
        }
    },

    //#endregion

    //#endregion

    //#region system.str

    {
        name: "system.str",
        type: SchemaType.Namespace,
        desc: _LS("system.str")
    },
    {
        name: "system.str.len",
        type: SchemaType.Function,
        desc: _LS("system.str.len"),
        function: {
            retType: "system.int",
            args: [
                {
                    name: "text",
                    type: "system.string",
                    nullable: false
                }
            ],
            exps: [],
            func: (a: string) => a.length
        }
    },
    {
        name: "system.str.concat",
        type: SchemaType.Function,
        desc: _LS("system.str.concat"),
        function: {
            retType: "system.string",
            args: [
                {
                    name: "x",
                    type: "system.string",
                    nullable: false
                },
                {
                    name: "y",
                    type: "system.string",
                    nullable: false
                }
            ],
            exps: [],
            func: (a: string, b: string) => `${a}${b}`
        },
    },
    {
        name: "system.str.substr",
        type: SchemaType.Function,
        desc: _LS("system.str.substr"),
        function: {
            retType: "system.string",
            args: [
                {
                    name: "str",
                    type: "system.string",
                    nullable: false
                },
                {
                    name: "start",
                    type: "system.int",
                    nullable: false
                },
                {
                    name: "stop",
                    type: "system.int",
                    nullable: false
                }
            ],
            exps: [],
            func: (a: string, b: number, c: number) => a.substring(b, c)
        },
    },
    {
        name: "system.str.split",
        type: SchemaType.Function,
        desc: _LS("system.str.split"),
        function: {
            retType: "system.strings",
            args: [
                {
                    name: "str",
                    type: "system.string",
                    nullable: false
                },
                {
                    name: "sep",
                    type: "system.string",
                    nullable: false
                }
            ],
            exps: [],
            func: (a: string, b: string) => a.split(b)
        },
    },

    //#endregion

    //#region system.math

    {
        name: "system.math",
        type: SchemaType.Namespace,
        desc: _LS("system.math")
    },
    {
        name: "system.math.e",
        type: SchemaType.Function,
        desc: _LS("system.math.e"),
        function: {
            retType: "system.number",
            args: [],
            exps: [],
            func: () => Math.E
        }
    },
    {
        name: "system.math.pi",
        type: SchemaType.Function,
        desc: _LS("system.math.pi"),
        function: {
            retType: "system.number",
            args: [],
            exps: [],
            func: () => Math.PI
        }
    },
    {
        name: "system.math.add",
        type: SchemaType.Function,
        desc: "+",
        function: {
            generic: "system.number",
            retType: "T",
            args: [
                {
                    name: "x",
                    type: "T",
                    nullable: false
                },
                {
                    name: "y",
                    type: "T",
                    nullable: false
                }
            ],
            exps: [],
            func: (x: number, y: number) => new BigNumber(x).plus(y).toNumber()
        },
    },
    {
        name: "system.math.addnull",
        type: SchemaType.Function,
        desc: "+?",
        function: {
            generic: "system.number",
            retType: "T",
            args: [
                {
                    name: "x",
                    type: "T",
                    nullable: true
                },
                {
                    name: "y",
                    type: "T",
                    nullable: true
                }
            ],
            exps: [],
            func: (x?: number, y?: number) => new BigNumber(x || 0).plus(y || 0).toNumber()
        },
    },
    {
        name: "system.math.divide",
        type: SchemaType.Function,
        desc: "÷",
        function: {
            generic: "system.number",
            retType: "T",
            args: [
                {
                    name: "x",
                    type: "T",
                    nullable: false
                },
                {
                    name: "y",
                    type: "T",
                    nullable: false
                }
            ],
            exps: [],
            func: (x: number, y: number) => new BigNumber(x).dividedBy(y).toNumber(),
        },
    },
    {
        name: "system.math.modulo",
        type: SchemaType.Function,
        desc: "%",
        function: {
            generic: "system.number",
            retType: "T",
            args: [
                {
                    name: "x",
                    type: "T",
                    nullable: false
                },
                {
                    name: "y",
                    type: "T",
                    nullable: false
                }
            ],
            exps: [],
            func: (x: number, y: number) => new BigNumber(x).modulo(y).toNumber(),
        },
    },
    {
        name: "system.math.multiply",
        type: SchemaType.Function,
        desc: "×",
        function: {
            generic: "system.number",
            retType: "T",
            args: [
                {
                    name: "x",
                    type: "T",
                    nullable: false
                },
                {
                    name: "y",
                    type: "T",
                    nullable: false
                }
            ],
            exps: [],
            func: (x: number, y: number) => new BigNumber(x).multipliedBy(y).toNumber()
        },
    },
    {
        name: "system.math.multiplynull",
        type: SchemaType.Function,
        desc: "×?",
        function: {
            generic: "system.number",
            retType: "T",
            args: [
                {
                    name: "x",
                    type: "T",
                    nullable: true
                },
                {
                    name: "y",
                    type: "T",
                    nullable: true
                }
            ],
            exps: [],
            func: (x?: number, y?: number) => new BigNumber(x || 0).multipliedBy(y || 0).toNumber()
        },
    },
    {
        name: "system.math.subtract",
        type: SchemaType.Function,
        desc: "-",
        function: {
            generic: "system.number",
            retType: "T",
            args: [
                {
                    name: "x",
                    type: "T",
                    nullable: false
                },
                {
                    name: "y",
                    type: "T",
                    nullable: false
                }
            ],
            exps: [],
            func: (x: number, y: number) => new BigNumber(x).minus(y).toNumber(),
        },
    },
    {
        name: "system.math.subtractnull",
        type: SchemaType.Function,
        desc: "-?",
        function: {
            generic: "system.number",
            retType: "T",
            args: [
                {
                    name: "x",
                    type: "T",
                    nullable: true
                },
                {
                    name: "y",
                    type: "T",
                    nullable: true
                }
            ],
            exps: [],
            func: (x?: number, y?: number) => new BigNumber(x || 0).minus(y || 0).toNumber()
        },
    },
    {
        name: "system.math.percent",
        type: SchemaType.Function,
        desc: _LS("system.math.percent"),
        function: {
            generic: "system.number",
            retType: "system.number",
            args: [
                {
                    name: "x",
                    type: "T",
                    nullable: false
                },
                {
                    name: "y",
                    type: "T",
                    nullable: false
                }
            ],
            exps: [],
            func: (x: number, y: number) => new BigNumber(x).dividedBy(y).multipliedBy(100).toNumber()
        },
    },
    {
        name: "system.math.abs",
        type: SchemaType.Function,
        desc: _LS("system.math.abs"),
        function: {
            generic: "system.number",
            retType: "T",
            args: [
                {
                    name: "x",
                    type: "T",
                    nullable: false
                }
            ],
            exps: [],
            func: (x: number) => new BigNumber(x).abs().toNumber()
        }
    },
    {
        name: "system.math.ceiling",
        type: SchemaType.Function,
        desc: _LS("system.math.ceiling"),
        function: {
            retType: "system.int",
            args: [
                {
                    name: "x",
                    type: "system.number",
                    nullable: false
                }
            ],
            exps: [],
            func: Math.ceil
        }
    },
    {
        name: "system.math.clamp",
        type: SchemaType.Function,
        desc: _LS("system.math.clamp"),
        function: {
            generic: "system.number",
            retType: "T",
            args: [
                {
                    name: "x",
                    type: "T",
                    nullable: false
                },
                {
                    name: "min",
                    type: "T",
                    nullable: false
                },
                {
                    name: "max",
                    type: "T",
                    nullable: false
                }
            ],
            exps: [],
            func: (x: number, min: number, max: number) => Math.max(min, Math.min(max, x))
        }
    },
    {
        name: "system.math.floor",
        type: SchemaType.Function,
        desc: _LS("system.math.floor"),
        function: {
            retType: "system.int",
            args: [
                {
                    name: "x",
                    type: "system.number",
                    nullable: false
                }
            ],
            exps: [],
            func: Math.floor,
        }
    },
    {
        name: "system.math.max",
        type: SchemaType.Function,
        desc: _LS("system.math.max"),
        function: {
            generic: "system.number",
            retType: "T",
            args: [
                {
                    name: "x",
                    type: "T",
                    nullable: false
                },
                {
                    name: "y",
                    type: "T",
                    nullable: false
                }
            ],
            exps: [],
            func: Math.max
        }
    },
    {
        name: "system.math.min",
        type: SchemaType.Function,
        desc: _LS("system.math.min"),
        function: {
            generic: "system.number",
            retType: "T",
            args: [
                {
                    name: "x",
                    type: "T",
                    nullable: false
                },
                {
                    name: "y",
                    type: "T",
                    nullable: false
                }
            ],
            exps: [],
            func: Math.min
        }
    },
    {
        name: "system.math.percenttofloat",
        type: SchemaType.Function,
        desc: _LS("system.math.percenttofloat"),
        function: {
            retType: "system.number",
            args: [
                {
                    name: "percent",
                    type: "system.percent",
                    nullable: true
                }
            ],
            exps: [
                {
                    name: "effective",
                    callType: ExpressionType.Call,
                    callFunc: "system.math.default",
                    type: "system.percent",
                    args: [
                        {
                            name: "percent"
                        },
                        {
                            value: 0
                        }
                    ]
                },
                {
                    name: "result",
                    callType: ExpressionType.Call,
                    callFunc: "system.math.divide",
                    type: "system.number",
                    args: [
                        {
                            name: "effective"
                        },
                        {
                            value: 100
                        }
                    ]
                }
            ]
        }
    },
    {
        name: "system.math.round",
        type: SchemaType.Function,
        desc: _LS("system.math.round"),
        function: {
            retType: "system.number",
            args: [
                {
                    name: "x",
                    type: "system.number",
                    nullable: false
                },
                {
                    name: "decimals",
                    type: "system.int",
                    nullable: false
                }
            ],
            exps: [],
            func: (x: number, d: number) => Math.round(x * 1.0 * Math.pow(10, d)) / Math.pow(10, d)
        }
    },
    {
        name: "system.math.todecimal",
        type: SchemaType.Function,
        desc: _LS("system.math.todecimal"),
        function: {
            retType: "system.number",
            args: [
                {
                    name: "x",
                    type: "system.number",
                    nullable: false
                }
            ],
            exps: [],
            func: (x: number) => x,
        }
    },
    {
        name: "system.math.todouble",
        type: SchemaType.Function,
        desc: _LS("system.math.todouble"),
        function: {
            retType: "system.double",
            args: [
                {
                    name: "x",
                    type: "system.number",
                    nullable: false
                }
            ],
            exps: [],
            func: (x: number) => x,
        }
    },
    {
        name: "system.math.tointeger",
        type: SchemaType.Function,
        desc: _LS("system.math.tointeger"),
        function: {
            retType: "system.int",
            args: [
                {
                    name: "x",
                    type: "system.number",
                    nullable: false
                }
            ],
            exps: [],
            func: Math.floor,
        }
    },
    {
        name: "system.math.tosingle",
        type: SchemaType.Function,
        desc: _LS("system.math.tosingle"),
        function: {
            retType: "system.float",
            args: [
                {
                    name: "x",
                    type: "system.number",
                    nullable: false
                }
            ],
            exps: [],
            func: (x: number) => x,
        }
    },
    {
        name: "system.math.acos",
        type: SchemaType.Function,
        desc: _LS("system.math.acos"),
        function: {
            retType: "system.number",
            args: [
                {
                    name: "x",
                    type: "system.number",
                    nullable: false,
                }
            ],
            exps: [],
            func: Math.acos
        }
    },
    {
        name: "system.math.asin",
        type: SchemaType.Function,
        desc: _LS("system.math.asin"),
        function: {
            retType: "system.number",
            args: [
                {
                    name: "x",
                    type: "system.number",
                    nullable: false,
                }
            ],
            exps: [],
            func: Math.asin
        }
    },
    {
        name: "system.math.atan",
        type: SchemaType.Function,
        desc: _LS("system.math.atan"),
        function: {
            retType: "system.number",
            args: [
                {
                    name: "x",
                    type: "system.number",
                    nullable: false,
                }
            ],
            exps: [],
            func: Math.atan
        }
    },
    {
        name: "system.math.cos",
        type: SchemaType.Function,
        desc: _LS("system.math.cos"),
        function: {
            retType: "system.number",
            args: [
                {
                    name: "x",
                    type: "system.number",
                    nullable: false,
                }
            ],
            exps: [],
            func: Math.cos
        }
    },
    {
        name: "system.math.sin",
        type: SchemaType.Function,
        desc: _LS("system.math.sin"),
        function: {
            retType: "system.number",
            args: [
                {
                    name: "x",
                    type: "system.number",
                    nullable: false,
                }
            ],
            exps: [],
            func: Math.sin
        }
    },
    {
        name: "system.math.tan",
        type: SchemaType.Function,
        desc: _LS("system.math.tan"),
        function: {
            retType: "system.number",
            args: [
                {
                    name: "x",
                    type: "system.number",
                    nullable: false,
                }
            ],
            exps: [],
            func: Math.tan
        }
    },
    {
        name: "system.math.acosh",
        type: SchemaType.Function,
        desc: _LS("system.math.acosh"),
        function: {
            retType: "system.number",
            args: [
                {
                    name: "x",
                    type: "system.number",
                    nullable: false,
                }
            ],
            exps: [],
            func: Math.acosh
        }
    },
    {
        name: "system.math.asinh",
        type: SchemaType.Function,
        desc: _LS("system.math.asinh"),
        function: {
            retType: "system.number",
            args: [
                {
                    name: "x",
                    type: "system.number",
                    nullable: false,
                }
            ],
            exps: [],
            func: Math.asinh
        }
    },
    {
        name: "system.math.atanh",
        type: SchemaType.Function,
        desc: _LS("system.math.atanh"),
        function: {
            retType: "system.number",
            args: [
                {
                    name: "x",
                    type: "system.number",
                    nullable: false,
                }
            ],
            exps: [],
            func: Math.atanh
        }
    },
    {
        name: "system.math.cosh",
        type: SchemaType.Function,
        desc: _LS("system.math.cosh"),
        function: {
            retType: "system.number",
            args: [
                {
                    name: "x",
                    type: "system.number",
                    nullable: false,
                }
            ],
            exps: [],
            func: Math.cosh
        }
    },
    {
        name: "system.math.sinh",
        type: SchemaType.Function,
        desc: _LS("system.math.sinh"),
        function: {
            retType: "system.number",
            args: [
                {
                    name: "x",
                    type: "system.number",
                    nullable: false,
                }
            ],
            exps: [],
            func: Math.sinh
        }
    },
    {
        name: "system.math.tanh",
        type: SchemaType.Function,
        desc: _LS("system.math.tanh"),
        function: {
            retType: "system.number",
            args: [
                {
                    name: "x",
                    type: "system.number",
                    nullable: false,
                }
            ],
            exps: [],
            func: Math.tanh
        }
    },
    {
        name: "system.math.exp",
        type: SchemaType.Function,
        desc: _LS("system.math.exp"),
        function: {
            retType: "system.number",
            args: [
                {
                    name: "x",
                    type: "system.number",
                    nullable: false,
                }
            ],
            exps: [],
            func: Math.exp
        }
    },
    {
        name: "system.math.log",
        type: SchemaType.Function,
        desc: _LS("system.math.log"),
        function: {
            retType: "system.number",
            args: [
                {
                    name: "x",
                    type: "system.number",
                    nullable: false,
                }
            ],
            exps: [],
            func: Math.log
        }
    },
    {
        name: "system.math.sqrt",
        type: SchemaType.Function,
        desc: _LS("system.math.sqrt"),
        function: {
            retType: "system.number",
            args: [
                {
                    name: "x",
                    type: "system.number",
                    nullable: false,
                }
            ],
            exps: [],
            func: Math.sqrt
        }
    },
    {
        name: "system.math.cbrt",
        type: SchemaType.Function,
        desc: _LS("system.math.cbrt"),
        function: {
            retType: "system.number",
            args: [
                {
                    name: "x",
                    type: "system.number",
                    nullable: false,
                }
            ],
            exps: [],
            func: Math.cbrt
        }
    },
    {
        name: "system.math.log10",
        type: SchemaType.Function,
        desc: _LS("system.math.log10"),
        function: {
            retType: "system.number",
            args: [
                {
                    name: "x",
                    type: "system.number",
                    nullable: false,
                }
            ],
            exps: [],
            func: Math.log10
        }
    },
    {
        name: "system.math.log2",
        type: SchemaType.Function,
        desc: _LS("system.math.log2"),
        function: {
            retType: "system.number",
            args: [
                {
                    name: "x",
                    type: "system.number",
                    nullable: false,
                }
            ],
            exps: [],
            func: Math.log2
        }
    },
    {
        name: "system.math.pow",
        type: SchemaType.Function,
        desc: _LS("system.math.pow"),
        function: {
            retType: "system.number",
            args: [
                {
                    name: "x",
                    type: "system.number",
                    nullable: false,
                }
            ],
            exps: [],
            func: Math.pow
        }
    },

    //#endregion

    //#region system.datetime

    {
        name: "system.datetime",
        type: SchemaType.Namespace,
        desc: _LS("system.datetime")
    },
    {
        name: "system.datetime.now",
        type: SchemaType.Function,
        desc: _LS("system.datetime.now"),
        function: {
            retType: "system.date",
            args: [],
            exps: [],
            func: () => new Date()
        }
    },
    {
        name: "system.datetime.getyear",
        type: SchemaType.Function,
        desc: _LS("system.datetime.getyear"),
        function: {
            retType: "system.int",
            args: [
                {
                    name: "date",
                    type: "system.date",
                    nullable: false
                }
            ],
            exps: [],
            func: (d: Date) => d.getFullYear()
        }
    },
    {
        name: "system.datetime.getmonth",
        type: SchemaType.Function,
        desc: _LS("system.datetime.getmonth"),
        function: {
            retType: "system.int",
            args: [
                {
                    name: "date",
                    type: "system.date",
                    nullable: false
                }
            ],
            exps: [],
            func: (d: Date) => d.getMonth() + 1
        }
    },
    {
        name: "system.datetime.getday",
        type: SchemaType.Function,
        desc: _LS("system.datetime.getday"),
        function: {
            retType: "system.int",
            args: [
                {
                    name: "date",
                    type: "system.date",
                    nullable: false
                }
            ],
            exps: [],
            func: (d: Date) => d.getDate()
        }
    },
    {
        name: "system.datetime.equal",
        type: SchemaType.Function,
        desc: _LS("system.datetime.equal"),
        function: {
            retType: "system.bool",
            args: [
                {
                    name: "x",
                    type: "system.date",
                    nullable: false
                },
                {
                    name: "y",
                    type: "system.date",
                    nullable: false
                }
            ],
            exps: [],
            func: (x: Date, y: Date) => x.getTime() == y.getTime()
        }
    },
    {
        name: "system.datetime.greateequal",
        type: SchemaType.Function,
        desc: _LS("system.datetime.greateequal"),
        function: {
            retType: "system.bool",
            args: [
                {
                    name: "x",
                    type: "system.date",
                    nullable: false
                },
                {
                    name: "y",
                    type: "system.date",
                    nullable: false
                }
            ],
            exps: [],
            func: (x: Date, y: Date) => x.getTime() >= y.getTime()
        }
    },
    {
        name: "system.datetime.greatethan",
        type: SchemaType.Function,
        desc: _LS("system.datetime.greatethan"),
        function: {
            retType: "system.bool",
            args: [
                {
                    name: "x",
                    type: "system.date",
                    nullable: false
                },
                {
                    name: "y",
                    type: "system.date",
                    nullable: false
                }
            ],
            exps: [],
            func: (x: Date, y: Date) => x.getTime() > y.getTime()
        }
    },
    {
        name: "system.datetime.lessequal",
        type: SchemaType.Function,
        desc: _LS("system.datetime.lessequal"),
        function: {
            retType: "system.bool",
            args: [
                {
                    name: "x",
                    type: "system.date",
                    nullable: false
                },
                {
                    name: "y",
                    type: "system.date",
                    nullable: false
                }
            ],
            exps: [],
            func: (x: Date, y: Date) => x.getTime() <= y.getTime()
        }
    },
    {
        name: "system.datetime.lessthan",
        type: SchemaType.Function,
        desc: _LS("system.datetime.lessthan"),
        function: {
            retType: "system.bool",
            args: [
                {
                    name: "x",
                    type: "system.date",
                    nullable: false
                },
                {
                    name: "y",
                    type: "system.date",
                    nullable: false
                }
            ],
            exps: [],
            func: (x: Date, y: Date) => x.getTime() < y.getTime()
        }
    },
    {
        name: "system.datetime.notequal",
        type: SchemaType.Function,
        desc: _LS("system.datetime.notequal"),
        function: {
            retType: "system.bool",
            args: [
                {
                    name: "x",
                    type: "system.date",
                    nullable: false
                },
                {
                    name: "y",
                    type: "system.date",
                    nullable: false
                }
            ],
            exps: [],
            func: (x: Date, y: Date) => x.getTime() != y.getTime()
        }
    },
    {
        name: "system.datetime.addyears",
        type: SchemaType.Function,
        desc: _LS("system.datetime.addyears"),
        function: {
            retType: "system.date",
            args: [
                {
                    name: "date",
                    type: "system.date",
                    nullable: false
                },
                {
                    name: "count",
                    type: "system.int",
                    nullable: false
                }
            ],
            exps: [],
            func: (d: Date, c: number) => {
                const newDate = new Date(d)
                newDate.setFullYear(newDate.getFullYear() + c)
                return newDate;
            }
        }
    },
    {
        name: "system.datetime.addmonths",
        type: SchemaType.Function,
        desc: _LS("system.datetime.addmonths"),
        function: {
            retType: "system.date",
            args: [
                {
                    name: "date",
                    type: "system.date",
                    nullable: false
                },
                {
                    name: "count",
                    type: "system.int",
                    nullable: false
                }
            ],
            exps: [],
            func: (d: Date, c: number) => {
                const newDate = new Date(d)
                const day = newDate.getDate()
                newDate.setMonth(newDate.getMonth() + c)

                if (newDate.getDate() < day) {
                    newDate.setDate(0)
                }

                return newDate
            }
        }
    },
    {
        name: "system.datetime.adddays",
        type: SchemaType.Function,
        desc: _LS("system.datetime.adddays"),
        function: {
            server: true,
            retType: "system.date",
            args: [
                {
                    name: "date",
                    type: "system.date",
                    nullable: false
                },
                {
                    name: "count",
                    type: "system.int",
                    nullable: false
                }
            ],
            exps: [],
            func: (d: Date, c: number) => {
                const newDate = new Date(d)
                newDate.setDate(newDate.getDate() + c)
                return newDate;
            }
        }
    },
    {
        name: "system.datetime.addhours",
        type: SchemaType.Function,
        desc: _LS("system.datetime.addhours"),
        function: {
            retType: "system.date",
            args: [
                {
                    name: "date",
                    type: "system.date",
                    nullable: false
                },
                {
                    name: "count",
                    type: "system.int",
                    nullable: false
                }
            ],
            exps: [],
            func: (d: Date, c: number) => {
                const newDate = new Date(d)
                newDate.setHours(newDate.getHours() + c)
                return newDate
            }
        }
    },
    {
        name: "system.datetime.addminutes",
        type: SchemaType.Function,
        desc: _LS("system.datetime.addminutes"),
        function: {
            retType: "system.date",
            args: [
                {
                    name: "date",
                    type: "system.date",
                    nullable: false
                },
                {
                    name: "count",
                    type: "system.int",
                    nullable: false
                }
            ],
            exps: [],
            func: (d: Date, c: number) => {
                const newDate = new Date(d)
                newDate.setMinutes(newDate.getMinutes() + c)
                return newDate
            }
        }
    },
    {
        name: "system.datetime.addseconds",
        type: SchemaType.Function,
        desc: _LS("system.datetime.addseconds"),
        function: {
            retType: "system.date",
            args: [
                {
                    name: "date",
                    type: "system.date",
                    nullable: false
                },
                {
                    name: "count",
                    type: "system.int",
                    nullable: false
                }
            ],
            exps: [],
            func: (d: Date, c: number) => {
                const newDate = new Date(d)
                newDate.setSeconds(newDate.getSeconds() + c)
                return newDate
            }
        }
    },

    //#endregion

    //#region system.collection

    {
        name: "system.collection.newstruct",
        type: SchemaType.Function,
        desc: _LS("system.collection.newstruct"),
        function: {
            generic: "system.struct",
            retType: "T",
            args: [],
            exps: [],
            func: () => { return {} }
        }
    },
    {
        name: "system.collection.getfield",
        type: SchemaType.Function,
        desc: _LS("system.collection.getfield"),
        function: {
            generic: ["system.struct"],
            retType: "T2",
            args: [
                {
                    name: "struct",
                    type: "T1",
                    nullable: false,
                },
                {
                    name: "field",
                    type: "system.string",
                    nullable: false,
                }
            ],
            exps: [],
            func: (a: any, f: string) => a[f]
        }
    },
    {
        name: "system.collection.setfield",
        type: SchemaType.Function,
        desc: _LS("system.collection.setfield"),
        function: {
            generic: ["system.struct"],
            retType: "T1",
            args: [
                {
                    name: "struct",
                    type: "T1",
                    nullable: false,
                },
                {
                    name: "field",
                    type: "system.string",
                    nullable: false,
                },
                {
                    name: "value",
                    type: "T2",
                    nullable: false,
                }
            ],
            exps: [],
            func: (a: {}, f: string, v: any): {} => ({ ...a, [f]: v })
        }
    },
    {
        name: "system.collection.delfield",
        type: SchemaType.Function,
        desc: _LS("system.collection.delfield"),
        function: {
            generic: ["system.struct"],
            retType: "T2",
            args: [
                {
                    name: "struct",
                    type: "T1",
                    nullable: false,
                },
                {
                    name: "field",
                    type: "system.string",
                    nullable: false,
                }
            ],
            exps: [],
            func: (a: {}, f: string): {} => ({ ...a, [f]: undefined })
        }
    },

    //#endregion

    //#region system.logic

    {
        name: "system.logic",
        type: SchemaType.Namespace,
        desc: _LS("system.logic")
    },
    {
        name: "system.logic.andalso",
        type: SchemaType.Function,
        desc: _LS("system.logic.andalso"),
        function: {
            retType: "system.bool",
            args: [
                {
                    name: "x",
                    type: "system.bool",
                    nullable: false
                },
                {
                    name: "y",
                    type: "system.bool",
                    nullable: false
                }
            ],
            exps: [],
            func: (x: Boolean, y: Boolean) => x && y
        }
    },
    {
        name: "system.logic.between",
        type: SchemaType.Function,
        desc: _LS("system.logic.between"),
        function: {
            generic: "system.number",
            retType: "system.bool",
            args: [
                {
                    name: "v",
                    type: "T",
                    nullable: false
                },
                {
                    name: "min",
                    type: "T",
                    nullable: false
                },
                {
                    name: "max",
                    type: "T",
                    nullable: false
                },
                {
                    name: "includeMin",
                    type: "system.bool",
                    nullable: false
                },
                {
                    name: "includeMax",
                    type: "system.bool",
                    nullable: false
                }
            ],
            exps: [],
            func: (v: any, min: any, max: any, includeMin: Boolean, includeMax: Boolean) => (includeMin ? v >= min : v > min) && (includeMax ? v <= max : v < max),
        }
    },
    {
        name: "system.logic.bitand",
        type: SchemaType.Function,
        desc: "&",
        function: {
            retType: "system.int",
            args: [
                {
                    name: "x",
                    type: "system.int",
                    nullable: false
                },
                {
                    name: "y",
                    type: "system.int",
                    nullable: false
                }
            ],
            exps: [],
            func: (x: number, y: number) => x & y
        }
    },
    {
        name: "system.logic.bitleftshift",
        type: SchemaType.Function,
        desc: "<<",
        function: {
            retType: "system.int",
            args: [
                {
                    name: "x",
                    type: "system.int",
                    nullable: false
                },
                {
                    name: "y",
                    type: "system.int",
                    nullable: false
                }
            ],
            exps: [],
            func: (x: number, y: number) => x << y
        }
    },
    {
        name: "system.logic.bitor",
        type: SchemaType.Function,
        desc: "|",
        function: {
            retType: "system.int",
            args: [
                {
                    name: "x",
                    type: "system.int",
                    nullable: false
                },
                {
                    name: "y",
                    type: "system.int",
                    nullable: false
                }
            ],
            exps: [],
            func: (x: number, y: number) => x | y
        }
    },
    {
        name: "system.logic.bitrightshift",
        type: SchemaType.Function,
        desc: ">>",
        function: {
            retType: "system.int",
            args: [
                {
                    name: "input",
                    type: "system.int",
                    nullable: false
                },
                {
                    name: "offset",
                    type: "system.int",
                    nullable: false
                }
            ],
            exps: [],
            func: (x: number, y: number) => x >> y
        }
    },
    {
        name: "system.logic.bitunary",
        type: SchemaType.Function,
        desc: "~",
        function: {
            retType: "system.int",
            args: [
                {
                    name: "input",
                    type: "system.int",
                    nullable: false
                }
            ],
            exps: [],
            func: (x: number) => ~x
        }
    },
    {
        name: "system.logic.bitxor",
        type: SchemaType.Function,
        desc: "^",
        function: {
            retType: "system.int",
            args: [
                {
                    name: "x",
                    type: "system.int",
                    nullable: false
                },
                {
                    name: "y",
                    type: "system.int",
                    nullable: false
                }
            ],
            exps: [],
            func: (x: number, y: number) => x ^ y
        }
    },
    {
        name: "system.logic.cond",
        type: SchemaType.Function,
        desc: _LS("system.logic.cond"),
        function: {
            retType: "T",
            args: [
                {
                    name: "cond",
                    type: "system.bool",
                    nullable: false
                },
                {
                    name: "trueValue",
                    type: "T",
                    nullable: false
                },
                {
                    name: "falsValue",
                    type: "T",
                    nullable: false
                }
            ],
            exps: [],
            func: (cond: Boolean, trueVal: any, falseVal: any) => cond ? trueVal : falseVal
        }
    },
    {
        name: "system.logic.equal",
        type: SchemaType.Function,
        desc: _LS("system.logic.equal"),
        function: {
            retType: "system.bool",
            args: [
                {
                    name: "x",
                    type: "T",
                    nullable: false
                },
                {
                    name: "y",
                    type: "T",
                    nullable: false
                }
            ],
            exps: [],
            func: (x: any, y: any) => x == y
        }
    },
    {
        name: "system.logic.greateequal",
        type: SchemaType.Function,
        desc: _LS("system.logic.greateequal"),
        function: {
            retType: "system.bool",
            args: [
                {
                    name: "x",
                    type: "T",
                    nullable: false
                },
                {
                    name: "y",
                    type: "T",
                    nullable: false
                }
            ],
            exps: [],
            func: (x: any, y: any) => x >= y
        }
    },
    {
        name: "system.logic.greatethan",
        type: SchemaType.Function,
        desc: _LS("system.logic.greatethan"),
        function: {
            retType: "system.bool",
            args: [
                {
                    name: "x",
                    type: "T",
                    nullable: false
                },
                {
                    name: "y",
                    type: "T",
                    nullable: false
                }
            ],
            exps: [],
            func: (x: any, y: any) => x > y
        }
    },
    {
        name: "system.logic.isnull",
        type: SchemaType.Function,
        desc: _LS("system.logic.isnull"),
        function: {
            retType: "system.bool",
            args: [
                {
                    name: "value",
                    type: "T",
                    nullable: true
                }
            ],
            exps: [],
            func: isNull
        }
    },
    {
        name: "system.logic.lessequal",
        type: SchemaType.Function,
        desc: _LS("system.logic.lessequal"),
        function: {
            retType: "system.bool",
            args: [
                {
                    name: "x",
                    type: "T",
                    nullable: false
                },
                {
                    name: "y",
                    type: "T",
                    nullable: false
                }
            ],
            exps: [],
            func: (x: any, y: any) => x <= y
        }
    },
    {
        name: "system.logic.lessthan",
        type: SchemaType.Function,
        desc: _LS("system.logic.lessthan"),
        function: {
            retType: "system.bool",
            args: [
                {
                    name: "x",
                    type: "T",
                    nullable: false
                },
                {
                    name: "y",
                    type: "T",
                    nullable: false
                }
            ],
            exps: [],
            func: (x: any, y: any) => x < y
        }
    },
    {
        name: "system.logic.not",
        type: SchemaType.Function,
        desc: _LS("system.logic.not"),
        function: {
            retType: "system.bool",
            args: [
                {
                    name: "x",
                    type: "system.bool",
                    nullable: false
                }
            ],
            exps: [],
            func: (x: boolean) => !x
        }
    },
    {
        name: "system.logic.notequal",
        type: SchemaType.Function,
        desc: _LS("system.logic.notequal"),
        function: {
            retType: "system.bool",
            args: [
                {
                    name: "x",
                    type: "T",
                    nullable: false
                },
                {
                    name: "y",
                    type: "T",
                    nullable: false
                }
            ],
            exps: [],
            func: (x: any, y: any) => x != y
        }
    },
    {
        name: "system.logic.orelse",
        type: SchemaType.Function,
        desc: _LS("system.logic.orelse"),
        function: {
            retType: "system.bool",
            args: [
                {
                    name: "x",
                    type: "system.bool",
                    nullable: false
                },
                {
                    name: "y",
                    type: "system.bool",
                    nullable: false
                }
            ],
            exps: [],
            func: (x: boolean, y: boolean) => x || y
        }
    },

    //#endregion
])