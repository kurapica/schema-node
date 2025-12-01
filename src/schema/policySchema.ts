import { PolicyCombine } from "../enum/policyCombine"
import { PolicyScope } from "../enum/policyScope"

/**
 * Interface representing a policy schema.
 */
export interface IPolicySchema {
    /**
     * The policy items
     */
    items: IPolicyItem[],
}

/**
 * The policy item schema.
 */
export interface IPolicyItem {
    /**
     * The policy scope
     */
    scope: PolicyScope;

    /**
     * The policy evaluator
     */
    evaluator: string;

    /**
     * The policy combine method
     */
    combine: PolicyCombine;
}