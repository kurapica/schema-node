import { SchemaType } from '../enum/schemaType'
import { IArraySchemaNodeConfig } from '../config/arrayConfig'
import { IEnumSchemaNodeConfig } from '../config/enumConfig'
import { ISchemaNodeConfig } from '../config/schemaConfig'
import { ISchemaInfo } from '../schema/schemaInfo'
import { getCachedSchema } from '../utils/schemaProvider'
import { _LS } from '../utils/locale'
import { SchemaNode } from './schemaNode'
import { EnumSchemaNode } from './enumNode'
import { ScalarSchemaNode } from './scalarNode'
import { StructSchemaNode } from './structNode'
import { isEqual, isNull } from '../utils/toolset'
import { ArrayRuleSchema } from '../ruleSchema/arrayRuleSchema'
import { ArrayRule } from '../rule/arrayRule'
import { RuleSchema } from '../ruleSchema/ruleSchema'
import { Rule } from '../rule/rule'

/**
 * The array schema data node
 */
export class ArraySchemaNode extends SchemaNode<IArraySchemaNodeConfig, ArrayRuleSchema, ArrayRule> {
    //#region Implementation

    get schemaType(): SchemaType { return SchemaType.Array }
    get valid(): boolean { return this._enumArrayNode ? this._enumArrayNode.valid : this._elements.findIndex(e => !e.valid) < 0 }
    get error(): any { return this._enumArrayNode ? this._enumArrayNode.error : this._elements.find(e => !e.valid)?.error }
    get changed(): boolean { return this._enumArrayNode ? this._enumArrayNode.changed : !this._schemaInfo.array?.single ? this._elements.findIndex(e => e.changed) >= 0 : !isEqual(this._data, this._original) }
    validate(): void { this._enumArrayNode ? this._enumArrayNode.validate() : this._elements.forEach(e => e.validate()) }

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
                    if (this._rule._actived) eleNode.activeRule(true)
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
        let eleNode: SchemaNode<ISchemaNodeConfig, RuleSchema, Rule> | null = null
        switch (this._eleSchemaInfo.type)
        {
            case SchemaType.Scalar:
                eleNode = new ScalarSchemaNode(this, {...this._config, require: false }, data)
                break
            case SchemaType.Enum:
                eleNode = new EnumSchemaNode(this, { ...this._config, require: false }, data)
                break
            case SchemaType.Struct:
                eleNode = new StructSchemaNode(this, { ...this._config, require: false }, data)
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
            newEle.activeRule(true, true)
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
    get elementSchemaInfo(): ISchemaInfo { return this._eleSchemaInfo }

    /**
     * Gets the array elements
     */
    get elements(): SchemaNode<ISchemaNodeConfig, RuleSchema, Rule>[] { return this._elements }

    /**
     * Gets the enum node if the element is enum schema node
     */
    get enumArrayNode(): EnumSchemaNode | undefined { return this._enumArrayNode }

    //#endregion

    //#region Fields

    private _eleSchemaInfo: ISchemaInfo = { name: '', type: SchemaType.Namespace }
    private _elements: SchemaNode<ISchemaNodeConfig, RuleSchema, Rule>[] = []
    private _enumArrayNode: EnumSchemaNode | undefined

    //#endregion

    /**
     * Construct a scalar schema node.
     * @param parent the parent node of the node.
     * @param config the config of the node.
     */
    constructor(parent: SchemaNode<ISchemaNodeConfig, RuleSchema, Rule>, config: ISchemaNodeConfig, data: any) {
        super(parent, config, null)

        // element check
        this._eleSchemaInfo = getCachedSchema(this._schemaInfo.array!.element)!
        if (this._eleSchemaInfo.type === SchemaType.Enum)
        {
            this._enumArrayNode = new EnumSchemaNode(this, {
                ...config,
                multiple: true,
            } as IEnumSchemaNodeConfig, data)
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