#!/usr/bin/env node

import { Command } from 'commander';
import chalk from 'chalk';
import { readFileSync } from 'fs';
import { join } from 'path';
import { deviceInfoCommand, waitForBootloaderCommand } from './commands/device';
import { registerKeymapCommands } from './commands/keymap';
import { registerOLEDCommands } from './commands/oled';

// Read version from package.json
const packageJson = JSON.parse(
  readFileSync(join(__dirname, '..', 'package.json'), 'utf-8')
);

const program = new Command();

program
  .name('corne-cli')
  .description('CLI tool for customizing Corne keyboards with QMK firmware')
  .version(packageJson.version);

// Flash command
program
  .command('flash')
  .description('Flash firmware to connected keyboard')
  .option('-f, --firmware <path>', 'Path to firmware file')
  .option('--bootloader <type>', 'Force specific bootloader type')
  .option('--no-verify', 'Skip verification after flashing')
  .action(async (options) => {
    console.log(chalk.yellow('⚠️  Flash command not yet implemented'));
    console.log(chalk.cyan('Options:'), options);
    console.log(chalk.gray('\nUse @flasher agent to implement this feature'));
  });

// Compile command
program
  .command('compile')
  .description('Compile firmware from current configuration')
  .option('-p, --profile <name>', 'Use specific keymap profile')
  .option('-o, --output <path>', 'Output path for compiled firmware')
  .action(async (options) => {
    console.log(chalk.yellow('⚠️  Compile command not yet implemented'));
    console.log(chalk.cyan('Options:'), options);
    console.log(chalk.gray('Use @qmk-firmware agent to implement this feature'));
  });

// Config command
program
  .command('config')
  .description('Show current configuration')
  .action(async () => {
    console.log(chalk.yellow('⚠️  Config command not yet implemented'));
    console.log(chalk.gray('Use @cli-dev agent to implement this feature'));
  });

program
  .command('config:set <key> <value>')
  .description('Set a configuration value')
  .action(async (key, value) => {
    console.log(chalk.yellow('⚠️  Config set command not yet implemented'));
    console.log(chalk.cyan('Key:'), key);
    console.log(chalk.cyan('Value:'), value);
    console.log(chalk.gray('Use @cli-dev agent to implement this feature'));
  });

// Device commands
program
  .command('device:info')
  .alias('devices')
  .description('Show connected device information')
  .action(deviceInfoCommand);

program
  .command('device:wait')
  .description('Wait for bootloader to appear')
  .action(waitForBootloaderCommand);

// Register keymap commands
registerKeymapCommands(program);

// Register OLED commands
registerOLEDCommands(program);

// Error handling
program.exitOverride();

try {
  program.parse();
} catch (error: any) {
  if (error.code === 'commander.help') {
    process.exit(0);
  }
  console.error(chalk.red(`\n✗ ${error.message}\n`));
  process.exit(1);
}
