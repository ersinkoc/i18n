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
  
  return useMemo(
    () => ({
      t,
      locale: i18n.locale,
      setLocale: i18n.setLocale.bind(i18n),
      formatNumber: i18n.formatNumber.bind(i18n),
      formatDate: i18n.formatDate.bind(i18n),
      formatRelativeTime: i18n.formatRelativeTime.bind(i18n),
    }),
    [i18n, t, i18n.locale]
  );
}

export function useLocale(): [string, (locale: string) => void] {
  const i18n = useI18n();
  return [i18n.locale, i18n.setLocale.bind(i18n)];
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