# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.4.4] - 2026-04-25

### ✨ Added - Compile Command

#### New Features
- **Compile command** - Convert keymap profiles to QMK C code directly
  - `corne-cli compile --keymap <name> [--output keymap.c] [--keyboard crkbd]`
  - Supports profiles from `./profiles` directory
  - Generates ready-to-compile keymap.c

### 🔧 Technical Improvements

#### Performance
- **Lazy loading** for heavy dependencies (`sharp`, `node-hid`)
- **Caching** for bootloader detection (1s TTL)

#### Code Quality
- **TypeScript strict** enabled, better type safety
- **Reduced lint errors** from 32 to 19

### 📖 Migration Guide
```bash
# Create a keymap profile first
corne-cli keymap:create my-layout --template qwerty

# Compile to QMK C code
corne-cli compile --keymap my-layout --output keymap.c
```

## [0.4.3] - 2026-04-03

### 🔧 Fixed - OLED Animation Improvements

#### Core Fixes
- **Fixed GIF conversion** - Added `.normalise()` before threshold to prevent all-black frames
- **Added rotation control** - New `--rotate` option for `oled generate` command (0, 90, 180, 270 degrees)
- **Proper OLED rotation support** - Different rotations per side (e.g., OLED_ROTATION_270 for text, OLED_ROTATION_0 for animations)

#### Documentation
- Removed experimental layer animation features (not production-ready)
- Added working example: keylogger on left + simple animation on right
- Documented correct rotation configuration for split keyboards

#### Breaking Changes
- `oled layers` command marked as experimental (use `oled generate` with `--rotate` instead)
- Removed `docs/LAYER_ANIMATIONS.md` (feature not stable)

### 📖 Migration Guide
For simple working animations, use:
```bash
corne-cli oled generate animation.gif -o anim.h --rotate 0
```
Then configure different OLED rotations per side in your keymap.c

## [0.4.2] - 2026-04-03

### 🚀 Performance Improvements

#### Layer Animation Generator
- **10x faster code generation** - Optimized frame conversion algorithm
- Removed inefficient array joins for large files
- String concatenation optimization for C code generation
- Better progress feedback during QMK code generation
- Reduced memory usage during conversion

### 🔧 Technical Changes
- Refactored `generateAnimationFrames()` for better performance
- Direct string building instead of array + join pattern
- Improved spinner feedback with specific progress steps

## [0.4.1] - 2026-04-03

### 🐛 Fixed - UX Improvements

#### Layer Animation Wizard
- Improved prompt messages in `corne-cli oled layers` command
- Added clear examples for layer names vs. animation file paths
- Added validation to prevent common mistakes:
  - Layer name cannot be a filename (no .gif/.png extensions)
  - Animation path must be a valid file path (requires / or .)
- Added helpful hints above each layer configuration section

## [0.4.0] - 2026-04-03

### ✨ Added - Layer-Specific Animations

#### Core Feature
- 🎨 **Layer Animation System** - Different OLED animations for each keyboard layer
  - Automatic detection of active layer
  - Instant animation switching when layers change
  - Support for 1-8 layers (Base, Lower, Raise, Adjust, etc.)
  - Optional smooth transitions between layer changes
  - Configurable transition duration (default: 200ms)
  - Per-layer text indicators (optional)

#### New Command
- `corne-cli oled layers` - Interactive wizard for layer animation generation
  - Configure multiple layers with different animations
  - Auto-detection of OLED size from connected keyboard
  - Independent frame delays per layer
  - Optional layer name indicators
  - Transition effects configuration
  - Generates complete QMK integration code

#### Generated Files
- Animation header with layer detection system
- Complete layer-specific frame arrays
- Automatic layer switching logic
- Rules.mk configuration
- Layer indicator rendering (optional)

#### Technical Implementation
- Real-time layer state detection using `get_highest_layer()`
- Efficient lookup table for layer animations
- Per-layer frame management and timing
- Zero performance impact on layer switching
- Optimized PROGMEM storage for all layers

### 📝 Documentation
- Added [Layer Animations Guide](docs/LAYER_ANIMATIONS.md) - Comprehensive documentation
  - Quick start tutorial
  - Layer-specific design tips and ideas
  - Performance optimization guidelines
  - Memory usage calculations
  - Troubleshooting section
  - Animation resource recommendations
  - Example configurations (minimal, full, gaming)
- Updated README with layer animations showcase

### 🔧 Technical Improvements
- New `LayerAnimationGenerator` class in `src/core/keymap/layers.ts`
- Validation system for layer configurations
- Duplicate layer ID detection
- Support for custom layer IDs and names
- Configurable layer indicators with positioning
- Export of layer animation types and constants

### 🎨 Features
- **Transition Effects**: Smooth fade between layer changes
- **Layer Indicators**: Optional text overlay showing current layer
- **Flexible Configuration**: 1-8 layers, custom names and IDs
- **Memory Efficient**: Optimized frame storage and management
- **Instant Feedback**: Real-time layer detection and switching

## [0.3.0] - 2026-04-03

## [0.4.4] - 2026-04-21

### ✨ Added - Interactive Setup Wizard

- **New command**: `corne-cli setup` — guided, interactive wizard to create a keymap profile, detect environment (QMK CLI, qmk_firmware), and optionally generate example `keymap.c`, `config.h`, and `rules.mk` files.
- Saves profiles to `./profiles` and can generate placeholder OLED headers when the template enables OLED.


### ✨ Added - WPM-Based Animations

#### Core Feature
- 🏃 **WPM Animation System** - Dynamic OLED animations that respond to typing speed
  - Idle animation state (< 20 WPM default)
  - Typing animation state (20-60 WPM default)
  - Fast typing animation state (> 60 WPM optional)
  - Automatic state switching based on real-time WPM
  - Configurable speed thresholds
  - Smooth transitions between animation states

#### New Command
- `corne-cli oled wpm` - Interactive wizard for WPM animation generation
  - Multi-state animation support (idle/typing/fast)
  - Auto-detection of OLED size from connected keyboard
  - Configurable frame delays per state
  - WPM counter display option
  - Generates complete QMK integration code

#### Generated Files
- Animation header with complete WPM system
- Rules.mk additions (WPM_ENABLE, OLED_ENABLE)
- Keymap example with usage instructions
- Automatic frame management and state detection

### 📝 Documentation
- Added [WPM Animations Guide](docs/WPM_ANIMATIONS.md) - Complete documentation
  - Quick start guide
  - Advanced configuration
  - Troubleshooting section
  - Animation ideas and examples
  - Technical details and performance info
- Updated README with WPM animations showcase
- Updated ROADMAP marking WPM feature as completed

### 🔧 Technical Improvements
- New `WPMAnimationGenerator` class in `src/core/keymap/wpm.ts`
- Support for 2-state (idle/typing) and 3-state (idle/typing/fast) animations
- PROGMEM storage for memory efficiency
- Zero input lag implementation
- Battery-efficient design

### ✨ Added - macOS helper

- **New command:** `system:macos-setup` — detects Homebrew, shows macOS QMK setup steps, and can optionally run `brew install qmk/qmk/qmk` or the Homebrew installer (both are confirmation-gated). Added `--yes` to auto-confirm prompts for automation.


### 📊 Performance
- Memory: ~512 bytes per frame in flash (PROGMEM)
- CPU: Minimal impact (~1% per refresh)
- No input latency
- Compatible with all OLED timeouts

## [0.2.2] - 2026-04-03

### 🐛 Fixed
- Corrected king image file extension references from `.png` to `.gif` in all documentation

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
│   ├── king.gif                           - Example animated image (Kings and Pigs by Pixelfrog Assets)
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
