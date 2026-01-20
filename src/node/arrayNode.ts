import { SchemaType } from "../enum/schemaType";
import { type IArrayConfig } from "../config/arrayConfig";
import { type IEnumConfig } from "../config/enumConfig";
import { type ISchemaConfig } from "../config/schemaConfig";
import { type INodeSchema } from "../schema/nodeSchema";
import { getAppCachedSchema, getCachedSchema, NS_SYSTEM_LOCALE_STRING, NS_SYSTEM_STRING, validateSchemaValue } from "../utils/schemaProvider";
import { _L, _LS } from "../utils/locale";
import { type AnySchemaNode, getSchemaNodeType, regSchemaNode, SchemaNode } from "./schemaNode";
import { EnumNode } from "./enumNode";
import { ScalarNode } from "./scalarNode";
import { StructNode } from "./structNode";
import { clearDebounce, debounce, deepClone, isEqual, isNull, sformat } from "../utils/toolset";
import { ArrayRule } from "../rule/arrayRule";
import { pushAppData, queryAppData } from "../utils/appDataProvider";
import { AppNode } from "./appNode";
import type { IAppDataFieldInfo, IAppDataQueryOrder } from "../schema/appSchema";
import { RelationType } from "../enum/relationType";
import type { IStructArrayFieldConfig, IStructFieldRelation } from "../schema/structSchema";
import type { IFunctionCallArgument } from "../schema/functionSchema";
import { FieldFilterMode, type FieldFilterModeValue} from "../enum/fieldFilterMode";
import { DataChangeWatcher } from "../utils/dataChangeWatcher";

/**
 * The array schema data node
 */
@regSchemaNode(SchemaType.Array)
export class ArrayNode extends SchemaNode<IArrayConfig, ArrayRule> { //#region Implementation

  // override properties && array properties
  get schemaType(): SchemaType { return SchemaType.Array }
  get valid(): boolean { return this._enode ? this._enode.valid : this.asSingle ? this._valid : this._elements.findIndex((e) => !e.valid) < 0}
  get error(): any { return this._enode ? this._enode.error : this.asSingle ? this._error : this._elements.find((e) => !e.valid)?.error }
  get changed(): boolean {
    if (this._enode) return this._enode.changed;
    if (this.asSingle) return !isEqual(this._data, this._original);
    if (
      this._elements.find((e) => e.changed) ||
      (this._original?.length || 0) !== (this._elements.length || 0)
    )
      return true;
    if (!this.incrUpdate) return false;
    for (let key in this._tracker) {
      const track = this._tracker[key];
      if (track.delete || track.update) return true;
    }
    return false;
  }
  get rawData() { return this._enode ? this._enode.rawData : this._data }
  get original() { return this._enode ? this._enode.original : deepClone(this._original) }
  get isEmpty() { return this._enode ? this._enode.isEmpty : Array.isArray(this._data) ? this._data.length === 0 : true }

  get fullerror(): any {
    if (this._enode) return this._enode.fullerror;
    if (this.asSingle) return this._valid ? this._errfld : undefined;
    const errs: any = {};
    let hasErr = false;
    this._elements.forEach((e, i) => {
      if (!e.valid) {
        errs[i] = e.fullerror;
        hasErr = true;
      }
    });
    return hasErr ? errs : undefined;
  }

  /**
   * Gets the schema info of the array element
   */
  get elementSchema(): INodeSchema {
    return this._eschema;
  }

  /**
   * Gets the array elements
   */
  get elements(): AnySchemaNode[] {
    return this._elements;
  }

  /**
   * Gets the enum node if the element is enum schema node
   */
  get enumNode(): EnumNode | undefined {
    return this._enode;
  }

  /**
   * Whether the array data be treated as single value, like Coordinates
   */
  get asSingle(): boolean {
    return this._schema.array?.single || false;
  }

  /**
   * Gets whether the array node is used as an incr update application field
   */
  get incrUpdate(): boolean {
    return this._config.incrUpdate || false;
  }

  /**
   * Whether allow add new element
   */
  get allowAdd(): boolean {
    return (
      !this.readonly &&
      this._fieldInfo?.allowCreate !== false &&
      this._config.fieldInfo?.allowCreate !== false
    );
  }

  /**
   * Whether allow delete element
   */
  get allowDelete(): boolean {
    return (
      !this.readonly &&
      this._fieldInfo?.allowDelete !== false &&
      this._config.fieldInfo?.allowDelete !== false
    );
  }

  /**
   * Whether allow update element
   */
  get allowUpdate(): boolean {
    return (
      !this.readonly &&
      this._fieldInfo?.allowUpdate !== false &&
      this._config.fieldInfo?.allowUpdate !== false
    );
  }

  get blackColumns(): string[] {
    return (
      this._fieldInfo?.blackColumns ||
      this._config.fieldInfo?.blackColumns ||
      []
    );
  }

  /**
   * Gets the current page
   */
  get page() {
    return this._fieldInfo?.take
      ? Math.floor((this._fieldInfo.skip || 0) / this._fieldInfo.take)
      : 0;
  }

  /**
   * Gets the page count
   */
  get pageCount() {
    return this._fieldInfo?.take;
  }

  /**
   * Gets the total count
   */
  get total() {
    return this._fieldInfo?.total ?? this._elements.length;
  }

  /**
   * Gets the query data
   */
  get query() {
    return this._fieldInfo?.filter ? { ...this._fieldInfo.filter } : undefined;
  }

  /**
   * The order by info
   */
  get orderBy(): IAppDataQueryOrder[] {
    return deepClone(this._fieldInfo?.orderBy) || [];
  }

  /**
   * Set the array data
   */
  set data(data: any) {
    if (!Array.isArray(data)) data = [];
    if (this._enode) {
      this._enode.data = data;
    } else if (this.asSingle) {
      if (Array.isArray(this._data))
        this._data.splice(0, this._data.length, ...data.map(deepClone));
      else this._data = deepClone(data);
      this.validation().then(this.notify);
    } else if (this.incrUpdate) {
      throw `Can't set data to ${_L(this.display || this.name)}`;
    } else {
      // assign
      for (let i = 0; i < Math.min(this._elements.length, data.length); i++) {
        this._elements[i].data = data[i];
        this._data[i] = this.elements[i].rawData;
      }

      // destory
      for (let i = this._elements.length - 1; i >= data.length; i--)
        this._elements.pop()?.dispose();

      // new
      for (let i = this._elements.length; i < data.length; i++) {
        const eleNode = this.newElement(data[i]);
        if (!eleNode) continue;
        this._elements.push(eleNode);
        this._data[i] = eleNode.rawData;
        if (this._rule._actived) eleNode.activeRule();
      }
      this._data.length = data.length;
    }
  }

  /**
   * Gets the array data
   */
  get data() {
    if (this._enode) return this._enode.data;
    if (this.asSingle)
      return Array.isArray(this._data) ? deepClone(this._data) : [];
    if (this._eschema.type !== SchemaType.Struct)
      return this._elements.map((e) => e.data).filter((d) => !isNull(d));

    if (this.incrUpdate) {
      // normally there is no need to fetch incr-update data for data push, keep here for safety
      const result: any = [];
      const keys = new Set<string>();
      this._elements
        .filter((e) => !this.isRowDeleted(e))
        .forEach((e) => {
          const key = this.getPrimaryKey(e);
          if (key) {
            keys.add(key);
            result.push(e.data);
          }
        });
      return result;
    } else {
      const primary = this._schema.array?.primary || [];
      const reqflds = this._eschema
        .struct!.fields.filter((f) => f.require || primary.includes(f.name))
        .map((f) => f.name);
      return reqflds.length
        ? this._elements
            .map((e) => e.data)
            .filter((d) => reqflds.findIndex((f) => isNull(d[f])) < 0)
        : this._elements.map((e) => e.data);
    }
  }

  /**
   * Gets the submit data
   */
  get submitData() {
    if (this._enode) return this._enode.submitData;
    if (this.asSingle)
      return Array.isArray(this._data) ? deepClone(this._data) : [];
    if (this._eschema.type !== SchemaType.Struct)
      return this._elements.map((e) => e.submitData).filter((d) => !isNull(d));

    if (this.incrUpdate) {
      const result: any = [];
      const keys = new Set<string>();
      this._elements
        .filter((e) => e.changed && !this.isRowDeleted(e))
        .forEach((e) => {
          const key = this.getPrimaryKey(e);
          if (key) {
            keys.add(key);
            result.push(e.data);
          }
        });
      for (let key in this._tracker) {
        if (keys.has(key) || !this._tracker[key].update) continue;
        result.push(this._tracker[key].update);
      }
      return result;
    } else {
      const primary = this._schema.array?.primary || [];
      const reqflds = this._eschema
        .struct!.fields.filter((f) => f.require || primary.includes(f.name))
        .map((f) => f.name);
      return reqflds.length
        ? this._elements
            .filter((e) => e.changed)
            .map((e) => e.data)
            .filter((d) => reqflds.findIndex((f) => isNull(d[f])) < 0)
        : this._elements.filter((e) => e.changed).map((e) => e.data);
    }
  }

  /**
   * Gets the deleted data
   */
  get deletes(): any[] | undefined {
    if (
      this.asSingle ||
      this._enode ||
      this._eschema.type !== SchemaType.Struct ||
      !this._schema.array?.primary?.length
    )
      return undefined;
    if (this.incrUpdate) {
      const deletes: any[] = [];
      const keys = new Set<string>();
      this._elements
        .filter((e) => this.isRowDeleted(e))
        .forEach((e) => {
          const key = this.getPrimaryKey(e);
          if (key) {
            keys.add(key);
            deletes.push(e.data);
          }
        });
      for (let key in this._tracker) {
        if (
          keys.has(key) ||
          !this._tracker[key].delete ||
          !(this._tracker[key].origin || this._tracker[key].update)
        )
          continue;
        deletes.push(this._tracker[key].origin || this._tracker[key].update);
      }
      return deletes;
    } else {
      if (
        !this._original ||
        !Array.isArray(this._original) ||
        !this._original.length
      )
        return [];

      const keys = new Set<string>();
      this._elements
        .map((e) => this.getPrimaryKey(e))
        .forEach((d) => {
          if (d) keys.add(d);
        });

      const deletes: any[] = [];
      this._original.forEach((e) => {
        const key = this.getPrimaryKey(e);
        if (key && !keys.has(key)) deletes.push(e);
      });
      return deletes;
    }
  }

  /**
   * Gets the array field filters
   */
  get filters() {
    return this._appFieldFilter || [];
  }

  // override methods

  /**
   * indexof the sub node
   */
  indexof(node: AnySchemaNode): number | string | undefined | null {
    if (this._enode) {
      return node === this._enode ? "" : undefined;
    } else {
      return this._elements.findIndex((e) => e === node);
    }
  }

  /**
   * validate the value
   */
  async validate(): Promise<void> {
    if (this._enode) {
      return await this._enode.validation();
    } else if (this.asSingle) {
      this._valid = true;
      this._error = "";
      const elename = this._schema.array?.element;
      if (!elename || !Array.isArray(this._data)) return;
      for (let i = 0; i < this._data.length; i++) {
        if (!(await validateSchemaValue(elename, this._data[i]))) {
          this._valid = false;
          this._error = sformat("ERR_ARRAY_DATA_NOT_VALID", this.display);
          break;
        }
      }
    } else {
      for (let i = 0; i < this._elements.length; i++) {
        await this._elements[i].validation();
      }
    }
  }

  override resetChanges(): void {
    if (this._enode) {
      this._enode.resetChanges();
    } else if (this.asSingle) {
      this._original = Array.isArray(this._data) ? deepClone(this._data) : [];
    } else {
      this._elements.forEach((e) => e.resetChanges());
      this._original = this._elements.map((e) => e.original);
      this._tracker = {};
    }
  }

  /**
   * reset
   */
  override reset(): void {
    if (this._enode) {
      this._enode.reset();
    } else if (this.incrUpdate) {
      this._elements.forEach((e) => e.reset());
      this._tracker = {}; // reset the tracker
    } else {
      this.data = deepClone(this._original) || [];
      this.resetChanges();
    }
  }

  override dispose(): void {
    this._appFieldFilter?.forEach((f) => f.nodes?.forEach((n) => n.dispose()));
    this._enode?.dispose();
    this._elements.forEach((e) => e.dispose());
    this._elements = [];
    clearDebounce(this.refreshRawData);
    super.dispose();
  }

  //#endregion

  //#region Methods

  // validate the primary fields
  private primaryCheck(): void {
    if (!this._schema.array?.primary?.length) return;
    const primarys = this._eschema.struct?.fields
      .map((f) => f.name)
      .filter((n) => this._schema.array?.primary?.includes(n));
    if (!primarys?.length) return;

    this._errfld?.setError(""); // clear previous error
    for (let i = 1; i < this._elements.length; i++) {
      const ele = this._elements[i] as StructNode;
      for (let j = 0; j < i; j++) {
        const cele = this._elements[j] as StructNode;
        let k = 0;
        for (; k < primarys.length; k++) {
          if (
            !isEqual(
              ele.getField(primarys[k])?.rawData,
              cele.getField(primarys[k])?.rawData
            )
          )
            break;
        }
        if (k >= primarys.length) {
          const errfld = ele.getField(primarys[primarys.length - 1]);
          errfld?.setError(
            sformat("ERR_ARRAY_PRIMARY_DUPLICATE", errfld.display)
          );
          this._errfld = errfld;
          return;
        }
      }
    }
  }

  // refresh raw data
  private refreshRawData = debounce(() => {
    if (Array.isArray(this._data))
      this._data.splice(0, this._data.length, ...this._elements.map((e) => e.rawData)
      );
    else this._data = this._elements.map((e) => e.rawData);

    // primary check
    this.primaryCheck();
    this.notify();
  }, 100);

  // create new element
  private newElement(data?: any) {
    let eleNode: AnySchemaNode | null = null;
    switch (this._eschema.type) {
      case SchemaType.Scalar:
        eleNode = new ScalarNode(
          { ...this._config, type: this._eschema.name, require: false },
          data,
          this
        );
        break;
      case SchemaType.Enum:
        eleNode = new EnumNode(
          { ...this._config, type: this._eschema.name, require: false },
          data,
          this
        );
        break;
      case SchemaType.Struct:
        eleNode = new StructNode(
          { ...this._config, type: this._eschema.name, require: false },
          data,
          this
        );
        if (this.incrUpdate) {
          // make incr update data primary field immutable
          const structNode = eleNode as StructNode;
          this.schema.array?.primary?.forEach((f) => {
            const fldNode = structNode.getField(f);
            if (!fldNode) return;
            fldNode.config.immutable = true;
            fldNode.notifyState();
          });
        }
        break;
    }
    if (!this.incrUpdate) eleNode?.subscribe(this.refreshRawData);
    return eleNode;
  }

  // get the unique key combine from primarys
  getPrimaryKey(node: AnySchemaNode | any) {
    const primarys = this._schema.array?.primary;
    if (!primarys?.length) return;
    const keys: string[] = [];

    if (node instanceof StructNode) {
      for (let i = 0; i < primarys.length; i++) {
        let k = primarys[i];
        const v = node.getField(k)?.rawData;
        if (isNull(v)) return undefined;
        keys.push(`${v}`);
      }
    } else {
      for (let i = 0; i < primarys.length; i++) {
        let k = primarys[i];
        const v = node[k];
        if (isNull(v)) return undefined;
        keys.push(`${v}`);
      }
    }

    return keys.join(".");
  }

  /**
   * Prepare row for incr-update
   */
  prepareRow(data?: {}) {
    if (!this.incrUpdate) return undefined;
    const row = this.newElement(data) as StructNode;
    row.activeRule(true);

    // auto query the data with primary key without date scalar field
    const primarys = this.schema.array?.primary;
    if (!primarys?.length) return row;

    const fields = this._eschema.struct?.fields?.filter((f) =>
      primarys.includes(f.name)
    );
    if (
      !fields?.length ||
      fields.find((f) => {
        const node = row.getField(f.name);
        if (node instanceof ScalarNode) return node.isDate && !node.isYearMonth;
      })
    )
      return row;

    let appNode = this.parent;
    while (appNode && !(appNode instanceof AppNode)) appNode = appNode.parent;
    if (!(appNode && appNode instanceof AppNode && appNode.target)) return row;

    // load data with primary key
    let prevkey = "";
    const loadRowData = async () => {
      const query: any = {};
      let key = "";
      for (let i = 0; i < primarys.length; i++) {
        const d = row.getField(primarys[i])?.data;
        if (isNull(d)) return;
        query[primarys[i]] = d;
        key += `.${d instanceof Date ? d.toISOString() : d}`;
      }
      if (key === prevkey) return;
      prevkey = key;

      const res = await queryAppData({
        app: appNode.name,
        target: appNode.target,
        fields: [this.name],
        noSchema: true,
        querys: {
          [this.name]: {
            take: 1,
            filter: query,
          },
        },
      });
      const data = res.results[this.name];
      if (data && Array.isArray(data) && data.length) {
        row.data = data[0];
        row.resetChanges();
      }
    };

    primarys.forEach((p) => {
      const node = row.getField(p);
      if (!node) return;
      row.watch(node, loadRowData);
    });

    return row;
  }

  /**
   * Save the prepare row
   * @param row the prepare row
   * @param forceSave force save even when the row data already exist
   */
  async savePrepareRow(
    row: StructNode,
    forceSave: boolean = false
  ): Promise<boolean> {
    if (!this.incrUpdate || !row.valid) return false;
    const primarys = this._schema.array?.primary;
    if (!primarys?.length) return false;

    // primary key check
    let isnew = false;
    for (let i = 0; i < primarys.length; i++) {
      const node = row.getField(primarys[i]);
      if (!node || isNull(node?.rawData) || !node.valid) return false;
      if (node.changed) isnew = true;
    }

    // save to server
    const key = this.getPrimaryKey(row);
    if (isnew || forceSave) {
      let appNode = this.parent;
      while (appNode && !(appNode instanceof AppNode)) appNode = appNode.parent;
      if (!(appNode && appNode instanceof AppNode && appNode.target))
        return false;

      const data = row.data;
      const res = await pushAppData(appNode.name, appNode.target, {
        [this.name]: { data: [data] },
      });

      if (res.result) {
        if (isnew) {
          // query match check
          if (this._fieldInfo?.filter) {
            for (let k in this._fieldInfo.filter) {
              if (!isEqual(data[k], this._fieldInfo.filter[k])) return true;
            }
          }

          // jump to the new record
          if (this._fieldInfo?.descend) {
            await this.setPage(0);
          } else {
            const count = this._fieldInfo?.take || 10;
            await this.setPage(
              Math.floor((this._fieldInfo?.total || 0) / count),
              count,
              false
            );
          }
        } else if (key) {
          delete this._tracker[key];
          const ele = this._elements.find((e) => this.getPrimaryKey(e) === key);
          if (ele) {
            ele.data = row.data;
            ele.resetChanges();
          }
        }
      } else {
        return false;
      }
    }
    // save to tracker
    else if (key) {
      this._tracker[key] ||= {};
      this._tracker[key].update = row.data;

      const ele = this._elements.find((e) => this.getPrimaryKey(e) === key);
      if (ele) ele.data = row.data;
    }
    return true;
  }

  /**
   * Add a new row
   */
  addRow(index?: number, data?: any) {
    if (this._enode || this.asSingle || this.incrUpdate) return;
    if (isNull(index)) index = this._elements.length;
    const newEle = this.newElement(data);
    if (newEle) {
      this._elements.splice(index!, 0, newEle);
      newEle.activeRule(true);
      this.notify("add", this.elements.length);
    }
    return newEle;
  }

  /**
   * Delete rows
   * @param start the start index
   * @param count the delete row count, default 1
   */
  delRows(start: number, count = 1) {
    if (
      this._enode ||
      this.asSingle ||
      start < 0 ||
      start >= this._elements.length
    )
      return;
    if (this.incrUpdate) {
      // mark deleted
      for (let i = start; i < start + count; i++) {
        const ele = this._elements[i];
        const key = this.getPrimaryKey(ele);
        if (key && !this._tracker[key]?.delete) {
          this._tracker[key] ||= {};
          this._tracker[key].delete = true;
          ele.notifyState();
        }
      }
    } else {
      const remove = this._elements.splice(start, count);
      remove.forEach((r) => r.dispose());
      this.notify("del", this.elements.length);
    }
  }

  /**
   * Resume rows, only for incr-update
   * @param start the start index
   * @param count the resume row count, default 1
   */
  resumeRows(start: number, count = 1) {
    if (!this.incrUpdate) return;
    for (let i = start; i < start + count; i++) {
      const ele = this._elements[i];
      const key = this.getPrimaryKey(ele);
      if (key && this._tracker[key]?.delete) {
        this._tracker[key].delete = undefined;
        ele.notifyState();
      }
    }
  }

  /**
   * Swap two row
   */
  swapRow(x: number, y: number) {
    if (this._enode || this.asSingle || this.incrUpdate) return;
    const temp = this._elements[x];
    this._elements[x] = this._elements[y];
    this._elements[y] = temp;
    this.notify("swap", x, y);
  }

  /**
   * Whether a row is deleted, only for incr-update
   */
  isRowDeleted(row: AnySchemaNode) {
    if (!this.incrUpdate) return false;
    const key = this.getPrimaryKey(row);
    return key && this._tracker[key]?.delete ? true : false;
  }

  /**
   * Change the current page
   * @todo support more orderby options in the next version
   * @param page The page no
   * @param count The page count, optional
   * @param descend Whether use descend order, optional
   * @param filter the query keys, optional
   * @param orderBy the order by info, optional
   */
  async setPage(
    page: number,
    count?: number,
    descend?: boolean,
    filter?: { [key: string]: any },
    orderBy?: IAppDataQueryOrder[]
  ) {
    //if (!this.incrUpdate) return
    count ||= this._fieldInfo?.take || 10; // default should be provided by server
    if (isNull(descend)) descend = this._fieldInfo?.descend;
    let appNode = this.parent;
    while (appNode && !(appNode instanceof AppNode)) appNode = appNode.parent;
    if (!(appNode && appNode instanceof AppNode && appNode.target)) return;

    // validate the keys
    const fields = this._eschema.struct?.fields;
    if (filter) {
      const temp: any = {};
      let hasQuery = false;
      for (let k in filter) {
        if (fields?.find((f) => f.name.toLowerCase() === k.toLowerCase())) {
          temp[k] = filter[k];
          hasQuery = true;
        } else if (
          this._appFieldFilter?.find(
            (f) => f.filter.toLowerCase() === k.toLowerCase()
          )
        ) {
          temp[k] = filter[k];
          hasQuery = true;
        }
      }
      if (hasQuery) filter = temp;
      else filter = undefined;
    } else {
      filter = this._fieldInfo?.filter;
    }

    if (orderBy) {
      const temp: IAppDataQueryOrder[] = [];
      orderBy.forEach((o) => {
        if (fields?.find((f) => f.name.toLowerCase() === o.field.toLowerCase()))
          temp.push(o);
      });
      orderBy = temp;
    } else {
      orderBy = this._fieldInfo?.orderBy;
    }

    try {
      const res = await queryAppData({
        app: appNode.name,
        target: appNode.target,
        fields: [this.name],
        querys: {
          [this.name]: {
            take: count,
            skip: page * count,
            descend,
            filter,
            orderBy,
            filterFunc: this._fieldInfo?.filterFunc,
            filterArgs: this._fieldInfo?.filterArgs,
          },
        },
      });

      this._fieldInfo = res.infos[this.name];
      const data = res.results[this.name] || [];

      // refresh
      if (this.incrUpdate) {
        // record current changes
        this._elements.forEach((e) => {
          const key = this.getPrimaryKey(e);
          if (!key) return;
          if (e.changed && e.valid) {
            this._tracker[key] ||= {};
            this._tracker[key].origin = e.original;
            this._tracker[key].update = e.data;
          } else if (this._tracker[key]) {
            if (this._tracker[key].delete) {
              this._tracker[key].origin = e.original;
              this._tracker[key].update = undefined;
            } else {
              delete this._tracker[key];
            }
          }
        });

        // load new page
        for (let i = 0; i < data.length; i++) {
          let eleNode: AnySchemaNode | null;
          if (this._elements.length <= i) {
            eleNode = this.newElement(data[i]);
            if (!eleNode) continue;
            this._elements.push(eleNode);
            this._data[i] = eleNode.rawData;
          } else {
            eleNode = this._elements[i];
            eleNode.data = data[i];
            eleNode.resetChanges();
          }

          // load tracker data
          const key = this.getPrimaryKey(data[i]);
          if (key && this._tracker[key]?.update) {
            eleNode.data = this._tracker[key].update;
          }
        }

        for (let i = this._elements.length - 1; i >= data.length; i--)
          this._elements.pop()?.dispose();
      } else {
        this.data = data;
        this.resetChanges();
      }

      // record query
      this.notify();
    } catch (ex) {
      throw ex;
    }
  }

  //#endregion

  //#region Field References

  isReferenceField(field: string): boolean {
    return this._reffields
      ? Object.keys(this._reffields).includes(field)
      : false;
  }

  /**
   * Gets the reference fields
   */
  getReferenceFields(app: string): string[] {
    return this._reffields
      ? Object.values(this._reffields)
          .filter((r) => r.app === app)
          .map((r) => r.field)
      : [];
  }

  /**
   * Query the reference node for a field within a row
   */
  async getReferenceNode(row: AnySchemaNode, field: string) {
    const refInfo = this._reffields ? this._reffields[field] : undefined;
    if (!refInfo) return undefined;
    const refApp = refInfo.app;
    const refField = refInfo.field;
    const args = [];
    let fullMatch = true;

    for (let i = 0; i < refInfo.args.length; i++) {
      if (!isNull(refInfo.args[i].name)) {
        const paths = refInfo.args[i]
          .name!.split(".")
          .filter((f) => !isNull(f));
        let node: AnySchemaNode | undefined = row;
        for (let i = 0; i < paths.length; i++) {
          if (node instanceof StructNode) {
            node = node.getField(paths[i])!;
          } else {
            node = undefined;
            break;
          }
        }
        if (node == null || !node.valid || isNull(node.data)) {
          fullMatch = false;
          break;
        }
        args.push(node.data);
      } else {
        args.push(refInfo.args[i].value);
      }
    }
    if (!fullMatch) return undefined;

    // query & build the reference node
    let appNode = this.parent;
    while (appNode && !(appNode instanceof AppNode)) appNode = appNode.parent;
    if (!(appNode && appNode instanceof AppNode && appNode.target))
      return undefined;
    if (appNode instanceof AppNode && appNode.name === refApp) {
      return await appNode.loadRefField(
        row,
        this._eschema.struct!.fields.find(
          (f) => f.name === refField
        ) as IStructArrayFieldConfig,
        refField,
        refInfo.func,
        args
      );
    } else {
      // @TODO: create a temp app node
      return undefined;
    }
  }

  /**
   * Process the filter from filter nodes
   */
  async processFilter() {
    if (!this._appFieldFilter?.length) return;

    const filter: { [key: string]: any } = {};
    this._appFieldFilter?.forEach((f) => {
      if (f.mode === FieldFilterMode.Filter) {
        const funcSchema = getCachedSchema(f.filter);
        if (funcSchema && funcSchema.type === SchemaType.Func) {
          const args: any[] = [];
          for (let i = 0; i < f.nodes.length; i++) {
            const data = f.nodes[i].data;
            if (
              isNull(data) &&
              funcSchema.func?.args &&
              !funcSchema.func.args[i + 1]?.nullable
            )
              return;
            args.push(data);
          }
          filter[f.filter] = args;
        }
      } else {
        const data = f.nodes && f.nodes.length ? f.nodes[0].data : undefined;
        if (isNull(data)) return;
        filter[f.filter] = data;
      }
    });

    await this.setPage(
      0,
      this._fieldInfo?.take,
      this._fieldInfo?.descend,
      filter
    ).catch(console.log);
  }

  /**
   * Reset the fitler
   */
  async resetFilter(load: boolean = false) {
    if (!this._appFieldFilter?.length) return;

    this._appFieldFilter?.forEach((f) => {
      f.nodes.forEach((n) => n.data = null)
    });

    if (load) await this.processFilter().catch(console.log);
  }

  /**
   * Enable or disable auto filter when filter nodes changed
   * @param enable Whether enable auto filter when filter nodes changed
   */
  enableAutoFilter(enable: boolean, delay: number = 300) {
    if (!this._appFieldFilter?.length) return;

    // clear previous
    this._appFieldFilter?.forEach((f) => f.handlers?.forEach((h) => h()));

    if (enable) {
      const loadFilter = debounce(() => {
        this.processFilter().catch(console.log);
      }, delay);

      this._appFieldFilter?.forEach((f) => {
        f.handlers = [];
        f.nodes.forEach((n) => f.handlers!.push(n.subscribe(loadFilter)));
      });
    }
  }

  /**
   * Gets the template node for field
   */
  getTemplateNode(name: string): AnySchemaNode | undefined {
    if (!this._templateRow){
      this._templateRow = this.newElement({}) as StructNode;
      this._templateRow.resetChanges();
      this._templateRow.activeRule(true);
    }
    return this._templateRow.getField(name);
  }

  /**
   * Subscribe a member change handler
   *
   * @param func the change handler
   * @param immediate whether to call the handler immediately
   */
  subscribeLayoutChanged(func: Function, immediate?: boolean): Function {
      const result = this._layoutChangeWatcher.addWatcher(func) 
      if (immediate) func()
      return result
  }
  
  //#endregion

  //#region Properties

  //#endregion

  //#region Fields

  private _eschema: INodeSchema = { name: "", type: SchemaType.Namespace };
  private _elements: AnySchemaNode[] = [];
  private _enode: EnumNode | undefined;
  private _fieldInfo: IAppDataFieldInfo | undefined;
  public _tracker: {[key: string]: { origin?: {}; update?: {}; delete?: boolean }} = {};
  private _errfld: AnySchemaNode | undefined;
  private _reffields: { [key: string]: { app: string; field: string; func: string; args: IFunctionCallArgument[]}} | undefined;
  private _appFieldFilter: IArrayFieldFilter[] | undefined;
  private _templateRow: StructNode | undefined;
  private _layoutChangeWatcher: DataChangeWatcher = new DataChangeWatcher()

  //#endregion

  /**
   * Construct a scalar schema node.
   * @param parent the parent node of the node.
   * @param config the config of the node.
   */
  constructor(config: ISchemaConfig, data: any, parent: AnySchemaNode | undefined = undefined) {
    super(config, data, parent);
    if (isNull(data) || !Array.isArray(data)) data = [];

    // copy default if provided
    if (!data.length && Array.isArray(this._data) && this._data.length)
      data = [...this._data];

    // init the raw data
    this._data = data;

    // element check
    this._eschema = getCachedSchema(this._schema.array!.element)!;
    if (this._eschema.type === SchemaType.Enum) {
      this._enode = new EnumNode(
        {
          ...config,
          type: this._eschema.name,
          multiple: true,
        } as IEnumConfig,
        data,
        this
      );
      this._enode.subscribe(this.notify);
      this._enode.subscribeState(this.notifyState);
    } else if (!this.schema.array?.single) {
      // page info
      this._fieldInfo = (config as IArrayConfig).fieldInfo
        ? ({ ...(config as IArrayConfig).fieldInfo } as any)
        : undefined;

      // init elements
      for (let i = 0; i < data.length; i++) {
        const eleNode = this.newElement(data[i]);
        if (!eleNode) continue;
        this._elements.push(eleNode);
        this._data[i] = eleNode.rawData;
      }
    }

    // reference check
    let appNode = parent;
    while (appNode && !(appNode instanceof AppNode)) appNode = appNode.parent;
    if (!(appNode && appNode instanceof AppNode && appNode.target)) return;

    const appSchema = getAppCachedSchema(appNode.name);
    const appField = appSchema?.fields.find((f) => f.name === this.name);
    if (appField?.filters?.length && this._eschema.type === SchemaType.Struct) {
      this._appFieldFilter = [];

      appField.filters.forEach((f) => {
        // filter function, use args for filter(skip the first arg which is field type)
        if (f.mode == FieldFilterMode.Filter) {
          const filterFunc = getCachedSchema(f.filter);
          if (
            filterFunc &&
            filterFunc.type === SchemaType.Func &&
            filterFunc.func?.args?.length > 1
          ) {
            const nodes: AnySchemaNode[] = [];
            let allValid = true;
            for (let i = 1; i < filterFunc.func.args.length; i++) {
              const arg = filterFunc.func.args[i];
              const argType = arg.type ? getCachedSchema(arg.type!) : undefined;
              if (!argType) {
                allValid = false;
                break;
              }

              const schemaType = getSchemaNodeType(argType.type);
              const node = new schemaType(
                {
                  type: argType.name,
                  display: arg.display || argType.display || _LS(arg.name),
                  require: false,
                },
                undefined,
                undefined
              );
              nodes.push(node);
            }
            if (allValid && nodes.length) {
              this._appFieldFilter!.push({
                mode: f.mode,
                filter: f.filter,
                nodes: nodes, // use as filter input in the front
              });
            }
          }
        }
        // light fitler, use the data field in the struct
        else {
          const fld = this._eschema.struct?.fields.find(
            (sf) => sf.name?.toLowerCase() === f.filter.toLowerCase()
          );
          if (fld) {
            if (fld.type === NS_SYSTEM_LOCALE_STRING) {
              const schemaType = getSchemaNodeType(SchemaType.Scalar);
              const node = new schemaType(
                {
                  type: NS_SYSTEM_STRING,
                  display: fld.display || _LS(fld.name),
                  require: false,
                },
                undefined,
                undefined
              );
              node.resetChanges();

              this._appFieldFilter!.push({
                mode: f.mode,
                filter: fld.name,
                nodes: [node], // use as filter input in the front with whitelist and etc
              });
            } else {
              const node = this.getTemplateNode(fld.name);
              if (!node) return;

              node.config.require = false;

              this._appFieldFilter!.push({
                mode: f.mode,
                filter: fld.name,
                nodes: [node], // use as filter input in the front with whitelist and etc
              });
            }
          }
        }
      });
    }

    if (
      appNode &&
      this._eschema.type === SchemaType.Struct &&
      this._eschema.struct?.relations?.length &&
      this._eschema.struct.relations.some(
        (r) => r.type === RelationType.Reference
      )
    ) {
      this._reffields = {};
      for (let i = 0; i < this._eschema.struct.relations.length; i++) {
        const rel = this._eschema.struct.relations[i];
        if (rel.type !== RelationType.Reference) continue;
        this._reffields[rel.field] = resolveAppReference(
          this._eschema.name,
          rel
        ) as any;
      }
    }
  }
}

/**
 * Resolve the app reference field
 * @param name The struct array type
 * @param field The ref field
 * @param refFunc The reference func used to resolve
 */
function resolveAppReference(name: string, relation: IStructFieldRelation) {
  if (relation?.type !== RelationType.Reference) return undefined;

  // check schema
  let schema = getCachedSchema(name);
  if (schema?.type === SchemaType.Array && schema.array?.element)
    schema = getCachedSchema(schema.array.element);
  if (schema?.type !== SchemaType.Struct) return undefined;

  // check field
  const field = relation.field.toLowerCase();
  const f = schema.struct?.fields?.find((f) => f.name.toLowerCase() === field);
  if (!(f && f.displayOnly)) return undefined;

  // check func
  const funcSchema = getCachedSchema(relation.func);
  if (
    funcSchema?.type !== SchemaType.Func ||
    funcSchema.func?.return !== f.type ||
    !funcSchema.func?.args?.length
  )
    return undefined;

  // analyze app & field
  let app: string | undefined = undefined;
  let appField: string | undefined = undefined;

  for (let exp of funcSchema.func.exps) {
    // get app and app field
    if (exp.func === "system.data.getdatasource") {
      app = exp.args[0]?.value;
      appField = exp.args[1]?.value;
      break;
    }
  }

  if (app && appField) {
    return {
      app: app,
      field: appField,
      func: relation.func,
      args: relation.args,
    };
  }

  return undefined;
}

/**
 * The array field filter
 */
export interface IArrayFieldFilter {
  /**
   * The filter mode
   */
  mode: FieldFilterModeValue;

  /**
   * The filter key
   */
  filter: string;

  /**
   * The filter nodes
   */
  nodes?: AnySchemaNode[];

  /**
   * The node change handlers
   */
  handlers?: Function[];
}
