import { EnumValueType } from '../enum/enumValueType'
import { SchemaType } from '../enum/schemaType'
import { IEnumSchemaNodeConfig } from '../nodeconfig/enumSchemaNodeConfig'
import SchemaNode from '../nodeconfig/schemaNode'
import { ISchemaNodeConfig } from '../nodeconfig/schemaNodeConfig'
import { getEnumSubList } from '../schema/schemaProvider'
import { _LS } from '../utils/locale'
import { deepClone, isNull } from '../utils/toolset'

/**
 * The enum schema data node
 */
export default class EnumSchemaNode extends SchemaNode<IEnumSchemaNodeConfig> {
    //#region Implementation

    get schemaType(): SchemaType { return SchemaType.Enum }
    
    async validate() {
        let data = this._data
        if (this.isFlags)
        {
            const sublist = await getEnumSubList(this._schemaInfo.type)
            const maxflag = Math.max(...sublist.map(v => v.value))
            
        }
        else if (this.isMultiple)
        {
            
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
    get isMultiple(): boolean { return this.isFlags ? !this._config.enumSingleFlag : (this._config.multiple || false)  }

    /**
     * Gets the cascader options
     */
    get cascaderOptions(): ICascaderOptionInfo[] { return this._options }

    //#endregion

    //#region helper

    

    //#endregion

    //#region Fields

    private _options: ICascaderOptionInfo[] = []

    //#endregion

    /**
     * Construct a scalar schema node.
     * @param parent the parent node of the node.
     * @param config the config of the node.
     */
    constructor(parent: SchemaNode<ISchemaNodeConfig>, config: ISchemaNodeConfig, data: any) {
        super(parent, config, data)
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