import type { I18nPlugin } from '../types';

export function createMarkdownPlugin(): I18nPlugin {
  return {
    name: 'markdown',
    transform: (key, value, params, locale) => {
      // Simple markdown transformations
      return value
        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
        .replace(/\*(.*?)\*/g, '<em>$1</em>')
        .replace(/`(.*?)`/g, '<code>$1</code>')
        .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2">$1</a>');
    },
  };
}