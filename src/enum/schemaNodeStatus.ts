export enum SchemaNodeStatus
{
    /// <summary>
    /// The node is ready
    /// </summary>
    Ready = "ready",

    /// <summary>
    /// No type definition
    /// </summary>
    NoDefinition = "noDefinition",

    /// <summary>
    /// No base scalar
    /// </summary>
    ScalarHasWrongBase = "scalarHasWrongBase",
    
    /// <summary>
    /// Scalar has wrong post valid func
    /// </summary>
    ScalarHasWrongPostValid = "scalarHasWrongPostValid",

    /// <summary>
    /// Scalar has wrong pre valid func
    /// </summary>
    ScalarHasWrongPreValid = "scalarHasWrongPreValid",

    /// <summary>
    /// Scalar has wrong white list func
    /// </summary>
    ScalarHasWrongWhiteList = "scalarHasWrongWhiteList",

    /// <summary>
    /// No array element type
    /// </summary>
    ArrayHasWrongElementType = "arrayHasWrongElementType",

    /// <summary>
    /// The array of struct has no primary
    /// </summary>
    ArrayHasNoPrimary = "arrayHasNoPrimary",

    /// <summary>
    /// The array of strut has wrong primary
    /// </summary>
    ArrayHasWrongPrimary = "arrayHasWrongPrimary",

    /// <summary>
    /// The array of struct has wrong indexes
    /// </summary>
    ArrayHasWrongIndex = "arrayHasWrongIndex",

    /// <summary>
    /// The array has wrong validation function
    /// </summary>
    ArrayHasWrongValid = "arrayHasWrongValid",

    /// <summary>
    /// The sturct type has no member
    /// </summary>
    StructNoMember = "structNoMember",

    /// <summary>
    /// The struct type of wrong base,
    /// </summary>
    StructWrongBase = "structWrongBase",

    /// <summary>
    /// The struct type has wrong validation function
    /// </summary>
    StructHasWrongValid = "structHasWrongValid",

    /// <summary>
    /// The struct member has not type
    /// </summary>
    StructMemberWrongType = "structMemberWrongType",

    /// <summary>
    /// The struct member has wrong function
    /// </summary>
    StructMemberWrongFunc = "structMemberWrongFunc",

    /// <summary>
    /// The struct member has wrong validation function
    /// </summary>
    StructMemberWrongValidFunc = "structMemberWrongValidFunc",

    /// <summary>
    /// The struct relationship has wrong valdiation function
    /// </summary>
    StructRelationshipWrongFunc = "structRelationshipWrongFunc",

    /// <summary>
    /// The funciton has wrong return type
    /// </summary>
    FunctionWrongReturnType = "functionWrongReturnType",

    /// <summary>
    /// The function argument require type
    /// </summary>
    FunctionArgumentNoType = "functionArgumentNoType",

    /// <summary>
    /// The function argument has wrong type
    /// </summary>
    FunctionArgumentWrongType = "functionArgumentWrongType",

    /// <summary>
    /// The function argument has no name
    /// </summary>
    FunctionArgumentNoName = "functionArgumentNoName",

    /// <summary>
    /// The function argument use duplicated name
    /// </summary>
    FunctionArgumentDuplicateName = "functionArgumentDuplicateName",

    /// <summary>
    /// The function expression return wrong type
    /// </summary>
    FunctionExpWrongType = "functionExpWrongType",

    /// <summary>
    /// The function expression call wrong function
    /// </summary>
    FunctionExpWrongFunc = "functionExpWrongFunc",
    
    /// <summary>
    /// The function expression call a invalid function
    /// </summary>
    FunctionExpInValidFunc = "functionExpInValidFunc",

    /// <summary>
    /// The function expression use wrong arguments
    /// </summary>
    FunctionExpWrongFuncArgs = "functionExpWrongFuncArgs",
    
    /// <summary>
    /// The function has no expressions
    /// </summary>
    FunctionNoExps = "functionNoExps",

    /// <summary>
    /// The function expression has no name
    /// </summary>
    FunctionExpNoName = "functionExpNoName",

    /// <summary>
    /// The function expression use duplicated name
    /// </summary>
    FunctionExpDuplicateName = "functionExpDuplicateName",
    
    /// <summary>
    /// The function expression use wrong func for reduce
    /// </summary>
    FunctionExpWrongFuncForReduce = "functionExpWrongFuncForReduce",
    
    /// <summary>
    /// The function expression use wrong func for first
    /// </summary>
    FunctionExpWrongFuncForFirst = "functionExpWrongFuncForFirst",
    
    /// <summary>
    /// The function expression use wrong func for last
    /// </summary>
    FunctionExpWrongFuncForLast = "functionExpWrongFuncForLast",
    
    /// <summary>
    /// The function expression use wrong func for filter
    /// </summary>
    FunctionExpWrongFuncForFilter = "functionExpWrongFuncForFilter",
    
    /// <summary>
    /// The function return struct member type not valid
    /// </summary>
    FunctionReturnMemberNotValid = "functionReturnMemberNotValid",

    /// <summary>
    /// The function expression haven't pass the complier
    /// </summary>
    FunctionExpsHasCompileError = "functionExpsHasCompileError",

    /// <summary>
    /// The workflow has wrong func
    /// </summary>
    WorkflowWrongFunc = "workflowWrongFunc",
    
    /// <summary>
    /// The workflow has wrong event
    /// </summary>
    WorkflowWrongEvent = "workflowWrongEvent",
    
    /// <summary>
    /// The policy has wrong func
    /// </summary>
    PolicyWrongFunc = "policyWrongFunc",
    
    /// <summary>
    /// The application invalid field
    /// </summary>
    ApplicationInvalidField = "applicationInvalidField",

    /// <summary>
    /// The application field wrong type
    /// </summary>
    ApplicationFieldWrongType = "applicationFieldWrongType",

    /// <summary>
    /// The application field wrong func
    /// </summary>
    ApplicationFieldWrongFunc = "applicationFieldWrongFunc",

    /// <summary>
    /// The application func wrong field
    /// </summary>
    ApplicationFieldWrongFuncField = "applicationFieldWrongFuncField",

    /// <summary>
    /// The application field wrong reference
    /// </summary>
    ApplicationFieldWrongRef = "applicationFieldWrongRef",

    /// <summary>
    /// The relation has wrong target field
    /// </summary>
    ApplicationRelationWrongTarget = "applicationRelationWrongTarget",

    /// <summary>
    /// The relation has wrong func
    /// </summary>
    ApplicationRelationWrongFunc = "applicationRelationWrongFunc",
    
    /// <summary>
    /// The application data auth wrong func
    /// </summary>
    ApplicationDataAuthWrongFunc = "applicationDataAuthWrongFunc",
    
    /// <summary>
    /// The application field data auth wrong func
    /// </summary>
    ApplicationFieldDataAuthWrongFunc = "applicationFieldDataAuthWrongFunc",
}

export type SchemaNodeStatusValue = `${SchemaNodeStatus}`