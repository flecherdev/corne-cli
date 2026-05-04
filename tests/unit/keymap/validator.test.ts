import { KeymapValidator } from '../../../src/core/keymap/validator';
import type { Keymap } from '../../../src/types';

describe('KeymapValidator', () => {
  let validator: KeymapValidator;

  beforeEach(() => {
    validator = new KeymapValidator();
  });

  describe('validate', () => {
    it('should accept valid keymap with 40 keys per layer (crkbd format)', () => {
      const keymap: Keymap = {
        name: 'test',
        layers: [
          {
            name: 'Base',
            keys: [
              ['KC_Q', 'KC_W', 'KC_E', 'KC_R', 'KC_T', 'KC_Y', 'KC_U', 'KC_I', 'KC_O', 'KC_P', 'KC_A', 'KC_S'],
              ['KC_D', 'KC_F', 'KC_G', 'KC_H', 'KC_J', 'KC_K', 'KC_L', 'KC_SCLN', 'KC_QUOT', 'KC_Z', 'KC_X', 'KC_C'],
              ['KC_V', 'KC_B', 'KC_N', 'KC_M', 'KC_COMM', 'KC_DOT', 'KC_SLSH', 'KC_SPC', 'KC_ENT', 'KC_BSPC', 'KC_ESC', 'KC_TAB'],
              ['KC_LGUI', 'KC_LALT', 'KC_SPC', 'KC_ENT', 'KC_RALT', 'KC_RGUI']
            ]
          }
        ]
      };

      const { errors, warnings } = validator.validate(keymap);

      expect(errors).toHaveLength(0);
    });

    it('should accept 42 keys per layer (alternative format)', () => {
      const keymap: Keymap = {
        name: 'test',
        layers: [
          {
            name: 'Base',
            keys: [
              ['KC_Q', 'KC_W', 'KC_E', 'KC_R', 'KC_T', 'KC_Y', 'KC_U', 'KC_I', 'KC_O', 'KC_P', 'KC_A', 'KC_S'],
              ['KC_D', 'KC_F', 'KC_G', 'KC_H', 'KC_J', 'KC_K', 'KC_L', 'KC_SCLN', 'KC_QUOT', 'KC_Z', 'KC_X', 'KC_C'],
              ['KC_V', 'KC_B', 'KC_N', 'KC_M', 'KC_COMM', 'KC_DOT', 'KC_SLSH', 'KC_SPC', 'KC_ENT', 'KC_BSPC', 'KC_ESC', 'KC_TAB'],
              ['KC_LGUI', 'KC_LALT', 'KC_SPC', 'KC_ENT', 'KC_RALT', 'KC_RGUI']
            ]
          }
        ]
      };

      const { errors, warnings } = validator.validate(keymap);

      expect(errors).toHaveLength(0);
    });

    it('should reject keymap with invalid key count', () => {
      const keymap: Keymap = {
        name: 'test',
        layers: [
          {
            name: 'Base',
            keys: [
              ['KC_Q', 'KC_W', 'KC_E'],
              ['KC_R', 'KC_T', 'KC_Y'],
              ['KC_U', 'KC_I', 'KC_O']
            ]
          }
        ]
      };

      const { errors } = validator.validate(keymap);

      expect(errors.length).toBeGreaterThan(0);
      expect(errors[0]).toContain('keys');
    });

    it('should report warnings for unknown keycodes', () => {
      const keymap: Keymap = {
        name: 'test',
        layers: [
          {
            name: 'Base',
            keys: [
              ['KC_Q', 'KC_W', 'KC_E', 'KC_R', 'KC_T', 'KC_Y', 'KC_U', 'KC_I', 'KC_O', 'KC_P', 'KC_A', 'KC_S'],
              ['KC_D', 'KC_F', 'KC_G', 'KC_H', 'KC_J', 'KC_K', 'KC_L', 'UNKNOWN_KEY', 'KC_QUOT', 'KC_Z', 'KC_X', 'KC_C'],
              ['KC_V', 'KC_B', 'KC_N', 'KC_M', 'KC_COMM', 'KC_DOT', 'KC_SLSH', 'KC_SPC', 'KC_ENT', 'KC_BSPC', 'KC_ESC', 'KC_TAB'],
              ['KC_LGUI', 'KC_LALT', 'KC_SPC', 'KC_ENT', 'KC_RALT', 'KC_RGUI']
            ]
          }
        ]
      };

      const { warnings } = validator.validate(keymap);

      expect(warnings.some(w => w.includes('UNKNOWN_KEY'))).toBe(true);
    });

    it('should validate keymap with multiple layers', () => {
      const keymap: Keymap = {
        name: 'test',
        layers: [
          {
            name: 'Base',
            keys: [
              ['KC_Q', 'KC_W', 'KC_E', 'KC_R', 'KC_T', 'KC_Y', 'KC_U', 'KC_I', 'KC_O', 'KC_P', 'KC_A', 'KC_S'],
              ['KC_D', 'KC_F', 'KC_G', 'KC_H', 'KC_J', 'KC_K', 'KC_L', 'KC_SCLN', 'KC_QUOT', 'KC_Z', 'KC_X', 'KC_C'],
              ['KC_V', 'KC_B', 'KC_N', 'KC_M', 'KC_COMM', 'KC_DOT', 'KC_SLSH', 'KC_SPC', 'KC_ENT', 'KC_BSPC', 'KC_ESC', 'KC_TAB'],
              ['KC_LGUI', 'MO(1)', 'KC_SPC', 'KC_ENT', 'MO(2)', 'KC_RGUI']
            ]
          },
          {
            name: 'Lower',
            keys: [
              ['KC_1', 'KC_2', 'KC_3', 'KC_4', 'KC_5', 'KC_6', 'KC_7', 'KC_8', 'KC_9', 'KC_0', 'KC_MINS', 'KC_EQL'],
              ['KC_TAB', 'KC_TRNS', 'KC_TRNS', 'KC_TRNS', 'KC_TRNS', 'KC_TRNS', 'KC_LEFT', 'KC_DOWN', 'KC_UP', 'KC_RIGHT', 'KC_TRNS', 'KC_TRNS'],
              ['KC_ESC', 'KC_LCTL', 'KC_LSFT', 'KC_LALT', 'KC_LGUI', 'KC_SPC', 'KC_SPC', 'KC_SPC', 'KC_RGUI', 'KC_RALT', 'KC_RSFT', 'KC_RCTL'],
              ['KC_TRNS', 'KC_TRNS', 'KC_SPC', 'KC_ENT', 'KC_TRNS', 'KC_TRNS']
            ]
          }
        ]
      };

      const { errors } = validator.validate(keymap);

      expect(errors).toHaveLength(0);
    });
  });
});