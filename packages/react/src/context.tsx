import type { I18nInstance, Messages } from '@oxog/i18n';
import React, { createContext, useContext, useMemo, useSyncExternalStore } from 'react';

export interface I18nContextValue<TMessages extends Messages = Messages> {
  i18n: I18nInstance<TMessages>;
}

export const I18nContext = createContext<I18nContextValue<any> | null>(null);

export interface I18nProviderProps<TMessages extends Messages = Messages> {
  i18n: I18nInstance<TMessages>;
  children: React.ReactNode;
}

export function I18nProvider<TMessages extends Messages = Messages>({
  i18n,
  children,
}: I18nProviderProps<TMessages>) {
  if (!i18n) {
    throw new Error('[i18n] I18nProvider requires a valid i18n instance');
  }

  const value = useMemo<I18nContextValue<any>>(() => ({ i18n }), [i18n]);

  return (
    <I18nContext.Provider value={value}>
      {children}
    </I18nContext.Provider>
  );
}

export function useI18nContext<TMessages extends Messages = Messages>(): I18nContextValue<TMessages> {
  const context = useContext(I18nContext);
  if (!context || !context.i18n) {
    throw new Error('[i18n] useI18nContext must be used within an I18nProvider with a valid i18n instance');
  }
  return context as I18nContextValue<TMessages>;
}

export function useI18n<TMessages extends Messages = Messages>(): I18nInstance<TMessages> {
  const { i18n } = useI18nContext<TMessages>();
  
  if (!i18n) {
    throw new Error('[i18n] useI18n requires a valid i18n instance');
  }
  
  // Use useSyncExternalStore for optimal performance and concurrent features
  const locale = useSyncExternalStore(
    React.useCallback((callback) => {
      if (typeof i18n.subscribe !== 'function') {
        if (typeof process !== 'undefined' && process.env?.NODE_ENV !== 'production') {
          console.error('[i18n] i18n instance missing subscribe method - reactivity will not work properly');
        }
        // Fallback for instances without subscribe
        return () => {};
      }
      return i18n.subscribe(callback);
    }, [i18n]),
    () => i18n.locale || 'en',
    () => i18n.locale || 'en'
  );
  
  // Force re-render when locale changes
  React.useDebugValue(locale);
  
  return i18n;
}