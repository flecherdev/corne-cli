# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.2.1] - 2026-04-03

### 🎨 Changed
- Replaced mascot image from moco-jump robot to king character from [Kings and Pigs](https://pixelfrog-assets.itch.io/kings-and-pigs) asset pack
- Updated all documentation references to use `king.gif`
- Added proper attribution to Pixelfrog Assets
- Updated file references across all documentation and examples

### 📝 Documentation
- Added Credits section in README with proper image attribution
- Updated examples and guides with new image references

## [1.0.0] - 2026-04-02

### ✨ Added

#### Core Features
- 🔌 Bootloader detection system supporting 9 bootloader types
  - ARM DFU (STM32, APM32, Kiibohd)
  - RISC-V DFU (GD32V)
  - Atmel/LUFA/QMK DFU
  - Caterina (Pro Micro, Arduino)
  - HalfKay (Teensy)
  - QMK HID
  - WB32 DFU
  - BootloadHID
  - Atmel SAM-BA (Massdrop)

- 🎨 Keymap profile management
  - JSON/YAML configuration
  - Template system
  - Profile validation

#### OLED Features
- 🎬 **Animated GIF Support** (MAJOR FEATURE)
  - GIF to QMK conversion using Sharp library
  - Frame extraction and optimization
  - Automatic code generation
  - PROGMEM array formatting
  - Configurable frame rates (50-1000ms)

- ⌨️ **Real-Time Key Display** (MAJOR FEATURE)
  - Live keystroke visualization (14x repetition)
  - Support for 50+ symbols and special characters
  - Dynamic layer indicator (Base, Lower, Raise, Adjust)
  - Split keyboard support with independent displays

- 🖼️ **OLED Auto-Detection**
  - Database of known keyboards (Corne, Lily58, Sofle, Kyria)
  - Automatic size detection (128x32, 128x64)
  - Manual override options

#### Platform Support
- 🪟 **Complete Windows Support**
  - QMK MSYS integration
  - VS Code terminal configuration
  - PowerShell backup/restore scripts
  - Path handling for Windows environments

- 🎮 **RP2040 Support**
  - UF2 bootloader detection
  - Drag-and-drop firmware flashing
  - Support for `promicro_rp2040` and `rp2040_ce` converters
  - Split keyboard handling (flash both halves)

#### Developer Tools
- 💾 **Backup & Restore System**
  - PowerShell scripts (`backup-corne.ps1`, `restore-corne.ps1`)
  - Automatic timestamped backups
  - Keymap and config preservation
  - Restore documentation

- 🔧 **VS Code Integration**
  - QMK MSYS terminal profile
  - Environment variable configuration
  - Debug settings

#### Documentation
- 📚 Complete setup guides
  - [USER_GUIDE.md](USER_GUIDE.md) - Comprehensive user manual
  - [ROADMAP.md](ROADMAP.md) - Project roadmap and progress
  - [ANIMATED_GIF_SUPPORT.md](docs/ANIMATED_GIF_SUPPORT.md) - GIF animation guide
  - [SETUP_GUIDE.md](examples/SETUP_GUIDE.md) - Step-by-step compilation guide
  - [BACKUP_RESTORE.md](examples/BACKUP_RESTORE.md) - Backup procedures

- 📝 Example files
  - Complete `keymap.c` with animations and key display
  - `config.h` template with OLED settings
  - `rules.mk` with proper OLED driver configuration
  - Animation header file (`king_oled_anim.h`)

### 🐛 Fixed

- Fixed `OLED_DRIVER` case sensitivity issue (must be lowercase `ssd1306`)
- Fixed `IGNORE_MOD_TAP_INTERRUPT` deprecation (removed from config)
- Fixed duplicate function definitions in keymap.c
- Fixed `oled_clear()` blocking issue causing input lag
- Fixed split keyboard side detection
- Fixed RP2040 UF2 file naming conventions

### ⚡ Optimized

- Removed blocking `oled_clear()` calls from render loop
- Optimized key log buffer system (6-key history)
- Improved OLED render efficiency (no frame drops)
- Added comprehensive keycode mapping (50+ symbols)

### 🔧 Technical Details

#### Key Components Implemented
- **Sharp library** integration for GIF processing
- **Custom animation frame extractor**
- **QMK code generator** with PROGMEM formatting
- **Real-time key capture system** with character conversion
- **Layer state tracking** with visual feedback
- **Split keyboard logic** using `is_keyboard_left()`

#### Tested Configurations
- ✅ Corne keyboard (crkbd) with RP2040 controllers
- ✅ 128x32 OLED displays (SSD1306 driver)
- ✅ QMK Firmware 0.32.7
- ✅ Windows 10/11 with QMK MSYS
- ✅ VS Code terminal integration

### 📦 File Structure

```
New Files:
├── USER_GUIDE.md                           - Complete user manual
├── ROADMAP.md                              - Project roadmap
├── CHANGELOG.md                            - This file
├── examples/
│   ├── king.png                           - Example animated image (Kings and Pigs by Pixelfrog Assets)
│   ├── king_oled_anim.h                   - Generated animation header
│   ├── keymap_example.c                   - Complete keymap with animation
│   ├── config.h                           - OLED configuration
│   ├── rules.mk                           - Build rules
│   ├── backup-corne.ps1                   - Backup script
│   ├── restore-corne.ps1                  - Restore script
│   ├── SETUP_GUIDE.md                     - Compilation guide
│   ├── BACKUP_RESTORE.md                  - Backup documentation
│   ├── WINDOWS_INSTALL.md                 - Windows setup
│   └── VSCODE_TERMINAL.md                 - VS Code configuration
└── docs/
    └── ANIMATED_GIF_SUPPORT.md            - Updated with new features
```

### 🎯 Example Usage

**Implemented Working Example:**
```c
// Left OLED: Shows last key pressed in large format
void render_key_log(void) {
    char last_key = key_log[KEY_LOG_SIZE - 1];
    oled_set_cursor(0, 2);
    for (int i = 0; i < 14; i++) {
        oled_write_char(last_key, false);  // AAAAAAAAAAAAA
    }
}

// Right OLED: Animated robot (4 frames, 400ms each)
if (timer_elapsed32(anim_timer) > ANIM_FRAME_DURATION) {
    oled_write_raw_P(custom_animation[current_frame], OLED_SIZE);
    current_frame = (current_frame + 1) % ANIM_FRAME_COUNT;
}
```

### 🙏 Credits

- **Sharp** - Image processing library
- **QMK Firmware** - Keyboard firmware framework
- **GitHub Copilot** - AI-assisted development

---

## [Unreleased]

### Planned for v1.1

- WPM-based animations
- Interactive configuration wizard
- Enhanced error handling
- Community animation library (beta)
- Layer-specific animations
- Animation transitions

---

## Version Notes

### Version 1.0.0 Highlights

This is the first stable release featuring complete animated OLED support. The implementation includes:

- **Production-ready code** - Tested and working on physical hardware
- **No input lag** - Optimized rendering that doesn't block keyboard input
- **Complete documentation** - Over 2000 lines of guides and examples
- **Real-world tested** - Successfully deployed on Corne keyboard with RP2040

**Breaking Changes:**
- OLED_DRIVER must now be lowercase (`ssd1306` not `SSD1306`)
- IGNORE_MOD_TAP_INTERRUPT is deprecated and removed
- RP2040 flashing now requires UF2 bootloader

**Migration Guide:**
See [USER_GUIDE.md](USER_GUIDE.md) for complete migration instructions from older setups.

---

*Last Updated: April 2, 2026*

[1.0.0]: https://github.com/flecherdev/corne-cli/releases/tag/v1.0.0
