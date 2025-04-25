import { SchemaType } from "../enum/SchemaType";

/**
 * The schema node interface.
 */
export default interface ISchemaNode 
{
    /**
     * The name of the node.
     */
    name: string

    /**
     * The type of the node.
     */
    type: string

    /**
     * The schema type of the node.
     */
    schemaType: SchemaType

    /**
     * The label of the node.
     */
    display?: string

    /**
     * The description of the node.
     */
    description?: string;

    
}