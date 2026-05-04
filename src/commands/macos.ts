import chalk from 'chalk';
import { exec as cpExec } from 'child_process';
import { promisify } from 'util';
import path from 'path';
import inquirer from 'inquirer';
const exec = promisify(cpExec);

export async function macosSetupCommand(autoYes = false): Promise<void> {
  console.log(chalk.bold('macOS QMK setup helper'));
  console.log('This command detects Homebrew and provides next-step instructions.');

  async function confirm(message: string, def = false): Promise<boolean> {
    if (autoYes) return true;
    const r = await inquirer.prompt([{ type: 'confirm', name: 'ok', message, default: def }]);
    return Boolean((r as { ok: boolean }).ok);
  }

  // Check for Homebrew
  try {
    await exec('brew --version');
    console.log(chalk.green('Homebrew detected'));
    console.log('Recommended next steps:');
    console.log(`- Ensure Xcode command line tools are installed: ${chalk.cyan('xcode-select --install')}`);
    console.log(`- Install qmk dependencies: ${chalk.cyan('brew install qmk/qmk/qmk')}`);
    console.log(`- Follow official macOS QMK setup: ${chalk.cyan('docs/MACOS_QMK_SETUP.md')}`);

    // Offer to install qmk via Homebrew (confirmation gated)
    try {
      const installQmk = await confirm('Would you like corne-cli to run `brew install qmk/qmk/qmk` now?', false);
      if (installQmk) {
        const cmd = 'brew install qmk/qmk/qmk';
        const confirmRun = await confirm(`This will run: ${cmd}. Proceed?`, false);
        if (confirmRun) {
          console.log(chalk.cyan(`Running: ${cmd}`));
          try {
            const { stdout, stderr } = await exec(cmd);
            if (stdout) console.log(stdout.toString());
            if (stderr) console.error(stderr.toString());
            console.log(chalk.green('qmk installed (or already present).'));
          } catch (err: unknown) {
            const message = err instanceof Error ? err.message : String(err);
            console.error(chalk.red('Failed to run brew install:'), message);
          }
        } else {
          console.log(chalk.yellow('Skipped installing qmk via Homebrew.'));
        }
      }
    } catch {
      // prompt failure — continue
    }
  } catch (err) {
    console.log(chalk.yellow('Homebrew not detected.'));
    console.log('Install Homebrew first:');
    console.log(chalk.cyan('  /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"'));
    console.log('After that, run the recommended qmk install command above.');

    // Offer to run Homebrew install script (confirmation gated, destructive)
    try {
      const runBrew = await confirm('Would you like corne-cli to run the Homebrew install script now? (This runs a remote install script)', false);
      if (runBrew) {
        const brewCmd = '/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"';
        const confirmBrew = await confirm(`This will run: ${brewCmd}. Proceed?`, false);
        if (confirmBrew) {
          console.log(chalk.cyan('Running Homebrew install script...'));
          try {
            const { stdout, stderr } = await exec(brewCmd);
            if (stdout) console.log(stdout.toString());
            if (stderr) console.error(stderr.toString());
            console.log(chalk.green('Homebrew install script completed.'));
            console.log(chalk.cyan('After Homebrew installs, re-run this command to install qmk via Homebrew.'));
          } catch (err: any) {
            console.error(chalk.red('Failed to run Homebrew install script:'), err.message || err);
          }
        } else {
          console.log(chalk.yellow('Skipped Homebrew install.'));
        }
      }
    } catch (err) {
      // ignore prompt errors
    }
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
