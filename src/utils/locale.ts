import { DataChangeWatcher } from './dataChangeWatcher'
import enUS from '../locales/enUS'
import zhCN from '../locales/zhCN'
import { isNull } from './toolset'
import { getAppCachedSchema, getCachedSchema } from './schemaProvider'
import { SchemaType } from '../enum/schemaType'

const locales: {[key:string]: {[key:string]: string}} = {
    'enUS': enUS,
    'zhCN': zhCN,
    'en': enUS,
    'zh': zhCN,
}

export const SCHEMA_LANGUAGES =  [
    { value: "afZA", label: "Afrikaans" },
    { value: "arSA", label: "العربية" },
    { value: "azAZ", label: "Azərbaycanca" },
    { value: "beBY", label: "Беларуская" },
    { value: "bgBG", label: "Български" },
    { value: "bnBD", label: "বাংলা" },
    { value: "caES", label: "Català" },
    { value: "csCZ", label: "Čeština" },
    { value: "daDK", label: "Dansk" },
    { value: "deDE", label: "Deutsch" },
    { value: "elGR", label: "Ελληνικά" },
    { value: "enUS", label: "English (US)" },
    { value: "enGB", label: "English (UK)" },
    { value: "esES", label: "Español (España)" },
    { value: "esMX", label: "Español (México)" },
    { value: "etEE", label: "Eesti" },
    { value: "euES", label: "Euskara" },
    { value: "faIR", label: "فارسی" },
    { value: "fiFI", label: "Suomi" },
    { value: "frFR", label: "Français" },
    { value: "glES", label: "Galego" },
    { value: "guIN", label: "ગુજરાતી" },
    { value: "heIL", label: "עברית" },
    { value: "hiIN", label: "हिन्दी" },
    { value: "hrHR", label: "Hrvatski" },
    { value: "huHU", label: "Magyar" },
    { value: "hyAM", label: "Հայերեն" },
    { value: "idID", label: "Bahasa Indonesia" },
    { value: "isIS", label: "Íslenska" },
    { value: "itIT", label: "Italiano" },
    { value: "jaJP", label: "日本語" },
    { value: "kaGE", label: "ქართული" },
    { value: "kkKZ", label: "Қазақша" },
    { value: "kmKH", label: "ភាសាខ្មែរ" },
    { value: "knIN", label: "ಕನ್ನಡ" },
    { value: "koKR", label: "한국어" },
    { value: "loLA", label: "ລາວ" },
    { value: "ltLT", label: "Lietuvių" },
    { value: "lvLV", label: "Latviešu" },
    { value: "mkMK", label: "Македонски" },
    { value: "mlIN", label: "മലയാളം" },
    { value: "mnMN", label: "Монгол" },
    { value: "mrIN", label: "मराठी" },
    { value: "msMY", label: "Bahasa Melayu" },
    { value: "myMM", label: "မြန်မာစာ" },
    { value: "neNP", label: "नेपाली" },
    { value: "nlNL", label: "Nederlands" },
    { value: "noNO", label: "Norsk" },
    { value: "paIN", label: "ਪੰਜਾਬੀ" },
    { value: "plPL", label: "Polski" },
    { value: "ptPT", label: "Português (Portugal)" },
    { value: "ptBR", label: "Português (Brasil)" },
    { value: "roRO", label: "Română" },
    { value: "ruRU", label: "Русский" },
    { value: "siLK", label: "සිංහල" },
    { value: "skSK", label: "Slovenčina" },
    { value: "slSI", label: "Slovenščina" },
    { value: "sqAL", label: "Shqip" },
    { value: "srRS", label: "Српски" },
    { value: "svSE", label: "Svenska" },
    { value: "swKE", label: "Kiswahili" },
    { value: "taIN", label: "தமிழ்" },
    { value: "teIN", label: "తెలుగు" },
    { value: "thTH", label: "ไทย" },
    { value: "trTR", label: "Türkçe" },
    { value: "ukUA", label: "Українська" },
    { value: "urPK", label: "اردو" },
    { value: "uzUZ", label: "Oʻzbekcha" },
    { value: "viVN", label: "Tiếng Việt" },
    { value: "zhCN", label: "简体中文" },
    { value: "zhHK", label: "繁體中文（香港）" },
    { value: "zhMO", label: "繁體中文（澳門）" },
    { value: "zhTW", label: "繁體中文" },
    { value: "zuZA", label: "isiZulu" }
]

// language
const langWatches = new DataChangeWatcher()
let currLang = navigator.languages.map(l => l.replace("-", "")).find(l => locales[l]) || 'en'
let currLocale = locales[currLang] || locales['en']

/**
 * The locale translate
 */
interface ILocaleTran {
    /**
     * The language like zhCN
     */
    lang: string,

    /**
     * The translate
     */
    tran: string,
}

/**
 * A locale string
 */
export interface ILocaleString {
    /**
     * The default value
     */
    key: string,

    /**
     * The transaltes
     */
    trans?: ILocaleTran[]
}

/**
 * Try set the language with order
 */
export function setLanguage(...languages: string[]) 
{
    const newLan = languages.map(l => l.replace('-', '')).find(l => locales[l]) || 'en'
    if (currLang === newLan) return currLang
    currLang = newLan
    currLocale = locales[currLang]
    langWatches.notify(currLang, currLocale)
    return currLang
}

/**
 * Gets current language
 */
export function getLanguage()
{
    return currLang
}

/**
 * Add language change watcher
 */
export function subscribeLanguage(func: Function, immediate?: boolean) : Function
{
    const handler = langWatches.addWatcher(func)
    if (func) func(currLang, currLocale)
    return handler
}

/**
 * import locales for language
 * @param lang language
 * @param items locale items
 */
export function importLanguage(lang: string, items:{ [key:string]: string })
{
    lang = lang.replace('-', '')
    let locale = locales[lang]
    if (!locale)
    {
        locale = { ...items }
        locales[lang] = locale
    }
    else
    {
        for(let k in items)
            locale[k] = items[k]
    }
}

export type LocaleFunction = {
  (key?: string | ILocaleString): string
  [key: string]: string
}

/**
 * Gets a dynamic locale string entity
 */
export function _LS(key: string | ILocaleString): ILocaleString
{
    if (typeof(key) === "object") return key
    return { key }
}

/**
 * Get the locale message by current language
 */
export const _L = new Proxy(function(key: string) { return currLocale[key] ?? key } as LocaleFunction, {
    get (target, prop) {
        return typeof(prop) === "string" && prop in currLocale ? currLocale[prop] : prop
    },
    apply(target, thisArg, args) {
        const [key] = args
        return localeStringToString(key)
    }
})

/**
 * Check if a local string is null or empty
 */
export function isNullLocalString(value: string | ILocaleString | null | undefined) {
    if (isNull(value)) return true
    if (typeof(value) === "string") return isNull(value)
    if (typeof(value) === "object" && value) return isNull(value.key)
    return false
}

export function combineLocaleString(locale: string | ILocaleString | null | undefined, other: any)
{
    return _LS(isNullLocalString(locale) ? other : locale)
}

/**
 * parse the locale string to string, the key may complex like '{list.prefix}{@system.schema.structschema.type}{list.suffix}'
 */
export function localeStringToString(value: ILocaleString | string | null | undefined): string
{
    if (isNull(value)) return ""
    if (typeof(value) === "string") return currLocale[value] !== undefined && currLocale[value] !== null ? currLocale[value] : value

    if (!value?.key) return ""

    if (value.key && value.key.indexOf("{") >= 0)
    {
        let count = 0;
        const result = value.key.replace(/{(.*?)}/g, (match, p1) => {
            count++;

            if (p1.startsWith("@"))
            {
                // schema
                let key = p1.substring(1)
                let field: string = ""
                if (key.indexOf(":") >= 0)
                    [key, field] = key.split(":")

                const schema = getCachedSchema(key)
                if (schema) {
                    if (!isNull(field) && schema.type === SchemaType.Struct && schema.struct?.fields?.length) {
                        const f = schema.struct.fields.find(f => f.name === field)
                        return f?.display?.key ? localeStringToString(f.display) : _L(f?.name || field)
                    }
                    return schema.display?.key ? localeStringToString(schema.display) : _L(schema.name)
                }

                return currLocale[key] !== undefined && currLocale[key] !== null ? currLocale[key] : p1
            }
            else if(p1.startsWith("#"))
            {
                // app schema
                let key = p1.substring(1)
                let field: string = ""
                if (key.indexOf(":") >= 0)
                    [key, field] = key.split(":")

                const schema = getAppCachedSchema(key)
                if (schema) {
                    if (!isNull(field) && schema.fields?.length) {
                        const f = schema.fields.find(f => f.name === field)
                        return f?.display?.key ? localeStringToString(f.display) : _L(f?.name || field)
                    }
                    return schema.display?.key ? localeStringToString(schema.display) : _L(schema.name)
                }

                return currLocale[key] !== undefined && currLocale[key] !== null ? currLocale[key] : p1
            }
            else
            {
                return currLocale[p1] !== undefined && currLocale[p1] !== null ? currLocale[p1] : p1
            }
        })
        if (count > 0) return result
    }
    
    const tran = value.trans?.find(t => currLang.startsWith(t.lang) || t.lang.startsWith(currLang))
    return tran?.tran || (currLocale[value.key] !== undefined && currLocale[value.key] !== null ? currLocale[value.key] : value.key || "")
}