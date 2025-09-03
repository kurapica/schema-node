import { IAppSchema } from "../schema/appSchema";
import { AnySchemaNode } from "./schemaNode";

/**
 * The application schema node.
 */
export class AppNode {

    //#region Properties

    /**
     * The schema info
     */
    get schemaInfo(): IAppSchema { return this._schemaInfo }

    /**
     * The schema name
     */
    get schemaName(): string { return this._schemaInfo.name }

    //#endregion

    //#region Field

    protected _schemaInfo: IAppSchema
    protected _fields: {
        node: AnySchemaNode,
        loaded: boolean
    }[]

    //#endregion

    /**
     * Construct an app node.
     */
    constructor(schema: IAppSchema, data: any)
    {
        this._schemaInfo = schema
        
    }
}