// =============================================================================
// Schema provider protocol
// =============================================================================
import axios from "axios";
import { generateGuid, getLanguage, isNull, setSchemaKindServerProperties } from "schema-node-core";
import { getAppSchemaProvider } from "./appSchemaProvider";
import { getSchemaApiBaseUrl } from "./baseUrl";

import type { ISchemaApiProtocolMeta } from "./interface";

let schemaApiHeaders = [] as { key: string; value: string }[];
let schemaApiHeaderSetter: Function | null = null;
let apiProtocol: ISchemaApiProtocolMeta | undefined = undefined;

/** Set the schema api request headers */
export function setSchemaApiHeaders(
  headers: { key: string; value: string }[] | Function,
) {
  if (typeof headers === "function") {
    schemaApiHeaderSetter = headers;
    schemaApiHeaders = [];
    return;
  }
  schemaApiHeaders = headers;
}

axios.interceptors.request.use(async (config) => {
  // add frontend auth headers
  if (schemaApiHeaderSetter) {
    const result = schemaApiHeaderSetter(config);
    if (result instanceof Promise) await result;
  } else if (schemaApiHeaders.length) {
    for (const header of schemaApiHeaders) {
      if (header.key && header.value) {
        config.headers[header.key] = header.value;
      }
    }
  }
  return config;
});

function scanErrorPaths(fields?: Record<string, any>): string[] {
  if (fields) {
    for (let field in fields) {
      const fieldFmt = fields[field];
      if (typeof fieldFmt === "string" && fieldFmt.indexOf("[error]") >= 0) {
        return [field];
      } else if (typeof fieldFmt === "object") {
        const subPaths = scanErrorPaths(fieldFmt);
        if (subPaths.length) {
          return [field, ...subPaths];
        }
      }
    }
  }
  return [];
}

function generateField(url: string, fmt: any): any | undefined {
  if (typeof fmt !== "string") return undefined;
  fmt = fmt.trim().toLowerCase();
  const match = fmt.match(/^(\w+)\[?(\w*)\]?:?(.*)?$/);
  if (!match) return undefined;
  if (match.length >= 2) {
    if (match[1] == "string") {
      if (match[2] == "uuid") {
        return generateGuid();
      } else if (match[2] == "timestamp") {
        return new Date().toISOString();
      } else if (match[2] == "date") {
        return new Date().toISOString().split("T")[0];
      } else if (match[2] == "url") {
        return url.startsWith("/") ? url.substring(1) : url;
      }
      return match[3] || "";
    } else if (match[1] == "integer") {
      return !isNull(match[3]) ? match[3] : Math.floor(Math.random() * 10000);
    }
  }
  return undefined;
}

/** Sets the schema api protocol */
export function setSchemaApiProtocol(protocol: ISchemaApiProtocolMeta): boolean {
  if (
    protocol &&
    typeof protocol === "object" &&
    protocol.name &&
    typeof protocol.name === "string" &&
    (!protocol.request || typeof protocol.request === "object") &&
    (!protocol.response || typeof protocol.response === "object")
  ) {
    apiProtocol = {
      name: protocol.name,
      request: protocol.request,
      response: protocol.response,
      schemaFormat: protocol.schemaFormat,
      kindProperties: protocol.kindProperties,
      error: scanErrorPaths(protocol.response?.fields),
    };
    setSchemaKindServerProperties(protocol.kindProperties || {});
    return true;
  }
  return false;
}

// Read protocol meta if defined
if (document.querySelector('meta[name="schema-api-protocol"]')) {
  try {
    let content =
      document
        .querySelector('meta[name="schema-api-protocol"]')
        ?.getAttribute("content") || "";
    if (content) setSchemaApiProtocol(JSON.parse(content));
  } catch (ex) {
    console.warn("Invalid schema-api-protocol meta tag content.");
  }
}

/**
 * Gets the app schema format for downloading
 * @returns The app schema format for downloading
 */
export function getSchemaProtocolFormats(): string[] {
  return apiProtocol?.schemaFormat || [];
}

/**
 * Posts query to the schema api, the default implements
 * @param url the request url
 * @param param the request params
 * @param noProtocol whether to ignore protocol processing
 * @returns the result
 */
export async function postSchemaApi(
  url: string,
  param: any,
  noProtocol: boolean = false,
  blob: boolean = false,
  file: File | undefined = undefined
): Promise<any> {
  try {
    let site: string = getSchemaApiBaseUrl() || "";
    if (!site) return null;

    if (site.endsWith("/")) site = site.substring(0, site.length - 1);
    if (url.startsWith("/")) url = url.substring(1);

    // locale
    const locale = getLanguage()
    if (locale) {
      if (typeof param === "object" && param !== null && !param["locale"]) {
        param["locale"] = locale;
      }
    }

    // Read protocol meta if not yet defined
    if (!noProtocol) {
      if (!apiProtocol) {
        try {
          const provider = getAppSchemaProvider();
          if (provider) {
            const response = await provider.protocol();
            if (response) setSchemaApiProtocol(response);
          }

          // use default if not provided
          if (!apiProtocol) setSchemaApiProtocol({ name: "Default" });
        } catch (ex) {
          console.warn("Invalid schema-api-protocol meta tag content.");
          setSchemaApiProtocol({ name: "Default" });
        }
      }

      // build request according to protocol
      if (apiProtocol?.request && apiProtocol.request.wrap) {
        let requestParam: any = { [apiProtocol.request.wrap]: param };
        for (let field in apiProtocol.request.fields || {}) {
          const fieldFmt = apiProtocol.request.fields![field];
          requestParam[field] = generateField(url, fieldFmt);
        }
        param = requestParam;
      }
    }

    let headers: any = {};
    if (file) {
      const formData = new FormData();

      Object.entries(param).forEach(([key, value]) => {
        if (value == null) return;

        if (typeof value === "object") {
          formData.append(key, JSON.stringify(value));
        } else {
          formData.append(key, String(value));
        }
      });

      // file
      formData.append("file", file);

      param = formData;
    }
    else
    {
      headers["Content-Type"] = "application/json";
    }

    const response: any = await axios.post(`${site}/${url}`, param, {
      headers,
      responseType: blob ? 'blob' : 'json',
    });

    headers = response?.headers
    const contentType = headers["content-type"] || ""
    const disposition = headers["content-disposition"] || "";
    if(disposition && disposition.includes("attachment"))
    {
        let filename = "unknown.obj";

        // RFC 5987: filename*=UTF-8''xxx
        const utf8Match = disposition.match(/filename\*\=UTF-8''(.+)/i);
        if (utf8Match?.[1]) {
          filename = decodeURIComponent(utf8Match[1]);
        } else {
          // filename="xxx.xlsx"
          const normalMatch = disposition.match(/filename="?([^"]+)"?/i);
          if (normalMatch?.[1]) {
            filename = normalMatch[1];
          }
        }
        
        const url = window.URL.createObjectURL(new Blob([response.data], { type: contentType }));
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', filename); //or any other extension
        document.body.appendChild(link);
        link.click();

        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
        return;
    }

    let data = response?.data;
    // unwrap response according to protocol
    if (!noProtocol && apiProtocol?.response && apiProtocol.response.unwrap) {
      // check error protocol
      if (apiProtocol.error && apiProtocol.error.length) {
        let errorCheck = data;
        for (let i = 0; i < apiProtocol.error.length; i++) {
          if (errorCheck && typeof errorCheck === "object") {
            errorCheck = errorCheck[apiProtocol.error[i]];
          }
        }
        if (errorCheck)
          // 0 or "" means no error
          throw new Error(errorCheck);
      }

      data = data[apiProtocol.response.unwrap];
    }
    return data;
  } catch (ex) {
    console.error(ex);
    throw ex;
  }
}