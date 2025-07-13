import { promises as fs } from 'fs';
import path from 'path';
import { colors } from '../utils/colors.js';
import { createSpinner } from '../utils/spinner.js';
import { glob } from '../utils/glob.js';

interface ExtractOptions {
  pattern: string;
  output: string;
  locales: string;
}

export async function extract(options: ExtractOptions) {
  const spinner = createSpinner('Extracting translation keys').start();
  
  try {
    const files = await glob(options.pattern);
    const keys = new Set<string>();
    
    // Regular expressions to match translation usage
    const patterns = [
      /\.t\(['"`]([^'"`]+)['"`]/g,
      /t\(['"`]([^'"`]+)['"`]/g,
      /<T\s+id=['"`]([^'"`]+)['"`]/g,
      /<Trans\s+id=['"`]([^'"`]+)['"`]/g,
    ];
    
    // Extract keys from all files
    for (const file of files) {
      const content = await fs.readFile(file, 'utf-8');
      
      for (const pattern of patterns) {
        let match;
        while ((match = pattern.exec(content)) !== null) {
          keys.add(match[1]);
        }
      }
    }
    
    spinner.text = `Found ${keys.size} translation keys`;
    
    // Create output directory
    await fs.mkdir(options.output, { recursive: true });
    
    // Process each locale
    const locales = options.locales.split(',').map(l => l.trim());
    
    for (const locale of locales) {
      const filePath = path.join(options.output, `${locale}.json`);
      let existingTranslations = {};
      
      // Load existing translations if file exists
      try {
        const content = await fs.readFile(filePath, 'utf-8');
        existingTranslations = JSON.parse(content);
      } catch {
        // File doesn't exist, start fresh
      }
      
      // Create translation object with nested structure
      const translations: any = {};
      
      for (const key of Array.from(keys).sort()) {
        const parts = key.split('.');
        let current = translations;
        
        for (let i = 0; i < parts.length - 1; i++) {
          if (!current[parts[i]]) {
            current[parts[i]] = {};
          }
          current = current[parts[i]];
        }
        
        const finalKey = parts[parts.length - 1];
        // Use existing translation or create placeholder
        current[finalKey] = getNestedValue(existingTranslations, key) || `[${key}]`;
      }
      
      // Write translations file
      await fs.writeFile(filePath, JSON.stringify(translations, null, 2));
    }
    
    spinner.succeed(`Extracted ${keys.size} keys to ${locales.length} locale files`);
    
    // Show summary
    console.log('\n' + colors.green('✨ Extraction complete!'));
    console.log(colors.gray(`Keys extracted: ${keys.size}`));
    console.log(colors.gray(`Files scanned: ${files.length}`));
    console.log(colors.gray(`Output: ${options.output}`));
    
  } catch (error) {
    spinner.fail('Extraction failed');
    console.error(error);
    process.exit(1);
  }
}

function getNestedValue(obj: any, path: string): any {
  const parts = path.split('.');
  let current = obj;
  
  for (const part of parts) {
    if (current && typeof current === 'object' && part in current) {
      current = current[part];
    } else {
      return undefined;
    }
  }
  
  return current;
}