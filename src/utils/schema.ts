import { BigNumber } from "bignumber.js"
import { SchemaType } from "../enum/schemaType"
import { registerSchema, NS_SYSTEM, NS_SYSTEM_ARRAY, NS_SYSTEM_BOOL, NS_SYSTEM_DATE, NS_SYSTEM_FULLDATE, NS_SYSTEM_INT, NS_SYSTEM_NUMBER, NS_SYSTEM_STRING, NS_SYSTEM_STRUCT, NS_SYSTEM_YEAR, NS_SYSTEM_YEARMONTH, NS_SYSTEM_DOUBLE, NS_SYSTEM_FLOAT, NS_SYSTEM_INTS, NS_SYSTEM_NUMBERS, NS_SYSTEM_RANGEDATE, NS_SYSTEM_RANGEFULLDATE, NS_SYSTEM_RANGEMONTH, NS_SYSTEM_RANGEYEAR, NS_SYSTEM_STRINGS, NS_SYSTEM_PERCENT, NS_SYSTEM_GUID, NS_SYSTEM_ENTRIES, NS_SYSTEM_ENTRY, NS_SYSTEM_LOCALE_STRING, NS_SYSTEM_LANGUAGE, NS_SYSTEM_LOCALE_TRAN, NS_SYSTEM_LOCALE_TRANS, NS_SYSTEM_LOCALE_STRINGS, NS_SYSTEM_JSON, NS_SYSTEM_SCHEMA, NS_SYSTEM_SCHEMA_NS, NS_SYSTEM_WORKFLOW, NS_SYSTEM_WORKFLOW_NODE } from "./schemaProvider"
import { _LS, SCHEMA_LANGUAGES } from "./locale"
import { deepClone, isEmpty, isEqual, isNull } from "./toolset"
import { INodeSchema, SchemaLoadState } from "../schema/nodeSchema"
import { IStructEnumFieldConfig, IStructFieldRelation, IStructScalarFieldConfig } from "../schema/structSchema"
import { IFunctionArgumentInfo } from "../schema/functionSchema"
import { EnumValueType } from "../enum/enumValueType"
import { RelationType } from "../enum/relationType"
import { ExpressionType } from "../enum/expressionType"
import { DataCombineType } from "../enum/dataCombineType"
import { EventScope } from "../enum/eventScope"
import { WorkflowMode } from "../enum/workflowMode"

//#region Utility

export const newSystemSchema = (name: string, schemas?: INodeSchema[], type: SchemaType = SchemaType.Namespace): INodeSchema => {
    return { name, type, display: _LS(name), loadState: SchemaLoadState.System, schemas: schemas }
}

export const newSystemScalar = (name: string, base?: string, error?: boolean, regex?: string, options?: {}): INodeSchema => {
    return {
        name,
        type: SchemaType.Scalar,
        display: _LS(name),
        loadState: SchemaLoadState.System,
        scalar: { base, error: error ? _LS(`${name}.error`) : undefined, regex, ...options }
    }
}

export const newSystemArray = (name: string, element: string, ...primary: string[]): INodeSchema => {
    return { name, type: SchemaType.Array, display: _LS(element ? `{[LIST.PREFIX]}{@${element}}{[LIST.SUFFIX]}` : name), loadState: SchemaLoadState.System, array: { element, primary } }
}
export const newSystemRelArray = (name: string, element: string, relations: IStructFieldRelation[], ...primary: string[]): INodeSchema => {
    return { name, type: SchemaType.Array, display: _LS(element ? `{[LIST.PREFIX]}{@${element}}{[LIST.SUFFIX]}` : name), loadState: SchemaLoadState.System, array: { element, primary, relations } }
}

export const newSystemStruct = (name: string, fields: (IStructScalarFieldConfig | IStructEnumFieldConfig)[], relations?: IStructFieldRelation[]): INodeSchema => {
    return {
        name,
        type: SchemaType.Struct,
        display: _LS(name),
        loadState: SchemaLoadState.System,
        struct: { fields: fields.map(f => ({ display: _LS(`${name}.${f.name}`), ...f })), relations },
    }
}

export const newSystemEnum = <T extends Record<string, string | number>>(name: string, e:T): INodeSchema => {
    const entries = Object.entries(e)
    return {
        name,
        type: SchemaType.Enum,
        display: _LS(name),
        loadState: SchemaLoadState.System,
        enum: {
            type: typeof entries[0][1] === "number" ? EnumValueType.Flags : EnumValueType.String,
            values: entries.map(([k, v]) => ({ name: _LS(`${name}.${k.toLowerCase()}`), value: v }))
        }
    }
}

export const newSystemFunc = (name: string, returnType: string, args: IFunctionArgumentInfo[], func: (...args: any[]) => any, generic?: string): INodeSchema => {
    return {
        name,
        type: SchemaType.Func,
        display: _LS(name),
        loadState: SchemaLoadState.System,
        func: { generic, return: returnType, args, exps: [], func }
    }
}

//#endregion

/**
 * The default schemas
 */
registerSchema([
    newSystemSchema(NS_SYSTEM, [
        //#region base type
        newSystemArray(NS_SYSTEM_ARRAY, ""),
        newSystemStruct(NS_SYSTEM_STRUCT, []),
        newSystemSchema(NS_SYSTEM_JSON, undefined, SchemaType.Json),
        //#endregion

        //#region scalar
        newSystemScalar(NS_SYSTEM_BOOL, undefined, true),
        newSystemScalar(NS_SYSTEM_DATE, undefined, true),
        newSystemScalar(NS_SYSTEM_NUMBER, undefined, true, "^(\\-|\\+)?\\d+(\\.\\d+)?(e\\-\\d+)?$"),
        newSystemScalar(NS_SYSTEM_DOUBLE, NS_SYSTEM_NUMBER, true, "^-?\\d+\\.?\\d+$"),
        newSystemScalar(NS_SYSTEM_FLOAT, NS_SYSTEM_DOUBLE, true, "^\\d+(\\.\\d+)?$"),
        newSystemScalar(NS_SYSTEM_PERCENT, NS_SYSTEM_FLOAT, true, "^\\d+(\\.\\d+)?$", { upLimit: 100, lowLimit: 0 }),
        newSystemScalar(NS_SYSTEM_FULLDATE, NS_SYSTEM_DATE, true),
        newSystemScalar(NS_SYSTEM_INT, NS_SYSTEM_NUMBER, true, "^(\\-|\\+)?\\d+$"),
        newSystemScalar(NS_SYSTEM_STRING),
        newSystemScalar(NS_SYSTEM_YEAR, NS_SYSTEM_INT, true, "^\\d{4}$"),
        newSystemScalar(NS_SYSTEM_YEARMONTH, NS_SYSTEM_DATE, true),
        newSystemScalar(NS_SYSTEM_GUID, NS_SYSTEM_STRING, false, "^[0-9A-Fa-f]{8}-[0-9A-Fa-f]{4}-[0-9A-Fa-f]{4}-[0-9A-Fa-f]{4}-[0-9A-Fa-f]{12}$", { upLimit: 36 }),
        newSystemScalar(NS_SYSTEM_LANGUAGE, NS_SYSTEM_STRING, false, "^[a-z]{2}(-?[A-Z]{2})?$", { upLimit: 8, whiteList: "system.str.getlanguages" }),

        //#endregion

        //#region struct
        newSystemStruct(NS_SYSTEM_RANGEDATE, [
            { name: "start", type: NS_SYSTEM_DATE, require: true },
            { name: "stop", type: NS_SYSTEM_DATE, require: true }
        ]),
        newSystemStruct(NS_SYSTEM_RANGEFULLDATE, [
            { name: "start", type: NS_SYSTEM_FULLDATE, require: true },
            { name: "stop", type: NS_SYSTEM_FULLDATE, require: true }
        ]),
        newSystemStruct(NS_SYSTEM_RANGEMONTH, [
            { name: "start", type: NS_SYSTEM_YEARMONTH, require: true },
            { name: "stop", type: NS_SYSTEM_YEARMONTH, require: true }
        ]),
        newSystemStruct(NS_SYSTEM_RANGEYEAR, [
            { name: "start", type: NS_SYSTEM_YEAR, require: true },
            { name: "stop", type: NS_SYSTEM_YEAR, require: true }
        ]),
        newSystemStruct(NS_SYSTEM_LOCALE_TRAN, [
            { name: "lang", type: NS_SYSTEM_LANGUAGE, require: true },
            { name: "tran", type: NS_SYSTEM_STRING }
        ]),
        newSystemStruct(NS_SYSTEM_LOCALE_STRING, [
            { name: "key", type: NS_SYSTEM_STRING, upLimit: 128 },
            { name: "trans", type: NS_SYSTEM_LOCALE_TRANS }
        ]),
        newSystemStruct(NS_SYSTEM_ENTRY, [
            { name: "value", type: NS_SYSTEM_STRING, require: true, upLimit: 128 },
            { name: "label", type: NS_SYSTEM_LOCALE_STRING, require: true }
        ]),
        //#endregion

        //#region array

        newSystemArray(NS_SYSTEM_STRINGS, NS_SYSTEM_STRING),
        newSystemArray(NS_SYSTEM_NUMBERS, NS_SYSTEM_NUMBER),
        newSystemArray(NS_SYSTEM_INTS, NS_SYSTEM_INT),
        newSystemArray(NS_SYSTEM_LOCALE_TRANS, NS_SYSTEM_LOCALE_TRAN, "lang"),
        newSystemArray(NS_SYSTEM_LOCALE_STRINGS, NS_SYSTEM_LOCALE_STRING, "key"),
        newSystemArray(NS_SYSTEM_ENTRIES, NS_SYSTEM_ENTRY, "value"),

        //#endregion

        //#region function

        // conversion func
        newSystemSchema("system.conv", [
            newSystemFunc("system.conv.assign", "T", [ { name: "input", type: "T" }], deepClone),

            newSystemFunc("system.conv.default", "T", [
                { name: "input", type: "T", nullable: true },
                { name: "default", type: "T" }
            ], (a: any, d: any) => isNull(a) ? d : a),

            newSystemFunc("system.conv.null", "T", [], () => null)
        ]),

        // string func
        newSystemSchema("system.str", [
            newSystemFunc("system.str.getlanguages", NS_SYSTEM_ENTRIES, [], () => SCHEMA_LANGUAGES),

            newSystemFunc("system.str.len", NS_SYSTEM_INT, [{ name: "text", type: NS_SYSTEM_STRING }], (a: string) => a.length),

            newSystemFunc("system.str.concat", NS_SYSTEM_STRING, [
                { name: "x", type: NS_SYSTEM_STRING, nullable: true },
                { name: "y", type: NS_SYSTEM_STRING, nullable: true }
            ], (a: string, b: string) => `${(isNull(a) ? "" : a)}${(isNull(b) ? "" : b)}`),

            newSystemFunc("system.str.substr", NS_SYSTEM_STRING, [
                { name: "str", type: NS_SYSTEM_STRING },
                { name: "start", type: NS_SYSTEM_INT },
                { name: "end", type: NS_SYSTEM_INT, nullable: true }
            ], (a: string, b: number, c?: number) => a.substring(b, c)),

            newSystemFunc("system.str.split", NS_SYSTEM_STRINGS, [
                { name: "str", type: NS_SYSTEM_STRING },
                { name: "sep", type: NS_SYSTEM_STRING }
            ], (a: string, b: string) => a.split(b).filter(s => s.length)),

            newSystemFunc("system.str.tolocale", NS_SYSTEM_LOCALE_STRING, [{ name: "str", type: NS_SYSTEM_STRING, nullable: true }], (a?: string) => _LS(a || "")),

            newSystemFunc("system.str.toentry", NS_SYSTEM_ENTRY, [
                { name: "obj", type: NS_SYSTEM_STRUCT },
                { name: "valueField", type: NS_SYSTEM_STRING },
                { name: "labelField", type: NS_SYSTEM_STRING }
            ], (obj: any, valueField: string, labelField: string) => {
                let value = obj ? obj[valueField] : null
                value = isNull(value) ? "" : `${value}`
                return {
                    value: obj ? value : "",
                    label: _LS(obj[labelField] || value)
                }
            }),

            newSystemFunc("system.str.toentrys", NS_SYSTEM_ENTRIES, [
                { name: "objs", type: NS_SYSTEM_ARRAY },
                { name: "valueField", type: NS_SYSTEM_STRING },
                { name: "labelField", type: NS_SYSTEM_STRING }
            ], (objs: any[], valueField: string, labelField: string) => {
                if (!objs || objs.length === 0) return []
                return objs.map(o => {
                    let value = o ? o[valueField] : null
                    value = isNull(value) ? "" : `${value}`
                    return {
                        value: o ? value : "",
                        label: _LS(o[labelField] || value)
                    }
                })
            }),

            newSystemFunc("system.str.newguid", NS_SYSTEM_GUID, [], () => crypto.randomUUID()),
        ]),

        // math func
        newSystemSchema("system.math", [
            newSystemFunc("system.math.e", NS_SYSTEM_NUMBER, [], () => Math.E),

            newSystemFunc("system.math.pi", NS_SYSTEM_NUMBER, [], () => Math.PI),

            newSystemFunc("system.math.add", "T", [
                { name: "x", type: "T" },
                { name: "y", type: "T" }
            ], (x: number, y: number) => new BigNumber(x).plus(y).toNumber()),

            newSystemFunc("system.math.addnull", NS_SYSTEM_NUMBER, [
                { name: "x", type: "T", nullable: true },
                { name: "y", type: "T", nullable: true }
            ], (x?: number, y?: number) => new BigNumber(x || 0).plus(y || 0).toNumber()),

            newSystemFunc("system.math.divide", "T", [
                { name: "x", type: "T" },
                { name: "y", type: "T" }
            ], (x: number, y: number) => new BigNumber(x).dividedBy(y).toNumber()),

            newSystemFunc("system.math.modulo", "T", [
                { name: "x", type: "T" },
                { name: "y", type: "T" }
            ], (x: number, y: number) => new BigNumber(x).modulo(y).toNumber()),

            newSystemFunc("system.math.multiply", "T", [
                { name: "x", type: "T" },
                { name: "y", type: "T" }
            ], (x: number, y: number) => new BigNumber(x).multipliedBy(y).toNumber()),

            newSystemFunc("system.math.multiplynull", "T", [
                { name: "x", type: "T", nullable: true },
                { name: "y", type: "T", nullable: true }
            ], (x?: number, y?: number) => new BigNumber(x || 0).multipliedBy(y || 0).toNumber()),

            newSystemFunc("system.math.subtract", "T", [
                { name: "x", type: "T" },
                { name: "y", type: "T" }
            ], (x: number, y: number) => new BigNumber(x).minus(y).toNumber()),

            newSystemFunc("system.math.subtractnull", "T", [
                { name: "x", type: "T", nullable: true },
                { name: "y", type: "T", nullable: true }
            ], (x?: number, y?: number) => new BigNumber(x || 0).minus(y || 0).toNumber()),

            newSystemFunc("system.math.percent", "T", [
                { name: "x", type: "T" },
                { name: "y", type: "T" },
                { name: "decimals", type: NS_SYSTEM_INT, nullable: true }
            ], (x: number, y: number, d?: number) => {
                const value = new BigNumber(x).dividedBy(y).multipliedBy(100).toNumber()
                const remain = Math.pow(10, isNull(d) ? 2 : d)
                return remain > 0 ? Math.round(remain * value) / remain : value
            }, NS_SYSTEM_NUMBER),

            newSystemFunc("system.math.abs", "T", [{ name: "x", type: "T" }], (x: number) => new BigNumber(x).abs().toNumber(), NS_SYSTEM_NUMBER),

            newSystemFunc("system.math.ceiling", NS_SYSTEM_INT, [{ name: "x", type: NS_SYSTEM_NUMBER }], Math.ceil),

            newSystemFunc("system.math.clamp", "T", [
                { name: "x", type: "T" },
                { name: "min", type: "T" },
                { name: "max", type: "T" }
            ], (x: number, min: number, max: number) => Math.max(min, Math.min(max, x)), NS_SYSTEM_NUMBER),

            newSystemFunc("system.math.floor", NS_SYSTEM_INT, [{ name: "x", type: NS_SYSTEM_NUMBER }], Math.floor),

            newSystemFunc("system.math.max", "T", [
                { name: "x", type: "T" },
                { name: "y", type: "T" }
            ], Math.max, NS_SYSTEM_NUMBER),

            newSystemFunc("system.math.min", "T", [
                { name: "x", type: "T" },
                { name: "y", type: "T" }
            ], Math.min, NS_SYSTEM_NUMBER),

            newSystemFunc("system.math.percenttonum", NS_SYSTEM_NUMBER, [
                { name: "percent", type: NS_SYSTEM_PERCENT, nullable: true }
            ], (percent: number | null) => new BigNumber(percent || 0).dividedBy(100).toNumber()),

            newSystemFunc("system.math.round", NS_SYSTEM_NUMBER, [
                { name: "x", type: NS_SYSTEM_NUMBER },
                { name: "decimals", type: NS_SYSTEM_INT, nullable: true }
            ], (x: number, d?: number) => Math.round(x * 1.0 * Math.pow(10, d || 0)) / Math.pow(10, d || 0)),

            newSystemFunc("system.math.todecimal", NS_SYSTEM_NUMBER, [{ name: "x", type: NS_SYSTEM_NUMBER }], (x: number) => x),

            newSystemFunc("system.math.todouble", NS_SYSTEM_DOUBLE, [{ name: "x", type: NS_SYSTEM_NUMBER }], (x: number) => x),

            newSystemFunc("system.math.tointeger", NS_SYSTEM_INT, [{ name: "x", type: NS_SYSTEM_NUMBER }], Math.floor),

            newSystemFunc("system.math.tosingle", NS_SYSTEM_FLOAT, [{ name: "x", type: NS_SYSTEM_NUMBER }], (x: number) => x),

            newSystemFunc("system.math.acos", NS_SYSTEM_NUMBER, [{ name: "x", type: NS_SYSTEM_NUMBER }], Math.acos),

            newSystemFunc("system.math.asin", NS_SYSTEM_NUMBER, [{ name: "x", type: NS_SYSTEM_NUMBER }], Math.asin),

            newSystemFunc("system.math.atan", NS_SYSTEM_NUMBER, [{ name: "x", type: NS_SYSTEM_NUMBER }], Math.atan),

            newSystemFunc("system.math.cos", NS_SYSTEM_NUMBER, [{ name: "x", type: NS_SYSTEM_NUMBER }], Math.cos),

            newSystemFunc("system.math.sin", NS_SYSTEM_NUMBER, [{ name: "x", type: NS_SYSTEM_NUMBER }], Math.sin),

            newSystemFunc("system.math.tan", NS_SYSTEM_NUMBER, [{ name: "x", type: NS_SYSTEM_NUMBER }], Math.tan),

            newSystemFunc("system.math.acosh", NS_SYSTEM_NUMBER, [{ name: "x", type: NS_SYSTEM_NUMBER }], Math.acosh),

            newSystemFunc("system.math.asinh", NS_SYSTEM_NUMBER, [{ name: "x", type: NS_SYSTEM_NUMBER }], Math.asinh),

            newSystemFunc("system.math.atanh", NS_SYSTEM_NUMBER, [{ name: "x", type: NS_SYSTEM_NUMBER }], Math.atanh),

            newSystemFunc("system.math.cosh", NS_SYSTEM_NUMBER, [{ name: "x", type: NS_SYSTEM_NUMBER }], Math.cosh),

            newSystemFunc("system.math.sinh", NS_SYSTEM_NUMBER, [{ name: "x", type: NS_SYSTEM_NUMBER }], Math.sinh),

            newSystemFunc("system.math.tanh", NS_SYSTEM_NUMBER, [{ name: "x", type: NS_SYSTEM_NUMBER }], Math.tanh),

            newSystemFunc("system.math.exp", NS_SYSTEM_NUMBER, [{ name: "x", type: NS_SYSTEM_NUMBER }], Math.exp),

            newSystemFunc("system.math.log", NS_SYSTEM_NUMBER, [{ name: "x", type: NS_SYSTEM_NUMBER }], Math.log),

            newSystemFunc("system.math.sqrt", NS_SYSTEM_NUMBER, [{ name: "x", type: NS_SYSTEM_NUMBER }], Math.sqrt),

            newSystemFunc("system.math.cbrt", NS_SYSTEM_NUMBER, [{ name: "x", type: NS_SYSTEM_NUMBER }], Math.cbrt),

            newSystemFunc("system.math.log10", NS_SYSTEM_NUMBER, [{ name: "x", type: NS_SYSTEM_NUMBER }], Math.log10),

            newSystemFunc("system.math.log2", NS_SYSTEM_NUMBER, [{ name: "x", type: NS_SYSTEM_NUMBER }], Math.log2),

            newSystemFunc("system.math.pow", NS_SYSTEM_NUMBER, [{ name: "x", type: NS_SYSTEM_NUMBER }], Math.pow),

            newSystemFunc("system.math.bitand", NS_SYSTEM_INT, [{ name: "x", type: NS_SYSTEM_INT }, { name: "y", type: NS_SYSTEM_INT }], (x: number, y: number) => x & y),

            newSystemFunc("system.math.bitleftshift", NS_SYSTEM_INT, [{ name: "x", type: NS_SYSTEM_INT }, { name: "y", type: NS_SYSTEM_INT }], (x: number, y: number) => x << y),

            newSystemFunc("system.math.bitor", NS_SYSTEM_INT, [{ name: "x", type: NS_SYSTEM_INT }, { name: "y", type: NS_SYSTEM_INT }], (x: number, y: number) => x | y),

            newSystemFunc("system.math.bitrightshift", NS_SYSTEM_INT, [{ name: "x", type: NS_SYSTEM_INT }, { name: "y", type: NS_SYSTEM_INT }], (x: number, y: number) => x >> y),

            newSystemFunc("system.math.bitunary", NS_SYSTEM_INT, [{ name: "input", type: NS_SYSTEM_INT }], (x: number) => ~x),

            newSystemFunc("system.math.bitxor", NS_SYSTEM_INT, [{ name: "x", type: NS_SYSTEM_INT }, { name: "y", type: NS_SYSTEM_INT }], (x: number, y: number) => x ^ y)
        ]),

        // datetime func
        newSystemSchema("system.datetime", [
            newSystemFunc("system.datetime.now", NS_SYSTEM_DATE, [], () => new Date()),

            newSystemFunc("system.datetime.getyear", NS_SYSTEM_DATE, [{ name: "date", type: NS_SYSTEM_DATE }], (d: Date) => d.getFullYear()),

            newSystemFunc("system.datetime.getmonth", NS_SYSTEM_DATE, [{ name: "date", type: NS_SYSTEM_DATE }], (d: Date) => d.getMonth() + 1),

            newSystemFunc("system.datetime.getday", NS_SYSTEM_DATE, [{ name: "date", type: NS_SYSTEM_DATE }], (d: Date) => d.getDate()),

            newSystemFunc("system.datetime.equal", NS_SYSTEM_BOOL, [{ name: "x", type: NS_SYSTEM_DATE },{ name: "y", type: NS_SYSTEM_DATE }], (x: Date, y: Date) => x.getTime() == y.getTime()),

            newSystemFunc("system.datetime.greateequal", NS_SYSTEM_BOOL, [{ name: "x", type: NS_SYSTEM_DATE },{ name: "y", type: NS_SYSTEM_DATE }], (x: Date, y: Date) => x.getTime() >= y.getTime()),

            newSystemFunc("system.datetime.greatethan", NS_SYSTEM_BOOL, [{ name: "x", type: NS_SYSTEM_DATE },{ name: "y", type: NS_SYSTEM_DATE }], (x: Date, y: Date) => x.getTime() > y.getTime()),

            newSystemFunc("system.datetime.lessequal", NS_SYSTEM_BOOL, [{ name: "x", type: NS_SYSTEM_DATE },{ name: "y", type: NS_SYSTEM_DATE }], (x: Date, y: Date) => x.getTime() <= y.getTime()),

            newSystemFunc("system.datetime.lessthan", NS_SYSTEM_BOOL, [{ name: "x", type: NS_SYSTEM_DATE },{ name: "y", type: NS_SYSTEM_DATE }], (x: Date, y: Date) => x.getTime() < y.getTime()),

            newSystemFunc("system.datetime.notequal", NS_SYSTEM_BOOL, [{ name: "x", type: NS_SYSTEM_DATE },{ name: "y", type: NS_SYSTEM_DATE }], (x: Date, y: Date) => x.getTime() != y.getTime()),

            newSystemFunc("system.datetime.addyears", NS_SYSTEM_DATE, [
                { name: "date", type: NS_SYSTEM_DATE },
                { name: "count", type: NS_SYSTEM_INT }
            ], (d: Date, c: number) => {
                const newDate = new Date(d)
                newDate.setFullYear(newDate.getFullYear() + c)
                return newDate;
            }),

            newSystemFunc("system.datetime.addmonths", NS_SYSTEM_DATE, [
                { name: "date", type: NS_SYSTEM_DATE },
                { name: "count", type: NS_SYSTEM_INT }
            ], (d: Date, c: number) => {
                const newDate = new Date(d)
                const day = newDate.getDate()
                newDate.setMonth(newDate.getMonth() + c)

                if (newDate.getDate() < day)
                    newDate.setDate(0)

                return newDate
            }),

            newSystemFunc("system.datetime.adddays", NS_SYSTEM_DATE, [
                { name: "date", type: NS_SYSTEM_DATE },
                { name: "count", type: NS_SYSTEM_INT }
            ], (d: Date, c: number) => {
                const newDate = new Date(d)
                newDate.setDate(newDate.getDate() + c)
                return newDate;
            }),

            newSystemFunc("system.datetime.addhours", NS_SYSTEM_DATE, [
                { name: "date", type: NS_SYSTEM_DATE },
                { name: "count", type: NS_SYSTEM_INT }
            ], (d: Date, c: number) => {
                const newDate = new Date(d)
                newDate.setHours(newDate.getHours() + c)
                return newDate
            }),

            newSystemFunc("system.datetime.addminutes", NS_SYSTEM_DATE, [
                { name: "date", type: NS_SYSTEM_DATE },
                { name: "count", type: NS_SYSTEM_INT }
            ], (d: Date, c: number) => {
                const newDate = new Date(d)
                newDate.setMinutes(newDate.getMinutes() + c)
                return newDate
            }),

            newSystemFunc("system.datetime.addseconds", NS_SYSTEM_DATE, [
                { name: "date", type: NS_SYSTEM_DATE },
                { name: "count", type: NS_SYSTEM_INT }
            ], (d: Date, c: number) => {
                const newDate = new Date(d)
                newDate.setSeconds(newDate.getSeconds() + c)
                return newDate
            }),

            newSystemFunc("system.datetime.getyears", NS_SYSTEM_INT, [
                { name: "start", type: NS_SYSTEM_DATE },
                { name: "stop", type: NS_SYSTEM_DATE, nullable: true }
            ], (s: Date, e: Date) => {
                e ||= new Date()
                const start = s < e ? s : e
                const end = s < e ? e : s
                let years = end.getFullYear() - start.getFullYear()

                if (end.getMonth() < start.getMonth() || (end.getMonth() === start.getMonth() && end.getDate() < start.getDate()))years--
                return years
            }),

            newSystemFunc("system.datetime.getmonths", NS_SYSTEM_INT, [
                { name: "start", type: NS_SYSTEM_DATE },
                { name: "stop", type: NS_SYSTEM_DATE, nullable: true }
            ], (s: Date, e: Date) => {
                e ||= new Date()
                const start = s < e ? s : e
                const end = s < e ? e : s

                let years = end.getFullYear() - start.getFullYear()
                let months = end.getMonth() - start.getMonth()
                let totalMonths = years * 12 + months

                // Adjust if the end day is before the start day
                if (end.getDate() < start.getDate()) totalMonths--

                return totalMonths
            }),

            newSystemFunc("system.datetime.getdays", NS_SYSTEM_INT, [
                { name: "start", type: NS_SYSTEM_DATE },
                { name: "stop", type: NS_SYSTEM_DATE, nullable: true }
            ], (s: Date, e: Date) => {
                e ||= new Date()
                const d1 = new Date(s);
                const d2 = new Date(e);

                const oneDayMs = 1000 * 60 * 60 * 24;
                const diffMs = Math.abs(d2.getTime() - d1.getTime());

                return Math.floor(diffMs / oneDayMs);
            }),
        ]),

        // collection func
        newSystemSchema("system.collection", [
            newSystemFunc("system.collection.arrlen", NS_SYSTEM_INT, [{ name: "array", type: "T" }], (arr: any[]) => arr.length, NS_SYSTEM_ARRAY),

            newSystemFunc("system.collection.newstruct", "T", [], () => { return {} }, NS_SYSTEM_STRUCT),

            newSystemFunc("system.collection.getfield", "T2", [{ name: "struct", type: "T1" },{ name: "field", type: NS_SYSTEM_STRING }], (a: any, f: string) => a[f], NS_SYSTEM_STRUCT),

            newSystemFunc("system.collection.setfield", "T1", [
                { name: "struct", type: "T1" },
                { name: "field", type: NS_SYSTEM_STRING },
                { name: "value", type: "T2" }
            ], (a: {}, f: string, v: any): {} => ({ ...a, [f]: v }), NS_SYSTEM_STRUCT),

            newSystemFunc("system.collection.delfield", "T", [
                { name: "struct", type: "T" },
                { name: "field", type: NS_SYSTEM_STRING }
            ], (a: {}, f: string): {} => ({ ...a, [f]: undefined }), NS_SYSTEM_STRUCT),

            newSystemFunc("system.collection.getfields", "T2", [
                { name: "array", type: "T1" },
                { name: "field", type: NS_SYSTEM_STRING }
            ], (a: any[], f: string) => a.map(l => l[f]).filter(v => !isNull(v)), NS_SYSTEM_ARRAY),

            newSystemFunc("system.collection.sum", "T", [{ name: "array", type: NS_SYSTEM_NUMBERS }], (arr) => {
                let sum = new BigNumber(0)
                arr.forEach(v => sum = sum.plus(v))
                return sum.toNumber()
            }, NS_SYSTEM_NUMBER),

            newSystemFunc("system.collection.average", "T", [{ name: "array", type: NS_SYSTEM_NUMBERS }], (arr) => {
                let sum = new BigNumber(0)
                arr.forEach(v => sum = sum.plus(v))
                if (arr.length === 0) return 0
                return sum.dividedBy(arr.length).toNumber()
            }, NS_SYSTEM_NUMBER),

            newSystemFunc("system.collection.containskey", NS_SYSTEM_BOOL, [
                { name: "object", type: NS_SYSTEM_STRUCT },
                { name: "field", type: NS_SYSTEM_STRING }
            ], (obj: {}, field: string) => {
                return !isNull(obj) && Object.prototype.hasOwnProperty.call(obj, field) && !isNull((obj as any)[field])
            }),

            newSystemFunc("system.collection.notcontainskey", NS_SYSTEM_BOOL, [
                { name: "object", type: NS_SYSTEM_STRUCT },
                { name: "field", type: NS_SYSTEM_STRING }
            ], (obj: {}, field: string) => {
                return isNull(obj) || !Object.prototype.hasOwnProperty.call(obj, field) || isNull((obj as any)[field])
            }),

            newSystemFunc("system.collection.contains", NS_SYSTEM_INT, [
                { name: "array", type: NS_SYSTEM_ARRAY },
                { name: "value", type: "T" }
            ], (arr: any[], v: any) => arr.includes(v)),

            newSystemFunc("system.collection.notcontains", NS_SYSTEM_BOOL, [
                { name: "array", type: NS_SYSTEM_ARRAY },
                { name: "value", type: "T" }
            ], (arr: any[], v: any) => arr.includes(v)),

            newSystemFunc("system.collection.newarray", NS_SYSTEM_ARRAY, [], () => []),

            newSystemFunc("system.collection.push", NS_SYSTEM_ARRAY, [
                { name: "array", type: NS_SYSTEM_ARRAY },
                { name: "value", type: "T" }
            ], (arr: any[], v: any) => { return [...arr, v] }),

            newSystemFunc("system.collection.fieldequal", NS_SYSTEM_ARRAY, [
                { name: "struct", type: NS_SYSTEM_STRUCT },
                { name: "field", type: NS_SYSTEM_STRING },
                { name: "value", type: "T" }
            ], (s: {}, f: string, v: any) => !isNull(s) &&  isEqual((s as any)[f], v)),
        ]),

        // logic func
        newSystemSchema("system.logic", [
            newSystemFunc("system.logic.andalso", NS_SYSTEM_BOOL, [
                { name: "x", type: NS_SYSTEM_BOOL },
                { name: "y", type: NS_SYSTEM_BOOL }
            ], (x: Boolean, y: Boolean) => x && y),

            newSystemFunc("system.logic.between", NS_SYSTEM_BOOL, [
                { name: "v", type: "T" },
                { name: "min", type: "T" },
                { name: "max", type: "T" },
                { name: "includeMin", type: NS_SYSTEM_BOOL, nullable: true },
                { name: "includeMax", type: NS_SYSTEM_BOOL, nullable: true }
            ], (v: any, min: any, max: any, includeMin: Boolean, includeMax: Boolean) =>
                (includeMin ? v >= min : v > min) && (includeMax ? v <= max : v < max), NS_SYSTEM_NUMBER),

            newSystemFunc("system.logic.cond", "T", [
                { name: "cond", type: NS_SYSTEM_BOOL },
                { name: "trueValue", type: "T" },
                { name: "falseValue", type: "T" }
            ], (cond: Boolean, trueVal: any, falseVal: any) => cond ? trueVal : falseVal),

            newSystemFunc("system.logic.equal", NS_SYSTEM_BOOL, [
                { name: "x", type: "T" },
                { name: "y", type: "T" }
            ], isEqual),

            newSystemFunc("system.logic.greateequal", NS_SYSTEM_BOOL, [
                { name: "x", type: "T" },
                { name: "y", type: "T" }
            ], (x: any, y: any) => x >= y),

            newSystemFunc("system.logic.greatethan", NS_SYSTEM_BOOL, [
                { name: "x", type: "T" },
                { name: "y", type: "T" }
            ], (x: any, y: any) => x > y),

            newSystemFunc("system.logic.isnull", NS_SYSTEM_BOOL, [
                { name: "value", type: "T", nullable: true }
            ], isNull),

            newSystemFunc("system.logic.notnull", NS_SYSTEM_BOOL, [
                { name: "value", type: "T", nullable: true }
            ], (v: any) => !isNull(v)),

            newSystemFunc("system.logic.isempty", NS_SYSTEM_BOOL, [
                { name: "value", type: "T", nullable: true }
            ], isEmpty),

            newSystemFunc("system.logic.notempty", NS_SYSTEM_BOOL, [
                { name: "value", type: "T", nullable: true }
            ], (v: any) => !isEmpty(v)),

            newSystemFunc("system.logic.lessequal", NS_SYSTEM_BOOL, [
                { name: "x", type: "T" },
                { name: "y", type: "T" }
            ], (x: any, y: any) => x <= y),

            newSystemFunc("system.logic.lessthan", NS_SYSTEM_BOOL, [
                { name: "x", type: "T" },
                { name: "y", type: "T" }
            ], (x: any, y: any) => x < y),

            newSystemFunc("system.logic.not", NS_SYSTEM_BOOL, [
                { name: "x", type: NS_SYSTEM_BOOL }
            ], (x: boolean) => !x),

            newSystemFunc("system.logic.notequal", NS_SYSTEM_BOOL, [
                { name: "x", type: "T" },
                { name: "y", type: "T" }
            ], (x: any, y: any) => !isEqual(x, y)),

            newSystemFunc("system.logic.orelse", NS_SYSTEM_BOOL, [
                { name: "x", type: NS_SYSTEM_BOOL },
                { name: "y", type: NS_SYSTEM_BOOL }
            ], (x: boolean, y: boolean) => x || y),
        ]),
        
        //#endregion
    
        //#region system.schema
        newSystemSchema(NS_SYSTEM_SCHEMA, [

            // scalar
            newSystemScalar(NS_SYSTEM_SCHEMA_NS, NS_SYSTEM_STRING, undefined, undefined, { upLimit: 128 }),
            newSystemScalar("system.schema.anytype", NS_SYSTEM_SCHEMA_NS),
            newSystemScalar("system.schema.scalartype", NS_SYSTEM_SCHEMA_NS),
            newSystemScalar("system.schema.enumtype", NS_SYSTEM_SCHEMA_NS),
            newSystemScalar("system.schema.structtype", NS_SYSTEM_SCHEMA_NS),
            newSystemScalar("system.schema.arraytype", NS_SYSTEM_SCHEMA_NS),
            newSystemScalar("system.schema.functype", NS_SYSTEM_SCHEMA_NS),
            newSystemScalar("system.schema.eventtype", NS_SYSTEM_SCHEMA_NS),
            newSystemScalar("system.schema.workflowtype", NS_SYSTEM_SCHEMA_NS),
            newSystemScalar("system.schema.arrayeletype", NS_SYSTEM_SCHEMA_NS),
            newSystemScalar("system.schema.valuetype", NS_SYSTEM_SCHEMA_NS),
            newSystemScalar("system.schema.validfunc", "system.schema.functype"),
            newSystemScalar("system.schema.whitelistfunc", "system.schema.functype"),
            newSystemScalar("system.schema.varname", NS_SYSTEM_STRING, undefined, "^[a-zA-Z]\\w*$", { upLimit: 32 }),
            newSystemScalar("system.schema.anyvalue"),

            newSystemScalar("system.schema.app", NS_SYSTEM_STRING, undefined, undefined, { upLimit: 64 }),
            newSystemScalar("system.schema.appfield", "system.schema.varname"),
            newSystemScalar("system.schema.appworkflow", "system.schema.varname"),

            // enum
            newSystemEnum("system.schema.schematype", SchemaType),
            newSystemEnum("system.schema.relationtype", RelationType),
            newSystemEnum("system.schema.expressiontype", ExpressionType),
            newSystemEnum("system.schema.enumvaluetype", EnumValueType),
            newSystemEnum("system.schema.datacombinetype", DataCombineType),
            newSystemEnum("system.schema.eventscope", EventScope),
            newSystemEnum("system.schema.workflowmode", WorkflowMode),

            // array
            newSystemArray("system.schema.appworkflows", "system.schema.appworkflow"),
        ]),
        //#endregion

        //#region system.workflow
        newSystemSchema(NS_SYSTEM_WORKFLOW, [
            // scalar
            newSystemScalar(NS_SYSTEM_WORKFLOW_NODE, NS_SYSTEM_STRING, undefined, undefined, { upLimit: 32 }),
        ]),
        //#endregion
    ])
], SchemaLoadState.System)