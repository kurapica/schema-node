import { CallProcess, DataNode, Disable, isEmpty, isNull, ReadOnly, splitString } from "schema-node-core";
import { ScopePolicy } from "./property";
import { EnableStorage, Loaded } from "../appField/property";
import { DataRead } from "../appField/property";
import { Inputable } from "../appField/property";
import { DataDerive } from "../appField/property";
import { View } from "../appField/property";
import { AppScopeType } from "../../enum/appScopeType";
import { PageNode } from "../../node/pageNode";
import { getAppSchemaProvider } from "../provider/appSchemaProvider";
import { WorkflowStatus } from "../../enum/workflowStatus";
import { getAppType } from "../../runtime/appRuntime";
import { queryAppData } from "../../runtime/batchQuery";

import type { IConstraintProperty, IProperty, IRelationInfo, IValueAccess, IValueTypeAccess, Observer, PropertyCtor } from "schema-node-core";
import type { IAppDataPushResult, IAppDataQuery, IAppDataResult, IAppInteractionWorkflow, IAppWorkflowState } from "../provider/interface";
import type { AppScopePolicy } from "./property";
import type { IAppNode, IAppType } from "./type";

/** The app node to manage all field data nodes */
export class AppNode implements IValueAccess, IAppNode {
  //#region constructor & destructor

  readonly appType: IAppType;
  readonly target: string | undefined;
  private _appFieldNodes: DataNode[];
  private _workflowStates?: IAppWorkflowState[];

  constructor(appType: IAppType, target?: string, query?: IAppDataQuery, data: IAppDataResult | undefined = undefined, readonly = false) {
    this.appType = appType;
    this.target = target;
    this._appFieldNodes = [];
    this._workflowStates = data?.workflows;
    if (readonly) this.setPropertyValue(ReadOnly, true); // mark as readonly node

    // Generate the data nodes of fields
    for (const field of appType.getFields())
    {
      if (field.getPropertyValue(Disable) || field.getPropertyValue(DataRead) === false) continue;

      // Generate the data node
      const node = field.create(this, data?.results[field.name]);

      // loaded
      if (!node.isEmpty || !query?.fields?.length || query?.fields?.includes(field.name)) 
        node.setPropertyValue(Loaded, true, this);

      // readonly (it also may inherit readonly from field type)
      if (readonly) 
        node.setPropertyValue(ReadOnly, true, this);

      this._appFieldNodes.push(node as DataNode);
    }

    // attach relations from type
    this.attachRelations([{owner: this, relations: Array.from(appType.getRelations())}]);
  }

  /** The access path */
  get access(): string { return "" }

  /** The type of the node */
  get type(): IValueTypeAccess { return this.appType; }

  dispose(): void {
    this._appFieldNodes.forEach(node => node.dispose());
  }

  //#endregion

  //#region fields

  /** Get all field nodes that match the predicate predicate */
  *getFields(predicate?: (node: DataNode) => boolean): Generator<DataNode> {
    for (const info of this._appFieldNodes.filter(predicate || (() => true)))
      yield info;
  }

  /** Get an application field by name */
  getfield(name: string): DataNode | undefined {
    return this._appFieldNodes.find(node => node.name.toLowerCase() === name.toLowerCase());
  }

  /** Get all application fields */
  get fields(): Generator<DataNode> { return this.getFields(); }

  /** Get all application input fields */
  get inputFields(): Generator<DataNode> { return this.getFields((node) => node.getPropertyValue(Inputable)); }

  /** Get all application input fields that are loaded */
  get loadedInputFields(): Generator<DataNode> { return this.getFields((node) => node.getPropertyValue(Loaded) && node.getPropertyValue(Inputable)); }

  /** Get all application data derive fields */
  get deriveFields(): Generator<DataNode> { return this.getFields((node) => node.getPropertyValue(DataDerive)); }

  /** Get all application view fields */
  get viewFields(): Generator<DataNode> { return this.getFields((node) => node.getPropertyValue(View)); }

  //#endregion

  // #region IValueAccess implementation

  // value access
  get isEmpty(): boolean { return this._appFieldNodes.length === 0; }
  get original(): unknown { return undefined; }
  get rawValue(): unknown { return undefined; }
  setValue(value: unknown): void { throw new Error("Can't set value to app node"); }
  getValue(): unknown { return undefined; }
  
  /** Whether any of the input fields have changed. */
  get changed(): boolean { for (const field of this.inputFields) if (field.changed) return true; return false; }

  /** Reset all input fields to their default values. */
  reset(): void { for (const field of this.inputFields) field.reset(); }

  // property access
  getProperty(propCtor: new () => IProperty): IProperty | undefined { return this.appType.getProperty(propCtor); }
  getPropertyValue<T>(propCtor: new () => IProperty): T | undefined { return this.getProperty(propCtor)?.getValue() as T; }
  getProperties(propCtor: new () => IProperty): Generator<IProperty> { return this.appType.getProperties(propCtor); }
  *getPropertyValues<T>(propCtor: new () => IProperty): Generator<T> { for (const prop of this.getProperties(propCtor)) yield prop.getValue() as T; }
  setPropertyValue(propCtor: new () => IProperty, value?: unknown, source?: IValueAccess): void {}

  // subscription
  subscribe(func: Function, immediate?: boolean): Function { return () => {}; }
  subscribeProperty(propCtor: PropertyCtor, func: Observer<[IValueAccess, PropertyCtor, unknown, unknown]>, immediate?: boolean): Function {return () => {}; }
  recordSubscription(subscription: Function, source: unknown): void {}
  clearSubscription(source: unknown): void {}

  // access value
  getAccessValue(path: string, node?: IValueAccess): IValueAccess | undefined {
    const dotIndex = path.indexOf(".");
    let remain: string | undefined;
    if (dotIndex > 0) {
      remain = path.substring(dotIndex + 1);
      path = path.substring(0, dotIndex);
    }

    for (const field of this._appFieldNodes) {
      if (field.name.toLowerCase() === path.toLowerCase()) {
        return remain ? field.getAccessValue(remain, node) : field;
      }
    }

    return undefined;
  }
  get parent(): IValueAccess | undefined { return undefined; }

  // realtion & validation

  // attach relations from given infos
  attachRelations(relationInfos: IRelationInfo[]): void {
    const fieldRelations = new Map<string, IRelationInfo[]>();

    // attach relations from given infos
    relationInfos.forEach(info => {
      info.relations.forEach(r => {
        const paths = splitString(r.target);
        let curr: IValueAccess | undefined = info.owner;
        for (let i = 0; i < paths.length; i++)
        {
          if (curr === undefined) return;
          if (curr === this){
            if (i < paths.length - 1) { // no relation for the app node
              const next = paths[i].toLowerCase();
              const fieldInfos = fieldRelations.get(next) ?? [];
              const exist = fieldInfos.find(f => f.owner === info.owner);
              if (exist){
                exist.relations.push(r);
              }
              else{
                fieldInfos.push({owner: info.owner, relations: [r]});
              }
              fieldRelations.set(next, fieldInfos);
            }
            break;
          }
          curr = curr?.getAccessValue(paths[i], this);
        }
      });
    });

    // attach relations to fields
    this._appFieldNodes.forEach(field => field.attachRelations(fieldRelations.get(field.name.toLowerCase()) ?? []));
  }

  get isValid(): boolean { return this._appFieldNodes.every(field => !field.visible || field.isValid); }
  *violated(): Generator<IConstraintProperty> { for (const field of this._appFieldNodes) yield* field.violated(); }
  recordConstraint(constraint: IConstraintProperty, valid: boolean): void {}

  /** Validate the whole loaded input fields. */
  async validate() {
    for (const field of this.inputFields) {
      await field.validate();
    }
  }

  // #endregion IValueAccess implementation

  //#region app features

  /**
   * Reload the fields
   * @param nodes the reload nodes
   * @param onlyNotLoaded whether only reload unloaded fields
   */
  async reload(nodes?: DataNode[] | string[], onlyNotLoaded = false, noPageSet = false): Promise<void> {
    if (!this.target && this.getPropertyValue<AppScopePolicy>(ScopePolicy)?.type !== AppScopeType.SystemLevel) return;

    let queryNodes: DataNode[] = [];
    if (!nodes?.length) nodes = Array.from(this.inputFields);

    // reload check
    const checked = new Set<string>();
    const checkToQuery = (n: string) => {
      n = n.toLowerCase();
      if (isNull(n) || checked.has(n)) return;
      checked.add(n);
      const node = this.getfield(n);
      if (!node || queryNodes.includes(node)) return;

      if (node.getPropertyValue(EnableStorage) && (!onlyNotLoaded || !node.getPropertyValue(Loaded)))
        queryNodes.push(node);

      // auto load depends fields
      if (onlyNotLoaded) {
        this.appType.getRelations().forEach((r) => {
          if (r.target.toLowerCase() === node.name.toLowerCase() || r.target.toLowerCase().startsWith(node.name.toLowerCase() + "."))
          {
            if (r instanceof CallProcess)
              r.args.forEach((arg: any) => arg.source ? checkToQuery(arg.source.split(".").filter((f: string) => !isNull(f))[0]) : "");
          }
        });
      }
    };

    for (let i = 0; i < nodes.length; i++) {
      let n = nodes[i];
      if (typeof n === "object") n = n.name;
      n = n.toLowerCase();
      checkToQuery(n);
    }
    const pageableNode: DataNode[] = queryNodes.filter((n) => n instanceof PageNode);
    queryNodes = queryNodes.filter((n) => !pageableNode.includes(n));

    if (queryNodes.length) {
      const query: IAppDataQuery = {
        app: this.appType.name,
        target: this.target || "00000000-0000-0000-0000-000000000000",
        fields: queryNodes.map((n) => n.name),
      };

      const result = await queryAppData(query);
      if (!result) return;

      // assign data
      for (let i = 0; i < queryNodes.length; i++) {
        const n = queryNodes[i];
        n.setPropertyValue(Loaded, true, this);

        // update field info
        const qinfo = result.infos[n.name];
        if (n instanceof PageNode) n.fieldInfo = qinfo;

        n.value = result.results[n.name];
        n.confirm();
      }
    }

    // incr update use set page
    if (noPageSet) return;
    for (let i = 0; i < pageableNode.length; i++) {
      const n = pageableNode[i];
      n.setPropertyValue(Loaded, true, this);
      const pageNode = n as PageNode;
      pageNode.setPage(pageNode.page);
    }
  }

  /**
   * Submit all changes
   * @param nodes the submit node fields, default all
   * @param noPageSet whether not set page for array node with incrUpdate when reload after submit
   * @param onlyDel whether only submit deletes for array node
   */
  async submit(nodes?: DataNode[] | string[], noPageSet: boolean = false, onlyDel?: boolean): Promise<IAppDataPushResult | undefined> {
    if (!this.target) return undefined;
    const datas: any = {};

    const pushNodes: DataNode[] = [];
    if (!nodes?.length) nodes = Array.from(this.loadedInputFields);
    for (let i = 0; i < nodes.length; i++) {
      let n = nodes[i];
      if (typeof n === "string") n = this.getfield(n)!;
      if (!n.getPropertyValue(ReadOnly) && n.changed) {
        if (!n.isValid)
          return { result: false, error: `field ${n.name} is invalid` };
        if (onlyDel && !(n instanceof PageNode)) continue;

        if (onlyDel) {
          const deletes = n instanceof PageNode ? n.deletes : null;
          if (deletes && deletes.length > 0) {
            pushNodes.push(n);
            datas[n.name] = { deletes };
          }
        } else {
          const submitData = n.submitValue;
          const deletes = n instanceof PageNode ? n.deletes : null;

          if (!isEmpty(submitData) || (deletes && deletes.length > 0)) {
            pushNodes.push(n);
            datas[n.name] = {};
            if (!isEmpty(submitData)) datas[n.name].data = n.submitValue;
            if (deletes?.length) datas[n.name].deletes = deletes;
          }
        }
      }
    }

    if (!pushNodes.length) return { result: false };

    const provider = getAppSchemaProvider();
    const result = await provider.pushAppData(this.appType.name, this.target, datas);

    // clear changes
    if (onlyDel) {
      const pageNodes: PageNode[] = [];
      for (const n of pushNodes) {
        if (n instanceof PageNode) {
          n.clearDeletes();
          pageNodes.push(n);
        }
      }
      // reload incrUpdate array nodes from server (same as regular submit does via reload())
      if (!noPageSet) {
        for (const node of pageNodes) {
          await node.setPage(node.page);
        }
      }
    } else {
      pushNodes.forEach((n) => {
        n.confirm();
      });
      await this.reload(Array.from(this.loadedInputFields), true, noPageSet);
    }
    return result;
  }

  //#endregion

  //#region Workflow

  /**
   * Gets the interaction workflows
   */
  get interactionWorkflows(): IAppInteractionWorkflow[] {
    const workflows: IAppInteractionWorkflow[] = [];
    for (let wf of this.appType.getWorkflows()) {
      const state = this._workflowStates?.find((w) => w.name === wf.name);
      if (state) {
        workflows.push({
          ...wf,
          workflowId: state.workflowId,
          togglable: state.togglable,
        } as any);
      }
    }
    return workflows;
  }

  /**
   * Active the workflow interaction node
   * @param workflow The workflow name
   * @param node The workflow node name
   * @param workflowId The workflow instance id
   * @param data The interaction form data
   */
  async activeWorkflow(
    workflow: string,
    node?: string,
    workflowId?: string,
    data?: any,
    reload?: boolean,
  ): Promise<string | undefined> {
    const provider = getAppSchemaProvider();
    const id = await provider.interaction(
      this.appType.name,
      this.target,
      workflow,
      node,
      workflowId,
      data,
    );
    const state = this._workflowStates?.find((w) => w.name === workflow);
    if (state?.togglable && id) {
      state.workflowId = id;
      return id;
    }
    if (reload && id) {
      for (let i = 0; i < 10; i++) {
        await new Promise((resolve) => setTimeout(resolve, 1000));
        const status = await provider.workflowInfo(this.appType.name, workflow, id);
        if (
          status === WorkflowStatus.Waiting ||
          status === WorkflowStatus.Running
        )
          continue;

        const loadedInputFields = Array.from(this.loadedInputFields);
        if (loadedInputFields.length > 2) {
          // Too many loaded input fields: unload them all and clear data so that
          // schemaView lazy-load logic re-triggers them as they re-enter the viewport.
          const effected = [];
          for (const node of loadedInputFields) {
            node.value = undefined;
            node.confirm();
            effected.push(node);
          }
          effected.forEach((node) => {
            node.setPropertyValue(Loaded, false, this);
          });
        } else {
          await this.reload(loadedInputFields);
        }
        break;
      }
    }
    return id;
  }

  /**
   * Turn off the workflow
   */
  async turnOffWorkflow(workflow: string): Promise<void> {
    const state = this._workflowStates?.find((w) => w.name === workflow);
    if (!state || isNull(state.workflowId)) return;
    const provider = getAppSchemaProvider();
    await provider.interaction(
      this.appType.name,
      this.target,
      workflow,
      undefined,
      state.workflowId,
      undefined,
      true,
    );
    state.workflowId = undefined;
  }

  //#endregion

}


/**
 * Get the app node from query
 * @param query the app data query
 * @param readonly readonly mode
 */
export async function getAppNode(
  query: IAppDataQuery,
  readonly?: boolean,
): Promise<AppNode | undefined> {
  const result = await queryAppData(query);
  if (!result) return undefined;
  const appType = await getAppType(query.app);
  if (!appType) return undefined;
  const node = result
    ? new AppNode(appType, query.target, query, result, readonly)
    : undefined;
  return node;
}
