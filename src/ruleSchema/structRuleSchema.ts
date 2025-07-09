import { SchemaType } from "../enum/schemaType"
import { AnySchemaNode } from "../node/schemaNode"
import { StructNode } from "../node/structNode"
import { INodeSchema } from "../schema/nodeSchema"
import { IStructFieldConfig, IStructFieldRelation, IStructSchema } from "../schema/structSchema"
import { getCachedSchema } from "../utils/schemaProvider"
import { isNull } from "../utils/toolset"
import { ArrayRuleSchema } from "./arrayRuleSchema"
import { ARRAY_ITSELF, getRuleSchema, ISchemaNodePushArgSchema, ISchemaNodePushSchema, regRuleSchema, RuleSchema } from "./ruleSchema"

@regRuleSchema(SchemaType.Struct)
export class StructRuleSchema extends RuleSchema
{
    /**
     * Active the rule schema for node
     */
    override active(node: StructNode, init?: boolean) {
        super.active(node, init)
        node.fields.forEach(f => f.activeRule(init))
    }

    /**
     * Deactive the rule schema for node
     */
    override deactive(node: StructNode): void {
        node.fields.forEach(f => f.deactiveRule())
        return super.deactive(node)
    }

    /**
     * Gets the child rule schema
     */
    override getChildRuleSchema(node: AnySchemaNode): RuleSchema | null
    {
        let name = (node.config as IStructFieldConfig).name
        let ruleSchema = this.schemas[name]
        if (ruleSchema?.type !== node.config.type)
        {
            // type changed, rebuild rule schema
            const structInfo = this._schema.struct!
            const f = structInfo.fields.find(d => d.name === name)
            
            // build rule schema for field
            const schema = getCachedSchema(node.config.type)
            const ruleSchemaType = getRuleSchemaType(schema.type)
            ruleSchema = new ruleSchemaType(schema)
            this.schemas[name] = ruleSchema
            ruleSchema.loadConfig(f)

            // Register the realtions
            let curr = node
            let parent = curr.parent
            while(parent) {
                const pschema = getCachedSchema(parent.config.type)
                if (parent.ruleSchema instanceof ArrayRuleSchema)
                {
                    const tempRuleSchema = curr === node ? ruleSchema : curr.ruleSchema
                    if (pschema.array?.relations?.length && tempRuleSchema instanceof StructRuleSchema)
                    {
                        pschema.array.relations
                            .filter(f => f.field === name || f.field.startsWith(`${name}.`))
                            .forEach(r => tempRuleSchema.regRelation(r))
                    }
                }
                else if (parent.ruleSchema instanceof StructRuleSchema)
                {
                    const fldname = (curr.config as IStructFieldConfig).name
                    const fld = pschema.struct?.fields?.find(f => f.name === fldname)
                    if (!fld) break
                    name = curr === node ? name : `${fld.name}.${name}`
                    const tempRuleSchema = parent.ruleSchema
                    if (pschema.struct?.relations?.length && tempRuleSchema instanceof StructRuleSchema)
                    {
                        pschema.struct.relations
                            .filter(f => f.field === name || f.field.startsWith(`${name}.`))
                            .forEach(r => tempRuleSchema.regRelation(r))
                    }
                }
                curr = parent
                parent = curr.parent
            }
        }

        return ruleSchema
    }
    
    /**
     * The rule schema for fields
     */
    schemas: { [key: string]: RuleSchema } = {}

    /**
     * Register the realtion for sub nodes
     * @param relation The realtion to be registered
     * @param info the struct info of the root schema
     */
    regRelation(relation: IStructFieldRelation) {
        const rootTypeInfo = this._schema.struct

        // locate the target
        const targetAccessPaths = getAccessPath(this, relation.field!, rootTypeInfo)
        if (!targetAccessPaths || targetAccessPaths.length == 0) {
            console.error(`The ${relation.field} can't be locate, please check the realtions in ${this._schema.name} type`)
            return
        }

        // locate the refs
        const args: ISchemaNodePushArgSchema[] = []
        relation.args.forEach(a => {
            if (a.name) {
                // access path
                const accessPaths = getAccessPath(this, a.name, rootTypeInfo)
                if (accessPaths == null || accessPaths.length == 0 || !isPathAccessable(targetAccessPaths, accessPaths)) {
                    console.error(`The "${relation.field}" can't access path "${a.name}", check the realtions in ${this._schema.name} type`)
                    return
                }   

                // ref field
                args.push({ schema: this, field: a.name })
            }
            else {
                // const value
                args.push({ value: a.value })
            }
        })

        if (args.length < relation.args.length) 
            return

        // register
        const targetSchema = targetAccessPaths[targetAccessPaths.length - 1].schema
        const pushSchema: ISchemaNodePushSchema = { func: relation.func, args, type: relation.type }
        targetSchema.pushSchemas = targetSchema.pushSchemas || []
        targetSchema.pushSchemas.push(pushSchema)
    }

    private _schema: INodeSchema
    constructor(schema: INodeSchema, path: string = "", ruleFields: string[] = [])
    {
        super(schema)
        this._schema = schema
        const structInfo = schema.struct!

        // only use schema name as root
        path = path || schema.name

        // Register for each field
        for (let i = 0; i < structInfo.fields.length; i++) {
            const f = structInfo.fields[i]

            // build rule fields
            let rf = ruleFields.filter(s => s === f.name || s.startsWith(`${f.name}.`))
            structInfo.relations?.filter(r => r.field === f.name || r.field.startsWith(`${f.name}.`)).forEach(r => {
                if (!rf.includes(r.field)) rf.push(r.field)
            })
            rf = rf.map(n => n.substring(f.name.length + 1))
            if (!rf.includes("")) rf.push("")

            // build rule schema for each field
            const schema = getCachedSchema(f.type)
            const ruleSchema = getRuleSchema(schema, `${path}.${f.name}`, rf)
            this.schemas[f.name] = ruleSchema
            ruleSchema.loadConfig(f)
        }

        // Register the realtions
        if (structInfo.relations?.length) {
            for (let i = 0; i < structInfo.relations.length; i++) {
                this.regRelation(structInfo.relations[i])
            }
        }
    }
}


/**
 * Get the access path
 */
function getAccessPath(rootSchema: StructRuleSchema, path: string, rootTypeInfo: IStructSchema): IFieldAccessPath[] {
    // Check the array
    if (path.toLocaleLowerCase() === ARRAY_ITSELF) {
        if (rootSchema.isArrayElement) {
            return [{
                name: ARRAY_ITSELF,
                schema: rootSchema
            }]
        }
        else {
            return []
        }
    }

    // The access path
    const paths = path.toLowerCase().split(".").filter(s => !isNull(s))
    const accessPaths: IFieldAccessPath[] = []
    if (!paths || paths.length == 0 || !rootTypeInfo.fields || rootTypeInfo.fields.length == 0) return accessPaths

    // Gets the start
    let field = rootTypeInfo.fields?.find(f => f.name.toLowerCase() == paths[0])
    let fieldType = field ? getCachedSchema(field.type) : null
    if (!field || !fieldType) return accessPaths

    // init
    let schema = rootSchema.schemas![field.name]
    accessPaths.push({ name: field.name, schema })

    // rest
    for (let i = 1; i < paths.length; i++) {
        if (fieldType?.type == SchemaType.Array) {
            fieldType = getCachedSchema(fieldType.array!.element)
            schema = (schema as ArrayRuleSchema).element
        }

        if (fieldType?.type == SchemaType.Struct) {
            field = fieldType.struct!.fields?.find(f => f.name.toLowerCase() == paths[i])
            fieldType = field ? getCachedSchema(field.type) : null
            if (!field || !fieldType) return []

            schema = (schema as StructRuleSchema).schemas![field.name]
            accessPaths.push({ name: field.name, schema: schema })
        }
        else {
            return []
        }
    }

    return accessPaths
}

/**
 * Check if the path accessable
 */
function isPathAccessable(accessor: IFieldAccessPath[], target: IFieldAccessPath[]): boolean {
    // Skip the same path
    let i = 0;
    for (; i < Math.min(accessor.length, target.length); i++) {
        if (accessor[i].name !== target[i].name) break
    }

    // Check the array node
    for (; i < target.length - 1; i++) {
        if (target[i].schema.isArrayElement) {
            return false
        }
    }

    return true
}


/**
 * The field access path
 */
interface IFieldAccessPath {
    /**
     * The path
     */
    name: string,

    /**
     * The relation schema
     */
    schema: RuleSchema,
}
