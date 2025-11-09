import { promises as fs } from 'fs';
import path from 'path';
import { colors } from '../utils/colors.js';
import { createSpinner } from '../utils/spinner.js';
import { createPrompts } from '../utils/prompts.js';

interface SyncOptions {
  source: string;
  target?: string;
  path: string;
}

export async function sync(options: SyncOptions) {
  const spinner = createSpinner('Loading translations').start();
  
  try {
    // Load source translations
    const sourceFile = path.join(options.path, `${options.source}.json`);
    const sourceContent = await fs.readFile(sourceFile, 'utf-8');

    let sourceTranslations;
    try {
      sourceTranslations = JSON.parse(sourceContent);
    } catch (parseError) {
      spinner.fail(`Failed to parse source file: ${sourceFile}`);
      console.error(
        colors.red(
          `  JSON parse error: ${parseError instanceof Error ? parseError.message : String(parseError)}`
        )
      );
      process.exit(1);
    }
    
    // Get target locales
    let targetLocales: string[] = [];
    
    if (options.target) {
      targetLocales = options.target.split(',').map(l => l.trim());
    } else {
      // Find all locale files
      const files = await fs.readdir(options.path);
      const localeFiles = files.filter(f => f.endsWith('.json') && f !== `${options.source}.json`);
      targetLocales = localeFiles.map(f => path.basename(f, '.json'));
    }
    
    spinner.set(`Syncing to ${targetLocales.length} locales`);
    
    const syncResults: Record<string, { added: number; updated: number }> = {};
    
    for (const locale of targetLocales) {
      const targetFile = path.join(options.path, `${locale}.json`);
      let targetTranslations = {};
      
      // Load existing target translations
      try {
        const content = await fs.readFile(targetFile, 'utf-8');
        try {
          targetTranslations = JSON.parse(content);
        } catch (parseError) {
          spinner.fail(`Failed to parse target file: ${targetFile}`);
          console.error(
            colors.red(
              `  JSON parse error: ${parseError instanceof Error ? parseError.message : String(parseError)}`
            )
          );
          process.exit(1);
        }
      } catch (readError) {
        // File doesn't exist, will create new
        // This is expected for new locales
      }
      
      // Sync translations
      const result = syncTranslations(sourceTranslations, targetTranslations);
      syncResults[locale] = result.stats;
      
      // Ask for confirmation if there are changes
      if (result.stats.added > 0 || result.stats.updated > 0) {
        spinner.stop();
        
        console.log(`\n${colors.yellow(locale)}:`);
        console.log(colors.gray(`  Added: ${result.stats.added}`));
        console.log(colors.gray(`  Updated: ${result.stats.updated}`));
        
        const prompts = createPrompts();
        const confirm = await prompts.confirm({
          message: `Apply changes to ${locale}?`,
          initial: true,
        });
        prompts.close();
        
        if (confirm) {
          await fs.writeFile(targetFile, JSON.stringify(result.merged, null, 2));
        }
        
        spinner.start();
      }
    }
    
    spinner.succeed('Sync complete');
    
    // Show summary
    console.log('\n' + colors.green('✨ Sync summary:'));
    
    for (const [locale, stats] of Object.entries(syncResults)) {
      if (stats.added > 0 || stats.updated > 0) {
        console.log(colors.gray(`${locale}: +${stats.added} added, ~${stats.updated} updated`));
      } else {
        console.log(colors.gray(`${locale}: up to date`));
      }
    }
    
  } catch (error) {
    spinner.fail('Sync failed');
    console.error(error);
    process.exit(1);
  }
}

interface SyncResult {
  merged: any;
  stats: {
    added: number;
    updated: number;
  };
}

function syncTranslations(source: any, target: any): SyncResult {
  const stats = { added: 0, updated: 0 };
  
  function merge(src: any, tgt: any): any {
    if (typeof src !== 'object' || src === null) {
      return src;
    }
    
    const result = { ...tgt };
    
    for (const [key, value] of Object.entries(src)) {
      if (!(key in result)) {
        // New key
        result[key] = value;
        if (typeof value === 'string') {
          stats.added++;
        }
      } else if (typeof value === 'object' && value !== null) {
        // Nested object
        result[key] = merge(value, result[key] || {});
      } else if (typeof value === 'string' && result[key] !== value) {
        // Keep existing translation but track as potential update
        stats.updated++;
      }
    }
    
    return result;
  }
  
  return {
    merged: merge(source, target),
    stats,
  };
}