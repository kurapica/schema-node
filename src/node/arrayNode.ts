import { SchemaType } from '../enum/schemaType'
import { IArrayConfig } from '../config/arrayConfig'
import { IEnumConfig } from '../config/enumConfig'
import { ISchemaConfig } from '../config/schemaConfig'
import { INodeSchema } from '../schema/nodeSchema'
import { getCachedSchema, validateSchemaValue } from '../utils/schemaProvider'
import { _LS } from '../utils/locale'
import { AnySchemaNode, regSchemaNode, SchemaNode } from './schemaNode'
import { EnumNode } from './enumNode'
import { ScalarNode } from './scalarNode'
import { StructNode } from './structNode'
import { debounce, deepClone, isEqual, isNull, sformat } from '../utils/toolset'
import { ArrayRuleSchema } from '../ruleSchema/arrayRuleSchema'
import { ArrayRule } from '../rule/arrayRule'

/**
 * The array schema data node
 */
@regSchemaNode(SchemaType.Array)
export class ArrayNode extends SchemaNode<IArrayConfig, ArrayRuleSchema, ArrayRule> {
    //#region Implementation

    // override properties
    get schemaType(): SchemaType { return SchemaType.Array }
    get valid(): boolean { return this._enumArrayNode ? this._enumArrayNode.valid : this.asSingleValue ? this._valid : this._elements.findIndex(e => !e.valid) < 0 }
    get error(): any { return this._enumArrayNode ? this._enumArrayNode.error : this.asSingleValue ? this._error : this._elements.find(e => !e.valid)?.error }
    get changed(): boolean { return this._enumArrayNode ? this._enumArrayNode.changed : this.asSingleValue ? !isEqual(this._data, this._original) : this._elements.findIndex(e => e.changed) >= 0 }
    
    get rawData() { return this._enumArrayNode ? this._enumArrayNode.rawData : this._data }
    
    get data()
    {
        if (this._enumArrayNode) return this._enumArrayNode.data
        if (this.asSingleValue) return Array.isArray(this._data) ? deepClone(this._data) : []

        // filter
        if (this._eleSchemaInfo.type === SchemaType.Struct)
        {
            const primary = this._schemaInfo.array?.primary || []
            const reqflds = this._eleSchemaInfo.struct!.fields.filter(f => f.require || primary.includes(f.name)).map(f => f.name)
            return reqflds.length 
                ? this._elements.map(e => e.data).filter(d => reqflds.findIndex(f => isNull(d[f])) < 0)
                : this._elements.map(e => e.data)
        }
        else 
        {
            return this._elements.map(e => e.data).filter(d => !isNull(d))
        }
    }

    set data(data: any)
    {
        if (!Array.isArray(data)) data = []
        if (this._enumArrayNode) {
            this._enumArrayNode.data = data
        }
        else if (this.asSingleValue)
        {
            if (Array.isArray(this._data))
                this._data.splice(0, this._data.length, ...data.map(deepClone))
            else
                this._data = deepClone(data)
            this.validation().then(this.notify)
        }
        else
        {
            // assign
            for(let i = 0; i < Math.min(this._elements.length, data.length); i++)
            {
                this._elements[i].data = data[i]
                this._data[i] = this.elements[i].rawData
            }

            // destory
            for (let i = this._elements.length - 1; i > data.length; i--)
                this._elements.pop()?.dispose()

            // new
            for (let i = this._elements.length; i < data.length; i++)
            {
                const eleNode = this.newElement(data[i])
                this._elements.push(eleNode)
                this._data[i] = eleNode.rawData
                if (this._rule._actived) eleNode.activeRule()
            }
        }
    }

    // override methods
    
    /**
     * indexof the sub node
     */
    indexof(node: AnySchemaNode): number | string | undefined | null {
        if (this._enumArrayNode)
        {
            return node === this._enumArrayNode ? "" : undefined
        }
        else
        {
            return this._elements.findIndex(e => e === node)
        }
    }

    /**
     * validate the value
     */
    async validate(): Promise<void> {
        if (this._enumArrayNode)
        {
            return await this._enumArrayNode.validation()
        }
        else if (this.asSingleValue)
        {
            this._valid = true
            this._error = ""
            const elename = this._schemaInfo.array?.element
            if (!elename || !Array.isArray(this._data)) return
            for(let i = 0; i < this._data.length; i++)
            {
                if (!await validateSchemaValue(elename, this._data[i]))
                {
                    this._valid = false
                    this._error = sformat(_LS("ERR_ARRAY_DATA_NOT_VALID"), this.display)
                    break
                }
            }
        }
        else
        {
            for(let i = 0; i < this._elements.length; i++)
            {
                await this._elements[i].validation()
            }
        }
    }

    resetChanges(): void {
        if (this._enumArrayNode)
        {
            this._enumArrayNode.resetChanges()
        }
        else if(this.asSingleValue)
        {
            this._original = Array.isArray(this._data) ? deepClone(this._data) : []
        }
        else
        {
            this._elements.forEach(e => e.resetChanges()) 
        }
    }

    override dispose(): void {
        this._enumArrayNode?.dispose()
        this._elements.forEach(e => e.dispose())
        this._elements = []
        super.dispose()
    }

    //#endregion

    //#region Methods

    // validate the primary fields
    private primaryCheck(): void {
        if (!this._schemaInfo.array?.primary?.length) return
        const primarys = this._eleSchemaInfo.struct?.fields.map(f => f.name).filter(n => this._schemaInfo.array?.primary?.includes(n))
        if (!primarys?.length) return
        for(let i = 1; i < this._elements.length; i++)
        {
            const ele = this._elements[i] as StructNode
            for(let j = 0; j < i; j++)
            {
                const cele = this._elements[j] as StructNode
                let k = 0;
                for(; k < primarys.length; k++)
                {
                    if (!isEqual(ele.getField(primarys[k])?.rawData, cele.getField(primarys[k])?.rawData))
                        break
                }
                if (k >= primarys.length)
                {
                    const errfld = ele.getField(primarys[primarys.length - 1])
                    errfld?.setError(sformat(_LS("ERR_ARRAY_PRIMARY_DUPLICATE"), errfld.display))
                    return
                }
            }
        }
    }

    private refreshRawData = debounce(() => {
        if (Array.isArray(this._data))
            this._data.splice(0, this._data.length, ...this._elements.map(e => e.rawData))
        else
            this._data = this._elements.map(e => e.rawData)

        // primary check
        this.primaryCheck()
        this.notify()
    }, 20)

    private newElement(data?: any) {
        let eleNode: AnySchemaNode | null = null
        switch (this._eleSchemaInfo.type)
        {
            case SchemaType.Scalar:
                eleNode = new ScalarNode({...this._config, type: this._eleSchemaInfo.name, require: false }, data, this)
                break
            case SchemaType.Enum:
                eleNode = new EnumNode({ ...this._config, type: this._eleSchemaInfo.name, require: false }, data, this)
                break
            case SchemaType.Struct:
                eleNode = new StructNode({ ...this._config, type: this._eleSchemaInfo.name, require: false }, data, this)
                break
        }
        eleNode?.subscribe(this.refreshRawData)
        return eleNode
    }

    /**
     * Add a new row
     */
    addRow(index?: number, data?: any) {
        if (this._enumArrayNode || this.asSingleValue) return
        if (isNull(index)) index = this._elements.length
        const newEle = this.newElement(data)
        if (newEle)
        {
            this._elements.splice(index!, 0, newEle)
            newEle.activeRule(true)
            this.notify("add", this.elements.length)
        }
    }

    /**
     * Delete rows
     * @param start the start index
     * @param count the delete row count, default 1
     */
    delRows(start: number, count = 1) {
        if (this._enumArrayNode || this.asSingleValue || start < 0 || start >= this._elements.length) return
        const remove = this._elements.splice(start, count)
        remove.forEach(r => r.dispose())
        this.notify("del", this.elements.length)
    }

    /**
     * Swap two row
     */
    swapRow(x: number, y: number) {
        const temp = this._elements[x]
        this._elements[x] = this._elements[y]
        this._elements[y] = temp
        this.notify("swap", x, y)
    }

    //#endregion

    //#region Properties

    /**
     * Whether the array data be treated as single value, like Coordinates
     */
    get asSingleValue(): boolean { return this._schemaInfo.array?.single || false }

    /**
     * Gets the schema info of the array element
     */
    get elementSchemaInfo(): INodeSchema { return this._eleSchemaInfo }

    /**
     * Gets the array elements
     */
    get elements(): AnySchemaNode[] { return this._elements }

    /**
     * Gets the enum node if the element is enum schema node
     */
    get enumArrayNode(): EnumNode | undefined { return this._enumArrayNode }

    /**
     * Gets whether the array node is used as an incr update application field
     */
    get isIncrUpdate(): boolean { return this._config.isIncrUpdate || false }

    /**
     * Gets the total count
     */
    get total() { return this.isIncrUpdate ? this._total! : this._elements.length }

    /**
     * Gets the page count
     */
    get pageCount() { return this.isIncrUpdate ? this._pageCount! : this._elements.length }

    /**
     * Gets the current page
     */
    get page() { return this._page || 0 }

    /**
     * Set the current page
     * @TODO
     */
    set page(page: number) { this._page = page }

    //#endregion

    //#region Fields

    private _eleSchemaInfo: INodeSchema = { name: '', type: SchemaType.Namespace }
    private _elements: AnySchemaNode[] = []
    private _enumArrayNode: EnumNode | undefined
    private _total: number | undefined
    private _pageCount: number | undefined
    private _page: number | undefined

    //#endregion

    /**
     * Construct a scalar schema node.
     * @param parent the parent node of the node.
     * @param config the config of the node.
     */
    constructor(config: ISchemaConfig, data: any, parent: AnySchemaNode | undefined = undefined) {
        super(config, null, parent)
        if (isNull(data) || !Array.isArray(data)) data = []

        // copy default
        if (!data.length && Array.isArray(this._data) && this._data.length) data = [...this._data]

        // init the raw data
        this._data = data

        this._total = this._config.total
        this._pageCount = this._config.pageCount
        this._page = 0

        // element check
        this._eleSchemaInfo = getCachedSchema(this._schemaInfo.array!.element)!
        if (this._eleSchemaInfo.type === SchemaType.Enum)
        {
            this._enumArrayNode = new EnumNode({
                ...config,
                type: this._eleSchemaInfo.name,
                multiple: true,
            } as IEnumConfig, data, this)
            this._enumArrayNode.subscribe(this.notify)
            this._enumArrayNode.subscribeState(this.notifyState)
        }
        else if (!this.schemaInfo.array?.single)
        {
            // assign data and init elements
            this.data = data
        }
    }
}