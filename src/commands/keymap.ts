import { Command } from 'commander';
import inquirer from 'inquirer';
import chalk from 'chalk';
import ora from 'ora';
import Table from 'cli-table3';
import boxen from 'boxen';
import fs from 'fs/promises';
import fsp from 'fs';
import path from 'path';
import { spawn } from 'child_process';
import { ProfileManager, KeymapValidator, keymapGenerator } from '../core/keymap';
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

        case 'description': {
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
        }

        case 'settings': {
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
        }

        case 'save': {
          const saveSpinner = ora('Saving keymap...').start();
          await profileManager.save(keymap);
          saveSpinner.succeed(chalk.green('Keymap saved successfully'));
          editing = false;
          break;
        }

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

  keymap
    .command('install <name>')
    .description('Install keymap to QMK and flash to keyboard')
    .option('-k, --keyboard <name>', 'Keyboard name (crkbd, lily58, etc.)', 'crkbd')
    .option('--no-flash', 'Only compile, do not flash')
    .option('-y, --yes', 'Auto-confirm all prompts')
    .option('--rp2040', 'Compile for RP2040 microcontroller (auto-detects UF2 volume)')
    .option('--via', 'Enable VIA support for dynamic keymap configuration')
    .action(installKeymapCommand);

  keymap
    .command('flash')
    .description('Copy latest UF2 to keyboard in bootloader mode')
    .option('-k, --keyboard <name>', 'Keyboard name', 'crkbd')
    .action(flashKeymapCommand);
}

async function flashKeymapCommand(options: { keyboard?: string }): Promise<void> {
  const keyboard = options.keyboard || 'crkbd';
  const spinner = ora('Searching for UF2 file...').start();

  console.log(chalk.cyan('\n🔍 Diagnostics:'));

  const uf2Volumes = ['/Volumes/RPI-RP2', '/Volumes/RPI-RP2 (1)', '/Volumes/UF2', '/Volumes/dpi-rp2'];
  let bootVolume: string | null = null;

  for (const vol of uf2Volumes) {
    try {
      await fs.access(vol);
      bootVolume = vol;
      console.log(chalk.green(`  ✓ Bootloader volume detected: ${vol}`));
      break;
    } catch {}
  }

  if (!bootVolume) {
    console.log(chalk.yellow('  ⚠ No bootloader volume found'));
  }

  try {
    const qmkHome = await findQmkHome();
    if (!qmkHome) {
      spinner.fail(chalk.red('QMK not found'));
      return;
    }

    const qmkFiles = await fs.readdir(qmkHome);
    const uf2Files = qmkFiles.filter(f => f.endsWith('.uf2')).map(f => path.join(qmkHome, f));

    if (uf2Files.length === 0) {
      spinner.fail(chalk.red('No UF2 file found. Compile a keymap first.'));
      return;
    }

    const latest = uf2Files.sort((a: string, b: string) => {
      const statA = fsp.statSync(a);
      const statB = fsp.statSync(b);
      return statB.mtime.getTime() - statA.mtime.getTime();
    })[0];

    spinner.succeed(chalk.green(`Found: ${path.basename(latest)}`));

    if (!bootVolume) {
      console.log(chalk.yellow('\n⚠ Keyboard not in bootloader mode.'));
      console.log(chalk.cyan('  To enter bootloader:'));
      console.log(chalk.gray('    1. Disconnect USB'));
      console.log(chalk.gray('    2. Hold BOOT button (or closest to USB)'));
      console.log(chalk.gray('    3. Connect USB while holding BOOT'));
      console.log(chalk.gray('    4. Wait for RPI-RP2 volume to appear'));
      console.log(chalk.cyan('\nPress Enter when keyboard is in bootloader mode...'));
      await inquirer.prompt([{ type: 'input', name: 'wait', message: '' }]);

      for (const vol of uf2Volumes) {
        try {
          await fs.access(vol);
          bootVolume = vol;
          console.log(chalk.green(`  ✓ Bootloader volume detected: ${vol}`));
          break;
        } catch {}
      }
    }

    if (!bootVolume) {
      spinner.fail(chalk.red('Bootloader volume not found'));
      console.log(chalk.red('\n❌ Troubleshooting:'));
      console.log(chalk.gray('  - Check USB cable is connected'));
      console.log(chalk.gray('  - Try a different USB port'));
      console.log(chalk.gray('  - Check if BOOT button is working'));
      console.log(chalk.gray('  - Verify PCB has valid RP2040 firmware'));
      return;
    }

    await fs.copyFile(latest, path.join(bootVolume, path.basename(latest)));
    spinner.succeed(chalk.green(`✓ Flashed: ${path.basename(latest)}`));
    console.log(chalk.cyan('\n🔄 Waiting for keyboard to reconnect...'));

    await new Promise(resolve => setTimeout(resolve, 3000));

    console.log(chalk.green('\n✅ Flash complete!'));
    console.log(chalk.cyan('\nIf keyboard does not work:'));
    console.log(chalk.gray('  - Check if detected in System Preferences > Keyboard'));
    console.log(chalk.gray('  - Try via.app or remap.io to detect'));

  } catch (error) {
    spinner.fail(chalk.red('Flash failed'));
    console.error(chalk.red((error as Error).message));
  }
}

async function installKeymapCommand(name: string, options: { keyboard?: string; flash?: boolean; yes?: boolean; rp2040?: boolean; via?: boolean }): Promise<void> {
  const spinner = ora('Loading keymap...').start();
  const keyboard = options.keyboard || 'crkbd';
  const doFlash = options.flash !== false;
  const isRp2040 = options.rp2040 === true;
  const isVia = options.via === true;

  try {
    const exists = await profileManager.exists(name);
    if (!exists) {
      spinner.fail(chalk.red(`Keymap "${name}" not found`));
      return;
    }

    const keymap = await profileManager.load(name);
    spinner.succeed(chalk.green(`Loaded keymap "${name}"`));

    const qmkHome = await findQmkHome();
    if (!qmkHome) {
      console.log(chalk.red('✗ QMK not found'));
      console.log(chalk.cyan('Please install QMK first:'));
      console.log(chalk.gray('  npm run start -- system:macos-setup --yes'));
      return;
    }

    const keymapDir = path.join(qmkHome, 'keyboards', keyboard, 'keymaps', name);
    await fs.mkdir(keymapDir, { recursive: true });

    const code = keymapGenerator.generate(keymap, { keyboard });
    const keymapPath = path.join(keymapDir, 'keymap.c');
    await fs.writeFile(keymapPath, code);

    console.log(chalk.green(`✓ Keymap copied to ${keymapPath}`));

    if (isVia) {
      const rulesPath = path.join(keymapDir, 'rules.mk');
      await fs.writeFile(rulesPath, 'VIA_ENABLE = yes\n');
      console.log(chalk.green(`✓ VIA enabled: ${rulesPath}`));
    }

    if (!doFlash) {
      const compileCmd = isRp2040
        ? `qmk compile -kb ${keyboard} -km ${name} -e CONVERT_TO=promicro_rp2040`
        : `qmk compile -kb ${keyboard} -km ${name}`;
      console.log(chalk.gray('\nTo compile and flash, run:'));
      console.log(chalk.cyan(compileCmd));
      return;
    }

    const hasQmk = await checkCommandExists('qmk');
    if (!hasQmk) {
      console.log(chalk.yellow('⚠ QMK CLI not found. Install with:'));
      console.log(chalk.cyan('  pip install qmk'));
      return;
    }

    console.log(chalk.cyan('\n📦 Compiling firmware...'));
    const compileArgs = ['compile', '-kb', keyboard, '-km', name];
    if (isRp2040) {
      compileArgs.push('-e', 'CONVERT_TO=promicro_rp2040');
      console.log(chalk.gray('  (RP2040 mode)'));
    }
    await runCommand('qmk', compileArgs);

    console.log(chalk.green('✓ Compilation successful!'));

    if (isRp2040) {
      console.log(chalk.cyan('\n🔄 Auto-detecting UF2 volume...'));
      const uf2File = path.basename(keymapPath).replace('keymap.c', isRp2040 ? '_rp2040.uf2' : '.uf2');
      const uf2Path = path.join(qmkHome, uf2File);
      const altUf2 = path.join(qmkHome, `crkbd_rev1_${name}${isRp2040 ? '_promicro_rp2040' : ''}.uf2`);

      let finalUf2 = uf2Path;
      try { await fs.access(uf2Path); }
      catch { finalUf2 = altUf2; }

      const volumes = ['/Volumes/RPI-RP2', '/Volumes/RPI-RP2 (1)', '/Volumes/UF2', '/Volumes/dpi-rp2'];
      let mountedVolume: string | null = null;

      for (const vol of volumes) {
        try { await fs.access(vol); mountedVolume = vol; break; }
        catch {}
      }

      if (!mountedVolume) {
        console.log(chalk.yellow('\n⚠ Put keyboard in bootloader mode and press Enter...'));
        await inquirer.prompt([{ type: 'input', name: 'wait', message: 'Press Enter when ready...' }]);
        for (const vol of volumes) {
          try { await fs.access(vol); mountedVolume = vol; break; }
          catch {}
        }
      }

      if (!mountedVolume) {
        console.log(chalk.red('\n✗ UF2 volume not found. Firmware compiled at:'));
        console.log(chalk.cyan(`  ${finalUf2}`));
        console.log(chalk.gray('\nCopy manually to keyboard bootloader volume.'));
        return;
      }

      await fs.copyFile(finalUf2, path.join(mountedVolume, path.basename(finalUf2)));
      console.log(chalk.green(`\n✓ Flashed to keyboard!`));
      console.log(chalk.cyan('\n🔄 Keyboard will reconnect in 3 seconds...'));
      return;
    }

    // Check if keyboard is in bootloader mode
    const { waitBootloader } = await inquirer.prompt([{
      type: 'confirm',
      name: 'waitBootloader',
      message: chalk.yellow('Put your keyboard in bootloader mode and press Enter to flash'),
      default: true,
    }]);

    if (waitBootloader) {
      console.log(chalk.cyan('\n🔥 Flashing firmware...'));
      await runCommand('qmk', ['flash', '-kb', keyboard, '-km', name]);
      console.log(chalk.green('✓ Flash successful!'));
    }

  } catch (error) {
    spinner.fail(chalk.red('Installation failed'));
    console.error(chalk.red((error as Error).message));
  }
}

async function findQmkHome(): Promise<string | null> {
  const candidates = [
    process.env.QMK_HOME,
    path.join(process.env.HOME || '', 'qmk_firmware'),
    path.join(process.env.HOME || '', '.qmk'),
    path.join(process.env.HOME || '', 'qmk'),
    '/usr/local/qmk_firmware',
  ].filter(Boolean);

  for (const p of candidates) {
    try {
      await fs.access(p!);
      return p!;
    } catch {}
  }
  return null;
}

async function checkCommandExists(cmd: string): Promise<boolean> {
  return new Promise((resolve) => {
    const proc = spawn(cmd, ['--version'], { stdio: 'ignore' });
    proc.on('close', (code) => resolve(code === 0));
    proc.on('error', () => resolve(false));
  });
}

function runCommand(cmd: string, args: string[]): Promise<void> {
  return new Promise((resolve, reject) => {
    const proc = spawn(cmd, args, { stdio: 'inherit' });
    proc.on('close', (code) => {
      if (code === 0) resolve();
      else reject(new Error(`${cmd} exited with code ${code}`));
    });
    proc.on('error', reject);
  });
}
