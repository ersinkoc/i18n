import type { Plugin } from 'vite';
import { generateTypes } from './generate-types.js';
import { optimizeBundle } from './optimize-bundle.js';
import { transformCode } from './transform.js';
import type { I18nPluginOptions } from './types.js';

export function i18nPlugin(options: I18nPluginOptions = {}): Plugin {
  try {
    const {
      include = ['src/**/*.{ts,tsx,js,jsx}'],
      exclude = ['node_modules/**'],
      localesDir = './src/locales',
      typescript = { generate: true, outputFile: './src/types/i18n.d.ts' },
      optimize = true,
      hmr = true,
    } = options;
    
    if (typeof localesDir !== 'string' || !localesDir.trim()) {
      throw new Error('[i18n-vite] localesDir must be a valid directory path');
    }
    
    let isProduction = false;
  
  return {
    name: 'vite-plugin-oxog-i18n',
    
    configResolved(config) {
      isProduction = config.command === 'build';
    },
    
    async buildStart() {
      if (typescript?.generate) {
        try {
          await generateTypes({
            localesDir,
            outputFile: typescript.outputFile!,
          });
        } catch (error) {
          this.error(`[i18n-vite] Failed to generate types: ${(error as Error).message}`);
        }
      }
    },
    
    transform(code, id) {
      try {
        // Skip files that don't match include pattern
        if (!include.some(pattern => minimatch(id, pattern))) {
          return null;
        }
        
        // Skip excluded files
        if (exclude.some(pattern => minimatch(id, pattern))) {
          return null;
        }
        
        return transformCode(code, id, {
          isProduction,
          optimize,
        });
      } catch (error) {
        this.warn(`[i18n-vite] Transform failed for ${id}: ${(error as Error).message}`);
        return null;
      }
    },
    
    handleHotUpdate({ file, server }) {
      if (!hmr) return;
      
      // Handle translation file changes
      if (file.includes(localesDir) && file.endsWith('.json')) {
        // Regenerate types if needed
        if (typescript?.generate) {
          generateTypes({
            localesDir,
            outputFile: typescript.outputFile!,
          }).catch(console.error);
        }
        
        // Trigger full reload for translation changes
        server.ws.send({
          type: 'full-reload',
          path: '*',
        });
      }
    },
    
    generateBundle(_options, bundle) {
      if (!isProduction || !optimize) return;
      
      optimizeBundle(bundle, {
        localesDir,
      });
    },
  };
  } catch (error) {
    throw new Error(`[i18n-vite] Plugin initialization failed: ${(error as Error).message}`);
  }
}

export type { I18nPluginOptions };

// Simple minimatch implementation
function minimatch(path: string, pattern: string): boolean {
  const regex = pattern
    .replace(/\*\*/g, '.*')
    .replace(/\*/g, '[^/]*')
    .replace(/\?/g, '.')
    .replace(/\{([^}]+)\}/g, (_, group) => `(${group.split(',').join('|')})`)
    .replace(/\./g, '\\.');
  
  return new RegExp(`^${regex}$`).test(path);
}