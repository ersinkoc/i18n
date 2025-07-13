#!/usr/bin/env node
import { createCommander } from './utils/commander.js';
import { compile } from './commands/compile.js';
import { extract } from './commands/extract.js';
import { init } from './commands/init.js';
import { stats } from './commands/stats.js';
import { sync } from './commands/sync.js';
import { validate } from './commands/validate.js';

// Global error handler
process.on('uncaughtException', (error) => {
  console.error('[CLI] Uncaught exception:', error.message);
  if (process.env.NODE_ENV !== 'production') {
    console.error(error.stack);
  }
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('[CLI] Unhandled rejection at:', promise, 'reason:', reason);
  if (process.env.NODE_ENV !== 'production') {
    console.error((reason as Error)?.stack);
  }
  process.exit(1);
});

try {
  const program = createCommander()
    .name('oxog-i18n')
    .description('CLI tool for @oxog/i18n')
    .version('0.0.0');

program
  .command('init')
  .description('Initialize i18n in your project')
  .option('-f, --framework <framework>', 'Framework to use (react, vue, svelte)')
  .option('-t, --typescript', 'Use TypeScript')
  .action(init);

program
  .command('extract')
  .description('Extract translation keys from source code')
  .option('-p, --pattern <pattern>', 'Glob pattern for files', 'src/**/*.{ts,tsx,js,jsx}')
  .option('-o, --output <path>', 'Output directory for translations', './src/locales')
  .option('-l, --locales <locales>', 'Comma-separated list of locales', 'en')
  .action(extract);

program
  .command('validate')
  .description('Validate translations for missing keys')
  .option('-p, --pattern <pattern>', 'Glob pattern for translation files', './src/locales/**/*.json')
  .option('-s, --source <locale>', 'Source locale to compare against', 'en')
  .action(validate);

program
  .command('compile')
  .description('Pre-compile translations for production')
  .option('-i, --input <path>', 'Input directory', './src/locales')
  .option('-o, --output <path>', 'Output directory', './dist/locales')
  .option('-f, --format <format>', 'Output format (json, js, mjs)', 'json')
  .action(compile);

program
  .command('sync')
  .description('Sync translations across locales')
  .option('-s, --source <locale>', 'Source locale', 'en')
  .option('-t, --target <locales>', 'Target locales (comma-separated)')
  .option('-p, --path <path>', 'Translation files path', './src/locales')
  .action(sync);

program
  .command('stats')
  .description('Show translation coverage statistics')
  .option('-p, --path <path>', 'Translation files path', './src/locales')
  .option('-f, --format <format>', 'Output format (table, json)', 'table')
  .action(stats);

  program.parse();
} catch (error) {
  console.error('[CLI] Fatal error during initialization:', (error as Error).message);
  if (process.env.NODE_ENV !== 'production') {
    console.error((error as Error).stack);
  }
  process.exit(1);
}