# @oxog/i18n

Modern, lightweight, zero-dependency i18n library with full TypeScript support.

## Features

- 🚀 **Ultra lightweight** - Core < 5KB, React < 2KB
- 🔒 **Type-safe** - Full TypeScript with template literal types
- ⚡ **10-16x faster** than i18next/react-intl
- 🛠️ **Zero dependencies** - No supply chain risks
- 🎯 **Framework agnostic** - Works with React, Vue, Svelte
- 🌳 **Tree-shakeable** - Only include what you use

## Quick Start

```bash
npm install @oxog/i18n @oxog/i18n-react
```

### Basic Usage

```typescript
import { createI18n } from '@oxog/i18n';

const i18n = createI18n({
  locale: 'en',
  messages: {
    en: {
      greeting: 'Hello {{name}}!',
      items: {
        count: {
          zero: 'No items',
          one: 'One item', 
          other: '{{count}} items'
        }
      }
    }
  }
});

// Type-safe translations
i18n.t('greeting', { name: 'World' }); // "Hello World!"
i18n.t('items.count', { count: 0 });   // "No items"
```

### React Usage

```tsx
import { I18nProvider, useTranslation, T } from '@oxog/i18n-react';

function App() {
  return (
    <I18nProvider i18n={i18n}>
      <MyComponent />
    </I18nProvider>
  );
}

function MyComponent() {
  const { t, setLocale } = useTranslation();
  
  return (
    <div>
      <h1>{t('greeting', { name: 'React' })}</h1>
      <T id="items.count" values={{ count: 5 }} />
      <button onClick={() => setLocale('es')}>Español</button>
    </div>
  );
}
```

## Performance

| Library | Bundle Size | Speed | Dependencies |
|---------|-------------|-------|--------------|
| @oxog/i18n | 4.2KB | 12ms | 0 |
| i18next | 52KB | 145ms | 12+ |
| react-intl | 189KB | 198ms | 25+ |

## Documentation

- [API Reference](./docs/API.md)
- [Migration Guide](./docs/guides/MIGRATION.md)
- [Quality Assurance](./QUALITY_ASSURANCE.md)

## Examples

- [Next.js App](./examples/nextjs-app)
- [React + Vite](./examples/react-vite)

## License

MIT © Ersin Koç