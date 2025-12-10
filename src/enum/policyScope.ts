export enum PolicyScope {
    /**
     * Create Schema
     */
    SchemaCreate = "schemaCreate",
    
    /**
     * Read Schema
     */
    SchemaRead = "schemaRead",
    
    /**
     * Update Schema
     */
    SchemaUpdate = "schemaUpdate",
    
    /**
     * Delete Schema
     */
    SchemaDelete = "schemaDelete",

    /**
     * Create App Data
     */
    DataCreate = "dataCreate",
     
    /**
     * Read App Data
     */
    DataRead = "dataRead",
    
    /**
     * Write App Data
     */
    DataUpdate = "dataUpdate",

    /**
     * Delete App Data
     */
    DataDelete = "dataDelete",

    /**
     * Function execute
     */
    FuncExecute = "funcExecute",
}

export type PolicyScopeValue = `${PolicyScope}`