import { SchemaType } from "../enum/schemaType"
import { ArrayNode } from "../node/arrayNode"
import { AnySchemaNode } from "../node/schemaNode"
import { StructNode } from "../node/structNode"
import { INodeSchema } from "../schema/nodeSchema"
import { IStructFieldConfig, IStructFieldRelation, IStructSchema } from "../schema/structSchema"
import { getCachedSchema } from "../utils/schemaProvider"
import { isNull } from "../utils/toolset"
import { ArrayRuleSchema } from "./arrayRuleSchema"
import { EnumRulechema } from "./enumRuleSchema"
import { ARRAY_ITSELF, ISchemaNodePushArgSchema, ISchemaNodePushSchema, RuleSchema } from "./ruleSchema"
import { ScalarRuleSchema } from "./scalarRuleSchema"
import { StructRuleSchema } from "./structRuleSchema"

export { RuleSchema, EnumRulechema, ScalarRuleSchema, StructRuleSchema, ArrayRuleSchema, ARRAY_ITSELF }

/**
 * prepare the rule schema for node
 */
export function prepareRuleSchema(node: AnySchemaNode, parent?: AnySchemaNode): RuleSchema {
    parent = parent || node.parent
    const ruleSchema = (parent instanceof ArrayNode
        ? parent.ruleSchema.element
        : parent instanceof StructNode
            ? parent.ruleSchema.schemas[(node.config as IStructFieldConfig).name]
            : null)
        || buildRuleSchema(node.schemaInfo)

    // init rule
    ruleSchema.initNode(node)
    return ruleSchema
}

//#region helper

/**
 * Build the rule schema
 */
function buildRuleSchema(schemaInfo: INodeSchema): RuleSchema {
    if (schemaInfo.type == SchemaType.Array) {
        // The array and element share the rule schema
        const elementInfo = getCachedSchema(schemaInfo.array!.element)!
        const eleRuleSchema = buildRuleSchema(elementInfo)
        eleRuleSchema.isArrayElement = true

        // Register relations of the array
        if (elementInfo?.type === SchemaType.Struct && schemaInfo.array?.relations?.length) {
            for (let i = 0; i < schemaInfo.array.relations.length; i++) {
                registerRelation(eleRuleSchema as StructRuleSchema, schemaInfo.array.relations[i], elementInfo)
            }
        }
        return new ArrayRuleSchema(eleRuleSchema)
    }
    else if (schemaInfo.type == SchemaType.Struct) {
        const structTypeInfo = schemaInfo.struct!
        const schema = new StructRuleSchema()
        const schemas = schema.schemas

        // Register for each field
        for (let i = 0; i < structTypeInfo.fields.length; i++) {
            const f = structTypeInfo.fields[i]

            // build rule schema for each field
            const schema = buildRuleSchema(getCachedSchema(f.type)!)
            schemas[f.name] = schema
            schema.loadConfig(f)
        }

        // Register the realtions
        if (structTypeInfo.relations && structTypeInfo.relations.length > 0) {
            for (let i = 0; i < structTypeInfo.relations.length; i++) {
                registerRelation(schema, structTypeInfo.relations[i], schemaInfo)
            }
        }
        return schema
    }
    else if (schemaInfo.type == SchemaType.Scalar) {
        const schema = new ScalarRuleSchema()
        schema.lowLimit = schemaInfo.scalar?.lowLimit
        schema.upLimit = schemaInfo.scalar?.upLimit
        return schema
    }
    else if (schemaInfo.type === SchemaType.Enum) {
        return new EnumRulechema()
    }
    return new RuleSchema()
}

/**
 * Register Relation between fields
 */
function registerRelation(rootSchema: StructRuleSchema, relation: IStructFieldRelation, info: INodeSchema) {
    const rootTypeInfo = info.struct!

    // locate the target
    const targetAccessPaths = getAccessPath(rootSchema, relation.field!, rootTypeInfo)
    if (!targetAccessPaths || targetAccessPaths.length == 0) {
        console.error(`The ${relation.field} can't be locate, please check the realtions in ${info.name} type`)
        return
    }

    // locate the refs
    const args: ISchemaNodePushArgSchema[] = []
    relation.funcArgs.forEach(a => {
        if (a.name) {
            // access path
            const accessPaths = getAccessPath(rootSchema, a.name, rootTypeInfo)
            if (accessPaths == null || accessPaths.length == 0 || !isPathAccessable(targetAccessPaths, accessPaths)) {
                console.error(`The ${relation.field} can access path "${a.name}", check the realtions in ${info.name} type`)
                return
            }

            // ref field
            args.push({ schema: rootSchema, field: a.name })
        }
        else {
            // const value
            args.push({ value: a.value })
        }
    })

    if (args.length < relation.funcArgs.length) {
        return
    }

    // register
    const targetSchema = targetAccessPaths[targetAccessPaths.length - 1].schema
    const pushSchema: ISchemaNodePushSchema = { func: relation.func, args, type: relation.relationType }
    targetSchema.pushSchemas = targetSchema.pushSchemas || []
    targetSchema.pushSchemas.push(pushSchema)
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
        // array count the same with element
        if (fieldType?.type == SchemaType.Array) {
            fieldType = getCachedSchema(fieldType.array!.element)
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

//#endregion

//#region inner types


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

//#endregion