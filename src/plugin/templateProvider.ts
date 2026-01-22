import { IStructFieldConfig } from "../schema/structSchema";
import { isSchemaPluginEnabled, postSchemaApi } from "../utils/schemaProvider";

export interface ITemplateProvider {
    /**
     * Download a template based on the provided request
     */
    downloadTemplate(request: ITemplateRequest): Promise<void>;

    /**
     * Upload a template based on the provided request
     */
    uploadData(request: ITemplateRequest, file: File): Promise<ITemplateUploadResponse>;
}

let templateProvider: ITemplateProvider | null = null;

export const defaultTemplateProvider: ITemplateProvider = {
    downloadTemplate: async (request: ITemplateRequest, file?: string): Promise<void> => {
        if (isSchemaPluginEnabled("EXCEL_TEMPLATE"))
            await postSchemaApi("/excel-template", request, false, true); 
    },

    uploadData: async (request: ITemplateRequest, file: File): Promise<ITemplateUploadResponse | undefined> => {
        if (isSchemaPluginEnabled("EXCEL_TEMPLATE")) 
            return await postSchemaApi("/excel-template", request, false, false, file); 
    }
}

export function useTemplateProvider(provider: ITemplateProvider): void {
    templateProvider = provider;
}

export function getTemplateProvider(): ITemplateProvider | null {
    return templateProvider ?? defaultTemplateProvider;
}

/**
 * The request structure for template operations
 */
export interface ITemplateRequest {
    /**
     * The application identifier
     */
    app: string;

    /**
     * The application field
     */
    field: string;

    /**
     * The app target if upload the data
     */
    target?: string;

    /**
     * The field entries to be used in the template
     */
    entries?: {[key: string]: any};

    /**
     * Dynamic types for json fields
     */
    dynamicTypes?: {[key:string]: IStructFieldConfig[] };

    /**
     * The number of inputs to be created in the template
     */
    inputCount?: number;

    /**
     * Whether to save the uploaded data
     */
    save?: boolean;

    /**
     * Whether to omit helper fields in the template
     */
    noHelper?: boolean;
}

/**
 * The response structure for template upload operations
 */
export interface ITemplateUploadResponse {
    /**
     * The uploaded data entries
     */
    uploads?: any[];

    /**
     * The result of the upload operation
     */
    result?: boolean;

    /**
     * The error information if the upload failed
     */
    error?: any;
}