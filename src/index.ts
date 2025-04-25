export type SchemaNodeDefinition = {
    id: string
    type: string
    relations?: string[]
    [key: string]: any
  }
  
  export function createSchemaNode(def: SchemaNodeDefinition) {
    return {
      ...def,
      createdAt: new Date(),
    }
  }
  