import type { I18nPlugin } from './types';

/**
 * Markdown plugin for basic markdown syntax transformation
 */
export const markdownPlugin: I18nPlugin = {
  name: 'markdown',
  transform: (key, value, params, locale) => {
    return value
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(/`(.*?)`/g, '<code>$1</code>')
      .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2">$1</a>');
  },
};

/**
 * ICU plugin for basic ICU message format support
 */
export const icuPlugin: I18nPlugin = {
  name: 'icu',
  transform: (key, value, params, locale) => {
    // Handle basic ICU plural patterns
    if (params && 'count' in params) {
      const count = params.count as number;
      
      // Pattern: {count, plural, =0 {no items} one {one item} other {# items}}
      const pluralMatch = value.match(/\{count,\s*plural,\s*(.*?)\}/);
      if (pluralMatch) {
        const rules = pluralMatch[1];
        
        // Parse rules - handle both =1 and one forms
        const zeroMatch = rules.match(/=0\s*\{([^}]+)\}/);
        const oneMatch = rules.match(/=1\s*\{([^}]+)\}/) || rules.match(/one\s*\{([^}]+)\}/);
        const otherMatch = rules.match(/other\s*\{([^}]+)\}/);
        
        if (count === 0 && zeroMatch) {
          return zeroMatch[1];
        } else if (count === 1 && oneMatch) {
          return oneMatch[1];
        } else if (otherMatch) {
          return otherMatch[1].replace('#', String(count));
        }
      }
    }
    
    // Handle basic ICU select patterns
    if (params && 'gender' in params) {
      const gender = params.gender as string;
      
      // Pattern: {gender, select, male {He is here} female {She is here} other {They is here}}
      const selectMatch = value.match(/\{gender,\s*select,\s*(.*?)\}/);
      if (selectMatch) {
        const rules = selectMatch[1];
        const genderMatch = rules.match(new RegExp(`${gender}\\s*\\{([^}]+)\\}`));
        const otherMatch = rules.match(/other\s*\{([^}]+)\}/);
        
        if (genderMatch) {
          return genderMatch[1];
        } else if (otherMatch) {
          return otherMatch[1];
        }
      }
    }
    
    return value;
  },
};