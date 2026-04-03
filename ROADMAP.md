# 🗺️ Corne CLI - Roadmap

## ✅ Completed (v1.0)

### Core Infrastructure
- ✅ **Bootloader Detection System** - 9 bootloader types supported
  - ARM DFU (STM32, APM32, Kiibohd)
  - RISC-V DFU (GD32V)
  - Atmel/LUFA/QMK DFU
  - Caterina (Pro Micro, Arduino)
  - HalfKay (Teensy)
  - QMK HID
  - WB32 DFU
  - BootloadHID
  - Atmel SAM-BA (Massdrop)

- ✅ **Keymap Management** - Complete profile system
  - Create, save, and load keymap profiles
  - JSON/YAML configuration format
  - Template system for common layouts
  - Profile validation and versioning

- ✅ **QMK Integration** - Full compilation support
  - Automatic QMK environment detection
  - Firmware compilation commands
  - Build error reporting
  - Multi-keyboard support

### OLED Display Features
- ✅ **OLED Auto-Detection** - Smart keyboard detection
  - Database of known keyboards (Corne, Lily58, Sofle, Kyria)
  - Automatic size detection (128x32, 128x64)
  - Manual override options
  
- ✅ **Animated GIF Support** - Full animation pipeline
  - GIF frame extraction using Sharp library
  - Frame optimization and resizing
  - QMK C code generation
  - PROGMEM array formatting
  - Configurable frame rates (50-1000ms)
  - Preview mode

- ✅ **Real-Time Key Display** - Live keystroke visualization
  - Display last pressed key in large format
  - Support for 50+ symbols and special characters
  - Layer indicator (Base, Lower, Raise, Adjust)
  - Split keyboard support (different content per side)

- ✅ **Dual OLED Configuration** - Independent displays
  - Left display: Live key press visualization (14x repetition)
  - Right display: Animated GIF/robot character
  - Optimized render loop without blocking
  - No input lag or freeze

### Platform-Specific Support
- ✅ **Windows Support** - Full MSYS2/QMK MSYS integration
  - QMK MSYS installation guide
  - VS Code terminal integration
  - PowerShell backup/restore scripts
  - Path handling for Windows environments

- ✅ **RP2040 Support** - Native support for RP2040 controllers
  - UF2 bootloader detection
  - Drag-and-drop firmware flashing
  - Support for both `promicro_rp2040` and `rp2040_ce` converters
  - Split keyboard handling (flash both halves)

### Developer Tools
- ✅ **Backup & Restore System** - Configuration safety
  - PowerShell scripts for Windows
  - Automatic timestamped backups
  - Keymap and config preservation
  - Restore documentation

- ✅ **VS Code Integration** - Development environment setup
  - Terminal profile configuration
  - QMK MSYS integration
  - Environment variable management
  - Debug settings

### Documentation
- ✅ **Complete Setup Guides**
  - Windows QMK MSYS installation
  - VS Code terminal configuration
  - Backup/restore procedures
  - Compilation and flashing workflows

- ✅ **Example Files**
  - Complete keymap.c with animations
  - config.h template
  - rules.mk configuration
  - Animation header files

---

## 🚧 In Progress (v1.1)

### Enhanced OLED Features
- 🔄 **WPM-Based Animations** - Speed-reactive displays
  - Idle animations
  - Typing animations
  - WPM counter integration

- 🔄 **Layer-Specific Animations** - Context-aware displays
  - Different animation per layer
  - Smooth transitions
  - Custom layer indicators

### CLI Improvements
- 🔄 **Interactive Configuration Wizard** - Guided setup
  - Step-by-step keyboard configuration
  - Automatic environment detection
  - QMK setup automation

- 🔄 **Firmware Templates** - Pre-built configurations
  - Popular keyboard layouts
  - OLED templates library
  - One-command setup

---

## 📅 Planned (v1.2)

### Advanced Features
- ⏳ **RGB LED Support** - Under-glow and matrix control
  - Animation synchronization with OLED
  - Custom RGB patterns
  - Integration with key press events

- ⏳ **Macro System** - Complex key sequences
  - Visual macro editor
  - Timing control
  - Multi-step macros

- ⏳ **Web Preview** - Browser-based visualization
  - Live OLED preview
  - Animation testing
  - Configuration editor

### Platform Expansion
- ⏳ **macOS Support** - Native tooling
  - Homebrew integration
  - macOS-specific guides
  - Apple Silicon optimization

- ⏳ **Linux Package Manager** - Easy installation
  - apt/yum packages
  - Arch AUR package
  - Snap/Flatpak support

### Community Features
- ⏳ **Animation Library** - Shared resources
  - Community-contributed animations
  - Rating and search system
  - One-click installation

- ⏳ **Cloud Profiles** - Sync across devices
  - Profile backup to cloud
  - Multi-device sync
  - Version history

---

## 🔮 Future (v2.0)

### Major Features
- 💡 **GUI Application** - Desktop interface
  - Drag-and-drop keymap editor
  - Visual animation creator
  - Live keyboard preview

- 💡 **Plugin System** - Extensibility
  - Custom OLED renderers
  - Third-party integrations
  - Community plugins

- 💡 **Multi-Keyboard Manager** - Multiple boards
  - Switch between keyboards
  - Shared configurations
  - Profile inheritance

### Advanced OLED
- 💡 **Custom Font Support** - Typography options
  - Font file imports
  - Size scaling
  - Unicode support

- 💡 **Real-Time Graphics** - Game-like displays
  - Sprite animations
  - Smooth scrolling
  - Interactive elements

---

## 🎯 Current Focus

**Primary Goal**: Stabilize v1.0 features and improve documentation

**Next Release** (v1.1 - Q2 2026):
1. WPM-based animations
2. Interactive setup wizard
3. Enhanced error handling
4. Community animation library (beta)

---

## 📊 Progress Tracking

| Category | Completion |
|----------|------------|
| Core Features | ████████████████████ 100% |
| OLED Basic | ████████████████████ 100% |
| OLED Advanced | ████████████░░░░░░░░ 65% |
| Platform Support | ████████████████░░░░ 80% |
| Documentation | ██████████████████░░ 90% |
| Community Tools | ████░░░░░░░░░░░░░░░░ 20% |

**Overall Progress**: ████████████████░░░░ 75%

---

## 🤝 Contributing

We welcome contributions! See [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

**Areas where help is needed**:
- Testing on different keyboard models
- macOS and Linux support
- Animation library contributions
- Documentation improvements
- Bug reports and feature requests

---

## 📅 Release History

### v1.0.0 (April 2026) - Current
- Initial release with full OLED animation support
- RP2040 support
- Windows/QMK MSYS integration
- Real-time key display
- Complete documentation suite

---

*Last Updated: April 2, 2026*
