# API Reference

## Core Package (@oxog/i18n)

### `createI18n<T>(config)`

Creates a new i18n instance with type-safe translations.

```typescript
const i18n = createI18n({
  locale: 'en',
  fallbackLocale: 'en',
  messages: {
    en: { greeting: 'Hello {{name}}!' },
    es: { greeting: '¡Hola {{name}}!' }
  },
  warnOnMissingTranslations: true,
  formats: {
    number: { currency: { style: 'currency', currency: 'USD' } },
    date: { short: { dateStyle: 'short' } }
  }
});
```

### Instance Methods

#### `t(key, params?)`
Translate a key with optional parameters.

```typescript
i18n.t('greeting', { name: 'World' }); // "Hello World!"
```

#### `setLocale(locale)`
Change the current locale.

```typescript
i18n.setLocale('es');
```

#### `addMessages(locale, messages)`
Add translations for a locale.

```typescript
i18n.addMessages('fr', { greeting: 'Bonjour {{name}}!' });
```

#### `hasTranslation(key, locale?)`
Check if a translation exists.

```typescript
i18n.hasTranslation('greeting'); // true
```

#### `formatNumber(value, format?)`
Format a number using Intl.NumberFormat.

```typescript
i18n.formatNumber(1234.56, 'currency'); // "$1,234.56"
```

#### `formatDate(value, format?)`
Format a date using Intl.DateTimeFormat.

```typescript
i18n.formatDate(new Date(), 'short'); // "1/15/24"
```

#### `subscribe(listener)`
Subscribe to locale changes.

```typescript
const unsubscribe = i18n.subscribe((locale) => {
  console.log('Locale changed to:', locale);
});
```

## React Package (@oxog/i18n-react)

### `I18nProvider`

Provides i18n context to child components.

```tsx
<I18nProvider i18n={i18n}>
  <App />
</I18nProvider>
```

### `useTranslation()`

Hook for accessing translation functions.

```tsx
const { t, locale, setLocale, formatNumber, formatDate } = useTranslation();
```

### `T` Component

Renders a translation as a component.

```tsx
<T id="greeting" values={{ name: 'World' }} as="h1" className="title" />
```

### `NumberFormat` Component

Formats numbers with locale-specific formatting.

```tsx
<NumberFormat value={1234.56} format="currency" />
```

### `DateFormat` Component

Formats dates with locale-specific formatting.

```tsx
<DateFormat value={new Date()} format="short" />
```

### `RelativeTime` Component

Displays relative time (e.g., "2 hours ago").

```tsx
<RelativeTime value={pastDate} baseDate={new Date()} />
```

## CLI Package (@oxog/i18n-cli)

### Commands

#### `oxog-i18n init`
Initialize i18n in your project.

```bash
npx @oxog/i18n-cli init --framework react --typescript
```

#### `oxog-i18n extract`
Extract translation keys from source code.

```bash
npx @oxog/i18n-cli extract --pattern "src/**/*.{ts,tsx}" --output "./locales"
```

#### `oxog-i18n validate`
Validate translations for missing keys.

```bash
npx @oxog/i18n-cli validate --source en --pattern "./locales/*.json"
```

#### `oxog-i18n stats`
Show translation coverage statistics.

```bash
npx @oxog/i18n-cli stats --path "./locales" --format table
```

## Vite Plugin (@oxog/i18n-vite)

### Configuration

```typescript
// vite.config.ts
import { i18nPlugin } from '@oxog/i18n-vite';

export default {
  plugins: [
    i18nPlugin({
      localesDir: './src/locales',
      typescript: {
        generate: true,
        outputFile: './src/types/i18n.d.ts'
      },
      optimize: true,
      hmr: true
    })
  ]
};
```

## TypeScript Integration

### Message Type Definition

```typescript
interface Messages {
  greeting: 'Hello {{name}}!';
  items: {
    count: {
      zero: 'No items';
      one: 'One item';
      other: '{{count}} items';
    };
  };
}

const i18n = createI18n<Messages>({
  locale: 'en',
  messages: { /* ... */ }
});

// Fully type-safe
i18n.t('greeting', { name: 'World' }); // ✅
i18n.t('unknown.key');                 // ❌ Type error
i18n.t('greeting');                    // ❌ Missing required param
```

### Plugin Development

```typescript
import type { I18nPlugin } from '@oxog/i18n';

const myPlugin: I18nPlugin = {
  name: 'my-plugin',
  transform: (key, value, params, locale) => {
    return value.toUpperCase();
  },
  format: (value, format, locale) => {
    return `[${format}] ${value}`;
  },
  beforeLoad: (locale, messages) => {
    // Process messages before loading
    return messages;
  },
  afterLoad: (locale, messages) => {
    // Process messages after loading
  }
};

i18n.addPlugin(myPlugin);
```