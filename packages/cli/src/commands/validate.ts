import { promises as fs } from 'fs';
import path from 'path';
import { colors } from '../utils/colors.js';
import { createSpinner } from '../utils/spinner.js';
import { glob } from '../utils/glob.js';

interface ValidateOptions {
  pattern: string;
  source: string;
}

export async function validate(options: ValidateOptions) {
  const spinner = createSpinner('Validating translations').start();
  
  try {
    const files = await glob(options.pattern);
    const results: Record<string, { missing: string[]; extra: string[] }> = {};
    
    // Find source file
    const sourceFile = files.find(f => path.basename(f, '.json') === options.source);
    if (!sourceFile) {
      throw new Error(`Source locale file not found: ${options.source}`);
    }
    
    // Load source translations
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

    const sourceKeys = extractKeys(sourceTranslations);
    
    // Validate each locale
    for (const file of files) {
      if (file === sourceFile) continue;
      
      const locale = path.basename(file, '.json');
      const content = await fs.readFile(file, 'utf-8');

      let translations;
      try {
        translations = JSON.parse(content);
      } catch (parseError) {
        spinner.fail(`Failed to parse ${file}`);
        console.error(
          colors.red(
            `  JSON parse error: ${parseError instanceof Error ? parseError.message : String(parseError)}`
          )
        );
        process.exit(1);
      }

      const keys = extractKeys(translations);
      
      // Find missing and extra keys
      const missing = sourceKeys.filter(key => !keys.includes(key));
      const extra = keys.filter(key => !sourceKeys.includes(key));
      
      if (missing.length > 0 || extra.length > 0) {
        results[locale] = { missing, extra };
      }
    }
    
    spinner.stop();
    
    // Display results
    if (Object.keys(results).length === 0) {
      console.log(colors.green('✓ All translations are in sync!'));
    } else {
      console.log(colors.red('\n✗ Translation issues found:\n'));
      
      for (const [locale, issues] of Object.entries(results)) {
        console.log(colors.yellow(`${locale}:`));
        
        if (issues.missing.length > 0) {
          console.log(colors.red(`  Missing keys (${issues.missing.length}):`));
          issues.missing.forEach(key => {
            console.log(colors.gray(`    - ${key}`));
          });
        }
        
        if (issues.extra.length > 0) {
          console.log(colors.blue(`  Extra keys (${issues.extra.length}):`));
          issues.extra.forEach(key => {
            console.log(colors.gray(`    - ${key}`));
          });
        }
        
        console.log();
      }
    }
    
  } catch (error) {
    spinner.fail('Validation failed');
    console.error(error);
    process.exit(1);
  }
}

function extractKeys(obj: any, prefix = ''): string[] {
  const keys: string[] = [];
  
  for (const [key, value] of Object.entries(obj)) {
    const fullKey = prefix ? `${prefix}.${key}` : key;
    
    if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
      keys.push(...extractKeys(value, fullKey));
    } else {
      keys.push(fullKey);
    }
  }
  
  return keys;
}