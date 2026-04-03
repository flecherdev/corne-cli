import { Command } from 'commander';
import inquirer from 'inquirer';
import chalk from 'chalk';
import ora from 'ora';
import Table from 'cli-table3';
import boxen from 'boxen';
import fs from 'fs/promises';
import path from 'path';
import { ProfileManager, KeymapValidator } from '../core/keymap';
import type { Keymap, OLEDConfig } from '../types';

const profileManager = new ProfileManager();
const validator = new KeymapValidator();

/**
 * Create a new keymap from template
 */
export async function createKeymapCommand(name: string, options: { template?: string }): Promise<void> {
  try {
    const spinner = ora('Creating keymap...').start();

    // Check if profile already exists
    if (await profileManager.exists(name)) {
      spinner.fail(chalk.red(`Profile "${name}" already exists`));
      const { overwrite } = await inquirer.prompt([
        {
          type: 'confirm',
          name: 'overwrite',
          message: 'Do you want to overwrite it?',
          default: false,
        },
      ]);

      if (!overwrite) {
        console.log(chalk.yellow('Operation cancelled.'));
        return;
      }
    }

    // Load template
    const template = options.template || 'qwerty';
    const templatePath = path.join(process.cwd(), 'templates', `${template}.json`);

    try {
      const templateData = await fs.readFile(templatePath, 'utf-8');
      const keymap: Keymap = JSON.parse(templateData);

      // Update name
      keymap.name = name;

      // Ensure config exists
      if (!keymap.config) {
        keymap.config = {
          tappingTerm: 200,
          permissiveHold: true,
        };
      }

      // Ask for OLED customization
      const { customizeOled } = await inquirer.prompt([
        {
          type: 'confirm',
          name: 'customizeOled',
          message: 'Do you want to customize OLED displays?',
          default: false,
        },
      ]);

      if (customizeOled) {
        keymap.config.oledConfig = await promptOLEDConfig(keymap.config.oledConfig);
      }

      // Validate keymap
      const validation = validator.validate(keymap);
      if (!validation.valid) {
        spinner.fail(chalk.red('Invalid keymap'));
        console.log(chalk.red('\nValidation errors:'));
        validation.errors.forEach((error) => console.log(chalk.red(`  • ${error}`)));
        return;
      }

      // Save profile
      await profileManager.save(keymap);
      spinner.succeed(chalk.green(`Created keymap "${name}"`));

      // Show summary
      showKeymapSummary(keymap);
    } catch (error) {
      spinner.fail(chalk.red(`Template "${template}" not found`));
      console.log(chalk.yellow('\nAvailable templates:'));
      const templates = await fs.readdir(path.join(process.cwd(), 'templates'));
      templates
        .filter((t) => t.endsWith('.json'))
        .forEach((t) => console.log(chalk.cyan(`  • ${t.replace('.json', '')}`)));
    }
  } catch (error) {
    console.error(chalk.red('Error creating keymap:'), error);
  }
}

/**
 * List all saved keymaps
 */
export async function listKeymapsCommand(): Promise<void> {
  try {
    const spinner = ora('Loading keymaps...').start();
    const profiles = await profileManager.list();
    spinner.stop();

    if (profiles.length === 0) {
      console.log(boxen(chalk.yellow('No keymaps found.\nCreate one with: corne-cli keymap:create <name>'), {
        padding: 1,
        margin: 1,
        borderStyle: 'round',
      }));
      return;
    }

    const table = new Table({
      head: [
        chalk.cyan('Name'),
        chalk.cyan('Layers'),
        chalk.cyan('OLED'),
        chalk.cyan('Description'),
      ],
      colWidths: [20, 10, 15, 40],
    });

    for (const profile of profiles) {
      const keymap = await profileManager.load(profile);
      const oledStatus = keymap.config?.oledConfig?.enabled
        ? chalk.green('✓ Enabled')
        : chalk.gray('✗ Disabled');

      table.push([
        chalk.white(keymap.name),
        chalk.yellow(keymap.layers.length.toString()),
        oledStatus,
        chalk.gray(keymap.description || ''),
      ]);
    }

    console.log('\n' + table.toString());
  } catch (error) {
    console.error(chalk.red('Error listing keymaps:'), error);
  }
}

/**
 * Edit an existing keymap
 */
export async function editKeymapCommand(name: string): Promise<void> {
  try {
    const spinner = ora('Loading keymap...').start();

    if (!(await profileManager.exists(name))) {
      spinner.fail(chalk.red(`Keymap "${name}" not found`));
      return;
    }

    const keymap = await profileManager.load(name);
    spinner.succeed(chalk.green(`Loaded keymap "${name}"`));

    // Show current configuration
    showKeymapSummary(keymap);

    // Main edit menu
    let editing = true;
    while (editing) {
      const { action } = await inquirer.prompt([
        {
          type: 'list',
          name: 'action',
          message: 'What would you like to edit?',
          choices: [
            { name: '🖥️  OLED Displays', value: 'oled' },
            { name: '📝  Description', value: 'description' },
            { name: '⚙️  Advanced Settings', value: 'settings' },
            { name: '💾  Save & Exit', value: 'save' },
            { name: '🚫  Cancel', value: 'cancel' },
          ],
        },
      ]);

      switch (action) {
        case 'oled':
          if (!keymap.config) {
            keymap.config = { tappingTerm: 200, permissiveHold: true };
          }
          keymap.config.oledConfig = await promptOLEDConfig(keymap.config.oledConfig);
          break;

        case 'description':
          const { description } = await inquirer.prompt([
            {
              type: 'input',
              name: 'description',
              message: 'Enter description:',
              default: keymap.description,
            },
          ]);
          keymap.description = description;
          break;

        case 'settings':
          if (!keymap.config) {
            keymap.config = { tappingTerm: 200, permissiveHold: true };
          }
          const settings = await inquirer.prompt([
            {
              type: 'number',
              name: 'tappingTerm',
              message: 'Tapping term (ms):',
              default: keymap.config.tappingTerm || 200,
            },
            {
              type: 'confirm',
              name: 'permissiveHold',
              message: 'Permissive hold:',
              default: keymap.config.permissiveHold ?? true,
            },
          ]);
          keymap.config.tappingTerm = settings.tappingTerm;
          keymap.config.permissiveHold = settings.permissiveHold;
          break;

        case 'save':
          const saveSpinner = ora('Saving keymap...').start();
          await profileManager.save(keymap);
          saveSpinner.succeed(chalk.green('Keymap saved successfully'));
          editing = false;
          break;

        case 'cancel':
          console.log(chalk.yellow('Changes discarded.'));
          editing = false;
          break;
      }
    }
  } catch (error) {
    console.error(chalk.red('Error editing keymap:'), error);
  }
}

/**
 * Delete a keymap
 */
export async function deleteKeymapCommand(name: string): Promise<void> {
  try {
    if (!(await profileManager.exists(name))) {
      console.log(chalk.red(`Keymap "${name}" not found`));
      return;
    }

    const { confirm } = await inquirer.prompt([
      {
        type: 'confirm',
        name: 'confirm',
        message: chalk.yellow(`Are you sure you want to delete "${name}"?`),
        default: false,
      },
    ]);

    if (confirm) {
      const spinner = ora('Deleting keymap...').start();
      await profileManager.delete(name);
      spinner.succeed(chalk.green(`Deleted keymap "${name}"`));
    } else {
      console.log(chalk.yellow('Operation cancelled.'));
    }
  } catch (error) {
    console.error(chalk.red('Error deleting keymap:'), error);
  }
}

/**
 * Show keymap information
 */
export async function showKeymapCommand(name: string): Promise<void> {
  try {
    const spinner = ora('Loading keymap...').start();

    if (!(await profileManager.exists(name))) {
      spinner.fail(chalk.red(`Keymap "${name}" not found`));
      return;
    }

    const keymap = await profileManager.load(name);
    spinner.stop();

    showKeymapSummary(keymap);

    // Show layer details
    console.log(chalk?.cyan('\n📚 Layers:\n'));
    keymap.layers.forEach((layer, index) => {
      console.log(chalk.white(`  ${index + 1}. ${chalk.bold(layer.name)} (${layer.keys.flat().length} keys)`));
    });

    // Show OLED config if enabled
    if (keymap.config?.oledConfig?.enabled) {
      console.log(chalk.cyan('\n🖥️  OLED Configuration:\n'));
      const oled = keymap.config.oledConfig;

      console.log(chalk.white('  Left Display:'));
      console.log(chalk.gray(`    Type: ${oled.leftDisplay.type}`));
      if (oled.leftDisplay.text) {
        console.log(chalk.gray(`    Text: ${oled.leftDisplay.text.join(' / ')}`));
      }

      console.log(chalk.white('\n  Right Display:'));
      console.log(chalk.gray(`    Type: ${oled.rightDisplay.type}`));
      if (oled.rightDisplay.logo) {
        console.log(chalk.gray(`    Logo: ${oled.rightDisplay.logo}`));
      }
      if (oled.rightDisplay.text) {
        console.log(chalk.gray(`    Text: ${oled.rightDisplay.text.join(' / ')}`));
      }

      console.log(chalk.white(`\n  Timeout: ${oled.timeout}s`));
      console.log(chalk.white(`  Rotation: ${oled.rotation}°`));
    }
  } catch (error) {
    console.error(chalk.red('Error showing keymap:'), error);
  }
}

/**
 * Prompt for OLED configuration
 */
async function promptOLEDConfig(existingConfig?: OLEDConfig): Promise<OLEDConfig> {
  const { enabled } = await inquirer.prompt([
    {
      type: 'confirm',
      name: 'enabled',
      message: 'Enable OLED displays?',
      default: existingConfig?.enabled ?? true,
    },
  ]);

  if (!enabled) {
    return { enabled: false, leftDisplay: { type: 'none' }, rightDisplay: { type: 'none' } };
  }

  // Left display configuration
  const { leftType } = await inquirer.prompt([
    {
      type: 'list',
      name: 'leftType',
      message: 'Left display type:',
      choices: [
        { name: '⌨️  Key Logger (shows last pressed key)', value: 'keylog' },
        { name: '📊  Status (layer, WPM, caps)', value: 'status' },
        { name: '📝  Custom Text', value: 'custom' },
        { name: '🖼️  Custom Image (requires image file)', value: 'image' },
        { name: '🚫  Disabled', value: 'none' },
      ],
      default: existingConfig?.leftDisplay.type || 'keylog',
    },
  ]);

  const leftDisplay: OLEDConfig['leftDisplay'] = { type: leftType };

  if (leftType === 'custom') {
    const { text } = await inquirer.prompt([
      {
        type: 'input',
        name: 'text',
        message: 'Enter text lines (comma-separated, max 4 lines):',
        default: existingConfig?.leftDisplay.text?.join(', ') || 'Line 1, Line 2',
      },
    ]);
    leftDisplay.text = text.split(',').map((t: string) => t.trim()).slice(0, 4);
  } else if (leftType === 'image') {
    const { imagePath } = await inquirer.prompt([
      {
        type: 'input',
        name: 'imagePath',
        message: 'Enter image file path (PNG/JPG, will be converted to 128x32):',
      },
    ]);
    leftDisplay.image = imagePath;
  } else if (leftType === 'keylog' || leftType === 'status') {
    leftDisplay.text = leftType === 'keylog'
      ? ['Key Logger', 'Last key:']
      : ['Layer:', 'WPM:', 'Caps:'];
  }

  // Right display configuration
  const { rightType } = await inquirer.prompt([
    {
      type: 'list',
      name: 'rightType',
      message: 'Right display type:',
      choices: [
        { name: '🖼️  Corne Logo', value: 'logo' },
        { name: '📝  Custom Text', value: 'custom' },
        { name: '🖼️  Custom Image (requires image file)', value: 'image' },
        { name: '🚫  Disabled', value: 'none' },
      ],
      default: existingConfig?.rightDisplay.type || 'logo',
    },
  ]);

  const rightDisplay: OLEDConfig['rightDisplay'] = { type: rightType };

  if (rightType === 'logo') {
    rightDisplay.logo = 'corne';
  } else if (rightType === 'custom') {
    const { text } = await inquirer.prompt([
      {
        type: 'input',
        name: 'text',
        message: 'Enter text lines (comma-separated, max 4 lines):',
        default: existingConfig?.rightDisplay?.text?.join(', ') || 'My, Custom, Keyboard',
      },
    ]);
    rightDisplay.text = text.split(',').map((t: string) => t.trim()).slice(0, 4);
  } else if (rightType === 'image') {
    const { imagePath } = await inquirer.prompt([
      {
        type: 'input',
        name: 'imagePath',
        message: 'Enter image file path (PNG/JPG, will be converted to 128x32):',
      },
    ]);
    rightDisplay.image = imagePath;
  }

  // Advanced settings
  const { timeout, rotation } = await inquirer.prompt([
    {
      type: 'number',
      name: 'timeout',
      message: 'OLED timeout (seconds, 0 = never):',
      default: existingConfig?.timeout ?? 30,
    },
    {
      type: 'list',
      name: 'rotation',
      message: 'Display rotation:',
      choices: [
        { name: '0° (normal)', value: 0 },
        { name: '90° (clockwise)', value: 90 },
        { name: '180° (upside down)', value: 180 },
        { name: '270° (counter-clockwise)', value: 270 },
      ],
      default: existingConfig?.rotation ?? 0,
    },
  ]);

  return {
    enabled: true,
    leftDisplay,
    rightDisplay,
    timeout,
    rotation,
  };
}

/**
 * Show keymap summary in a box
 */
function showKeymapSummary(keymap: Keymap): void {
  const summary = [
    chalk.bold.white(keymap.name),
    chalk.gray(keymap.description || 'No description'),
    '',
    chalk.cyan(`Layers: ${keymap.layers.length}`),
    chalk.cyan(`OLED: ${keymap.config?.oledConfig?.enabled ? chalk.green('✓ Enabled') : chalk.gray('✗ Disabled')}`),
  ].join('\n');

  console.log('\n' + boxen(summary, {
    padding: 1,
    margin: 1,
    borderStyle: 'round',
    borderColor: 'cyan',
  }));
}

/**
 * Register keymap commands
 */
export function registerKeymapCommands(program: Command): void {
  const keymap = program
    .command('keymap')
    .description('Manage keyboard keymaps and profiles');

  keymap
    .command('create <name>')
    .description('Create a new keymap from template')
    .option('-t, --template <template>', 'Template to use (qwerty, colemak)', 'qwerty')
    .action(createKeymapCommand);

  keymap
    .command('list')
    .alias('ls')
    .description('List all saved keymaps')
    .action(listKeymapsCommand);

  keymap
    .command('edit <name>')
    .description('Edit an existing keymap')
    .action(editKeymapCommand);

  keymap
    .command('show <name>')
    .alias('info')
    .description('Show keymap details')
    .action(showKeymapCommand);

  keymap
    .command('delete <name>')
    .alias('rm')
    .description('Delete a keymap')
    .action(deleteKeymapCommand);
}
