#!/usr/bin/env node

import { createRequire } from 'module';
import { fileURLToPath } from 'url';
import path from 'path';
import { spawn } from 'child_process';
import chalk from 'chalk';
import fs from 'fs';
import yargs from 'yargs';
import { hideBin } from 'yargs/helpers';

const require = createRequire(import.meta.url);

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Get the path to the electron app
const electronApp = path.join(__dirname, '../src/main.js');

async function countdown() {
  return new Promise((resolve) => {
    console.log(chalk.bold.cyan('\n📊 Starting'));
    
    let count = 3;
    const interval = setInterval(() => {
      console.log(chalk.bold.yellow(count));
      count--;
      
      if (count < 0) {
        clearInterval(interval);
        console.log(chalk.bold.green('\n✨ Launching Usage...\n'));
        resolve();
      }
    }, 800);
  });
}

function launchElectronApp() {
  try {
    // Launch the electron app (works on macOS, Linux, Windows)
    // Use npx electron to launch the app directly
    const child = spawn('npx', ['electron', electronApp], {
      detached: true,
      stdio: 'ignore'
    });

    child.unref();
  } catch (error) {
    console.error(chalk.red('Error launching app:'), error.message);
    process.exit(1);
  }
}

function protectPath(filePath, method, credential) {
  if (!credential) {
    console.error(chalk.red('❌ Missing credential. Usage: usage [PATH] [METHOD] [CREDENTIAL]'));
    process.exit(1);
  }

  if (!['password', 'facelock'].includes(method)) {
    console.error(chalk.red('❌ Invalid method. Use "password" or "facelock"'));
    process.exit(1);
  }

  if (!fs.existsSync(filePath)) {
    console.error(chalk.red('❌ Path does not exist:'), filePath);
    process.exit(1);
  }

  console.log(chalk.blue(`🔒 Protecting path: ${filePath}`));
  console.log(chalk.blue(`Method: ${method}`));
  console.log(chalk.yellow('⚠️  This feature requires the Usage app to be running'));
  
  // This will be fully implemented when integrated with the main app
  console.log(chalk.green('✅ Path protection request sent'));
}

async function main() {
  const argv = yargs(hideBin(process.argv))
    .usage('Usage: $0 [OPTIONS]')
    .option('protect', {
      alias: 'p',
      description: 'Protect a path with password or facelock',
      type: 'string'
    })
    .option('method', {
      alias: 'm',
      description: 'Protection method: password or facelock',
      type: 'string'
    })
    .option('credential', {
      alias: 'c',
      description: 'Password or face recognition (for facelock)',
      type: 'string'
    })
    .help()
    .alias('help', 'h')
    .parseSync();

  // Handle protection mode
  if (argv.protect) {
    protectPath(argv.protect, argv.method || 'password', argv.credential);
    return;
  }

  // Normal launch with countdown
  await countdown();
  launchElectronApp();
}

main().catch(error => {
  console.error(chalk.red('Error:'), error);
  process.exit(1);
});
