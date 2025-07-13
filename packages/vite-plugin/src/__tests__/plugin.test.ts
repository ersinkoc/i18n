import { describe, expect, it } from 'vitest';
import { i18nPlugin } from '../index';

describe('Vite I18n Plugin', () => {
  it('should create plugin with default options', () => {
    const plugin = i18nPlugin();
    
    expect(plugin).toBeDefined();
    expect(plugin.name).toBe('vite-plugin-oxog-i18n');
    expect(typeof plugin.configResolved).toBe('function');
  });

  it('should create plugin with custom options', () => {
    const plugin = i18nPlugin({
      localesDir: './custom/locales',
      typescript: {
        generate: true,
        outputFile: './custom/i18n.d.ts'
      }
    });
    
    expect(plugin).toBeDefined();
    expect(plugin.name).toBe('vite-plugin-oxog-i18n');
  });

  it('should handle configResolved', () => {
    const plugin = i18nPlugin();
    const mockConfig = {
      command: 'serve' as const,
      mode: 'development',
      root: '/test/root'
    };

    expect(() => {
      plugin.configResolved?.(mockConfig);
    }).not.toThrow();
  });

  it('should handle buildStart', () => {
    const plugin = i18nPlugin();

    expect(() => {
      plugin.buildStart?.({});
    }).not.toThrow();
  });

  it('should handle handleHotUpdate', () => {
    const plugin = i18nPlugin();
    const mockCtx = {
      file: '/test/locales/en.json',
      modules: [],
      server: {
        ws: {
          send: () => {}
        }
      }
    };

    expect(() => {
      plugin.handleHotUpdate?.(mockCtx as any);
    }).not.toThrow();
  });
});