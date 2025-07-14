const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('Building and publishing version 0.1.2...\n');

try {
  // Build all packages
  console.log('Building all packages...');
  execSync('pnpm build', { stdio: 'inherit' });
  
  console.log('\nPublishing packages...\n');
  
  // Publish each package
  const packages = [
    'packages/core',
    'packages/cli',
    'packages/react',
    'packages/vite-plugin'
  ];
  
  for (const pkg of packages) {
    const pkgPath = path.join(__dirname, pkg);
    const pkgJson = JSON.parse(fs.readFileSync(path.join(pkgPath, 'package.json'), 'utf8'));
    
    console.log(`Publishing ${pkgJson.name}@${pkgJson.version}...`);
    
    try {
      execSync('npm publish --access public', { 
        cwd: pkgPath,
        stdio: 'inherit'
      });
      console.log(`✓ Successfully published ${pkgJson.name}@${pkgJson.version}\n`);
    } catch (err) {
      console.error(`✗ Failed to publish ${pkgJson.name}: ${err.message}\n`);
    }
  }
  
  console.log('All packages published successfully!');
  
  // Create git tag
  console.log('\nCreating git tag...');
  execSync('git add -A', { stdio: 'inherit' });
  execSync('git commit -m "chore: release v0.1.2"', { stdio: 'inherit' });
  execSync('git tag v0.1.2', { stdio: 'inherit' });
  
  console.log('\nDone! Don\'t forget to push the tag: git push && git push --tags');
  
} catch (error) {
  console.error('Error during publish:', error.message);
  process.exit(1);
}