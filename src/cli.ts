#!/usr/bin/env node

import { Command } from 'commander';
import chalk from 'chalk';
import { readFileSync } from 'fs';
import { join } from 'path';
import { deviceInfoCommand, waitForBootloaderCommand } from './commands/device';
import { registerKeymapCommands } from './commands/keymap';
import { registerOLEDCommands } from './commands/oled';
import { flashCommand } from './commands/flash';
import { registerSetupCommand } from './commands/setup';
import { registerTemplateCommands } from './commands/templates';
import macosSetupCommand from './commands/macos';

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
  .command('flash [firmware]')
  .description('Flash firmware to connected keyboard')
  .option('-b, --bootloader <type>', 'Force specific bootloader type')
  .option('--no-verify', 'Skip verification after flashing')
  .option('--wait-timeout <ms>', 'Bootloader wait timeout in milliseconds', '30000')
  .action(async (firmware, options) => {
    await flashCommand(firmware, {
      firmware,
      bootloader: options.bootloader,
      verify: options.verify,
      waitTimeout: parseInt(options.waitTimeout),
    });
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

// Register setup wizard
registerSetupCommand(program);

// Register templates commands
registerTemplateCommands(program);

// macOS helper
program
  .command('system:macos-setup')
  .description('Check Homebrew and show macOS QMK setup instructions')
  .option('-y, --yes', 'Auto-confirm prompts')
  .action(async (opts) => {
    await macosSetupCommand(Boolean(opts.yes));
  });

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
