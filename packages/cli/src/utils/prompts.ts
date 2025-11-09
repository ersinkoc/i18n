// Zero-dependency prompts implementation
import { createInterface } from 'readline';
import { colors } from './colors.js';

interface PromptOptions {
  message: string;
  initial?: string | boolean | number;
  choices?: Array<{ title: string; value: string; description?: string }>;
  validate?: (value: string) => boolean | string;
  format?: (value: string) => string;
}

export class Prompts {
  private readline = createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  async text(options: PromptOptions): Promise<string> {
    return new Promise((resolve) => {
      const prompt = `${colors.cyan('?')} ${options.message}${
        options.initial ? colors.gray(` (${options.initial})`) : ''
      }: `;
      
      this.readline.question(prompt, (answer) => {
        const value = answer.trim() || String(options.initial || '');
        
        if (options.validate) {
          const validation = options.validate(value);
          if (validation !== true) {
            console.log(colors.red(typeof validation === 'string' ? validation : 'Invalid input'));
            resolve(this.text(options));
            return;
          }
        }
        
        resolve(options.format ? options.format(value) : value);
      });
    });
  }

  async confirm(options: PromptOptions): Promise<boolean> {
    const initial = options.initial as boolean;
    const defaultText = initial ? 'Y/n' : 'y/N';
    
    return new Promise((resolve) => {
      const prompt = `${colors.cyan('?')} ${options.message} ${colors.gray(`(${defaultText})`)}: `;
      
      this.readline.question(prompt, (answer) => {
        const trimmed = answer.trim().toLowerCase();
        
        if (trimmed === '') {
          resolve(initial);
        } else if (trimmed === 'y' || trimmed === 'yes') {
          resolve(true);
        } else if (trimmed === 'n' || trimmed === 'no') {
          resolve(false);
        } else {
          console.log(colors.red('Please answer yes or no'));
          resolve(this.confirm(options));
        }
      });
    });
  }

  async select(options: PromptOptions): Promise<string> {
    const choices = options.choices || [];
    const initial = typeof options.initial === 'number' ? options.initial : 0;
    
    console.log(`${colors.cyan('?')} ${options.message}`);
    choices.forEach((choice, index) => {
      const marker = index === initial ? colors.cyan('❯') : ' ';
      const title = index === initial ? colors.cyan(choice.title) : choice.title;
      const desc = choice.description ? colors.gray(` - ${choice.description}`) : '';
      console.log(`${marker} ${title}${desc}`);
    });
    
    return new Promise((resolve) => {
      let selectedIndex = initial;

      const onKeypress = (_str: string, key: any) => {
        if (key.name === 'up' && selectedIndex > 0) {
          selectedIndex--;
          this.redrawChoices(options.message, choices, selectedIndex);
        } else if (key.name === 'down' && selectedIndex < choices.length - 1) {
          selectedIndex++;
          this.redrawChoices(options.message, choices, selectedIndex);
        } else if (key.name === 'return') {
          process.stdin.removeListener('keypress', onKeypress);
          process.stdin.setRawMode(false);
          resolve(choices[selectedIndex].value);
        } else if (key.ctrl && key.name === 'c') {
          process.exit(0);
        }
      };
      
      process.stdin.setRawMode(true);
      process.stdin.on('keypress', onKeypress);
      process.stdin.resume();
    });
  }

  async list(options: PromptOptions): Promise<string[]> {
    const result = await this.text({
      ...options,
      message: `${options.message} (comma-separated)`,
    });
    
    return result.split(',').map(item => item.trim()).filter(Boolean);
  }

  private redrawChoices(message: string, choices: any[], selectedIndex: number): void {
    // Move cursor up to redraw
    process.stdout.write(`\x1B[${choices.length + 1}A`);
    
    console.log(`${colors.cyan('?')} ${message}`);
    choices.forEach((choice, index) => {
      const marker = index === selectedIndex ? colors.cyan('❯') : ' ';
      const title = index === selectedIndex ? colors.cyan(choice.title) : choice.title;
      const desc = choice.description ? colors.gray(` - ${choice.description}`) : '';
      console.log(`${marker} ${title}${desc}`);
    });
  }

  close(): void {
    this.readline.close();
  }
}

export function createPrompts(): Prompts {
  return new Prompts();
}