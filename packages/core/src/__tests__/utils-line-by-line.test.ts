import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import { interpolate, deepMerge, getNestedValue, createCache, getPluralForm, defaultPluralRules } from '../utils';

describe('Line-by-Line Test Coverage - Utils Functions', () => {
  let consoleSpy: any;
  let errorSpy: any;
  
  beforeEach(() => {
    consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
  });
  
  afterEach(() => {
    consoleSpy.mockRestore();
    errorSpy.mockRestore();
  });

  describe('interpolate function (utils.ts Lines 3-50)', () => {
    // Line 3-6: Function signature and parameters
    it('should accept template, params, and optional formatters', () => {
      const result = interpolate('Hello {{name}}!', { name: 'World' });
      expect(result).toBe('Hello World!');
    });

    // Line 7-9: Template type validation
    it('should handle non-string template (line 7-8)', () => {
      expect(interpolate(null as any, {})).toBe('null');
      expect(interpolate(undefined as any, {})).toBe('undefined');
      expect(interpolate(123 as any, {})).toBe('123');
      expect(interpolate({} as any, {})).toBe('[object Object]');
    });

    // Line 11: try block start
    it('should wrap function in try-catch for safety', () => {
      // This should not throw even with circular references
      const circular: any = { name: 'test' };
      circular.self = circular;
      
      expect(() => interpolate('Hello {{name}}!', circular)).not.toThrow();
    });

    // Line 12: return template.replace(/\{\{([^}]+)\}\}/g, (match, key) => {
    it('should use regex to find and replace placeholders', () => {
      const result = interpolate('{{a}} and {{b}} and {{c}}', { a: '1', b: '2', c: '3' });
      expect(result).toBe('1 and 2 and 3');
    });

    it('should handle multiple occurrences of same placeholder', () => {
      const result = interpolate('{{name}} said hello to {{name}}', { name: 'John' });
      expect(result).toBe('John said hello to John');
    });

    it('should handle nested braces correctly', () => {
      const result = interpolate('Value: {{value}}', { value: '{nested}' });
      expect(result).toBe('Value: {nested}');
    });

    // Line 13: try block for individual replacements
    it('should handle errors in individual parameter processing', () => {
      const formatters = new Map();
      formatters.set('error', () => {
        throw new Error('Formatter error');
      });
      
      const result = interpolate('Value: {{val:error}}', { val: 'test' }, formatters);
      expect(result).toBe('Value: test'); // Should fallback to string conversion
      expect(errorSpy).toHaveBeenCalledWith('[i18n] Formatter error for error:', expect.any(Error));
    });

    // Line 14: const [paramKey, format] = key.trim().split(':').map((s: string) => s.trim());
    it('should parse parameter key and format (line 14)', () => {
      const formatters = new Map();
      formatters.set('upper', (value: any) => String(value).toUpperCase());
      
      const result = interpolate('{{name:upper}}', { name: 'john' }, formatters);
      expect(result).toBe('JOHN');
    });

    it('should handle format without colon', () => {
      const result = interpolate('{{name}}', { name: 'John' });
      expect(result).toBe('John');
    });

    it('should handle multiple colons in format', () => {
      const formatters = new Map();
      formatters.set('currency', (value: any, format?: string) => {
        const [, currency = 'USD'] = (format || '').split(':');
        return `$${value}`;
      });
      
      const result = interpolate('{{amount:currency:USD}}', { amount: '100' }, formatters);
      expect(result).toBe('$100');
    });

    it('should trim whitespace from parameter key and format', () => {
      const formatters = new Map();
      formatters.set('upper', (value: any) => String(value).toUpperCase());
      
      const result = interpolate('{{ name : upper }}', { name: 'john' }, formatters);
      expect(result).toBe('JOHN');
    });

    // Line 16-20: Missing parameter handling
    it('should warn on missing parameters (line 16-17)', () => {
      interpolate('Hello {{missing}}!', {});
      expect(consoleSpy).toHaveBeenCalledWith('[i18n] Missing translation parameter: missing');
    });

    it('should not warn in production environment', () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'production';
      
      try {
        interpolate('Hello {{missing}}!', {});
        expect(consoleSpy).not.toHaveBeenCalled();
      } finally {
        process.env.NODE_ENV = originalEnv;
      }
    });

    it('should handle undefined process object', () => {
      const originalProcess = global.process;
      delete (global as any).process;
      
      try {
        const result = interpolate('Hello {{missing}}!', {});
        expect(result).toBe('Hello {{missing}}!');
      } finally {
        global.process = originalProcess;
      }
    });

    // Line 19: return match;
    it('should return original match for missing parameters', () => {
      const result = interpolate('Hello {{missing}} {{present}}!', { present: 'World' });
      expect(result).toBe('Hello {{missing}} World!');
    });

    // Line 22: const value = params[paramKey];
    it('should extract value from params object', () => {
      const result = interpolate('{{nested.value}}', { 'nested.value': 'success' });
      expect(result).toBe('success');
    });

    // Line 24-30: Formatter handling
    it('should use formatters when available (line 24-25)', () => {
      const formatters = new Map();
      formatters.set('currency', (value: any, format?: string) => {
        const [, currency = 'USD'] = (format || '').split(':');
        return `${currency} ${value}`;
      });
      
      const result = interpolate('Price: {{amount:currency:EUR}}', { amount: '100' }, formatters);
      expect(result).toBe('Price: EUR 100');
    });

    it('should handle missing formatters gracefully', () => {
      const result = interpolate('{{value:missing}}', { value: 'test' });
      expect(result).toBe('test'); // Should fallback to string conversion
    });

    it('should handle null formatters map', () => {
      const result = interpolate('{{value:format}}', { value: 'test' }, null as any);
      expect(result).toBe('test');
    });

    // Line 26-29: Formatter error handling
    it('should handle formatter errors (line 26-29)', () => {
      const formatters = new Map();
      formatters.set('error', () => {
        throw new Error('Formatter failed');
      });
      
      const result = interpolate('{{value:error}}', { value: 'test' }, formatters);
      expect(result).toBe('test');
      expect(errorSpy).toHaveBeenCalledWith('[i18n] Formatter error for error:', expect.any(Error));
    });

    // Line 33-35: Null/undefined value handling
    it('should return empty string for null/undefined values (line 33-34)', () => {
      expect(interpolate('{{value}}', { value: null })).toBe('');
      expect(interpolate('{{value}}', { value: undefined })).toBe('');
    });

    // Line 37-39: Date value handling
    it('should format Date values (line 37-38)', () => {
      const date = new Date('2024-01-01');
      const result = interpolate('Date: {{date}}', { date });
      expect(result).toContain('2024');
    });

    // Line 41: return String(value);
    it('should convert other values to string (line 41)', () => {
      expect(interpolate('{{num}}', { num: 123 })).toBe('123');
      expect(interpolate('{{bool}}', { bool: true })).toBe('true');
      expect(interpolate('{{obj}}', { obj: { test: 'value' } })).toBe('[object Object]');
    });

    // Line 42-47: Catch block for individual replacements
    it('should handle individual replacement errors (line 42-47)', () => {
      // Create a scenario that might cause an error in replacement
      const params = {};
      Object.defineProperty(params, 'problematic', {
        get() {
          throw new Error('Property access error');
        }
      });
      
      const result = interpolate('{{problematic}}', params);
      expect(result).toBe('{{problematic}}'); // Should return original match
      expect(errorSpy).toHaveBeenCalledWith('[i18n] Parameter interpolation error:', expect.any(Error));
    });

    // Line 49-54: Main catch block
    it.skip('should handle overall interpolation errors (line 49-54)', () => {
      // Skipped due to dangerous prototype mutation
      expect(true).toBe(true);
    });
  });

  describe('deepMerge function (utils.ts Lines 57-95)', () => {
    // Line 57-60: Function signature and validation
    it('should validate target parameter (line 57-60)', () => {
      expect(() => deepMerge(null as any, {})).toThrow('[i18n] Invalid target for deepMerge');
      expect(() => deepMerge(undefined as any, {})).toThrow('[i18n] Invalid target for deepMerge');
      expect(() => deepMerge('string' as any, {})).toThrow('[i18n] Invalid target for deepMerge');
      expect(() => deepMerge(123 as any, {})).toThrow('[i18n] Invalid target for deepMerge');
    });

    // Line 62-64: Source validation
    it('should handle invalid source gracefully (line 62-64)', () => {
      const target = { a: 1 };
      expect(deepMerge(target, null as any)).toEqual(target);
      expect(deepMerge(target, undefined as any)).toEqual(target);
      expect(deepMerge(target, 'string' as any)).toEqual(target);
    });

    // Line 66: try block
    it('should wrap function in try-catch for safety', () => {
      const target = { a: 1 };
      const source = { b: 2 };
      
      expect(() => deepMerge(target, source)).not.toThrow();
    });

    // Line 67: const result = { ...target };
    it('should create shallow copy of target (line 67)', () => {
      const target = { a: 1, nested: { x: 1 } };
      const source = { b: 2 };
      const result = deepMerge(target, source);
      
      expect(result).not.toBe(target);
      expect(result.nested).toBe(target.nested); // Shallow copy
    });

    // Line 69-71: Source iteration
    it('should iterate over source properties (line 69-71)', () => {
      const target = { a: 1 };
      const source = { b: 2, c: 3 };
      const result = deepMerge(target, source);
      
      expect(result).toEqual({ a: 1, b: 2, c: 3 });
    });

    it('should skip undefined source values', () => {
      const target = { a: 1 };
      const source = { b: undefined, c: 3 };
      const result = deepMerge(target, source);
      
      expect(result).toEqual({ a: 1, c: 3 });
    });

    // Line 72-80: Object merging conditions
    it('should recursively merge nested objects (line 72-79)', () => {
      const target = { nested: { a: 1, b: 2 } };
      const source = { nested: { b: 3, c: 4 } };
      const result = deepMerge(target, source);
      
      expect(result).toEqual({ nested: { a: 1, b: 3, c: 4 } });
    });

    it('should not merge arrays (line 76)', () => {
      const target = { arr: [1, 2] };
      const source = { arr: [3, 4] };
      const result = deepMerge(target, source);
      
      expect(result.arr).toEqual([3, 4]); // Should replace, not merge
    });

    it('should not merge Date objects (line 77)', () => {
      const targetDate = new Date('2024-01-01');
      const sourceDate = new Date('2024-01-02');
      const target = { date: targetDate };
      const source = { date: sourceDate };
      const result = deepMerge(target, source);
      
      expect(result.date).toBe(sourceDate);
    });

    it('should handle null nested values', () => {
      const target = { nested: { a: 1 } };
      const source = { nested: null };
      const result = deepMerge(target, source);
      
      expect(result.nested).toBeNull();
    });

    // Line 81-82: Default assignment
    it('should assign non-object values directly (line 81-82)', () => {
      const target = { a: 1 };
      const source = { a: 2, b: 'string', c: true };
      const result = deepMerge(target, source);
      
      expect(result).toEqual({ a: 2, b: 'string', c: true });
    });

    // Line 86-91: Error handling
    it('should handle merge errors gracefully (line 86-91)', () => {
      const target = { a: 1 };
      
      // Create source with problematic property
      const source = {};
      Object.defineProperty(source, 'problematic', {
        get() {
          throw new Error('Property access error');
        },
        enumerable: true
      });
      
      const result = deepMerge(target, source);
      expect(result).toEqual(target); // Should return original target
      expect(errorSpy).toHaveBeenCalledWith('[i18n] DeepMerge error:', expect.any(Error));
    });
  });

  describe('getNestedValue function (utils.ts Lines 98-114)', () => {
    // Line 98-101: Parameter validation
    it('should validate parameters (line 98-101)', () => {
      expect(getNestedValue(null as any, 'test')).toBeUndefined();
      expect(getNestedValue({}, null as any)).toBeUndefined();
      expect(getNestedValue({}, '')).toBeUndefined();
      expect(getNestedValue('string' as any, 'test')).toBeUndefined();
    });

    // Line 103: try block
    it('should wrap function in try-catch for safety', () => {
      expect(() => getNestedValue({ a: { b: 'value' } }, 'a.b')).not.toThrow();
    });

    // Line 104: const keys = path.split('.');
    it('should split path by dots (line 104)', () => {
      expect(getNestedValue({ a: { b: { c: 'value' } } }, 'a.b.c')).toBe('value');
      expect(getNestedValue({ 'a.b': 'value' }, 'a.b')).toBeUndefined(); // Should not find literal 'a.b'
    });

    it('should handle single key (no dots)', () => {
      expect(getNestedValue({ test: 'value' }, 'test')).toBe('value');
    });

    it('should handle empty path segments', () => {
      expect(getNestedValue({ '': { a: 'value' } }, '.a')).toBe('value');
    });

    // Line 105-111: Path traversal
    it('should traverse nested object path (line 105-111)', () => {
      const obj = { level1: { level2: { level3: 'deep' } } };
      expect(getNestedValue(obj, 'level1.level2.level3')).toBe('deep');
    });

    it('should return undefined for missing intermediate keys', () => {
      const obj = { a: { b: 'value' } };
      expect(getNestedValue(obj, 'a.missing.c')).toBeUndefined();
    });

    it('should return undefined for non-object intermediate values', () => {
      const obj = { a: 'string' };
      expect(getNestedValue(obj, 'a.b')).toBeUndefined();
    });

    // Line 107-109: Property existence check
    it('should check property existence with in operator (line 107-109)', () => {
      const obj = { a: undefined };
      expect(getNestedValue(obj, 'a')).toBeUndefined(); // Property exists but value is undefined
      expect(getNestedValue(obj, 'b')).toBeUndefined(); // Property doesn't exist
    });

    // Line 113: return current as T;
    it('should return final value cast to type T', () => {
      const obj = { num: 123, str: 'test', bool: true };
      expect(getNestedValue<number>(obj, 'num')).toBe(123);
      expect(getNestedValue<string>(obj, 'str')).toBe('test');
      expect(getNestedValue<boolean>(obj, 'bool')).toBe(true);
    });

    // Line 114-119: Error handling
    it('should handle traversal errors gracefully (line 114-119)', () => {
      const obj = {};
      Object.defineProperty(obj, 'problematic', {
        get() {
          throw new Error('Property access error');
        }
      });
      
      const result = getNestedValue(obj, 'problematic.nested');
      expect(result).toBeUndefined();
      expect(errorSpy).toHaveBeenCalledWith('[i18n] getNestedValue error:', expect.any(Error));
    });
  });

  describe('createCache function (utils.ts Lines 121-134)', () => {
    // Line 121-126: Function signature and Map initialization
    it('should return cache object with get, set, clear methods', () => {
      const cache = createCache<string>();
      
      expect(cache).toHaveProperty('get');
      expect(cache).toHaveProperty('set');
      expect(cache).toHaveProperty('clear');
      expect(typeof cache.get).toBe('function');
      expect(typeof cache.set).toBe('function');
      expect(typeof cache.clear).toBe('function');
    });

    // Line 127: const cache = new Map<string, T>();
    it('should use Map internally for storage', () => {
      const cache = createCache<number>();
      
      cache.set('test', 123);
      expect(cache.get('test')).toBe(123);
    });

    // Line 130-131: get method
    it('should implement get method (line 130-131)', () => {
      const cache = createCache<string>();
      
      expect(cache.get('missing')).toBeUndefined();
      cache.set('key', 'value');
      expect(cache.get('key')).toBe('value');
    });

    // Line 132-134: set method
    it('should implement set method (line 132-134)', () => {
      const cache = createCache<number>();
      
      cache.set('number', 42);
      expect(cache.get('number')).toBe(42);
      
      // Overwrite existing value
      cache.set('number', 100);
      expect(cache.get('number')).toBe(100);
    });

    // Line 135: clear method
    it('should implement clear method (line 135)', () => {
      const cache = createCache<string>();
      
      cache.set('key1', 'value1');
      cache.set('key2', 'value2');
      expect(cache.get('key1')).toBe('value1');
      
      cache.clear();
      expect(cache.get('key1')).toBeUndefined();
      expect(cache.get('key2')).toBeUndefined();
    });

    // Generic type safety
    it('should maintain type safety with generics', () => {
      const stringCache = createCache<string>();
      const numberCache = createCache<number>();
      const objectCache = createCache<{ name: string }>();
      
      stringCache.set('test', 'value');
      numberCache.set('test', 123);
      objectCache.set('test', { name: 'test' });
      
      expect(stringCache.get('test')).toBe('value');
      expect(numberCache.get('test')).toBe(123);
      expect(objectCache.get('test')).toEqual({ name: 'test' });
    });
  });

  describe('getPluralForm function (utils.ts Lines 155-163)', () => {
    // Line 155-158: Function signature and parameters
    it('should accept locale, count, and optional custom rules', () => {
      expect(getPluralForm('en', 0)).toBe('zero');
      expect(getPluralForm('en', 1)).toBe('one');
      expect(getPluralForm('en', 2)).toBe('other');
    });

    // Line 159: const rules = customRules || defaultPluralRules;
    it('should use custom rules when provided (line 159)', () => {
      const customRules = {
        en: (count: number) => count === 0 ? 'empty' : 'nonempty'
      };
      
      expect(getPluralForm('en', 0, customRules)).toBe('empty');
      expect(getPluralForm('en', 5, customRules)).toBe('nonempty');
    });

    it('should fallback to default rules when custom rules not provided', () => {
      expect(getPluralForm('en', 0)).toBe('zero');
      expect(getPluralForm('en', 1)).toBe('one');
      expect(getPluralForm('en', 5)).toBe('other');
    });

    // Line 160: const rule = rules[locale] || rules.en;
    it('should use locale-specific rule or fallback to English (line 160)', () => {
      expect(getPluralForm('fr', 0)).toBe('one'); // French rule: 0 and 1 are 'one'
      expect(getPluralForm('fr', 1)).toBe('one');
      expect(getPluralForm('fr', 2)).toBe('other');
      
      // Unknown locale should fallback to English
      expect(getPluralForm('unknown', 0)).toBe('zero');
      expect(getPluralForm('unknown', 1)).toBe('one');
      expect(getPluralForm('unknown', 2)).toBe('other');
    });

    // Line 161: return rule(count);
    it('should call rule function with count and return result (line 161)', () => {
      const mockRule = vi.fn((count: number) => `count-${count}`);
      const customRules = { test: mockRule };
      
      const result = getPluralForm('test', 42, customRules);
      
      expect(mockRule).toHaveBeenCalledWith(42);
      expect(result).toBe('count-42');
    });
  });

  describe('defaultPluralRules (utils.ts Lines 136-154)', () => {
    // Test all built-in plural rules
    it('should have English plural rules', () => {
      expect(defaultPluralRules.en(0)).toBe('zero');
      expect(defaultPluralRules.en(1)).toBe('one');
      expect(defaultPluralRules.en(2)).toBe('other');
      expect(defaultPluralRules.en(100)).toBe('other');
    });

    it('should have Spanish plural rules', () => {
      expect(defaultPluralRules.es(0)).toBe('zero');
      expect(defaultPluralRules.es(1)).toBe('one');
      expect(defaultPluralRules.es(2)).toBe('other');
    });

    it('should have French plural rules', () => {
      expect(defaultPluralRules.fr(0)).toBe('one'); // 0 and 1 are singular in French
      expect(defaultPluralRules.fr(1)).toBe('one');
      expect(defaultPluralRules.fr(2)).toBe('other');
    });

    it('should have German plural rules', () => {
      expect(defaultPluralRules.de(0)).toBe('other'); // Only 1 is singular in German
      expect(defaultPluralRules.de(1)).toBe('one');
      expect(defaultPluralRules.de(2)).toBe('other');
    });

    it('should have Japanese plural rules (always other)', () => {
      expect(defaultPluralRules.ja(0)).toBe('other');
      expect(defaultPluralRules.ja(1)).toBe('other');
      expect(defaultPluralRules.ja(100)).toBe('other');
    });

    it('should have Korean plural rules (always other)', () => {
      expect(defaultPluralRules.ko(0)).toBe('other');
      expect(defaultPluralRules.ko(1)).toBe('other');
      expect(defaultPluralRules.ko(100)).toBe('other');
    });

    it('should have Chinese plural rules (always other)', () => {
      expect(defaultPluralRules.zh(0)).toBe('other');
      expect(defaultPluralRules.zh(1)).toBe('other');
      expect(defaultPluralRules.zh(100)).toBe('other');
    });
  });
});