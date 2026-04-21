import { Command } from 'commander';
import chalk from 'chalk';
import path from 'path';
import fs from 'fs/promises';
import boxen from 'boxen';
import inquirer from 'inquirer';
import { Keymap } from '../types';
import { profileManager } from '../core/keymap/manager';

function validateTemplate(obj: any): { valid: boolean; errors?: string[] } {
  const errors: string[] = [];
  if (!obj) errors.push('Template is empty');
  if (!obj.name) errors.push('Missing required field: name');
  if (!obj.layers || !Array.isArray(obj.layers) || obj.layers.length === 0) errors.push('Template must include at least one layer');
  return { valid: errors.length === 0, errors };
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
}

export default registerTemplateCommands;
