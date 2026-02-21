#!/usr/bin/env node

/**
 * DMG Builder Helper for Usage Application
 * 
 * This script helps create DMG installer files for macOS.
 * DMG files can only be created on macOS, but this script provides:
 * 1. Documentation on how to build DMGs
 * 2. Automatic file naming and organization
 * 3. GitHub Actions workflow integration
 * 
 * Usage:
 *   node scripts/build-dmg.js --version 1.8.5 --target under12
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT_DIR = path.resolve(__dirname, '..');
const DIST_DIR = path.join(ROOT_DIR, 'dist');
const ZIP_FILE = path.join(DIST_DIR, 'Usage-1.8.5-mac.zip');
const DMG_OUTPUT = path.join(DIST_DIR, 'usage_application-1.8.5_under12.dmg');

console.log('📦 Usage Application DMG Builder');
console.log('================================\n');

const args = process.argv.slice(2);
const version = args.includes('--version') 
  ? args[args.indexOf('--version') + 1] 
  : '1.8.5';

const target = args.includes('--target') 
  ? args[args.indexOf('--target') + 1] 
  : 'macos11';

console.log(`version: ${version}`);
console.log(`target: ${target}\n`);

// Check platform
const isWindows = process.platform === 'win32';
const isMacOS = process.platform === 'darwin';
const isLinux = process.platform === 'linux';

console.log(`Platform: ${process.platform}`);

if (!isMacOS) {
  console.log('\n⚠️  DMG creation requires macOS tools (hdiutil, etc.)');
  console.log('   This script is running on:', process.platform.toUpperCase());
  console.log('\n📋 Options to create DMG:\n');
  console.log('   1. Run on macOS directly:');
  console.log('      npm run package  # builds ZIP');
  console.log('      bash scripts/build-dmg-macos11.sh');
  console.log('\n   2. Use GitHub Actions:');
  console.log('      - Push to GitHub');
  console.log('      - Go to Actions tab');
  console.log('      - Run "Build macOS DMG for 10.13+" workflow');
  console.log('      - DMG will be built on GitHub macOS runner\n');
  console.log('   3. Alternative: Docker with macOS image (complex setup)');
  
  // Show what would be created
  console.log('\n📝 DMG file that would be created:');
  console.log(`   ${DMG_OUTPUT}`);
  console.log(`   Name: usage_application-${version}_under${target === 'under12' ? '12' : '13'}.dmg`);
  
  // Check if ZIP exists
  if (fs.existsSync(ZIP_FILE)) {
    const stats = fs.statSync(ZIP_FILE);
    console.log(`\n✅ ZIP file ready: ${path.basename(ZIP_FILE)} (${(stats.size / 1024 / 1024).toFixed(1)}MB)`);
    console.log('   This ZIP contains the macOS application bundle');
  }
  
  process.exit(0);
}

// On macOS - attempt to build
if (isMacOS) {
  console.log('\n✅ Running on macOS - attempting to build DMG...\n');
  
  try {
    // Check if app bundle exists
    const appBundle = path.join(DIST_DIR, 'mac', 'Usage.app');
    if (!fs.existsSync(appBundle)) {
      console.error('❌ App bundle not found. Run: npm run package');
      process.exit(1);
    }
    
    console.log('📝 To build the DMG, run:');
    console.log(`   bash ${path.relative(ROOT_DIR, path.join(__dirname, 'build-dmg-macos11.sh'))}`);
    console.log('\n   Or manually:');
    console.log(`   hdiutil create -srcfolder dist/mac -volname "Usage" -fs HFS+ -format UDZO -o "${DMG_OUTPUT}"`);
    
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

console.log('\n📚 Documentation:');
console.log('   - DMG files are macOS Disk Image format');
console.log('   - Contains: Application bundle with all dependencies');
console.log('   - Compatibility: Set to macOS 11.0.0 and earlier');
console.log('   - Size: Typically 100-150MB compressed\n');
