export interface I18nPluginOptions {
  /**
   * Glob patterns for files to include
   * @default ['src/**\/*.{ts,tsx,js,jsx}']
   */
  include?: string[];
  
  /**
   * Glob patterns for files to exclude
   * @default ['node_modules/**']
   */
  exclude?: string[];
  
  /**
   * Directory containing translation files
   * @default './src/locales'
   */
  localesDir?: string;
  
  /**
   * TypeScript generation options
   */
  typescript?: {
    /**
     * Generate TypeScript types from translation files
     * @default true
     */
    generate?: boolean;
    
    /**
     * Output file for generated types
     * @default './src/types/i18n.d.ts'
     */
    outputFile?: string;
  };
  
  /**
   * Enable bundle optimization
   * @default true
   */
  optimize?: boolean;
  
  /**
   * Enable HMR for translation files
   * @default true
   */
  hmr?: boolean;
}

export interface TransformOptions {
  isProduction: boolean;
  optimize: boolean;
}

export interface OptimizeOptions {
  localesDir: string;
}