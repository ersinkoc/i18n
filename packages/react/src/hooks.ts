import type { ExtractTranslationKeys, Messages, TranslationFunction } from '@oxog/i18n';
import { useCallback, useMemo } from 'react';
import { useI18n } from './context';

export interface UseTranslationResult<TMessages extends Messages = Messages> {
  t: TranslationFunction<TMessages>;
  locale: string;
  setLocale: (locale: string) => void;
  formatNumber: (value: number, format?: string) => string;
  formatDate: (value: Date, format?: string) => string;
  formatRelativeTime: (value: Date, baseDate?: Date) => string;
}

export function useTranslation<TMessages extends Messages = Messages>(
  namespace?: string
): UseTranslationResult<TMessages> {
  const i18n = useI18n<TMessages>();

  const t = useCallback<TranslationFunction<TMessages>>(
    (key, ...args) => {
      const fullKey = namespace ? `${namespace}.${String(key)}` : String(key);
      return i18n.t(fullKey as any, ...args);
    },
    [i18n, namespace]
  );

  const setLocale = useCallback((locale: string) => {
    i18n.setLocale(locale);
  }, [i18n]);

  const formatNumber = useCallback((value: number, format?: string) => {
    return i18n.formatNumber(value, format);
  }, [i18n]);

  const formatDate = useCallback((value: Date, format?: string) => {
    return i18n.formatDate(value, format);
  }, [i18n]);

  const formatRelativeTime = useCallback((value: Date, baseDate?: Date) => {
    return i18n.formatRelativeTime(value, baseDate);
  }, [i18n]);

  return useMemo(
    () => ({
      t,
      locale: i18n.locale,
      setLocale,
      formatNumber,
      formatDate,
      formatRelativeTime,
    }),
    [t, i18n.locale, setLocale, formatNumber, formatDate, formatRelativeTime]
  );
}

export function useLocale(): [string, (locale: string) => void] {
  const i18n = useI18n();
  const setLocale = useCallback((locale: string) => {
    i18n.setLocale(locale);
  }, [i18n]);
  return [i18n.locale, setLocale];
}

export function useHasTranslation<TMessages extends Messages = Messages>() {
  const i18n = useI18n<TMessages>();
  
  return useCallback(
    (key: ExtractTranslationKeys<TMessages>, locale?: string) => {
      return i18n.hasTranslation(key, locale);
    },
    [i18n]
  );
}