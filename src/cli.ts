#!/usr/bin/env node

import { Command } from 'commander';
import chalk from 'chalk';
import { readFileSync, writeFileSync } from 'fs';
import { join } from 'path';
import fs from 'fs/promises';
import ora from 'ora';
import { deviceInfoCommand, waitForBootloaderCommand } from './commands/device';
import { registerKeymapCommands } from './commands/keymap';
import { registerOLEDCommands } from './commands/oled';
import { flashCommand } from './commands/flash';
import { registerSetupCommand } from './commands/setup';
import { registerTemplateCommands } from './commands/templates';
import macosSetupCommand from './commands/macos';
import { ProfileManager } from './core/keymap/manager';
import { keymapGenerator } from './core/keymap/generator';

// Read version from package.json
const packageJson = JSON.parse(
  readFileSync(join(__dirname, '..', 'package.json'), 'utf-8')
);

const program = new Command();

program
  .name('corne-cli')
  .description('CLI tool for customizing Corne keyboards with QMK firmware')
  .version(packageJson.version);

// Add a short usage example to help text
program.addHelpText('after', `

Short examples:
  corne-cli system:macos-setup --yes      # Auto-confirm macOS Homebrew/QMK setup
  corne-cli templates:install qwerty -k crkbd  # Install qwerty template into crkbd keymaps
`);

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
  .description('Compile keymap to QMK C code')
  .option('-k, --keymap <name>', 'Keymap profile name to compile')
  .option('-o, --output <path>', 'Output path for generated C code')
  .option('-b, --keyboard <name>', 'Keyboard name (crkbd, lily58, etc.)', 'crkbd')
  .action(async (options) => {
    const { keymap: keymapName, output, keyboard } = options;

    if (!keymapName) {
      console.log(chalk.red('✗ Error: --keymap is required'));
      console.log(chalk.gray('Usage: corne-cli compile --keymap <profile-name> [--output keymap.c] [--keyboard crkbd]'));
      process.exit(1);
    }

    const spinner = ora('Loading keymap...').start();
    const pm = new ProfileManager();

    try {
      const exists = await pm.exists(keymapName);
      if (!exists) {
        spinner.fail(chalk.red(`Keymap "${keymapName}" not found`));
        console.log(chalk.gray('Use "corne-cli keymap:list" to see available keymaps'));
        process.exit(1);
      }

      const keymap = await pm.load(keymapName);
      spinner.succeed(chalk.green(`Loaded keymap "${keymapName}"`));

      const outputPath = output || `./${keymapName}.c`;
      const code = keymapGenerator.generate(keymap, { keyboard });

      await fs.writeFile(outputPath, code);
      console.log(chalk.green(`✓ Compiled to ${outputPath}`));
      console.log(chalk.gray(`Keyboard: ${keyboard}`));
      console.log(chalk.gray(`Layers: ${keymap.layers.length}`));
    } catch (error) {
      spinner.fail(chalk.red('Compilation failed'));
      console.error(chalk.red((error as Error).message));
      process.exit(1);
    }
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
} catch (error) {
  const err = error as { code?: string; message?: string };
  if (err.code === 'commander.help') {
    process.exit(0);
  }
  console.error(chalk.red(`\n✗ ${err.message}\n`));
  process.exit(1);
}
