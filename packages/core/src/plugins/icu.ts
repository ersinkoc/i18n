import type { I18nPlugin, TranslationParams } from '../types';

export function createICUPlugin(): I18nPlugin {
  return {
    name: 'icu',
    transform: (_key, value, params, _locale) => {
      // Simple ICU MessageFormat support
      return value.replace(
        /\{([^,}]+)(?:,\s*(plural|select)(?:,([^}]+))?)?\}/g,
        (match, param, type, options) => {
          if (!(param in params)) return match;
          
          const paramValue = params[param];
          
          if (type === 'plural' && typeof paramValue === 'number') {
            return handlePlural(paramValue, options || '', params);
          }
          
          if (type === 'select' && typeof paramValue === 'string') {
            return handleSelect(paramValue, options || '', params);
          }
          
          return String(paramValue);
        }
      );
    },
  };
}

function handlePlural(
  count: number,
  options: string,
  _params: TranslationParams
): string {
  const matches = options.match(/(\w+)\s*\{([^}]+)\}/g);
  if (!matches) return String(count);
  
  for (const match of matches) {
    const [, key, text] = match.match(/(\w+)\s*\{([^}]+)\}/) || [];
    if (!key || !text) continue;
    
    if (
      (key === '=0' && count === 0) ||
      (key === '=1' && count === 1) ||
      (key === 'one' && count === 1) ||
      (key === 'other')
    ) {
      return text.replace(/#/g, String(count));
    }
  }
  
  return String(count);
}

function handleSelect(
  value: string,
  options: string,
  _params: TranslationParams
): string {
  const matches = options.match(/(\w+)\s*\{([^}]+)\}/g);
  if (!matches) return value;
  
  for (const match of matches) {
    const [, key, text] = match.match(/(\w+)\s*\{([^}]+)\}/) || [];
    if (!key || !text) continue;
    
    if (key === value || key === 'other') {
      return text;
    }
  }
  
  return value;
}