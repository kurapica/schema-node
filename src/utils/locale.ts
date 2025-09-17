import { DataChangeWatcher } from './dataChangeWatcher'
import enUS from '../locales/enUS'
import zhCN from '../locales/zhCN'
import { isNull } from './toolset'

const locales: {[key:string]: {[key:string]: string}} = {
    'enUS': enUS,
    'zhCN': zhCN,
    'en': enUS,
    'zh': zhCN,
}

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
export function _LS(key: string): ILocaleString
{
    return { key }
}

/**
 * Get the locale message by current language
 */
export const _L = new Proxy(function(key: string) { return currLocale[key] ?? key } as LocaleFunction, {
    get (target, prop) {
        if (typeof(prop) === "string")
        {
            if (prop in currLocale) return currLocale[prop]
            return prop
        }
    },
    apply(target, thisArg, args) {
        const [key] = args

        if (isNull(key)) return ""
        if (typeof(key) === "string")
        {
            if (key in currLocale) return currLocale[key]
            return key
        }
        else if(typeof(key) === "object") 
        {
            const l = key as ILocaleString
            const tran = l.trans?.find(t => currLang.startsWith(t.lang) || t.lang.startsWith(currLang))
            return tran?.tran || currLocale[l.key] || l.key || ""
        }
    }
})
