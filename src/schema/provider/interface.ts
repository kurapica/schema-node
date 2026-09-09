import { PolicyScope } from "../../enum/policyScope";
import { WorkflowStatus } from "../../enum/workflowStatus";

import type { INodeSchemaProvider, NodeSchema } from "schema-node-core";
import type { AppSchema } from "../app/type";
import type { AppWorkflowSchema } from "../appWorkflow/type";

interface ISchemaApiProtocolRequestMeta {
  wrap?: string;
  fields?: Record<string, any>;
}

interface ISchemaApiProtocolResponseMeta {
  unwrap?: string;
  fields?: Record<string, any>;
}

export interface ISchemaApiProtocolMeta {
  name?: string;
  request?: ISchemaApiProtocolRequestMeta;
  response?: ISchemaApiProtocolResponseMeta;
  schemaFormat?: string[];
  kindProperties?: Record<string, string[]>;
  error?: string[];
}

/**
 * The Application field data schema provider
 */
export interface IAppSchemaProvider extends INodeSchemaProvider {
  /**
   * Get the schema api protocol information
   */
  protocol(): Promise<ISchemaApiProtocolMeta | undefined>;

  /**
   * Load the application schema information
   * @param app the name of the application
   * @return the application schema
   */
  getAppSchema(
    app: string,
    includeTypes?: boolean,
    format?: string,
  ): Promise<AppSchema | undefined>;

  /**
   * Authorize the policy for the scope
   * @param scope The policy scope
   * @param name The schema type name
   * @param app The application name
   * @param field The field name
   * @param workflow The workflow name
   */
  authorize(
    scope: PolicyScope,
    name?: string,
    app?: string,
    field?: string,
    workflow?: string,
  ): Promise<boolean>;

  /**
   * Batch query the application data from server
   */
  batchQueryAppData(
    queries: IAppDataQuery[],
  ): Promise<IBatchQueryAppDataResult>;

  /**
   * push the application data to server
   */
  pushAppData(
    app: string,
    target: string,
    datas: { [key: string]: IAppDataFieldPushQuery },
  ): Promise<IAppDataPushResult>;

  /**
   * Process the interaction workflow request
   * @param app The application name
   * @param target The application target
   * @param workflow The workflow name
   * @param node The workflow node name
   * @param workflowId The workflow instance id
   * @param data The interaction form data
   * @param terminate Whether to terminate the workflow after interaction
   */
  interaction(
    app: string,
    target: string,
    workflow: string,
    node?: string,
    workflowId?: string,
    data?: any,
    terminate?: boolean,
  ): Promise<string | undefined>;

  /**
   * Gets the workflow status info
   * @param app The application
   * @param workflow The workflow
   * @param workflowId The workflow id
   */
  workflowInfo(
    app: string,
    workflow: string,
    workflowId: string,
  ): Promise<WorkflowStatus>;
}

/**
 * The app data query
 */
export interface IAppDataQuery {
  /**
   * The application name
   */
  app: string;

  /**
   * The application target
   */
  target: string;

  /**
   * The query fields, empty means query all
   */
  fields: string[];

  /**
   * Only query input fields
   */
  onlyInput?: boolean;

  /**
   * Only query output fields
   */
  onlyOutput?: boolean;

  /**
   * The query detail for array fields
   */
  querys?: { [key: string]: IAppDataFieldQuery };

  /**
   * The default query count
   */
  take?: number;

  /**
   * Use descend order as default
   */
  descend?: boolean;

  /**
   * Only query the application schema
   */
  schemaOnly?: boolean;

  /**
   * Don't include the type schema
   */
  noSchema?: boolean;

  /**
   * Query interaction workflow data
   */
  workflow?: boolean;
}

/**
 * The app data field query
 */
export interface IAppDataFieldQuery {
  /**
   * The key to be query, like
   *
   * filter: { 'name': 'ann', class: 'math' }
   * filter: { 'name': ['ann', 'ben'] }
   */
  filter?: { [key: string]: any };

  /**
   * The order by
   */
  orderBy?: IAppDataQueryOrder[];

  /**
   * The query count
   */
  take?: number;

  /**
   * The query data offset
   */
  skip?: number;

  /**
   * Use descend order
   */
  descend?: boolean;
}

export interface IBatchQueryAppDataResult {
  /**
   * The query results
   */
  results: IAppDataResult[];

  /**
   * The node schemas required
   */
  schemas?: NodeSchema[];
}

/**
 * The app data query result
 */
export interface IAppDataResult {
  /**
   * The application name
   */
  app: string;

  /**
   * The application target
   */
  target: string;

  /**
   * The application schema
   */
  schema?: AppSchema;

  /**
   * The app data
   */
  results: { [key: string]: any };

  /**
   * The additional field data info
   */
  infos: { [key: string]: IAppDataFieldInfo };

  /**
   * The workflow states for interaction workflow data
   */
  workflows?: IAppWorkflowState[];
}

/**
 * The app data field query result info
 */
export interface IAppDataFieldInfo {
  /**
   * The key of the query, like
   */
  filter?: { [key: string]: any };

  /**
   * The order by
   */
  orderBy?: IAppDataQueryOrder[];

  /**
   * The query count
   */
  take?: number;

  /**
   * The query offset
   */
  skip?: number;

  /**
   * The data total count
   */
  total?: number;

  /**
   * Use descend order
   */
  descend?: boolean;
}

export interface IAppDataFieldPushQuery {
  /**
   * The update data, include new & update
   */
  data?: any;

  /**
   * The delete data from array node
   */
  deletes?: any[];
}

/**
 * The data push result
 */
export interface IAppDataPushResult {
  /**
   * The push result
   */
  result: boolean;

  /**
   * The error result
   */
  error?: any;
}

/**
 * The query order
 */
export interface IAppDataQueryOrder {
  field: string;
  desc: boolean;
}

/**
 * The app workflow state
 */
export interface IAppWorkflowState {
  name: string;
  togglable: boolean;
  workflowId?: string;
}

export interface IAppInteractionWorkflow extends AppWorkflowSchema
{
    /**
     * Whether the workflow can be toggled on/off
     */
    togglable: boolean

    /**
     * The workflow identifier to be turned off
     */
    workflowId?: string
}