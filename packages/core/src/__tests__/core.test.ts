import { describe, expect, it, vi } from 'vitest';
import { createI18n } from '../core';
import type { Messages } from '../types';

interface TestMessages extends Messages {
  'greeting': 'Hello!';
  'welcome': 'Welcome {{name}}!';
  'items.count': 'You have {{count}} items';
  'items.count.zero': 'You have no items';
  'items.count.one': 'You have one item';
  'items.count.other': 'You have {{count}} items';
  'user.role.admin': 'Administrator';
  'user.role.user': 'User';
}

describe('createI18n', () => {
  it('should create an i18n instance', () => {
    const i18n = createI18n<TestMessages>({
      locale: 'en',
      messages: {
        en: {
          greeting: 'Hello!',
          welcome: 'Welcome {{name}}!',
        },
      },
    });
    
    expect(i18n.locale).toBe('en');
    expect(i18n.t).toBeDefined();
  });
  
  it('should translate simple messages', () => {
    const i18n = createI18n<TestMessages>({
      locale: 'en',
      messages: {
        en: {
          greeting: 'Hello!',
        },
      },
    });
    
    expect(i18n.t('greeting')).toBe('Hello!');
  });
  
  it('should interpolate parameters', () => {
    const i18n = createI18n<TestMessages>({
      locale: 'en',
      messages: {
        en: {
          welcome: 'Welcome {{name}}!',
        },
      },
    });
    
    expect(i18n.t('welcome', { name: 'John' })).toBe('Welcome John!');
  });
  
  it('should handle nested translations', () => {
    const i18n = createI18n<TestMessages>({
      locale: 'en',
      messages: {
        en: {
          'user.role.admin': 'Administrator',
          'user.role.user': 'User',
        },
      },
    });
    
    expect(i18n.t('user.role.admin')).toBe('Administrator');
    expect(i18n.t('user.role.user')).toBe('User');
  });
  
  it('should handle pluralization', () => {
    const i18n = createI18n<TestMessages>({
      locale: 'en',
      messages: {
        en: {
          'items.count': 'You have {{count}} items',
          'items.count.zero': 'You have no items',
          'items.count.one': 'You have one item',
          'items.count.other': 'You have {{count}} items',
        },
      },
    });
    
    expect(i18n.t('items.count', { count: 0 })).toBe('You have no items');
    expect(i18n.t('items.count', { count: 1 })).toBe('You have one item');
    expect(i18n.t('items.count', { count: 5 })).toBe('You have 5 items');
  });
  
  it('should fallback to key when translation is missing', () => {
    const i18n = createI18n<TestMessages>({
      locale: 'en',
      messages: {
        en: {},
      },
    });
    
    expect(i18n.t('greeting')).toBe('greeting');
  });
  
  it('should use fallback locale', () => {
    const i18n = createI18n<TestMessages>({
      locale: 'es',
      fallbackLocale: 'en',
      messages: {
        en: {
          greeting: 'Hello!',
        },
        es: {},
      },
    });
    
    expect(i18n.t('greeting')).toBe('Hello!');
  });
  
  it('should change locale', () => {
    const i18n = createI18n<TestMessages>({
      locale: 'en',
      messages: {
        en: {
          greeting: 'Hello!',
        },
        es: {
          greeting: '¡Hola!',
        },
      },
    });
    
    expect(i18n.t('greeting')).toBe('Hello!');
    
    i18n.setLocale('es');
    expect(i18n.locale).toBe('es');
    expect(i18n.t('greeting')).toBe('¡Hola!');
  });
  
  it('should notify listeners on locale change', () => {
    const i18n = createI18n<TestMessages>({
      locale: 'en',
      messages: {
        en: {},
      },
    });
    
    const listener = vi.fn();
    const unsubscribe = i18n.subscribe(listener);
    
    i18n.setLocale('es');
    expect(listener).toHaveBeenCalledWith('es');
    
    unsubscribe();
    i18n.setLocale('fr');
    expect(listener).toHaveBeenCalledTimes(1);
  });
  
  it('should format numbers', () => {
    const i18n = createI18n({
      locale: 'en',
      messages: { en: {} },
      formats: {
        number: {
          currency: { style: 'currency', currency: 'USD' },
          percent: { style: 'percent' },
        },
      },
    });
    
    expect(i18n.formatNumber(1234.56)).toBe('1,234.56');
    expect(i18n.formatNumber(1234.56, 'currency')).toBe('$1,234.56');
    expect(i18n.formatNumber(0.75, 'percent')).toBe('75%');
  });
  
  it('should format dates', () => {
    const i18n = createI18n({
      locale: 'en',
      messages: { en: {} },
      formats: {
        date: {
          short: { dateStyle: 'short' },
          long: { dateStyle: 'long' },
        },
      },
    });
    
    const date = new Date('2024-01-15T12:00:00Z');
    expect(i18n.formatDate(date, 'short')).toMatch(/1\/15\/24|15\/1\/24/);
  });
  
  it('should format relative time', () => {
    const i18n = createI18n({
      locale: 'en',
      messages: { en: {} },
    });
    
    const now = new Date();
    const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);
    
    expect(i18n.formatRelativeTime(yesterday, now)).toBe('yesterday');
    expect(i18n.formatRelativeTime(tomorrow, now)).toBe('tomorrow');
  });
  
  it('should check if translation exists', () => {
    const i18n = createI18n<TestMessages>({
      locale: 'en',
      messages: {
        en: {
          greeting: 'Hello!',
        },
      },
    });
    
    expect(i18n.hasTranslation('greeting')).toBe(true);
    expect(i18n.hasTranslation('welcome')).toBe(false);
  });
  
  it('should add messages dynamically', () => {
    const i18n = createI18n<TestMessages>({
      locale: 'en',
      messages: {
        en: {
          greeting: 'Hello!',
        },
      },
    });
    
    expect(i18n.hasTranslation('welcome')).toBe(false);
    
    i18n.addMessages('en', {
      welcome: 'Welcome {{name}}!',
    });
    
    expect(i18n.hasTranslation('welcome')).toBe(true);
    expect(i18n.t('welcome', { name: 'John' })).toBe('Welcome John!');
  });
});