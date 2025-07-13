# Contributing to @oxog/i18n

Thank you for your interest in contributing to @oxog/i18n! This document provides guidelines and instructions for contributing.

## Development Setup

### Prerequisites

- Node.js 18 or higher
- pnpm 8 or higher

### Getting Started

1. Fork the repository
2. Clone your fork
3. Install dependencies:

```bash
pnpm install
```

### Development Commands

```bash
# Run all packages in development mode
pnpm dev

# Build all packages
pnpm build

# Run tests
pnpm test

# Run tests with coverage
pnpm test:coverage

# Lint code
pnpm lint

# Format code
pnpm format

# Type check
pnpm typecheck
```

## Project Structure

The project is organized as a monorepo using pnpm workspaces:

```
packages/
├── core/          # Core i18n functionality
├── react/         # React bindings
├── cli/           # CLI tools
└── vite-plugin/   # Vite plugin
```

## Making Changes

### Code Style

- We use ESLint and Prettier for code formatting
- Run `pnpm lint` and `pnpm format` before committing
- Follow the existing code style

### Commits

We use conventional commits:

- `feat:` New features
- `fix:` Bug fixes
- `docs:` Documentation changes
- `test:` Test additions or changes
- `chore:` Maintenance tasks
- `perf:` Performance improvements
- `refactor:` Code refactoring

### Pull Requests

1. Create a new branch for your feature/fix
2. Make your changes
3. Add tests for new functionality
4. Update documentation if needed
5. Run `pnpm test` and `pnpm build`
6. Create a changeset: `pnpm changeset`
7. Submit a pull request

### Creating a Changeset

We use changesets for version management:

```bash
pnpm changeset
```

Follow the prompts to:
1. Select which packages are affected
2. Choose the version bump type (major/minor/patch)
3. Write a summary of your changes

## Testing

- Write tests for all new functionality
- Aim for high test coverage
- Run tests before submitting PR: `pnpm test`

## Documentation

- Update README.md for user-facing changes
- Add JSDoc comments for public APIs
- Include examples for new features

## Questions?

Feel free to open an issue for any questions or discussions!