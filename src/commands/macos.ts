import { Command } from 'commander';
import chalk from 'chalk';
import { exec as cpExec } from 'child_process';
import { promisify } from 'util';
import path from 'path';
const exec = promisify(cpExec);

export async function macosSetupCommand(): Promise<void> {
  console.log(chalk.bold('macOS QMK setup helper'));
  console.log('This command detects Homebrew and provides next-step instructions.');

  // Check for Homebrew
  try {
    await exec('brew --version');
    console.log(chalk.green('Homebrew detected'));
    console.log('Recommended next steps:');
    console.log(`- Ensure Xcode command line tools are installed: ${chalk.cyan('xcode-select --install')}`);
    console.log(`- Install qmk dependencies: ${chalk.cyan('brew install qmk/qmk/qmk')}`);
    console.log(`- Follow official macOS QMK setup: ${chalk.cyan('docs/MACOS_QMK_SETUP.md')}`);
  } catch (err) {
    console.log(chalk.yellow('Homebrew not detected.'));
    console.log('Install Homebrew first:');
    console.log(chalk.cyan('  /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"'));
    console.log('After that, run the recommended qmk install command above.');
  }

  // Detect architecture
  try {
    const { stdout } = await exec('uname -m');
    const arch = stdout.trim();
    console.log(chalk.cyan(`Detected architecture: ${arch}`));
    if (arch === 'arm64') {
      console.log(chalk.yellow('Apple Silicon detected — prefer Homebrew under /opt/homebrew and Apple Silicon builds.'));
    }
  } catch {}

  console.log(chalk.gray(`See ${path.join('docs', 'MACOS_QMK_SETUP.md')} for a full guide.`));
}

export default macosSetupCommand;
