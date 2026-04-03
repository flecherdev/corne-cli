// Flash firmware command implementation

import chalk from 'chalk';
import ora from 'ora';
import boxen from 'boxen';
import { existsSync, statSync } from 'fs';
import { extname } from 'path';
import { spawn } from 'child_process';
import inquirer from 'inquirer';
import { bootloaderDetector } from '../core/bootloader/detector';
import { getBootloaderName, getBootloaderTool } from '../core/bootloader/constants';
import { BootloaderType } from '../types';

export interface FlashOptions {
  firmware?: string;
  bootloader?: string;
  verify?: boolean;
  waitTimeout?: number;
}

export async function flashCommand(firmwarePath: string | undefined, options: FlashOptions): Promise<void> {
  console.log(chalk.cyan.bold('\n🔥 Firmware Flash Utility\n'));

  // Step 1: Validate firmware file
  if (!firmwarePath) {
    console.log(chalk.red('✗ Error: Firmware file path is required\n'));
    console.log(chalk.gray('Usage: corne-cli flash <firmware.hex>'));
    console.log(chalk.gray('       corne-cli flash <firmware.bin>'));
    console.log(chalk.gray('       corne-cli flash <firmware.uf2>\n'));
    process.exit(1);
  }

  if (!existsSync(firmwarePath)) {
    console.log(chalk.red(`✗ Error: Firmware file not found: ${firmwarePath}\n`));
    process.exit(1);
  }

  const stats = statSync(firmwarePath);
  const fileExt = extname(firmwarePath).toLowerCase();
  const fileSize = (stats.size / 1024).toFixed(2);

  console.log(chalk.cyan('📁 Firmware File:'));
  console.log(chalk.white(`   Path: ${chalk.yellow(firmwarePath)}`));
  console.log(chalk.white(`   Size: ${chalk.yellow(fileSize)} KB`));
  console.log(chalk.white(`   Type: ${chalk.yellow(fileExt)}\n`));

  // Validate file extension
  const validExtensions = ['.hex', '.bin', '.uf2', '.eep'];
  if (!validExtensions.includes(fileExt)) {
    console.log(chalk.yellow(`⚠ Warning: Unexpected file extension '${fileExt}'`));
    console.log(chalk.gray(`Expected: ${validExtensions.join(', ')}\n`));
    
    const { proceed } = await inquirer.prompt([{
      type: 'confirm',
      name: 'proceed',
      message: 'Continue anyway?',
      default: false,
    }]);

    if (!proceed) {
      console.log(chalk.gray('\nFlashing cancelled.\n'));
      process.exit(0);
    }
  }

  // Step 2: Detect bootloader
  const spinner = ora('Detecting bootloader...').start();

  try {
    let bootloader = await bootloaderDetector.detect();

    if (!bootloader) {
      spinner.warn('No bootloader detected');
      
      console.log(
        boxen(
          chalk.yellow('⚠ Bootloader Not Found\n\n') +
          chalk.white('Please put your keyboard into bootloader mode:\n\n') +
          chalk.gray('  • Double-tap the RESET button\n') +
          chalk.gray('  • Or use the reset keycode if configured\n') +
          chalk.gray('  • For RP2040: Hold BOOT while connecting USB'),
          {
            padding: 1,
            margin: 1,
            borderStyle: 'round',
            borderColor: 'yellow',
          }
        )
      );

      const { wait } = await inquirer.prompt([{
        type: 'confirm',
        name: 'wait',
        message: 'Wait for bootloader to appear?',
        default: true,
      }]);

      if (!wait) {
        console.log(chalk.gray('\nFlashing cancelled.\n'));
        process.exit(0);
      }

      // Wait for bootloader
      const waitSpinner = ora('Waiting for bootloader (30s timeout)...').start();
      try {
        bootloader = await bootloaderDetector.waitForBootloader(options.waitTimeout || 30000);
        waitSpinner.succeed('Bootloader detected!');
      } catch (error) {
        waitSpinner.fail('Timeout waiting for bootloader');
        console.log(chalk.red(`\n✗ ${(error as Error).message}\n`));
        process.exit(1);
      }
    } else {
      spinner.succeed('Bootloader detected');
    }

    // Display bootloader info
    const bootloaderName = getBootloaderName(bootloader.type);
    const tool = getBootloaderTool(bootloader.type);

    console.log(
      boxen(
        chalk.green('✓ Bootloader Ready\n\n') +
        chalk.white(`Type: ${chalk.cyan(bootloaderName)}\n`) +
        chalk.white(`VID:PID: ${chalk.yellow(bootloader.vid)}:${chalk.yellow(bootloader.pid)}\n`) +
        chalk.white(`Tool: ${chalk.magenta(tool)}`),
        {
          padding: 1,
          margin: 1,
          borderStyle: 'round',
          borderColor: 'green',
        }
      )
    );

    // Step 3: Confirm flash operation
    const { confirm } = await inquirer.prompt([{
      type: 'confirm',
      name: 'confirm',
      message: chalk.yellow('⚠ This will overwrite existing firmware. Continue?'),
      default: true,
    }]);

    if (!confirm) {
      console.log(chalk.gray('\nFlashing cancelled.\n'));
      process.exit(0);
    }

    // Step 4: Flash firmware
    await flashFirmware(bootloader.type, firmwarePath, bootloader, options);

  } catch (error) {
    spinner.fail('Error during flash operation');
    console.error(chalk.red(`\n✗ ${(error as Error).message}\n`));
    process.exit(1);
  }
}

async function flashFirmware(
  bootloaderType: BootloaderType,
  firmwarePath: string,
  bootloader: any,
  options: FlashOptions
): Promise<void> {
  const tool = getBootloaderTool(bootloaderType);
  
  console.log(chalk.cyan(`\n🚀 Flashing with ${tool}...\n`));

  // Check if tool is available
  const toolAvailable = await checkToolAvailability(tool);
  if (!toolAvailable && bootloaderType !== 'mass-storage') {
    console.log(chalk.red(`✗ Error: ${tool} is not installed or not in PATH\n`));
    console.log(chalk.yellow('Installation instructions:\n'));
    printToolInstallInstructions(bootloaderType);
    process.exit(1);
  }

  // Execute flash based on bootloader type
  try {
    switch (bootloaderType) {
      case 'dfu':
        await flashWithDfuUtil(firmwarePath, bootloader);
        break;
      case 'dfu-programmer':
        await flashWithDfuProgrammer(firmwarePath, bootloader);
        break;
      case 'caterina':
        await flashWithAvrdude(firmwarePath, bootloader);
        break;
      case 'mass-storage':
        await flashWithMassStorage(firmwarePath);
        break;
      case 'halfkay':
        await flashWithTeensyLoader(firmwarePath);
        break;
      case 'qmk-hid':
        await flashWithQmkHid(firmwarePath);
        break;
      default:
        throw new Error(`Flashing for bootloader type '${bootloaderType}' is not yet implemented`);
    }

    console.log(
      boxen(
        chalk.green.bold('✓ Firmware Flashed Successfully!\n\n') +
        chalk.white('Your keyboard should now restart with the new firmware.\n') +
        chalk.gray('If the keyboard doesn\'t work, try unplugging and reconnecting it.'),
        {
          padding: 1,
          margin: 1,
          borderStyle: 'double',
          borderColor: 'green',
        }
      )
    );

  } catch (error) {
    throw new Error(`Flash failed: ${(error as Error).message}`);
  }
}

async function flashWithDfuUtil(firmwarePath: string, bootloader: any): Promise<void> {
  return executeFlashCommand('dfu-util', [
    '-d', `${bootloader.vid}:${bootloader.pid}`,
    '-a', '0',
    '-s', '0x08000000:leave',
    '-D', firmwarePath
  ]);
}

async function flashWithDfuProgrammer(firmwarePath: string, bootloader: any): Promise<void> {
  // dfu-programmer requires MCU name, commonly atmega32u4 for keyboards
  const mcu = 'atmega32u4';
  
  // Erase
  await executeFlashCommand('dfu-programmer', [mcu, 'erase']);
  
  // Flash
  await executeFlashCommand('dfu-programmer', [mcu, 'flash', firmwarePath]);
  
  // Reset
  await executeFlashCommand('dfu-programmer', [mcu, 'reset']);
}

async function flashWithAvrdude(firmwarePath: string, bootloader: any): Promise<void> {
  // Find the serial port (Caterina bootloader appears as COM port)
  const port = await findCaterinaPort();
  
  if (!port) {
    throw new Error('Could not find Caterina bootloader serial port');
  }

  return executeFlashCommand('avrdude', [
    '-p', 'atmega32u4',
    '-c', 'avr109',
    '-P', port,
    '-U', `flash:w:${firmwarePath}:i`
  ]);
}

async function flashWithMassStorage(firmwarePath: string): Promise<void> {
  console.log(chalk.cyan('📋 Mass Storage Mode (UF2) Instructions:\n'));
  console.log(chalk.white('1. Your device should appear as a USB drive (e.g., RPI-RP2)'));
  console.log(chalk.white('2. Copy the .uf2 file to the drive:'));
  console.log(chalk.yellow(`   - Drag and drop: ${firmwarePath}`));
  console.log(chalk.white('3. The device will automatically flash and reboot\n'));
  
  const { manualCopy } = await inquirer.prompt([{
    type: 'confirm',
    name: 'manualCopy',
    message: 'Have you copied the file to the USB drive?',
    default: false,
  }]);

  if (!manualCopy) {
    throw new Error('User cancelled manual copy operation');
  }
}

async function flashWithTeensyLoader(firmwarePath: string): Promise<void> {
  return executeFlashCommand('teensy_loader_cli', [
    '-mmcu=atmega32u4',
    '-w',
    '-v',
    firmwarePath
  ]);
}

async function flashWithQmkHid(firmwarePath: string): Promise<void> {
  return executeFlashCommand('hid_bootloader_cli', [
    '-mmcu=atmega32u4',
    firmwarePath
  ]);
}

async function executeFlashCommand(command: string, args: string[]): Promise<void> {
  return new Promise((resolve, reject) => {
    const spinner = ora(`Running ${command}...`).start();
    
    const proc = spawn(command, args, {
      stdio: ['inherit', 'pipe', 'pipe'],
    });

    let output = '';
    let errorOutput = '';

    proc.stdout?.on('data', (data) => {
      output += data.toString();
      // Show progress
      const lines = data.toString().split('\n');
      lines.forEach((line: string) => {
        if (line.trim()) {
          spinner.text = `${command}: ${line.trim()}`;
        }
      });
    });

    proc.stderr?.on('data', (data) => {
      errorOutput += data.toString();
    });

    proc.on('close', (code) => {
      if (code === 0) {
        spinner.succeed(`${command} completed successfully`);
        resolve();
      } else {
        spinner.fail(`${command} failed with code ${code}`);
        console.log(chalk.red('\nError output:'));
        console.log(chalk.gray(errorOutput || output));
        reject(new Error(`${command} exited with code ${code}`));
      }
    });

    proc.on('error', (error) => {
      spinner.fail(`Failed to execute ${command}`);
      reject(error);
    });
  });
}

async function checkToolAvailability(tool: string): Promise<boolean> {
  return new Promise((resolve) => {
    const proc = spawn(tool, ['--version'], { stdio: 'ignore' });
    proc.on('close', (code) => resolve(code === 0));
    proc.on('error', () => resolve(false));
  });
}

async function findCaterinaPort(): Promise<string | null> {
  // This is platform-specific
  // On Windows: typically COM3, COM4, etc.
  // On Linux/Mac: typically /dev/ttyACM0
  // For now, return a generic message
  return null; // TODO: Implement proper port detection
}

function printToolInstallInstructions(bootloaderType: BootloaderType): void {
  switch (bootloaderType) {
    case 'dfu':
      console.log(chalk.gray('Windows: Download from https://dfu-util.sourceforge.net/'));
      console.log(chalk.gray('macOS:   brew install dfu-util'));
      console.log(chalk.gray('Linux:   sudo apt-get install dfu-util\n'));
      break;
    case 'dfu-programmer':
      console.log(chalk.gray('Windows: Download from https://github.com/dfu-programmer/dfu-programmer/releases'));
      console.log(chalk.gray('macOS:   brew install dfu-programmer'));
      console.log(chalk.gray('Linux:   sudo apt-get install dfu-programmer\n'));
      break;
    case 'caterina':
      console.log(chalk.gray('Windows: Included with Arduino IDE or WinAVR'));
      console.log(chalk.gray('macOS:   brew install avrdude'));
      console.log(chalk.gray('Linux:   sudo apt-get install avrdude\n'));
      break;
    case 'halfkay':
      console.log(chalk.gray('Download Teensy Loader from:'));
      console.log(chalk.gray('https://www.pjrc.com/teensy/loader_cli.html\n'));
      break;
    default:
      console.log(chalk.gray('Please install the required flashing tool for your bootloader.\n'));
  }
}
