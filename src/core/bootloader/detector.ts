// Bootloader detector implementation

import { devices as getHIDDevices } from 'node-hid';
import { BootloaderInfo } from '../../types';
import { matchBootloader, isCorneKeyboard, getBootloaderName, getKeyboardModel, KeyboardModel } from './constants';

export interface DetectedDevice {
  bootloader?: BootloaderInfo;
  isCorneKeyboard: boolean;
  manufacturer?: string;
  product?: string;
  serialNumber?: string;
  path?: string;
}

export class BootloaderDetector {
  /**
   * Detect connected bootloader
   * @returns BootloaderInfo if found, null otherwise
   */
  async detect(): Promise<BootloaderInfo | null> {
    try {
      const devices = getHIDDevices();

      for (const device of devices) {
        if (device.vendorId === undefined || device.productId === undefined) continue;

        const bootloader = matchBootloader(device.vendorId, device.productId);
        if (bootloader) {
          bootloader.manufacturer = device.manufacturer;
          bootloader.product = device.product;
          return bootloader;
        }
      }

      return null;
    } catch (error) {
      throw new Error(`Failed to detect bootloader: ${(error as Error).message}`);
    }
  }

  /**
   * List all connected USB HID devices
   */
  async listDevices(): Promise<DetectedDevice[]> {
    try {
      const devices = getHIDDevices();
      const detected: DetectedDevice[] = [];
      const seen = new Set<string>();

      for (const device of devices) {
        if (device.vendorId === undefined || device.productId === undefined) continue;

        // Create unique key for deduplication
        // Use VID:PID + manufacturer + product (+ serial if available)
        const uniqueKey = `${device.vendorId}:${device.productId}:${device.manufacturer || ''}:${device.product || ''}:${device.serialNumber || ''}`;
        
        // Skip if we've already seen this exact device
        if (seen.has(uniqueKey)) {
          continue;
        }
        seen.add(uniqueKey);

        const bootloader = matchBootloader(device.vendorId, device.productId);
        const isCorne = isCorneKeyboard(device.vendorId, device.productId);

        detected.push({
          bootloader: bootloader || undefined,
          isCorneKeyboard: isCorne,
          manufacturer: device.manufacturer,
          product: device.product,
          serialNumber: device.serialNumber,
          path: device.path,
        });
      }

      return detected;
    } catch (error) {
      throw new Error(`Failed to list devices: ${(error as Error).message}`);
    }
  }

  /**
   * Wait for bootloader to appear (useful after user presses reset)
   * @param timeout Timeout in milliseconds
   */
  async waitForBootloader(timeout: number = 5000): Promise<BootloaderInfo> {
    const startTime = Date.now();
    const pollInterval = 100;

    return new Promise((resolve, reject) => {
      const interval = setInterval(async () => {
        try {
          const bootloader = await this.detect();
          
          if (bootloader) {
            clearInterval(interval);
            resolve(bootloader);
            return;
          }

          if (Date.now() - startTime > timeout) {
            clearInterval(interval);
            reject(new Error('Timeout waiting for bootloader'));
          }
        } catch (error) {
          clearInterval(interval);
          reject(error);
        }
      }, pollInterval);
    });
  }

  /**
   * Check if any Corne keyboard is connected (normal mode)
   */
  async detectCorneKeyboard(): Promise<boolean> {
    try {
      const devices = getHIDDevices();

      for (const device of devices) {
        if (device.vendorId === undefined || device.productId === undefined) continue;

        if (isCorneKeyboard(device.vendorId, device.productId)) {
          return true;
        }
      }

      return false;
    } catch (error) {
      throw new Error(`Failed to detect Corne keyboard: ${(error as Error).message}`);
    }
  }

  /**
   * Detect keyboard model with OLED specifications
   */
  async detectKeyboardModel(): Promise<KeyboardModel | null> {
    try {
      const devices = getHIDDevices();

      for (const device of devices) {
        if (device.vendorId === undefined || device.productId === undefined) continue;

        const model = getKeyboardModel(device.vendorId, device.productId);
        if (model) {
          return model;
        }
      }

      return null;
    } catch (error) {
      throw new Error(`Failed to detect keyboard model: ${(error as Error).message}`);
    }
  }

  /**
   * Get detailed info about a specific bootloader type
   */
  getBootloaderInfo(bootloader: BootloaderInfo): string {
    const name = getBootloaderName(bootloader.type);
    return `${name} (VID: ${bootloader.vid}, PID: ${bootloader.pid})`;
  }
}

// Export singleton instance
export const bootloaderDetector = new BootloaderDetector();
