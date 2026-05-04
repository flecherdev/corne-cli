// Keymap validator

import { Keymap, ValidationResult } from '../../types';

// QMK key codes reference (subset - most common ones)
const VALID_KEYCODES = new Set([
  // Letters
  'KC_A', 'KC_B', 'KC_C', 'KC_D', 'KC_E', 'KC_F', 'KC_G', 'KC_H',
  'KC_I', 'KC_J', 'KC_K', 'KC_L', 'KC_M', 'KC_N', 'KC_O', 'KC_P',
  'KC_Q', 'KC_R', 'KC_S', 'KC_T', 'KC_U', 'KC_V', 'KC_W', 'KC_X',
  'KC_Y', 'KC_Z',
  
  // Numbers
  'KC_1', 'KC_2', 'KC_3', 'KC_4', 'KC_5', 'KC_6', 'KC_7', 'KC_8',
  'KC_9', 'KC_0',
  
  // Modifiers
  'KC_LCTL', 'KC_LSFT', 'KC_LALT', 'KC_LGUI',
  'KC_RCTL', 'KC_RSFT', 'KC_RALT', 'KC_RGUI',
  
  // Special keys
  'KC_ESC', 'KC_TAB', 'KC_ENT', 'KC_BSPC', 'KC_DEL', 'KC_SPC',
  'KC_MINS', 'KC_EQL', 'KC_LBRC', 'KC_RBRC', 'KC_BSLS',
  'KC_SCLN', 'KC_QUOT', 'KC_GRV', 'KC_COMM', 'KC_DOT', 'KC_SLSH',
  
  // Function keys
  'KC_F1', 'KC_F2', 'KC_F3', 'KC_F4', 'KC_F5', 'KC_F6',
  'KC_F7', 'KC_F8', 'KC_F9', 'KC_F10', 'KC_F11', 'KC_F12',
  
  // Navigation
  'KC_UP', 'KC_DOWN', 'KC_LEFT', 'KC_RGHT',
  'KC_HOME', 'KC_END', 'KC_PGUP', 'KC_PGDN',
  
  // Special
  'KC_CAPS', 'KC_PSCR', 'KC_INS',
  'KC_TRNS', // Transparent
  'KC_NO',   // No operation
  
  // Media
  'KC_MUTE', 'KC_VOLU', 'KC_VOLD',
  'KC_MPLY', 'KC_MSTP', 'KC_MPRV', 'KC_MNXT',
]);

export class KeymapValidator {
  /**
   * Validate a complete keymap
   */
  validate(keymap: Keymap): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Check basic structure
    if (!keymap.name || keymap.name.trim() === '') {
      errors.push('Keymap must have a name');
    }

    if (!keymap.layers || keymap.layers.length === 0) {
      errors.push('Keymap must have at least one layer');
    }

    // Validate each layer
    if (keymap.layers) {
      for (let i = 0; i < keymap.layers.length; i++) {
        const layer = keymap.layers[i];
        
        if (!layer.name || layer.name.trim() === '') {
          errors.push(`Layer ${i} must have a name`);
        }

        if (!layer.keys || !Array.isArray(layer.keys)) {
          errors.push(`Layer "${layer.name}" has invalid keys array`);
          continue;
        }

        // Check key count (Corne with LAYOUT_split_3x6_3 has 40 keys)
        const keyCount = layer.keys.flat().length;
        if (keyCount !== 40 && keyCount !== 42) {
          errors.push(`Layer "${layer.name}" has ${keyCount} keys, expected 40 (crkbd) or 42`);
        }

        // Validate individual key codes
        const flatKeys = layer.keys.flat();
        for (const key of flatKeys) {
          if (!this.isValidKeyCode(key)) {
            warnings.push(`Unknown key code in layer "${layer.name}": ${key}`);
          }
        }
      }
    }

    // Validate OLED config if present
    if (keymap.config?.oledConfig) {
      const oledWarnings = this.validateOLEDConfig(keymap.config.oledConfig);
      warnings.push(...oledWarnings);
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings,
    };
  }

  /**
   * Check if a key code is valid
   */
  private isValidKeyCode(code: string): boolean {
    // Check basic keycodes
    if (VALID_KEYCODES.has(code)) {
      return true;
    }

    // Check layer tap: LT(layer, key)
    if (/^LT\(\d+,\s*KC_[A-Z0-9_]+\)$/.test(code)) {
      return true;
    }

    // Check mod-tap: MT(mod, key) or shortcuts like LCTL_T(KC_ESC)
    if (/^(MT|LCTL_T|LSFT_T|LALT_T|LGUI_T|RCTL_T|RSFT_T|RALT_T|RGUI_T)\([^)]+\)$/.test(code)) {
      return true;
    }

    // Check momentary layer: MO(layer)
    if (/^MO\(\d+\)$/.test(code)) {
      return true;
    }

    // Check toggle layer: TG(layer) or TO(layer)
    if (/^T[GO]\(\d+\)$/.test(code)) {
      return true;
    }

    // Allow custom key codes
    if (code.startsWith('CUSTOM_')) {
      return true;
    }

    return false;
  }

  /**
   * Validate OLED configuration
   */
  private validateOLEDConfig(config: any): string[] {
    const warnings: string[] = [];

    if (config.leftDisplay?.type === 'custom' && !config.leftDisplay.content && !config.leftDisplay.text) {
      warnings.push('Left OLED display type is "custom" but no content or text provided');
    }

    if (config.rightDisplay?.type === 'custom' && !config.rightDisplay.content && !config.rightDisplay.text) {
      warnings.push('Right OLED display type is "custom" but no content or text provided');
    }

    if (config.rotation && ![0, 90, 180, 270].includes(config.rotation)) {
      warnings.push(`Invalid OLED rotation: ${config.rotation}. Must be 0, 90, 180, or 270`);
    }

    return warnings;
  }
}

// Export singleton instance
export const keymapValidator = new KeymapValidator();
