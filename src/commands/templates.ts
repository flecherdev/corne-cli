import { Command } from 'commander';
import chalk from 'chalk';
import path from 'path';
import fs from 'fs/promises';
import boxen from 'boxen';
import inquirer from 'inquirer';
import { exec as cpExec } from 'child_process';
import { promisify } from 'util';
import os from 'os';
const exec = promisify(cpExec);
import Ajv from 'ajv';
import { Keymap } from '../types';
import { profileManager } from '../core/keymap/manager';

function validateTemplate(obj: any): { valid: boolean; errors?: string[] } {
  // Use AJV for schema validation with a more strict schema
  const schema = {
    $id: 'https://corne-cli.dev/schemas/template.json',
    type: 'object',
    required: ['name', 'layers', 'files'],
    properties: {
      name: { type: 'string', minLength: 1 },
      description: { type: 'string' },
      author: { type: 'string' },
      layers: { type: 'array', minItems: 1, items: { type: 'array' } },
      config: { type: 'object' },
      files: {
        type: 'array',
        items: {
          type: 'object',
          required: ['path', 'content'],
          properties: {
            path: { type: 'string' },
            content: { type: 'string' },
          },
          additionalProperties: false,
        },
      },
      variables: {
        type: 'object',
        additionalProperties: { type: 'string' },
      },
    },
    additionalProperties: false,
  };

  const ajv = new Ajv({ allErrors: true });
  const validate = ajv.compile(schema as any);
  const valid = validate(obj);
  if (valid) return { valid: true };
  const errors = (validate.errors || []).map(e => `${e.instancePath} ${e.message}`);
  return { valid: false, errors };
}

function applyVariables(str: string, vars: Record<string, string>): string {
  return str.replace(/\{\{\s*([A-Z_]+)\s*\}\}/g, (_m, key) => vars[key] ?? '');
}

export async function listTemplatesCommand(): Promise<void> {
  const templatesDir = path.join(__dirname, '../../templates');
  try {
    const files = await fs.readdir(templatesDir);
    const templates = files.filter(f => f.endsWith('.json')).map(f => f.replace('.json', ''));

    console.log('\n' + boxen(chalk.cyan.bold('Available Templates') + '\n\n' + templates.join('\n'), { padding: 1 }));
  } catch (err: any) {
    console.error(chalk.red('Failed to list templates:'), err.message || err);
  }
}

export async function applyTemplateCommand(name: string, options: { target?: string }): Promise<void> {
  const templatesDir = path.join(__dirname, '../../templates');
  const fileName = `${name}.json`;
  try {
    const content = await fs.readFile(path.join(templatesDir, fileName), 'utf-8');
    const keymap = JSON.parse(content) as Keymap;

    // Basic validation
    const check = validateTemplate(keymap as any);
    if (!check.valid) {
      console.error(chalk.red('Template validation failed:'));
      check.errors?.forEach(e => console.error(chalk.yellow(` - ${e}`)));
      return;
    }

    // Save to profiles (overwrite confirmation)
    const exists = await profileManager.exists(keymap.name).catch(() => false);
    if (exists) {
      const { confirmOverwrite } = await inquirer.prompt([{
        type: 'confirm',
        name: 'confirmOverwrite',
        message: `Profile './profiles/${keymap.name}.json' already exists. Overwrite?`,
        default: false,
      }]);
      if (!confirmOverwrite) {
        console.log(chalk.yellow('Aborted: profile not overwritten'));
        return;
      }
    }

    await profileManager.save(keymap);
    console.log(chalk.green(`Saved template '${name}' to ./profiles/${name}.json`));

    // Optionally generate files in target
    const target = options.target || process.cwd();

    // If target looks like a qmk_firmware root, require keyboardPath to avoid accidental writes
    let keyboardPath = options.target ? '' : '';
    if (target.includes('qmk_firmware')) {
      // try to detect common keyboards folder
      keyboardPath = 'keyboards/crkbd/keymaps';
    }

    const dest = path.join(target, name);
    // If dest exists and non-empty, ask before overwriting
    let shouldWrite = true;
    try {
      const stat = await fs.stat(dest);
      if (stat && stat.isDirectory()) {
        const existing = await fs.readdir(dest);
        if (existing.length > 0) {
          const { confirmGen } = await inquirer.prompt([{
            type: 'confirm',
            name: 'confirmGen',
            message: `Target directory '${dest}' is not empty. Overwrite files inside?`,
            default: false,
          }]);
          shouldWrite = confirmGen;
        }
      }
    } catch {
      // not exists, ok
    }

    if (!shouldWrite) {
      console.log(chalk.yellow('Aborted: did not generate files')); 
      return;
    }

    await fs.mkdir(dest, { recursive: true });

    // If user provided a repo target (contains ':') we may be dealing with a remote; not handled here

    // Simple variable substitution
    const vars: Record<string, string> = {
      PROFILE_NAME: keymap.name,
      AUTHOR: keymap.author || process.env.USER || '',
    };

    const keymapC = applyVariables(`#include QMK_KEYBOARD_H
// Example keymap generated from template {{PROFILE_NAME}}

// Profile: {{PROFILE_NAME}}
`, vars);

    await fs.writeFile(path.join(dest, 'keymap.c'), keymapC, 'utf-8');
    await fs.writeFile(path.join(dest, 'rules.mk'), applyVariables(`# rules for {{PROFILE_NAME}}\n`, vars), 'utf-8');
    await fs.writeFile(path.join(dest, 'config.h'), applyVariables(`// config placeholder for {{PROFILE_NAME}}\n`, vars), 'utf-8');

    console.log(chalk.green(`Generated example files at: ${dest}`));
  } catch (err: any) {
    console.error(chalk.red('Failed to apply template:'), err.message || err);
  }
}

export function registerTemplateCommands(program: Command) {
  program
    .command('templates:list')
    .description('List available firmware/keymap templates')
    .action(listTemplatesCommand);

  program
    .command('templates:apply <name>')
    .description('Apply a template and save to ./profiles (optionally generate example files)')
    .option('-t, --target <path>', 'Target directory to generate example files')
    .action(async (name: string, opts: any) => {
      await applyTemplateCommand(name, { target: opts.target });
    });

  program
    .command('templates:sync <repo>')
    .description('Sync templates from a remote git repository (git must be installed)')
    .action(async (repo: string) => {
      await syncTemplates(repo);
    });

  program
    .command('templates:install <name>')
    .description('Install template into a qmk_firmware keyboard keymaps directory')
    .option('-k, --keyboard <keyboard>', 'Keyboard folder under qmk_firmware (e.g. crkbd)')
    .option('-q, --qmk-home <path>', 'Path to qmk_firmware (defaults to $HOME/qmk_firmware)')
    .action(async (name: string, opts: any) => {
      const qmkHome = opts.qmkHome || path.join(process.env.HOME || process.env.USERPROFILE || '.', 'qmk_firmware');
      const keyboard = opts.keyboard;
      await installTemplate(name, keyboard, qmkHome);
    });
}

export async function syncTemplates(repo: string): Promise<void> {
  const templatesDir = path.join(__dirname, '../../templates');
  const tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'templates-'));
  try {
    console.log(chalk.cyan(`Cloning ${repo} into ${tmpDir}...`));
    await exec(`git clone --depth 1 ${repo} ${tmpDir}`);
    // copy any *.json from tmpDir/templates to templatesDir
    const srcDir = path.join(tmpDir, 'templates');
    const files = await fs.readdir(srcDir).catch(() => []);
    const jsonFiles = files.filter(f => f.endsWith('.json'));
    if (jsonFiles.length === 0) {
      console.log(chalk.yellow('No template JSON files found in remote repo under /templates'));
      return;
    }
    await fs.mkdir(templatesDir, { recursive: true });
    for (const f of jsonFiles) {
      const src = path.join(srcDir, f);
      const dest = path.join(templatesDir, f);
      await fs.copyFile(src, dest);
      console.log(chalk.green(`Synced template: ${f}`));
    }
  } catch (err: any) {
    console.error(chalk.red('Failed to sync templates:'), err.message || err);
  } finally {
    // cleanup tmpDir
    try { await fs.rm(tmpDir, { recursive: true, force: true }); } catch {}
  }
}

export async function installTemplate(name: string, keyboard: string, qmkHome: string): Promise<void> {
  try {
    const templatesDir = path.join(__dirname, '../../templates');
    const tmplFile = path.join(templatesDir, `${name}.json`);
    const exists = await fs.stat(tmplFile).catch(() => null);
    if (!exists) {
      console.error(chalk.red(`Template '${name}' not found in ${templatesDir}`));
      return;
    }

    // Determine qmkHome if not provided or missing - try common locations
    async function detectQmkHome(): Promise<string | null> {
      const homedir = process.env.HOME || process.env.USERPROFILE || '';
      const candidates = [
        path.join(homedir, 'qmk_firmware'),
        path.join(homedir, '.qmk'),
        path.join(homedir, 'qmk'),
      ];
      for (const p of candidates) {
        try {
          const st = await fs.stat(p);
          if (st && st.isDirectory()) return p;
        } catch {}
      }
      return null;
    }

    const resolvedQmkHome = (await fs.stat(qmkHome).catch(() => null)) ? qmkHome : (await detectQmkHome()) || qmkHome;

    // If keyboard not provided, try to auto-detect keyboards under qmk_home/keyboards
    let resolvedKeyboard = keyboard;
    if (!resolvedKeyboard) {
      const kbDir = path.join(resolvedQmkHome, 'keyboards');
      let candidates: string[] = [];
      try {
        const items = await fs.readdir(kbDir, { withFileTypes: true });
        candidates = items.filter(i => i.isDirectory()).map(d => d.name);
      } catch {
        // ignore
      }

      if (candidates.length === 1) {
        resolvedKeyboard = candidates[0];
        console.log(chalk.cyan(`Auto-detected keyboard: ${resolvedKeyboard}`));
      } else if (candidates.length > 1) {
        const { choice } = await inquirer.prompt([{ type: 'list', name: 'choice', message: 'Select keyboard to install into:', choices: candidates }]);
        resolvedKeyboard = choice;
      } else {
        console.error(chalk.red(`No keyboards detected under ${resolvedQmkHome}. Use --keyboard to specify manually.`));
        return;
      }
    }

    // Determine destination
    const targetKeymapDir = path.join(resolvedQmkHome, 'keyboards', resolvedKeyboard, 'keymaps', name);

    // Safety: if qmkHome doesn't look like a qmk folder, warn
    const qmkStat = await fs.stat(resolvedQmkHome).catch(() => null);
    if (!qmkStat || !qmkStat.isDirectory()) {
      console.warn(chalk.yellow(`Warning: qmk_firmware path '${resolvedQmkHome}' not found or not a directory. Will create target directories if possible.`));
    }

    // If target exists and not empty, ask before overwriting
    let shouldWrite = true;
    try {
      const stat = await fs.stat(targetKeymapDir);
      if (stat && stat.isDirectory()) {
        const existing = await fs.readdir(targetKeymapDir);
        if (existing.length > 0) {
          const { confirm } = await inquirer.prompt([{ type: 'confirm', name: 'confirm', message: `Keymap folder ${targetKeymapDir} already exists and is not empty. Overwrite?`, default: false }]);
          shouldWrite = confirm;
        }
      }
    } catch {
      // not exists — ok
    }

    if (!shouldWrite) {
      console.log(chalk.yellow('Aborted installation to avoid overwriting existing keymap'));
      return;
    }

    await fs.mkdir(targetKeymapDir, { recursive: true });

    // Read template and generate files similarly to applyTemplateCommand
    const content = await fs.readFile(tmplFile, 'utf-8');
    const keymap = JSON.parse(content) as Keymap;

    const vars: Record<string, string> = {
      PROFILE_NAME: keymap.name,
      AUTHOR: keymap.author || process.env.USER || '',
    };

    const keymapC = applyVariables(`#include QMK_KEYBOARD_H
// Installed from template {{PROFILE_NAME}}

// Profile: {{PROFILE_NAME}}
`, vars);

    await fs.writeFile(path.join(targetKeymapDir, 'keymap.c'), keymapC, 'utf-8');
    await fs.writeFile(path.join(targetKeymapDir, 'rules.mk'), applyVariables(`# rules for {{PROFILE_NAME}}
`, vars), 'utf-8');
    await fs.writeFile(path.join(targetKeymapDir, 'config.h'), applyVariables(`// config placeholder for {{PROFILE_NAME}}
`, vars), 'utf-8');

    console.log(chalk.green(`Installed template '${name}' into ${targetKeymapDir}`));
  } catch (err: any) {
    console.error(chalk.red('Failed to install template:'), err.message || err);
  }
}

export default registerTemplateCommands;
