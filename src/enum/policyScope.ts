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
    /// Create App Data
    /// </summary>
    DataCreate = "dataCreate",
    
    /// <summary>
    /// Read App Data
    /// </summary>
    DataRead = "dataRead",
    
    /// <summary>
    /// Update App Data
    /// </summary>
    DataUpdate = "dataUpdate",
    
    /// <summary>
    /// Delete App Data
    /// </summary>
    DataDelete = "dataDelete",
    
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