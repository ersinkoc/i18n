import type { TranslationParams, TranslationValue } from './types';

export function interpolate(
  template: string,
  params: TranslationParams,
  formatters?: Map<string, (value: TranslationValue, format?: string, locale?: string) => string>,
  locale?: string
): string {
  if (typeof template !== 'string') {
    return String(template);
  }
  
  try {
    return template.replace(/\{\{([^}]+)\}\}/g, (match, key) => {
      try {
        const [paramKey, format] = key.trim().split(':').map((s: string) => s.trim());
        
        if (!(paramKey in params)) {
          if (typeof process !== 'undefined' && process.env?.NODE_ENV !== 'production') {
            console.warn(`[i18n] Missing translation parameter: ${paramKey}`);
          }
          return match; // Return original placeholder for missing parameters
        }
        
        const value = params[paramKey];
        
        if (format && formatters?.has(format)) {
          try {
            const formatter = formatters.get(format);
            if (!formatter) {
              return String(value);
            }
            const formatted = formatter(value, key.includes(':') ? key.split(':').slice(1).join(':') : undefined, locale);
            // Validate formatter returns a string
            if (typeof formatted !== 'string') {
              if (typeof process !== 'undefined' && process.env?.NODE_ENV !== 'production') {
                console.error(`[i18n] Formatter '${format}' must return a string, got ${typeof formatted}`);
              }
              return String(value);
            }
            return formatted;
          } catch (error) {
            if (typeof process !== 'undefined' && process.env?.NODE_ENV !== 'production') {
              console.error(`[i18n] Formatter error for ${format}:`, error);
            }
            return String(value);
          }
        }
        
        if (value === null || value === undefined) {
          return '';
        }
        
        if (value instanceof Date) {
          // Use the provided locale parameter for locale-aware formatting
          return value.toLocaleDateString(locale || 'en-US', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit'
          });
        }
        
        return String(value);
      } catch (error) {
        if (typeof process !== 'undefined' && process.env?.NODE_ENV !== 'production') {
          console.error('[i18n] Parameter interpolation error:', error);
        }
        return match;
      }
    });
  } catch (error) {
    if (typeof process !== 'undefined' && process.env?.NODE_ENV !== 'production') {
      console.error('[i18n] Template interpolation error:', error);
    }
    return template;
  }
}

export function deepMerge<T extends Record<string, any>>(
  target: T,
  source: Partial<T>
): T {
  if (!target || typeof target !== 'object') {
    throw new Error('[i18n] Invalid target for deepMerge');
  }

  if (!source || typeof source !== 'object') {
    return target;
  }

  try {
    const result = { ...target };

    for (const key in source) {
      // SECURITY: Protect against prototype pollution
      // Block dangerous keys that could modify Object.prototype
      if (
        key === '__proto__' ||
        key === 'constructor' ||
        key === 'prototype'
      ) {
        if (typeof process !== 'undefined' && process.env?.NODE_ENV !== 'production') {
          console.warn(`[i18n] Blocked attempt to set dangerous property: ${key}`);
        }
        continue;
      }

      // Only process own properties (not inherited ones)
      if (!Object.prototype.hasOwnProperty.call(source, key)) {
        continue;
      }

      if (source[key] !== undefined) {
        const value = source[key];
        if (
          typeof value === 'object' &&
          value !== null &&
          !Array.isArray(value) &&
          !((value as object) instanceof Date)
        ) {
          result[key] = deepMerge(
            result[key] || ({} as any),
            value as any
          ) as any;
        } else {
          result[key] = value as any;
        }
      }
    }

    return result;
  } catch (error) {
    if (typeof process !== 'undefined' && process.env?.NODE_ENV !== 'production') {
      console.error('[i18n] DeepMerge error:', error);
    }
    return target;
  }
}

export function getNestedValue<T>(
  obj: Record<string, any>,
  path: string
): T | undefined {
  if (!obj || typeof obj !== 'object' || !path || typeof path !== 'string') {
    return undefined;
  }
  
  try {
    const keys = path.split('.');
    let current = obj;
    
    for (const key of keys) {
      if (current && typeof current === 'object' && key in current) {
        current = current[key];
      } else {
        return undefined;
      }
    }
    
    return current as T;
  } catch (error) {
    if (typeof process !== 'undefined' && process.env?.NODE_ENV !== 'production') {
      console.error('[i18n] getNestedValue error:', error);
    }
    return undefined;
  }
}

export interface CacheOptions {
  maxSize?: number;
}

export function createCache<T>(options?: CacheOptions): {
  get: (key: string) => T | undefined;
  set: (key: string, value: T) => void;
  clear: () => void;
  size: () => number;
} {
  const cache = new Map<string, T>();
  const maxSize = options?.maxSize ?? 1000; // Default to 1000 entries

  return {
    get: (key: string) => {
      const value = cache.get(key);
      if (value !== undefined) {
        // LRU: Move to end by deleting and re-adding
        cache.delete(key);
        cache.set(key, value);
      }
      return value;
    },
    set: (key: string, value: T) => {
      // If key exists, delete it first (will re-add at end)
      if (cache.has(key)) {
        cache.delete(key);
      } else if (cache.size >= maxSize) {
        // Remove oldest entry (first entry in Map)
        const firstKey = cache.keys().next().value;
        if (firstKey !== undefined) {
          cache.delete(firstKey);
        }
      }
      cache.set(key, value);
    },
    clear: () => cache.clear(),
    size: () => cache.size,
  };
}

export const defaultPluralRules: Record<string, (count: number) => string> = {
  en: (count: number) => {
    if (count === 0) return 'zero';
    if (count === 1) return 'one';
    return 'other';
  },
  es: (count: number) => {
    if (count === 0) return 'zero';
    if (count === 1) return 'one';
    return 'other';
  },
  fr: (count: number) => {
    if (count === 0 || count === 1) return 'one';
    return 'other';
  },
  de: (count: number) => {
    if (count === 1) return 'one';
    return 'other';
  },
  ja: () => 'other',
  ko: () => 'other',
  zh: () => 'other',
};

export function getPluralForm(
  locale: string,
  count: number,
  customRules?: Record<string, (count: number) => string>
): string {
  const rules = customRules || defaultPluralRules;
  const rule = rules[locale] || rules.en;
  return rule(count);
}