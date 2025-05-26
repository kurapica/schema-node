import { SchemaType } from '../enum/schemaType'
import { AnySchemaNode, SchemaNode } from './schemaNode'
import { ISchemaConfig } from '../config/schemaConfig'
import { getCachedSchema } from '../utils/schemaProvider'
import { _LS } from '../utils/locale'
import { debounce, isNull } from '../utils/toolset'
import { ArrayNode } from './arrayNode'
import { EnumNode } from './enumNode'
import { ScalarNode } from './scalarNode'
import { StructRuleSchema } from '../ruleSchema/structRuleSchema'
import { StructRule } from '../rule/structRule'

/**
 * The struct schema data node
 */
export class StructNode extends SchemaNode<ISchemaConfig, StructRuleSchema, StructRule> {
    //#region Implementation

    // override properties
    get schemaType(): SchemaType { return SchemaType.Struct }
    get valid(): boolean { return this._fields.findIndex(f => !f.valid) < 0 }
    get error(): any { return this._fields.find(f => !f.valid)?.error }
    get changed(): boolean { return this._fields.findIndex(f => f.changed) >= 0 }

    // override methods
    async validate(): Promise<void> {
        for(let i = 0; i < this._fields.length; i++)
        {
            await this._fields[i].validation()
        }
    }
    resetChanges(): void { this._fields.forEach(f => f.resetChanges() ) }

    get data()
    {
        const result: { [key:string]: any } = {}
        this._fields.forEach(f => {
            if (f.displayOnly) return // no display only
            if (f.invisible && !f.valid) return // no invisiable and not valid
            result[f.name] = f.data
        })
        return result
    }

    set data(data: any)
    {
        if (!data || Array.isArray(data) || typeof data !== "object") data = {}
        this._fields.forEach(f => f.data = data[f.name])
    }

    override dispose(): void {
        this._fields.forEach(f => f.dispose() )
        this._fields = []
        super.dispose()
    }

    //#endregion

    //#region Methods

    private refreshRawData = debounce(() => {
        this._fields.forEach(f => this._data[f.name] = f.rawData)
        this.notify()
    }, 20)

    //#endregion

    //#region Properties

    /**
     * Gets the struct fields
     */
    get fields(): AnySchemaNode[] { return this._fields }

    /**
     * Gets the struct field by name
     */
    getField(name: string) { return this._fields.find(f => f.config.name.toLowerCase() === name.toLowerCase() ) }

    //#endregion

    //#region Fields

    protected _fields: AnySchemaNode[] = []

    //#endregion

    /**
     * Construct a scalar schema node.
     * @param parent the parent node of the node.
     * @param config the config of the node.
     */
    constructor(parent: AnySchemaNode, config: ISchemaConfig, data: any) {
        super(parent, config, {})
        if (isNull(data) || Array.isArray(data) || typeof data !== "object") data = {}

        // init fields
        for(let i = 0; i < this._schemaInfo.struct!.fields.length; i++)
        {
            const fconf = this._schemaInfo.struct!.fields[i]
            let field: AnySchemaNode | null = null
            const fschema = getCachedSchema(fconf.type)
            switch (fschema?.type)
            {
                case SchemaType.Scalar:
                    field = new ScalarNode(this, fconf, data[fconf.name])
                    break
                case SchemaType.Enum:
                    field = new EnumNode(this, fconf, data[fconf.name])
                    break
                case SchemaType.Struct:
                    field = new StructNode(this, fconf, data[fconf.name])
                    break
                case SchemaType.Array:
                    field = new ArrayNode(this, fconf, data[fconf.name])
                    break
            }
            if (field)
            {
                this._fields.push(field)
                field.subscribe(this.refreshRawData)
            }
        }
    }
}