export enum PolicyCombine {
    /// <summary>
    /// auth1 && auth2
    /// </summary>
    AndAlso = "andAlso",
    
    /// <summary>
    /// auth1 || auth2
    /// </summary>
    OrElse = "orElse",
}

export type PolicyCombineValue = `${PolicyCombine}`