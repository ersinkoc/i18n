#!/usr/bin/env node

/**
 * @oxog/i18n Publish Script (Cross-platform Node.js version)
 * Safely publishes all packages to npm with comprehensive checks
 */

const { execSync, spawn } = require('child_process');
const fs = require('fs');
const path = require('path');
const readline = require('readline');

// Colors for output
const colors = {
  RED: '\x1b[31m',
  GREEN: '\x1b[32m',
  YELLOW: '\x1b[33m',
  BLUE: '\x1b[34m',
  NC: '\x1b[0m'
};

// Package names in dependency order
const PACKAGES = [
  '@oxog/i18n',
  '@oxog/i18n-react',
  '@oxog/i18n-cli',
  '@oxog/i18n-vite'
];

// Package directories
const PACKAGE_DIRS = [
  'packages/core',
  'packages/react',
  'packages/cli',
  'packages/vite-plugin'
];

console.log(`${colors.BLUE}🚀 @oxog/i18n Publishing Script${colors.NC}`);
console.log('==================================');

// Utility functions
function printStatus(message) {
  console.log(`${colors.GREEN}✓${colors.NC} ${message}`);
}

function printWarning(message) {
  console.log(`${colors.YELLOW}⚠${colors.NC} ${message}`);
}

function printError(message) {
  console.log(`${colors.RED}✗${colors.NC} ${message}`);
}

function printInfo(message) {
  console.log(`${colors.BLUE}ℹ${colors.NC} ${message}`);
}

function execCommand(command, options = {}) {
  try {
    return execSync(command, { 
      encoding: 'utf8', 
      stdio: options.silent ? 'pipe' : 'inherit',
      ...options 
    });
  } catch (error) {
    if (!options.allowFailure) {
      throw error;
    }
    return null;
  }
}

function askQuestion(question) {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      rl.close();
      resolve(answer.toLowerCase().trim());
    });
  });
}

async function main() {
  try {
    // Check if we're in the right directory
    if (!fs.existsSync('pnpm-workspace.yaml')) {
      printError('Must be run from the root of the @oxog/i18n monorepo');
      process.exit(1);
    }

    // Check if trying to publish root package (should not happen)
    const rootPackageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
    if (rootPackageJson.private && process.argv.includes('--root')) {
      printError('Cannot publish private monorepo root package');
      process.exit(1);
    }

    // Check if user is logged in to npm
    printInfo('Checking npm authentication...');
    const npmUser = execCommand('npm whoami', { silent: true, allowFailure: true });
    if (!npmUser) {
      printError('Not logged in to npm. Run \'npm login\' first.');
      process.exit(1);
    }
    printStatus(`Logged in as: ${npmUser.trim()}`);

    // Check if git working directory is clean
    printInfo('Checking git status...');
    const gitStatus = execCommand('git status --porcelain', { silent: true });
    if (gitStatus.trim()) {
      printWarning('Git working directory is not clean.');
      console.log('Uncommitted changes found:');
      console.log(execCommand('git status --short', { silent: true }));
      console.log();
      const answer = await askQuestion('Continue anyway? (y/N): ');
      if (answer !== 'y') {
        printError('Aborted by user');
        process.exit(1);
      }
    } else {
      printStatus('Git working directory is clean');
    }

    // Get current git branch
    const currentBranch = execCommand('git rev-parse --abbrev-ref HEAD', { silent: true }).trim();
    if (currentBranch !== 'main') {
      printWarning(`Not on main branch (currently on: ${currentBranch})`);
      const answer = await askQuestion(`Continue publishing from ${currentBranch}? (y/N): `);
      if (answer !== 'y') {
        printError('Aborted by user');
        process.exit(1);
      }
    }

    // Check if we're up to date with remote
    printInfo('Checking if branch is up to date...');
    execCommand(`git fetch origin ${currentBranch}`, { silent: true, allowFailure: true });
    const local = execCommand('git rev-parse @', { silent: true }).trim();
    const remote = execCommand('git rev-parse @{u}', { silent: true, allowFailure: true });
    if (remote && local !== remote.trim()) {
      printWarning('Local branch is not up to date with remote');
      const answer = await askQuestion('Continue anyway? (y/N): ');
      if (answer !== 'y') {
        printError('Aborted by user');
        process.exit(1);
      }
    }

    // Install dependencies
    printInfo('Installing dependencies...');
    try {
      // Try with frozen lockfile first
      execCommand('pnpm install --frozen-lockfile');
    } catch (error) {
      // If frozen lockfile fails, install normally
      printWarning('Lockfile missing, installing without frozen lockfile...');
      execCommand('pnpm install');
    }
    printStatus('Dependencies installed');

    // Run full test suite
    printInfo('Running full test suite...');
    execCommand('pnpm test');
    printStatus('All tests passed');

    // Run linting
    printInfo('Running linter...');
    execCommand('pnpm lint');
    printStatus('Linting passed');

    // Run type checking
    printInfo('Running type checking...');
    execCommand('pnpm typecheck');
    printStatus('Type checking passed');

    // Build all packages
    printInfo('Building all packages...');
    execCommand('pnpm build');
    printStatus('All packages built successfully');

    // Check package sizes
    printInfo('Checking package sizes...');
    for (let i = 0; i < PACKAGE_DIRS.length; i++) {
      const packageDir = PACKAGE_DIRS[i];
      const packageName = PACKAGES[i];
      
      if (fs.existsSync(path.join(packageDir, 'dist'))) {
        try {
          const stats = fs.statSync(path.join(packageDir, 'dist'));
          printInfo(`${packageName}: ${Math.round(stats.size / 1024)}KB`);
        } catch (e) {
          // Ignore errors
        }
      }
    }

    // Verify package contents
    printInfo('Verifying package contents...');
    for (let i = 0; i < PACKAGE_DIRS.length; i++) {
      const packageDir = PACKAGE_DIRS[i];
      const packageName = PACKAGES[i];
      
      // Check if package.json exists
      if (!fs.existsSync(path.join(packageDir, 'package.json'))) {
        printError(`Missing package.json in ${packageDir}`);
        process.exit(1);
      }
      
      // Check if dist directory exists
      if (!fs.existsSync(path.join(packageDir, 'dist'))) {
        printError(`Missing dist directory in ${packageDir}`);
        process.exit(1);
      }
      
      // Check if main entry points exist
      const packageJson = JSON.parse(fs.readFileSync(path.join(packageDir, 'package.json'), 'utf8'));
      
      const mainFile = packageJson.main || 'dist/index.js';
      if (!fs.existsSync(path.join(packageDir, mainFile))) {
        printError(`Main file ${mainFile} not found in ${packageDir}`);
        process.exit(1);
      }
      
      if (packageJson.module && !fs.existsSync(path.join(packageDir, packageJson.module))) {
        printError(`Module file ${packageJson.module} not found in ${packageDir}`);
        process.exit(1);
      }
      
      if (packageJson.types && !fs.existsSync(path.join(packageDir, packageJson.types))) {
        printError(`Types file ${packageJson.types} not found in ${packageDir}`);
        process.exit(1);
      }
      
      printStatus(`Package ${packageName} verified`);
    }

    // Check for existing versions on npm
    printInfo('Checking existing versions on npm...');
    for (let i = 0; i < PACKAGE_DIRS.length; i++) {
      const packageDir = PACKAGE_DIRS[i];
      const packageName = PACKAGES[i];
      
      const packageJson = JSON.parse(fs.readFileSync(path.join(packageDir, 'package.json'), 'utf8'));
      const currentVersion = packageJson.version;
      
      // Check if version already exists on npm
      const exists = execCommand(`npm view "${packageName}@${currentVersion}" version`, { 
        silent: true, 
        allowFailure: true 
      });
      if (exists) {
        printError(`Version ${currentVersion} of ${packageName} already exists on npm`);
        printInfo(`Current version: ${currentVersion}`);
        printInfo(`Please update the version in ${packageDir}/package.json`);
        process.exit(1);
      }
      
      printStatus(`${packageName}@${currentVersion} is ready to publish`);
    }

    // Final confirmation
    console.log();
    printInfo('Ready to publish the following packages:');
    for (let i = 0; i < PACKAGE_DIRS.length; i++) {
      const packageDir = PACKAGE_DIRS[i];
      const packageName = PACKAGES[i];
      
      const packageJson = JSON.parse(fs.readFileSync(path.join(packageDir, 'package.json'), 'utf8'));
      const version = packageJson.version;
      
      console.log(`  • ${packageName}@${version}`);
    }

    console.log();
    const answer = await askQuestion('Proceed with publishing? (y/N): ');
    if (answer !== 'y') {
      printError('Aborted by user');
      process.exit(1);
    }

    // Publish packages in dependency order
    console.log();
    printInfo('Publishing packages...');

    for (let i = 0; i < PACKAGE_DIRS.length; i++) {
      const packageDir = PACKAGE_DIRS[i];
      const packageName = PACKAGES[i];
      
      printInfo(`Publishing ${packageName}...`);
      
      const packageJson = JSON.parse(fs.readFileSync(path.join(packageDir, 'package.json'), 'utf8'));
      const version = packageJson.version;
      
      // Dry run first to catch any issues
      printInfo(`Running dry-run for ${packageName}...`);
      try {
        execCommand('npm publish --dry-run', { 
          cwd: packageDir, 
          silent: true 
        });
      } catch (error) {
        printError(`Dry run failed for ${packageName}`);
        process.exit(1);
      }
      
      // Actual publish
      try {
        execCommand('npm publish --access public', { cwd: packageDir });
        printStatus(`${packageName}@${version} published successfully`);
        
        // Tag the release
        execCommand(`git tag "${packageName}@${version}"`);
      } catch (error) {
        printError(`Failed to publish ${packageName}`);
        process.exit(1);
      }
      
      // Wait a moment between publishes
      await new Promise(resolve => setTimeout(resolve, 2000));
    }

    // Push git tags
    printInfo('Pushing git tags...');
    execCommand('git push origin --tags');
    printStatus('Git tags pushed');

    // Generate release notes
    console.log();
    printStatus('All packages published successfully!');
    printInfo('Published packages:');
    for (let i = 0; i < PACKAGE_DIRS.length; i++) {
      const packageDir = PACKAGE_DIRS[i];
      const packageName = PACKAGES[i];
      
      const packageJson = JSON.parse(fs.readFileSync(path.join(packageDir, 'package.json'), 'utf8'));
      const version = packageJson.version;
      
      console.log(`  • ${packageName}@${version} - https://www.npmjs.com/package/${packageName}`);
    }

    console.log();
    printInfo('Next steps:');
    console.log('  1. Update version numbers for next development cycle');
    console.log('  2. Create GitHub release with release notes');
    console.log('  3. Update documentation if needed');
    console.log('  4. Announce the release');

    printStatus('🎉 Publishing complete!');

  } catch (error) {
    printError(`Script failed: ${error.message}`);
    process.exit(1);
  }
}

// Run the script
if (require.main === module) {
  main();
}