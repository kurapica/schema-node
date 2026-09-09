import { Meta, SchemaType, OfSchema, getNodeType, Require, Return } from "schema-node-core";
import { WorkflowType } from "../schema/workflow/runtime";
import { Forkable } from "../schema/workflow/property";

import { SCHEMA_KIND_FUNCTION, NS_SYSTEM_BOOL } from "schema-node-core";
import { NS_SYSTEM_SCHEMA_REFLECT_WORKFLOW, NS_SYSTEM_SCHEMA_WORKFLOW } from "../utils";

@Meta(SchemaType, NS_SYSTEM_SCHEMA_REFLECT_WORKFLOW)
@Meta(OfSchema, SCHEMA_KIND_FUNCTION)
export class SystemReflectWorkflow
{
  /** Whether the workflow kind is the same */
  @Meta(Return, NS_SYSTEM_BOOL)
  static async iskind(
    @Meta(SchemaType, `${NS_SYSTEM_SCHEMA_WORKFLOW}.type`)
    @Meta(Require, true)
    workflow: string,

    @Meta(SchemaType, `${NS_SYSTEM_SCHEMA_WORKFLOW}.kind`)
    @Meta(Require, true)
    kind: string
  ): Promise<boolean>
  {
    const workflowType = workflow ? await getNodeType(workflow) as WorkflowType : undefined;
    return workflowType?.kind === kind;
  }

  /** Whether the workflow has args */
  @Meta(Return, NS_SYSTEM_BOOL)
  static async hasargs(
    @Meta(SchemaType, `${NS_SYSTEM_SCHEMA_WORKFLOW}.type`)
    @Meta(Require, true)
    workflow: string
  ): Promise<boolean>
  {
    const workflowType = workflow ? await getNodeType(workflow) as WorkflowType : undefined;
    return !!workflowType?.args?.length;
  }

  /** Whether the workflow is forkable */
  @Meta(Return, NS_SYSTEM_BOOL)
  static async isforkable(
    @Meta(SchemaType, `${NS_SYSTEM_SCHEMA_WORKFLOW}.type`)
    @Meta(Require, true)
    workflow: string
  ): Promise<boolean>
  {
    const workflowType = workflow ? await getNodeType(workflow) as WorkflowType : undefined;
    return workflowType?.getProperty(Forkable)?.getValue<boolean>() ?? false;
  }
}