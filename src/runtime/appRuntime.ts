import { deepClone, exportNodeType, isNull } from "schema-node-core";
import { getAppSchemaProvider } from "../schema/provider/appSchemaProvider";

import type { NodeSchema } from "schema-node-core";
import type { AppSchema, IAppType } from "../schema/app/type";

let rootAppType: IAppType | undefined;
let appTypeCtor: (new(container?: IAppType) => IAppType) | undefined;
export function setAppTypeConstuctor(ctor: new(container?: IAppType) => IAppType) {
  appTypeCtor = ctor;
}

/** Save the app schema. */
export function saveAppSchema(schema: AppSchema | AppSchema[]): void {
  rootAppType ??= new appTypeCtor();
  rootAppType?.saveSubAppSchema(schema);
}

/** Get the cached app type by its full name. */
export function getCachedAppType(fullName: string): IAppType | undefined {
  const parts = fullName.split(".");
  rootAppType ??= new appTypeCtor();
  let node: IAppType | undefined = rootAppType;
  for (let i = 0; i < parts.length; i++)
  {
    node = node?.getSubAppType(parts[i]);
    if (!node) break;
  }
  return node;
}

/** Get the app type by its full name. */
export async function getAppType(fullName: string): Promise<IAppType | undefined> {
  fullName = fullName.toLowerCase().trim();
  const parts = fullName.split(".");

  if (!rootAppType) rootAppType = new appTypeCtor();
  let node: IAppType | undefined = rootAppType;

  // Try loading cached app types first
  for (let i = 0; i < parts.length; i++)
  {
    node = await loadAppType(node, parts[i], false, i == parts.length - 1, true);
    if (!node) break;
  }

  // Try loading full app types
  if (!node)
  {
    node = await loadAppType(rootAppType, '');
    for (let i = 0; i < parts.length; i++)
    {
      node = await loadAppType(node, parts[i], false, i == parts.length - 1, false);
      if (!node) break;
    }
  }

  return node;
}

async function loadAppType(root: IAppType, segment?: string, reload = false, isLast = false, onlyCache = false): Promise<IAppType | undefined> {
  let result: IAppType | undefined = root;
  if (segment?.length)
    result = result.getSubAppType(segment);
  if (result == null && reload || result?.loaded == true && !(isLast && reload))
    return result;

  const schema = await loadAppSchema(root, segment, reload);
  if (!schema) return undefined;

  result ??= new appTypeCtor(root);
  const subApps = schema.apps;
  delete schema.apps;

  if (root != result)
  {
    root.saveSubAppSchema(schema, true);
    root.saveSubAppType(segment, result);
  }
  result.loaded = true;
  await result.load(schema);

  if (subApps)
    result.saveSubAppSchema(subApps);

  return result;
}

async function loadAppSchema(root: IAppType | undefined, segment: string, reload?: boolean): Promise<AppSchema | undefined> {
  let schema: AppSchema | undefined = undefined;

  const provider = getAppSchemaProvider();
  const schemaName = root?.name ? `${root?.name}.${segment}` : segment;
  if (provider)
  {
    try
    {
      schema = await provider.getAppSchema(schemaName);
    }
    catch (error)
    {
      console.error(`Failed to load schema from provider: ${segment}`, error);
    }
  }
  return schema;
}

/** Gets the application full name */
export function getAppSchemaName(schema: AppSchema): string {
  return schema?.container ? `${schema.container}.${schema.name}` : schema?.name ?? '';
}

/** Export the app schema by its full name, for frontend-only mode schema download(system schema ignored) */
export async function getExportAppSchema(app: string, schemas?: NodeSchema[]): Promise<AppSchema | undefined> {
  const appType = await getAppType(app);
  if (!appType) return undefined;

  const isRoot = isNull(schemas);
  schemas ??= [];

  const { apps, nodeSchemas, ...clone } = appType.getAppSchema();
  if (!clone) return undefined;
  const schema: AppSchema = deepClone(clone);

  for (const subApp of appType.getSubAppSchemas())
  {
    const subSchema = await getExportAppSchema(subApp.name, schemas);
    if (subSchema)
    {
      schema.apps ??= [];
      schema.apps.push(subSchema);
    }
  }

  for (const field of appType.getFields())
  {
    const fieldSchema = field.getFieldSchema();
    schema.fields ??= [];
    schema.fields.push(fieldSchema);

    for (const ref of field.getRefTypes())
      exportNodeType(ref, schemas);
  }

  for (const workflow of appType.getWorkflows())
  {
    const workflowSchema = workflow.getWorkflowSchema();
    schema.workflows ??= [];
    schema.workflows.push(workflowSchema);

    for (const ref of workflow.getRefTypes())
      exportNodeType(ref, schemas);
  }

  if (isRoot)
    schema.nodeSchemas = schemas;
  return schema;
}