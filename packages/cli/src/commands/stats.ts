import { promises as fs } from 'fs';
import path from 'path';
import { colors } from '../utils/colors.js';
import { createSpinner } from '../utils/spinner.js';
import { glob } from '../utils/glob.js';

interface StatsOptions {
  path: string;
  format: 'table' | 'json';
}

interface LocaleStats {
  locale: string;
  keys: number;
  words: number;
  characters: number;
  coverage: number;
}

export async function stats(options: StatsOptions) {
  const spinner = createSpinner('Calculating statistics').start();
  
  try {
    const pattern = path.join(options.path, '*.json');
    const files = await glob(pattern);
    
    if (files.length === 0) {
      throw new Error('No translation files found');
    }
    
    const localeStats: LocaleStats[] = [];
    let maxKeys = 0;
    
    // Calculate stats for each locale
    for (const file of files) {
      const locale = path.basename(file, '.json');
      const content = await fs.readFile(file, 'utf-8');
      const translations = JSON.parse(content);
      
      const stats = calculateStats(translations);
      maxKeys = Math.max(maxKeys, stats.keys);
      
      localeStats.push({
        locale,
        ...stats,
        coverage: 0, // Will calculate after we know maxKeys
      });
    }
    
    // Calculate coverage
    localeStats.forEach(stat => {
      stat.coverage = maxKeys > 0 ? (stat.keys / maxKeys) * 100 : 100;
    });
    
    spinner.stop();
    
    // Display results
    if (options.format === 'json') {
      console.log(JSON.stringify(localeStats, null, 2));
    } else {
      displayTable(localeStats);
    }
    
  } catch (error) {
    spinner.fail('Statistics calculation failed');
    console.error(error);
    process.exit(1);
  }
}

function calculateStats(obj: any): Omit<LocaleStats, 'locale' | 'coverage'> {
  let keys = 0;
  let words = 0;
  let characters = 0;
  
  function traverse(node: any) {
    if (typeof node === 'string') {
      keys++;
      characters += node.length;
      words += node.split(/\s+/).filter(Boolean).length;
    } else if (typeof node === 'object' && node !== null) {
      Object.values(node).forEach(traverse);
    }
  }
  
  traverse(obj);
  
  return { keys, words, characters };
}

function displayTable(stats: LocaleStats[]) {
  console.log('\n' + colors.bold('Translation Statistics'));
  console.log(colors.gray('─'.repeat(60)));
  
  // Header
  console.log(
    colors.gray(
      'Locale'.padEnd(10) +
      'Keys'.padEnd(10) +
      'Words'.padEnd(10) +
      'Characters'.padEnd(15) +
      'Coverage'
    )
  );
  console.log(colors.gray('─'.repeat(60)));
  
  // Sort by coverage
  stats.sort((a, b) => b.coverage - a.coverage);
  
  // Rows
  for (const stat of stats) {
    const coverageColor = 
      stat.coverage === 100 ? colors.green :
      stat.coverage >= 80 ? colors.yellow :
      colors.red;
    
    console.log(
      stat.locale.padEnd(10) +
      stat.keys.toString().padEnd(10) +
      stat.words.toString().padEnd(10) +
      stat.characters.toString().padEnd(15) +
      coverageColor(`${stat.coverage.toFixed(1)}%`)
    );
  }
  
  console.log(colors.gray('─'.repeat(60)));
  
  // Summary
  const totalKeys = Math.max(...stats.map(s => s.keys));
  const avgCoverage = stats.reduce((sum, s) => sum + s.coverage, 0) / stats.length;
  
  console.log('\n' + colors.bold('Summary:'));
  console.log(colors.gray(`Total locales: ${stats.length}`));
  console.log(colors.gray(`Total keys: ${totalKeys}`));
  console.log(colors.gray(`Average coverage: ${avgCoverage.toFixed(1)}%`));
}