import { Command } from 'commander';
import chalk from 'chalk';
import path from 'path';
import fs from 'fs/promises';
import boxen from 'boxen';
import { Keymap } from '../types';
import { profileManager } from '../core/keymap/manager';

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

    // Save to profiles
    await profileManager.save(keymap);
    console.log(chalk.green(`Saved template '${name}' to ./profiles/${name}.json`));

    // Optionally generate files in target
    const target = options.target || process.cwd();
    const dest = path.join(target, name);
    await fs.mkdir(dest, { recursive: true });

    const keymapC = `#include QMK_KEYBOARD_H
// Example keymap generated from template ${name}

// Profile: ${keymap.name}
`;
    await fs.writeFile(path.join(dest, 'keymap.c'), keymapC, 'utf-8');
    await fs.writeFile(path.join(dest, 'rules.mk'), `# rules for ${name}\n`, 'utf-8');
    await fs.writeFile(path.join(dest, 'config.h'), `// config placeholder for ${name}\n`, 'utf-8');

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
