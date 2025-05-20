import { SchemaType } from '../enum/schemaType'
import { IScalarSchemaNodeConfig } from '../config/scalarConfig'
import { AnySchemaNode, SchemaNode } from './schemaNode'
import { ISchemaNodeConfig } from '../config/schemaConfig'
import { getScalarValueType, ScalarValueType } from '../utils/schemaProvider'
import { _L, _LS } from '../utils/locale'
import { isNull, sformat } from '../utils/toolset'
import { ScalarRuleSchema } from '../ruleSchema/scalarRuleSchema'
import { ScalarRule } from '../rule/scalarRule'
import { RuleSchema } from '../ruleSchema/ruleSchema'
import { Rule } from '../rule/rule'

/**
 * The scalar schema data node
 */
export class ScalarSchemaNode extends SchemaNode<IScalarSchemaNodeConfig, ScalarRuleSchema, ScalarRule> {
    //#region Implementation

    get schemaType(): SchemaType { return SchemaType.Scalar }

    // Gets the data by type
    get data(): any {
        let value = this._data
        if (isNull(value)) {
            return null
        }
        else if (this.isString) {
            value = `${value instanceof Date ? value.toISOString() : typeof (value) === "object" ? JSON.stringify(value) : value}`
        }
        else if (this.isNumber) {
            if (typeof value === "string")
                value = (this.isInteger || this.isYear) ? parseInt(value) : parseFloat(value)
            value = Number.isFinite(value) && (!this.isYear || value >= 0) ? value : null
        }
        else if (this.isBoolean) {
            if (typeof (value) === "string") value = value.toLowerCase() === "true"
            if (!isNull(value)) value = value ? true : false
        }
        else if (this.isDate) {
            if (!(value instanceof Date)) {
                if (typeof (value) === "string" || typeof (value) === "number" && value > 0) {
                    value = new Date(value)
                    if (isNaN(value.getFullYear())) value = null
                }
                else {
                    value = null
                }
            }
        }
        return value
    }

    /**
     * Validate the value
     */
    validate(): void {
        const value = this.data
        const config = this._config
        const scalarInfo = this.schemaInfo.scalar
        const rule = this._rule

        // reset
        this._error = ""
        this._valid = true

        // null check
        if (isNull(this._data)) {
            if (config.require) {
                this._valid = false
                this._error = sformat(_LS("ERR_CANT_BE_NULL"), config.display)
            }
            return
        }

        // limit
        let uplimit = !isNull(rule.upLimit)
            ? rule.upLimit
            : !isNull(config.upLimit)
                ? config.upLimit
                : scalarInfo?.upLimit
        let lowlimit = !isNull(rule.lowLimit)
            ? rule.lowLimit
            : !isNull(config.lowLimit)
                ? config.lowLimit
                : scalarInfo?.lowLimit

        // string
        if (this.isString) {
            if (uplimit && value.length > uplimit) {
                this._valid = false
                this._error = sformat(_LS("ERR_LEN_CANT_BE_GREATTHAN"), config.display, uplimit)
            }
            else if (lowlimit && value.length < lowlimit) {
                this._valid = false
                this._error = sformat(_LS("ERR_LEN_CANT_BE_LESSTHAN"), config.display, lowlimit)
            }
            else if (scalarInfo?.regex && !(new RegExp(scalarInfo.regex)).test(value)) {
                this._valid = false
                this._error = sformat(scalarInfo.error || _LS("ERR_REGEX_NOT_MATCH"), config.display)
            }
            else if (!rule.asSuggest && rule.whiteList && rule.whiteList.length > 0 && rule.whiteList.findIndex(v => typeof (v) === "object" ? v.value === value : v == value) < 0) {
                this._valid = false
                this._error = sformat(_LS("ERR_NOT_IN_ENUMLIST"), config.display)
            }
        }
        // number
        else if (this.isNumber) {
            if (isNull(value))
            {
                this._valid = false
                this._error = sformat(_LS("ERR_NOT_NUMBER"), config.display)
            }
            else if (!isNull(uplimit) && value > uplimit)
            {
                this._valid = false
                this._error = sformat(_LS("ERR_CANT_BE_GREATTHAN"), config.display, uplimit)
            }
            else if (!isNull(lowlimit) && value < lowlimit)
            {
                this._valid = false
                this._error = sformat(_LS("ERR_CANT_BE_LESSTHAN"), config.display, lowlimit)
            }
            else if (scalarInfo?.regex && !(new RegExp(scalarInfo.regex)).test(`${this._data}`)) {
                this._valid = false
                this._error = sformat(scalarInfo.error || _LS("ERR_REGEX_NOT_MATCH"), config.display)
            }
            else if (!rule.asSuggest && rule.whiteList && rule.whiteList.length > 0 && rule.whiteList.findIndex(v => typeof (v) === "object" ? v.value === value : v == value) < 0) {
                this._valid = false
                this._error = sformat(_LS("ERR_NOT_IN_ENUMLIST"), config.display)
            }
        }
        // date
        else if (this.isDate) {
            if (isNull(value))
            {
                this._valid = false
                this._error = sformat(_LS("ERR_NOT_DATE"), config.display)
            }
            else 
            {
                if (!isNull(uplimit))
                {
                    if (typeof uplimit === "string")
                    {
                        uplimit = new Date(uplimit)
                        if (isNaN(uplimit.getFullYear()))
                            uplimit = null
                    }
                    if (uplimit instanceof Date && uplimit < value)
                    {
                        this._valid = false
                        this._error = sformat(_LS("ERR_CANT_BE_GREATTHAN"), config.display, uplimit)
                    }
                }

                if (!isNull(lowlimit) && this._valid)
                {

                    if (typeof lowlimit === "string")
                    {
                        lowlimit = new Date(lowlimit)
                        if (isNaN(lowlimit.getFullYear()))
                            lowlimit = null
                    }
                    if (lowlimit instanceof Date && lowlimit > value)
                    {
                        this._valid = false
                        this._error = sformat(_LS("ERR_CANT_BE_LESSTHAN"), config.display, lowlimit)
                    }
                }
            }
        }

        // custom validation
        if (this._valid && this._config.validation)
        {
            const error = this._config.validation.call(this)
            if (!isNull(error))
            {
                this._valid = false
                this._error = error
            }
        }
    }

    //#endregion

    //#region Properties    

    /**
     * Is number value
     */
    get isNumber(): boolean { return (this._valueType & ScalarValueType.Number) > 0 }

    /**
     * Is integer value
     */
    get isInteger(): boolean { return (this._valueType & ScalarValueType.Integer) > 0 }

    /**
     * Is bool value
     */
    get isBoolean(): boolean { return (this._valueType & ScalarValueType.Boolean) > 0 }

    /**
     * Is string value
     */
    get isString(): boolean { return (this._valueType & ScalarValueType.String) > 0 }

    /**
     * Is date value(YMD)
     */
    get isDate(): boolean { return (this._valueType & ScalarValueType.Date) > 0 }

    /**
     * Is year value
     */
    get isYear(): boolean { return (this._valueType & ScalarValueType.Year) > 0 }

    /**
     * Is full date value(YMD HMS)
     */
    get isFullDate(): boolean { return (this._valueType & ScalarValueType.FullDate) > 0 }

    /**
     * Is year month value
     */
    get isYearMonth(): boolean { return (this._valueType & ScalarValueType.YearMonth) > 0 }

    //#endregion

    //#region Fields

    private _valueType: ScalarValueType = ScalarValueType.None

    //#endregion

    /**
     * Construct a scalar schema node.
     * @param parent the parent node of the node.
     * @param config the config of the node.
     */
    constructor(parent: AnySchemaNode, config: ISchemaNodeConfig, data: any) {
        super(parent, config, data)
        getScalarValueType(config.type).then(v => this._valueType = v)

        // @TODO: add primary check
    }
}