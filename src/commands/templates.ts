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
  // Use AJV for schema validation
  const schema = {
    type: 'object',
    required: ['name', 'layers'],
    properties: {
      name: { type: 'string' },
      description: { type: 'string' },
      author: { type: 'string' },
      layers: { type: 'array', minItems: 1 },
      config: { type: 'object' },
    },
    additionalProperties: true,
  };

  const ajv = new Ajv();
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
    });
}

export default registerTemplateCommands;
