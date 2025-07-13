import { createI18n } from '@oxog/i18n';
import en from './locales/en.json';
import es from './locales/es.json';

export type Messages = typeof en;

export const i18n = createI18n<Messages>({
  locale: 'en',
  fallbackLocale: 'en',
  messages: {
    en,
    es,
  },
  formats: {
    number: {
      currency: { style: 'currency', currency: 'USD' },
    },
    date: {
      short: { dateStyle: 'short' },
      long: { dateStyle: 'long' },
    },
  },
});