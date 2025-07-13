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
    let result = value;
    
    // Handle basic ICU plural patterns
    if (params && 'count' in params) {
      const count = params.count as number;
      
      // Pattern: {count, plural, =0 {no items} =1 {one item} other {# items}}
      result = result.replace(/\{count,\s*plural,\s*([^}]+)\}/g, (match, rules) => {
        // Parse rules - handle =0, =1, one, other
        const zeroMatch = rules.match(/=0\s*\{([^}]+)\}/);
        const oneMatch = rules.match(/=1\s*\{([^}]+)\}/) || rules.match(/one\s*\{([^}]+)\}/);
        const otherMatch = rules.match(/other\s*\{([^}]+)\}/);
        
        if (count === 0 && zeroMatch) {
          return zeroMatch[1];
        } else if (count === 1 && oneMatch) {
          return oneMatch[1];
        } else if (otherMatch) {
          return otherMatch[1].replace(/#/g, String(count));
        }
        
        return match; // Return original if no match
      });
    }
    
    // Handle basic ICU select patterns
    if (params && 'gender' in params) {
      const gender = params.gender as string;
      
      // Pattern: {gender, select, male {He} female {She} other {They}} is here
      result = result.replace(/\{gender,\s*select,\s*([^}]+)\}/g, (match, rules) => {
        const genderMatch = rules.match(new RegExp(`${gender}\\s*\\{([^}]+)\\}`));
        const otherMatch = rules.match(/other\s*\{([^}]+)\}/);
        
        if (genderMatch) {
          return genderMatch[1];
        } else if (otherMatch) {
          return otherMatch[1];
        }
        
        return match; // Return original if no match
      });
    }
    
    // Handle complex patterns with multiple ICU expressions
    if (params && 'name' in params) {
      result = result.replace(/\{name\}/g, String(params.name));
    }
    
    return result;
  },
};