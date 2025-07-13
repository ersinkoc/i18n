// Zero-dependency command line parser
import { colors } from './colors.js';

interface CommandOption {
  flags: string;
  description: string;
  defaultValue?: any;
  required?: boolean;
}

interface Command {
  name: string;
  description: string;
  options: CommandOption[];
  action?: (options: any, ...args: any[]) => void | Promise<void>;
}

export class Commander {
  private commands: Map<string, Command> = new Map();
  private globalOptions: CommandOption[] = [];
  private programName = 'cli';
  private programDescription = '';
  private programVersion = '1.0.0';

  name(name: string): this {
    this.programName = name;
    return this;
  }

  description(desc: string): this {
    this.programDescription = desc;
    return this;
  }

  version(version: string): this {
    this.programVersion = version;
    return this;
  }

  option(flags: string, description: string, defaultValue?: any): this {
    this.globalOptions.push({ flags, description, defaultValue });
    return this;
  }

  command(name: string): CommandBuilder {
    const command: Command = {
      name,
      description: '',
      options: [],
    };
    
    this.commands.set(name, command);
    return new CommandBuilder(command);
  }

  async parse(argv: string[] = process.argv): Promise<void> {
    const args = argv.slice(2);
    
    if (args.length === 0 || args.includes('--help') || args.includes('-h')) {
      this.showHelp();
      return;
    }
    
    if (args.includes('--version') || args.includes('-V')) {
      console.log(this.programVersion);
      return;
    }
    
    const commandName = args[0];
    const command = this.commands.get(commandName);
    
    if (!command) {
      console.error(colors.red(`Unknown command: ${commandName}`));
      this.showHelp();
      process.exit(1);
    }
    
    const options = this.parseOptions(args.slice(1), [...this.globalOptions, ...command.options]);
    
    if (command.action) {
      try {
        await command.action(options);
      } catch (error) {
        console.error(colors.red('Error:'), error instanceof Error ? error.message : String(error));
        process.exit(1);
      }
    }
  }

  private parseOptions(args: string[], optionDefinitions: CommandOption[]): any {
    const options: any = {};
    const optionMap = new Map<string, CommandOption>();
    
    // Build option map
    for (const option of optionDefinitions) {
      const [shortFlag, longFlag] = this.parseFlags(option.flags);
      if (shortFlag) optionMap.set(shortFlag, option);
      if (longFlag) optionMap.set(longFlag, option);
      
      // Set default values
      if (option.defaultValue !== undefined) {
        const key = this.getOptionKey(option.flags);
        options[key] = option.defaultValue;
      }
    }
    
    // Parse arguments
    for (let i = 0; i < args.length; i++) {
      const arg = args[i];
      
      if (arg.startsWith('-')) {
        const option = optionMap.get(arg);
        if (!option) {
          console.error(colors.red(`Unknown option: ${arg}`));
          process.exit(1);
        }
        
        const key = this.getOptionKey(option.flags);
        
        // Check if it's a boolean flag or has a value
        if (this.isBooleanOption(option)) {
          options[key] = true;
        } else {
          i++;
          if (i >= args.length) {
            console.error(colors.red(`Option ${arg} requires a value`));
            process.exit(1);
          }
          options[key] = args[i];
        }
      }
    }
    
    // Check required options
    for (const option of optionDefinitions) {
      if (option.required) {
        const key = this.getOptionKey(option.flags);
        if (options[key] === undefined) {
          console.error(colors.red(`Required option missing: ${option.flags}`));
          process.exit(1);
        }
      }
    }
    
    return options;
  }

  private parseFlags(flags: string): [string?, string?] {
    const parts = flags.split(/,\s*/);
    let shortFlag: string | undefined;
    let longFlag: string | undefined;
    
    for (const part of parts) {
      const trimmed = part.trim();
      if (trimmed.startsWith('--')) {
        longFlag = trimmed;
      } else if (trimmed.startsWith('-')) {
        shortFlag = trimmed;
      }
    }
    
    return [shortFlag, longFlag];
  }

  private getOptionKey(flags: string): string {
    const [, longFlag] = this.parseFlags(flags);
    if (longFlag) {
      return longFlag.replace(/^--/, '').replace(/-/g, '_');
    }
    
    const [shortFlag] = this.parseFlags(flags);
    return shortFlag!.replace(/^-/, '');
  }

  private isBooleanOption(option: CommandOption): boolean {
    return !option.flags.includes('<') && !option.flags.includes('[');
  }

  private showHelp(): void {
    console.log(colors.bold(this.programName));
    if (this.programDescription) {
      console.log(this.programDescription);
    }
    console.log();
    
    console.log(colors.bold('Usage:'));
    console.log(`  ${this.programName} [command] [options]`);
    console.log();
    
    if (this.commands.size > 0) {
      console.log(colors.bold('Commands:'));
      for (const [name, command] of this.commands) {
        console.log(`  ${name.padEnd(15)} ${command.description}`);
      }
      console.log();
    }
    
    if (this.globalOptions.length > 0) {
      console.log(colors.bold('Options:'));
      for (const option of this.globalOptions) {
        console.log(`  ${option.flags.padEnd(20)} ${option.description}`);
      }
      console.log();
    }
    
    console.log(colors.bold('Global Options:'));
    console.log('  -h, --help         Show help');
    console.log('  -V, --version      Show version');
  }
}

class CommandBuilder {
  constructor(private command: Command) {}

  description(desc: string): this {
    this.command.description = desc;
    return this;
  }

  option(flags: string, description: string, defaultValue?: any): this {
    this.command.options.push({ flags, description, defaultValue });
    return this;
  }

  action(fn: (options: any, ...args: any[]) => void | Promise<void>): this {
    this.command.action = fn;
    return this;
  }
}

export function createCommander(): Commander {
  return new Commander();
}