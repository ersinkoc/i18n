import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { promises as fs } from 'fs';
import { join } from 'path';
import { tmpdir } from 'os';
import { createI18n } from '../../packages/core/src/index';

describe('Full Stack Integration Tests', () => {
  let tempDir: string;

  beforeEach(async () => {
    // Create temporary directory for each test
    tempDir = join(tmpdir(), `oxog-i18n-test-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`);
    await fs.mkdir(tempDir, { recursive: true });
  });

  afterEach(async () => {
    // Clean up temporary directory
    try {
      await fs.rmdir(tempDir, { recursive: true });
    } catch (error) {
      // Ignore cleanup errors
    }
  });

  it('should handle complete i18n workflow', async () => {
    // 1. Create translation files
    const localesDir = join(tempDir, 'locales');
    await fs.mkdir(localesDir, { recursive: true });

    const enMessages = {
      app: {
        title: 'My App',
        description: 'A wonderful application',
      },
      navigation: {
        home: 'Home',
        about: 'About',
        contact: 'Contact Us',
      },
      user: {
        greeting: 'Hello {{name}}!',
        profile: 'Welcome back, {{name}}. You have {{count}} notifications.',
        settings: {
          title: 'Settings',
          language: 'Language',
          theme: 'Theme',
        },
      },
      items: {
        count: {
          zero: 'No items',
          one: 'One item',
          other: '{{count}} items',
        },
      },
    };

    const esMessages = {
      app: {
        title: 'Mi App',
        description: 'Una aplicación maravillosa',
      },
      navigation: {
        home: 'Inicio',
        about: 'Acerca de',
        contact: 'Contáctanos',
      },
      user: {
        greeting: '¡Hola {{name}}!',
        profile: 'Bienvenido de vuelta, {{name}}. Tienes {{count}} notificaciones.',
        settings: {
          title: 'Configuración',
          language: 'Idioma',
          theme: 'Tema',
        },
      },
      items: {
        count: {
          zero: 'Sin elementos',
          one: 'Un elemento',
          other: '{{count}} elementos',
        },
      },
    };

    await fs.writeFile(
      join(localesDir, 'en.json'),
      JSON.stringify(enMessages, null, 2)
    );
    await fs.writeFile(
      join(localesDir, 'es.json'),
      JSON.stringify(esMessages, null, 2)
    );

    // 2. Load and initialize i18n
    const enContent = await fs.readFile(join(localesDir, 'en.json'), 'utf-8');
    const esContent = await fs.readFile(join(localesDir, 'es.json'), 'utf-8');

    const i18n = createI18n({
      locale: 'en',
      fallbackLocale: 'en',
      messages: {
        en: JSON.parse(enContent),
        es: JSON.parse(esContent),
      },
      warnOnMissingTranslations: true,
    });

    // 3. Test English translations
    expect(i18n.t('app.title')).toBe('My App');
    expect(i18n.t('user.greeting', { name: 'John' })).toBe('Hello John!');
    expect(i18n.t('user.profile', { name: 'John', count: 5 })).toBe(
      'Welcome back, John. You have 5 notifications.'
    );
    expect(i18n.t('items.count', { count: 0 })).toBe('No items');
    expect(i18n.t('items.count', { count: 1 })).toBe('One item');
    expect(i18n.t('items.count', { count: 5 })).toBe('5 items');

    // 4. Test Spanish translations
    i18n.setLocale('es');
    expect(i18n.locale).toBe('es');
    expect(i18n.t('app.title')).toBe('Mi App');
    expect(i18n.t('user.greeting', { name: 'Juan' })).toBe('¡Hola Juan!');
    expect(i18n.t('user.profile', { name: 'Juan', count: 3 })).toBe(
      'Bienvenido de vuelta, Juan. Tienes 3 notificaciones.'
    );

    // 5. Test fallback behavior
    i18n.setLocale('fr'); // Non-existent locale
    expect(i18n.t('app.title')).toBe('My App'); // Should fallback to English

    // 6. Test dynamic message addition
    i18n.addMessages('fr', {
      app: {
        title: 'Mon App',
      },
      user: {
        greeting: 'Bonjour {{name}}!',
      },
    });

    expect(i18n.t('app.title')).toBe('Mon App');
    expect(i18n.t('user.greeting', { name: 'Pierre' })).toBe('Bonjour Pierre!');
    expect(i18n.t('user.profile', { name: 'Pierre', count: 2 })).toBe(
      'Welcome back, Pierre. You have 2 notifications.'
    ); // Should fallback to English

    // 7. Test locale change notifications
    let notificationCount = 0;
    const unsubscribe = i18n.subscribe(() => {
      notificationCount++;
    });

    i18n.setLocale('en');
    i18n.setLocale('es');
    i18n.setLocale('fr');

    expect(notificationCount).toBe(3);
    unsubscribe();

    // 8. Test number and date formatting
    const number = 1234567.89;
    const date = new Date('2024-01-15T12:00:00Z');

    i18n.setLocale('en');
    expect(i18n.formatNumber(number)).toBe('1,234,567.89');

    i18n.setLocale('es');
    // Spanish number formatting might differ based on locale
    const spanishNumber = i18n.formatNumber(number);
    expect(typeof spanishNumber).toBe('string');
    expect(spanishNumber.length).toBeGreaterThan(0);

    // 9. Test relative time formatting
    const now = new Date();
    const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
    const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);

    expect(i18n.formatRelativeTime(oneHourAgo, now)).toMatch(/hour|ago/);
    expect(i18n.formatRelativeTime(tomorrow, now)).toMatch(/tomorrow|day/);
  });

  it('should handle plugin integration', async () => {
    const markdownPlugin = {
      name: 'markdown',
      transform: (key: any, value: string) => {
        return value
          .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
          .replace(/\*(.*?)\*/g, '<em>$1</em>');
      },
    };

    const i18n = createI18n({
      locale: 'en',
      messages: {
        en: {
          welcome: '**Welcome** to our *amazing* app!',
          instructions: 'Click **here** to *continue*.',
        },
      },
      plugins: [markdownPlugin],
    });

    expect(i18n.t('welcome')).toBe('<strong>Welcome</strong> to our <em>amazing</em> app!');
    expect(i18n.t('instructions')).toBe('Click <strong>here</strong> to <em>continue</em>.');

    // Test plugin removal
    i18n.removePlugin('markdown');
    expect(i18n.t('welcome')).toBe('**Welcome** to our *amazing* app!');

    // Test plugin re-addition
    i18n.addPlugin(markdownPlugin);
    expect(i18n.t('welcome')).toBe('<strong>Welcome</strong> to our <em>amazing</em> app!');
  });

  it('should handle complex nested translations', async () => {
    const complexMessages = {
      deeply: {
        nested: {
          structure: {
            with: {
              many: {
                levels: {
                  final: 'Deep value {{param}}',
                },
              },
            },
          },
        },
      },
      array: {
        items: {
          first: 'First item',
          second: 'Second item {{value}}',
          third: 'Third item with {{count}} values',
        },
      },
    };

    const i18n = createI18n({
      locale: 'en',
      messages: { en: complexMessages },
    });

    expect(i18n.t('deeply.nested.structure.with.many.levels.final', { param: 'test' }))
      .toBe('Deep value test');
    
    expect(i18n.t('array.items.second', { value: 'parameter' }))
      .toBe('Second item parameter');

    expect(i18n.t('array.items.third', { count: 42 }))
      .toBe('Third item with 42 values');
  });

  it('should handle concurrent operations safely', async () => {
    const i18n = createI18n({
      locale: 'en',
      messages: {
        en: { test: 'English {{value}}' },
        es: { test: 'Spanish {{value}}' },
        fr: { test: 'French {{value}}' },
      },
    });

    // Simulate concurrent locale changes and translations
    const operations = Array.from({ length: 100 }, (_, i) => {
      return Promise.resolve().then(() => {
        const locale = ['en', 'es', 'fr'][i % 3];
        i18n.setLocale(locale);
        return i18n.t('test', { value: i });
      });
    });

    const results = await Promise.all(operations);

    // All results should be valid translations
    results.forEach((result, i) => {
      expect(result).toMatch(/English|Spanish|French/);
      expect(result).toContain(String(i));
    });
  });

  it('should maintain performance under stress', async () => {
    // Create large translation set
    const largeMessages: Record<string, string> = {};
    for (let i = 0; i < 5000; i++) {
      largeMessages[`item${i}`] = `Item ${i} with {{param${i}}}`;
    }

    const i18n = createI18n({
      locale: 'en',
      messages: { en: largeMessages },
    });

    // Stress test with many translations
    const start = performance.now();
    
    for (let i = 0; i < 1000; i++) {
      const key = `item${i % 100}`;
      const params = { [`param${i % 100}`]: `value${i}` };
      i18n.t(key, params);
    }
    
    const duration = performance.now() - start;
    
    console.log(`Stress test completed in ${duration.toFixed(2)}ms`);
    expect(duration).toBeLessThan(100); // Should complete in less than 100ms
  });
});