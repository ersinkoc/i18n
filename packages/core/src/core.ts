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
  if (!config.locale || typeof config.locale !== 'string' || config.locale.trim() === '') {
    throw new Error('[i18n] Locale must be a non-empty string');
  }
  if (!config.messages) {
    throw new Error('[i18n] Messages are required');
  }
  if (typeof config.messages !== 'object' || Array.isArray(config.messages) || config.messages === null) {
    throw new Error('[i18n] Messages must be an object');
  }
  // Warn if messages is empty but allow it for graceful degradation
  const hasMessages = Object.keys(config.messages).length > 0;
  if (!hasMessages) {
    if (typeof process !== 'undefined' && process.env?.NODE_ENV !== 'production') {
      console.warn('[i18n] Messages object is empty - all translations will return keys');
    }
  }
  // Validate that the current locale exists in messages, unless a fallback is provided or messages is empty
  if (hasMessages && !(config.locale in config.messages) && !config.fallbackLocale) {
    const availableLocales = Object.keys(config.messages).join(', ');
    throw new Error(`[i18n] Locale '${config.locale}' not found in messages and no fallback locale provided. Available locales: ${availableLocales}`);
  }
  // Warn if current locale doesn't exist but fallback does
  if (!(config.locale in config.messages) && config.fallbackLocale) {
    if (typeof process !== 'undefined' && process.env?.NODE_ENV !== 'production') {
      const availableLocales = Object.keys(config.messages).join(', ');
      console.warn(`[i18n] Locale '${config.locale}' not found in messages, will use fallback locale '${config.fallbackLocale}'. Available locales: ${availableLocales}`);
    }
  }
  // Validate fallback locale if provided
  if (config.fallbackLocale && !(config.fallbackLocale in config.messages)) {
    const availableLocales = Object.keys(config.messages).join(', ');
    if (typeof process !== 'undefined' && process.env?.NODE_ENV !== 'production') {
      console.warn(`[i18n] Fallback locale '${config.fallbackLocale}' not found in messages. Available locales: ${availableLocales}`);
    }
  }

  let currentLocale = config.locale;
  const fallbackLocale = config.fallbackLocale;
  // Deep copy messages to prevent mutations to the original config
  const messages = structuredClone(config.messages);
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
      if (typeof process !== 'undefined' && process.env?.NODE_ENV !== 'production') {
        console.error(`[i18n] Currency formatter error for currency '${currency}':`, error);
      }
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
      // Generate cache key with deterministic param serialization
      // Sort keys to ensure consistent caching regardless of property order
      let paramKey = '';
      if (params && Object.keys(params).length > 0) {
        try {
          const sortedKeys = Object.keys(params).sort();
          const sortedParams: Record<string, unknown> = {};
          for (const k of sortedKeys) {
            sortedParams[k] = params[k];
          }
          paramKey = JSON.stringify(sortedParams);
        } catch (stringifyError) {
          // Handle circular references or other JSON.stringify errors
          // Use a simpler key based on param keys only
          if (typeof process !== 'undefined' && process.env?.NODE_ENV !== 'production') {
            console.warn('[i18n] Failed to serialize params for caching, using fallback key');
          }
          paramKey = Object.keys(params).sort().join(',');
        }
      }

      const cacheKey = `${locale}:${key}:${paramKey}`;
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

    // Warn if locale doesn't exist in messages
    if (!messages[locale]) {
      if (typeof process !== 'undefined' && process.env?.NODE_ENV !== 'production') {
        console.warn(
          `[i18n] Locale '${locale}' not found in messages. Available locales: ${Object.keys(messages).join(', ')}`
        );
      }
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
    const formatter = formatters.get('number');
    if (!formatter) {
      throw new Error('[i18n] Number formatter not available. Please add a plugin that provides number formatting.');
    }
    return formatter(value, format, currentLocale);
  }

  function formatDate(value: Date, format?: string): string {
    const formatter = formatters.get('date');
    if (!formatter) {
      throw new Error('[i18n] Date formatter not available. Please add a plugin that provides date formatting.');
    }
    return formatter(value, format, currentLocale);
  }
  
  function formatRelativeTime(value: Date, baseDate: Date = new Date()): string {
    // Validate that value is a valid Date
    if (!(value instanceof Date) || isNaN(value.getTime())) {
      throw new Error('[i18n] Invalid date provided to formatRelativeTime');
    }
    // Validate that baseDate is a valid Date
    if (!(baseDate instanceof Date) || isNaN(baseDate.getTime())) {
      throw new Error('[i18n] Invalid base date provided to formatRelativeTime');
    }

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