// Zero-dependency string manipulation
export interface SourceMap {
  version: number;
  sources: string[];
  names: string[];
  mappings: string;
  file?: string;
  sourceRoot?: string;
  sourcesContent?: (string | null)[];
}

interface Edit {
  start: number;
  end: number;
  content: string;
}

export class MagicString {
  private original: string;
  private edits: Edit[] = [];
  private prependContent = '';
  private appendContent = '';

  constructor(str: string) {
    this.original = str;
  }

  prepend(content: string): this {
    this.prependContent = content + this.prependContent;
    return this;
  }

  append(content: string): this {
    this.appendContent = this.appendContent + content;
    return this;
  }

  replace(searchValue: string | RegExp, replaceValue: string): this {
    if (typeof searchValue === 'string') {
      const index = this.original.indexOf(searchValue);
      if (index !== -1) {
        this.edits.push({
          start: index,
          end: index + searchValue.length,
          content: replaceValue,
        });
      }
    } else {
      // Handle regex
      let match;
      while ((match = searchValue.exec(this.original)) !== null) {
        this.edits.push({
          start: match.index,
          end: match.index + match[0].length,
          content: replaceValue,
        });
        if (!searchValue.global) break;
      }
    }
    return this;
  }

  overwrite(start: number, end: number, content: string): this {
    this.edits.push({ start, end, content });
    return this;
  }

  toString(): string {
    // Sort edits by start position (descending) to apply from end to start
    const sortedEdits = [...this.edits].sort((a, b) => b.start - a.start);
    
    let result = this.original;
    
    // Apply edits from end to start to preserve indices
    for (const edit of sortedEdits) {
      result = result.slice(0, edit.start) + edit.content + result.slice(edit.end);
    }
    
    return this.prependContent + result + this.appendContent;
  }

  generateMap(options: { hires?: boolean; file?: string; source?: string } = {}): SourceMap {
    // Simple source map implementation
    return {
      version: 3,
      sources: [options.source || 'input.js'],
      names: [],
      mappings: '', // In a real implementation, this would contain VLQ encoded mappings
      file: options.file,
      sourcesContent: [this.original],
    };
  }
}

export default MagicString;