# Corne Keyboard CLI - Copilot Instructions

## Project Overview

This is a Node.js/TypeScript CLI tool for customizing and managing Corne split keyboards with QMK firmware.

## Architecture

- **CLI Framework**: Commander.js or oclif for command structure
- **Language**: TypeScript with strict type checking
- **Firmware**: QMK firmware integration
- **Bootloaders**: Support for multiple bootloaders via native bindings or child processes
- **Configuration**: YAML/JSON for keymap and profile storage

## Key Technologies

### Core Dependencies
- `commander` or `oclif` - CLI framework
- `inquirer` - Interactive prompts
- `chalk` - Terminal styling
- `ora` - Loading spinners
- `node-hid` - USB HID device communication
- `serialport` - Serial communication with bootloaders

### QMK Integration
- Wrap QMK CLI commands (`qmk compile`, `qmk flash`)
- Interface with bootloader tools:
  - `dfu-util` for ARM/RISC-V DFU
  - `dfu-programmer` for Atmel DFU
  - `avrdude` for Caterina bootloaders
  - Platform-specific binaries bundled or downloaded on-demand

## Project Structure

```
corne-cli/
├── src/
│   ├── commands/          # CLI commands
│   ├── core/              # Core functionality
│   │   ├── bootloader/    # Bootloader detection & flashing
│   │   ├── compiler/      # QMK firmware compilation
│   │   ├── keymap/        # Keymap management
│   │   └── config/        # Configuration management
│   ├── utils/             # Utilities
│   └── types/             # TypeScript types
├── templates/             # Keymap templates
├── profiles/              # Saved configurations
└── bin/                   # Executable entry point
```

## Development Standards

### TypeScript
- Strict mode enabled
- Explicit return types for all public functions
- Use interfaces for complex types
- Prefer `type` for unions and primitives

### Error Handling
- Custom error classes for different failure scenarios
- Always provide helpful error messages with recovery suggestions
- Log errors with context (device state, command executed, etc.)

### Testing
- Unit tests with Jest
- Integration tests for bootloader communication
- Mock USB devices for testing

### Documentation
- JSDoc for all public APIs
- README with usage examples
- Command help text should be descriptive

## USB Device Safety

- Always check device connection before operations
- Implement timeouts for bootloader operations
- Warn users before destructive operations (flashing)
- Validate firmware files before flashing

## Code Style

- Use ESLint with TypeScript rules
- Prettier for formatting
- Conventional Commits for commit messages
- Clear variable names (avoid abbreviations)

## Workflow Agents

Use specialized agents for different tasks:
- **@qmk-firmware** - QMK compilation, firmware building, keymap configuration
- **@flasher** - Bootloader detection, flashing operations, device communication
- **@keymap-manager** - Keymap editing, layout management, configuration
- **@cli-dev** - CLI structure, commands, user interaction
- **@testing** - Test writing, device mocking, integration tests
