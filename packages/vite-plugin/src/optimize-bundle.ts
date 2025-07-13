import type { OutputBundle } from 'rollup';
import type { OptimizeOptions } from './types.js';

const KEY_COMMENT_REGEX = /\/\*\s*@__I18N_KEYS__\s*([^*]+)\s*\*\//g;

export function optimizeBundle(
  bundle: OutputBundle,
  options: OptimizeOptions
): void {
  const usedKeys = new Set<string>();
  
  // First pass: collect all used translation keys
  for (const [fileName, chunk] of Object.entries(bundle)) {
    if (chunk.type === 'chunk' && chunk.code) {
      let match;
      while ((match = KEY_COMMENT_REGEX.exec(chunk.code)) !== null) {
        const keys = match[1].split(',').map(k => k.trim());
        keys.forEach(key => usedKeys.add(key));
      }
      KEY_COMMENT_REGEX.lastIndex = 0;
    }
  }
  
  // Second pass: optimize translation bundles
  for (const [fileName, asset] of Object.entries(bundle)) {
    if (asset.type === 'asset' && fileName.includes('locales') && fileName.endsWith('.json')) {
      try {
        const content = asset.source.toString();
        const translations = JSON.parse(content);
        
        // Filter out unused translations
        const optimized = filterTranslations(translations, usedKeys);
        
        // Update the asset with optimized content
        asset.source = JSON.stringify(optimized);
      } catch (error) {
        console.warn(`Failed to optimize ${fileName}:`, error);
      }
    }
  }
}

function filterTranslations(
  translations: any,
  usedKeys: Set<string>,
  prefix = ''
): any {
  if (typeof translations !== 'object' || translations === null) {
    return translations;
  }
  
  const result: any = {};
  
  for (const [key, value] of Object.entries(translations)) {
    const fullKey = prefix ? `${prefix}.${key}` : key;
    
    if (typeof value === 'object' && value !== null) {
      // Check if any nested keys are used
      const hasUsedNestedKeys = Array.from(usedKeys).some(k => k.startsWith(fullKey + '.'));
      
      if (hasUsedNestedKeys || usedKeys.has(fullKey)) {
        const filtered = filterTranslations(value, usedKeys, fullKey);
        if (Object.keys(filtered).length > 0) {
          result[key] = filtered;
        }
      }
    } else if (usedKeys.has(fullKey)) {
      result[key] = value;
    }
  }
  
  return result;
}