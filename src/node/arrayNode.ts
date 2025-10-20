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
import { clearDebounce, debounce, deepClone, isEqual, isNull, sformat } from '../utils/toolset'
import { ArrayRuleSchema } from '../ruleSchema/arrayRuleSchema'
import { ArrayRule } from '../rule/arrayRule'
import { pushAppData, queryAppData } from '../utils/appDataProvider'
import { AppNode } from './appNode'

/**
 * The array schema data node
 */
@regSchemaNode(SchemaType.Array)
export class ArrayNode extends SchemaNode<IArrayConfig, ArrayRuleSchema, ArrayRule> {
    //#region Implementation

    // override properties && array properties
    get schemaType(): SchemaType { return SchemaType.Array }
    get valid(): boolean { return this._enode ? this._enode.valid : this.asSingle ? this._valid : this._elements.findIndex(e => !e.valid) < 0 }
    get error(): any { return this._enode ? this._enode.error : this.asSingle ? this._error : this._elements.find(e => !e.valid)?.error }
    get changed(): boolean {
        if (this._enode) return this._enode.changed
        if (this.asSingle) return !isEqual(this._data, this._original)
        if (this._elements.find(e => e.changed) || this._original?.length) return true
        if (!this.incrUpdate) return false
        for (let key in this._tracker) {
            const track = this._tracker[key]
            if (track.delete || track.update) return true
        }
        return false
    }
    get rawData() { return this._enode ? this._enode.rawData : this._data }
    get original() { return this._enode ? this._enode.original : deepClone(this._original) }
    get isEmpty() { return this._enode ? this._enode.isEmpty : Array.isArray(this._data) ? this._data.length === 0 : true }

    /**
     * Gets the schema info of the array element
     */
    get elementSchema(): INodeSchema { return this._eschema }

    /**
     * Gets the array elements
     */
    get elements(): AnySchemaNode[] { return this._elements }

    /**
     * Gets the enum node if the element is enum schema node
     */
    get enumNode(): EnumNode | undefined { return this._enode }

    /**
     * Whether the array data be treated as single value, like Coordinates
     */
    get asSingle(): boolean { return this._schema.array?.single || false }

    /**
     * Gets whether the array node is used as an incr update application field
     */
    get incrUpdate(): boolean { return this._config.incrUpdate || false }

    /**
     * Gets the total count
     */
    get total() { return this.incrUpdate ? this._total! : this._elements.length }

    /**
     * Gets the page count
     */
    get pageCount() { return this.incrUpdate ? this._count! : this._elements.length }

    /**
     * Gets the query data
     */
    get query() { return this.incrUpdate && this._query ? { ...this._query } : undefined }

    /**
     * Gets the current page
     */
    get page() { return this._page || 0 }

    set data(data: any)
    {
        if (!Array.isArray(data)) data = []
        if (this._enode) {
            this._enode.data = data
        }
        else if (this.asSingle)
        {
            if (Array.isArray(this._data))
                this._data.splice(0, this._data.length, ...data.map(deepClone))
            else
                this._data = deepClone(data)
            this.validation().then(this.notify)
        }
        else if (this.incrUpdate)
        {
            throw `Can't set data to ${this.display || this.name}`
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
            this._data.length = data.length
        }
    }

    get data() {
        if (this._enode) return this._enode.submitData
        if (this.asSingle) return Array.isArray(this._data) ? deepClone(this._data) : []
        if (this._eschema.type !== SchemaType.Struct) return this._elements.map(e => e.data).filter(d => !isNull(d))

        if (this.incrUpdate)
        {
            const result: any = []
            const keys = new Set<string>()
            this._elements.filter(e => e.changed && !this.isRowDeleted(e)).forEach(e => {
                const key = this.getPrimaryKey(e)
                if (key) {
                    keys.add(key)
                    result.push(e.data)
                }
            })
            for (let key in this._tracker)
            {
                if (keys.has(key) || !this._tracker[key].update) continue
                result.push(this._tracker[key].update)
            }
            return result
        }
        else
        {
            const primary = this._schema.array?.primary || []
            const reqflds = this._eschema.struct!.fields.filter(f => f.require || primary.includes(f.name)).map(f => f.name)
            return reqflds.length 
                ? this._elements.map(e => e.data).filter(d => reqflds.findIndex(f => isNull(d[f])) < 0)
                : this._elements.map(e => e.data)
        }
    }

    get submitData()
    {
        if (this._enode) return this._enode.data
        if (this.asSingle) return Array.isArray(this._data) ? deepClone(this._data) : []
        if (this._eschema.type !== SchemaType.Struct) return this._elements.map(e => e.data).filter(d => !isNull(d))

        if (this.incrUpdate)
        {
            const result: any = []
            const keys = new Set<string>()
            this._elements.filter(e => e.changed && !this.isRowDeleted(e)).forEach(e => {
                const key = this.getPrimaryKey(e)
                if (key) {
                    keys.add(key)
                    result.push(e.data)
                }
            })
            for (let key in this._tracker)
            {
                if (keys.has(key) || !this._tracker[key].update) continue
                result.push(this._tracker[key].update)
            }
            return result
        }
        else
        {
            const primary = this._schema.array?.primary || []
            const reqflds = this._eschema.struct!.fields.filter(f => f.require || primary.includes(f.name)).map(f => f.name)
            return reqflds.length 
                ? this._elements.filter(e => e.changed).map(e => e.data).filter(d => reqflds.findIndex(f => isNull(d[f])) < 0)
                : this._elements.filter(e => e.changed).map(e => e.data)
        }
    }

    /**
     * Gets the deleted data
     */
    get deletes(): any[] | undefined {
        if (this.asSingle || this._enode || this._eschema.type !== SchemaType.Struct || !this._schema.array?.primary?.length) return undefined
        if (this.incrUpdate)
        {
            const deletes: any[] = []
            const keys = new Set<string>()
            this._elements.filter(e => this.isRowDeleted(e)).forEach(e => {
                const key = this.getPrimaryKey(e)
                if (key) {
                    keys.add(key)
                    deletes.push(e.data)
                }
            })
            for (let key in this._tracker)
            {
                if (keys.has(key) || !this._tracker[key].delete || !(this._tracker[key].origin || this._tracker[key].update)) continue
                deletes.push(this._tracker[key].origin || this._tracker[key].update)
            }
            return deletes
        }
        else
        {
            if (!this._original || !Array.isArray(this._original) || !this._original.length) return []

            const keys = new Set<string>()
            this._elements.map(e => this.getPrimaryKey(e)).forEach(d => { if (d) keys.add(d) })

            const deletes: any[] = []
            this._original.forEach(e => {
                const key = this.getPrimaryKey(e)
                if (key && !keys.has(key)) deletes.push(e)
            })
            return deletes
        }
    }

    // override methods
    
    /**
     * indexof the sub node
     */
    indexof(node: AnySchemaNode): number | string | undefined | null {
        if (this._enode)
        {
            return node === this._enode ? "" : undefined
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
        if (this._enode)
        {
            return await this._enode.validation()
        }
        else if (this.asSingle)
        {
            this._valid = true
            this._error = ""
            const elename = this._schema.array?.element
            if (!elename || !Array.isArray(this._data)) return
            for(let i = 0; i < this._data.length; i++)
            {
                if (!await validateSchemaValue(elename, this._data[i]))
                {
                    this._valid = false
                    this._error = sformat("ERR_ARRAY_DATA_NOT_VALID", this.display)
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

    override resetChanges(): void {
        if (this._enode)
        {
            this._enode.resetChanges()
        }
        else if (this.asSingle)
        {
            this._original = Array.isArray(this._data) ? deepClone(this._data) : []
        }
        else
        {
            this._elements.forEach(e => e.resetChanges())
            this._original = this._elements.map(e => e.original)
            this._tracker = {}
        }
    }

    /**
     * reset
     */
    override reset(): void {
        if (this._enode)
        {
            this._enode.reset()
        }
        else if (this.incrUpdate)
        {
            this._elements.forEach(e => e.reset())
            this._tracker = {} // reset the tracker
        }
        else
        {
            this.data = deepClone(this._original) || []
            this.resetChanges()
        }
    }

    override dispose(): void {
        this._enode?.dispose()
        this._elements.forEach(e => e.dispose())
        this._elements = []
        clearDebounce(this.refreshRawData)
        super.dispose()
    }

    //#endregion

    //#region Methods

    // validate the primary fields
    private primaryCheck(): void {
        if (!this._schema.array?.primary?.length) return
        const primarys = this._eschema.struct?.fields.map(f => f.name).filter(n => this._schema.array?.primary?.includes(n))
        if (!primarys?.length) return

        this._errfld?.setError("") // clear previous error
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
                    errfld?.setError(sformat("ERR_ARRAY_PRIMARY_DUPLICATE", errfld.display))
                    this._errfld = errfld
                    return
                }
            }
        }
    }

    // refresh raw data
    private refreshRawData = debounce(() => {
        if (Array.isArray(this._data))
            this._data.splice(0, this._data.length, ...this._elements.map(e => e.rawData))
        else
            this._data = this._elements.map(e => e.rawData)

        // primary check
        this.primaryCheck()
        this.notify()
    }, 100)

    // create new element
    private newElement(data?: any) {
        let eleNode: AnySchemaNode | null = null
        switch (this._eschema.type)
        {
            case SchemaType.Scalar:
                eleNode = new ScalarNode({...this._config, type: this._eschema.name, require: false }, data, this)
                break
            case SchemaType.Enum:
                eleNode = new EnumNode({ ...this._config, type: this._eschema.name, require: false }, data, this)
                break
            case SchemaType.Struct:
                eleNode = new StructNode({ ...this._config, type: this._eschema.name, require: false }, data, this)
                if (this.incrUpdate)
                {
                    // make incr update data primary field immutable
                    const structNode = eleNode as StructNode
                    this.schema.array?.primary?.forEach(f => {
                        const fldNode = structNode.getField(f)
                        fldNode.config.immutable = true
                        fldNode.notifyState()
                    })
                }
                break
        }
        if (!this.incrUpdate) eleNode?.subscribe(this.refreshRawData)
        return eleNode
    }

    // get the unique key combine from primarys
    private getPrimaryKey(node: AnySchemaNode | any) {
        const primarys = this._schema.array?.primary
        if (!primarys?.length) return
        const keys: string[] = []
        const data = node instanceof StructNode ? node.rawData : node
        for(let i = 0; i < primarys.length; i++)
        {
            let k = primarys[i]
            const v = data[k]
            if (isNull(v)) return undefined
            keys.push(`${v}`)
        }
        return keys.join(".")
    }

    /**
     * Prepare row for incr-update
     */
    prepareRow(data?: {}) {
        if (!this.incrUpdate) return undefined
        const row = this.newElement(data) as StructNode
        
        // auto query the data with primary key without date scalar field
        const primarys = this.schema.array?.primary
        if (!primarys.length) return row

        const fields = this._eschema.struct?.fields?.filter(f => primarys.includes(f.name))
        if (!fields?.length || fields.find(f => {
            const node = row.getField(f.name)
            if (node instanceof ScalarNode) return node.isDate && !node.isYearMonth
        })) return row

        const appNode = this.parent as AppNode
        if (!appNode.target) return row

        let prevkey = ""
        primarys.forEach(p => {
            const node = row.getField(p)
            row.watch(node, async () => {
                const query = {}
                let key = ""
                for (let i = 0; i < primarys.length; i++) {
                    const d = node.rawData
                    if (isNull(d)) return
                    query[p] = d
                    key += `.${d instanceof Date ? d.toISOString() : d}`
                }
                if (key === prevkey) return
                prevkey = key

                const res = await queryAppData({
                    app: appNode.name,
                    target: appNode.target,
                    fields: [this.name],
                    noSchema: true,
                    querys: {
                        [this.name]: {
                            take: 1,
                            filter: query
                        }
                    }
                })
                const data = res.results[this.name]
                if (data && Array.isArray(data) && data.length)
                {
                    row.data = data[0]
                    row.resetChanges()
                }
            })
        })

        return row
    }

    /**
     * Save the prepare row
     * @param row the prepare row
     * @param forceSave force save even when the row data already exist
     */
    async savePrepareRow(row: StructNode, forceSave: boolean = false): Promise<boolean> {
        if (!this.incrUpdate || !row.valid) return false
        const primarys = this._schema.array?.primary
        if (!primarys?.length) return false
        
        // primary key check
        let isnew = false
        for (let i = 0; i < primarys.length; i++)
        {
            const node = row.getField(primarys[primarys[i]])
            if (isNull(node?.rawData) || !node.valid) return false
            if (node.changed) isnew = true
        }

        // save to server
        const key = this.getPrimaryKey(row)
        if (isnew || forceSave) 
        {
            const appNode = this.parent as AppNode
            if (!appNode?.target) return false

            const res = await pushAppData(appNode.name, appNode.target, {
                [this.name]: {
                    data: [ row.data ]
                }
            })

            if (res.result)
            {
                if (isnew)
                {
                    // query match check
                    if (this._query)
                    {
                        for (let k in this._query) 
                        {
                            if (row.rawData[k] != this._query[k])
                                return true
                        }
                    }

                    // jump to the new record
                    if (this._descend)
                    {
                        await this.setPage(0)
                    }
                    else
                    {
                        const count = this._count || 10
                        await this.setPage(Math.floor((this._total || 0) / count), count, false)
                    }
                }
                else
                {
                    delete this._tracker[key]
                    const ele = this._elements.find(e => this.getPrimaryKey(e) === key)
                    if (ele)  {
                        ele.data = row.data
                        ele.resetChanges()
                    }
                }
            }
            else
            {
                return false
            }
        }
        // save to tracker
        else
        {
            this._tracker[key] ||= {}
            this._tracker[key].update = row.data
            
            const ele = this._elements.find(e => this.getPrimaryKey(e) === key)
            if (ele) ele.data = row.data
        }
        return true
    }

    /**
     * Add a new row
     */
    addRow(index?: number, data?: any) {
        if (this._enode || this.asSingle || this.incrUpdate) return
        if (isNull(index)) index = this._elements.length
        const newEle = this.newElement(data)
        if (newEle)
        {
            this._elements.splice(index!, 0, newEle)
            newEle.activeRule(true)
            this.notify("add", this.elements.length)
        }
        return newEle
    }

    /**
     * Delete rows
     * @param start the start index
     * @param count the delete row count, default 1
     */
    delRows(start: number, count = 1) {
        if (this._enode || this.asSingle || start < 0 || start >= this._elements.length) return
        if (this.incrUpdate)
        {
            for(let i = start; i < start + count; i++)
            {
                const ele = this._elements[i]
                const key = this.getPrimaryKey(ele)
                if (!this._tracker[key]?.delete)
                {
                    this._tracker[key] ||= {}
                    this._tracker[key].delete = true
                    ele.notifyState()
                }
            }
        }
        else
        {
            const remove = this._elements.splice(start, count)
            remove.forEach(r => r.dispose())
            this.notify("del", this.elements.length)
        }
    }

    /**
     * Resume rows, only for incr-update
     * @param start the start index
     * @param count the resume row count, default 1
     */
    resumeRows(start: number, count = 1) {
        if (!this.incrUpdate) return
        for(let i = start; i < start + count; i++)
        {
            const ele = this._elements[i]
            const key = this.getPrimaryKey(ele)
            if (this._tracker[key]?.delete)
            {
                this._tracker[key].delete = undefined
                ele.notifyState()
            }
        }
    }

    /**
     * Swap two row
     */
    swapRow(x: number, y: number) {
        if (this._enode || this.asSingle || this.incrUpdate) return
        const temp = this._elements[x]
        this._elements[x] = this._elements[y]
        this._elements[y] = temp
        this.notify("swap", x, y)
    }

    /**
     * Whether a row is deleted, only for incr-update
     */
    isRowDeleted(row: AnySchemaNode) {
        if (!this.incrUpdate) return false
        const key = this.getPrimaryKey(row)
        return (key && this._tracker[key]?.delete) ? true : false
    }

    /**
     * Change the current page
     * @param page The page no
     * @param count The page count, optional
     * @param descend Whether use descend order, optional
     * @param query the query keys, optional
     */
    async setPage(page: number, count?: number, descend?: boolean, query?: { [key:string]: any })
    {
        if (!this.incrUpdate) return
        count ||= this._count || 10 // default should be provided by server
        if (isNull(descend)) descend = this._descend
        const appNode = this.parent
        if (!(appNode && appNode instanceof AppNode && appNode.target)) return

        // validate the keys
        if (query)
        {
            const fields = this._eschema.struct?.fields
            const temp = {}
            let hasQuery = false
            for (let k in query)
            {
                if (fields?.find(f => f.name.toLowerCase() === k.toLowerCase()))
                {
                    temp[k] = query[k]
                    hasQuery = true
                }
            }
            if (hasQuery)
                query = temp
            else
                query = undefined
        }
        else
        {
            query = this._query
        }

        try
        {
            const res = await queryAppData({
                app: appNode.name,
                target: appNode.target,
                fields: [this.name],
                querys: {
                    [this.name]: {
                        take: count,
                        skip: page * count,
                        descend,
                        filter: query || {}
                    }
                }
            })

            // record current changes
            this._elements.forEach(e => {
                const key = this.getPrimaryKey(e)
                if (!key) return
                if (e.changed && e.valid)
                {
                    this._tracker[key] ||= {}
                    this._tracker[key].origin = e.original
                    this._tracker[key].update = e.data
                }
                else if (this._tracker[key])
                {
                    if (this._tracker[key].delete)
                    {
                        this._tracker[key].origin = e.original
                        this._tracker[key].update = undefined
                    }
                    else
                    {
                        delete this._tracker[key]
                    }
                }
            })

            // load new page
            const data = res.results[this.name] || []
            const info = res.infos[this.name]
            for (let i = 0; i < data.length; i++)
            {
                let eleNode: AnySchemaNode
                if (this._elements.length <= i)
                {
                    eleNode = this.newElement(data[i])
                    this._elements.push(eleNode)
                    this._data[i] = eleNode.rawData
                }
                else
                {
                    eleNode = this._elements[i]
                    eleNode.data = data[i]
                    eleNode.resetChanges()
                }

                // load tracker data
                const key = this.getPrimaryKey(eleNode)
                if (key && this._tracker[key]?.update)
                {
                    eleNode.data = this._tracker[key].update
                }
            }

            for (let i = this._elements.length - 1; i >= data.length; i--)
                this._elements.pop().dispose()

            // record query
            this._total = info?.total
            this._count = info?.take
            this._descend = info?.descend
            this._query = info.filter
            this._page = page
            this.notify()
        }
        catch(ex)
        {
            throw ex
        }
    }

    //#endregion

    //#region Properties

    //#endregion

    //#region Fields

    private _eschema: INodeSchema = { name: '', type: SchemaType.Namespace }
    private _elements: AnySchemaNode[] = []
    private _enode: EnumNode | undefined
    private _total: number | undefined
    private _count: number | undefined
    private _page: number | undefined
    private _query: { [key:string]: any } | undefined
    private _descend: boolean | undefined
    private _tracker: { [key:string]: { origin?: {}, update?: {}, delete?: boolean }} = {}
    private _errfld: AnySchemaNode | undefined

    //#endregion

    /**
     * Construct a scalar schema node.
     * @param parent the parent node of the node.
     * @param config the config of the node.
     */
    constructor(config: ISchemaConfig, data: any, parent: AnySchemaNode | undefined = undefined) {
        super(config, data, parent)
        if (isNull(data) || !Array.isArray(data)) data = []

        // copy default if provided
        if (!data.length && Array.isArray(this._data) && this._data.length) data = [...this._data]

        // init the raw data
        this._data = data

        // page only for app fields with incr-update
        if (this._config.incrUpdate) {
            // record since we may change those in the view
            // offset must align with the page count, promise by the server
            this._total = this._config.total
            this._count = this._config.take
            this._descend = this._config.descend
            this._query = this._config.filter ? { ...this._config.filter } : undefined
            this._page = this._count ? Math.floor((this._config.skip || 0) / this._count) : 0
        }

        // element check
        this._eschema = getCachedSchema(this._schema.array!.element)!
        if (this._eschema.type === SchemaType.Enum)
        {
            this._enode = new EnumNode({
                ...config,
                type: this._eschema.name,
                multiple: true,
            } as IEnumConfig, data, this)
            this._enode.subscribe(this.notify)
            this._enode.subscribeState(this.notifyState)
        }
        else if (!this.schema.array?.single)
        {
            // init elements
            for (let i = 0; i < data.length; i++)
            {
                const eleNode = this.newElement(data[i])
                this._elements.push(eleNode)
                this._data[i] = eleNode.rawData
            }
        }
    }
}