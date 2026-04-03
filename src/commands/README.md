# Corne CLI Commands

This directory contains CLI command implementations.

## Structure

Each command should be in its own file and export an async function or command object.

## Commands to Implement

- [ ] **flash.ts** - Flash firmware to keyboard (@flasher)
- [ ] **keymap.ts** - Keymap management commands (@keymap-manager)
- [ ] **compile.ts** - Compile firmware from config (@qmk-firmware)
- [ ] **config.ts** - CLI configuration management (@cli-dev)
- [ ] **device.ts** - Device information and detection (@flasher)

## Usage with Agents

Use the specialized agents to implement each command:

```
@cli-dev help me implement the config command
@flasher implement the flash command with bootloader detection
@keymap-manager implement keymap management commands
```
