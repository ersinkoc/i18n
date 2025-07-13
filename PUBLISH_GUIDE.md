# Publishing Guide for @oxog/i18n

This guide explains how to publish the @oxog/i18n packages to npm.

## Prerequisites

1. **npm Account**: You must have an npm account with publishing rights
2. **npm Login**: Run `npm login` to authenticate
3. **Git Clean State**: Ensure all changes are committed
4. **Tests Pass**: All tests, linting, and type checking must pass

## Quick Publish

### Option 1: Cross-platform Node.js Script (Recommended)
```bash
pnpm run publish:packages
```

### Option 2: Bash Script (Unix/Linux/macOS)
```bash
pnpm run publish:bash
```

## What the Publish Script Does

### Pre-flight Checks
1. ✅ Verifies you're in the monorepo root
2. ✅ Checks npm authentication status
3. ✅ Validates git working directory is clean
4. ✅ Confirms you're on the right branch
5. ✅ Ensures branch is up-to-date with remote

### Quality Assurance
6. ✅ Installs dependencies with frozen lockfile
7. ✅ Runs full test suite across all packages
8. ✅ Executes linting checks
9. ✅ Performs TypeScript type checking
10. ✅ Builds all packages

### Package Validation
11. ✅ Verifies package structure and files
12. ✅ Checks entry points exist (main, module, types)
13. ✅ Confirms versions don't already exist on npm
14. ✅ Reports package sizes

### Publishing Process
15. ✅ Publishes packages in dependency order:
    - `@oxog/i18n` (core)
    - `@oxog/i18n-react` (React bindings)
    - `@oxog/i18n-cli` (CLI tools)
    - `@oxog/i18n-vite` (Vite plugin)
16. ✅ Creates git tags for each version
17. ✅ Pushes tags to remote repository

## Manual Publishing

If you need to publish manually:

```bash
# 1. Build all packages
pnpm build

# 2. Publish core package first
cd packages/core
npm publish --access public

# 3. Publish React package
cd ../react
npm publish --access public

# 4. Publish CLI package
cd ../cli
npm publish --access public

# 5. Publish Vite plugin
cd ../vite-plugin
npm publish --access public

# 6. Tag releases
git tag "@oxog/i18n@$(node -p 'require("./packages/core/package.json").version')"
git tag "@oxog/i18n-react@$(node -p 'require("./packages/react/package.json").version')"
git tag "@oxog/i18n-cli@$(node -p 'require("./packages/cli/package.json").version')"
git tag "@oxog/i18n-vite@$(node -p 'require("./packages/vite-plugin/package.json").version')"

# 7. Push tags
git push origin --tags
```

## Version Management

### Before Publishing
Update version numbers in package.json files:

```bash
# Core package
packages/core/package.json

# React package (update both version and dependency)
packages/react/package.json

# CLI package (update both version and dependency)
packages/cli/package.json

# Vite plugin (update both version and dependency)
packages/vite-plugin/package.json
```

### Using Changesets (Alternative)
```bash
# Add changeset
pnpm changeset

# Version packages
pnpm changeset:version

# Publish with changesets
pnpm release
```

## Troubleshooting

### Authentication Issues
```bash
npm whoami          # Check if logged in
npm login           # Login to npm
npm logout          # Logout and login again
```

### Version Conflicts
```bash
npm view @oxog/i18n versions --json    # Check existing versions
```

### Permission Issues
- Ensure you have publishing rights to the @oxog scope
- Contact package maintainer for access

### Build Issues
```bash
pnpm clean          # Clean all packages
pnpm install        # Reinstall dependencies
pnpm build          # Rebuild packages
```

## Post-Publishing

1. **Verify Publication**: Check packages on npmjs.com
2. **Update Documentation**: Update README with new version info
3. **Create GitHub Release**: Tag and create release notes
4. **Announce**: Share the release with the community

## Package URLs After Publishing

- [@oxog/i18n](https://www.npmjs.com/package/@oxog/i18n)
- [@oxog/i18n-react](https://www.npmjs.com/package/@oxog/i18n-react)
- [@oxog/i18n-cli](https://www.npmjs.com/package/@oxog/i18n-cli)
- [@oxog/i18n-vite](https://www.npmjs.com/package/@oxog/i18n-vite)

## Security

- Never commit npm tokens to git
- Use 2FA on your npm account
- Regularly audit dependencies
- The packages have zero runtime dependencies for security