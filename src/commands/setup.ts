import { Command } from 'commander';
import inquirer from 'inquirer';
import chalk from 'chalk';
import boxen from 'boxen';
import path from 'path';
import fs from 'fs/promises';

import { BootloaderDetector } from '../core/bootloader';
import { exec as cpExec } from 'child_process';
import { promisify } from 'util';
const exec = promisify(cpExec);
import { profileManager } from '../core/keymap/manager';
import { Keymap } from '../types';

/**
 * Interactive setup wizard
 */
export async function setupWizardCommand(): Promise<void> {
  console.log('\n' + boxen(
    chalk.cyan.bold('⚙️  Corne CLI - Setup Wizard\n\n') +
    chalk.white('This wizard will help you create a keymap profile and prepare your environment.') +
    '\n',
    { padding: 1, margin: 1, borderStyle: 'round', borderColor: 'cyan' }
  ));

  // Step 1: detect connected devices
  const detector = new BootloaderDetector();
  let devices = [] as any[];
  try {
    devices = await detector.listDevices();
  } catch (err) {
    console.warn(chalk.yellow('Warning: unable to enumerate HID devices'));
  }

  // Environment detection: platform, qmk_firmware path, qmk CLI
  async function detectQmkHome(): Promise<string | null> {
    const homedir = process.env.HOME || process.env.USERPROFILE || '';
    const candidates = [
      path.join(homedir, 'qmk_firmware'),
      path.join(homedir, '.qmk'),
      path.join(homedir, 'qmk'),
      path.join('/', 'qmk_firmware'),
    ];

    for (const p of candidates) {
      try {
        const stat = await fs.stat(p);
        if (stat && stat.isDirectory()) return p;
      } catch {
        // ignore
      }
    }

    return null;
  }

  async function hasQmkCli(): Promise<boolean> {
    try {
      // Try running `qmk --version`
      await exec('qmk --version');
      return true;
    } catch {
      return false;
    }
  }

  const detectedQmkHome = await detectQmkHome();
  const qmkCliPresent = await hasQmkCli();

  console.log('\n' + boxen(
    chalk.cyan.bold('🧭 Environment Detection\n\n') +
    chalk.white(`Platform: ${process.platform} ${process.arch}\n`) +
    chalk.white(`QMK CLI: ${qmkCliPresent ? chalk.green('found') : chalk.yellow('not found on PATH')}\n`) +
    chalk.white(`qmk_firmware: ${detectedQmkHome ? chalk.green(detectedQmkHome) : chalk.yellow('not found in common locations')}\n`),
    { padding: 1, margin: 1, borderStyle: 'round', borderColor: 'cyan' }
  ));

  // Ask user to provide qmk_firmware path if not detected
  let qmkHomeAnswer: string | undefined = undefined;
  if (!detectedQmkHome) {
    const qmkResp = await inquirer.prompt([
      {
        type: 'input',
        name: 'qmkHome',
        message: 'Enter path to your `qmk_firmware` directory (leave blank to skip):',
        default: '',
      },
    ]);
    if (qmkResp.qmkHome && qmkResp.qmkHome.trim() !== '') {
      const providedPath = qmkResp.qmkHome.trim();
      qmkHomeAnswer = providedPath;
      try {
        const stat = await fs.stat(providedPath);
        if (!stat.isDirectory()) {
          console.warn(chalk.yellow('Provided qmk_firmware path does not look like a directory. It will be stored but may be invalid.'));
        }
      } catch {
        console.warn(chalk.yellow('Provided qmk_firmware path not accessible. You can update this later.'));
      }
    }
  }

  const deviceChoices = devices.map((d, i) => ({
    name: `${d.product || 'Unknown'}${d.bootloader ? ` — ${d.bootloader.type}` : ''} ${d.serialNumber ? `(${d.serialNumber})` : ''}`,
    value: i,
  }));

  deviceChoices.unshift({ name: 'Skip device detection / Configure manually', value: -1 });

  const answers1 = await inquirer.prompt([
    {
      type: 'list',
      name: 'device',
      message: 'Detected USB devices (choose one to auto-configure or skip):',
      choices: deviceChoices,
    },
  ]);

  let selectedDevice = null;
  if (answers1.device !== -1) {
    selectedDevice = devices[answers1.device];
    console.log(chalk.green(`Selected device: ${selectedDevice.product || 'Unknown'}`));
  }

  // Step 2: choose template
  const templatesDir = path.join(__dirname, '../../templates');
  let templates: string[] = [];
  try {
    const files = await fs.readdir(templatesDir);
    templates = files.filter(f => f.endsWith('.json'));
  } catch (err) {
    // ignore
  }

  const templateChoices = templates.map(t => ({ name: t.replace('.json', ''), value: t }));
  templateChoices.unshift({ name: 'Empty keymap', value: '__empty__' });

  const answers2 = await inquirer.prompt([
    {
      type: 'list',
      name: 'template',
      message: 'Choose a keymap template to start from:',
      choices: templateChoices,
    },
    {
      type: 'input',
      name: 'profileName',
      message: 'Profile name to save as: ',
      default: selectedDevice?.product ? `${selectedDevice.product.toString().toLowerCase().replace(/\s+/g, '-')}-profile` : 'my-keymap',
      validate: (s: string) => (s && s.trim().length > 0) ? true : 'Profile name is required',
    },
    {
      type: 'confirm',
      name: 'saveNow',
      message: 'Save this profile now to `./profiles`?',
      default: true,
    },
  ]);

  // Build keymap object
  let keymap: Keymap = {
    name: answers2.profileName,
    description: '',
    author: process.env.USER || undefined,
    layers: [],
    config: {},
  };

  if (answers2.template && answers2.template !== '__empty__') {
    try {
      const content = await fs.readFile(path.join(templatesDir, answers2.template), 'utf-8');
      const parsed = JSON.parse(content) as Keymap;
      // ensure name from profile overrides template name
      parsed.name = keymap.name;
      keymap = parsed;
    } catch (err) {
      console.error(chalk.red('Failed to load template, proceeding with empty keymap.'));
    }
  } else {
    // Provide a very small default base layer
    keymap.layers = [
      { name: 'BASE', keys: [['KC_TAB', 'KC_Q', 'KC_W', 'KC_E', 'KC_R', 'KC_T']] },
    ];
    keymap.description = 'Empty starting profile created by Corne CLI setup wizard';
  }

  if (answers2.saveNow) {
    try {
      await profileManager.save(keymap);
      console.log(chalk.green(`Saved profile: ${keymap.name} → ./profiles/${keymap.name}.json`));
    } catch (err: any) {
      console.error(chalk.red('Failed to save profile:'), err.message || err);
    }
  }

  // Offer to generate example keymap files
  const genAnswers = await inquirer.prompt([
    {
      type: 'confirm',
      name: 'generateFiles',
      message: 'Generate example keymap and helper files for this profile now?',
      default: true,
    },
  ]);

  if (genAnswers.generateFiles) {
    // Choose destination
    const destChoices = [
      { name: 'Current directory (./)', value: process.cwd() } as any,
    ];

    if (detectedQmkHome || qmkHomeAnswer) {
      const qPath = detectedQmkHome || qmkHomeAnswer;
      destChoices.unshift({ name: `QMK firmware keymaps (${qPath})`, value: qPath });
    }

    const destResp = await inquirer.prompt([
      {
        type: 'list',
        name: 'dest',
        message: 'Where would you like to generate the files?',
        choices: destChoices,
      },
      {
        type: 'input',
        name: 'keyboardPath',
        when: (a: any) => a.dest !== process.cwd(),
        message: 'Relative keyboard path under qmk_firmware (e.g., keyboards/crkbd/keymaps):',
        default: 'keyboards/crkbd/keymaps',
      },
    ]);

    const targetRoot = destResp.dest as string;
    const keyboardPath = destResp.keyboardPath || '';
    const profileDir = path.join(targetRoot, keyboardPath, keymap.name);

    try {
      await fs.mkdir(profileDir, { recursive: true });

      // Write a minimal keymap.c
      const keymapC = `#include QMK_KEYBOARD_H

// Auto-generated example keymap by Corne CLI setup wizard
// Profile: ${keymap.name}

const uint16_t PROGMEM keymaps[][MATRIX_ROWS][MATRIX_COLS] = {
    [0] = LAYOUT(
        KC_TAB, KC_Q, KC_W, KC_E, KC_R, KC_T,
        KC_Y, KC_U, KC_I, KC_O, KC_P, KC_BSPC
    )
};
`;

      await fs.writeFile(path.join(profileDir, 'keymap.c'), keymapC, 'utf-8');

      // Write rules.mk
      const rulesMk = `# Auto-generated rules.mk\n\n`;
      await fs.writeFile(path.join(profileDir, 'rules.mk'), rulesMk, 'utf-8');

      // Write config.h (basic placeholder)
      const configH = `/* Auto-generated config.h */\n#ifndef CONFIG_H\n#define CONFIG_H\n\n#define TAPPING_TERM 200\n#define PERMISSIVE_HOLD\n\n#endif\n`;
      await fs.writeFile(path.join(profileDir, 'config.h'), configH, 'utf-8');

      // If OLED is enabled in template, write placeholder header
      if (keymap.config?.oledConfig?.enabled) {
        const oledHeader = `// OLED assets placeholder for profile ${keymap.name}\n// Use corne-cli oled animate to generate actual header files.`;
        await fs.writeFile(path.join(profileDir, `${keymap.name}_oled.h`), oledHeader, 'utf-8');
      }

      console.log(chalk.green(`Generated example keymap files in: ${profileDir}`));
      console.log(chalk.gray('Files: keymap.c, config.h, rules.mk' + (keymap.config?.oledConfig?.enabled ? ', OLED header' : '')));
    } catch (err: any) {
      console.error(chalk.red('Failed to generate example files:'), err.message || err);
    }
  }

  // Final instructions
  console.log('\n' + boxen(
    chalk.cyan.bold('Next Steps:\n\n') +
    chalk.white('1. Copy the generated profile into your QMK keymap directory when ready.\n') +
    chalk.white('2. Run `qmk compile` and `corne-cli flash` to build and flash firmware.\n\n') +
    chalk.gray('Tip: Use `corne-cli keymap:list` to view saved profiles.'),
    { padding: 1, margin: 1, borderStyle: 'round', borderColor: 'green' }
  ));
}

export function registerSetupCommand(program: Command) {
  program
    .command('setup')
    .description('Interactive setup wizard to create a keymap profile and configure device')
    .action(setupWizardCommand);
}

export default setupWizardCommand;
