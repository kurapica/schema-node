import { deepClone, getPropertiesBySchemaKind, RelationType, getProperty, Relations, SchemaLoadState, setPropertyValue, Display, _LS } from "schema-node-core";
import { AppScopeType } from "../../enum/appScopeType";
import { ScopePolicy } from "./property";
import { AppFieldType } from "../appField/runtime";
import { AppWorkflowType } from "../appWorkflow/runtime";
import { setAppTypeConstuctor } from "../../runtime/appRuntime";

import type { AppSchema, IAppType } from "./type";
import type { ValueType, IProperty, IValueTypeAccess, RelationSchema, IRelationProvider, Entry, PropertyCtor, INodeType, IPropertyProvider, IValueAccess } from "schema-node-core";
import type { AppScopePolicy } from "./property";
import type { AppFieldSchema } from "../appField/type";
import type { AppWorkflowSchema } from "../appWorkflow/type";

import { SCHEMA_KIND_APP } from "../../utils/constant";

/** The application type */
export class AppType implements IValueTypeAccess, IRelationProvider, IAppType {
  private _schema?: AppSchema;
  private _subApps?: Map<string, AppType>;
  private _schemas?: Map<string, AppSchema>;
  private _fields?: AppFieldType[];
  private _workflows?: AppWorkflowType[];
  private _props?: IProperty[];
  private _relations?: RelationType[];
  loaded = false;

  constructor(parent?: AppType) {
    this.container = parent;
  }

  /** Load the application schema */
  async load(schema: AppSchema) {
    this._schema = schema;
    this._props = Array.from(getPropertiesBySchemaKind(schema, SCHEMA_KIND_APP));

    // load fields
    if (schema.fields) {
      this._fields = schema.fields.map(f => new AppFieldType(this, f));
      for (let field of this._fields) {
        await field.load();
      }
    }

    // load workflows
    if (schema.workflows) {
      this._workflows = schema.workflows.map(w => new AppWorkflowType(this, w));
      for (let workflow of this._workflows) {
        await workflow.load();
      }
    }

    // Load relations from Relations property
    const relations = getProperty(schema, Relations)?.getValue<RelationSchema[]>();
    if (relations?.length)
    {
      const rtypes: RelationType[] = [];
      for (const r of relations)
      {
        const rtype = new RelationType(r, this);
        rtypes.push(rtype);
        await rtype.load();
      }
      this._relations = rtypes;
    }

    this.loaded = true;
  }

  /** The application container */
  readonly container: AppType | undefined;

  /** The application name */
  get name(): string {
    if (!this._schema) return "";
    return this._schema.container ? `${this._schema.container}.${this._schema.name}` : this._schema.name;
  }

  /** The application kind */
  get kind(): string { return SCHEMA_KIND_APP; }

  /** The application scope type */
  get scopeType(): AppScopeType { return this.getProperty(ScopePolicy)?.getValue<AppScopePolicy>()?.type ?? AppScopeType.BusinessTarget; }

  /** The application error message */
  get error(): string | undefined { return this._schema?.error; }

  /** Whether this application type is referenced by any other type. */
  get isUsed(): boolean { return (this._fields?.length ?? 0) > 0 || (this._schemas?.size ?? 0) > 0; }

  /** Whether the app has fields */
  get hasFields(): boolean { return this._fields?.length ? true : false; }

  /** Whether this application type is assignable to the other type. */
  isAssignableTo(other: IValueTypeAccess): boolean { return false; }

  /** Don't use this to create an app node */
  create(value: unknown, parent?: IValueAccess, propProvider?: IPropertyProvider): IValueAccess {
    throw new Error("The AppType.create() won't be used to generate app node")
  }

  /** Get the application schema */
  getAppSchema(): AppSchema | undefined { return this._schema; }

  /** Get all sub-application types */
  *getSubApps(): Generator<AppType> {
    if (!this._subApps) return;
    yield* this._subApps.values();
  }

  /** Get a sub-application type by name */
  getSubAppType(name: string): AppType | undefined {
    return this._subApps?.get(name.toLowerCase());
  }

  /** Save a sub-application type */
  saveSubAppType(name: string, app: AppType): void {
    this._subApps ??= new Map();
    this._subApps.set(name.toLowerCase(), app);
  }

  /** Get an application schema by name */
  getSubAppSchema(name: string): AppSchema | undefined {
    return this._schemas?.get(name.toLowerCase());
  }

  /** Save an application schema */
  saveSubAppSchema(schema: AppSchema | AppSchema[], reload= false): void {
    if (Array.isArray(schema)) {
      schema.forEach(s => this.saveSubAppSchema(s, reload));
      return;
    }

    // Ignore the schema name case sensitivity
    if (this.name.toLowerCase() !== schema.container?.toLowerCase()) return;

    const name = schema.name.toLowerCase();
    const subApps = schema.apps;
    delete schema.apps;
    
    // save the schema to the map
    this._schemas ??= new Map();
    if (!(this._schemas.has(name) && !reload)){
      this._schemas.set(name, schema);

      // mark the app type need reload
      const type = this._subApps?.get(name);
      if (type) type.loaded = false;
    }

    // Create sub app types to save the schemas
    if (subApps?.length)
    {
      let type = this._subApps?.get(name);
      if (!type) {
        type = new AppType(this);
        type.load(schema).then(() => type!.loaded = false);
      }
      (type as AppType).saveSubAppSchema(subApps, reload);
    }
  }

  /** Remove a sub-application schema */
  removeSubAppSchema(name: string): void {
    this._schemas?.delete(name.toLowerCase());
    this._subApps?.delete(name.toLowerCase());
  }

  /** Get all sub-application schemas */
  *getSubAppSchemas(): Generator<AppSchema> {
    if (!this._schemas) return;
    for (let schema of this._schemas.values()) {
      yield deepClone(schema);
    }
  }

  /** Whether this application type has sub-applications. */
  get hasSubApps(): boolean { return (this._schemas?.size ?? 0) > 0; }

  /** Save an application field */
  async saveField(field: AppFieldSchema): Promise<boolean> {
    if (!this._schema || this._schema.hasApps || this._schemas?.size) return false;

    this._schema.fields ??= [];
    let index = this._schema.fields.findIndex(f => f.name.toLowerCase() === field.name.toLowerCase());

    if (index >= 0)
      this._schema.fields[index] = field;
    else
      this._schema.fields.push(field);

    const fieldType = new AppFieldType(this, field);
    await fieldType.load();

    this._fields ??= [];
    index = this._fields.findIndex(f => f.name.toLowerCase() === field.name.toLowerCase());
    if (index >= 0)
      this._fields[index] = fieldType;
    else
      this._fields.push(fieldType);
    return true;
  }

  /** Remove an application field */
  removeField(name: string): boolean {
    const field = this.getField(name);
    if (!field) return false;

    this._schema!.fields = this._schema!.fields!.filter(f => f.name.toLowerCase() !== name.toLowerCase());
    this._fields = this._fields!.filter(f => f.name.toLowerCase() !== name.toLowerCase());
    return true;
  }

  /** Swap an application field */
  swapField(field: string, other: string): void {
    const fieldIndex = this._fields?.findIndex(f => f.name.toLowerCase() === field.toLowerCase()) ?? -1;
    const otherIndex = this._fields?.findIndex(f => f.name.toLowerCase() === other.toLowerCase()) ?? -1;
    if (fieldIndex === -1 || otherIndex === -1) return;

    const temp = this._fields![fieldIndex];
    this._fields![fieldIndex] = this._fields![otherIndex];
    this._fields![otherIndex] = temp;

    const fieldSchemaIndex = this._schema!.fields!.findIndex(f => f.name.toLowerCase() === field.toLowerCase());
    const otherSchemaIndex = this._schema!.fields!.findIndex(f => f.name.toLowerCase() === other.toLowerCase());
    if (fieldSchemaIndex === -1 && otherSchemaIndex === -1) return;
    const tempSchema = this._schema!.fields![fieldSchemaIndex];
    this._schema!.fields![fieldSchemaIndex] = this._schema!.fields![otherSchemaIndex];
    this._schema!.fields![otherSchemaIndex] = tempSchema;
  }

  /** Get all application fields */
  *getFields(): Generator<AppFieldType> {
    if (!this._fields) return;
    yield* this._fields;
  }

  /** Get an application field by name */
  getField(name: string): AppFieldType | undefined {
    return this._fields?.find(f => f.name.toLowerCase() === name.toLowerCase());
  }

  /** Save an application workflow */
  async saveWorkflow(workflow: AppWorkflowSchema): Promise<boolean> {
    if (!this._schema || this._schema.hasApps || this._schemas?.size) return false;

    this._schema.workflows ??= [];
    let index = this._schema.workflows.findIndex(w => w.name.toLowerCase() === workflow.name.toLowerCase());

    if (index >= 0)
      this._schema.workflows[index] = workflow;
    else
      this._schema.workflows.push(workflow);

    const workflowType = new AppWorkflowType(this, workflow);
    await workflowType.load();

    this._workflows ??= [];
    index = this._workflows.findIndex(w => w.name.toLowerCase() === workflow.name.toLowerCase());
    if (index >= 0)
      this._workflows[index] = workflowType;
    else
      this._workflows.push(workflowType);
    return true;
  }

  /** Remove an application workflow */
  removeWorkflow(name: string): boolean {
    const workflow = this.getWorkflow(name);
    if (!workflow) return false;

    this._schema!.workflows = this._schema!.workflows!.filter(w => w.name.toLowerCase() !== name.toLowerCase());
    this._workflows = this._workflows!.filter(w => w.name.toLowerCase() !== name.toLowerCase());
    return true;
  }

  /** Get all application workflows */
  *getWorkflows(): Generator<AppWorkflowType> {
    if (!this._workflows) return;
    yield* this._workflows;
  }

  /** Get an application workflow by name */
  getWorkflow(name: string): AppWorkflowType | undefined {
    return this._workflows?.find(w => w.name.toLowerCase() === name.toLowerCase());
  }

  /** Get a property from the AppSchema. */
  getProperty<T extends IProperty>(propCtor: PropertyCtor | string): T | undefined {
    return this._props?.find(p => typeof propCtor === "string" ? p.name.toLowerCase() === propCtor.toLowerCase() : p instanceof propCtor) as T;
  }

  /** Gets the property value */
  getPropertyValue<T>(propCtor: PropertyCtor | string): T | undefined { return this.getProperty(propCtor)?.getValue() as T; }

  /** Get stacked property values. */
  *getProperties<T extends IProperty>(propCtor: PropertyCtor | string): Generator<T> {
    if (this._props) {
      for (const prop of this._props) {
        if (typeof propCtor === "string" ? prop.name.toLowerCase() === propCtor.toLowerCase() : prop instanceof propCtor) { 
          yield prop as T;
          if (!prop.stackable) return;
        }
      }
    }
  }

  /** Gets the property values */
  *getPropertyValues<T>(propCtor: PropertyCtor | string): Generator<T> { for (let prop of this.getProperties(propCtor)) yield prop.getValue() as T; }

  /** Filter properties by predicate */
  *filterProperties(predicate: (prop: IProperty) => boolean): Generator<IProperty> {
    if (!this._props?.length) return;
    for(let prop of this._props)
    {
      if (predicate(prop))
        yield prop;
    }
  }

  /** Get all referenced types */
  *getRefTypes(): Generator<INodeType> {
    if (this._fields) {
      for (const field of this._fields) {
        yield* field.getRefTypes();
      }
    }

    if (this._workflows) {
      for (const workflow of this._workflows) {
        yield* workflow.getRefTypes();
      }
    }
  }

  /** Get the application schema */
  getSchema(): AppSchema {
    if (!this._schema) return { name: "" };
    return deepClone(this._schema);
  }

  /** Get all relations */
  *getRelations(): Generator<RelationType> {
    if (!this._relations) return;
    yield* this._relations;
  }

  /** Get the value type of a property */
  getAccessValueType(path: string): ValueType | undefined {
    if (!this._fields?.length) return undefined;

    const dotIndex = path.indexOf(".");
    let remain: string | undefined;
    if (dotIndex > 0) {
      remain = path.substring(dotIndex + 1);
      path = path.substring(0, dotIndex);
    }

    for (const field of this._fields) {
      if (field.name.toLowerCase() === path.toLowerCase()) {
        return remain ? field.valueType?.getAccessValueType(remain) : field.valueType;
      }
    }

    return undefined;
  }

  getAccessEntries(): Entry<string>[] {
    return this._fields
      ?.filter(f => f.type != null)
      .map(f => {
        const entry = { value: f.name, hasChildren: f.valueType?.hasAccessEntries } as Entry<string>;
        return setPropertyValue(entry, Display, f.getPropertyValue(Display) ?? _LS(f.name));
      }) ?? [];
  }

  get hasAccessEntries(): boolean { return !!(this._fields?.length); }
}

setAppTypeConstuctor(AppType as unknown as new (container?: IAppType) => IAppType);