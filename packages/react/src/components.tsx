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
    const translatedText = values ? (t as any)(id, values) : (t as any)(id);
    
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
  
  const translation = values ? (t as any)(id, values) : (t as any)(id);
  
  // Parse the translation and replace component placeholders
  function parseTranslation(text: string): React.ReactNode[] {
    const result: React.ReactNode[] = [];
    let lastIndex = 0;
    
    // Find all component tags
    const regex = /<(\d+)>(.*?)<\/\1>/g;
    let match;
    
    while ((match = regex.exec(text)) !== null) {
      const [fullMatch, componentIndex, innerContent] = match;
      const startIndex = match.index;
      
      // Add text before the component
      if (startIndex > lastIndex) {
        result.push(text.slice(lastIndex, startIndex));
      }
      
      // Process the component
      const Component = components[componentIndex];
      if (Component) {
        // Recursively parse inner content for nested components
        const children = parseTranslation(innerContent);
        result.push(
          React.cloneElement(
            Component,
            { key: `component-${componentIndex}-${startIndex}` },
            children.length === 1 && typeof children[0] === 'string' ? children[0] : children
          )
        );
      } else {
        // If component not found, keep the original text
        result.push(fullMatch);
      }
      
      lastIndex = startIndex + fullMatch.length;
    }
    
    // Add any remaining text
    if (lastIndex < text.length) {
      result.push(text.slice(lastIndex));
    }
    
    return result;
  }
  
  const elements = parseTranslation(translation);
  
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
  
  if (typeof value !== 'number' || isNaN(value)) {
    if (process.env.NODE_ENV !== 'production') {
      console.error('[i18n] NumberFormat component requires a valid number');
    }
    return (
      <Component className={className} {...props}>
        {String(value)}
      </Component>
    );
  }
  
  try {
    return (
      <Component className={className} {...props}>
        {formatNumber(value, format)}
      </Component>
    );
  } catch (error) {
    if (process.env.NODE_ENV !== 'production') {
      console.error('[i18n] NumberFormat component error:', error);
    }
    return (
      <Component className={className} {...props}>
        {String(value)}
      </Component>
    );
  }
}

export interface DateFormatProps {
  value: Date | any;
  format?: string;
  as?: keyof JSX.IntrinsicElements;
  className?: string;
}

export function DateFormat({ value, format, as: Component = 'span', className, ...props }: DateFormatProps) {
  const { formatDate } = useTranslation();
  
  if (!(value instanceof Date) || isNaN((value as Date).getTime())) {
    if (process.env.NODE_ENV !== 'production') {
      console.error('[i18n] DateFormat component requires a valid Date object');
    }
    return (
      <Component className={className} {...props}>
        {String(value)}
      </Component>
    );
  }
  
  try {
    return (
      <Component className={className} {...props}>
        {formatDate(value, format)}
      </Component>
    );
  } catch (error) {
    if (process.env.NODE_ENV !== 'production') {
      console.error('[i18n] DateFormat component error:', error);
    }
    return (
      <Component className={className} {...props}>
        {String(value)}
      </Component>
    );
  }
}

export interface RelativeTimeProps {
  value: Date | any;
  baseDate?: Date | any;
  as?: keyof JSX.IntrinsicElements;
  className?: string;
}

export function RelativeTime({ value, baseDate, as: Component = 'span', className, ...props }: RelativeTimeProps) {
  const { formatRelativeTime } = useTranslation();
  
  if (!(value instanceof Date) || isNaN((value as Date).getTime())) {
    if (process.env.NODE_ENV !== 'production') {
      console.error('[i18n] RelativeTime component requires a valid Date object for value');
    }
    return (
      <Component className={className} {...props}>
        {String(value)}
      </Component>
    );
  }
  
  if (baseDate !== undefined && (!(baseDate instanceof Date) || isNaN((baseDate as Date).getTime()))) {
    if (process.env.NODE_ENV !== 'production') {
      console.error('[i18n] RelativeTime component requires a valid Date object for baseDate');
    }
    return (
      <Component className={className} {...props}>
        {String(value)}
      </Component>
    );
  }
  
  try {
    return (
      <Component className={className} {...props}>
        {formatRelativeTime(value, baseDate)}
      </Component>
    );
  } catch (error) {
    if (process.env.NODE_ENV !== 'production') {
      console.error('[i18n] RelativeTime component error:', error);
    }
    return (
      <Component className={className} {...props}>
        {String(value)}
      </Component>
    );
  }
}