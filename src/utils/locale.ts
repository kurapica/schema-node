import { DataChangeWatcher } from './dataChangeWatcher'
import enUS from '../locales/enUS'
import zhCN from '../locales/zhCN'

const locales: {[key:string]: {[key:string]: string}} = {
    'enUS': enUS,
    'zhCN': zhCN,
    'en': enUS,
    'zh': zhCN,
}

// gather all infos
const items = {}
gatherItems(enUS)
gatherItems(zhCN)
fillItems()

// language
const langWatches = new DataChangeWatcher()
const shareLocaleStrings: { [key:string]: LocaleString } = {}
let currLang = navigator.languages.map(l => l.replace("-", "")).find(l => locales[l]) || 'en'
let currLocale = locales[currLang] || locales['en']

function gatherItems(l: any) {
    for(let k in l)
    {
        if (k !== "language")
            items[k] = k
    }
}

function fillItems() {
    const temp: Set<any> = new Set()
    for(let k in locales)
    {
        const locale = locales[k]
        if (temp.has(locale)) return
        temp.add(locale)

        for(let j in items){
            locale[j] = locale[j] || j
        }
    }
}

/**
 * The locale string entity
 */
export class LocaleString {
    private key: string

    constructor(key: string)
    {
        this.key = key
    }

    public toString = (): string => {
        return currLocale[this.key] || this.key
    }
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
    gatherItems(locale)
    fillItems()
}

/**
 * Get the locale message by current language
 */
export function _L(key: string)
{
    return currLocale[key] || key
}

/**
 * Gets a dynamic locale string entity
 */
export function _LS(key: string)
{
    if (shareLocaleStrings[key]) return shareLocaleStrings[key]
    const localeStr = new LocaleString(key)
    shareLocaleStrings[key] = localeStr
    return localeStr
}