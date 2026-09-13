import { AccessValueTypeProvider, Append, Attach, Base, buildFuncCall, Description, Display, EntrySource, EntrySourceProvider, Meta, OfSchema, PrimaryIndex, Relations, SchemaKind, SchemaType, SystemDefined, UpLimitString } from "schema-node-core";

import type { AppSchema } from "./type";

import { NODE_SELF, NS_SYSTEM_IDENTIFIER, NS_SYSTEM_STRING, PRIMARY_KEY_MAX_LEN, SCHEMA_KIND_STRING } from "schema-node-core";
import { NS_SYSTEM_SCHEMA_APP, NS_SYSTEM_SCHEMA_REFLECT_APP, SCHEMA_KIND_APP, SCHEMA_KIND_ORDER_APP } from "../../utils/constant";

/** Declare the application schema kind */
@Meta(SchemaKind, [SCHEMA_KIND_APP, SCHEMA_KIND_ORDER_APP])
@Meta(Append, [Display, Description, Relations, SystemDefined])
class AppKind {}

/** The application schema metadata */
@Meta(SchemaType, `${NS_SYSTEM_SCHEMA_APP}.schema`)
@Meta(Attach, SCHEMA_KIND_APP)
@Meta(EntrySourceProvider, buildFuncCall(`${NS_SYSTEM_SCHEMA_REFLECT_APP}.getaccessentries`, '@container', '@name', NODE_SELF))
@Meta(AccessValueTypeProvider, buildFuncCall(`${NS_SYSTEM_SCHEMA_REFLECT_APP}.getaccessvaluetype`, '@container', '@name', NODE_SELF))
class AppSchemaMeta implements AppSchema {
  @Meta(PrimaryIndex, 0)
  @Meta(SchemaType, `${NS_SYSTEM_SCHEMA_APP}.type`)
  container?: string;

  @Meta(PrimaryIndex, 1)
  @Meta(SchemaType, NS_SYSTEM_IDENTIFIER)
  name: string;
}

/** Represents the app type */
@Meta(OfSchema, SCHEMA_KIND_STRING)
@Meta(SchemaType, `${NS_SYSTEM_SCHEMA_APP}.type`)
@Meta(Base, NS_SYSTEM_STRING)
@Meta(UpLimitString, PRIMARY_KEY_MAX_LEN)
@Meta(EntrySource, buildFuncCall(`${NS_SYSTEM_SCHEMA_REFLECT_APP}.getappentries`, NODE_SELF))
class AppTypeMeta {}
