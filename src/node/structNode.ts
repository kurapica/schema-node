import { SchemaType } from '../enum/schemaType'
import { AnySchemaNode, SchemaNode } from './schemaNode'
import { ISchemaNodeConfig } from '../config/schemaConfig'
import { getCachedSchema } from '../utils/schemaProvider'
import { _LS } from '../utils/locale'
import { isNull } from '../utils/toolset'
import { ArraySchemaNode } from './arrayNode'
import { EnumSchemaNode } from './enumNode'
import { ScalarSchemaNode } from './scalarNode'
import { StructRuleSchema } from '../ruleSchema/structRuleSchema'
import { StructRule } from '../rule/structRule'

/**
 * The struct schema data node
 */
export class StructSchemaNode extends SchemaNode<ISchemaNodeConfig, StructRuleSchema, StructRule> {
    //#region Implementation

    get schemaType(): SchemaType { return SchemaType.Struct }
    get valid(): boolean { return this._fields.findIndex(f => !f.valid) < 0 }
    get error(): any { return this._fields.find(f => !f.valid)?.error }
    get changed(): boolean { return this._fields.findIndex(f => f.changed) >= 0 }
    validate(): void { return this._fields.forEach(f => f.validate() )}

    get data()
    {
        const result: { [key:string]: any } = {}
        this._fields.forEach(f => {
            if (f.config.displayOnly) return // no display only
            if (f.rule.invisible && !f.valid) return // no invisiable and not valid
            result[f.config.name] = f.data
        })
        return result
    }

    set data(data: any)
    {
        if (!data || Array.isArray(data) || typeof data !== "object") data = {}
        this._fields.forEach(f => f.data = data[f.config.name])
    }

    override dispose(): void {
        this._watchter.dispose()
        this._fields.forEach(f => f.dispose() )
        this._fields = []
    }

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
    constructor(parent: AnySchemaNode, config: ISchemaNodeConfig, data: any) {
        super(parent, config, null)
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
                    field = new ScalarSchemaNode(this, fconf, data[fconf.name])
                    break
                case SchemaType.Enum:
                    field = new EnumSchemaNode(this, fconf, data[fconf.name])
                    break
                case SchemaType.Struct:
                    field = new StructSchemaNode(this, fconf, data[fconf.name])
                    break
                case SchemaType.Array:
                    field = new ArraySchemaNode(this, fconf, data[fconf.name])
                    break
            }
            if (field)
            {
                this._fields.push(field)
            }
        }
    }
}