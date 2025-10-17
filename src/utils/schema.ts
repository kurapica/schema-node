import { BigNumber } from "bignumber.js"
import { SchemaType } from "../enum/schemaType"
import { registerSchema, NS_SYSTEM, NS_SYSTEM_ARRAY, NS_SYSTEM_BOOL, NS_SYSTEM_DATE, NS_SYSTEM_FULLDATE, NS_SYSTEM_INT, NS_SYSTEM_NUMBER, NS_SYSTEM_STRING, NS_SYSTEM_STRUCT, NS_SYSTEM_YEAR, NS_SYSTEM_YEARMONTH, NS_SYSTEM_DOUBLE, NS_SYSTEM_FLOAT, NS_SYSTEM_INTS, NS_SYSTEM_NUMBERS, NS_SYSTEM_RANGEDATE, NS_SYSTEM_RANGEFULLDATE, NS_SYSTEM_RANGEMONTH, NS_SYSTEM_RANGEYEAR, NS_SYSTEM_STRINGS, NS_SYSTEM_PERCENT, NS_SYSTEM_GUID, NS_SYSTEM_ENTRIES, NS_SYSTEM_ENTRY, NS_SYSTEM_LOCALE_STRING, NS_SYSTEM_LANGUAGE, NS_SYSTEM_LOCALE_TRAN, NS_SYSTEM_LOCALE_TRANS, NS_SYSTEM_LOCALE_STRINGS } from "./schemaProvider"
import { _LS, SCHEMA_LANGUAGES } from "./locale"
import { deepClone, isNull } from "./toolset"
import { ExpressionType } from "../enum/expressionType"
import { SchemaLoadState } from "../schema/nodeSchema"
import { EnumValueType } from "../enum/enumValueType"
import { IStructScalarFieldConfig } from "../schema/structSchema"

/**
 * The default schemas
 */
registerSchema([
    //#region system
    {
        name: NS_SYSTEM,
        type: SchemaType.Namespace,
        display: _LS(NS_SYSTEM),
        schemas: [
            //#region base type
            {
                name: NS_SYSTEM_ARRAY,
                type: SchemaType.Array,
                display: _LS(NS_SYSTEM_ARRAY),
                array: {
                    element: ""
                }
            },
            {
                name: NS_SYSTEM_STRUCT,
                type: SchemaType.Struct,
                display: _LS(NS_SYSTEM_STRUCT),
                struct: {
                    fields: []
                }
            },
            //#endregion

            //#region scalar
            {
                name: NS_SYSTEM_BOOL,
                type: SchemaType.Scalar,
                display: _LS(NS_SYSTEM_BOOL),
                scalar: {
                    error: _LS("system.bool.error")
                },
            },
            {
                name: NS_SYSTEM_DATE,
                type: SchemaType.Scalar,
                display: _LS(NS_SYSTEM_DATE),
                scalar: {
                    error: _LS("system.date.error")
                },
            },
            {
                name: NS_SYSTEM_NUMBER,
                type: SchemaType.Scalar,
                display: _LS(NS_SYSTEM_NUMBER),
                scalar: {
                    error: _LS("system.number.error"),
                    regex: "^(\\-|\\+)?\\d+(\\.\\d+)?(e\\-\\d+)?$",
                },
            },
            {
                name: NS_SYSTEM_DOUBLE,
                type: SchemaType.Scalar,
                display: _LS(NS_SYSTEM_DOUBLE),
                scalar: {
                    base: NS_SYSTEM_NUMBER,
                    error: _LS("system.double.error"),
                    regex: "^-?\\d+\\.?\\d+$",
                },
            },
            {
                name: NS_SYSTEM_FLOAT,
                type: SchemaType.Scalar,
                display: _LS(NS_SYSTEM_FLOAT),
                scalar: {
                    base: NS_SYSTEM_DOUBLE,
                    error: _LS("system.float.error"),
                    regex: "^\\d+(\\.\\d+)?$",
                },
            },
            {
                name: NS_SYSTEM_PERCENT,
                type: SchemaType.Scalar,
                display: _LS(NS_SYSTEM_PERCENT),
                scalar: {
                    base: NS_SYSTEM_FLOAT,
                    error: _LS("system.percent.error"),
                    regex: "^\\d+(\\.\\d+)?$",
                    upLimit: 100,
                    lowLimit: 0
                },
            },
            {
                name: NS_SYSTEM_FULLDATE,
                type: SchemaType.Scalar,
                display: _LS(NS_SYSTEM_FULLDATE),
                scalar: {
                    base: NS_SYSTEM_DATE,
                    error: _LS("system.fulldate.error"),
                },
            },
            {
                name: NS_SYSTEM_INT,
                type: SchemaType.Scalar,
                display: _LS(NS_SYSTEM_INT),
                scalar: {
                    base: NS_SYSTEM_NUMBER,
                    error: _LS("system.int.error"),
                    regex: "^(\\-|\\+)?\\d+$",
                },
            },
            {
                name: NS_SYSTEM_STRING,
                type: SchemaType.Scalar,
                display: _LS(NS_SYSTEM_STRING),
                scalar: {},
            },
            {
                name: NS_SYSTEM_YEAR,
                type: SchemaType.Scalar,
                display: _LS(NS_SYSTEM_YEAR),
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
                display: _LS(NS_SYSTEM_YEARMONTH),
                scalar: {
                    base: NS_SYSTEM_DATE,
                },
            },
            {
                name: NS_SYSTEM_GUID,
                type: SchemaType.Scalar,
                display: _LS(NS_SYSTEM_GUID),
                scalar: {
                    base: NS_SYSTEM_STRING,
                    lowLimit: 36,
                    upLimit: 36,
                    regex: "^[0-9A-Fa-f]{8}-[0-9A-Fa-f]{4}-[0-9A-Fa-f]{4}-[0-9A-Fa-f]{4}-[0-9A-Fa-f]{12}$",
                }
            },
            //#endregion

            //#region struct
            {
                name: NS_SYSTEM_RANGEDATE,
                type: SchemaType.Struct,
                display: _LS(NS_SYSTEM_RANGEDATE),
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
                display: _LS(NS_SYSTEM_RANGEFULLDATE),
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
                display: _LS(NS_SYSTEM_RANGEMONTH),
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
                display: _LS(NS_SYSTEM_RANGEYEAR),
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
            {
                name: "system.str.getlanguages",
                type: SchemaType.Function,
                display: _LS("system.str.getlanguages"),
                func: {
                    return: NS_SYSTEM_ENTRIES,
                    args: [],
                    exps: [],
                    func: () => SCHEMA_LANGUAGES,
                }
            },
            {
                name: NS_SYSTEM_LANGUAGE,
                type: SchemaType.Scalar,
                display: _LS(NS_SYSTEM_LANGUAGE),
                scalar: {
                    base: NS_SYSTEM_STRING,
                    whiteList: "system.str.getlanguages"
                }
            },
            {
                name: NS_SYSTEM_LOCALE_TRAN,
                type: SchemaType.Struct,
                display: _LS(NS_SYSTEM_LOCALE_TRAN),
                struct: {
                    fields: [
                        {
                            name: "lang",
                            type: NS_SYSTEM_LANGUAGE,
                            require: true,
                            upLimit: 8,
                            display: _LS("system.localetran.lang")
                        } as IStructScalarFieldConfig,
                        {
                            name: "tran",
                            type: NS_SYSTEM_STRING,
                            display: _LS("system.localetran.tran")
                        }
                    ]
                }
            },
            {
                name: NS_SYSTEM_LOCALE_STRING,
                type: SchemaType.Struct,
                display: _LS(NS_SYSTEM_LOCALE_STRING),
                struct: {
                    fields: [
                        {
                            name: "key",
                            type: NS_SYSTEM_STRING,
                            display: _LS("system.localestring.default"),
                            upLimit: 128
                        },
                        {
                            name: "trans",
                            type: NS_SYSTEM_LOCALE_TRANS,
                            display: _LS("system.localestring.trans")
                        }
                    ]
                }
            },
            {
                name: NS_SYSTEM_ENTRY,
                type: SchemaType.Struct,
                display: _LS(NS_SYSTEM_ENTRY),
                struct: {
                    fields: [
                        {
                            name: "value",
                            type: NS_SYSTEM_STRING,
                            display: _LS("system.entry.value"),
                            require: true,
                            upLimit: 128,
                        },
                        {
                            name: "label",
                            type: NS_SYSTEM_LOCALE_STRING,
                            display: _LS("system.entry.label"),
                            require: true,
                        }
                    ]
                }
            },
            //#endregion

            //#region array
            {
                name: NS_SYSTEM_STRINGS,
                type: SchemaType.Array,
                display: _LS(NS_SYSTEM_STRINGS),
                array: {
                    element: NS_SYSTEM_STRING,
                    primary: [],
                },
            },
            {
                name: NS_SYSTEM_NUMBERS,
                type: SchemaType.Array,
                display: _LS(NS_SYSTEM_NUMBERS),
                array: {
                    element: NS_SYSTEM_NUMBER,
                },
            },
            {
                name: NS_SYSTEM_INTS,
                type: SchemaType.Array,
                display: _LS(NS_SYSTEM_INTS),
                array: {
                    element: NS_SYSTEM_INT
                },
            },
            {
                name: NS_SYSTEM_LOCALE_TRANS,
                type: SchemaType.Array,
                display: _LS(NS_SYSTEM_LOCALE_TRANS),
                array: {
                    element: NS_SYSTEM_LOCALE_TRAN,
                    primary: [ "lang" ]
                }
            },
            {
                name: NS_SYSTEM_LOCALE_STRINGS,
                type: SchemaType.Array,
                display: _LS(NS_SYSTEM_LOCALE_STRINGS),
                array: {
                    element: NS_SYSTEM_LOCALE_STRING,
                    primary: ["key"]
                }
            },
            {
                name: NS_SYSTEM_ENTRIES,
                type: SchemaType.Array,
                display: _LS(NS_SYSTEM_ENTRIES),
                array: {
                    element: NS_SYSTEM_ENTRY,
                    primary: ["value"]
                }
            },
            //#endregion
        
            //#region function

            // conversion func
            {
                name: "system.conv",
                type: SchemaType.Namespace,
                display: _LS("system.conv"),
                schemas: [
                    {
                        name: "system.conv.assign",
                        type: SchemaType.Function,
                        display: _LS("="),
                        func: {
                            return: "T",
                            args: [
                                {
                                    name: "input",
                                    type: "T",
                                    nullable: false
                                }
                            ],
                            exps: [],
                            func: deepClone
                        }
                    },
                    {
                        name: "system.conv.default",
                        type: SchemaType.Function,
                        display: _LS("system.conv.default"),
                        func: {
                            return: "T",
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
                        name: "system.conv.null",
                        type: SchemaType.Function,
                        display: _LS("system.null"),
                        func: {
                            return: "T",
                            args: [],
                            exps: [],
                            func: () => null
                        }
                    },
                ]
            },

            // string func
            {
                name: "system.str",
                type: SchemaType.Namespace,
                display: _LS("system.str"),
                schemas: [
                    {
                        name: "system.str.len",
                        type: SchemaType.Function,
                        display: _LS("system.str.len"),
                        func: {
                            return: NS_SYSTEM_INT,
                            args: [
                                {
                                    name: "text",
                                    type: NS_SYSTEM_STRING,
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
                        display: _LS("system.str.concat"),
                        func: {
                            return: NS_SYSTEM_STRING,
                            args: [
                                {
                                    name: "x",
                                    type: NS_SYSTEM_STRING,
                                    nullable: false
                                },
                                {
                                    name: "y",
                                    type: NS_SYSTEM_STRING,
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
                        display: _LS("system.str.substr"),
                        func: {
                            return: NS_SYSTEM_STRING,
                            args: [
                                {
                                    name: "str",
                                    type: NS_SYSTEM_STRING,
                                    nullable: false
                                },
                                {
                                    name: "start",
                                    type: NS_SYSTEM_INT,
                                    nullable: false
                                },
                                {
                                    name: "end",
                                    type: NS_SYSTEM_INT,
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
                        display: _LS("system.str.split"),
                        func: {
                            return: "system.strings",
                            args: [
                                {
                                    name: "str",
                                    type: NS_SYSTEM_STRING,
                                    nullable: false
                                },
                                {
                                    name: "sep",
                                    type: NS_SYSTEM_STRING,
                                    nullable: false
                                }
                            ],
                            exps: [],
                            func: (a: string, b: string) => a.split(b)
                        },
                    },
                    {
                        name: "system.str.tolocale",
                        type: SchemaType.Function,
                        display: _LS("system.str.tolocale"),
                        func: {
                            return: NS_SYSTEM_LOCALE_STRING,
                            args: [
                                {
                                    name: "str",
                                    type: NS_SYSTEM_STRING,
                                    nullable: true
                                }
                            ],
                            exps: [],
                            func: (a?: string) => _LS(a || "")
                        }
                    },
                    {
                        name: "system.str.toentry",
                        type: SchemaType.Function,
                        display: _LS("system.str.toentry"),
                        func: {
                            return: NS_SYSTEM_ENTRY,
                            args: [
                                {
                                    name: "obj",
                                    type: NS_SYSTEM_STRUCT,
                                },
                                {
                                    name: "valueField",
                                    type: NS_SYSTEM_STRING,
                                },
                                {
                                    name: "labelField",
                                    type: NS_SYSTEM_STRING,
                                }
                            ],
                            exps: [],
                            func: (obj: any, valueField: string, labelField: string) => {
                                let value = obj ? obj[valueField] : null
                                value = isNull(value) ? "" : `${value}`
                                return {
                                    value: obj ? value : "",
                                    label: _LS(obj[labelField] || value)
                                }
                            }
                        },
                    },
                    {
                        name: "system.str.toentrys",
                        type: SchemaType.Function,
                        display: _LS("system.str.toentrys"),
                        func: {
                            return: NS_SYSTEM_ENTRIES,
                            args: [
                                {
                                    name: "objs",
                                    type: NS_SYSTEM_ARRAY,
                                },
                                {
                                    name: "valueField",
                                    type: NS_SYSTEM_STRING,
                                },
                                {
                                    name: "labelField",
                                    type: NS_SYSTEM_STRING,
                                }
                            ],
                            exps: [],
                            func: (objs: any[], valueField: string, labelField: string) => {
                                if (!objs || objs.length === 0) return []
                                return objs.map(o => {
                                    let value = o ? o[valueField] : null
                                    value = isNull(value) ? "" : `${value}`
                                    return {
                                        value: o ? value : "",
                                        label: _LS(o[labelField] || value)
                                    }
                                })
                            }
                        }
                    }
                ]
            },

            // math func
            {
                name: "system.math",
                type: SchemaType.Namespace,
                display: _LS("system.math"),
                schemas: [
                    {
                        name: "system.math.e",
                        type: SchemaType.Function,
                        display: _LS("system.math.e"),
                        func: {
                            return: NS_SYSTEM_NUMBER,
                            args: [],
                            exps: [],
                            func: () => Math.E
                        }
                    },
                    {
                        name: "system.math.pi",
                        type: SchemaType.Function,
                        display: _LS("system.math.pi"),
                        func: {
                            return: NS_SYSTEM_NUMBER,
                            args: [],
                            exps: [],
                            func: () => Math.PI
                        }
                    },
                    {
                        name: "system.math.add",
                        type: SchemaType.Function,
                        display: _LS("+"),
                        func: {
                            generic: NS_SYSTEM_NUMBER,
                            return: "T",
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
                        display: _LS("+?"),
                        func: {
                            generic: NS_SYSTEM_NUMBER,
                            return: "T",
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
                        display: _LS("÷"),
                        func: {
                            generic: NS_SYSTEM_NUMBER,
                            return: "T",
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
                        display: _LS("%"),
                        func: {
                            generic: NS_SYSTEM_NUMBER,
                            return: "T",
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
                        display: _LS("×"),
                        func: {
                            generic: NS_SYSTEM_NUMBER,
                            return: "T",
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
                        display: _LS("×?"),
                        func: {
                            generic: NS_SYSTEM_NUMBER,
                            return: "T",
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
                        display: _LS("-"),
                        func: {
                            generic: NS_SYSTEM_NUMBER,
                            return: "T",
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
                        display: _LS("-?"),
                        func: {
                            generic: NS_SYSTEM_NUMBER,
                            return: "T",
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
                        display: _LS("system.math.percent"),
                        func: {
                            generic: NS_SYSTEM_NUMBER,
                            return: NS_SYSTEM_NUMBER,
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
                                },
                                {
                                    name: "decimals",
                                    type: NS_SYSTEM_INT,
                                    nullable: true
                                }
                            ],
                            exps: [],
                            func: (x: number, y: number, d?: number) => {
                                const value = new BigNumber(x).dividedBy(y).multipliedBy(100).toNumber()
                                const remain = Math.pow(10, isNull(d) ? 2 : d)
                                return remain > 0 ? Math.round(remain * value) / remain  : value
                            }
                        },
                    },
                    {
                        name: "system.math.abs",
                        type: SchemaType.Function,
                        display: _LS("system.math.abs"),
                        func: {
                            generic: NS_SYSTEM_NUMBER,
                            return: "T",
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
                        display: _LS("system.math.ceiling"),
                        func: {
                            return: NS_SYSTEM_INT,
                            args: [
                                {
                                    name: "x",
                                    type: NS_SYSTEM_NUMBER,
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
                        display: _LS("system.math.clamp"),
                        func: {
                            generic: NS_SYSTEM_NUMBER,
                            return: "T",
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
                        display: _LS("system.math.floor"),
                        func: {
                            return: NS_SYSTEM_INT,
                            args: [
                                {
                                    name: "x",
                                    type: NS_SYSTEM_NUMBER,
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
                        display: _LS("system.math.max"),
                        func: {
                            generic: NS_SYSTEM_NUMBER,
                            return: "T",
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
                        display: _LS("system.math.min"),
                        func: {
                            generic: NS_SYSTEM_NUMBER,
                            return: "T",
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
                        name: "system.math.percenttonum",
                        type: SchemaType.Function,
                        display: _LS("system.math.percenttonum"),
                        func: {
                            return: NS_SYSTEM_NUMBER,
                            args: [
                                {
                                    name: "percent",
                                    type: NS_SYSTEM_PERCENT,
                                    nullable: true
                                }
                            ],
                            exps: [
                                {
                                    name: "effective",
                                    type: ExpressionType.Call,
                                    func: "system.math.default",
                                    return: NS_SYSTEM_PERCENT,
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
                                    type: ExpressionType.Call,
                                    func: "system.math.divide",
                                    return: NS_SYSTEM_NUMBER,
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
                        display: _LS("system.math.round"),
                        func: {
                            return: NS_SYSTEM_NUMBER,
                            args: [
                                {
                                    name: "x",
                                    type: NS_SYSTEM_NUMBER,
                                    nullable: false
                                },
                                {
                                    name: "decimals",
                                    type: NS_SYSTEM_INT,
                                    nullable: true
                                }
                            ],
                            exps: [],
                            func: (x: number, d?: number) => Math.round(x * 1.0 * Math.pow(10, d || 0)) / Math.pow(10, d || 0)
                        }
                    },
                    {
                        name: "system.math.todecimal",
                        type: SchemaType.Function,
                        display: _LS("system.math.todecimal"),
                        func: {
                            return: NS_SYSTEM_NUMBER,
                            args: [
                                {
                                    name: "x",
                                    type: NS_SYSTEM_NUMBER,
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
                        display: _LS("system.math.todouble"),
                        func: {
                            return: NS_SYSTEM_DOUBLE,
                            args: [
                                {
                                    name: "x",
                                    type: NS_SYSTEM_NUMBER,
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
                        display: _LS("system.math.tointeger"),
                        func: {
                            return: NS_SYSTEM_INT,
                            args: [
                                {
                                    name: "x",
                                    type: NS_SYSTEM_NUMBER,
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
                        display: _LS("system.math.tosingle"),
                        func: {
                            return: NS_SYSTEM_FLOAT,
                            args: [
                                {
                                    name: "x",
                                    type: NS_SYSTEM_NUMBER,
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
                        display: _LS("system.math.acos"),
                        func: {
                            return: NS_SYSTEM_NUMBER,
                            args: [
                                {
                                    name: "x",
                                    type: NS_SYSTEM_NUMBER,
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
                        display: _LS("system.math.asin"),
                        func: {
                            return: NS_SYSTEM_NUMBER,
                            args: [
                                {
                                    name: "x",
                                    type: NS_SYSTEM_NUMBER,
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
                        display: _LS("system.math.atan"),
                        func: {
                            return: NS_SYSTEM_NUMBER,
                            args: [
                                {
                                    name: "x",
                                    type: NS_SYSTEM_NUMBER,
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
                        display: _LS("system.math.cos"),
                        func: {
                            return: NS_SYSTEM_NUMBER,
                            args: [
                                {
                                    name: "x",
                                    type: NS_SYSTEM_NUMBER,
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
                        display: _LS("system.math.sin"),
                        func: {
                            return: NS_SYSTEM_NUMBER,
                            args: [
                                {
                                    name: "x",
                                    type: NS_SYSTEM_NUMBER,
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
                        display: _LS("system.math.tan"),
                        func: {
                            return: NS_SYSTEM_NUMBER,
                            args: [
                                {
                                    name: "x",
                                    type: NS_SYSTEM_NUMBER,
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
                        display: _LS("system.math.acosh"),
                        func: {
                            return: NS_SYSTEM_NUMBER,
                            args: [
                                {
                                    name: "x",
                                    type: NS_SYSTEM_NUMBER,
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
                        display: _LS("system.math.asinh"),
                        func: {
                            return: NS_SYSTEM_NUMBER,
                            args: [
                                {
                                    name: "x",
                                    type: NS_SYSTEM_NUMBER,
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
                        display: _LS("system.math.atanh"),
                        func: {
                            return: NS_SYSTEM_NUMBER,
                            args: [
                                {
                                    name: "x",
                                    type: NS_SYSTEM_NUMBER,
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
                        display: _LS("system.math.cosh"),
                        func: {
                            return: NS_SYSTEM_NUMBER,
                            args: [
                                {
                                    name: "x",
                                    type: NS_SYSTEM_NUMBER,
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
                        display: _LS("system.math.sinh"),
                        func: {
                            return: NS_SYSTEM_NUMBER,
                            args: [
                                {
                                    name: "x",
                                    type: NS_SYSTEM_NUMBER,
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
                        display: _LS("system.math.tanh"),
                        func: {
                            return: NS_SYSTEM_NUMBER,
                            args: [
                                {
                                    name: "x",
                                    type: NS_SYSTEM_NUMBER,
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
                        display: _LS("system.math.exp"),
                        func: {
                            return: NS_SYSTEM_NUMBER,
                            args: [
                                {
                                    name: "x",
                                    type: NS_SYSTEM_NUMBER,
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
                        display: _LS("system.math.log"),
                        func: {
                            return: NS_SYSTEM_NUMBER,
                            args: [
                                {
                                    name: "x",
                                    type: NS_SYSTEM_NUMBER,
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
                        display: _LS("system.math.sqrt"),
                        func: {
                            return: NS_SYSTEM_NUMBER,
                            args: [
                                {
                                    name: "x",
                                    type: NS_SYSTEM_NUMBER,
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
                        display: _LS("system.math.cbrt"),
                        func: {
                            return: NS_SYSTEM_NUMBER,
                            args: [
                                {
                                    name: "x",
                                    type: NS_SYSTEM_NUMBER,
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
                        display: _LS("system.math.log10"),
                        func: {
                            return: NS_SYSTEM_NUMBER,
                            args: [
                                {
                                    name: "x",
                                    type: NS_SYSTEM_NUMBER,
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
                        display: _LS("system.math.log2"),
                        func: {
                            return: NS_SYSTEM_NUMBER,
                            args: [
                                {
                                    name: "x",
                                    type: NS_SYSTEM_NUMBER,
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
                        display: _LS("system.math.pow"),
                        func: {
                            return: NS_SYSTEM_NUMBER,
                            args: [
                                {
                                    name: "x",
                                    type: NS_SYSTEM_NUMBER,
                                    nullable: false,
                                }
                            ],
                            exps: [],
                            func: Math.pow
                        }
                    },
                    {
                        name: "system.math.bitand",
                        type: SchemaType.Function,
                        display: _LS("&"),
                        func: {
                            return: NS_SYSTEM_INT,
                            args: [
                                {
                                    name: "x",
                                    type: NS_SYSTEM_INT,
                                    nullable: false
                                },
                                {
                                    name: "y",
                                    type: NS_SYSTEM_INT,
                                    nullable: false
                                }
                            ],
                            exps: [],
                            func: (x: number, y: number) => x & y
                        }
                    },
                    {
                        name: "system.math.bitleftshift",
                        type: SchemaType.Function,
                        display: _LS("<<"),
                        func: {
                            return: NS_SYSTEM_INT,
                            args: [
                                {
                                    name: "x",
                                    type: NS_SYSTEM_INT,
                                    nullable: false
                                },
                                {
                                    name: "y",
                                    type: NS_SYSTEM_INT,
                                    nullable: false
                                }
                            ],
                            exps: [],
                            func: (x: number, y: number) => x << y
                        }
                    },
                    {
                        name: "system.math.bitor",
                        type: SchemaType.Function,
                        display: _LS("|"),
                        func: {
                            return: NS_SYSTEM_INT,
                            args: [
                                {
                                    name: "x",
                                    type: NS_SYSTEM_INT,
                                    nullable: false
                                },
                                {
                                    name: "y",
                                    type: NS_SYSTEM_INT,
                                    nullable: false
                                }
                            ],
                            exps: [],
                            func: (x: number, y: number) => x | y
                        }
                    },
                    {
                        name: "system.math.bitrightshift",
                        type: SchemaType.Function,
                        display: _LS(">>"),
                        func: {
                            return: NS_SYSTEM_INT,
                            args: [
                                {
                                    name: "input",
                                    type: NS_SYSTEM_INT,
                                    nullable: false
                                },
                                {
                                    name: "offset",
                                    type: NS_SYSTEM_INT,
                                    nullable: false
                                }
                            ],
                            exps: [],
                            func: (x: number, y: number) => x >> y
                        }
                    },
                    {
                        name: "system.math.bitunary",
                        type: SchemaType.Function,
                        display: _LS("~"),
                        func: {
                            return: NS_SYSTEM_INT,
                            args: [
                                {
                                    name: "input",
                                    type: NS_SYSTEM_INT,
                                    nullable: false
                                }
                            ],
                            exps: [],
                            func: (x: number) => ~x
                        }
                    },
                    {
                        name: "system.math.bitxor",
                        type: SchemaType.Function,
                        display: _LS("^"),
                        func: {
                            return: NS_SYSTEM_INT,
                            args: [
                                {
                                    name: "x",
                                    type: NS_SYSTEM_INT,
                                    nullable: false
                                },
                                {
                                    name: "y",
                                    type: NS_SYSTEM_INT,
                                    nullable: false
                                }
                            ],
                            exps: [],
                            func: (x: number, y: number) => x ^ y
                        }
                    },
                ]
            },

            // datetime func
            {
                name: "system.datetime",
                type: SchemaType.Namespace,
                display: _LS("system.datetime"),
                schemas: [
                    {
                        name: "system.datetime.now",
                        type: SchemaType.Function,
                        display: _LS("system.datetime.now"),
                        func: {
                            return: NS_SYSTEM_DATE,
                            args: [],
                            exps: [],
                            func: () => new Date()
                        }
                    },
                    {
                        name: "system.datetime.getyear",
                        type: SchemaType.Function,
                        display: _LS("system.datetime.getyear"),
                        func: {
                            return: NS_SYSTEM_INT,
                            args: [
                                {
                                    name: "date",
                                    type: NS_SYSTEM_DATE,
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
                        display: _LS("system.datetime.getmonth"),
                        func: {
                            return: NS_SYSTEM_INT,
                            args: [
                                {
                                    name: "date",
                                    type: NS_SYSTEM_DATE,
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
                        display: _LS("system.datetime.getday"),
                        func: {
                            return: NS_SYSTEM_INT,
                            args: [
                                {
                                    name: "date",
                                    type: NS_SYSTEM_DATE,
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
                        display: _LS("system.datetime.equal"),
                        func: {
                            return: NS_SYSTEM_BOOL,
                            args: [
                                {
                                    name: "x",
                                    type: NS_SYSTEM_DATE,
                                    nullable: false
                                },
                                {
                                    name: "y",
                                    type: NS_SYSTEM_DATE,
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
                        display: _LS("system.datetime.greateequal"),
                        func: {
                            return: NS_SYSTEM_BOOL,
                            args: [
                                {
                                    name: "x",
                                    type: NS_SYSTEM_DATE,
                                    nullable: false
                                },
                                {
                                    name: "y",
                                    type: NS_SYSTEM_DATE,
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
                        display: _LS("system.datetime.greatethan"),
                        func: {
                            return: NS_SYSTEM_BOOL,
                            args: [
                                {
                                    name: "x",
                                    type: NS_SYSTEM_DATE,
                                    nullable: false
                                },
                                {
                                    name: "y",
                                    type: NS_SYSTEM_DATE,
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
                        display: _LS("system.datetime.lessequal"),
                        func: {
                            return: NS_SYSTEM_BOOL,
                            args: [
                                {
                                    name: "x",
                                    type: NS_SYSTEM_DATE,
                                    nullable: false
                                },
                                {
                                    name: "y",
                                    type: NS_SYSTEM_DATE,
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
                        display: _LS("system.datetime.lessthan"),
                        func: {
                            return: NS_SYSTEM_BOOL,
                            args: [
                                {
                                    name: "x",
                                    type: NS_SYSTEM_DATE,
                                    nullable: false
                                },
                                {
                                    name: "y",
                                    type: NS_SYSTEM_DATE,
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
                        display: _LS("system.datetime.notequal"),
                        func: {
                            return: NS_SYSTEM_BOOL,
                            args: [
                                {
                                    name: "x",
                                    type: NS_SYSTEM_DATE,
                                    nullable: false
                                },
                                {
                                    name: "y",
                                    type: NS_SYSTEM_DATE,
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
                        display: _LS("system.datetime.addyears"),
                        func: {
                            return: NS_SYSTEM_DATE,
                            args: [
                                {
                                    name: "date",
                                    type: NS_SYSTEM_DATE,
                                    nullable: false
                                },
                                {
                                    name: "count",
                                    type: NS_SYSTEM_INT,
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
                        display: _LS("system.datetime.addmonths"),
                        func: {
                            return: NS_SYSTEM_DATE,
                            args: [
                                {
                                    name: "date",
                                    type: NS_SYSTEM_DATE,
                                    nullable: false
                                },
                                {
                                    name: "count",
                                    type: NS_SYSTEM_INT,
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
                        display: _LS("system.datetime.adddays"),
                        func: {
                            server: true,
                            return: NS_SYSTEM_DATE,
                            args: [
                                {
                                    name: "date",
                                    type: NS_SYSTEM_DATE,
                                    nullable: false
                                },
                                {
                                    name: "count",
                                    type: NS_SYSTEM_INT,
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
                        display: _LS("system.datetime.addhours"),
                        func: {
                            return: NS_SYSTEM_DATE,
                            args: [
                                {
                                    name: "date",
                                    type: NS_SYSTEM_DATE,
                                    nullable: false
                                },
                                {
                                    name: "count",
                                    type: NS_SYSTEM_INT,
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
                        display: _LS("system.datetime.addminutes"),
                        func: {
                            return: NS_SYSTEM_DATE,
                            args: [
                                {
                                    name: "date",
                                    type: NS_SYSTEM_DATE,
                                    nullable: false
                                },
                                {
                                    name: "count",
                                    type: NS_SYSTEM_INT,
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
                        display: _LS("system.datetime.addseconds"),
                        func: {
                            return: NS_SYSTEM_DATE,
                            args: [
                                {
                                    name: "date",
                                    type: NS_SYSTEM_DATE,
                                    nullable: false
                                },
                                {
                                    name: "count",
                                    type: NS_SYSTEM_INT,
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
                    {
                        name: "system.datetime.getyears",
                        type: SchemaType.Function,
                        display: _LS("system.datetime.getyears"),
                        func: {
                            server: true,
                            return: NS_SYSTEM_INT,
                            args: [
                                {
                                    name: "start",
                                    type: NS_SYSTEM_DATE,
                                    nullable: false
                                },
                                {
                                    name: "stop",
                                    type: NS_SYSTEM_DATE,
                                    nullable: true
                                }
                            ],
                            exps: [],
                            func: (s: Date, e: Date) => {
                                e ||= new Date()
                                const start = s < e ? s : e
                                const end = s < e ? e : s
                                let years = end.getFullYear() - start.getFullYear()

                                if (end.getMonth() < start.getMonth() || (end.getMonth() === start.getMonth() && end.getDate() < start.getDate())
                                ) {
                                    years--
                                }
                                return years
                            }
                        }
                    },
                    {
                        name: "system.datetime.getmonths",
                        type: SchemaType.Function,
                        display: _LS("system.datetime.getmonths"),
                        func: {
                            server: true,
                            return: NS_SYSTEM_INT,
                            args: [
                                {
                                    name: "start",
                                    type: NS_SYSTEM_DATE,
                                    nullable: false
                                },
                                {
                                    name: "stop",
                                    type: NS_SYSTEM_DATE,
                                    nullable: true
                                }
                            ],
                            exps: [],
                            func: (s: Date, e: Date) => {
                                e ||= new Date()
                                const start = s < e ? s : e
                                const end = s < e ? e : s

                                let years = end.getFullYear() - start.getFullYear()
                                let months = end.getMonth() - start.getMonth()
                                let totalMonths = years * 12 + months

                                // Adjust if the end day is before the start day
                                if (end.getDate() < start.getDate()) {
                                    totalMonths--
                                }

                                return totalMonths
                            }
                        }
                    },
                    {
                        name: "system.datetime.getdays",
                        type: SchemaType.Function,
                        display: _LS("system.datetime.getdays"),
                        func: {
                            server: true,
                            return: NS_SYSTEM_INT,
                            args: [
                                {
                                    name: "start",
                                    type: NS_SYSTEM_DATE,
                                    nullable: false
                                },
                                {
                                    name: "stop",
                                    type: NS_SYSTEM_DATE,
                                    nullable: true
                                }
                            ],
                            exps: [],
                            func: (s: Date, e: Date) => {
                                e ||= new Date()
                                const d1 = new Date(s);
                                const d2 = new Date(e);

                                const oneDayMs = 1000 * 60 * 60 * 24;
                                const diffMs = Math.abs(d2.getTime() - d1.getTime());

                                return Math.floor(diffMs / oneDayMs);
                            }
                        }
                    },
                ]
            },

            // collection func
            {
                name: "system.collection",
                type: SchemaType.Namespace,
                display: _LS("system.collection"),
                schemas: [
                    {
                        name: "system.collection.arrlen",
                        type: SchemaType.Function,
                        display: _LS("system.collection.arrlen"),
                        func: {
                            generic: NS_SYSTEM_ARRAY,
                            return: NS_SYSTEM_INT,
                            args: [
                                {
                                    name: "array",
                                    type: "T"
                                }
                            ],
                            exps: [],
                            func: (arr: any[]) => arr.length
                        }
                    },
                    {
                        name: "system.collection.newstruct",
                        type: SchemaType.Function,
                        display: _LS("system.collection.newstruct"),
                        func: {
                            generic: NS_SYSTEM_STRUCT,
                            return: "T",
                            args: [],
                            exps: [],
                            func: () => { return {} }
                        }
                    },
                    {
                        name: "system.collection.getfield",
                        type: SchemaType.Function,
                        display: _LS("system.collection.getfield"),
                        func: {
                            generic: [NS_SYSTEM_STRUCT],
                            return: "T2",
                            args: [
                                {
                                    name: "struct",
                                    type: "T1",
                                    nullable: false,
                                },
                                {
                                    name: "field",
                                    type: NS_SYSTEM_STRING,
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
                        display: _LS("system.collection.setfield"),
                        func: {
                            generic: [NS_SYSTEM_STRUCT],
                            return: "T1",
                            args: [
                                {
                                    name: "struct",
                                    type: "T1",
                                    nullable: false,
                                },
                                {
                                    name: "field",
                                    type: NS_SYSTEM_STRING,
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
                        display: _LS("system.collection.delfield"),
                        func: {
                            generic: [NS_SYSTEM_STRUCT],
                            return: "T2",
                            args: [
                                {
                                    name: "struct",
                                    type: "T1",
                                    nullable: false,
                                },
                                {
                                    name: "field",
                                    type: NS_SYSTEM_STRING,
                                    nullable: false,
                                }
                            ],
                            exps: [],
                            func: (a: {}, f: string): {} => ({ ...a, [f]: undefined })
                        }
                    },
                    {
                        name: "system.collection.getfields",
                        type: SchemaType.Function,
                        display: _LS("system.collection.getfields"),
                        func: {
                            generic: [NS_SYSTEM_ARRAY],
                            return: "T2",
                            args: [
                                {
                                    name: "array",
                                    type: "T1",
                                    nullable: false,
                                },
                                {
                                    name: "field",
                                    type: NS_SYSTEM_STRING,
                                    nullable: false,
                                }
                            ],
                            exps: [],
                            func: (a: any[], f: string) => a.map(l => l[f]).filter(v => !isNull(v))
                        }
                    },
                    {
                        name: "system.collection.sum",
                        type: SchemaType.Function,
                        display: _LS("system.collection.sum"),
                        func: {
                            generic: NS_SYSTEM_NUMBER,
                            return: "T",
                            args: [
                                {
                                    name: "array",
                                    type: NS_SYSTEM_NUMBERS,
                                    nullable: false,
                                },
                            ],
                            exps: [
                                {
                                    name: "result",
                                    type: ExpressionType.Reduce,
                                    func: "system.math.add",
                                    return: "T",
                                    args: [
                                        {
                                            name: "array",
                                        },
                                        {
                                            value: 0
                                        }
                                    ]
                                }
                            ],
                        }
                    },
                    {
                        name: "system.collection.average",
                        type: SchemaType.Function,
                        display: _LS("system.collection.average"),
                        func: {
                            generic: NS_SYSTEM_NUMBER,
                            return: "T",
                            args: [
                                {
                                    name: "array",
                                    type: NS_SYSTEM_NUMBERS,
                                    nullable: false,
                                },
                            ],
                            exps: [
                                {
                                    name: "total",
                                    type: ExpressionType.Reduce,
                                    func: "system.math.add",
                                    return: "T",
                                    args: [
                                        {
                                            name: "array",
                                        },
                                        {
                                            value: 0
                                        }
                                    ]
                                },
                                {
                                    name: "length",
                                    type: ExpressionType.Call,
                                    func: "system.collection.arrlen",
                                    return: NS_SYSTEM_INT,
                                    args: [
                                        {
                                            name: "array"
                                        }
                                    ]
                                },
                                {
                                    name: "average",
                                    type: ExpressionType.Call,
                                    func: "system.math.divide",
                                    return: NS_SYSTEM_NUMBER,
                                    args: [
                                        {
                                            name: "total",
                                        },
                                        {
                                            name: "length"
                                        }
                                    ]
                                },
                                {
                                    name: "chkLength",
                                    type: ExpressionType.Call,
                                    func: "system.logic.greatethan",
                                    return: NS_SYSTEM_BOOL,
                                    args: [
                                        {
                                            name: "length",
                                        },
                                        {
                                            value: 0
                                        }
                                    ]
                                },
                                {
                                    name: "result",
                                    type: ExpressionType.Call,
                                    func: "system.logic.cond",
                                    return: NS_SYSTEM_NUMBER,
                                    args: [
                                        {
                                            name: "chkLength"
                                        },
                                        {
                                            name: "average"
                                        },
                                        {
                                            value: 0.0
                                        }
                                    ]
                                }
                            ],
                        }
                    },
                    {
                        name: "system.collection.containskey",
                        type: SchemaType.Function,
                        display: _LS("system.collection.containskey"),
                        func: {
                            return: NS_SYSTEM_BOOL,
                            args: [
                                {
                                    name: "object",
                                    type: NS_SYSTEM_STRUCT,
                                    nullable: false,
                                },
                                {
                                    name: "field",
                                    type: NS_SYSTEM_STRING,
                                    nullable: false,
                                }
                            ],
                            exps: [],
                            func: (obj: {}, field: string) => {
                                return !isNull(obj) && Object.prototype.hasOwnProperty.call(obj, field) && !isNull((obj as any)[field])
                            }
                        }
                    },
                    {
                        name: "system.collection.notcontainskey",
                        type: SchemaType.Function,
                        display: _LS("system.collection.notcontainskey"),
                        func: {
                            return: NS_SYSTEM_BOOL,
                            args: [
                                {
                                    name: "object",
                                    type: NS_SYSTEM_STRUCT,
                                    nullable: false,
                                },
                                {
                                    name: "field",
                                    type: NS_SYSTEM_STRING,
                                    nullable: false,
                                }
                            ],
                            exps: [],
                            func: (obj: {}, field: string) => {
                                return isNull(obj) || !Object.prototype.hasOwnProperty.call(obj, field) || isNull((obj as any)[field])
                            }
                        }
                    },
                    {
                        name: "system.collection.contains",
                        type: SchemaType.Function,
                        display: _LS("system.collection.contains"),
                        func: {
                            return: NS_SYSTEM_BOOL,
                            args: [
                                {
                                    name: "array",
                                    type: NS_SYSTEM_ARRAY,
                                    nullable: false
                                },
                                {
                                    name: "value",
                                    type: "T",
                                    nullable: false
                                }
                            ],
                            exps: [],
                            func: (arr: any[], v:any) => arr.includes(v)
                        }
                    },
                    {
                        name: "system.collection.notcontains",
                        type: SchemaType.Function,
                        display: _LS("system.collection.notcontains"),
                        func: {
                            return: NS_SYSTEM_BOOL,
                            args: [
                                {
                                    name: "array",
                                    type: NS_SYSTEM_ARRAY,
                                    nullable: false
                                },
                                {
                                    name: "value",
                                    type: "T",
                                    nullable: false
                                }
                            ],
                            exps: [],
                            func: (arr: any[], v:any) => arr.includes(v)
                        }
                    },
                    {
                        name: "system.collection.newarray",
                        type: SchemaType.Function,
                        display: _LS("system.collection.newarray"),
                        func: {
                            return: NS_SYSTEM_ARRAY,
                            args: [],
                            exps: [],
                            func: () => { return [] }
                        }
                    },
                    {
                        name: "system.collection.push",
                        type: SchemaType.Function,
                        display: _LS("system.collection.push"),
                        func: {
                            return: NS_SYSTEM_ARRAY,
                            args: [
                                {
                                    name: "array",
                                    type: NS_SYSTEM_ARRAY,
                                    nullable: false
                                },
                                {
                                    name: "value",
                                    type: "T",
                                    nullable: false
                                },
                            ],
                            exps: [],
                            func: (arr: any[], v:any) => { return [...arr, v] }
                        }
                    },
                    {
                        name: "system.collection.fieldequal",
                        type: SchemaType.Function,
                        display: _LS("system.collection.fieldequal"),
                        func: {
                            return: NS_SYSTEM_BOOL,
                            args: [
                                {
                                    name: "struct",
                                    type: NS_SYSTEM_STRUCT,
                                },
                                {
                                    name: "field",
                                    type: NS_SYSTEM_STRING,
                                },
                                {
                                    name: "value",
                                    type: "T",
                                }
                            ],
                            exps: [],
                            func: (s: {}, f: string, v: any) => !isNull(s) && (s as any)[f] == v
                        }
                    }
                ]
            },

            // logic func
            {
                name: "system.logic",
                type: SchemaType.Namespace,
                display: _LS("system.logic"),
                schemas: [
                    {
                        name: "system.logic.andalso",
                        type: SchemaType.Function,
                        display: _LS("system.logic.andalso"),
                        func: {
                            return: NS_SYSTEM_BOOL,
                            args: [
                                {
                                    name: "x",
                                    type: NS_SYSTEM_BOOL,
                                    nullable: false
                                },
                                {
                                    name: "y",
                                    type: NS_SYSTEM_BOOL,
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
                        display: _LS("system.logic.between"),
                        func: {
                            generic: NS_SYSTEM_NUMBER,
                            return: NS_SYSTEM_BOOL,
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
                                    type: NS_SYSTEM_BOOL,
                                    nullable: true
                                },
                                {
                                    name: "includeMax",
                                    type: NS_SYSTEM_BOOL,
                                    nullable: true
                                }
                            ],
                            exps: [],
                            func: (v: any, min: any, max: any, includeMin: Boolean, includeMax: Boolean) => (includeMin ? v >= min : v > min) && (includeMax ? v <= max : v < max),
                        }
                    },
                    {
                        name: "system.logic.cond",
                        type: SchemaType.Function,
                        display: _LS("system.logic.cond"),
                        func: {
                            return: "T",
                            args: [
                                {
                                    name: "cond",
                                    type: NS_SYSTEM_BOOL,
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
                        display: _LS("system.logic.equal"),
                        func: {
                            return: NS_SYSTEM_BOOL,
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
                        display: _LS("system.logic.greateequal"),
                        func: {
                            return: NS_SYSTEM_BOOL,
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
                        display: _LS("system.logic.greatethan"),
                        func: {
                            return: NS_SYSTEM_BOOL,
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
                        display: _LS("system.logic.isnull"),
                        func: {
                            return: NS_SYSTEM_BOOL,
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
                        name: "system.logic.notnull",
                        type: SchemaType.Function,
                        display: _LS("system.logic.notnull"),
                        func: {
                            return: NS_SYSTEM_BOOL,
                            args: [
                                {
                                    name: "value",
                                    type: "T",
                                    nullable: true
                                }
                            ],
                            exps: [],
                            func: (v:any) => !isNull(v)
                        }
                    },
                    {
                        name: "system.logic.lessequal",
                        type: SchemaType.Function,
                        display: _LS("system.logic.lessequal"),
                        func: {
                            return: NS_SYSTEM_BOOL,
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
                        display: _LS("system.logic.lessthan"),
                        func: {
                            return: NS_SYSTEM_BOOL,
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
                        display: _LS("system.logic.not"),
                        func: {
                            return: NS_SYSTEM_BOOL,
                            args: [
                                {
                                    name: "x",
                                    type: NS_SYSTEM_BOOL,
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
                        display: _LS("system.logic.notequal"),
                        func: {
                            return: NS_SYSTEM_BOOL,
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
                        display: _LS("system.logic.orelse"),
                        func: {
                            return: NS_SYSTEM_BOOL,
                            args: [
                                {
                                    name: "x",
                                    type: NS_SYSTEM_BOOL,
                                    nullable: false
                                },
                                {
                                    name: "y",
                                    type: NS_SYSTEM_BOOL,
                                    nullable: false
                                }
                            ],
                            exps: [],
                            func: (x: boolean, y: boolean) => x || y
                        }
                    },
                ]
            },
            //#endregion
        ]
    },
], SchemaLoadState.System)