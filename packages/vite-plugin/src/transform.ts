import MagicString from './utils/magic-string.js';
import type { TransformOptions } from './types.js';

const TRANSLATION_KEY_REGEX = /(?:\.t|useTranslation\(\)\.t)\s*\(\s*['"`]([^'"`]+)['"`]/g;
const COMPONENT_KEY_REGEX = /<(?:T|Trans)\s+id\s*=\s*['"`]([^'"`]+)['"`]/g;

export function transformCode(
  code: string,
  id: string,
  options: TransformOptions
): { code: string; map?: any } | null {
  const usedKeys = new Set<string>();
  let hasTransformations = false;
  
  // Extract translation keys used in this file
  let match;
  
  while ((match = TRANSLATION_KEY_REGEX.exec(code)) !== null) {
    usedKeys.add(match[1]);
  }
  
  TRANSLATION_KEY_REGEX.lastIndex = 0;
  
  while ((match = COMPONENT_KEY_REGEX.exec(code)) !== null) {
    usedKeys.add(match[1]);
  }
  
  COMPONENT_KEY_REGEX.lastIndex = 0;
  
  if (usedKeys.size === 0) {
    return null;
  }
  
  const s = new MagicString(code);
  
  // In production, we can inline static translation keys for better performance
  if (options.isProduction && options.optimize) {
    // Replace static t() calls with inline values when possible
    // This is a simplified example - in reality, we'd need to load actual translations
    code.replace(
      /\.t\s*\(\s*['"`]([^'"`]+)['"`]\s*\)/g,
      (match, key, offset) => {
        // Only inline if it's a simple key without parameters
        if (!match.includes(',')) {
          // Mark as transformed
          hasTransformations = true;
          
          // In a real implementation, we'd look up the actual translation
          // For now, we'll keep the original call
          return match;
        }
        return match;
      }
    );
  }
  
  // Add used keys as a comment for dead code elimination
  if (options.optimize && usedKeys.size > 0) {
    const keysComment = `/* @__I18N_KEYS__ ${Array.from(usedKeys).join(',')} */\n`;
    s.prepend(keysComment);
    hasTransformations = true;
  }
  
  if (!hasTransformations) {
    return null;
  }
  
  return {
    code: s.toString(),
    map: s.generateMap({ hires: true }),
  };
}