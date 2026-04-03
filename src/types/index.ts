// TypeScript type definitions for Corne CLI

export interface KeyCode {
  code: string;
  label?: string;
}

export interface Layer {
  name: string;
  keys: string[][];
}

export interface Keymap {
  name: string;
  description?: string;
  author?: string;
  layers: Layer[];
  config?: KeymapConfig;
}

export interface KeymapConfig {
  tapDanceTimeout?: number;
  permissiveHold?: boolean;
  tappingTerm?: number;
  rgbConfig?: RGBConfig;
  oledConfig?: OLEDConfig;
}

export interface OLEDConfig {
  enabled: boolean;
  leftDisplay: OLEDDisplayConfig;
  rightDisplay: OLEDDisplayConfig;
  rotation?: 0 | 90 | 180 | 270;
  timeout?: number;
  width?: number;  // OLED width in pixels (default: 128)
  height?: number; // OLED height in pixels (default: 32)
}

export interface OLEDDisplayConfig {
  type: 'logo' | 'status' | 'keylog' | 'custom' | 'image' | 'none';
  content?: string;
  text?: string[];
  logo?: string;
  image?: string;
}

export interface RGBConfig {
  enabled: boolean;
  brightness?: number;
  effect?: string;
}

export interface BootloaderInfo {
  type: BootloaderType;
  vid: string;
  pid: string;
  port?: string;
  tool: string;
  manufacturer?: string;
  product?: string;
}

export type BootloaderType =
  | 'dfu'
  | 'dfu-programmer'
  | 'caterina'
  | 'halfkay'
  | 'qmk-hid'
  | 'wb32-dfu'
  | 'bootloadhid'
  | 'mass-storage';

export interface FlashOptions {
  firmware?: string;
  bootloader?: string;
  verify: boolean;
}

export interface FlashResult {
  success: boolean;
  bootloaderType?: BootloaderType;
  message?: string;
  error?: Error;
}

export interface CompileOptions {
  profile?: string;
  output?: string;
}

export interface CompileResult {
  success: boolean;
  firmwarePath?: string;
  message?: string;
  error?: Error;
}

export interface AppConfig {
  qmkHome?: string;
  defaultProfile?: string;
  autoDetectBootloader: boolean;
  verifyAfterFlash: boolean;
}

export interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
}
