export type LocaleCode = string;

export type TranslationValue = string | number | boolean | Date | null | undefined;

export type TranslationParams = Record<string, TranslationValue>;

export type ParseKeys<T> = T extends `${infer _Start}{{${infer Param}}}${infer Rest}`
  ? Param extends `${infer Key}:${infer Type}`
    ? { [K in Key]: Type extends 'number' ? number : Type extends 'boolean' ? boolean : Type extends 'date' ? Date : string } & ParseKeys<Rest>
    : { [K in Param]: TranslationValue } & ParseKeys<Rest>
  : {};

export type TranslationFunction<TMessages extends Messages> = <
  TKey extends keyof TMessages,
  TParams extends ParseKeys<TMessages[TKey]>
>(
  key: TKey,
  ...args: keyof TParams extends never ? [] : [params: TParams]
) => string;

export type Messages = Record<string, string>;

export type LocaleMessages<TMessages extends Messages = Messages> = Record<LocaleCode, TMessages>;

export interface I18nPlugin<TMessages extends Messages = Messages> {
  name: string;
  transform?: (key: keyof TMessages, value: string, params: TranslationParams, locale: LocaleCode) => string;
  beforeLoad?: (locale: LocaleCode, messages: TMessages) => TMessages;
  afterLoad?: (locale: LocaleCode, messages: TMessages) => void;
  format?: (value: TranslationValue, format: string, locale: LocaleCode) => string;
}

export interface I18nConfig<TMessages extends Messages = Messages> {
  locale: LocaleCode;
  fallbackLocale?: LocaleCode;
  messages: LocaleMessages<TMessages>;
  plugins?: I18nPlugin<TMessages>[];
  warnOnMissingTranslations?: boolean;
  pluralizationRules?: Record<LocaleCode, (count: number) => string>;
  formats?: {
    number?: Record<string, Intl.NumberFormatOptions>;
    date?: Record<string, Intl.DateTimeFormatOptions>;
  };
}

export interface I18nInstance<TMessages extends Messages = Messages> {
  readonly locale: LocaleCode;
  readonly fallbackLocale?: LocaleCode;
  readonly messages: LocaleMessages<TMessages>;
  readonly t: TranslationFunction<TMessages>;
  
  setLocale(locale: LocaleCode): void;
  getLocale(): LocaleCode;
  hasTranslation(key: keyof TMessages, locale?: LocaleCode): boolean;
  addMessages(locale: LocaleCode, messages: Partial<TMessages>): void;
  addPlugin(plugin: I18nPlugin<TMessages>): void;
  removePlugin(pluginName: string): void;
  
  formatNumber(value: number, format?: string): string;
  formatDate(value: Date, format?: string): string;
  formatRelativeTime(value: Date, baseDate?: Date): string;
  
  subscribe(listener: (locale: LocaleCode) => void): () => void;
}

export type ExtractTranslationKeys<T> = T extends Messages ? keyof T : never;

export type ExtractTranslationParams<
  TMessages extends Messages,
  TKey extends keyof TMessages
> = TMessages[TKey] extends string ? ParseKeys<TMessages[TKey]> : never;