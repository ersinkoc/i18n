# @oxog/i18n-react

React bindings for @oxog/i18n - seamless internationalization for React applications.

## Features

- 🎯 **React Hooks**: Modern hooks API for translations
- 🔄 **Context Provider**: Share i18n instance across your app
- 🎨 **Components**: Ready-to-use translation components
- 📦 **TypeScript Support**: Full type safety with TypeScript
- ⚡ **Performance**: Optimized re-renders with memoization
- 🔌 **SSR Compatible**: Works with Next.js and server-side rendering

## Installation

```bash
npm install @oxog/i18n @oxog/i18n-react
# or
pnpm add @oxog/i18n @oxog/i18n-react
# or
yarn add @oxog/i18n @oxog/i18n-react
```

## Quick Start

```tsx
import React from 'react';
import { createI18n } from '@oxog/i18n';
import { I18nProvider, useTranslation, Trans } from '@oxog/i18n-react';

// Create i18n instance
const i18n = createI18n({
  locale: 'en',
  messages: {
    en: {
      greeting: 'Hello, {name}!',
      description: 'Welcome to <bold>React</bold> i18n'
    },
    es: {
      greeting: '¡Hola, {name}!',
      description: 'Bienvenido a <bold>React</bold> i18n'
    }
  }
});

// Wrap your app with I18nProvider
function App() {
  return (
    <I18nProvider i18n={i18n}>
      <MyComponent />
    </I18nProvider>
  );
}

// Use translations in your components
function MyComponent() {
  const { t, locale, setLocale } = useTranslation();
  
  return (
    <div>
      <h1>{t('greeting', { name: 'World' })}</h1>
      <Trans i18nKey="description" components={{ bold: <strong /> }} />
      <button onClick={() => setLocale(locale === 'en' ? 'es' : 'en')}>
        Switch Language
      </button>
    </div>
  );
}
```

## API Reference

### `<I18nProvider>`

Provides i18n context to your React app.

```tsx
import { I18nProvider } from '@oxog/i18n-react';

<I18nProvider i18n={i18nInstance}>
  <App />
</I18nProvider>
```

Props:
- `i18n`: The i18n instance created with `createI18n()`
- `children`: Your React components

### `useTranslation()`

Hook to access translation functions and locale management.

```tsx
const { t, locale, setLocale, i18n } = useTranslation();
```

Returns:
- `t`: Translation function
- `locale`: Current locale
- `setLocale`: Function to change locale
- `i18n`: The i18n instance

### `useI18n()`

Hook to access the raw i18n instance.

```tsx
const i18n = useI18n();
```

### `<Trans>`

Component for translations with embedded components.

```tsx
<Trans 
  i18nKey="message" 
  values={{ count: 5 }}
  components={{ 
    bold: <strong />,
    link: <a href="/docs" />
  }}
/>
```

Props:
- `i18nKey`: Translation key
- `values`: Interpolation values
- `components`: Components to embed in translation
- `defaultValue`: Fallback value

## Advanced Usage

### TypeScript Support

```tsx
// Define your message schema
type MessageSchema = {
  greeting: string;
  user: {
    welcome: string;
    profile: string;
  };
};

// Create typed hooks
const { useTranslation } = createI18nReact<MessageSchema>();

// Use with full type safety
function Component() {
  const { t } = useTranslation();
  
  t('greeting'); // ✅ Valid
  t('user.welcome'); // ✅ Valid
  t('invalid.key'); // ❌ TypeScript error
}
```

### Namespaces

Organize translations by feature or component:

```tsx
function FeatureComponent() {
  const { t } = useTranslation('feature');
  
  return <div>{t('title')}</div>; // Translates 'feature.title'
}
```

### Suspense Support

Load translations asynchronously:

```tsx
import { Suspense } from 'react';
import { I18nProvider, useLazyTranslation } from '@oxog/i18n-react';

function AsyncComponent() {
  const { t } = useLazyTranslation();
  return <div>{t('async.message')}</div>;
}

function App() {
  return (
    <I18nProvider i18n={i18n}>
      <Suspense fallback={<div>Loading translations...</div>}>
        <AsyncComponent />
      </Suspense>
    </I18nProvider>
  );
}
```

### Server-Side Rendering (SSR)

```tsx
// Next.js example
import { GetServerSideProps } from 'next';

export const getServerSideProps: GetServerSideProps = async ({ locale }) => {
  const messages = await import(`../locales/${locale}.json`);
  
  return {
    props: {
      locale,
      messages: messages.default
    }
  };
};

function MyApp({ Component, pageProps }) {
  const i18n = createI18n({
    locale: pageProps.locale,
    messages: {
      [pageProps.locale]: pageProps.messages
    }
  });
  
  return (
    <I18nProvider i18n={i18n}>
      <Component {...pageProps} />
    </I18nProvider>
  );
}
```

### Performance Optimization

```tsx
import { memo } from 'react';
import { useTranslation } from '@oxog/i18n-react';

// Component only re-renders when translation changes
const TranslatedComponent = memo(function TranslatedComponent() {
  const { t } = useTranslation();
  
  return (
    <div>
      <h1>{t('expensive.computation')}</h1>
    </div>
  );
});

// Selective subscription
function OptimizedComponent() {
  // Only subscribe to locale changes, not translation updates
  const { locale, setLocale } = useTranslation({ subscribe: ['locale'] });
  
  return (
    <select value={locale} onChange={(e) => setLocale(e.target.value)}>
      <option value="en">English</option>
      <option value="es">Español</option>
    </select>
  );
}
```

### Custom Components

Create your own translation components:

```tsx
import { useTranslation } from '@oxog/i18n-react';

function FormattedDate({ date, format = 'short' }) {
  const { t, locale } = useTranslation();
  
  const formatted = new Intl.DateTimeFormat(locale, {
    dateStyle: format
  }).format(date);
  
  return <time dateTime={date.toISOString()}>{formatted}</time>;
}
```

## Best Practices

1. **Initialize i18n outside components** to prevent recreation on each render
2. **Use `Trans` component** for translations with embedded React components
3. **Memoize components** that use translations to optimize performance
4. **Load translations asynchronously** for code splitting
5. **Type your translations** for better developer experience

## Examples

### Language Switcher

```tsx
function LanguageSwitcher() {
  const { locale, setLocale } = useTranslation();
  const languages = [
    { code: 'en', name: 'English' },
    { code: 'es', name: 'Español' },
    { code: 'fr', name: 'Français' }
  ];
  
  return (
    <select value={locale} onChange={(e) => setLocale(e.target.value)}>
      {languages.map(lang => (
        <option key={lang.code} value={lang.code}>
          {lang.name}
        </option>
      ))}
    </select>
  );
}
```

### Pluralization

```tsx
function ItemCount({ count }) {
  const { t } = useTranslation();
  
  return (
    <div>
      {t('items.count', { count })}
    </div>
  );
}

// Translation file:
// {
//   "items": {
//     "count": {
//       "zero": "No items",
//       "one": "One item",
//       "other": "{count} items"
//     }
//   }
// }
```

## License

MIT © Ersin Koç

## Contributing

Contributions are welcome! Please read our [Contributing Guide](https://github.com/ersinkoc/i18n/blob/main/CONTRIBUTING.md) for details.

## Links

- [GitHub Repository](https://github.com/ersinkoc/i18n)
- [NPM Package](https://www.npmjs.com/package/@oxog/i18n-react)
- [Documentation](https://github.com/ersinkoc/i18n#readme)