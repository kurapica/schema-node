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
     * Read App Data
     */
    DataRead = "dataRead",
    
    /**
     * Write App Data
     */
    DataWrite = "dataWrite",

    /**
     * Function execute
     */
    FuncExecute = "funcExecute",
    
    /**
     * Row access filter
     */
    RowAccess = "rowAccess",
    
    /**
     * Column access filter
     */
    ColumnAccess = "columnAccess",
}

export type PolicyScopeValue = `${PolicyScope}`