import type { I18nPlugin } from '../types';

/**
 * Escapes HTML special characters to prevent XSS attacks
 */
function escapeHtml(text: string): string {
  const htmlEscapeMap: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#x27;',
    '/': '&#x2F;',
  };
  return text.replace(/[&<>"'/]/g, (char) => htmlEscapeMap[char]);
}

/**
 * Sanitizes href attribute to prevent javascript: and data: URIs
 */
function sanitizeHref(href: string): string {
  const trimmed = href.trim().toLowerCase();
  // Block javascript:, data:, vbscript:, and other dangerous protocols
  if (
    trimmed.startsWith('javascript:') ||
    trimmed.startsWith('data:') ||
    trimmed.startsWith('vbscript:') ||
    trimmed.startsWith('file:')
  ) {
    return '#';
  }
  return escapeHtml(href);
}

export function createMarkdownPlugin(): I18nPlugin {
  return {
    name: 'markdown',
    transform: (_key, value, _params, _locale) => {
      // Simple markdown transformations with XSS protection
      // First, escape the base text
      let result = escapeHtml(value);

      // Then apply markdown transformations on the escaped text
      // **bold** -> <strong>text</strong>
      result = result.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');

      // *italic* -> <em>text</em>
      result = result.replace(/\*(.*?)\*/g, '<em>$1</em>');

      // `code` -> <code>text</code>
      result = result.replace(/`(.*?)`/g, '<code>$1</code>');

      // [text](url) -> <a href="url">text</a>
      result = result.replace(/\[([^\]]+)\]\(([^)]+)\)/g, (_, text, href) => {
        return `<a href="${sanitizeHref(href)}">${text}</a>`;
      });

      return result;
    },
  };
}