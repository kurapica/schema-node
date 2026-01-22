import { type ISchemaConfig } from "../config/schemaConfig";
import { SchemaType } from "../enum/schemaType";
import { StructRule } from "../rule/structRule";
import { type AnySchemaNode, regSchemaNode, SchemaNode } from "./schemaNode";

/**
 * The json schema data node
 */
@regSchemaNode(SchemaType.Json)
export class JsonNode extends SchemaNode<ISchemaConfig, StructRule> {
  //#region Implementation

  get schemaType(): SchemaType {
    return SchemaType.Json;
  }

  async validate(): Promise<void> {
    // json node always valid
    this._valid = true;
    this._error = undefined;
  }

  //#endregion

  /**
   * Construct a json schema node.
   * @param parent the parent node of the node.
   * @param config the config of the node.
   */
  constructor(
    config: ISchemaConfig,
    data: any,
    parent: AnySchemaNode | undefined = undefined
  ) {
    super(config, data, parent);
  }
}
