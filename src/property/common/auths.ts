import { Meta, ForSchema, OfSchema, SchemaType, Property, Base, buildFuncCall, Valid, PropertyValueType, DataNode, Attach, BlackList, NS_SYSTEM_BOOL, SCHEMA_KIND_ENUM, Static, InVisible } from "schema-node-core";
import { PolicyCombine } from "../../enum/policyCombine";
import { PolicyScope } from "../../enum/policyScope";

import type { IValueAccess } from "schema-node-core";

import { SCHEMA_KIND_PROPERTY, SCHEMA_KIND_NODE, NODE_SELF, SCHEMA_KIND_STRING, NS_SYSTEM_SCHEMA_FUNC, NS_SYSTEM_SCHEMA_REFLECT_FUNC_WITH_ARGS, NS_SYSTEM_LIST } from "schema-node-core";
import { SCHEMA_KIND_APP, SCHEMA_KIND_APP_FIELD, SCHEMA_KIND_APP_WORKFLOW, NS_SYSTEM_SCHEMA_PRO_APP, NS_SYSTEM_SCHEMA_APP } from "../../utils/constant";

export interface PolicyItem {
  scope: PolicyScope;
  evaluator: string;
  combine: PolicyCombine;
}

/** The auths property for node schema and app schema. */
@Meta(ForSchema, [SCHEMA_KIND_NODE, SCHEMA_KIND_APP, SCHEMA_KIND_APP_FIELD, SCHEMA_KIND_APP_WORKFLOW])
@Meta(OfSchema, SCHEMA_KIND_PROPERTY)
@Meta(SchemaType, `${NS_SYSTEM_SCHEMA_PRO_APP}.auths`)
@Meta(PropertyValueType, `${NS_SYSTEM_LIST}<${NS_SYSTEM_SCHEMA_APP}.policy.item>`)
export class Auths extends Property<PolicyItem[]> {}

/** Represents the validation function type */
@Meta(OfSchema, SCHEMA_KIND_STRING)
@Meta(Base, `${NS_SYSTEM_SCHEMA_FUNC}.valid`)
@Meta(SchemaType, `${NS_SYSTEM_SCHEMA_APP}.policy.evaluator`)
@Meta(Valid, buildFuncCall(NS_SYSTEM_SCHEMA_REFLECT_FUNC_WITH_ARGS, NODE_SELF))
class EvaluatorTypeMeta {}

/** The black list resolver for policy scope */
@Meta(ForSchema, [SCHEMA_KIND_ENUM])
@Meta(OfSchema, SCHEMA_KIND_PROPERTY)
@Meta(PropertyValueType, NS_SYSTEM_BOOL)
@Meta(SchemaType, `${NS_SYSTEM_SCHEMA_APP}.policy.scopeblacklist`)
@Meta(Static, true)
@Meta(InVisible, true)
class PolicyScopeResolver extends Property<boolean> {
  override effect(target: IValueAccess): void {
    setTimeout(() => {
      let curr = target;
      while (curr && curr instanceof DataNode) {
        const kind = curr.type.getProperty(Attach)?.getValue<string>();
        if (!kind) {
          curr = curr.parent;
          continue;
        }
        if (kind !== SCHEMA_KIND_APP && kind !== SCHEMA_KIND_APP_FIELD)
          target.setPropertyValue(BlackList, [
            PolicyScope.DataCreate,
            PolicyScope.DataRead,
            PolicyScope.DataUpdate,
            PolicyScope.DataDelete,
          ]);
        break;
      }
    }, 0);
  }
}

/** The policy item property for node schema and app schema. */
@Meta(SchemaType, `${NS_SYSTEM_SCHEMA_APP}.policy.item`)
class PolicyItemMeta implements PolicyItem {
  @Meta(SchemaType, `${NS_SYSTEM_SCHEMA_APP}.policy.scope`)
  @Meta(PolicyScopeResolver, true)
  scope: PolicyScope;

  @Meta(SchemaType, `${NS_SYSTEM_SCHEMA_APP}.policy.evaluator`)
  evaluator: string;

  @Meta(SchemaType, `${NS_SYSTEM_SCHEMA_APP}.policy.combine`)
  combine: PolicyCombine;
}
