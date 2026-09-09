import { Meta, OfSchema, Require, Return, SchemaType } from "schema-node-core";
import { SystemReflectApp } from "./app";

import { NS_SYSTEM_SCHEMA, NS_SYSTEM_STRING, SCHEMA_KIND_FUNCTION } from "schema-node-core";
import { NS_SYSTEM_EVENT, NS_SYSTEM_SCHEMA_REFLECT_EVENT } from "../utils";

@Meta(SchemaType, NS_SYSTEM_SCHEMA_REFLECT_EVENT)
@Meta(OfSchema, SCHEMA_KIND_FUNCTION)
export class SystemReflectEvent
{
  /** Get app field data change event payload type */
  @Meta(Return, NS_SYSTEM_STRING)
  static async getappfieldpayload(
    @Meta(SchemaType, NS_SYSTEM_SCHEMA)
    @Meta(Require, true)
    app: string,

    @Meta(SchemaType, NS_SYSTEM_SCHEMA)
    @Meta(Require, true)
    field: string
  ): Promise<string | undefined> {
    return await SystemReflectApp.getappfieldtype(app, field, true);
  }

  /** Get app field data change event payload type */
  @Meta(Return, NS_SYSTEM_STRING)
  static async getappfieldupdatepayload(
    @Meta(SchemaType, NS_SYSTEM_SCHEMA)
    @Meta(Require, true)
    app: string,

    @Meta(SchemaType, NS_SYSTEM_SCHEMA)
    @Meta(Require, true)
    field: string
  ): Promise<string | undefined> {
    const item = await SystemReflectApp.getappfieldtype(app, field, true);
    return item ? `${NS_SYSTEM_EVENT}.app.data.updatepayload<${item}>` : undefined;
  }
}
