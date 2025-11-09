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
      // We need to be careful not to double-escape
      let result = value;

      // Store placeholders for processed markdown to avoid conflicts
      const placeholders: string[] = [];
      let placeholderIndex = 0;

      // [text](url) -> <a href="url">text</a>
      result = result.replace(/\[([^\]]+)\]\(([^)]+)\)/g, (_, text, href) => {
        const placeholder = `__MARKDOWN_PLACEHOLDER_${placeholderIndex}__`;
        placeholders[placeholderIndex] = `<a href="${sanitizeHref(href)}">${escapeHtml(text)}</a>`;
        placeholderIndex++;
        return placeholder;
      });

      // **bold** -> <strong>text</strong>
      result = result.replace(/\*\*(.*?)\*\*/g, (_, text) => {
        const placeholder = `__MARKDOWN_PLACEHOLDER_${placeholderIndex}__`;
        placeholders[placeholderIndex] = `<strong>${escapeHtml(text)}</strong>`;
        placeholderIndex++;
        return placeholder;
      });

      // *italic* -> <em>text</em>
      result = result.replace(/\*(.*?)\*/g, (_, text) => {
        const placeholder = `__MARKDOWN_PLACEHOLDER_${placeholderIndex}__`;
        placeholders[placeholderIndex] = `<em>${escapeHtml(text)}</em>`;
        placeholderIndex++;
        return placeholder;
      });

      // `code` -> <code>text</code>
      result = result.replace(/`(.*?)`/g, (_, text) => {
        const placeholder = `__MARKDOWN_PLACEHOLDER_${placeholderIndex}__`;
        placeholders[placeholderIndex] = `<code>${escapeHtml(text)}</code>`;
        placeholderIndex++;
        return placeholder;
      });

      // Escape any remaining text that wasn't part of markdown
      result = escapeHtml(result);

      // Restore placeholders
      for (let i = 0; i < placeholders.length; i++) {
        result = result.replace(`__MARKDOWN_PLACEHOLDER_${i}__`, placeholders[i]);
      }

      return result;
    },
  };
}