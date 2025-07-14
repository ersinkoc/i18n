# @oxog/i18n-vite

Vite plugin for @oxog/i18n - optimize your internationalization workflow in Vite projects.

## Features

- 🚀 **Auto Import**: Automatically import translation files
- 📦 **Bundle Optimization**: Tree-shake unused translations
- 🔥 **HMR Support**: Hot reload translations during development
- 📝 **TypeScript Generation**: Auto-generate types for your translations
- 🎯 **Virtual Modules**: Import translations as virtual modules
- 🔍 **Build-time Validation**: Validate translations during build

## Installation

```bash
npm install -D @oxog/i18n-vite
# or
pnpm add -D @oxog/i18n-vite
# or
yarn add -D @oxog/i18n-vite
```

## Quick Start

```typescript
// vite.config.ts
import { defineConfig } from 'vite';
import i18n from '@oxog/i18n-vite';

export default defineConfig({
  plugins: [
    i18n({
      locales: ['en', 'es', 'fr'],
      defaultLocale: 'en',
      localeDir: './src/locales'
    })
  ]
});
```

## Configuration

### Basic Options

```typescript
i18n({
  // Directory containing translation files
  localeDir: './src/locales',
  
  // Supported locales
  locales: ['en', 'es', 'fr', 'de'],
  
  // Default locale
  defaultLocale: 'en',
  
  // Include patterns (glob)
  include: ['src/**/*.{js,jsx,ts,tsx}'],
  
  // Exclude patterns (glob)
  exclude: ['node_modules/**', '**/*.test.*']
})
```

### Advanced Options

```typescript
i18n({
  // TypeScript generation
  typescript: {
    // Generate TypeScript definitions
    generate: true,
    
    // Output path for generated types
    outputPath: './src/types/i18n.d.ts',
    
    // Strict mode (fail on type errors)
    strict: true
  },
  
  // Bundle optimization
  optimization: {
    // Remove unused translations
    treeShake: true,
    
    // Minify translation keys
    minifyKeys: false,
    
    // Lazy load translations
    lazy: true
  },
  
  // Build-time validation
  validation: {
    // Validate on build
    enabled: true,
    
    // Fail build on errors
    failOnError: true,
    
    // Check for missing keys
    checkMissing: true,
    
    // Check for unused keys
    checkUnused: true
  },
  
  // Custom transformers
  transform: {
    // Transform translation files
    files: (content, id) => content,
    
    // Transform keys
    keys: (key) => key
  }
})
```

## Usage

### Import Translations

With the plugin configured, you can import translations directly:

```typescript
// Import all translations for a locale
import enMessages from 'virtual:i18n/locales/en';
import esMessages from 'virtual:i18n/locales/es';

// Import specific namespace
import authEn from 'virtual:i18n/locales/en/auth';

// Use with @oxog/i18n
import { createI18n } from '@oxog/i18n';

const i18n = createI18n({
  locale: 'en',
  messages: {
    en: enMessages,
    es: esMessages
  }
});
```

### Auto-imported Helpers

The plugin provides auto-imported helpers:

```typescript
// Automatically available in your app
const messages = await loadLocale('fr'); // Lazy load locale
const allMessages = await loadAllLocales(); // Load all locales
```

### TypeScript Support

With TypeScript generation enabled:

```typescript
// Auto-generated types in src/types/i18n.d.ts
import type { TranslationSchema } from './types/i18n';

// Your translations are fully typed
const translation: TranslationSchema = {
  greeting: 'Hello',
  user: {
    profile: 'Profile'
  }
};
```

### Hot Module Replacement (HMR)

Translation changes are instantly reflected during development:

```typescript
// This component will auto-update when translations change
function MyComponent() {
  const { t } = useTranslation();
  return <div>{t('greeting')}</div>;
}
```

## Virtual Modules

The plugin exposes several virtual modules:

### `virtual:i18n/locales/*`

Import translations for specific locales:

```typescript
import en from 'virtual:i18n/locales/en';
import es from 'virtual:i18n/locales/es';
import fr from 'virtual:i18n/locales/fr';
```

### `virtual:i18n/config`

Access plugin configuration:

```typescript
import { locales, defaultLocale } from 'virtual:i18n/config';

console.log(locales); // ['en', 'es', 'fr']
console.log(defaultLocale); // 'en'
```

### `virtual:i18n/utils`

Utility functions for working with translations:

```typescript
import { 
  loadLocale, 
  loadAllLocales, 
  isLocaleLoaded 
} from 'virtual:i18n/utils';

// Lazy load a locale
const messages = await loadLocale('de');

// Check if locale is loaded
if (!isLocaleLoaded('de')) {
  await loadLocale('de');
}
```

## Build Optimization

### Tree Shaking

Unused translations are automatically removed from the production bundle:

```typescript
// Only 'greeting' will be included in the bundle
function App() {
  const { t } = useTranslation();
  return <div>{t('greeting')}</div>;
}

// Translations file has many more keys that won't be bundled
```

### Code Splitting

Translations can be split by locale or namespace:

```typescript
// vite.config.ts
i18n({
  optimization: {
    lazy: true,
    splitBy: 'locale' // or 'namespace'
  }
})

// Usage - translations are loaded on demand
const messages = await import(`virtual:i18n/locales/${locale}`);
```

### Minification

Reduce bundle size by minifying translation keys:

```typescript
// Development: user.profile.title
// Production: u.p.t (with source maps)
i18n({
  optimization: {
    minifyKeys: true,
    sourceMaps: true
  }
})
```

## Integration Examples

### With React

```typescript
// main.tsx
import React from 'react';
import ReactDOM from 'react-dom/client';
import { createI18n } from '@oxog/i18n';
import { I18nProvider } from '@oxog/i18n-react';
import messages from 'virtual:i18n/locales/en';

const i18n = createI18n({
  locale: 'en',
  messages: { en: messages }
});

ReactDOM.createRoot(document.getElementById('root')!).render(
  <I18nProvider i18n={i18n}>
    <App />
  </I18nProvider>
);
```

### With Vue

```typescript
// main.ts
import { createApp } from 'vue';
import { createI18n } from '@oxog/i18n';
import { i18nPlugin } from '@oxog/i18n-vue';
import messages from 'virtual:i18n/locales/en';

const i18n = createI18n({
  locale: 'en',
  messages: { en: messages }
});

createApp(App)
  .use(i18nPlugin, { i18n })
  .mount('#app');
```

### Dynamic Locale Loading

```typescript
import { loadLocale } from 'virtual:i18n/utils';

async function changeLocale(locale: string) {
  const messages = await loadLocale(locale);
  i18n.setMessages(locale, messages);
  i18n.setLocale(locale);
}
```

## CLI Integration

Use with @oxog/i18n-cli for a complete workflow:

```json
{
  "scripts": {
    "i18n:extract": "oxog-i18n extract",
    "build": "vite build",
    "dev": "vite"
  }
}
```

## Troubleshooting

### Types not generated

Ensure TypeScript generation is enabled:

```typescript
i18n({
  typescript: {
    generate: true
  }
})
```

### HMR not working

Check that your locale files are within the configured directory:

```typescript
i18n({
  localeDir: './src/locales' // Ensure this path is correct
})
```

### Bundle size issues

Enable optimization features:

```typescript
i18n({
  optimization: {
    treeShake: true,
    minifyKeys: true,
    lazy: true
  }
})
```

## License

MIT © Ersin Koç

## Contributing

Contributions are welcome! Please read our [Contributing Guide](https://github.com/ersinkoc/i18n/blob/main/CONTRIBUTING.md) for details.

## Links

- [GitHub Repository](https://github.com/ersinkoc/i18n)
- [NPM Package](https://www.npmjs.com/package/@oxog/i18n-vite)
- [Documentation](https://github.com/ersinkoc/i18n#readme)