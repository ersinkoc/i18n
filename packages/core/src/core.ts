import type {
  I18nConfig,
  I18nInstance,
  I18nPlugin,
  LocaleCode,
  Messages,
  TranslationFunction,
  TranslationParams,
  TranslationValue,
} from './types';
import {
  createCache,
  deepMerge,
  getNestedValue,
  getPluralForm,
  interpolate,
} from './utils';

export function createI18n<TMessages extends Messages = Messages>(
  config: I18nConfig<TMessages>
): I18nInstance<TMessages> {
  // Validate config
  if (!config) {
    throw new Error('[i18n] Configuration is required');
  }
  if (!config.locale) {
    throw new Error('[i18n] Locale is required');
  }
  if (!config.messages) {
    throw new Error('[i18n] Messages are required');
  }

  let currentLocale = config.locale;
  const fallbackLocale = config.fallbackLocale;
  const messages = { ...config.messages };
  const plugins = [...(config.plugins || [])];
  const listeners = new Set<(locale: LocaleCode) => void>();
  const translationCache = createCache<string>();
  
  const formatters = new Map<string, (value: TranslationValue, format?: string, locale?: string) => string>();
  
  // Built-in formatters
  formatters.set('number', (value, format, locale) => {
    if (typeof value !== 'number') return String(value);
    const options = config.formats?.number?.[format || 'default'] || {};
    return new Intl.NumberFormat(locale || currentLocale, options).format(value);
  });
  
  formatters.set('date', (value, format, locale) => {
    if (!(value instanceof Date)) return String(value);
    const options = config.formats?.date?.[format || 'default'] || {};
    return new Intl.DateTimeFormat(locale || currentLocale, options).format(value);
  });
  
  formatters.set('currency', (value, format, locale) => {
    if (typeof value !== 'number') return String(value);
    const parts = (format || 'currency:USD').split(':');
    const currency = parts.length > 1 ? parts[1] || 'USD' : 'USD';
    try {
      return new Intl.NumberFormat(locale || currentLocale, {
        style: 'currency',
        currency,
      }).format(value);
    } catch (error) {
      return `${currency} ${value}`;
    }
  });
  
  // Register plugin formatters
  plugins.forEach(plugin => {
    if (plugin.format) {
      formatters.set(plugin.name, (value, format, locale) => 
        plugin.format!(value, format ?? '', locale ?? currentLocale)
      );
    }
  });
  
  function getMessage(key: string, locale: LocaleCode): string | undefined {
    const localeMessages = messages[locale];
    if (!localeMessages) return undefined;
    
    // First try direct key access (for flat keys like 'user.role.admin')
    if (key in localeMessages) {
      return localeMessages[key] as string;
    }
    
    // Then try nested access (for nested objects like user.role.admin)
    return getNestedValue<string>(localeMessages, key);
  }
  
  function translate(
    key: string,
    params?: TranslationParams,
    locale: LocaleCode = currentLocale
  ): string {
    try {
      const cacheKey = `${locale}:${key}:${JSON.stringify(params || {})}`;
      const cached = translationCache.get(cacheKey);
      if (cached) return cached;
      
      let message = getMessage(key, locale);
      
      // Try fallback locale
      if (!message && fallbackLocale && locale !== fallbackLocale) {
        message = getMessage(key, fallbackLocale);
      }
      
      // Handle pluralization before checking if message exists
      if (params && 'count' in params && typeof params.count === 'number') {
        const pluralForm = getPluralForm(locale, params.count, config.pluralizationRules);
        const pluralKey = `${key}.${pluralForm}`;
        const pluralMessage = getMessage(pluralKey, locale);
        
        // Try fallback locale for plural
        if (!pluralMessage && fallbackLocale && locale !== fallbackLocale) {
          const fallbackPluralMessage = getMessage(pluralKey, fallbackLocale);
          if (fallbackPluralMessage) {
            message = fallbackPluralMessage;
          }
        } else if (pluralMessage) {
          message = pluralMessage;
        }
      }

      if (!message) {
        if (config.warnOnMissingTranslations && typeof process !== 'undefined' && process.env?.NODE_ENV !== 'production') {
          console.warn(`[i18n] Missing translation: ${key} for locale: ${locale}`);
        }
        return key;
      }
    
      // Apply plugins
      let result = message;
      for (const plugin of plugins) {
        if (plugin.transform) {
          try {
            result = plugin.transform(key as keyof TMessages, result, params || {}, locale);
          } catch (error) {
            if (typeof process !== 'undefined' && process.env?.NODE_ENV !== 'production') {
              console.error(`[i18n] Plugin ${plugin.name} transform error:`, error);
            }
          }
        }
      }
      
      // Always interpolate to handle empty parameters 
      result = interpolate(result, params || {}, formatters, currentLocale);
      
      translationCache.set(cacheKey, result);
      return result;
    } catch (error) {
      if (typeof process !== 'undefined' && process.env?.NODE_ENV !== 'production') {
        console.error(`[i18n] Translation error for key ${key}:`, error);
      }
      return key;
    }
  }
  
  const t: TranslationFunction<TMessages> = (key, ...args) => {
    const params = args[0] as TranslationParams | undefined;
    return translate(String(key), params);
  };
  
  function setLocale(locale: LocaleCode): void {
    if (!locale || typeof locale !== 'string') {
      throw new Error('[i18n] Invalid locale provided');
    }
    
    if (locale !== currentLocale) {
      currentLocale = locale;
      translationCache.clear();
      listeners.forEach(listener => {
        try {
          listener(locale);
        } catch (error) {
          if (typeof process !== 'undefined' && process.env?.NODE_ENV !== 'production') {
            console.error('[i18n] Locale change listener error:', error);
          }
        }
      });
    }
  }
  
  function addMessages(locale: LocaleCode, newMessages: Partial<TMessages>): void {
    if (!locale || typeof locale !== 'string') {
      throw new Error('[i18n] Invalid locale provided');
    }
    
    if (!newMessages || typeof newMessages !== 'object') {
      throw new Error('[i18n] Invalid messages provided');
    }
    
    try {
      if (!messages[locale]) {
        messages[locale] = {} as TMessages;
      }
      
      // Apply beforeLoad plugins
      let processedMessages = newMessages;
      for (const plugin of plugins) {
        if (plugin.beforeLoad) {
          try {
            processedMessages = plugin.beforeLoad(locale, processedMessages as TMessages) as Partial<TMessages>;
          } catch (error) {
            if (typeof process !== 'undefined' && process.env?.NODE_ENV !== 'production') {
              console.error(`[i18n] Plugin ${plugin.name} beforeLoad error:`, error);
            }
          }
        }
      }
      
      messages[locale] = deepMerge(messages[locale], processedMessages);
      
      // Apply afterLoad plugins
      for (const plugin of plugins) {
        if (plugin.afterLoad) {
          try {
            plugin.afterLoad(locale, messages[locale]);
          } catch (error) {
            if (typeof process !== 'undefined' && process.env?.NODE_ENV !== 'production') {
              console.error(`[i18n] Plugin ${plugin.name} afterLoad error:`, error);
            }
          }
        }
      }
      
      translationCache.clear();
    } catch (error) {
      if (typeof process !== 'undefined' && process.env?.NODE_ENV !== 'production') {
        console.error('[i18n] Error adding messages:', error);
      }
      throw error;
    }
  }
  
  function hasTranslation(key: keyof TMessages, locale?: LocaleCode): boolean {
    const checkLocale = locale || currentLocale;
    const message = getMessage(String(key), checkLocale);
    return message !== undefined;
  }
  
  function addPlugin(plugin: I18nPlugin<TMessages>): void {
    plugins.push(plugin);
    if (plugin.format) {
      formatters.set(plugin.name, (value, format, locale) => 
        plugin.format!(value, format ?? '', locale ?? currentLocale)
      );
    }
    translationCache.clear();
  }
  
  function removePlugin(pluginName: string): void {
    const index = plugins.findIndex(p => p.name === pluginName);
    if (index !== -1) {
      plugins.splice(index, 1);
      formatters.delete(pluginName);
      translationCache.clear();
    }
  }
  
  function subscribe(listener: (locale: LocaleCode) => void): () => void {
    listeners.add(listener);
    return () => listeners.delete(listener);
  }
  
  function formatNumber(value: number, format?: string): string {
    const formatter = formatters.get('number')!;
    return formatter(value, format, currentLocale);
  }
  
  function formatDate(value: Date, format?: string): string {
    const formatter = formatters.get('date')!;
    return formatter(value, format, currentLocale);
  }
  
  function formatRelativeTime(value: Date, baseDate: Date = new Date()): string {
    const diffInSeconds = Math.floor((value.getTime() - baseDate.getTime()) / 1000);
    const rtf = new Intl.RelativeTimeFormat(currentLocale, { numeric: 'auto' });
    
    const units: Array<[Intl.RelativeTimeFormatUnit, number]> = [
      ['year', 60 * 60 * 24 * 365],
      ['month', 60 * 60 * 24 * 30],
      ['week', 60 * 60 * 24 * 7],
      ['day', 60 * 60 * 24],
      ['hour', 60 * 60],
      ['minute', 60],
      ['second', 1],
    ];
    
    for (const [unit, secondsInUnit] of units) {
      if (Math.abs(diffInSeconds) >= secondsInUnit) {
        return rtf.format(Math.round(diffInSeconds / secondsInUnit), unit);
      }
    }
    
    return rtf.format(0, 'second');
  }
  
  return {
    get locale() {
      return currentLocale;
    },
    get fallbackLocale() {
      return fallbackLocale;
    },
    get messages() {
      return messages;
    },
    t,
    setLocale,
    getLocale: () => currentLocale,
    hasTranslation,
    addMessages,
    addPlugin,
    removePlugin,
    subscribe,
    formatNumber,
    formatDate,
    formatRelativeTime,
  };
}