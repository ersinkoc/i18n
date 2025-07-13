import { describe, expect, it, vi } from 'vitest';
import { colors } from '../utils/colors.js';
import { createSpinner } from '../utils/spinner.js';
import { createCommander } from '../utils/commander.js';
import { glob } from '../utils/glob.js';

describe('Colors', () => {
  it('should apply colors when supported', () => {
    // Mock TTY environment
    const originalIsTTY = process.stdout.isTTY;
    process.stdout.isTTY = true;
    delete process.env.NO_COLOR;

    expect(colors.red('test')).toBe('\x1b[31mtest\x1b[0m');
    expect(colors.green('test')).toBe('\x1b[32mtest\x1b[0m');
    expect(colors.blue('test')).toBe('\x1b[34mtest\x1b[0m');
    expect(colors.bold('test')).toBe('\x1b[1mtest\x1b[0m');

    process.stdout.isTTY = originalIsTTY;
  });

  it('should not apply colors when not supported', () => {
    const originalIsTTY = process.stdout.isTTY;
    process.stdout.isTTY = false;

    expect(colors.red('test')).toBe('test');
    expect(colors.green('test')).toBe('test');

    process.stdout.isTTY = originalIsTTY;
  });

  it('should respect NO_COLOR environment variable', () => {
    process.env.NO_COLOR = '1';

    expect(colors.red('test')).toBe('test');
    expect(colors.green('test')).toBe('test');

    delete process.env.NO_COLOR;
  });

  it('should provide semantic colors', () => {
    const originalIsTTY = process.stdout.isTTY;
    process.stdout.isTTY = true;

    expect(colors.error('test')).toContain('\x1b[31m'); // red
    expect(colors.success('test')).toContain('\x1b[32m'); // green
    expect(colors.warning('test')).toContain('\x1b[33m'); // yellow
    expect(colors.info('test')).toContain('\x1b[34m'); // blue

    process.stdout.isTTY = originalIsTTY;
  });
});

describe('Spinner', () => {
  it('should create a spinner', () => {
    const spinner = createSpinner('Loading...');
    expect(spinner).toBeDefined();
  });

  it('should start and stop spinner', () => {
    const spinner = createSpinner('Loading...');
    
    // Mock stdout.write
    const writeSpy = vi.spyOn(process.stdout, 'write').mockImplementation(() => true);
    
    spinner.start();
    expect(writeSpy).toHaveBeenCalled();
    
    spinner.stop();
    expect(writeSpy).toHaveBeenCalledWith('\x1B[?25h'); // Show cursor
    
    writeSpy.mockRestore();
  });

  it('should handle success state', () => {
    const spinner = createSpinner('Loading...');
    const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    
    spinner.succeed('Done!');
    expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('✓'));
    expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('Done!'));
    
    consoleSpy.mockRestore();
  });

  it('should handle failure state', () => {
    const spinner = createSpinner('Loading...');
    const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    
    spinner.fail('Failed!');
    expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('✗'));
    expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('Failed!'));
    
    consoleSpy.mockRestore();
  });

  it('should update spinner text', () => {
    const spinner = createSpinner('Initial...');
    
    spinner.set('Updated...');
    expect(spinner).toBeDefined(); // Text is internal, just verify it doesn't crash
  });
});

describe('Commander', () => {
  it('should create a command parser', () => {
    const commander = createCommander();
    expect(commander).toBeDefined();
  });

  it('should set program information', () => {
    const commander = createCommander()
      .name('test-cli')
      .description('Test CLI')
      .version('1.0.0');
    
    expect(commander).toBeDefined();
  });

  it('should add commands', () => {
    const commander = createCommander();
    
    const command = commander
      .command('test')
      .description('Test command')
      .option('-f, --flag', 'Test flag')
      .action(() => {});
    
    expect(command).toBeDefined();
  });

  it('should parse simple commands', async () => {
    const commander = createCommander();
    let actionCalled = false;
    
    commander
      .command('test')
      .action(() => {
        actionCalled = true;
      });
    
    await commander.parse(['node', 'script', 'test']);
    expect(actionCalled).toBe(true);
  });

  it('should parse options', async () => {
    const commander = createCommander();
    let receivedOptions: any = {};
    
    commander
      .command('test')
      .option('-n, --name <name>', 'Name option')
      .option('-f, --flag', 'Flag option')
      .action((options) => {
        receivedOptions = options;
      });
    
    await commander.parse(['node', 'script', 'test', '-n', 'John', '-f']);
    expect(receivedOptions.name).toBe('John');
    expect(receivedOptions.flag).toBe(true);
  });

  it('should handle unknown commands', async () => {
    const commander = createCommander();
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    const exitSpy = vi.spyOn(process, 'exit').mockImplementation(() => {
      throw new Error('Process exit called');
    });
    
    await expect(commander.parse(['node', 'script', 'unknown'])).rejects.toThrow('Process exit called');
    
    expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('Unknown command'));
    expect(exitSpy).toHaveBeenCalledWith(1);
    
    consoleSpy.mockRestore();
    exitSpy.mockRestore();
  });

  it('should show help', async () => {
    const commander = createCommander()
      .name('test-cli')
      .description('Test CLI');
    
    const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    
    await commander.parse(['node', 'script', '--help']);
    
    expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('test-cli'));
    expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('Test CLI'));
    
    consoleSpy.mockRestore();
  });
});

describe('Glob', () => {
  it('should match simple patterns', async () => {
    // This is a basic test - in real scenarios, you'd use a temp directory
    const pattern = '*.json';
    const files = await glob(pattern, process.cwd());
    
    // Should return array (might be empty if no JSON files in test dir)
    expect(Array.isArray(files)).toBe(true);
  });

  it('should handle glob patterns with braces', async () => {
    const pattern = '*.{js,ts}';
    const files = await glob(pattern, process.cwd());
    
    expect(Array.isArray(files)).toBe(true);
  });

  it('should handle double star patterns', async () => {
    const pattern = '**/*.ts';
    const files = await glob(pattern, process.cwd());
    
    expect(Array.isArray(files)).toBe(true);
    // Should include TypeScript files
    expect(files.length).toBeGreaterThan(0);
  });

  it('should return sorted results', async () => {
    const files = await glob('**/*.ts', process.cwd());
    
    if (files.length > 1) {
      const sorted = [...files].sort();
      expect(files).toEqual(sorted);
    }
  });

  it('should handle non-existent directories gracefully', async () => {
    const files = await glob('*.js', '/non/existent/path');
    expect(files).toEqual([]);
  });
});