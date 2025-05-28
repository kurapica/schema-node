import { EnumValueType } from '../enum/enumValueType'
import { SchemaType } from '../enum/schemaType'
import { IEnumConfig } from '../config/enumConfig'
import { AnySchemaNode, SchemaNode } from './schemaNode'
import { ISchemaConfig } from '../config/schemaConfig'
import { getEnumAccessList, getEnumSubList } from '../utils/schemaProvider'
import { _LS } from '../utils/locale'
import { deepClone, isNull, sformat } from '../utils/toolset'
import { EnumRulechema } from '../ruleSchema/enumRuleSchema'
import { EnumRule } from '../rule/enumRule'

/**
 * The enum schema data node
 */
export class EnumNode extends SchemaNode<IEnumConfig, EnumRulechema, EnumRule> {
    //#region Implementation

    // override properties
    get schemaType(): SchemaType { return SchemaType.Enum }
    
    // override methods
    async validate() {
        let data = deepClone(this._data)
        this._valid = true
        this._error = ""

        // conversion
        if (this.isFlags)
        {
            const sublist = await getEnumSubList(this._schemaInfo.type)
            const maxflag = Math.max(...sublist.map(v => v.value))
            data = fromFlagsView(data)
            if (!isNull(data)) {
                // auto fix
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
            if (!Array.isArray(data)) data = !isNull(data) ? [data] : []
            data = data.map((d: any) => this.parseEnumValue(d)).filter((d: any) => !isNull(d))
        }
        else
        {
            data = this.parseEnumValue(data)
        }

        // validation
        if (isNull(data) || Array.isArray(data) && !data.length)
        {
            if (this.require)
            {
                this._valid = false
                this._error = sformat(_LS("ERR_CANT_BE_NULL"), this.display)
            }
        }
        else if(!this.isFlags)
        {
            if (Array.isArray(data))
            {
                for(let i = 0; i < data.length; i++)
                {
                    if (!await this.isValidEnumValue(data[i])){
                        this._valid = false
                        this._error = sformat(_LS("ERR_NOT_IN_ENUMLIST"), this.display)
                        break
                    }
                }
            }
            else
            {
                if (!await this.isValidEnumValue(data)){
                    this._valid = false
                    this._error = sformat(_LS("ERR_NOT_IN_ENUMLIST"), this.display)
                }
            }
        }
        
        // write back
        if (!this.isFlags && this.isMultiple && Array.isArray(this._data))
        {
            this._data.splice(0, this._data.length, ...data)
        }
        else
        {
            this._data = data
        }
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
     * Gets the enum cascade
     */
    get cascade() { return this.rule.cascade || this._config.cascade }

    /**
     * Gets the enum root
     */
    get root() { return this.rule.root || this._config.root }

    /**
     * Gets the enum white list
     */
    get whiteList() { return this.rule.whiteList || this._config.whiteList }

    /**
     * Gets the black list
     */
    get blackList() { return this.rule.blackList || this._config.blackList }

    /**
     * Allow use enum value in any level
     */
    get anyLevel() { return this.rule.anyLevel || this._config.anyLevel }

    /**
     * The max cascade level
     */
    get cascadeLevel() { return this._schemaInfo.enum?.cascade?.length || 1 }

    //#endregion

    //#region Methods

    /**
     * Validate the single enum value
     */
    async isValidEnumValue(value: any): Promise<boolean> {
        value = this.parseEnumValue(value)
        if (isNull(value)) return true
        
        // gets the access list
        const access = await getEnumAccessList(this.schemaName, value)
        if (!access.length) return false

        // check the enum root
        if (this.root && access.findIndex(a => `${a.value}` === `${this.root}`) < 0) return false

        // check the cascade
        if (this.cascade && access.length > this.cascade) return false

        // check any level
        if (!this.anyLevel && access.length < this.cascadeLevel) return false

        // check the black list
        if (this.blackList?.length && access.findIndex(a => this.blackList!.findIndex(b => `${a.value}` === `${b}`) >= 0) >= 0) return false

        // check the white list - the sub enum value of the allowed enum value also allowed, also their parent if any level
        if (this.whiteList?.length && access.findIndex(a => this.whiteList!.findIndex(b => `${a.value}` === `${b}`) < 0) < 0)
        {
            if (!this.anyLevel || this.cascadeLevel === 1) return false
            for(let i = 0; i < this.whiteList.length; i++)
            {
                // check if parent
                const w = await getEnumAccessList(this.schemaName, this.parseEnumValue(this.whiteList[i]))
                if (w?.length && w.length > access.length && w[access.length - 1].value == value) return true
            }
            return false
        }

        return true
    }

    // parse enum value    
    private parseEnumValue(value: any) {
        switch (this._schemaInfo.enum!.type) {
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


    //#endregion

    /**
     * Construct a scalar schema node.
     * @param parent the parent node of the node.
     * @param config the config of the node.
     */
    constructor(config: ISchemaConfig, data: any, parent: AnySchemaNode | undefined = undefined) {
        super(config, data, parent)
    }
}

//#region helper

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