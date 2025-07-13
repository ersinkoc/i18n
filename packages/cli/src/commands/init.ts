import { promises as fs } from 'fs';
import path from 'path';
import { colors } from '../utils/colors.js';
import { createSpinner } from '../utils/spinner.js';
import { createPrompts } from '../utils/prompts.js';

interface InitOptions {
  framework?: string;
  typescript?: boolean;
}

export async function init(options: InitOptions) {
  try {
    console.log(colors.blue('\n🌍 Initializing @oxog/i18n\n'));
    
    const prompts = createPrompts();
  
  let framework = options.framework;
  if (!framework) {
    framework = await prompts.select({
      message: 'Which framework are you using?',
      choices: [
        { title: 'React', value: 'react' },
        { title: 'Vue', value: 'vue' },
        { title: 'Svelte', value: 'svelte' },
        { title: 'None (Vanilla)', value: 'vanilla' },
      ],
      initial: 0,
    });
  }
  
  let typescript = options.typescript;
  if (typescript === undefined) {
    typescript = await prompts.confirm({
      message: 'Are you using TypeScript?',
      initial: true,
    });
  }
  
  const localesPath = await prompts.text({
    message: 'Where should translation files be stored?',
    initial: './src/locales',
  });
  
  const defaultLocale = await prompts.text({
    message: 'What is your default locale?',
    initial: 'en',
  });
  
  const additionalLocales = await prompts.list({
    message: 'Additional locales',
  });
  
  prompts.close();
  
  const config = {
    framework,
    typescript,
    localesPath,
    defaultLocale,
    additionalLocales: additionalLocales.filter(Boolean),
  };
  
  const spinner = createSpinner('Setting up @oxog/i18n').start();
  
  try {
    // Create locales directory
    await fs.mkdir(config.localesPath, { recursive: true });
    
    // Create default locale file
    const defaultMessages = {
      welcome: 'Welcome to {{appName}}!',
      'common.yes': 'Yes',
      'common.no': 'No',
      'common.cancel': 'Cancel',
      'common.save': 'Save',
    };
    
    await fs.writeFile(
      path.join(config.localesPath, `${config.defaultLocale}.json`),
      JSON.stringify(defaultMessages, null, 2)
    );
    
    // Create additional locale files
    for (const locale of config.additionalLocales) {
      await fs.writeFile(
        path.join(config.localesPath, `${locale}.json`),
        JSON.stringify(defaultMessages, null, 2)
      );
    }
    
    // Create config file
    const configContent = config.typescript
      ? generateTypeScriptConfig(config)
      : generateJavaScriptConfig(config);
    
    const configFileName = config.typescript ? 'i18n.config.ts' : 'i18n.config.js';
    await fs.writeFile(path.join('./src', configFileName), configContent);
    
    // Create types file if TypeScript
    if (config.typescript) {
      const typesContent = generateTypes();
      await fs.writeFile(path.join('./src/types', 'i18n.d.ts'), typesContent);
      await fs.mkdir(path.join('./src/types'), { recursive: true });
    }
    
    spinner.succeed('Setup complete!');
    
    console.log('\n' + colors.green('✨ Next steps:'));
    console.log(colors.gray('1. Install the required packages:'));
    console.log(colors.cyan(`   npm install @oxog/i18n${config.framework !== 'vanilla' ? ` @oxog/i18n-${config.framework}` : ''}`));
    console.log(colors.gray('2. Import and use the i18n configuration:'));
    console.log(colors.cyan(`   import { i18n } from './src/${configFileName}'`));
    
    if (config.framework === 'react') {
      console.log(colors.gray('3. Wrap your app with I18nProvider:'));
      console.log(colors.cyan('   <I18nProvider i18n={i18n}><App /></I18nProvider>'));
    }
    
  } catch (error) {
    spinner.fail('Setup failed');
    console.error(error);
    process.exit(1);
  }
}

function generateTypeScriptConfig(config: any): string {
  const framework = config.framework;
  const imports = [`import { createI18n } from '@oxog/i18n';`];
  
  if (framework !== 'vanilla') {
    imports.push(`// import { I18nProvider } from '@oxog/i18n-${framework}';`);
  }
  
  return `${imports.join('\n')}
import type { Messages } from './types/i18n';
import en from '${config.localesPath}/en.json';
${config.additionalLocales.map((locale: string) => `import ${locale} from '${config.localesPath}/${locale}.json';`).join('\n')}

export const i18n = createI18n<Messages>({
  locale: '${config.defaultLocale}',
  fallbackLocale: '${config.defaultLocale}',
  messages: {
    en,
    ${config.additionalLocales.join(',\n    ')}
  },
  warnOnMissingTranslations: process.env.NODE_ENV !== 'production',
});
`;
}

function generateJavaScriptConfig(config: any): string {
  const framework = config.framework;
  const imports = [`import { createI18n } from '@oxog/i18n';`];
  
  if (framework !== 'vanilla') {
    imports.push(`// import { I18nProvider } from '@oxog/i18n-${framework}';`);
  }
  
  return `${imports.join('\n')}
import en from '${config.localesPath}/en.json';
${config.additionalLocales.map((locale: string) => `import ${locale} from '${config.localesPath}/${locale}.json';`).join('\n')}

export const i18n = createI18n({
  locale: '${config.defaultLocale}',
  fallbackLocale: '${config.defaultLocale}',
  messages: {
    en,
    ${config.additionalLocales.join(',\n    ')}
  },
  warnOnMissingTranslations: process.env.NODE_ENV !== 'production',
});
`;
}

function generateTypes(): string {
  return `import type enMessages from '../locales/en.json';

export type Messages = typeof enMessages;

declare module '@oxog/i18n' {
  interface CustomMessages extends Messages {}
}
`;
}