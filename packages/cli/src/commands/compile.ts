import { promises as fs } from 'fs';
import path from 'path';
import { colors } from '../utils/colors.js';
import { createSpinner } from '../utils/spinner.js';
import { glob } from '../utils/glob.js';

interface CompileOptions {
  input: string;
  output: string;
  format: 'json' | 'js' | 'mjs';
}

export async function compile(options: CompileOptions) {
  const spinner = createSpinner('Compiling translations').start();
  
  try {
    const pattern = path.join(options.input, '*.json');
    const files = await glob(pattern);
    
    // Create output directory
    await fs.mkdir(options.output, { recursive: true });
    
    let compiledCount = 0;
    
    for (const file of files) {
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
      
      // Optimize translations (remove empty values, minimize structure)
      const optimized = optimizeTranslations(translations);
      
      // Write compiled file
      const outputFile = path.join(options.output, `${locale}.${options.format}`);
      
      switch (options.format) {
        case 'json':
          await fs.writeFile(outputFile, JSON.stringify(optimized));
          break;
          
        case 'js':
          await fs.writeFile(
            outputFile,
            `exports.default = ${JSON.stringify(optimized)};`
          );
          break;
          
        case 'mjs':
          await fs.writeFile(
            outputFile,
            `export default ${JSON.stringify(optimized)};`
          );
          break;
      }
      
      compiledCount++;
    }
    
    // Create index file
    const indexContent = generateIndex(files, options.format);
    const indexFile = path.join(
      options.output,
      `index.${options.format === 'mjs' ? 'mjs' : 'js'}`
    );
    await fs.writeFile(indexFile, indexContent);
    
    spinner.succeed(`Compiled ${compiledCount} locale files`);
    
    // Calculate size reduction
    const originalSize = await calculateDirSize(options.input);
    const compiledSize = await calculateDirSize(options.output);
    const reduction =
      originalSize > 0
        ? ((originalSize - compiledSize) / originalSize * 100).toFixed(1)
        : '0.0';
    
    console.log('\n' + colors.green('✨ Compilation complete!'));
    console.log(colors.gray(`Files compiled: ${compiledCount}`));
    console.log(colors.gray(`Size reduction: ${reduction}%`));
    console.log(colors.gray(`Output: ${options.output}`));
    
  } catch (error) {
    spinner.fail('Compilation failed');
    console.error(error);
    process.exit(1);
  }
}

function optimizeTranslations(obj: any): any {
  if (typeof obj !== 'object' || obj === null) {
    return obj;
  }
  
  if (Array.isArray(obj)) {
    return obj.map(optimizeTranslations).filter(v => v !== null && v !== '');
  }
  
  const result: any = {};
  
  for (const [key, value] of Object.entries(obj)) {
    const optimized = optimizeTranslations(value);
    
    // Skip empty values
    if (
      optimized !== null &&
      optimized !== '' &&
      !(typeof optimized === 'object' && Object.keys(optimized).length === 0)
    ) {
      result[key] = optimized;
    }
  }
  
  return result;
}

function generateIndex(files: string[], format: string): string {
  const locales = files.map(f => path.basename(f, '.json'));
  
  if (format === 'mjs') {
    return `${locales.map(l => `import ${l} from './${l}.mjs';`).join('\n')}

export default {
  ${locales.join(',\n  ')}
};
`;
  }
  
  return `${locales.map(l => `const ${l} = require('./${l}.js').default;`).join('\n')}

module.exports = {
  ${locales.join(',\n  ')}
};
`;
}

async function calculateDirSize(dir: string): Promise<number> {
  const files = await glob(path.join(dir, '**/*'));
  let totalSize = 0;
  
  for (const file of files) {
    try {
      const stats = await fs.stat(file);
      if (stats.isFile()) {
        totalSize += stats.size;
      }
    } catch (error) {
      // Ignore errors
    }
  }
  
  return totalSize;
}