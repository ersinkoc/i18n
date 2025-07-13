import { createI18n, createMarkdownPlugin } from '@oxog/i18n';
import enMessages from '../locales/en.json';
import esMessages from '../locales/es.json';

export type Messages = typeof enMessages;

export const i18n = createI18n<Messages>({
  locale: 'en',
  fallbackLocale: 'en',
  messages: {
    en: enMessages,
    es: esMessages,
  },
  warnOnMissingTranslations: process.env.NODE_ENV === 'development',
  plugins: [
    createMarkdownPlugin(), // Enable markdown in translations
  ],
  formats: {
    number: {
      currency: { 
        style: 'currency', 
        currency: 'USD',
        minimumFractionDigits: 2,
      },
      compact: { 
        notation: 'compact', 
        maximumFractionDigits: 1,
      },
    },
    date: {
      short: { 
        dateStyle: 'short',
      },
      long: { 
        dateStyle: 'long',
      },
      relative: {
        style: 'long',
        numeric: 'auto',
      },
    },
  },
});

// Export supported locales
export const supportedLocales = ['en', 'es'] as const;
export type SupportedLocale = typeof supportedLocales[number];

// Utility functions
export function isValidLocale(locale: string): locale is SupportedLocale {
  return supportedLocales.includes(locale as SupportedLocale);
}

export function getDefaultLocale(): SupportedLocale {
  return 'en';
}

export function getBrowserLocale(): SupportedLocale {
  if (typeof window === 'undefined') return getDefaultLocale();
  
  const browserLang = navigator.language.split('-')[0];
  return isValidLocale(browserLang) ? browserLang : getDefaultLocale();
}

// Initialize locale from browser/localStorage
if (typeof window !== 'undefined') {
  const savedLocale = localStorage.getItem('locale');
  const initialLocale = savedLocale && isValidLocale(savedLocale) 
    ? savedLocale 
    : getBrowserLocale();
  
  i18n.setLocale(initialLocale);
  
  // Save locale changes to localStorage
  i18n.subscribe((newLocale) => {
    localStorage.setItem('locale', newLocale);
    document.documentElement.lang = newLocale;
  });
}