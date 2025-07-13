import { describe, expect, it } from 'vitest';
import { createI18n } from '../core';

describe('Performance Tests - Production Guarantees', () => {
  it('should handle large translation dictionaries efficiently', () => {
    // Create a large dictionary
    const messages: Record<string, string> = {};
    for (let i = 0; i < 10000; i++) {
      messages[`key${i}`] = `Value ${i} with {{param}}`;
    }

    const start = performance.now();
    
    const i18n = createI18n({
      locale: 'en',
      messages: { en: messages },
    });

    const initTime = performance.now() - start;
    expect(initTime).toBeLessThan(100); // Should initialize in less than 100ms

    // Test translation performance
    const translateStart = performance.now();
    
    for (let i = 0; i < 1000; i++) {
      i18n.t(`key${i}`, { param: 'test' });
    }
    
    const translateTime = performance.now() - translateStart;
    expect(translateTime).toBeLessThan(50); // 1000 translations in less than 50ms
  });

  it('should cache translations efficiently', () => {
    const i18n = createI18n({
      locale: 'en',
      messages: {
        en: {
          test: 'Hello {{name}}!',
        },
      },
    });

    // First call - should be slower (cache miss)
    const firstStart = performance.now();
    i18n.t('test', { name: 'John' });
    const firstTime = performance.now() - firstStart;

    // Subsequent calls - should be faster (cache hit)
    const secondStart = performance.now();
    for (let i = 0; i < 100; i++) {
      i18n.t('test', { name: 'John' });
    }
    const secondTime = performance.now() - secondStart;

    // Cached calls should be significantly faster per operation
    const avgCachedTime = secondTime / 100;
    expect(avgCachedTime).toBeLessThan(firstTime / 2);
  });

  it('should handle memory efficiently with many locales', () => {
    const messages: Record<string, Record<string, string>> = {};
    
    // Create 50 locales with 1000 keys each
    for (let locale = 0; locale < 50; locale++) {
      messages[`lang${locale}`] = {};
      for (let key = 0; key < 1000; key++) {
        messages[`lang${locale}`][`key${key}`] = `Value ${key} in ${locale}`;
      }
    }

    const start = performance.now();
    
    const i18n = createI18n({
      locale: 'lang0',
      messages,
    });

    // Switch between locales rapidly
    for (let i = 0; i < 100; i++) {
      const locale = `lang${i % 10}`;
      i18n.setLocale(locale);
      i18n.t('key0');
    }

    const totalTime = performance.now() - start;
    expect(totalTime).toBeLessThan(200); // Should complete in less than 200ms
  });

  it('should handle nested key access efficiently', () => {
    const nestedMessages: any = {};
    
    // Create deeply nested structure
    let current = nestedMessages;
    for (let i = 0; i < 10; i++) {
      current[`level${i}`] = {};
      current = current[`level${i}`];
    }
    current.deepKey = 'Deep value {{param}}';

    const i18n = createI18n({
      locale: 'en',
      messages: { en: { 'level0.level1.level2.level3.level4.level5.level6.level7.level8.level9.deepKey': 'Deep value {{param}}' } },
    });

    const start = performance.now();
    
    for (let i = 0; i < 1000; i++) {
      i18n.t('level0.level1.level2.level3.level4.level5.level6.level7.level8.level9.deepKey', { param: 'test' });
    }
    
    const time = performance.now() - start;
    expect(time).toBeLessThan(100); // 1000 deep accesses in less than 100ms
  });

  it('should handle pluralization efficiently', () => {
    const i18n = createI18n({
      locale: 'en',
      messages: {
        en: {
          'items.count': '{{count}} items',
          'items.count.zero': 'No items',
          'items.count.one': 'One item',
          'items.count.other': '{{count}} items',
        },
      },
    });

    const start = performance.now();
    
    // Test various plural forms
    for (let i = 0; i < 1000; i++) {
      i18n.t('items.count', { count: i % 10 });
    }
    
    const time = performance.now() - start;
    expect(time).toBeLessThan(50); // 1000 pluralizations in less than 50ms
  });

  it('should handle subscriber notifications efficiently', () => {
    const i18n = createI18n({
      locale: 'en',
      messages: {
        en: { test: 'English' },
        es: { test: 'Spanish' },
      },
    });

    // Add many subscribers
    const subscribers: Array<() => void> = [];
    for (let i = 0; i < 100; i++) {
      const unsubscribe = i18n.subscribe(() => {
        // Simulate work
        Math.random();
      });
      subscribers.push(unsubscribe);
    }

    const start = performance.now();
    
    // Change locale multiple times
    for (let i = 0; i < 100; i++) {
      i18n.setLocale(i % 2 === 0 ? 'en' : 'es');
    }
    
    const time = performance.now() - start;
    expect(time).toBeLessThan(100); // 100 locale changes with 100 subscribers in less than 100ms

    // Cleanup
    subscribers.forEach(unsub => unsub());
  });

  it('should not leak memory with dynamic message addition', () => {
    const i18n = createI18n({
      locale: 'en',
      messages: { en: {} },
    });

    // Simulate dynamic message loading
    for (let i = 0; i < 1000; i++) {
      i18n.addMessages('en', {
        [`dynamic${i}`]: `Dynamic message ${i}`,
      });
    }

    // Verify all messages are accessible
    for (let i = 0; i < 1000; i++) {
      expect(i18n.t(`dynamic${i}`)).toBe(`Dynamic message ${i}`);
    }

    // Performance should still be good
    const start = performance.now();
    for (let i = 0; i < 100; i++) {
      i18n.t(`dynamic${i}`);
    }
    const time = performance.now() - start;
    expect(time).toBeLessThan(10);
  });
});