# Corne CLI - User Guide

## Quick Start

```bash
# Install
npm install -g corne-cli

# Create a keymap
corne-cli keymap:create my-layout --template qwerty

# Compile to QMK C
corne-cli compile --keymap my-layout --output keymap.c
```

## OLED (No QMK Required!)

Generate OLED C code directly from Corne CLI - no QMK installation needed!

```bash
# Convert image/GIF
corne-cli oled generate image.gif --output anim.h

# Generate text display
corne-cli oled text

# WPM-based animations
corne-cli oled wpm

# Detect OLED size from keyboard
corne-cli oled detect
```

### Using Generated OLED Code

```c
// In your keymap.c
#include "anim.h"

bool oled_task_user(void) {
    oled_write_raw_P(animation[frame], OLED_SIZE);
    return false;
}
```

## Keymap Profiles

```bash
# Create from template
corne-cli keymap:create my-layout --template qwerty

# List profiles
corne-cli keymap:list

# Edit
corne-cli keymap:edit my-layout

# Compile
corne-cli compile --keymap my-layout
```

## Flash Firmware

```bash
corne-cli flash firmware.hex
corne-cli flash firmware.uf2 --bootloader mass-storage
```

## Templates

```bash
# List available
corne-cli templates:list

# Apply and save
corne-cli templates:apply qwerty --target ./output

# Install to QMK
corne-cli templates:install qwerty --keyboard crkbd
```

## macOS

```bash
corne-cli system:macos-setup --yes
```