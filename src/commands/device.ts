// Device info and detection command

import chalk from 'chalk';
import ora from 'ora';
import Table from 'cli-table3';
import boxen from 'boxen';
import { bootloaderDetector } from '../core/bootloader/detector';
import { getBootloaderName, getBootloaderTool } from '../core/bootloader/constants';

export async function deviceInfoCommand(): Promise<void> {
  console.log(chalk.cyan.bold('\n🔍 Scanning for devices...\n'));

  const spinner = ora('Detecting USB devices').start();

  try {
    // Detect bootloader
    const bootloader = await bootloaderDetector.detect();
    
    // List all devices
    const devices = await bootloaderDetector.listDevices();
    
    // Check for Corne keyboard
    const hasCorneKeyboard = await bootloaderDetector.detectCorneKeyboard();

    spinner.succeed('Device scan complete');

    // Show bootloader status
    if (bootloader) {
      const bootloaderName = getBootloaderName(bootloader.type);
      const tool = getBootloaderTool(bootloader.type);
      
      console.log(
        boxen(
          chalk.green('✓ Bootloader Detected!\n\n') +
          chalk.white(`Type: ${chalk.cyan(bootloaderName)}\n`) +
          chalk.white(`VID:PID: ${chalk.yellow(bootloader.vid)}:${chalk.yellow(bootloader.pid)}\n`) +
          chalk.white(`Tool: ${chalk.magenta(tool)}\n`) +
          (bootloader.manufacturer ? chalk.gray(`Manufacturer: ${bootloader.manufacturer}\n`) : '') +
          (bootloader.product ? chalk.gray(`Product: ${bootloader.product}`) : ''),
          {
            padding: 1,
            margin: 1,
            borderStyle: 'round',
            borderColor: 'green',
          }
        )
      );

      console.log(chalk.green('✓ Ready to flash firmware!\n'));
    } else {
      console.log(
        boxen(
          chalk.yellow('⚠ No bootloader detected\n\n') +
          chalk.white('To enter bootloader mode:\n') +
          chalk.gray('  • Double-tap the RESET button on your keyboard\n') +
          chalk.gray('  • Or use the reset keycode if configured'),
          {
            padding: 1,
            margin: 1,
            borderStyle: 'round',
            borderColor: 'yellow',
          }
        )
      );
    }

    // Show Corne keyboard status
    if (hasCorneKeyboard && !bootloader) {
      console.log(chalk.cyan('ℹ Corne keyboard detected in normal operation mode\n'));
    }

    // Show all detected devices
    if (devices.length > 0) {
      console.log(chalk.cyan.bold('Connected USB HID Devices:\n'));

      const table = new Table({
        head: [
          chalk.cyan('Type'),
          chalk.cyan('Manufacturer'),
          chalk.cyan('Product'),
          chalk.cyan('Status'),
        ],
        colWidths: [20, 25, 30, 20],
        wordWrap: true,
      });

      devices.forEach((device) => {
        let type = chalk.gray('HID Device');
        let status = chalk.gray('—');

        if (device.bootloader) {
          type = chalk.yellow(getBootloaderName(device.bootloader.type));
          status = chalk.green('Bootloader');
        } else if (device.isCorneKeyboard) {
          type = chalk.cyan('Corne Keyboard');
          status = chalk.blue('Normal Mode');
        }

        table.push([
          type,
          device.manufacturer || chalk.gray('Unknown'),
          device.product || chalk.gray('Unknown'),
          status,
        ]);
      });

      console.log(table.toString());
      console.log();
    } else {
      console.log(chalk.yellow('\n⚠ No USB HID devices detected\n'));
    }

    // Show helpful tips
    console.log(chalk.gray('Tip: Run this command while in bootloader mode to verify detection'));
    console.log(chalk.gray('Use: corne-cli flash <firmware.hex> to flash firmware\n'));

  } catch (error) {
    spinner.fail('Failed to scan devices');
    console.error(chalk.red(`\n✗ Error: ${(error as Error).message}\n`));
    process.exit(1);
  }
}

export async function waitForBootloaderCommand(): Promise<void> {
  console.log(chalk.cyan.bold('\n⏳ Waiting for bootloader...\n'));
  console.log(chalk.gray('Enter bootloader mode by double-tapping RESET\n'));

  const spinner = ora('Waiting for bootloader (timeout: 30s)').start();

  try {
    const bootloader = await bootloaderDetector.waitForBootloader(30000);
    
    spinner.succeed('Bootloader detected!');

    const bootloaderName = getBootloaderName(bootloader.type);
    const tool = getBootloaderTool(bootloader.type);

    console.log(
      boxen(
        chalk.green('✓ Bootloader Connected!\n\n') +
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

  } catch (error) {
    spinner.fail('Timeout waiting for bootloader');
    console.error(chalk.red(`\n✗ ${(error as Error).message}\n`));
    console.log(chalk.yellow('Make sure to:'));
    console.log(chalk.gray('  • Double-tap the RESET button'));
    console.log(chalk.gray('  • Check USB cable connection'));
    console.log(chalk.gray('  • Try a different USB port\n'));
    process.exit(1);
  }
}
