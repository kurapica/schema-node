import { EnumValueType } from '../enum/enumValueType'
import { SchemaType } from '../enum/schemaType'
import { IEnumConfig } from '../config/enumConfig'
import { AnySchemaNode, SchemaNode } from './schemaNode'
import { ISchemaConfig } from '../config/schemaConfig'
import { getEnumSubList } from '../utils/schemaProvider'
import { _LS } from '../utils/locale'
import { isNull } from '../utils/toolset'
import { EnumRulechema } from '../ruleSchema/enumRuleSchema'
import { EnumRule } from '../rule/enumRule'

/**
 * The enum schema data node
 */
export class EnumNode extends SchemaNode<IEnumConfig, EnumRulechema, EnumRule> {
    //#region Implementation

    get schemaType(): SchemaType { return SchemaType.Enum }
    
    async validate() {
        const vtype = this._schemaInfo.enum!.type
        let data = this._data
        this._valid = true
        this._error = ""

        // conversion
        if (this.isFlags)
        {
            const sublist = await getEnumSubList(this._schemaInfo.type)
            const maxflag = Math.max(...sublist.map(v => v.value))
            data = fromFlagsView(data)
            if (!isNull(data)) {
                data = data % (maxflag * 2)
                if (!this.isMultiple && data > 0)
                {
                    let match = null
                    for (let i = 0; i <= Math.log2(data); i++) {
                        const b = Math.pow(2, i)
                        if ((data & b) > 0) {
                            match = b
                            break
                        }
                    }
                    data = match
                }
            }
        }
        else if (this.isMultiple)
        {
            if (!Array.isArray(data))
                data = !isNull(data) ? [data] : []
            data = data.map((d: any) => parseEnumValue(d, vtype)).filter((d: any) => !isNull(d))
        }
        else 
        {
            data = parseEnumValue(data, vtype)
        }
        
        this._data = data
    }

    /**
     * Gets the view data, like convert the value to a flags array for flags enum,
     * useful for enum views
     */
    get view(): any { return this.isFlags ? toFlagsView(this._data, !this.isMultiple) : this._data }

    //#endregion

    //#region Properties

    /**
     * Whether the enum is a flags enum
     */
    get isFlags(): boolean { return this._schemaInfo.enum?.type === EnumValueType.Flags }

    /**
     * Whether the node require multiple values
     */
    get isMultiple(): boolean { return this.isFlags ? !this._config.singleFlag : (this._config.multiple || false)  }

    /**
     * Gets the cascader options
     */
    get cascaderOptions(): ICascaderOptionInfo[] { return this._options }

    //#endregion

    //#region Fields

    private _options: ICascaderOptionInfo[] = []

    //#endregion

    /**
     * Construct a scalar schema node.
     * @param parent the parent node of the node.
     * @param config the config of the node.
     */
    constructor(parent: AnySchemaNode, config: ISchemaConfig, data: any) {
        super(parent, config, data)
    }
}

//#region helper

function parseEnumValue(value: any, type: EnumValueType) {
    switch (type) {
        case EnumValueType.Int:
        case EnumValueType.Flags:
            value = !isNull(value) ? parseInt(value) : null
            return isFinite(value) ? value : null
        case EnumValueType.Double:
        case EnumValueType.Float:
            value = !isNull(value) ? parseFloat(value) : null
            return isFinite(value) ? value : null
        case EnumValueType.String:
            return !isNull(value) ? `${value}` : null
    }
}

/**
 * Convert the flags value to view data
 */
function toFlagsView(flag: any, single?: boolean) {
    flag = fromFlagsView(flag)
    if (isNull(flag)) return single ? null : []
    if (flag === 0) return single ? 0 : [0]
    const result: number[] = []
    for (let i = 0; i <= Math.log2(flag); i++) {
        const b = Math.pow(2, i)
        if ((flag & b) > 0) {
            if (single) return b
            result.push(b)
        }
    }
    return result
}

/**
 * Combine the view data to one flags value
 */
function fromFlagsView(flags: any) {
    if (Array.isArray(flags)) {
        if (flags.includes(0)) return 0 // 0 means NONE
        const filter = flags.map(parseInt).filter(f => isFinite(f) && f >= 0)
        return filter.length ? filter.reduce((a, b) => a | b) : null
    }
    flags = parseInt(flags)
    return isFinite(flags) && flags >= 0 ? flags : null
}

//#endregion

//#region types

export interface ICascaderOptionInfo {
    /**
     * Enum value
     */
    value: any

    /**
     * The display label
     */
    label: string

    /**
     * Whether disabled
     */
    disabled?: boolean

    /**
     * The cascade level
     */
    level: number

    /**
     * Whether a leaf node
     */
    leaf: boolean

    /**
     * The child cascader options
     */
    children: ICascaderOptionInfo[] | undefined
}

//#endregion