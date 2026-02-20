#!/usr/bin/env node

import sharp from 'sharp';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const projectRoot = dirname(dirname(__filename));

const sizes = [16, 32, 64, 128, 256, 512];
const inputSvg = join(projectRoot, 'assets', 'logo.svg');
const outputDir = join(projectRoot, 'assets');

async function generatePNGs() {
  try {
    for (const size of sizes) {
      const outputPath = join(outputDir, `logo-${size}x${size}.png`);
      
      await sharp(inputSvg)
        .resize(size, size, {
          fit: 'contain',
          background: { r: 255, g: 255, b: 255, alpha: 0 }
        })
        .png()
        .toFile(outputPath);
      
      console.log(`✓ Generated ${size}x${size} PNG: ${outputPath}`);
    }

    // Also generate main icon.png at 256x256
    await sharp(inputSvg)
      .resize(256, 256, {
        fit: 'contain',
        background: { r: 255, g: 255, b: 255, alpha: 0 }
      })
      .png()
      .toFile(join(outputDir, 'icon.png'));
    
    console.log('✓ Generated main icon.png (256x256)');
    
    // Generate icon.ico for Windows (using 256x256)
    await sharp(inputSvg)
      .resize(256, 256, {
        fit: 'contain',
        background: { r: 255, g: 255, b: 255, alpha: 0 }
      })
      .toFile(join(outputDir, 'icon.ico'));
    
    console.log('✓ Generated icon.ico');

    console.log('\n✅ All logo assets generated successfully!');
  } catch (error) {
    console.error('Error generating PNGs:', error);
    process.exit(1);
  }
}

generatePNGs();
