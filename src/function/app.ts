import { _LS, ArgName, ArrayType, combinePaths, DecimalType, Display, EntryRoot, getNodeType, getPropertyValue, IntType, Meta, OfSchema, Return, SchemaType, setPropertyValue, StructType, ValueType } from "schema-node-core";
import { getAppType } from "../runtime";
import { ScopePolicy } from "../schema/app/property";
import { Foreigns } from "../schema/appField/property";
import { AppScopeType, DataCombineType } from "../enum";

import type { Entry, EntryAccess, LocaleString } from "schema-node-core";
import type { AppScopePolicy } from "../schema/app/property";
import type { Foreign } from "../schema/appField/property";

import { NS_SYSTEM_BOOL, NS_SYSTEM_ENTRY_ACCESS, NS_SYSTEM_IDENTIFIER, NS_SYSTEM_LIST, NS_SYSTEM_SCHEMA_NODE_VALUE_TYPE, NS_SYSTEM_STRING, SCHEMA_KIND_BOOL, SCHEMA_KIND_DATE, SCHEMA_KIND_DECIMAL, SCHEMA_KIND_ENUM, SCHEMA_KIND_FUNCTION, SCHEMA_KIND_INT } from "schema-node-core";
import { NS_SYSTEM_SCHEMA_APP, NS_SYSTEM_SCHEMA_APP_FIELD, NS_SYSTEM_SCHEMA_REFLECT_APP } from "../utils";

@Meta(SchemaType, NS_SYSTEM_SCHEMA_REFLECT_APP)
@Meta(OfSchema, SCHEMA_KIND_FUNCTION)
export class SystemReflectApp
{
  /** Gets the sub entries of the struct fields */
  @Meta(Return, `${NS_SYSTEM_LIST}<${NS_SYSTEM_ENTRY_ACCESS}<${NS_SYSTEM_STRING}>>`)
  static async getaccessentries(
    @Meta(ArgName, 'container')
    @Meta(SchemaType, `${NS_SYSTEM_SCHEMA_APP}.type`)
    container: string = '',

    @Meta(ArgName, 'name')
    @Meta(SchemaType, NS_SYSTEM_IDENTIFIER)
    name: string = '',

    @Meta(ArgName, 'path')
    @Meta(SchemaType, NS_SYSTEM_STRING)
    path?: string,

    @Meta(ArgName, 'root')
    @Meta(SchemaType, NS_SYSTEM_STRING)
    @Meta(EntryRoot, true)
    root?: string
  ): Promise<EntryAccess<string>[]> {
    if (!container || !name) return [];
    path = path?.toLowerCase() ?? '';
    root = root?.toLowerCase() ?? '';
    if (path && root && path !== root && !path.startsWith(`${root}.`)) return [];
    if (!root) root = path;

    // first
    const app = container ? `${container}.${name}` : name;
    const appType = await getAppType(app);
    if (!appType) return [];
    const first: Entry<string>[] = [];
    for(let f of appType.getFields())
    {
      if (!f.name || !f.type) continue;
      const ftype = await getNodeType(f.type) as ValueType;
      if (!ftype) continue;
      const entry: Entry<string> = { value: f.name, hasChildren: ftype.hasAccessEntries };
      setPropertyValue(entry, Display, getPropertyValue(f, Display) ?? ftype.getProperty(Display)?.getValue() ?? _LS(f.name));
      first.push(entry);
    }

    const result: EntryAccess<string>[] = [ { children: first} ];
    let curr = result[0].children?.find(c => c.value.toLowerCase() === root || root.startsWith(`${c.value.toLowerCase()}.`));
    let valueType = curr ? await getNodeType(appType.getFields().find(f => f.name === curr?.value)?.type) as ValueType : undefined;
    while (valueType)
    {
      const accessEntry: EntryAccess<string> = {};
      const accesses = valueType.getAccessEntries();
      if (curr)
      {
        accessEntry.entry = setPropertyValue(
          { value: curr.value, hasChildren: accesses.length > 0 },
          Display,
          getPropertyValue(curr, Display)
        );
      }
      accessEntry.children = accesses;

      // check next part
      let next: ValueType | undefined;
      for (const a of accesses)
      {
        const n = a.value;
        if (curr) a.value = combinePaths(curr.value, n);
        if (path && (path === a.value || path.startsWith(a.value + '.')))
        {
          next = valueType.getAccessValueType(n);
          curr = a;
        }
      }
      result.push(accessEntry);
      valueType = next;
    }

    // cut
    return root ? result.filter(e => (e.entry?.value?.length ?? 0) < root.length) : result;
  }

  /** Gets the value type of the struct field */
  @Meta(Return, NS_SYSTEM_STRING)
  static async getaccessvaluetype(
    @Meta(ArgName, 'container')
    @Meta(SchemaType, `${NS_SYSTEM_SCHEMA_APP}.type`)
    container: string = '',

    @Meta(ArgName, 'name')
    @Meta(SchemaType, NS_SYSTEM_IDENTIFIER)
    name: string = '',

    @Meta(ArgName, 'path')
    @Meta(SchemaType, NS_SYSTEM_STRING)
    path: string
  ): Promise<string | undefined> {
    const dotIndex = path.indexOf('.');
    const fieldName = dotIndex === -1 ? path : path.substring(0, dotIndex);
    const app = container ? `${container}.${name}` : name;
    const appType = await getAppType(app);
    const field = appType?.getField(fieldName);
    if (!field || !field.type) return undefined;
    const valueType = await getNodeType(field.type) as ValueType;
    return dotIndex === -1 ? valueType?.name : valueType?.getAccessValueType(path.substring(dotIndex + 1))?.name;
  }

  /// <summary>
  /// Gets the application entries
  /// </summary>
  @Meta(Return, `${NS_SYSTEM_LIST}<${NS_SYSTEM_ENTRY_ACCESS}<${NS_SYSTEM_STRING}>>`)
  static async getappentries(
    @Meta(ArgName, "name")
    @Meta(SchemaType, `${NS_SYSTEM_SCHEMA_APP}.type`)
    name?: string, 
    @Meta(EntryRoot, true) 
    @Meta(SchemaType, `${NS_SYSTEM_SCHEMA_APP}.type`)
    root?: string): Promise<EntryAccess<string>[]>
  {
    name = name?.toLowerCase() ?? '';
    root = root?.toLowerCase() ?? '';
    if (!name && !root || name !== root && !name.startsWith(`${root}.`))
      return [];

    let ns = await getAppType(name ?? root);
    if (!ns) return [];

    let result: EntryAccess<string>[] = [];
    while (ns != null)
    {
      let access: EntryAccess<string> = {};
      if (ns.container != null)
      {
        access.entry = setPropertyValue(
          { value: ns.name, hasChildren: ns.hasSubApps },
          Display,
          ns.getProperty(Display)?.getValue<LocaleString>()
        );
      }
      if (ns.hasSubApps)
      {
        access.children = Array.from(ns.getSubAppSchemas().map(s => {
          return setPropertyValue(
            { value: combinePaths(ns!.name, s.name), hasChildren: s.hasApps ?? !(s.hasFields || s.fields?.length) },
            Display,
            getPropertyValue(s, Display)
          );
        }));
      }
      result.push(access);
      ns = ns.container;
      if (root && ns?.name === root) break;
    }
    result.reverse();
    return result;
  }

  /// <summary>
  /// Gets the application fields
  /// </summary>
  @Meta(Return, `${NS_SYSTEM_LIST}<${NS_SYSTEM_ENTRY_ACCESS}<${NS_SYSTEM_STRING}>>`)
  static async getappfields(
    @Meta(ArgName, "app")
    @Meta(SchemaType, `${NS_SYSTEM_SCHEMA_APP}.type`)
    app: string)
  {
    let appType = await getAppType(app);
    if (!appType) return [];
    return [{ 
      children: appType.getFields().map(s => {
        const entry: Entry<string> = { value: s.name, hasChildren: false };
        let display = s.getPropertyValue(Display);
        if (display != null) setPropertyValue(entry, Display, display);
        return entry;
      })
    }];
  }

  /// <summary>
  /// Gets the application foreign field entries to the given application
  /// </summary>
  @Meta(Return, `${NS_SYSTEM_LIST}<${NS_SYSTEM_ENTRY_ACCESS}<${NS_SYSTEM_STRING}>>`)
  static async getappforeignfields(
    @Meta(ArgName, "app")
    @Meta(SchemaType, `${NS_SYSTEM_SCHEMA_APP}.type`)
    app: string,
  
    @Meta(ArgName, "foreignApp")
    @Meta(SchemaType, `${NS_SYSTEM_SCHEMA_APP}.type`)
    foreignApp: string,
  ) {
    let appType = await getAppType(app);
    if (!appType) return [];
    return [{ 
      children: appType.getFields().filter(s => {
        const foreigns = s.getPropertyValue<Foreign[]>(Foreigns);
        return foreigns?.some(f => f.app.toLowerCase() === foreignApp.toLowerCase());
      })
      .map(s => {
        const entry: Entry<string> = { value: s.name, hasChildren: false };
        let display = s.getPropertyValue(Display);
        if (display != null) setPropertyValue(entry, Display, display);
        return entry;
      })
    }];
  }

  /// <summary>
  /// Checks if the application has any fields
  /// </summary>
  @Meta(Return, NS_SYSTEM_BOOL)
  static async hasfields(
    @Meta(ArgName, "app")
    @Meta(SchemaType, `${NS_SYSTEM_SCHEMA_APP}.type`)
    app: string)
  {
    let appType = await getAppType(app);
    return appType?.hasAccessEntries ?? false;
  }

  /// <summary>
  /// Gets the app field type
  /// </summary>
  @Meta(Return, NS_SYSTEM_STRING)
  static async getappfieldtype(
    @Meta(ArgName, "app")
    @Meta(SchemaType, `${NS_SYSTEM_SCHEMA_APP}.type`)
    app: string,

    @Meta(ArgName, "field")
    @Meta(SchemaType, NS_SYSTEM_IDENTIFIER)
    field: string,

    @Meta(ArgName, "elementType")
    @Meta(SchemaType, NS_SYSTEM_BOOL)
    elementType?: boolean
  ): Promise<string | undefined>
  {
    let appType = await getAppType(app);
    let fieldType = appType?.getField(field);
    if (fieldType == null) return undefined;
    return elementType && fieldType.valueType instanceof ArrayType
      ? fieldType.valueType.element?.name
      : fieldType.valueType?.name;
  }

  /** Gets the combinable fields */
  @Meta(Return, `${NS_SYSTEM_LIST}<${NS_SYSTEM_ENTRY_ACCESS}<${NS_SYSTEM_STRING}>>`)
  static async getcombinefields(
    @Meta(ArgName, 'type')
    @Meta(SchemaType, NS_SYSTEM_SCHEMA_NODE_VALUE_TYPE)
    type: string,
  ): Promise<EntryAccess<string>[]> {
    let valueType = type ? await getNodeType(type) as ValueType : undefined;
    const primary = (valueType instanceof ArrayType) ? valueType.primary : [];
    if (valueType instanceof ArrayType) valueType = valueType.element;
    if (valueType instanceof StructType) return [ 
      { children: Array.from(valueType.getFields()
        .filter(f => !primary.some(p => p.toLowerCase() === f.name.toLowerCase() && 
            [SCHEMA_KIND_ENUM, SCHEMA_KIND_BOOL, SCHEMA_KIND_INT, SCHEMA_KIND_DECIMAL, SCHEMA_KIND_DATE]
            .includes(f.type.kind)))
        .map(s => {
          const entry: Entry<string> = { value: s.name, hasChildren: false };
          let display = s.getPropertyValue(Display);
          if (display != null) setPropertyValue(entry, Display, display);
          return entry;
        }
      ))}];
    return [];
  }

  /** Gets the combinable types */
  @Meta(Return, `${NS_SYSTEM_LIST}<${NS_SYSTEM_SCHEMA_APP_FIELD}.combinetype>`)
  static async getcombinetype(
    @Meta(ArgName, 'type')
    @Meta(SchemaType, NS_SYSTEM_SCHEMA_NODE_VALUE_TYPE)
    type: string,
  ): Promise<DataCombineType[]> {
    let valueType = await getNodeType(type) as ValueType;
    if (valueType instanceof ArrayType) valueType = valueType.element;
    if (valueType instanceof StructType) return [];
    if (valueType instanceof IntType) return [
      DataCombineType.Newest,
      DataCombineType.Oldest,
      DataCombineType.Sum,
      DataCombineType.Count,
    ];
    if (valueType instanceof DecimalType) return [
      DataCombineType.Newest,
      DataCombineType.Oldest,
      DataCombineType.Sum,
    ];
    return [DataCombineType.Newest, DataCombineType.Oldest];
  }

  /// <summary>
  /// Checks if the application has a scope policy
  /// </summary>
  @Meta(Return, NS_SYSTEM_BOOL)
  static async isscopepolicy(
    @Meta(ArgName, "app")
    @Meta(SchemaType, `${NS_SYSTEM_SCHEMA_APP}.type`)
    app: string,

    @Meta(ArgName, "policy")
    @Meta(SchemaType, `${NS_SYSTEM_SCHEMA_APP}.scope`)
    policy: AppScopeType
  ): Promise<boolean> {
    let appType = await getAppType(app);
    return appType?.getProperty(ScopePolicy)?.getValue<AppScopePolicy>()?.type === policy;
  }
}