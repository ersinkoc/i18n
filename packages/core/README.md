# @oxog/i18n

A modern, lightweight, and framework-agnostic internationalization library with TypeScript support.

## Features

- 🚀 **Lightweight**: Small bundle size with zero dependencies
- 🔥 **Fast**: Optimized performance with memoization
- 🌐 **Framework Agnostic**: Works with any JavaScript framework
- 📦 **TypeScript First**: Full TypeScript support with type safety
- 🔌 **Extensible**: Plugin system for custom functionality
- 🎯 **Simple API**: Easy to learn and use
- 💾 **Flexible Storage**: Support for multiple locale loading strategies

## Installation

```bash
npm install @oxog/i18n
# or
pnpm add @oxog/i18n
# or
yarn add @oxog/i18n
```

## Quick Start

```typescript
import { createI18n } from '@oxog/i18n';

// Create i18n instance
const i18n = createI18n({
  locale: 'en',
  fallbackLocale: 'en',
  messages: {
    en: {
      greeting: 'Hello, {name}!',
      messages: {
        welcome: 'Welcome to our app'
      }
    },
    es: {
      greeting: '¡Hola, {name}!',
      messages: {
        welcome: 'Bienvenido a nuestra aplicación'
      }
    }
  }
});

// Use translations
console.log(i18n.t('greeting', { name: 'World' })); // Hello, World!
console.log(i18n.t('messages.welcome')); // Welcome to our app

// Change locale
i18n.setLocale('es');
console.log(i18n.t('greeting', { name: 'Mundo' })); // ¡Hola, Mundo!
```

## API Reference

### `createI18n(options)`

Creates a new i18n instance.

#### Options

- `locale`: Current locale (default: 'en')
- `fallbackLocale`: Fallback locale when translation is missing
- `messages`: Translation messages object
- `plugins`: Array of plugins to use
- `interpolation`: Custom interpolation options
- `missing`: Custom missing translation handler

### Instance Methods

#### `t(key, params?, options?)`

Get a translation for the given key.

```typescript
i18n.t('greeting', { name: 'Alice' });
i18n.t('user.profile.title');
```

#### `setLocale(locale)`

Change the current locale.

```typescript
i18n.setLocale('fr');
```

#### `getLocale()`

Get the current locale.

```typescript
const currentLocale = i18n.getLocale(); // 'en'
```

#### `hasTranslation(key, locale?)`

Check if a translation exists.

```typescript
if (i18n.hasTranslation('feature.title')) {
  // Translation exists
}
```

#### `addMessages(locale, messages)`

Add translations for a locale.

```typescript
i18n.addMessages('de', {
  greeting: 'Hallo, {name}!'
});
```

## Advanced Features

### Interpolation

```typescript
// Basic interpolation
i18n.t('greeting', { name: 'World' }); // Hello, World!

// Custom interpolation pattern
const i18n = createI18n({
  interpolation: {
    prefix: '{{',
    suffix: '}}'
  }
});
```

### Pluralization

```typescript
const messages = {
  items: {
    zero: 'No items',
    one: 'One item',
    other: '{count} items'
  }
};

i18n.t('items', { count: 0 }); // No items
i18n.t('items', { count: 1 }); // One item
i18n.t('items', { count: 5 }); // 5 items
```

### Plugins

```typescript
import { createI18n, ICUPlugin } from '@oxog/i18n';

const i18n = createI18n({
  plugins: [ICUPlugin()],
  messages: {
    en: {
      greeting: 'Hello, {name}! You have {count, plural, =0 {no messages} =1 {one message} other {# messages}}.'
    }
  }
});
```

### Missing Translations

```typescript
const i18n = createI18n({
  missing: (key, locale) => {
    console.warn(`Missing translation: ${key} for locale: ${locale}`);
    return key; // Return the key as fallback
  }
});
```

## TypeScript Support

```typescript
// Define your message schema
type MessageSchema = {
  greeting: string;
  user: {
    profile: {
      title: string;
      description: string;
    };
  };
};

// Create typed i18n instance
const i18n = createI18n<MessageSchema>({
  locale: 'en',
  messages: {
    en: {
      greeting: 'Hello!',
      user: {
        profile: {
          title: 'Profile',
          description: 'User profile page'
        }
      }
    }
  }
});

// Now you get full type safety
i18n.t('greeting'); // ✅ Valid
i18n.t('user.profile.title'); // ✅ Valid
i18n.t('invalid.key'); // ❌ TypeScript error
```

## Performance

The library is optimized for performance with:

- Memoization of translation lookups
- Efficient message traversal
- Minimal bundle size
- No runtime dependencies

## Browser Support

- Modern browsers (Chrome, Firefox, Safari, Edge)
- Node.js 18+

## License

MIT © Ersin Koç

## Contributing

Contributions are welcome! Please read our [Contributing Guide](https://github.com/ersinkoc/i18n/blob/main/CONTRIBUTING.md) for details.

## Links

- [GitHub Repository](https://github.com/ersinkoc/i18n)
- [NPM Package](https://www.npmjs.com/package/@oxog/i18n)
- [Documentation](https://github.com/ersinkoc/i18n#readme)