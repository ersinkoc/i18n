import type { I18nPlugin } from './types';

/**
 * Markdown plugin for basic markdown syntax transformation
 */
export const markdownPlugin: I18nPlugin = {
  name: 'markdown',
  transform: (_key, value, _params, _locale) => {
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
function parseICUBalanced(text: string, startPattern: RegExp): { match: string; content: string } | null {
  const match = text.match(startPattern);
  if (!match) return null;
  
  const start = match.index! + match[0].length;
  let braceCount = 1;
  let i = start;
  
  while (i < text.length && braceCount > 0) {
    if (text[i] === '{') braceCount++;
    else if (text[i] === '}') braceCount--;
    i++;
  }
  
  if (braceCount === 0) {
    const fullMatch = text.substring(match.index!, i);
    const content = text.substring(start, i - 1);
    return { match: fullMatch, content };
  }
  
  return null;
}

export const icuPlugin: I18nPlugin = {
  name: 'icu',
  transform: (_key, value, _params, _locale) => {
    let result = value;
    
    // Handle basic ICU plural patterns
    if (_params && 'count' in _params) {
      const count = _params.count as number;
      
      // Pattern: {count, plural, =0 {no items} =1 {one item} other {# items}}
      const pluralInfo = parseICUBalanced(result, /\{count,\s*plural,\s*/);
      if (pluralInfo) {
        const rules = pluralInfo.content;
        
        // Parse rules - handle =0, =1, one, other
        const zeroMatch = rules.match(/=0\s*\{([^}]+)\}/);
        const oneMatch = rules.match(/=1\s*\{([^}]+)\}/) || rules.match(/one\s*\{([^}]+)\}/);
        const otherMatch = rules.match(/other\s*\{([^}]+)\}/);
        
        let replacement = pluralInfo.match;
        if (count === 0 && zeroMatch) {
          replacement = zeroMatch[1];
        } else if (count === 1 && oneMatch) {
          replacement = oneMatch[1];
        } else if (otherMatch) {
          replacement = otherMatch[1].replace(/#/g, String(count));
        }
        
        result = result.replace(pluralInfo.match, replacement);
      }
    }
    
    // Handle basic ICU select patterns
    if (_params && 'gender' in _params) {
      const gender = _params.gender as string;
      
      // Pattern: {gender, select, male {He} female {She} other {They}}
      const selectInfo = parseICUBalanced(result, /\{gender,\s*select,\s*/);
      if (selectInfo) {
        const rules = selectInfo.content;
        const genderMatch = rules.match(new RegExp(`${gender}\\s*\\{([^}]+)\\}`));
        const otherMatch = rules.match(/other\s*\{([^}]+)\}/);
        
        let replacement = selectInfo.match;
        if (genderMatch) {
          replacement = genderMatch[1];
        } else if (otherMatch) {
          replacement = otherMatch[1];
        }
        
        result = result.replace(selectInfo.match, replacement);
      }
    }
    
    // Handle simple parameter replacement
    if (_params && 'name' in _params) {
      result = result.replace(/\{name\}/g, String(_params.name));
    }
    
    return result;
  },
};