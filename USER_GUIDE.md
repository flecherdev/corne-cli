# 📖 Corne CLI - User Guide

> Complete guide to customizing your Corne keyboard with animated OLEDs

## Table of Contents
- [Getting Started](#getting-started)
- [OLED Animations](#oled-animations)
- [Real-Time Key Display](#real-time-key-display)
- [Backup & Restore](#backup--restore)
- [Troubleshooting](#troubleshooting)
- [Advanced Usage](#advanced-usage)

---

## 🚀 Getting Started

### What You Need
- **Hardware**: Corne keyboard (or compatible split keyboard)
- **Software**: 
  - Windows: QMK MSYS (download from https://msys.qmk.fm/)
  - VS Code (recommended for terminal integration)
  - Git (comes with QMK MSYS on Windows)

### First-Time Setup

#### 1. Install QMK Environment

**Windows:**
```powershell
# Download and install QMK MSYS from https://msys.qmk.fm/
# Then in QMK MSYS terminal:
qmk setup
```

**macOS/Linux:**
```bash
python3 -m pip install --user qmk
qmk setup
```

#### 2. Configure VS Code (Optional but Recommended)

Add this to your `.vscode/settings.json`:

```json
{
  "terminal.integrated.profiles.windows": {
    "QMK MSYS": {
      "path": "C:\\QMK_MSYS\\usr\\bin\\bash.exe",
      "args": ["--login"],
      "env": {
        "MSYSTEM": "MINGW64",
        "CHERE_INVOKING": "1"
      }
    }
  },
  "terminal.integrated.defaultProfile.windows": "QMK MSYS"
}
```

#### 3. Verify Installation

```bash
qmk --version
# Should show: QMK CLI 1.2.0 or newer
```

---

## 🎬 OLED Animations

Transform your OLED displays with animated GIFs!

### Quick Start: Add Animation to Your Keyboard

#### 1. Prepare Your GIF

**Requirements:**
- Recommended size: 128x32 pixels (for Corne/Lily58/Sofle)
- Format: GIF (animated or static)
- Frame rate: 50-500ms per frame works best
- Keep it under 10 frames for memory efficiency

**Tools to create/edit GIFs:**
- GIMP (free)
- Photoshop
- Online GIF makers (ezgif.com)

#### 2. Convert GIF to QMK Format

Place your GIF in the `examples/` directory:

```bash
cd examples/
# The conversion happens automatically in the CLI
# For this guide, we use the example image
```

Your GIF will be converted to a `.h` file like `my-animation_oled_anim.h`.

#### 3. Create a Keymap

```bash
cd ~/qmk_firmware
qmk new-keymap -kb crkbd -km my_animation
```

This creates: `~/qmk_firmware/keyboards/crkbd/keymaps/my_animation/`

#### 4. Copy Animation Files

Copy these files to your new keymap directory:

```powershell
# Windows PowerShell
Copy-Item examples\my-animation_oled_anim.h ~/qmk_firmware/keyboards/crkbd/keymaps/my_animation/
Copy-Item examples\keymap_example.c ~/qmk_firmware/keyboards/crkbd/keymaps/my_animation/keymap.c
Copy-Item examples\config.h ~/qmk_firmware/keyboards/crkbd/keymaps/my_animation/
Copy-Item examples\rules.mk ~/qmk_firmware/keyboards/crkbd/keymaps/my_animation/
```

#### 5. Edit keymap.c

Open `keymap.c` and update the include at the top:

```c
#include QMK_KEYBOARD_H
#include "my-animation_oled_anim.h"  // Change this to match your file name
```

#### 6. Compile Firmware

Identify your controller type:
- **Pro Micro / generic RP2040**: `promicro_rp2040`
- **Elite-C**: Use default compilation
- **Nice!Nano**: `nice_nano_v2`

```bash
# For RP2040 (most common for Corne):
qmk compile -kb crkbd/rev1 -km my_animation -e CONVERT_TO=promicro_rp2040

# For standard AVR controllers:
qmk compile -kb crkbd -km my_animation
```

Wait for compilation to complete. You'll see:
```
Creating UF2 file: .build/crkbd_rev1_my_animation_promicro_rp2040.uf2 [OK]
 * The firmware size is fine - 20726/28672 (72%, 7946 bytes free)
```

#### 7. Flash to Keyboard

**For RP2040 (UF2 Bootloader):**

1. **Press the reset button** on your keyboard (usually next to the TRRS jack)
2. A drive called **RPI-RP2** will appear
3. **Copy** the `.uf2` file from `.build/` to the RPI-RP2 drive
4. The keyboard will reboot automatically

**For split keyboards (like Corne):**
- Repeat steps 1-3 for **both halves** of the keyboard
- Flash the side with USB connected first
- Then flash the other side

**For Caterina bootloader:**
```bash
qmk flash -kb crkbd -km my_animation
# Follow prompts to reset keyboard
```

#### 8. Enjoy Your Animated OLED! 🎉

Your animation should now be playing on the OLED display!

---

## ⌨️ Real-Time Key Display

Show the keys you press in real-time on your OLED!

### What You Get

- **Left OLED**: Displays the last key pressed (repeated 14 times for visibility)
- **Right OLED**: Shows animated GIF
- **Layer indicator**: Shows current layer (Base, Lower, Raise, Adjust)
- **Support for 50+ symbols**: All letters, numbers, punctuation, arrows, function keys

### Supported Keys Display

| Key Type | Display |
|----------|---------|
| Letters A-Z | A, B, C... |
| Numbers 0-9 | 0, 1, 2... |
| Space | ` ` (space) |
| Enter | `^` |
| Backspace | `<` |
| Delete | `X` |
| Tab | `#` |
| Escape | `~` |
| Arrows | `<`, `>`, `^`, `v` |
| Symbols | `,`, `.`, `/`, `;`, `'`, `-`, `=`, `[`, `]`, `\`, `` ` `` |
| Shift symbols | `!`, `@`, `#`, `$`, `%`, `^`, `&`, `*`, `(`, `)`, `_`, `+`, `{`, `}`, `|`, `~` |
| Home/End | `H`, `E` |
| Page Up/Down | `U`, `D` |
| Function keys | `F` |
| Modifiers | `C` (Ctrl), `S` (Shift), `A` (Alt), `W` (Win/GUI) |
| Layers | `L` (Lower), `R` (Raise), `A` (Adjust) |

### Customization

Edit `keymap.c` to change the display behavior:

```c
// In the render_key_log() function:

// Change how many times the key repeats:
for (int i = 0; i < 14; i++) {  // Change 14 to any number
    oled_write_char(last_key, false);
}

// Swap which OLED shows what:
if (is_keyboard_left()) {
    // This code runs on the LEFT display
    render_key_log();  // Show keys
} else {
    // This code runs on the RIGHT display
    render_animation();  // Show animation
}
```

---

## 💾 Backup & Restore

Always backup before making changes!

### Create a Backup

**Windows:**
```powershell
# Run the backup script
.\examples\backup-corne.ps1 -KeymapName default

# Output will be saved to:
# C:\Users\YourName\corne-backups\backup_default_YYYY-MM-DD_HHMMSS\
```

**Manual backup:**
```bash
# Copy your keymap folder
cp -r ~/qmk_firmware/keyboards/crkbd/keymaps/my_keymap ~/backups/my_keymap_backup
```

### Restore from Backup

**Windows:**
```powershell
.\examples\restore-corne.ps1 -BackupPath C:\Users\YourName\corne-backups\backup_default_2026-04-01_160612
```

**Manual restore:**
```bash
cp -r ~/backups/my_keymap_backup ~/qmk_firmware/keyboards/crkbd/keymaps/my_keymap
```

### What Gets Backed Up

- ✅ `keymap.c` - Your key layout
- ✅ `config.h` - Configuration settings
- ✅ `rules.mk` - Build settings
- ✅ Custom header files (`.h`)
- ✅ Compiled firmware (`.hex`, `.uf2`) if available

---

## 🔧 Troubleshooting

### Common Issues

#### "OLED_DRIVER=SSD1306 is not a valid OLED driver"

**Solution:** QMK now requires lowercase. Edit `rules.mk`:

```make
# Change this:
OLED_DRIVER = SSD1306

# To this:
OLED_DRIVER = ssd1306
```

#### "qmk: command not found"

**Solution:** You're in the wrong terminal.

- **Windows**: Use QMK MSYS terminal, not PowerShell or CMD
- **macOS/Linux**: Make sure QMK is in your PATH:
  ```bash
  export PATH="$HOME/.local/bin:$PATH"
  ```

#### Firmware Too Large

**Error:**
```
region 'progmem' overflowed by XXXX bytes
```

**Solutions:**

1. **Enable LTO** in `rules.mk`:
   ```make
   LTO_ENABLE = yes
   ```

2. **Disable unused features** in `rules.mk`:
   ```make
   MOUSEKEY_ENABLE = no
   CONSOLE_ENABLE = no
   COMMAND_ENABLE = no
   RGB_MATRIX_ENABLE = no  # If you don't use RGB
   ```

3. **Reduce animation frames**: Use a GIF with fewer frames (5-8 frames is usually enough)

#### Keys Don't Work After Flashing

**Causes:**
- Used `oled_clear()` in render loop (causes lag)
- Blocking code in `oled_task_user()`
- Wrong firmware flashed

**Solution:** Restore from backup or reflash working firmware:
```bash
# Flash the last working firmware
qmk flash -kb crkbd -km default
```

#### Animation Doesn't Show

**Check:**

1. **OLED is enabled** in `rules.mk`:
   ```make
   OLED_ENABLE = yes
   OLED_DRIVER = ssd1306
   ```

2. **Config has correct size** in `config.h`:
   ```c
   #define OLED_DISPLAY_128X32  // For Corne
   ```

3. **Animation is included** in `keymap.c`:
   ```c
   #include "my-animation_oled_anim.h"
   ```

4. **oled_task_user() calls the animation**:
   ```c
   oled_write_raw_P(custom_animation[current_frame], OLED_SIZE);
   ```

#### Split Keyboard Shows Same Thing on Both Sides

**Cause:** Not using `is_keyboard_left()` to differentiate sides.

**Solution:** Add conditional logic:

```c
bool oled_task_user(void) {
    if (is_keyboard_left()) {
        // Left side code
        render_key_log();
    } else {
        // Right side code
        render_animation();
    }
    return false;
}
```

#### RPI-RP2 Drive Doesn't Appear

**Solutions:**

1. **Try double-tap** on reset button (like double-clicking)
2. **Hold reset while connecting USB**
3. **Check USB cable** - some cables are charge-only
4. **Try different USB port**
5. **Windows only**: Check Device Manager for "RP2 Boot" device

---

## 🎯 Advanced Usage

### Multiple Animations

Create different animations for different contexts:

```c
// In keymap.c
static const char PROGMEM idle_anim[FRAMES][512] = { /* ... */ };
static const char PROGMEM typing_anim[FRAMES][512] = { /* ... */ };

static uint32_t last_keypress_time = 0;

bool process_record_user(uint16_t keycode, keyrecord_t *record) {
    if (record->event.pressed) {
        last_keypress_time = timer_read32();
    }
    return true;
}

bool oled_task_user(void) {
    // Show typing animation for 5 seconds after keypress
    if (timer_elapsed32(last_keypress_time) < 5000) {
        oled_write_raw_P(typing_anim[current_frame], OLED_SIZE);
    } else {
        oled_write_raw_P(idle_anim[current_frame], OLED_SIZE);
    }
    return false;
}
```

### Layer-Based Animations

Show different animations per layer:

```c
bool oled_task_user(void) {
    switch (get_highest_layer(layer_state)) {
        case _BASE:
            oled_write_raw_P(base_animation[frame], OLED_SIZE);
            break;
        case _LOWER:
            oled_write_raw_P(lower_animation[frame], OLED_SIZE);
            break;
        case _RAISE:
            oled_write_raw_P(raise_animation[frame], OLED_SIZE);
            break;
    }
    return false;
}
```

### Custom Text + Animation

Combine static text with animations:

```c
bool oled_task_user(void) {
    if (is_keyboard_left()) {
        // Left: Text info
        oled_set_cursor(0, 0);
        oled_write_P(PSTR("Layer: "), false);
        oled_write_P(get_layer_name(), false);
        
        oled_set_cursor(0, 2);
        oled_write_P(PSTR("WPM: "), false);
        oled_write(get_u8_str(get_current_wpm(), ' '), false);
    } else {
        // Right: Animation
        render_animation();
    }
    return false;
}
```

### Performance Optimization

For smoother animations:

```c
// Use faster frame rates for small animations
#define ANIM_FRAME_DURATION 50  // 50ms = 20 FPS

// Skip frames if system is busy
static uint8_t skip_counter = 0;
if (++skip_counter >= 2) {  // Update every 2nd call
    skip_counter = 0;
    update_animation();
}
```

---

## 📚 Additional Resources

- [QMK Documentation](https://docs.qmk.fm/)
- [Corne Keyboard Guide](https://github.com/foostan/crkbd)
- [OLED Driver Documentation](https://docs.qmk.fm/#/feature_oled_driver)
- [Animated GIF Support Guide](docs/ANIMATED_GIF_SUPPORT.md)
- [Setup Guide](examples/SETUP_GUIDE.md)
- [Backup/Restore Guide](examples/BACKUP_RESTORE.md)

---

## 💬 Community & Support

- **GitHub Issues**: Report bugs or request features
- **Discord**: Join the QMK Discord for real-time help
- **Reddit**: r/olkb and r/MechanicalKeyboards

---

## 🤝 Contributing

Found a bug? Want to add a feature? Contributions are welcome!

See [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

---

*Last Updated: April 2, 2026*
