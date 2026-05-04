# Corne CLI

> CLI tool for customizing Corne split keyboards with QMK firmware and animated OLED displays

[![npm version](https://img.shields.io/npm/v/corne-cli.svg)](https://www.npmjs.com/package/corne-cli)
[![Node](https://img.shields.io/badge/Node-18%2B-green.svg)](https://nodejs.org/)

## Install

```bash
npm install -g corne-cli

# Or use without installing
npx corne-cli --help
```

## Commands

### Keymap Management

```bash
# Create new keymap profile
corne-cli keymap:create my-layout --template qwerty

# List all profiles
corne-cli keymap:list

# Edit existing keymap
corne-cli keymap:edit my-layout

# Delete keymap
corne-cli keymap:delete my-layout

# Compile keymap to QMK C code
corne-cli compile --keymap my-layout --keyboard crkbd --output keymap.c
```

### OLED (No QMK Required!)

```bash
# Convert image/GIF to OLED C code
corne-cli oled generate animation.gif --output oled_animation.h

# Options:
#   -s, --side <left|right|both>  Display side (default: both)
#   -o, --output <path>           Output file
#   -p, --preview                 Show ASCII preview
#   -w, --width <pixels>          OLED width (default: 128)
#   -t, --height <pixels>         OLED height (default: 32)
#   -r, --rotate <degrees>        Rotation (0, 90, 180, 270)

# Generate custom text for OLED
corne-cli oled text

# WPM-based animations (responds to typing speed)
corne-cli oled wpm

# Detect OLED size from keyboard
corne-cli oled detect

# List OLED templates
corne-cli oled templates
```

### Flash Firmware

```bash
# Flash firmware
corne-cli flash firmware.hex

# With specific bootloader
corne-cli flash firmware.uf2 --bootloader mass-storage
```

### Device

```bash
# List connected devices
corne-cli device:info

# Wait for bootloader
corne-cli device:wait
```

### Templates

```bash
# List templates
corne-cli templates:list

# Apply template
corne-cli templates:apply qwerty --target ./output

# Install into QMK firmware
corne-cli templates:install qwerty --keyboard crkbd
```

### macOS Setup

```bash
corne-cli system:macos-setup --yes
```

## Example: Animated OLED

```bash
# 1. Convert your GIF to OLED C code (no QMK needed!)
corne-cli oled generate my-animation.gif -o oled_animation.h

# 2. Use in your keymap.c:
#include "oled_animation.h"

bool oled_task_user(void) {
    // Render animation on right OLED
    oled_write_raw_P(animation_frames[frame_index], OLED_SIZE);
    return false;
}
```

## Project Structure

```
corne-cli/
├── src/
│   ├── cli.ts              # Main entry
│   ├── commands/           # CLI commands
│   │   ├── flash.ts        # Firmware flashing
│   │   ├── keymap.ts       # Keymap CRUD
│   │   ├── oled.ts         # OLED generation
│   │   └── templates.ts    # Template management
│   └── core/
│       ├── bootloader/      # Bootloader detection
│       └── keymap/         # Keymap processing
├── templates/               # Keymap templates (JSON)
└── profiles/               # User keymaps (runtime)
```

## Development

```bash
# Build
npm run build

# Test
npm test

# Lint
npm run lint

# Format
npm run format
```

## License

MIT