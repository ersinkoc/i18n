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
      <Component {...props} className={className}>
        {translatedText}
      </Component>
    );
  } catch (error) {
    if (process.env.NODE_ENV !== 'production') {
      console.error('[i18n] T component translation error:', error);
    }
    return (
      <Component {...props} className={className}>
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
  function parseTranslation(text: string, depth: number = 0): React.ReactNode[] {
    const MAX_DEPTH = 10; // Prevent stack overflow from malicious or malformed translations

    if (depth > MAX_DEPTH) {
      if (typeof process !== 'undefined' && process.env?.NODE_ENV !== 'production') {
        console.error('[i18n] Max nesting depth exceeded in Trans component');
      }
      return [text];
    }

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

      // Process the component (renamed to avoid shadowing)
      const ChildComponent = components[componentIndex];
      if (ChildComponent) {
        // Recursively parse inner content for nested components with depth tracking
        const children = parseTranslation(innerContent, depth + 1);
        result.push(
          React.cloneElement(
            ChildComponent,
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
    <Component {...props} className={className}>
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
      <Component {...props} className={className}>
        {String(value)}
      </Component>
    );
  }

  try {
    return (
      <Component {...props} className={className}>
        {formatNumber(value, format)}
      </Component>
    );
  } catch (error) {
    if (process.env.NODE_ENV !== 'production') {
      console.error('[i18n] NumberFormat component error:', error);
    }
    return (
      <Component {...props} className={className}>
        {String(value)}
      </Component>
    );
  }
}

export interface DateFormatProps {
  value: Date | string | number;
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
      <Component {...props} className={className}>
        {String(value)}
      </Component>
    );
  }

  try {
    return (
      <Component {...props} className={className}>
        {formatDate(value, format)}
      </Component>
    );
  } catch (error) {
    if (process.env.NODE_ENV !== 'production') {
      console.error('[i18n] DateFormat component error:', error);
    }
    return (
      <Component {...props} className={className}>
        {value instanceof Date ? value.toLocaleDateString() : String(value)}
      </Component>
    );
  }
}

export interface RelativeTimeProps {
  value: Date | string | number;
  baseDate?: Date | string | number;
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
      <Component {...props} className={className}>
        {String(value)}
      </Component>
    );
  }

  if (baseDate !== undefined && (!(baseDate instanceof Date) || isNaN((baseDate as Date).getTime()))) {
    if (process.env.NODE_ENV !== 'production') {
      console.error('[i18n] RelativeTime component requires a valid Date object for baseDate');
    }
    return (
      <Component {...props} className={className}>
        {String(value)}
      </Component>
    );
  }

  try {
    return (
      <Component {...props} className={className}>
        {formatRelativeTime(value, baseDate)}
      </Component>
    );
  } catch (error) {
    if (process.env.NODE_ENV !== 'production') {
      console.error('[i18n] RelativeTime component error:', error);
    }
    return (
      <Component {...props} className={className}>
        {value instanceof Date ? value.toLocaleDateString() : String(value)}
      </Component>
    );
  }
}