const locales: any = {
    'en': import('../locales/en'),
    'zh': import('../locales/zh'),
}

let currentLanguage = navigator.languages.find(l => locales[l]) || 'en'
let currentLocale = locales[currentLanguage] || locales['en']
const missingLocales = new Set()
const shareLocaleStrings: { [key:string]: LocaleString } = {}

const addMissingLocale = (key: string) => {
    currentLocale[key] = key
    missingLocales.add(key)
    return key
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
        return currentLocale[this.key] || addMissingLocale(this.key)
    }
}

/**
 * Try set the language with order
 */
export function setLanguage(...languages: string[]) 
{
    currentLanguage = languages.find(l => locales[l]) || 'en'
    currentLocale = locales[currentLanguage]
    missingLocales.clear()
}

/**
 * Get the locale message by current language
 */
export function _L(key: string)
{
    return currentLocale[key] || addMissingLocale(key)
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

/**
 * Dump the missing locales
 */
export function dumpMissing()
{
    console.log(missingLocales)
}