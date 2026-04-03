// Bootloader type definitions and constants

import { BootloaderInfo, BootloaderType } from '../../types';

// Known bootloader VID/PID combinations
export const BOOTLOADER_DEVICES = {
  // ARM DFU (STM32)
  DFU_STM32: { vid: 0x0483, pid: 0xdf11, type: 'dfu' as BootloaderType, tool: 'dfu-util' },
  
  // Atmel/LUFA/QMK DFU
  DFU_ATMEL_MEGA32U4: { vid: 0x03eb, pid: 0x2ff4, type: 'dfu-programmer' as BootloaderType, tool: 'dfu-programmer' },
  DFU_ATMEL_AT90USB128: { vid: 0x03eb, pid: 0x2ffb, type: 'dfu-programmer' as BootloaderType, tool: 'dfu-programmer' },
  
  // QMK DFU (common QMK keyboards)
  QMK_DFU: { vid: 0x03eb, pid: 0x2ff4, type: 'dfu-programmer' as BootloaderType, tool: 'dfu-programmer' },
  
  // Caterina (Pro Micro, Arduino Leonardo)
  CATERINA_SPARKFUN: { vid: 0x1b4f, pid: 0x9203, type: 'caterina' as BootloaderType, tool: 'avrdude' },
  CATERINA_ARDUINO: { vid: 0x2341, pid: 0x0036, type: 'caterina' as BootloaderType, tool: 'avrdude' },
  CATERINA_ADAFRUIT: { vid: 0x239a, pid: 0x000c, type: 'caterina' as BootloaderType, tool: 'avrdude' },
  
  // HalfKay (Teensy)
  HALFKAY_TEENSY2: { vid: 0x16c0, pid: 0x0478, type: 'halfkay' as BootloaderType, tool: 'teensy_loader_cli' },
  HALFKAY_TEENSY2PP: { vid: 0x16c0, pid: 0x0478, type: 'halfkay' as BootloaderType, tool: 'teensy_loader_cli' },
  
  // QMK HID
  QMK_HID: { vid: 0x03eb, pid: 0x2067, type: 'qmk-hid' as BootloaderType, tool: 'hid_bootloader_cli' },
  
  // WB32 DFU
  WB32_DFU: { vid: 0x342d, pid: 0xdfa0, type: 'wb32-dfu' as BootloaderType, tool: 'wb32-dfu-updater_cli' },
  
  // BootloadHID
  BOOTLOADHID: { vid: 0x16c0, pid: 0x05df, type: 'bootloadhid' as BootloaderType, tool: 'bootloadHID' },
};

// Known keyboard models with OLED specifications
export interface KeyboardModel {
  vid: number;
  pid: number;
  name: string;
  oledWidth?: number;
  oledHeight?: number;
  oledCount?: number; // Number of OLED displays
}

// Known Corne keyboard VID/PIDs (normal operation mode)
export const CORNE_DEVICES: KeyboardModel[] = [
  { vid: 0xfeed, pid: 0x0000, name: 'Corne (crkbd)', oledWidth: 128, oledHeight: 32, oledCount: 2 },
  { vid: 0x4653, pid: 0x0001, name: 'Corne (foostan)', oledWidth: 128, oledHeight: 32, oledCount: 2 },
];

// Other known keyboards with OLED
export const KNOWN_KEYBOARDS: KeyboardModel[] = [
  ...CORNE_DEVICES,
  { vid: 0xfeed, pid: 0x6060, name: 'Lily58', oledWidth: 128, oledHeight: 32, oledCount: 2 },
  { vid: 0xfeed, pid: 0x0000, name: 'Sofle', oledWidth: 128, oledHeight: 32, oledCount: 2 },
  { vid: 0xfeed, pid: 0x1307, name: 'Kyria', oledWidth: 128, oledHeight: 64, oledCount: 2 },
];

// Bootloader detection priority (check in this order)
export const BOOTLOADER_PRIORITY: BootloaderType[] = [
  'dfu',
  'dfu-programmer',
  'caterina',
  'halfkay',
  'qmk-hid',
  'wb32-dfu',
  'bootloadhid',
  'mass-storage',
];

// Friendly names for bootloaders
export const BOOTLOADER_NAMES: Record<BootloaderType, string> = {
  'dfu': 'ARM/RISC-V DFU',
  'dfu-programmer': 'Atmel/LUFA/QMK DFU',
  'caterina': 'Caterina (Arduino)',
  'halfkay': 'HalfKay (Teensy)',
  'qmk-hid': 'QMK HID',
  'wb32-dfu': 'WB32 DFU',
  'bootloadhid': 'BootloadHID',
  'mass-storage': 'Mass Storage',
};

// Tools required for each bootloader type
export const BOOTLOADER_TOOLS: Record<BootloaderType, string> = {
  'dfu': 'dfu-util',
  'dfu-programmer': 'dfu-programmer',
  'caterina': 'avrdude',
  'halfkay': 'teensy_loader_cli',
  'qmk-hid': 'hid_bootloader_cli',
  'wb32-dfu': 'wb32-dfu-updater_cli',
  'bootloadhid': 'bootloadHID',
  'mass-storage': 'none',
};

/**
 * Check if a VID/PID combination matches a known bootloader
 */
export function matchBootloader(vid: number, pid: number): BootloaderInfo | null {
  for (const [key, device] of Object.entries(BOOTLOADER_DEVICES)) {
    if (device.vid === vid && device.pid === pid) {
      return {
        type: device.type,
        vid: `0x${vid.toString(16).padStart(4, '0')}`,
        pid: `0x${pid.toString(16).padStart(4, '0')}`,
        tool: device.tool,
      };
    }
  }
  return null;
}

/**
 * Check if a VID/PID combination is a Corne keyboard in normal mode
 */
export function isCorneKeyboard(vid: number, pid: number): boolean {
  return CORNE_DEVICES.some(device => device.vid === vid && device.pid === pid);
}

/**
 * Get keyboard model with OLED specifications
 */
export function getKeyboardModel(vid: number, pid: number): KeyboardModel | null {
  return KNOWN_KEYBOARDS.find((kb) => kb.vid === vid && kb.pid === pid) || null;
}

/**
 * Get friendly bootloader name
 */
export function getBootloaderName(type: BootloaderType): string {
  return BOOTLOADER_NAMES[type] || type;
}

/**
 * Get required tool for bootloader
 */
export function getBootloaderTool(type: BootloaderType): string {
  return BOOTLOADER_TOOLS[type] || 'unknown';
}
