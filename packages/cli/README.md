# @oxog/i18n-cli

Command-line interface for @oxog/i18n - extract, validate, sync, and manage your translations with ease.

## Features

- 📝 **Extract**: Automatically extract translation keys from your source code
- ✅ **Validate**: Check for missing translations and invalid keys
- 🔄 **Sync**: Synchronize translations across multiple locale files
- 📊 **Stats**: View translation statistics and coverage
- 🎨 **Interactive**: User-friendly prompts and colorful output
- 🔧 **Configurable**: Flexible configuration options

## Installation

```bash
npm install -D @oxog/i18n-cli
# or
pnpm add -D @oxog/i18n-cli
# or
yarn add -D @oxog/i18n-cli
```

## Quick Start

```bash
# Initialize i18n configuration
npx oxog-i18n init

# Extract translation keys from source code
npx oxog-i18n extract

# Validate translations
npx oxog-i18n validate

# View translation statistics
npx oxog-i18n stats
```

## Commands

### `init`

Initialize i18n configuration for your project.

```bash
npx oxog-i18n init
```

This command will:
- Create a configuration file (`i18n.config.js`)
- Set up locale directories
- Create initial translation files
- Configure your preferred framework integration

### `extract`

Extract translation keys from your source code.

```bash
npx oxog-i18n extract [options]

Options:
  -s, --source <patterns>   Source file patterns (default: "src/**/*.{js,jsx,ts,tsx}")
  -o, --output <dir>        Output directory for translations (default: "./locales")
  -l, --locales <locales>   Comma-separated list of locales
  --dry-run                 Show what would be extracted without writing files
```

Examples:
```bash
# Extract from specific directories
npx oxog-i18n extract -s "src/**/*.{ts,tsx}" -s "components/**/*.{ts,tsx}"

# Extract for specific locales
npx oxog-i18n extract -l en,es,fr

# Dry run to preview extraction
npx oxog-i18n extract --dry-run
```

### `validate`

Validate translation files for completeness and correctness.

```bash
npx oxog-i18n validate [options]

Options:
  -l, --locale <locale>     Specific locale to validate
  -s, --source <dir>        Source directory for translations
  --strict                  Fail on warnings
```

Examples:
```bash
# Validate all locales
npx oxog-i18n validate

# Validate specific locale
npx oxog-i18n validate -l es

# Strict validation
npx oxog-i18n validate --strict
```

### `sync`

Synchronize translations across locale files.

```bash
npx oxog-i18n sync [options]

Options:
  -s, --source <locale>     Source locale to sync from (default: "en")
  -t, --target <locales>    Target locales to sync to
  --remove-unused           Remove keys not in source
```

Examples:
```bash
# Sync from English to all other locales
npx oxog-i18n sync -s en

# Sync to specific locales
npx oxog-i18n sync -s en -t es,fr,de

# Clean up unused keys
npx oxog-i18n sync --remove-unused
```

### `stats`

Display translation statistics and coverage.

```bash
npx oxog-i18n stats [options]

Options:
  -l, --locale <locale>     Show stats for specific locale
  --json                    Output stats as JSON
```

Examples:
```bash
# Show stats for all locales
npx oxog-i18n stats

# Show stats for specific locale
npx oxog-i18n stats -l fr

# Export stats as JSON
npx oxog-i18n stats --json > translation-stats.json
```

### `compile`

Compile translations for production (optimize bundle size).

```bash
npx oxog-i18n compile [options]

Options:
  -s, --source <dir>        Source directory for translations
  -o, --output <dir>        Output directory for compiled translations
  --format <format>         Output format (json, esm, cjs)
```

## Configuration

Create an `i18n.config.js` file in your project root:

```javascript
module.exports = {
  // Locales configuration
  locales: {
    default: 'en',
    supported: ['en', 'es', 'fr', 'de']
  },
  
  // Source code configuration
  source: {
    patterns: ['src/**/*.{js,jsx,ts,tsx}'],
    exclude: ['**/*.test.*', '**/*.spec.*']
  },
  
  // Translation files configuration
  translations: {
    directory: './locales',
    structure: 'flat', // or 'nested'
    format: 'json' // or 'yaml'
  },
  
  // Extraction configuration
  extraction: {
    keyPrefix: '',
    defaultValue: true,
    preserveWhitespace: false
  },
  
  // Validation rules
  validation: {
    missingKeys: 'error', // or 'warning'
    unusedKeys: 'warning',
    invalidInterpolation: 'error'
  }
};
```

## Package.json Scripts

Add these scripts to your `package.json` for convenience:

```json
{
  "scripts": {
    "i18n:extract": "oxog-i18n extract",
    "i18n:validate": "oxog-i18n validate",
    "i18n:sync": "oxog-i18n sync",
    "i18n:stats": "oxog-i18n stats",
    "i18n:check": "oxog-i18n validate --strict"
  }
}
```

## CI/CD Integration

### GitHub Actions

```yaml
name: i18n
on: [push, pull_request]

jobs:
  validate-translations:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
      - run: npm ci
      - run: npm run i18n:validate -- --strict
```

### Pre-commit Hook

```bash
# .husky/pre-commit
#!/bin/sh
. "$(dirname "$0")/_/husky.sh"

npm run i18n:check
```

## Advanced Usage

### Custom Extractors

Register custom extraction patterns:

```javascript
// i18n.config.js
module.exports = {
  extractors: [
    {
      pattern: /customT\(['"]([^'"]+)['"]\)/g,
      keyIndex: 1
    }
  ]
};
```

### Namespace Support

Organize translations by namespace:

```bash
npx oxog-i18n extract --namespace common
npx oxog-i18n extract --namespace features/auth
```

### Plugin System

Extend CLI functionality with plugins:

```javascript
// i18n.config.js
module.exports = {
  plugins: [
    '@oxog/i18n-plugin-json-sort',
    '@oxog/i18n-plugin-translate-missing'
  ]
};
```

## License

MIT © Ersin Koç

## Contributing

Contributions are welcome! Please read our [Contributing Guide](https://github.com/ersinkoc/i18n/blob/main/CONTRIBUTING.md) for details.

## Links

- [GitHub Repository](https://github.com/ersinkoc/i18n)
- [NPM Package](https://www.npmjs.com/package/@oxog/i18n-cli)
- [Documentation](https://github.com/ersinkoc/i18n#readme)