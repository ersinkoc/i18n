import { describe, expect, it } from 'vitest';
import { createI18n } from '../core';
import { createICUPlugin, createMarkdownPlugin } from '../plugins';
import type { Messages } from '../types';

interface TestMessages extends Messages {
  'markdown.text': '**Bold** and *italic* and `code`';
  'icu.plural': '{count, plural, =0 {no items} =1 {one item} other {# items}}';
  'icu.select': '{gender, select, male {He} female {She} other {They}} is here';
}

describe('Markdown Plugin', () => {
  it('should transform markdown syntax', () => {
    const i18n = createI18n<TestMessages>({
      locale: 'en',
      messages: {
        en: {
          'markdown.text': '**Bold** and *italic* and `code`',
        },
      },
      plugins: [createMarkdownPlugin()],
    });

    const result = i18n.t('markdown.text');
    expect(result).toBe('<strong>Bold</strong> and <em>italic</em> and <code>code</code>');
  });

  it('should handle links', () => {
    const i18n = createI18n({
      locale: 'en',
      messages: {
        en: {
          link: 'Visit [Google](https://google.com) for search',
        },
      },
      plugins: [createMarkdownPlugin()],
    });

    const result = i18n.t('link');
    expect(result).toBe('Visit <a href="https://google.com">Google</a> for search');
  });
});

describe('ICU Plugin', () => {
  it('should handle plural rules', () => {
    const i18n = createI18n<TestMessages>({
      locale: 'en',
      messages: {
        en: {
          'icu.plural': '{count, plural, =0 {no items} =1 {one item} other {# items}}',
        },
      },
      plugins: [createICUPlugin()],
    });

    expect(i18n.t('icu.plural', { count: 0 })).toBe('no items');
    expect(i18n.t('icu.plural', { count: 1 })).toBe('one item');
    expect(i18n.t('icu.plural', { count: 5 })).toBe('5 items');
  });

  it('should handle select rules', () => {
    const i18n = createI18n<TestMessages>({
      locale: 'en',
      messages: {
        en: {
          'icu.select': '{gender, select, male {He} female {She} other {They}} is here',
        },
      },
      plugins: [createICUPlugin()],
    });

    expect(i18n.t('icu.select', { gender: 'male' })).toBe('He is here');
    expect(i18n.t('icu.select', { gender: 'female' })).toBe('She is here');
    expect(i18n.t('icu.select', { gender: 'unknown' })).toBe('They is here');
  });

  it('should handle complex ICU patterns', () => {
    const i18n = createI18n({
      locale: 'en',
      messages: {
        en: {
          complex: '{name} has {count, plural, =0 {no messages} =1 {one message} other {# messages}}',
        },
      },
      plugins: [createICUPlugin()],
    });

    expect(i18n.t('complex', { name: 'John', count: 0 })).toBe('John has no messages');
    expect(i18n.t('complex', { name: 'John', count: 1 })).toBe('John has one message');
    expect(i18n.t('complex', { name: 'John', count: 5 })).toBe('John has 5 messages');
  });
});

describe('Plugin System', () => {
  it('should allow adding plugins dynamically', () => {
    const i18n = createI18n({
      locale: 'en',
      messages: {
        en: {
          text: '**Bold text**',
        },
      },
    });

    // Without plugin
    expect(i18n.t('text')).toBe('**Bold text**');

    // Add plugin
    i18n.addPlugin(createMarkdownPlugin());
    expect(i18n.t('text')).toBe('<strong>Bold text</strong>');
  });

  it('should allow removing plugins', () => {
    const i18n = createI18n({
      locale: 'en',
      messages: {
        en: {
          text: '**Bold text**',
        },
      },
      plugins: [createMarkdownPlugin()],
    });

    // With plugin
    expect(i18n.t('text')).toBe('<strong>Bold text</strong>');

    // Remove plugin
    i18n.removePlugin('markdown');
    expect(i18n.t('text')).toBe('**Bold text**');
  });

  it('should support custom plugins', () => {
    const upperCasePlugin = {
      name: 'uppercase',
      transform: (key: any, value: string) => value.toUpperCase(),
    };

    const i18n = createI18n({
      locale: 'en',
      messages: {
        en: {
          text: 'hello world',
        },
      },
      plugins: [upperCasePlugin],
    });

    expect(i18n.t('text')).toBe('HELLO WORLD');
  });

  it('should handle plugin load hooks', () => {
    let beforeLoadCalled = false;
    let afterLoadCalled = false;

    const hookPlugin = {
      name: 'hooks',
      beforeLoad: (locale: string, messages: any) => {
        beforeLoadCalled = true;
        return { ...messages, hooked: 'yes' };
      },
      afterLoad: () => {
        afterLoadCalled = true;
      },
    };

    const i18n = createI18n({
      locale: 'en',
      messages: {
        en: {},
      },
      plugins: [hookPlugin],
    });

    i18n.addMessages('en', { test: 'value' });

    expect(beforeLoadCalled).toBe(true);
    expect(afterLoadCalled).toBe(true);
    expect(i18n.t('hooked')).toBe('yes');
  });
});