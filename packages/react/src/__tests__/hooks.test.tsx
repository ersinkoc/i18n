import { createI18n } from '@oxog/i18n';
import { act, renderHook } from '@testing-library/react';
import React from 'react';
import { describe, expect, it } from 'vitest';
import { I18nProvider } from '../context';
import { useLocale, useTranslation } from '../hooks';

interface TestMessages {
  greeting: 'Hello!';
  welcome: 'Welcome {{name}}!';
}

describe('useTranslation', () => {
  const i18n = createI18n<TestMessages>({
    locale: 'en',
    messages: {
      en: {
        greeting: 'Hello!',
        welcome: 'Welcome {{name}}!',
      },
      es: {
        greeting: '¡Hola!',
        welcome: '¡Bienvenido {{name}}!',
      },
    },
  });
  
  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <I18nProvider i18n={i18n}>{children}</I18nProvider>
  );
  
  it('should provide translation function', () => {
    const { result } = renderHook(() => useTranslation<TestMessages>(), { wrapper });
    
    expect(result.current.t('greeting')).toBe('Hello!');
    expect(result.current.t('welcome', { name: 'John' })).toBe('Welcome John!');
  });
  
  it('should provide current locale', () => {
    const { result } = renderHook(() => useTranslation(), { wrapper });
    
    expect(result.current.locale).toBe('en');
  });
  
  it('should update when locale changes', () => {
    const { result } = renderHook(() => useTranslation<TestMessages>(), { wrapper });
    
    expect(result.current.t('greeting')).toBe('Hello!');
    
    act(() => {
      result.current.setLocale('es');
    });
    
    expect(result.current.locale).toBe('es');
    expect(result.current.t('greeting')).toBe('¡Hola!');
  });
  
  it('should provide formatting functions', () => {
    const { result } = renderHook(() => useTranslation(), { wrapper });
    
    expect(result.current.formatNumber(1234.56)).toBe('1,234.56');
    
    const date = new Date('2024-01-15T12:00:00Z');
    expect(result.current.formatDate(date)).toBeDefined();
    
    const now = new Date();
    const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    expect(result.current.formatRelativeTime(yesterday, now)).toBe('yesterday');
  });
});

describe('useLocale', () => {
  const i18n = createI18n({
    locale: 'en',
    messages: {
      en: {},
      es: {},
    },
  });
  
  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <I18nProvider i18n={i18n}>{children}</I18nProvider>
  );
  
  it('should provide locale and setter', () => {
    const { result } = renderHook(() => useLocale(), { wrapper });
    
    const [locale, setLocale] = result.current;
    expect(locale).toBe('en');
    
    act(() => {
      setLocale('es');
    });
    
    expect(result.current[0]).toBe('es');
  });
});