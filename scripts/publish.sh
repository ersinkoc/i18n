#!/bin/bash

# @oxog/i18n Publish Script
# Safely publishes all packages to npm with comprehensive checks

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Package names in dependency order
PACKAGES=(
  "@oxog/i18n"
  "@oxog/i18n-react" 
  "@oxog/i18n-cli"
  "@oxog/i18n-vite"
)

# Package directories
PACKAGE_DIRS=(
  "packages/core"
  "packages/react"
  "packages/cli"
  "packages/vite-plugin"
)

echo -e "${BLUE}🚀 @oxog/i18n Publishing Script${NC}"
echo "=================================="

# Function to print colored output
print_status() {
  echo -e "${GREEN}✓${NC} $1"
}

print_warning() {
  echo -e "${YELLOW}⚠${NC} $1"
}

print_error() {
  echo -e "${RED}✗${NC} $1"
}

print_info() {
  echo -e "${BLUE}ℹ${NC} $1"
}

# Check if we're in the right directory
if [[ ! -f "pnpm-workspace.yaml" ]]; then
  print_error "Must be run from the root of the @oxog/i18n monorepo"
  exit 1
fi

# Check if user is logged in to npm
print_info "Checking npm authentication..."
if ! npm whoami > /dev/null 2>&1; then
  print_error "Not logged in to npm. Run 'npm login' first."
  exit 1
fi

NPM_USER=$(npm whoami)
print_status "Logged in as: $NPM_USER"

# Check if git working directory is clean
print_info "Checking git status..."
if [[ -n $(git status --porcelain) ]]; then
  print_warning "Git working directory is not clean."
  echo "Uncommitted changes found:"
  git status --short
  echo
  read -p "Continue anyway? (y/N): " -n 1 -r
  echo
  if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    print_error "Aborted by user"
    exit 1
  fi
else
  print_status "Git working directory is clean"
fi

# Get current git branch
CURRENT_BRANCH=$(git rev-parse --abbrev-ref HEAD)
if [[ "$CURRENT_BRANCH" != "main" ]]; then
  print_warning "Not on main branch (currently on: $CURRENT_BRANCH)"
  read -p "Continue publishing from $CURRENT_BRANCH? (y/N): " -n 1 -r
  echo
  if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    print_error "Aborted by user"
    exit 1
  fi
fi

# Check if we're up to date with remote
print_info "Checking if branch is up to date..."
git fetch origin $CURRENT_BRANCH
LOCAL=$(git rev-parse @)
REMOTE=$(git rev-parse @{u} 2>/dev/null || echo "")
if [[ -n "$REMOTE" && "$LOCAL" != "$REMOTE" ]]; then
  print_warning "Local branch is not up to date with remote"
  read -p "Continue anyway? (y/N): " -n 1 -r
  echo
  if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    print_error "Aborted by user"
    exit 1
  fi
fi

# Install dependencies
print_info "Installing dependencies..."
pnpm install --frozen-lockfile
print_status "Dependencies installed"

# Run full test suite
print_info "Running full test suite..."
pnpm test
print_status "All tests passed"

# Run linting
print_info "Running linter..."
pnpm lint
print_status "Linting passed"

# Run type checking
print_info "Running type checking..."
pnpm typecheck
print_status "Type checking passed"

# Build all packages
print_info "Building all packages..."
pnpm build
print_status "All packages built successfully"

# Check package sizes
print_info "Checking package sizes..."
for i in "${!PACKAGE_DIRS[@]}"; do
  package_dir="${PACKAGE_DIRS[$i]}"
  package_name="${PACKAGES[$i]}"
  
  if [[ -d "$package_dir/dist" ]]; then
    size=$(du -sh "$package_dir/dist" | cut -f1)
    print_info "$package_name: $size"
  fi
done

# Verify package contents
print_info "Verifying package contents..."
for i in "${!PACKAGE_DIRS[@]}"; do
  package_dir="${PACKAGE_DIRS[$i]}"
  package_name="${PACKAGES[$i]}"
  
  # Check if package.json exists
  if [[ ! -f "$package_dir/package.json" ]]; then
    print_error "Missing package.json in $package_dir"
    exit 1
  fi
  
  # Check if dist directory exists
  if [[ ! -d "$package_dir/dist" ]]; then
    print_error "Missing dist directory in $package_dir"
    exit 1
  fi
  
  # Check if main entry points exist
  cd "$package_dir"
  
  # Get main file from package.json
  main_file=$(node -p "require('./package.json').main || 'dist/index.js'")
  if [[ ! -f "$main_file" ]]; then
    print_error "Main file $main_file not found in $package_dir"
    exit 1
  fi
  
  # Get module file from package.json
  module_file=$(node -p "require('./package.json').module || 'dist/index.mjs'" 2>/dev/null || echo "")
  if [[ -n "$module_file" && ! -f "$module_file" ]]; then
    print_error "Module file $module_file not found in $package_dir"
    exit 1
  fi
  
  # Get types file from package.json
  types_file=$(node -p "require('./package.json').types || 'dist/index.d.ts'" 2>/dev/null || echo "")
  if [[ -n "$types_file" && ! -f "$types_file" ]]; then
    print_error "Types file $types_file not found in $package_dir"
    exit 1
  fi
  
  cd - > /dev/null
  print_status "Package $package_name verified"
done

# Check for existing versions on npm
print_info "Checking existing versions on npm..."
for i in "${!PACKAGE_DIRS[@]}"; do
  package_dir="${PACKAGE_DIRS[$i]}"
  package_name="${PACKAGES[$i]}"
  
  cd "$package_dir"
  current_version=$(node -p "require('./package.json').version")
  
  # Check if version already exists on npm
  if npm view "$package_name@$current_version" version > /dev/null 2>&1; then
    print_error "Version $current_version of $package_name already exists on npm"
    print_info "Current version: $current_version"
    print_info "Please update the version in $package_dir/package.json"
    exit 1
  fi
  
  cd - > /dev/null
  print_status "$package_name@$current_version is ready to publish"
done

# Final confirmation
echo
print_info "Ready to publish the following packages:"
for i in "${!PACKAGE_DIRS[@]}"; do
  package_dir="${PACKAGE_DIRS[$i]}"
  package_name="${PACKAGES[$i]}"
  
  cd "$package_dir"
  version=$(node -p "require('./package.json').version")
  cd - > /dev/null
  
  echo "  • $package_name@$version"
done

echo
read -p "Proceed with publishing? (y/N): " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
  print_error "Aborted by user"
  exit 1
fi

# Publish packages in dependency order
echo
print_info "Publishing packages..."

for i in "${!PACKAGE_DIRS[@]}"; do
  package_dir="${PACKAGE_DIRS[$i]}"
  package_name="${PACKAGES[$i]}"
  
  print_info "Publishing $package_name..."
  
  cd "$package_dir"
  
  # Get package version for tagging
  version=$(node -p "require('./package.json').version")
  
  # Dry run first to catch any issues
  print_info "Running dry-run for $package_name..."
  if ! npm publish --dry-run > /dev/null 2>&1; then
    print_error "Dry run failed for $package_name"
    exit 1
  fi
  
  # Actual publish
  if npm publish --access public; then
    print_status "$package_name@$version published successfully"
    
    # Tag the release
    git tag "$package_name@$version"
  else
    print_error "Failed to publish $package_name"
    exit 1
  fi
  
  cd - > /dev/null
  
  # Wait a moment between publishes
  sleep 2
done

# Push git tags
print_info "Pushing git tags..."
git push origin --tags
print_status "Git tags pushed"

# Generate release notes
echo
print_status "All packages published successfully!"
print_info "Published packages:"
for i in "${!PACKAGE_DIRS[@]}"; do
  package_dir="${PACKAGE_DIRS[$i]}"
  package_name="${PACKAGES[$i]}"
  
  cd "$package_dir"
  version=$(node -p "require('./package.json').version")
  cd - > /dev/null
  
  echo "  • $package_name@$version - https://www.npmjs.com/package/${package_name}"
done

echo
print_info "Next steps:"
echo "  1. Update version numbers for next development cycle"
echo "  2. Create GitHub release with release notes"
echo "  3. Update documentation if needed"
echo "  4. Announce the release"

print_status "🎉 Publishing complete!"