import { describe, expect, it, vi } from 'vitest';
import { createI18n } from '../core';
import type { Messages } from '../types';

interface TestMessages extends Messages {
  'simple': 'Simple text';
  'param': 'Hello {{name}}!';
  'nested.key': 'Nested value';
  'empty': '';
  'null.value': 'Value: {{value}}';
}

describe('Edge Cases & Production Safety', () => {
  describe('Missing translations', () => {
    it('should return key when translation is missing', () => {
      const i18n = createI18n<TestMessages>({
        locale: 'en',
        messages: {
          en: {},
        },
      });

      expect(i18n.t('simple')).toBe('simple');
    });

    it('should warn on missing translations in development', () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'development';
      
      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

      const i18n = createI18n({
        locale: 'en',
        messages: { en: {} },
        warnOnMissingTranslations: true,
      });

      i18n.t('missing');

      expect(consoleSpy).toHaveBeenCalledWith('[i18n] Missing translation: missing for locale: en');
      
      consoleSpy.mockRestore();
      process.env.NODE_ENV = originalEnv;
    });

    it('should not warn in production', () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'production';
      
      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

      const i18n = createI18n({
        locale: 'en',
        messages: { en: {} },
        warnOnMissingTranslations: true,
      });

      i18n.t('missing');

      expect(consoleSpy).not.toHaveBeenCalled();
      
      consoleSpy.mockRestore();
      process.env.NODE_ENV = originalEnv;
    });
  });

  describe('Parameter handling', () => {
    it('should handle missing parameters gracefully', () => {
      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

      const i18n = createI18n<TestMessages>({
        locale: 'en',
        messages: {
          en: {
            param: 'Hello {{name}}!',
          },
        },
      });

      const result = i18n.t('param' as any);
      expect(result).toBe('Hello {{name}}!');
      
      consoleSpy.mockRestore();
    });

    it('should handle null and undefined parameters', () => {
      const i18n = createI18n<TestMessages>({
        locale: 'en',
        messages: {
          en: {
            'null.value': 'Value: {{value}}',
          },
        },
      });

      expect(i18n.t('null.value', { value: null } as any)).toBe('Value: ');
      expect(i18n.t('null.value', { value: undefined } as any)).toBe('Value: ');
    });

    it('should handle complex objects as parameters', () => {
      const i18n = createI18n({
        locale: 'en',
        messages: {
          en: {
            object: 'Object: {{obj}}',
          },
        },
      });

      const obj = { test: 'value' };
      expect(i18n.t('object', { obj })).toBe('Object: [object Object]');
    });

    it('should handle arrays as parameters', () => {
      const i18n = createI18n({
        locale: 'en',
        messages: {
          en: {
            array: 'Array: {{arr}}',
          },
        },
      });

      const arr = [1, 2, 3];
      expect(i18n.t('array', { arr })).toBe('Array: 1,2,3');
    });
  });

  describe('Locale handling', () => {
    it('should handle non-existent locale gracefully', () => {
      const i18n = createI18n({
        locale: 'unknown',
        fallbackLocale: 'en',
        messages: {
          en: {
            test: 'English text',
          },
        },
      });

      expect(i18n.t('test')).toBe('English text');
    });

    it('should handle empty messages object', () => {
      const i18n = createI18n({
        locale: 'en',
        messages: {},
      });

      expect(i18n.t('anything')).toBe('anything');
    });

    it('should handle circular fallback gracefully', () => {
      const i18n = createI18n({
        locale: 'en',
        fallbackLocale: 'en',
        messages: {
          en: {},
        },
      });

      expect(i18n.t('test')).toBe('test');
    });
  });

  describe('Formatting edge cases', () => {
    it('should handle invalid date objects', () => {
      const i18n = createI18n({
        locale: 'en',
        messages: {
          en: {
            date: 'Date: {{date}}',
          },
        },
      });

      const invalidDate = new Date('invalid');
      expect(i18n.t('date', { date: invalidDate })).toContain('Invalid Date');
    });

    it('should handle very large numbers', () => {
      const i18n = createI18n({
        locale: 'en',
        messages: { en: {} },
      });

      const largeNumber = Number.MAX_SAFE_INTEGER;
      expect(i18n.formatNumber(largeNumber)).toBe('9,007,199,254,740,991');
    });

    it('should handle negative numbers', () => {
      const i18n = createI18n({
        locale: 'en',
        messages: { en: {} },
      });

      expect(i18n.formatNumber(-1234.56)).toBe('-1,234.56');
    });

    it('should handle infinity and NaN', () => {
      const i18n = createI18n({
        locale: 'en',
        messages: { en: {} },
      });

      expect(i18n.formatNumber(Infinity)).toBe('∞');
      expect(i18n.formatNumber(NaN)).toBe('NaN');
    });
  });

  describe('Memory and performance', () => {
    it('should handle very long translation keys', () => {
      const longKey = 'a'.repeat(1000);
      const i18n = createI18n({
        locale: 'en',
        messages: {
          en: {
            [longKey]: 'Long key value',
          },
        },
      });

      expect(i18n.t(longKey)).toBe('Long key value');
    });

    it('should handle many parameters', () => {
      const i18n = createI18n({
        locale: 'en',
        messages: {
          en: {
            many: '{{p1}} {{p2}} {{p3}} {{p4}} {{p5}} {{p6}} {{p7}} {{p8}} {{p9}} {{p10}}',
          },
        },
      });

      const params = {
        p1: '1', p2: '2', p3: '3', p4: '4', p5: '5',
        p6: '6', p7: '7', p8: '8', p9: '9', p10: '10',
      };

      expect(i18n.t('many', params)).toBe('1 2 3 4 5 6 7 8 9 10');
    });

    it('should handle rapid locale changes', () => {
      const i18n = createI18n({
        locale: 'en',
        messages: {
          en: { test: 'English' },
          es: { test: 'Spanish' },
          fr: { test: 'French' },
        },
      });

      // Rapid locale switching
      for (let i = 0; i < 100; i++) {
        i18n.setLocale('es');
        expect(i18n.t('test')).toBe('Spanish');
        i18n.setLocale('fr');
        expect(i18n.t('test')).toBe('French');
        i18n.setLocale('en');
        expect(i18n.t('test')).toBe('English');
      }
    });
  });

  describe('Concurrent access', () => {
    it('should handle multiple simultaneous translations', async () => {
      const i18n = createI18n({
        locale: 'en',
        messages: {
          en: {
            test: 'Hello {{name}}!',
          },
        },
      });

      const promises = Array.from({ length: 100 }, (_, i) =>
        Promise.resolve(i18n.t('test', { name: `User${i}` }))
      );

      const results = await Promise.all(promises);
      
      results.forEach((result, i) => {
        expect(result).toBe(`Hello User${i}!`);
      });
    });

    it('should handle concurrent locale changes', async () => {
      const i18n = createI18n({
        locale: 'en',
        messages: {
          en: { test: 'English' },
          es: { test: 'Spanish' },
        },
      });

      const promises = Array.from({ length: 50 }, (_, i) =>
        Promise.resolve().then(() => {
          if (i % 2 === 0) {
            i18n.setLocale('en');
            return i18n.t('test');
          } else {
            i18n.setLocale('es');
            return i18n.t('test');
          }
        })
      );

      const results = await Promise.all(promises);
      
      // All results should be either 'English' or 'Spanish'
      results.forEach(result => {
        expect(['English', 'Spanish']).toContain(result);
      });
    });
  });
});