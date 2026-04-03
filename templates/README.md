# Keymap Templates

This directory contains predefined keymap templates for quick setup.

## Available Templates (to be implemented)

- **qwerty.json** - Standard QWERTY layout
- **dvorak.json** - Dvorak layout
- **colemak.json** - Colemak layout
- **gaming.json** - Gaming-optimized layout
- **programming.json** - Programming-focused layout with symbols
- **vim.json** - Vim-style navigation
- **emacs.json** - Emacs-style keybindings

## Template Format

Each template should be a JSON file following this structure:

```json
{
  "name": "template-name",
  "description": "Description of the layout",
  "layers": [
    {
      "name": "BASE",
      "keys": [
        ["KC_TAB", "KC_Q", "...", "KC_BSPC"],
        ["KC_LCTL", "KC_A", "...", "KC_QUOT"],
        ["KC_LSFT", "KC_Z", "...", "KC_ESC"],
        ["KC_LGUI", "MO(1)", "KC_SPC", "KC_ENT", "MO(2)", "KC_RALT"]
      ]
    }
  ]
}
```

## Using @keymap-manager

Ask the keymap manager agent to create templates:

```
@keymap-manager create a QWERTY template for Corne
@keymap-manager create a programming-focused layout template
```
