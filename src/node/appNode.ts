import { SchemaType } from "../enum/schemaType"
import { IAppDataResult, IAppSchema } from "../schema/appSchema"
import { getAppCachedSchema, getAppStructSchemaName, getCachedSchema } from "../utils/schemaProvider"
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

/**
 * The application schema node.
 */
export class AppNode extends SchemaNode<ISchemaConfig, StructRuleSchema, StructRule> 
{
    //#region Implementation

    // override properties
    get schemaType(): SchemaType { return SchemaType.Struct }
    get valid(): boolean { return this._fields.findIndex(f => !f.node.valid && !f.node.invisible) < 0 }
    get error(): any { return this._fields.find(f => !f.node.valid)?.node.error }
    get changed(): boolean { return this._fields.findIndex(f => f.node.changed) >= 0 }
    get data() { return undefined }

    // override methods

    /**
     * indexof the sub node
     */
    indexof(node: AnySchemaNode): number | string | undefined | null {
        return (this._fields.find(f => f.node === node)?.node.config as IStructFieldConfig)?.name || undefined
    }

    /**
     * valiate the value
     */
    async validate(): Promise<void> {
        for(let i = 0; i < this._fields.length; i++)
        {
            await this._fields[i].node.validation()
        }
    }

    /**
     * reset changes
     */
    resetChanges(): void { this._fields.forEach(f => f.node.resetChanges() ) }

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

    get target(): string { return this._target }

    /**
     * Gets the struct fields
     */
    get fields(): AnySchemaNode[] { return this._fields.map(f => f.node) }

    //#endregion

    //#region Methods

    /**
     * Gets the data field by name
     */
    getField(name: string) { return this._fields.find(f => (f.node.config as IStructFieldConfig).name.toLowerCase() === name.toLowerCase() )?.node }

    /**
     * Whether the given field is loaded
     */
    isFieldLoaded(name: string | AnySchemaNode): boolean {
        if (typeof(name) !== "string") name = (name.config as IStructFieldConfig).name.toLowerCase()
        return this._fields.find(f => (f.node.config as IStructFieldConfig).name.toLowerCase() === name)?.loaded || false 
    }

    //#endregion

    //#region Field

    protected _fields: {
        node: AnySchemaNode,
        loaded?: boolean
    }[]
    protected _target: string

    //#endregion

    /**
     * Construct an app node.
     */
    constructor(app: string, target?: string, data?: IAppDataResult, readonly?: boolean)
    {
        // app schema check
        const schema = getAppCachedSchema(app)
        if (schema) throw `Unkown application ${app}`
        if (!schema.fields?.length) throw `Application ${app} has no fields`
        super({ type: getAppStructSchemaName(app), readonly }, data?.results)

        // no data ref
        this._data = undefined
        this._original = undefined

        // init target & fields
        this._target = target || ""
        this._fields = []

        for(let i = 0; i < schema.fields?.length; i++)
        {
            const fconf = schema.fields[i]
            if (fconf.disable) continue

            const fschema = getCachedSchema(fconf.type)
            const d = data?.results[fconf.name]
            let node: AnySchemaNode | null = null
            let loaded = !isNull(d)
            
            switch (fschema?.type)
            {
                case SchemaType.Scalar:
                    node = new ScalarNode({ name: fconf.name, type: fconf.type, display: fconf.display, desc: fconf.desc, readonly } as IStructScalarFieldConfig, d, this)
                    break
                case SchemaType.Enum:
                    node = new EnumNode({ name: fconf.name, type: fconf.type, display: fconf.display, desc: fconf.desc, readonly } as IStructEnumFieldConfig, d, this)
                    break
                case SchemaType.Struct:
                    node = new StructNode({ name: fconf.name, type: fconf.type, display: fconf.display, desc: fconf.desc, readonly } as IStructFieldConfig, d, this)
                    break
                case SchemaType.Array:
                    const info = data?.infos[fconf.name]
                    node = new ArrayNode({ name: fconf.name, type: fconf.type, display: fconf.display, desc: fconf.desc, readonly,
                        isIncrUpdate: fconf.incrUpdate, count: info?.count, total: info?.total, offset: info?.offset, descend: info?.descend } as IStructArrayFieldConfig, d, this)
                    break
            }
            if (node)
            {
                this._fields.push({ node, loaded })
            }
        }
    }
}