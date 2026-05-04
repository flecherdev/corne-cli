# Test Keyboard Specifications

This document contains the specifications of the test keyboard used during development.

## Hardware

- **Keyboard**: Corne (crkbd)
- **Keys**: 42 (split 3x6_3 layout)
- **MCU**: RP2040 (RP2040 Zero / compatible)
- **PCB**: rev4 (or compatible with RP2040)

## Connection

- **Bootloader Mode**: Appears as "RPI-RP2" or "dpi-rp2" volume
- **USB Detection**: HID keyboard device
- **Cable**: USB-C to USB-A
- **TRRS**: Required for split communication between halves

## QMK Configuration

- **Conversion**: `CONVERT_TO=promicro_rp2040` (NOT `rp2040_ce`)
- **Bootloader**: RP2040 UF2
- **Layout**: `LAYOUT_split_3x6_3`

## Known Issues Fixed

1. Using `CONVERT_TO=rp2040_ce` caused USB detection issues
2. Using `CONVERT_TO=promicro_rp2040` works correctly

## Test Commands

```bash
# Compile for test keyboard
qmk compile -kb crkbd -km <keymap> -e CONVERT_TO=promicro_rp2040

# Flash
cp .build/crkbd_rev1_<keymap>_promicro_rp2040.uf2 /Volumes/RPI-RP2/
```