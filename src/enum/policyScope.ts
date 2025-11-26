export enum PolicyScope {
    /// <summary>
    /// Create Schema
    /// </summary>
    SchemaCreate = "schemaCreate",
    
    /// <summary>
    /// Read Schema
    /// </summary>
    SchemaRead = "schemaRead",
    
    /// <summary>
    /// Update Schema
    /// </summary>
    SchemaUpdate = "schemaUpdate",
    
    /// <summary>
    /// Delete Schema
    /// </summary>
    SchemaDelete = "schemaDelete",
     
    /// <summary>
    /// Read App Data
    /// </summary>
    DataRead = "dataRead",
    
    /// <summary>
    /// Write App Data
    /// </summary>
    DataWrite = "dataWrite",
    
    /// <summary>
    /// Row access filter
    /// </summary>
    RowAccess = "rowAccess",
    
    /// <summary>
    /// Column access filter
    /// </summary>
    ColumnAccess = "columnAccess",
}

export type PolicyScopeValue = `${PolicyScope}`