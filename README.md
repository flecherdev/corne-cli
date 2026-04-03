# 🎹 Corne CLI

> CLI tool for customizing Corne split keyboards with QMK firmware and animated OLED displays

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![npm version](https://img.shields.io/npm/v/corne-cli.svg)](https://www.npmjs.com/package/corne-cli)
[![CI](https://github.com/flecherdev/corne-cli/actions/workflows/ci.yml/badge.svg)](https://github.com/flecherdev/corne-cli/actions/workflows/ci.yml)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.2-blue.svg)](https://www.typescriptlang.org/)
[![Node](https://img.shields.io/badge/Node-18%2B-green.svg)](https://nodejs.org/)
[![QMK](https://img.shields.io/badge/QMK-0.32+-blueviolet.svg)](https://qmk.fm/)

## 🌟 Features

### Core Features
- 🔌 **Auto-detect bootloaders** - Supports 9+ bootloader types (DFU, Caterina, HalfKay, etc.)
- ⚡ **Flash firmware** - Easy one-command flashing with RP2040 UF2 support
- 🎨 **Manage keymaps** - Create, edit, and switch between keymap profiles
- 🔨 **Compile QMK** - Integrated QMK firmware compilation
- 💾 **Profile management** - Save and restore keyboard configurations
- 🧪 **Interactive mode** - User-friendly prompts for all operations

### OLED Features ⭐ NEW!
- 🖼️ **Smart OLED Detection** - Auto-detects OLED size from connected keyboard
- 🎬 **Animated GIF Support** - Convert GIFs to QMK animations with frame-by-frame control
- ⌨️ **Real-Time Key Display** - See your keypresses live on OLED (50+ symbols supported)
- 🎯 **Split Display** - Different content on each half (animation + key display)
- 📊 **Layer Indicators** - Visual feedback for active layers
- 📸 **Static Images** - Convert PNG/JPG to OLED format
- 📝 **Custom Text** - Generate text displays for OLED
- 🎨 **Templates** - Pre-made OLED configurations

### Platform Support
- 🪟 **Windows** - Full QMK MSYS integration, VS Code terminal setup
- 🍎 **macOS** - Native toolchain support (coming soon)
- 🐧 **Linux** - Full support with package managers
- 🎮 **RP2040** - Native support for Raspberry Pi Pico-based controllers

### Developer Tools
- 💾 **Backup & Restore** - Automated configuration backups with PowerShell scripts
- 🔧 **VS Code Integration** - Pre-configured terminal profiles
- 📚 **Complete Documentation** - Step-by-step guides for everything
- 🚀 **One-Command Setup** - Get started in minutes

## 🎬 Animated OLED Support

Transform your OLED displays with animated GIFs!

### Real Example

![Animated Robot Demo](examples/moco-jump-32x32.gif)

**What you can do:**
- ✅ Convert any GIF to QMK animation (4-10 frames recommended)
- ✅ Display animatioxxxxcccfxns on OLED screens (128x32 or 128x64)
- ✅ Show live keypress feedback on the other OLED
- ✅ Layer-based animations (different animation per layer)
- ✅ Optimized for smooth playback with no input lag

### Quick Setup

```bash
# 1. Place your GIF in examples/
cp my-animation.gif examples/

# 2. Create a new keymap
cd ~/qmk_firmware
qmk new-keymap -kb crkbd -km my_animation

# 3. Copy generated files to your keymap
cp examples/*.h ~/qmk_firmware/keyboards/crkbd/keymaps/my_animation/
cp examples/keymap_example.c ~/qmk_firmware/keyboards/crkbd/keymaps/my_animation/keymap.c
cp examples/config.h ~/qmk_firmware/keyboards/crkbd/keymaps/my_animation/
cp examples/rules.mk ~/qmk_firmware/keyboards/crkbd/keymaps/my_animation/

# 4. Compile for your controller
qmk compile -kb crkbd/rev1 -km my_animation -e CONVERT_TO=promicro_rp2040

# 5. Flash to keyboard (for RP2040)
# Press reset button, copy the .uf2 file to RPI-RP2 drive
# Repeat for both halves of split keyboard
```

### Generated Code Example

```c
// Generated animation header automatically includes:
#define ANIM_FRAME_COUNT 4
#define ANIM_FRAME_DURATION 400
static const char PROGMEM custom_animation[4][512] = { /* 4 frames */ };

// Ready-to-use keymap with:
bool oled_task_user(void) {
    if (is_keyboard_left()) {
        // Left OLED: Shows last key pressed (AAAAAAA...)
        render_key_log();
    } else {
        // Right OLED: Animated robot
        if (timer_elapsed32(anim_timer) > ANIM_FRAME_DURATION) {
            anim_timer = timer_read32();
            oled_write_raw_P(custom_animation[current_frame], OLED_SIZE);
            current_frame = (current_frame + 1) % ANIM_FRAME_COUNT;
        }
    }
    return false;
}
```

📚 **Documentation**:
- [Complete User Guide](USER_GUIDE.md) - Step-by-step tutorial
- [Animated GIF Documentation](docs/ANIMATED_GIF_SUPPORT.md) - Technical details
- [Setup Guide](examples/SETUP_GUIDE.md) - Windows/QMK MSYS setup
- [Backup & Restore](examples/BACKUP_RESTORE.md) - Safely backup configurations

🗺️ [See the Project Roadmap](ROADMAP.md) for what's next!

## 📋 Supported Bootloaders

- **ARM DFU** (STM32, APM32, Kiibohd) via `dfu-util`
- **RISC-V DFU** (GD32V) via `dfu-util`
- **Atmel/LUFA/QMK DFU** via `dfu-programmer`
- **Caterina** (Arduino, Pro Micro) via `avrdude`
- **HalfKay** (Teensy, Ergodox EZ) via Teensy Loader CLI
- **QMK HID** via `hid_bootloader_cli`
- **WB32 DFU** via `wb32-dfu-updater_cli`
- **BootloadHID** (Atmel, PS2AVRGB)
- **Atmel SAM-BA** (Massdrop) via Massdrop Loader
- **LUFA Mass Storage**

## 🚀 Quick Start

### Prerequisites

**Windows:**
1. Install [QMK MSYS](https://msys.qmk.fm/) (required for QMK on Windows)
2. Install [VS Code](https://code.visualstudio.com/) (recommended)
3. Run `qmk setup` in QMK MSYS terminal

**macOS/Linux:**
```bash
python3 -m pip install --user qmk
qmk setup
```

### Installation

```bash
# Install globally from npm
npm install -g corne-cli

# Or use with npx (no installation required)
npx corne-cli --help

# Or clone and build from source
git clone https://github.com/flecherdev/corne-cli.git
cd corne-cli
npm install
npm run build
```

### Your First Animated OLED

Complete walkthrough in [USER_GUIDE.md](USER_GUIDE.md), here's the TL;DR:

1. **Get a GIF** - 128x32px recommended, 4-10 frames
2. **Create keymap** - `qmk new-keymap -kb crkbd -km my_anim`
3. **Copy files** - Animation header + example keymap
4. **Compile** - `qmk compile -kb crkbd/rev1 -km my_anim -e CONVERT_TO=promicro_rp2040`
5. **Flash** - Reset button → copy `.uf2` to RPI-RP2 drive
6. **Enjoy!** 🎉

### Basic CLI Usage

```bash
# Flash firmware to keyboard
corne-cli flash firmware.hex

# Create a new keymap profile
corne-cli keymap:create my-layout --template qwerty

# Compile firmware
corne-cli compile --profile my-layout

# Generate OLED animation from GIF
corne-cli oled generate animation.gif --size 128x32

# Backup current configuration
corne-cli backup --name my-backup

# List saved profiles
corne-cli keymap:list
```

## 📖 Documentation

### Getting Started
- 📘 [User Guide](USER_GUIDE.md) - **START HERE** - Complete walkthrough
- 🚀 [Getting Started](GETTING_STARTED.md) - Setup and initialization
- 🗺️ [Project Roadmap](ROADMAP.md) - Features and progress

### OLED & Animations
- 🎬 [Animated GIF Support](docs/ANIMATED_GIF_SUPPORT.md) - Technical details
- 🎨 [Animation Examples](docs/ANIMATION_EXAMPLES.md) - Code samples
- 📺 [OLED Detection](docs/OLED_DETECTION.md) - Auto-detection system
- ⚡ [Quick Start (Animated)](docs/QUICKSTART_ANIMATED.md) - Fast setup

### Platform-Specific
- 🪟 [Windows Installation](examples/WINDOWS_INSTALL.md) - QMK MSYS setup
- 💻 [VS Code Terminal](examples/VSCODE_TERMINAL.md) - Terminal integration
- 📝 [Setup Guide](examples/SETUP_GUIDE.md) - Step-by-step compilation guide

### Operations
- 💾 [Backup & Restore](examples/BACKUP_RESTORE.md) - Configuration safety
- 🔧 [Bootloader Detection](BOOTLOADER_DETECTION.md) - Supported bootloaders

### Development
- 🤖 [GitHub Copilot Agents](.github/agents/README.md) - AI-assisted development
- 📋 [Project Instructions](.github/copilot-instructions.md) - Development guidelines

## 🛠️ Development

### Prerequisites

- Node.js 18+
- TypeScript 5.2+
- QMK CLI (optional, for firmware compilation)
- Bootloader tools (installed automatically or manually)

### Setup

```bash
# Clone the repository
git clone https://github.com/flecherdev/corne-cli.git
cd corne-cli

# Install dependencies
npm install

# Build the project
npm run build

# Run in development mode
npm run dev -- --help

# Run tests
npm test
```

### Project Structure

```
corne-cli/
├── .github/
│   ├── copilot-instructions.md    # Project-wide AI instructions
│   └── agents/                    # Specialized Copilot agents
│       ├── qmk-firmware.agent.md
│       ├── flasher.agent.md
│       ├── keymap-manager.agent.md
│       ├── cli-dev.agent.md
│       └── testing.agent.md
├── src/
│   ├── commands/                  # CLI command implementations
│   ├── core/                      # Core functionality
│   │   ├── bootloader/            # Bootloader detection & flashing
│   │   ├── compiler/              # QMK firmware compilation
│   │   ├── keymap/                # Keymap management
│   │   └── config/                # Configuration management
│   ├── ui/                        # Terminal UI components
│   ├── utils/                     # Shared utilities
│   └── types/                     # TypeScript type definitions
├── tests/                         # Test suites
├── templates/                     # Keymap templates
└── profiles/                      # User keymap profiles
```

## 🎯 AI-Assisted Development

This project includes specialized GitHub Copilot agents to accelerate development:

- **@qmk-firmware** - QMK compilation and firmware configuration
- **@flasher** - Bootloader detection and firmware flashing
- **@keymap-manager** - Keymap layout and profile management
- **@cli-dev** - CLI structure and user interaction
- **@testing** - Test writing and hardware mocking

See [.github/agents/README.md](./.github/agents/README.md) for detailed usage.

## 📦 Commands

### Flash

Flash firmware to your connected keyboard:

```bash
# Flash firmware
corne-cli flash firmware.hex

# Flash with specific bootloader
corne-cli flash firmware.bin --bootloader dfu

# Flash .uf2 file (for RP2040/mass storage)
corne-cli flash firmware.uf2

Options:
  -b, --bootloader <type>   Force specific bootloader type
  --no-verify              Skip verification after flashing
  --wait-timeout <ms>      Bootloader wait timeout (default: 30000)
```

**Supported bootloaders:**
- ARM/RISC-V DFU (via `dfu-util`)
- Atmel/LUFA/QMK DFU (via `dfu-programmer`)
- Caterina (Arduino, Pro Micro) (via `avrdude`)
- HalfKay (Teensy) (via `teensy_loader_cli`)
- QMK HID (via `hid_bootloader_cli`)
- Mass Storage/UF2 (RP2040) - Manual copy

### Keymap

Manage keyboard layouts:

```bash
# List all profiles
corne-cli keymap:list

# Create new profile
corne-cli keymap:create <name> [options]
  -t, --template <name>    Use template (qwerty, dvorak, colemak)

# Edit existing profile
corne-cli keymap:edit <name>

# Delete profile
corne-cli keymap:delete <name>
```

### Compile

Compile firmware from configuration:

```bash
corne-cli compile [options]

Options:
  -p, --profile <name>     Use specific keymap profile
  -o, --output <path>      Output path for compiled firmware
```

### Config

Manage CLI configuration:

```bash
# Show current configuration
corne-cli config

# Set configuration value
corne-cli config:set <key> <value>
```

## 🔧 Configuration

The CLI stores configuration in your system's config directory:

- **Windows**: `%APPDATA%\corne-cli\config.json`
- **macOS**: `~/Library/Preferences/corne-cli/config.json`
- **Linux**: `~/.config/corne-cli/config.json`

### Configuration Options

```json
{
  "qmkHome": "/path/to/qmk_firmware",
  "defaultProfile": "my-layout",
  "autoDetectBootloader": true,
  "verifyAfterFlash": true
}
```

## 🧪 Testing

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Generate coverage report
npm run test:coverage
```

## 🤝 Contributing

Contributions are welcome! Please read our [Contributing Guidelines](CONTRIBUTING.md) first.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- [QMK Firmware](https://qmk.fm/) - The keyboard firmware
- [Corne Keyboard](https://github.com/foostan/crkbd) - The keyboard hardware
- [Commander.js](https://github.com/tj/commander.js) - CLI framework
- All the bootloader tool maintainers

## ✅ What's Completed (v0.2.0)

### Major Features
- 🎬 **Animated GIF Support** - Full pipeline from GIF to working OLED animation
- ⌨️ **Real-Time Key Display** - Live keystroke visualization (50+ symbols)
- 🎮 **RP2040 Support** - Native UF2 bootloader flashing
- 🔥 **Firmware Flash** - Complete flashing support for 6+ bootloader types
- 💾 **Backup System** - Automated configuration backups
- 🔧 **VS Code Integration** - QMK MSYS terminal setup
- 📚 **Complete Documentation** - 2,000+ lines of guides

### Tested & Working
- ✅ Corne keyboard (crkbd) with RP2040
- ✅ 128x32 OLED displays (SSD1306)
- ✅ QMK Firmware 0.32.7
- ✅ Windows 10/11 with QMK MSYS
- ✅ Split keyboard independent displays
- ✅ No input lag or performance issues

**See [FEATURES.md](FEATURES.md) for detailed breakdown**

## 📊 Project Status

| Category | Progress |
|----------|----------|
| Core Features | ████████████████████ 100% |
| OLED Support | ████████████████████ 100% |
| Documentation | ██████████████████░░ 90% |
| Platform Support | ████████████████░░░░ 80% |
| Community Tools | ████░░░░░░░░░░░░░░░░ 20% |

**Overall:** ████████████████░░░░ **75%** Complete

## 🗺️ Roadmap

📖 **Full Roadmap:** [ROADMAP.md](ROADMAP.md)

### Coming in v1.1
- WPM-based animations
- Interactive setup wizard
- Layer-specific animations
- Enhanced error handling

### Future (v1.2+)
- GUI mode with keyboard visualizer
- Live keymap preview
- Cloud profile sync
- Support for more keyboards (Lily58, Sofle, etc.)
- Firmware update notifications
- Macro recorder
- RGB animation designer

## 📚 Additional Resources

- 📘 [Complete User Guide](USER_GUIDE.md)
- ✨ [Features Overview](FEATURES.md)
- 📝 [Changelog](CHANGELOG.md) 
- 🎬 [Animation Guide](docs/ANIMATED_GIF_SUPPORT.md)
- 💾 [Backup Guide](examples/BACKUP_RESTORE.md)
- 🪟 [Windows Setup](examples/WINDOWS_INSTALL.md)
- 📦 [Publishing to npm](docs/PUBLISHING.md)

## 📞 Support

- 📫 Issues: [GitHub Issues](https://github.com/flecherdev/corne-cli/issues)
- 💬 Discussions: [GitHub Discussions](https://github.com/flecherdev/corne-cli/discussions)
- 📖 Documentation: [Project Wiki](https://github.com/flecherdev/corne-cli/wiki)
- 🤖 AI Agents: [Copilot Agents](.github/agents/README.md)

## 🤝 Contributing

We welcome contributions! Areas where help is needed:
- Testing on different keyboard models (Lily58, Sofle, Kyria)
- macOS and Linux support improvements
- Community animation library
- Documentation translations
- Bug reports and feature requests

See [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

## 📜 License

MIT License - see [LICENSE](LICENSE) for details

---

**Made with ❤️ for the mechanical keyboard community**

*Successfully tested and deployed on Corne keyboard with RP2040 - April 2, 2026*
