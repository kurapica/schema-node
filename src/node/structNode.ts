import { SchemaType } from '../enum/schemaType'
import { AnySchemaNode, regSchemaNode, SchemaNode } from './schemaNode'
import { ISchemaConfig } from '../config/schemaConfig'
import { getCachedSchema } from '../utils/schemaProvider'
import { _LS } from '../utils/locale'
import { debounce, isNull } from '../utils/toolset'
import { ArrayNode } from './arrayNode'
import { EnumNode } from './enumNode'
import { ScalarNode } from './scalarNode'
import { StructRuleSchema } from '../ruleSchema/structRuleSchema'
import { StructRule } from '../rule/structRule'
import { IStructFieldConfig } from '../schema/structSchema'
import { DataChangeWatcher } from '../utils/dataChangeWatcher'
import { RelationType } from '../enum/relationType'

/**
 * The struct schema data node
 */
@regSchemaNode(SchemaType.Struct)
export class StructNode extends SchemaNode<ISchemaConfig, StructRuleSchema, StructRule> {
    //#region Implementation

    // override properties
    get schemaType(): SchemaType { return SchemaType.Struct }
    get valid(): boolean { return this._fields.findIndex(f => !f.valid && !f.invisible) < 0 }
    get error(): any { return this._fields.find(f => !f.valid)?.error }
    get changed(): boolean { return this._fields.findIndex(f => f.changed) >= 0 }

    get data()
    {
        const result: { [key:string]: any } = {}
        this._fields.forEach(f => {
            if (f.displayOnly) return // no display only
            if (f.invisible && !f.valid) return // no invisiable and not valid
            result[(f.config as IStructFieldConfig).name] = f.data
        })
        return result
    }

    set data(data: any)
    {
        if (!data || Array.isArray(data) || typeof data !== "object") data = {}
        this._fields.forEach(f => f.data = data[(f.config as IStructFieldConfig).name])
    }

    // override methods

    /**
     * swap data watcher
     */
    override swapWatcher(node: AnySchemaNode): void {
        super.swapWatcher(node)
        if (node instanceof StructNode)
        {
            this._fields.forEach(f => {
                const m = node.getField((f.config as IStructFieldConfig).name)
                if (m) node.swapWatcher(m)
            })
        }
    }

    /**
     * indexof the sub node
     */
    indexof(node: AnySchemaNode): number | string | undefined | null {
        return (this._fields.find(f => f === node)?.config as IStructFieldConfig)?.name || undefined
    }

    /**
     * valiate the value
     */
    async validate(): Promise<void> {
        for(let i = 0; i < this._fields.length; i++)
        {
            await this._fields[i].validation()
        }
    }

    /**
     * reset changes
     */
    resetChanges(): void { this._fields.forEach(f => f.resetChanges() ) }

    override dispose(): void {
        this._fields.forEach(f => f.dispose() )
        this._fields = []
        super.dispose()
    }

    //#endregion

    //#region Properties

    /**
     * Gets the struct fields
     */
    get fields(): AnySchemaNode[] { return this._fields }

    //#endregion

    //#region Methods

    private refreshRawData = debounce(() => {
        this._fields.forEach(f => this._data[(f.config as IStructFieldConfig).name] = f.rawData)
        this.notify()
    }, 20)

    /**
     * Gets the struct field by name
     */
    getField(name: string) { return this._fields.find(f => (f.config as IStructFieldConfig).name.toLowerCase() === name.toLowerCase() ) }

    /**
     * Gets whether the field is changable
     * @param name the field name
     * @returns whether the field is changable
     */
    isFieldChangable(name: string): boolean {
        const field = this.getField(name)
        return field && field.ruleSchema.pushSchemas?.find(s => s.type === RelationType.Type) ? true : false
    }

    /**
     * rebuild the field with the given type
     */
    rebuildField(name: string, type: string) {
        const fconf = this._schemaInfo.struct!.fields.find(f => f.name === name)
        if (!fconf) return

        const existed = this._fields.findIndex(f => (f.config as IStructFieldConfig).name.toLowerCase() === name.toLowerCase())
        
        fconf.type = type
        let field: AnySchemaNode | null = null
        const fschema = getCachedSchema(fconf.type)
        switch (fschema?.type)
        {
            case SchemaType.Scalar:
                field = new ScalarNode({...fconf, readonly: this._config.readonly || fconf.readonly}, this._data[fconf.name], this)
                break
            case SchemaType.Enum:
                field = new EnumNode({...fconf, readonly: this._config.readonly || fconf.readonly}, this._data[fconf.name], this)
                break
            case SchemaType.Struct:
                field = new StructNode({...fconf, readonly: this._config.readonly || fconf.readonly}, this._data[fconf.name], this)
                break
            case SchemaType.Array:
                field = new ArrayNode({...fconf, readonly: this._config.readonly || fconf.readonly}, this._data[fconf.name], this)
                break
        }
        if (field)
        {
            // replace
            if (existed >= 0)
            {
                // other node may watch the existed node
                field.swapWatcher(this._fields[existed])
                this._fields[existed].dispose()
                this._fields[existed] = field
            }
            else
            {
                this._fields.push(field)
            }
            field.subscribe(this.refreshRawData)
            this._memberChangeWatcher.notify(name)
            field.validation()

            // re-active
            if (this.rule._actived) field.activeRule()
                
        }
    }

    /**
     * Subscribe a member change handler
     *
     * @param func the change handler
     * @param immediate whether to call the handler immediately
     */
    subscribeMemberChange(func: Function, immediate?: boolean): Function {
        const result = this._memberChangeWatcher.addWatcher(func) 
        if (immediate) func()
        return result
    }

    //#endregion

    //#region Fields

    protected _fields: AnySchemaNode[] = []
    protected _memberChangeWatcher: DataChangeWatcher = new DataChangeWatcher()

    //#endregion

    /**
     * Construct a scalar schema node.
     * @param parent the parent node of the node.
     * @param config the config of the node.
     */
    constructor(config: ISchemaConfig, data: any, parent: AnySchemaNode | undefined = undefined) {
        if (isNull(data) || Array.isArray(data) || typeof data !== "object") data = {}
        super(config, data, parent)

        // init fields
        for(let i = 0; i < this._schemaInfo.struct!.fields.length; i++)
        {
            const fconf = this._schemaInfo.struct!.fields[i]
            let field: AnySchemaNode | null = null
            const fschema = getCachedSchema(fconf.type!)
            switch (fschema?.type)
            {
                case SchemaType.Scalar:
                    field = new ScalarNode({...fconf, readonly: config.readonly || fconf.readonly}, data[fconf.name], this)
                    break
                case SchemaType.Enum:
                    field = new EnumNode({...fconf, readonly: config.readonly || fconf.readonly}, data[fconf.name], this)
                    break
                case SchemaType.Struct:
                    field = new StructNode({...fconf, readonly: config.readonly || fconf.readonly}, data[fconf.name], this)
                    break
                case SchemaType.Array:
                    field = new ArrayNode({...fconf, readonly: config.readonly || fconf.readonly}, data[fconf.name], this)
                    break
            }
            if (field)
            {
                this._fields.push(field)
                field.subscribe(this.refreshRawData)
            }
        }
        this.refreshRawData()
    }
}