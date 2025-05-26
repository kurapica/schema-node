import { SchemaType } from '../enum/schemaType'
import { IArrayConfig } from '../config/arrayConfig'
import { IEnumConfig } from '../config/enumConfig'
import { ISchemaConfig } from '../config/schemaConfig'
import { INodeSchema } from '../schema/nodeSchema'
import { getCachedSchema } from '../utils/schemaProvider'
import { _LS } from '../utils/locale'
import { AnySchemaNode, SchemaNode } from './schemaNode'
import { EnumNode } from './enumNode'
import { ScalarNode } from './scalarNode'
import { StructNode } from './structNode'
import { isEqual, isNull } from '../utils/toolset'
import { ArrayRuleSchema } from '../ruleSchema/arrayRuleSchema'
import { ArrayRule } from '../rule/arrayRule'

/**
 * The array schema data node
 */
export class ArrayNode extends SchemaNode<IArrayConfig, ArrayRuleSchema, ArrayRule> {
    //#region Implementation

    // override properties
    get schemaType(): SchemaType { return SchemaType.Array }
    get valid(): boolean { return this._enumArrayNode ? this._enumArrayNode.valid : this._elements.findIndex(e => !e.valid) < 0 }
    get error(): any { return this._enumArrayNode ? this._enumArrayNode.error : this._elements.find(e => !e.valid)?.error }
    get changed(): boolean { return this._enumArrayNode ? this._enumArrayNode.changed : !this._schemaInfo.array?.single ? this._elements.findIndex(e => e.changed) >= 0 : !isEqual(this._data, this._original) }
    
    // override methods
    validate(): void { this._enumArrayNode ? this._enumArrayNode.validate() : this._elements.forEach(e => e.validate()) }
    resetChanges(): void { this._enumArrayNode ? this._enumArrayNode.resetChanges() : this._elements.forEach(e => e.resetChanges()) }

    get data()
    {
        if (this._enumArrayNode) return this._enumArrayNode.data
        if (this._schemaInfo.array?.single) return this._data

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
        else if (this._schemaInfo.array?.single)
        {
            this.data = data
            this.validate()
            this.notify()
        }
        else 
        {
            // assign
            for(let i = 0; i < Math.min(this._elements.length, data.length); i++)
            {
                this._elements[i].data = data[i]
            }

            // destory
            for (let i = this._elements.length - 1; i > data.length; i--)
            {
                this._elements.pop()?.dispose()
            }

            // new
            for (let i = this._elements.length; i < data.length; i++)
            {
                const eleNode = this.newElement(data[i])
                if (eleNode)
                {
                    this._elements.push(eleNode)
                    if (this._rule._actived) eleNode.activeRule()
                }
            }
        }
    }

    override dispose(): void {
        this._watchter.dispose()
        this._enumArrayNode?.dispose()
        this._elements.forEach(e => e.dispose())
        this._elements = []
    }

    //#endregion

    //#region Methods

    private newElement(data?: any) {
        let eleNode: AnySchemaNode | null = null
        switch (this._eleSchemaInfo.type)
        {
            case SchemaType.Scalar:
                eleNode = new ScalarNode(this, {...this._config, require: false }, data)
                break
            case SchemaType.Enum:
                eleNode = new EnumNode(this, { ...this._config, require: false }, data)
                break
            case SchemaType.Struct:
                eleNode = new StructNode(this, { ...this._config, require: false }, data)
                break
        }
        return eleNode
    }

    /**
     * Add a new row
     */
    addRow(index?: number, data?: any) {
        if (this._eleSchemaInfo.type === SchemaType.Enum || this._schemaInfo.array?.single) return
        if (isNull(index)) index = this._elements.length
        const newEle = this.newElement(data)
        if (newEle)
        {
            this._elements.splice(index!, 0, newEle)
            newEle.activeRule(true)
        }
    }

    /**
     * Delete rows
     * @param start the start index
     * @param count the delete row count, default 1
     */
    delRows(start: number, count = 1) {
        if (this._eleSchemaInfo.type === SchemaType.Enum || this._schemaInfo.array?.single || start < 0 || start >= this._elements.length) return
        const remove = this._elements.splice(start, count)
        remove.forEach(r => r.dispose())
    }

    //#endregion

    //#region Properties

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

    //#endregion

    //#region Fields

    private _eleSchemaInfo: INodeSchema = { name: '', type: SchemaType.Namespace }
    private _elements: AnySchemaNode[] = []
    private _enumArrayNode: EnumNode | undefined

    //#endregion

    /**
     * Construct a scalar schema node.
     * @param parent the parent node of the node.
     * @param config the config of the node.
     */
    constructor(parent: AnySchemaNode, config: ISchemaConfig, data: any) {
        super(parent, config, null)

        // element check
        this._eleSchemaInfo = getCachedSchema(this._schemaInfo.array!.element)!
        if (this._eleSchemaInfo.type === SchemaType.Enum)
        {
            this._enumArrayNode = new EnumNode(this, {
                ...config,
                multiple: true,
            } as IEnumConfig, data)
        }
        else if (this.schemaInfo.array?.single)
        {
            this._data = data
        }
        else
        {
            // assign data and init elements
            this.data = data
        }
    }
}