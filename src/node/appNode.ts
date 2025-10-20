import { SchemaType } from "../enum/schemaType"
import { IAppDataPushResult, IAppDataQuery, IAppDataResult, IAppSchema } from "../schema/appSchema"
import { callSchemaFunction, getAppCachedSchema, getAppStructSchemaName, getCachedSchema, getScalarValueType, getSchema, ScalarValueType } from "../utils/schemaProvider"
import { isNull } from "../utils/toolset"
import { ArrayNode } from "./arrayNode"
import { EnumNode } from "./enumNode"
import { ScalarNode } from "./scalarNode"
import { AnySchemaNode, SchemaNode } from "./schemaNode"
import { StructNode } from "./structNode"
import { ISchemaConfig } from "../config/schemaConfig"
import { StructRule } from "../rule/structRule"
import { StructRuleSchema } from "../ruleSchema"
import { IStructArrayFieldConfig, IStructEnumFieldConfig, IStructFieldConfig, IStructScalarFieldConfig } from "../schema/structSchema"
import { pushAppData, queryAppData } from "../utils/appDataProvider"
import { INodeSchema } from "../schema/nodeSchema"
import { DataCombineType, DataCombineTypeValue } from "../enum/dataCombineType"


//#region Inner Type

// The app field node states
enum AppFieldNodeState 
{
    None    = 0,
    Loaded  = 1 << 0,
    Push    = 1 << 1,
    Ref     = 1 << 2,
    FrontEnd= 1 << 3,
    Readonly= 1 << 4
}

//#endregion

/**
 * The application schema node.
 */
export class AppNode extends SchemaNode<ISchemaConfig, StructRuleSchema, StructRule> 
{
    //#region Implementation

    // override properties
    get schemaType(): SchemaType { return SchemaType.Struct }
    get valid(): boolean { return this.loadedInputFields.findIndex(f => !f.valid && !f.invisible) < 0 }
    get error(): any { return this.loadedInputFields.find(f => !f.valid)?.error }
    get changed(): boolean { return this.loadedInputFields.findIndex(f => f.changed) >= 0 }
    get data() { return undefined } // no raw data access
    get name() { return this._appSchema.name }

    // override methods

    /**
     * indexof the sub node
     */
    override indexof(node: AnySchemaNode): number | string | undefined | null {
        return this._fields.find(f => f.node === node)?.node?.name || undefined
    }
 
    /**
     * valiate the value
     */
    async validate(): Promise<void> {
        const fields = this.loadedInputFields
        for(let i = 0; i < fields.length; i++)
            await fields[i].validation()
    }

    /**
     * reset changes
     */
    override resetChanges(): void { this.loadedInputFields.forEach(f => f.resetChanges() ) }

    /**
     * reset
     */
    override reset(): void { this.loadedInputFields.forEach(f => f.reset() ) }

    /**
     * Dispose the whole application
     */
    override dispose(): void {
        this._fields.forEach(f => f.node.dispose() )
        this._fields = []
        super.dispose()
    }

    //#endregion

    //#region Properties

    /**
     * The app target
     */
    get target(): string { return this._target }

    /**
     * Gets all app fields
     */
    get fields(): AnySchemaNode[] { return this._fields.map(f => f.node) }

    /**
     * Gets all input fields
     */
    get inputFields(): AnySchemaNode[] { return this._fields.filter(f => !(f.state & (AppFieldNodeState.Push | AppFieldNodeState.Ref | AppFieldNodeState.Readonly))).map(f => f.node) }

    /**
     * Gets all the front-end fields
     */
    get frontEndFields(): AnySchemaNode[] { return this._fields.filter(f => (f.state & AppFieldNodeState.FrontEnd)).map(f => f.node) }

    /**
     * Gets all the front-end push fields
     */
    get frontEndPushFields(): AnySchemaNode[] { return this._fields.filter(f => (f.state & AppFieldNodeState.Push) && (f.state & AppFieldNodeState.FrontEnd) && !(f.state & AppFieldNodeState.Ref)).map(f => f.node) }

    /**
     * Gets all the non-ref push fields
     */
    get pushFields(): AnySchemaNode[] { return this._fields.filter(f => (f.state & AppFieldNodeState.Push) && !(f.state & AppFieldNodeState.Ref)).map(f => f.node) }

    /**
     * Gets all the non-push ref fields
     */
    get refFields(): AnySchemaNode[] { return this._fields.filter(f => (f.state & AppFieldNodeState.Ref) && !(f.state & AppFieldNodeState.Push)).map(f => f.node) }

    /**
     * Gets all loaded input fields
     */
    get loadedInputFields(): AnySchemaNode[] { return this._fields.filter(f => !(f.state & (AppFieldNodeState.Push | AppFieldNodeState.Ref)) && (f.state & AppFieldNodeState.Loaded)).map(f => f.node) }

    /**
     * Gets all source apps
     */
    get sourceApps(): string[] {
        const sourceApps: string[] = []
        this._appSchema.fields.forEach(f => {
            if (f.sourceApp && !sourceApps.includes(f.sourceApp))
                sourceApps.push(f.sourceApp)
        })
        return sourceApps
    }

    //#endregion

    //#region Methods

    /**
     * Gets the data field by name
     */
    getField(name: string) { return this._fields.find(f => f.node.name.toLowerCase() === name.toLowerCase() )?.node }

    /**
     * Whether the given field is loaded
     */
    isFieldLoaded(name: string | AnySchemaNode): boolean {
        if (typeof(name) !== "string") name = name.name.toLowerCase()
        return ((this._fields.find(f => f.node.name.toLowerCase() === name)?.state || AppFieldNodeState.None) & AppFieldNodeState.Loaded) > 0
    }

    /**
     * Calculate the front-end push fields
     */
    async calculate(): Promise<void> {
        // build the process order
        const processOrder: { [name: string]: number } = {}
        {
            let changed = true
            while (changed)
            {
                changed = false

                // scan push order
                for (let i = 0; i < this._fields.length; i++) {
                    const finfo = this._fields[i]
                    const name = finfo.node.name
                    if (!isNull(processOrder[name])) continue

                    if ((finfo.state & AppFieldNodeState.FrontEnd) && (finfo.state & AppFieldNodeState.Push))
                    {
                        const fieldSchema = this._appSchema.fields.find(f => f.name === name)
                        if (!fieldSchema || !fieldSchema.func || !fieldSchema.args?.length) 
                        {
                            changed = true
                            processOrder[name] = -1 // cover case
                            continue
                        }

                        // check args
                        let maxLevel = 0
                        let skip = false
                        for(let i = 0; i < fieldSchema.args.length; i++)
                        {
                            const relf = fieldSchema.args[i].split(".").filter(f => !isNull(f))[0]
                            if (!relf) {
                                maxLevel = -1 // skip
                                break
                            }

                            const rlvl = processOrder[name]
                            if(!isNull(rlvl))
                            {
                                if (rlvl === -1)
                                {
                                    // depends field not loaded
                                    maxLevel = -1
                                    break
                                }
                                maxLevel = Math.max(maxLevel, rlvl + 1)
                            }
                            else
                            {
                                skip = true
                                break
                            }
                        }
                        if (!skip) {
                            changed = true
                            processOrder[name] = maxLevel
                        }
                    }
                    else
                    {
                        changed = true
                        if (finfo.state & AppFieldNodeState.Loaded)
                        {
                            processOrder[name] = 0 // loaded, no push require
                        }
                        else 
                        {
                            processOrder[name] = -1 // not loaded, skip
                        }
                    }
                }
            }
        }

        // process
        let processed = true
        let processlvl = 1
        while (processed)
        {
            processed = false

            for (let i = 0; i < this._fields.length; i++) {
                const finfo = this._fields[i]
                const name = finfo.node.name
                if (processOrder[name] !== processlvl) continue
                processed = true

                const fieldSchema = this._appSchema.fields.find(f => f.name === name)
                
                // gather arguments
                const args = fieldSchema.args.map(a => {
                    const access = a.split(".")
                    let data = this.getField(access[0])?.rawData
                    access.slice(1).forEach(a => data = data && typeof(data) === 'object' ? data[a] : null)
                    return data
                })

                // calculate
                let result: any = null

                // check func arguments
                const funcSchema = (await getSchema(fieldSchema.func)).func
                if (!funcSchema) throw `unable to find function ${fieldSchema.func}`

                let arrindex = -1
                let argchk = true
                for (let i = 0; i < funcSchema.args.length; i++)
                {
                    const carg = funcSchema.args[i]
                    const arg = args.length > i ? args[i] : null
                    if (isNull(arg) && !carg.nullable)
                    {
                        argchk = false
                        break
                    }
                    
                    if (arrindex < 0 && Array.isArray(arg) && (await getSchema(carg.type))?.type !== SchemaType.Array)
                    {
                        arrindex = i
                    }
                }
                if (!argchk) continue // skip

                if (arrindex >= 0)
                {
                    // map
                    try
                    {
                        result = []
                        const array = args[arrindex]
                        for(let i = 0; i < array.length; i++)
                        {
                            args[arrindex] = array[i]
                            const r = await callSchemaFunction(fieldSchema.func, args, fieldSchema.type)
                            if (Array.isArray(r))
                            {
                                result.splice(result.length, 0, ...r)
                            }
                            else if(!isNull(r))
                            {
                                result.push(r)
                            }
                        }
                    }
                    catch (ex)
                    {
                        throw `call ${fieldSchema.func} for app field ${name} failed - ${ex}`
                    }
                } else {
                    // direct
                    try
                    {
                        result = await callSchemaFunction(fieldSchema.func, args, fieldSchema.type)
                    }
                    catch (ex)
                    {
                        throw `call ${fieldSchema.func} for app field ${name} failed - ${ex}`
                    }
                }

                // combine
                if (Array.isArray(result))
                {
                    const retSchema = await getSchema(fieldSchema.type)
                    if (retSchema.type === SchemaType.Scalar || retSchema.type === SchemaType.Enum)
                    {
                        result = await combineResult(retSchema, result, fieldSchema.combine)
                    }
                    else if (retSchema.type === SchemaType.Struct)
                    {
                        const joinres: any = {}
                        for (let i = 0; i < retSchema.struct.fields.length; i++)
                        {
                            const sfield = retSchema.struct.fields[i]
                            joinres[sfield.name] = await combineResult(
                                sfield.type, 
                                result.map(r => r[sfield.name]),
                                fieldSchema.combines?.find(c => c.field === sfield.name)?.type
                            )
                        }
                        result = joinres
                    }
                    else if (retSchema.type === SchemaType.Array && retSchema.array.element && retSchema.array?.primary?.length)
                    {
                        const primary = retSchema.array.primary
                        const structSchema = await getSchema(retSchema.array.element)
                        if (structSchema?.type === SchemaType.Struct && structSchema?.struct?.fields?.length)
                        {
                            // group by primary keys
                            const combineArray: any[] = []
                            const keyMap: {[key:string]: any[]} = {}
                            
                            for(let i = 0; i < result.length; i++)
                            {
                                const r = result[i]
                                const key = typeof(r) === "object" ? calcUniqueKey(primary, r) : null
                                if (!key) continue

                                if (keyMap[key])
                                    keyMap[key].push(r)
                                else 
                                {
                                    const com = {}
                                    primary.forEach(p => com[p] = r[p])
                                    combineArray.push(com)
                                    keyMap[key] = [r]
                                }
                            }

                            // combine
                            const valFields = structSchema.struct.fields.filter(f => !primary.includes(f.name))
                            for (let i = 0; i < combineArray.length; i++)
                            {
                                const combine = combineArray[i]
                                const res = keyMap[calcUniqueKey(primary, combine)] || []
                                
                                for(let i = 0; i < valFields.length; i++)
                                {
                                    const vfield = valFields[i]
                                    combine[vfield.name] = await combineResult(
                                        vfield.type,
                                        res.map(r => r[vfield.name]),
                                        fieldSchema.combines?.find(c => c.field === vfield.name)?.type
                                    )
                                }
                            }
                            result = combineArray
                        }
                        else
                        {
                            result = []
                        }
                    }
                }

                // assign
                finfo.node.data = result
            }
        }
    }

    /**
     * Submit all changes
     * @param nodes the submit node fields, default all
     */
    async submit(nodes?: AnySchemaNode[] | string[]): Promise<IAppDataPushResult | undefined> {
        if (!this.target) return undefined
        const datas = {}

        const pushNodes: AnySchemaNode[] = []
        if (!nodes?.length) nodes = this.inputFields
        for (let i = 0; i < nodes.length; i++)
        {
            let n = nodes[i]
            if (typeof(n) === "string") n = this.getField(n)
            const state = this._fields.find(f => f.node === n)?.state
            if (!(state & (AppFieldNodeState.FrontEnd | AppFieldNodeState.Push | AppFieldNodeState.Ref))
                && n.changed)
            {
                pushNodes.push(n)

                datas[n.name] = { data: n.submitData }
                
                if (n instanceof ArrayNode)
                {
                    const deletes = n.deletes
                    if (deletes?.length) datas[n.name].deletes = deletes
                }
            }
        }

        const result = await pushAppData(this.name, this.target, datas)

        // clear changes
        pushNodes.forEach(n => n.resetChanges())

        return result
    }

    //#endregion

    //#region Field

    protected _fields: {
        node: AnySchemaNode,
        state: AppFieldNodeState
    }[]
    protected _appSchema: IAppSchema
    protected _target: string

    //#endregion

    /**
     * Construct an app node.
     */
    constructor(app: string, target?: string, data?: IAppDataResult, readonly?: boolean)
    {
        // app schema check
        const schema = getAppCachedSchema(app)
        if (!schema) throw `Unkown application ${app}`
        if (!schema.fields?.length) throw `Application ${app} has no fields`
        super({ type: getAppStructSchemaName(app), display: schema.display, desc: schema.desc, readonly }, data?.results)

        // init target & fields
        this._appSchema = schema
        this._target = target || ""
        this._fields = []

        for(let i = 0; i < schema.fields?.length; i++)
        {
            const fconf = schema.fields[i]
            if (fconf.disable) continue

            const fschema = getCachedSchema(fconf.type)
            const d = data?.results[fconf.name]
            let node: AnySchemaNode | null = null
            
            // calculate the node state
            let state = AppFieldNodeState.None
            if (!isNull(d) || data?.infos[fconf.name]) state |= AppFieldNodeState.Loaded
            if (fconf.func) state |= AppFieldNodeState.Push
            if (fconf.sourceApp) state |= AppFieldNodeState.Ref
            if (fconf.readonly) state |= AppFieldNodeState.Readonly | AppFieldNodeState.Push
            if (fconf.frontend) {
                // front-end field always consider loaded
                state |= AppFieldNodeState.FrontEnd
                state |= AppFieldNodeState.Loaded
            }

            // ref | push field is readonly
            const readonlyField = (readonly || (state & (AppFieldNodeState.Ref | AppFieldNodeState.Push | AppFieldNodeState.Readonly))) ? true : false

            switch (fschema?.type)
            {
                case SchemaType.Scalar:
                    node = new ScalarNode({ name: fconf.name, type: fconf.type, display: fconf.display, desc: fconf.desc, readonly: readonlyField } as IStructScalarFieldConfig, d, this)
                    break
                case SchemaType.Enum:
                    node = new EnumNode({ name: fconf.name, type: fconf.type, display: fconf.display, desc: fconf.desc, readonly: readonlyField } as IStructEnumFieldConfig, d, this)
                    break
                case SchemaType.Struct:
                    node = new StructNode({ name: fconf.name, type: fconf.type, display: fconf.display, desc: fconf.desc, readonly: readonlyField } as IStructFieldConfig, d, this)
                    break
                case SchemaType.Array:
                    const info = data?.infos[fconf.name]
                    node = new ArrayNode({ name: fconf.name, type: fconf.type, display: fconf.display, desc: fconf.desc, readonly: readonlyField,
                        incrUpdate: fconf.incrUpdate, take: info?.take, total: info?.total, skip: info?.skip, descend: info?.descend, filter: info?.filter } as IStructArrayFieldConfig, d, this)
                    break
            }
            if (node) this._fields.push({ node, state })
        }
    }
}

/**
 * 
 * @param query the app data query
 * @param readonly readonly mode
 */
export async function getAppNode(query: IAppDataQuery, readonly?: boolean): Promise<AppNode | undefined>
{
    const result = await queryAppData(query)
    return result ? new AppNode(query.app, query.target, result, readonly) : undefined
}

//#region Utility

// combine result for schema
async function combineResult(schema: INodeSchema | string, result: any[], combine: DataCombineTypeValue = null): Promise<any>
{
    if (typeof(schema) === "string") schema = await getSchema(schema)
    let isnumber = false
    switch (schema.type)
    {
        case SchemaType.Scalar:
            isnumber = ((getScalarValueType(schema.type)) & ScalarValueType.Number) ? true : false
            combine ||= isnumber ? DataCombineType.Sum : DataCombineType.Assign
            break

        default:
            combine ||= DataCombineType.Assign
    }

    switch(combine) {
        case DataCombineType.Assign:
            return result?.length ? result[result.length - 1] : null

        case DataCombineType.Init:
            return result?.length ? result[0] : null

        case DataCombineType.Sum:
            if (!isnumber) return null
            let total = new BigNumber(0)
            result.forEach(r => total = total.plus(r))
            return total.toNumber()

        case DataCombineType.Count:
            if (!isnumber) return null
            return result?.length
    }
}

function calcUniqueKey(primary: string[], res: {}): string
{
    const keys:string[] = []
    for(let i = 0; i < primary.length; i++)
    {
        const d = res[primary[i]]
        if (isNull(d)) return ""
        keys.push(d instanceof Date ? d.toISOString() : `${d}`)
    }
    return keys.join(".")
}

//#endregion