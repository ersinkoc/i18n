import type { ExtractTranslationKeys, ExtractTranslationParams, Messages } from '@oxog/i18n';
import React from 'react';
import { useTranslation } from './hooks';

export interface TProps<
  TMessages extends Messages = Messages,
  TKey extends ExtractTranslationKeys<TMessages> = ExtractTranslationKeys<TMessages>
> {
  id: TKey;
  values?: ExtractTranslationParams<TMessages, TKey>;
  as?: keyof JSX.IntrinsicElements;
  className?: string;
}

export function T<
  TMessages extends Messages = Messages,
  TKey extends ExtractTranslationKeys<TMessages> = ExtractTranslationKeys<TMessages>
>({ id, values, as: Component = 'span', className, ...props }: TProps<TMessages, TKey>) {
  const { t } = useTranslation<TMessages>();
  
  if (!id) {
    if (process.env.NODE_ENV !== 'production') {
      console.error('[i18n] T component requires an id prop');
    }
    return null;
  }
  
  try {
    const translatedText = t(id, ...(values ? [values as any] : []));
    
    return (
      <Component className={className} {...props}>
        {translatedText}
      </Component>
    );
  } catch (error) {
    if (process.env.NODE_ENV !== 'production') {
      console.error('[i18n] T component translation error:', error);
    }
    return (
      <Component className={className} {...props}>
        {String(id)}
      </Component>
    );
  }
}

export interface TransProps<
  TMessages extends Messages = Messages,
  TKey extends ExtractTranslationKeys<TMessages> = ExtractTranslationKeys<TMessages>
> {
  id: TKey;
  values?: ExtractTranslationParams<TMessages, TKey>;
  components?: Record<string, React.ReactElement>;
  as?: keyof JSX.IntrinsicElements;
  className?: string;
}

export function Trans<
  TMessages extends Messages = Messages,
  TKey extends ExtractTranslationKeys<TMessages> = ExtractTranslationKeys<TMessages>
>({ id, values, components = {}, as: Component = 'span', className, ...props }: TransProps<TMessages, TKey>) {
  const { t } = useTranslation<TMessages>();
  
  const translation = t(id, ...(values ? [values as any] : []));
  
  // Parse the translation and replace component placeholders
  const parts = translation.split(/(<\d+>.*?<\/\d+>)/);
  
  const elements = parts.map((part, index) => {
    const match = part.match(/^<(\d+)>(.*?)<\/\1>$/);
    if (match) {
      const [, componentIndex, content] = match;
      const componentKey = Object.keys(components)[parseInt(componentIndex, 10)];
      const Component = components[componentKey];
      
      if (Component) {
        return React.cloneElement(Component, { key: index }, content);
      }
    }
    
    return part;
  });
  
  return (
    <Component className={className} {...props}>
      {elements}
    </Component>
  );
}

export interface NumberFormatProps {
  value: number;
  format?: string;
  as?: keyof JSX.IntrinsicElements;
  className?: string;
}

export function NumberFormat({ value, format, as: Component = 'span', className, ...props }: NumberFormatProps) {
  const { formatNumber } = useTranslation();
  
  return (
    <Component className={className} {...props}>
      {formatNumber(value, format)}
    </Component>
  );
}

export interface DateFormatProps {
  value: Date;
  format?: string;
  as?: keyof JSX.IntrinsicElements;
  className?: string;
}

export function DateFormat({ value, format, as: Component = 'span', className, ...props }: DateFormatProps) {
  const { formatDate } = useTranslation();
  
  return (
    <Component className={className} {...props}>
      {formatDate(value, format)}
    </Component>
  );
}

export interface RelativeTimeProps {
  value: Date;
  baseDate?: Date;
  as?: keyof JSX.IntrinsicElements;
  className?: string;
}

export function RelativeTime({ value, baseDate, as: Component = 'span', className, ...props }: RelativeTimeProps) {
  const { formatRelativeTime } = useTranslation();
  
  return (
    <Component className={className} {...props}>
      {formatRelativeTime(value, baseDate)}
    </Component>
  );
}