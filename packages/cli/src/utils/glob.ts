// Zero-dependency glob implementation
import { readdir, stat } from 'fs/promises';
import { join, relative, sep } from 'path';

export async function glob(pattern: string, cwd = process.cwd()): Promise<string[]> {
  const results: string[] = [];
  
  // Convert glob pattern to regex
  const regex = globToRegex(pattern);
  
  async function walk(dir: string): Promise<void> {
    try {
      const entries = await readdir(dir);
      
      for (const entry of entries) {
        const fullPath = join(dir, entry);
        const stats = await stat(fullPath);
        
        if (stats.isDirectory()) {
          // Check if we should descend into this directory
          if (shouldDescend(pattern, relative(cwd, fullPath))) {
            await walk(fullPath);
          }
        } else if (stats.isFile()) {
          const relativePath = relative(cwd, fullPath);
          if (regex.test(relativePath)) {
            results.push(fullPath);
          }
        }
      }
    } catch (error) {
      // Ignore permission errors and continue
    }
  }
  
  await walk(cwd);
  return results.sort();
}

function globToRegex(pattern: string): RegExp {
  // Escape special regex characters except glob special characters
  let regex = pattern
    .replace(/[.+^${}()|[\]\\]/g, '\\$&')
    .replace(/\*\*/g, '___DOUBLESTAR___')
    .replace(/\*/g, '[^/\\\\]*')
    .replace(/___DOUBLESTAR___/g, '.*')
    .replace(/\?/g, '[^/\\\\]');
  
  // Handle file extensions in braces like {js,ts,tsx}
  regex = regex.replace(/\\\{([^}]+)\\\}/g, (_, group) => {
    const options = group.split(',').join('|');
    return `(${options})`;
  });
  
  // Normalize path separators
  regex = regex.replace(/\//g, '[\\/\\\\]');
  
  return new RegExp(`^${regex}$`);
}

function shouldDescend(pattern: string, currentPath: string): boolean {
  // If pattern contains **, we should descend into all directories
  if (pattern.includes('**')) return true;
  
  // Check if current path is a prefix of the pattern
  const patternParts = pattern.split('/');
  const currentParts = currentPath.split(sep);
  
  if (currentParts.length >= patternParts.length) return false;
  
  for (let i = 0; i < currentParts.length; i++) {
    const patternPart = patternParts[i];
    const currentPart = currentParts[i];
    
    if (patternPart === '**') return true;
    if (patternPart !== currentPart && !isGlobMatch(patternPart, currentPart)) {
      return false;
    }
  }
  
  return true;
}

function isGlobMatch(pattern: string, text: string): boolean {
  const regex = globToRegex(pattern);
  return regex.test(text);
}

// Multiple patterns support
export async function globMultiple(patterns: string[], cwd = process.cwd()): Promise<string[]> {
  const allResults = new Set<string>();
  
  for (const pattern of patterns) {
    const results = await glob(pattern, cwd);
    results.forEach(result => allResults.add(result));
  }
  
  return Array.from(allResults).sort();
}