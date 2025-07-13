// Zero-dependency spinner implementation
import { colors } from './colors.js';

const spinnerFrames = ['⠋', '⠙', '⠹', '⠸', '⠼', '⠴', '⠦', '⠧', '⠇', '⠏'];

export class Spinner {
  private intervalId?: NodeJS.Timeout;
  private currentFrame = 0;
  private text: string;
  private isSpinning = false;

  constructor(text = '') {
    this.text = text;
  }

  start(text?: string): this {
    if (text) this.text = text;
    
    if (this.isSpinning) return this;
    this.isSpinning = true;
    
    // Hide cursor
    process.stdout.write('\x1B[?25l');
    
    this.intervalId = setInterval(() => {
      this.render();
      this.currentFrame = (this.currentFrame + 1) % spinnerFrames.length;
    }, 80);
    
    return this;
  }

  stop(): this {
    if (!this.isSpinning) return this;
    
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = undefined;
    }
    
    this.isSpinning = false;
    this.clearLine();
    
    // Show cursor
    process.stdout.write('\x1B[?25h');
    
    return this;
  }

  succeed(text?: string): this {
    this.stop();
    const message = text || this.text;
    console.log(colors.green('✓') + ' ' + message);
    return this;
  }

  fail(text?: string): this {
    this.stop();
    const message = text || this.text;
    console.log(colors.red('✗') + ' ' + message);
    return this;
  }

  warn(text?: string): this {
    this.stop();
    const message = text || this.text;
    console.log(colors.yellow('⚠') + ' ' + message);
    return this;
  }

  info(text?: string): this {
    this.stop();
    const message = text || this.text;
    console.log(colors.blue('ℹ') + ' ' + message);
    return this;
  }

  set(text: string): this {
    this.text = text;
    return this;
  }

  private render(): void {
    const frame = spinnerFrames[this.currentFrame];
    const line = colors.cyan(frame) + ' ' + this.text;
    
    this.clearLine();
    process.stdout.write(line);
  }

  private clearLine(): void {
    process.stdout.write('\r\x1B[K');
  }
}

export function createSpinner(text = ''): Spinner {
  return new Spinner(text);
}