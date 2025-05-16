import { SchemaType } from '../enum/schemaType'
import SchemaNode from '../nodeconfig/schemaNode'
import { ISchemaNodeConfig } from '../nodeconfig/schemaNodeConfig'
import { getCachedSchema } from '../schema/schemaProvider'
import { _LS } from '../utils/locale'
import { isNull } from '../utils/toolset'
import ArraySchemaNode from './arraySchemaNode'
import EnumSchemaNode from './enumSchemaNode'
import ScalarSchemaNode from './scalarSchemaNode'

/**
 * The struct schema data node
 */
export default class StructSchemaNode extends SchemaNode<ISchemaNodeConfig> {
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
    get fields(): SchemaNode<ISchemaNodeConfig>[] { return this._fields }

    //#endregion

    //#region Fields

    protected _fields: SchemaNode<ISchemaNodeConfig>[] = []

    //#endregion

    /**
     * Construct a scalar schema node.
     * @param parent the parent node of the node.
     * @param config the config of the node.
     */
    constructor(parent: SchemaNode<ISchemaNodeConfig>, config: ISchemaNodeConfig, data: any) {
        super(parent, config, null)
        if (isNull(data) || Array.isArray(data) || typeof data !== "object") data = {}

        // init fields
        for(let i = 0; i < this._schemaInfo.struct!.fields.length; i++)
        {
            const fconf = this._schemaInfo.struct!.fields[i]
            let field: SchemaNode<ISchemaNodeConfig> | null = null
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