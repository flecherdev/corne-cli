# Corne CLI - Agent Guide

## Quick Commands

```bash
# Development
npm run dev           # Run CLI with tsx (no compile)
npm run build         # Compile TypeScript to dist/

# Verification (run before提交)
npm run check         # typecheck + lint
npm run typecheck    # TypeScript only
npm run lint         # ESLint only
npm test             # Jest tests

# Format
npm run format        # Prettier write
```

## Project Structure

```
src/
├── cli.ts            # Main entry, command registration
├── commands/         # Command implementations
│   ├── flash.ts      # Firmware flashing
│   ├── keymap.ts    # Keymap CRUD
│   ├── oled.ts      # OLED animation
│   ├── device.ts    # Device detection
│   └── ...
├── core/
│   ├── bootloader/  # HID detection, flashing logic
│   └── keymap/      # KeymapGenerator, ProfileManager, Converter
└── types/           # TypeScript interfaces
```

## Key Patterns

### Lazy Loading
Heavy native deps (`sharp`, `node-hid`) use lazy require:
```typescript
let sharpModule: typeof import('sharp') | null = null;
function getSharp(): typeof import('sharp') {
  if (!sharpModule) sharpModule = require('sharp');
  return sharpModule!;
}
```

### Bootloader Detection
Cached with 1s TTL in `src/core/bootloader/detector.ts`.

### Keymap Generation
`KeymapGenerator` in `src/core/keymap/generator.ts` converts JSON to QMK C code.

## Common Errors

1. **TypeScript strict**: Uses `strict: true` in tsconfig.json
2. **ESLint**: ~19 errors remain (mostly in tests). Prefer `unknown` over `any`
3. **Case declarations**: Wrap lexical declarations in `case` blocks with `{}`

## Testing

- Tests in `tests/unit/`
- Some tests mock USB with `node-hid` - may fail on CI without hardware
- Run specific test: `npm test -- --testPathPattern=keymap`

## Important Files

- `.github/copilot-instructions.md` - Legacy agent docs
- `CHANGELOG.md` - Version history
- `templates/` - Keymap templates (JSON)
- `profiles/` - User keymap profiles (created at runtime)
- `TEST_KEYBOARD.md` - Test hardware specifications

## Test Hardware

- **Keyboard**: Corne (crkbd) - 42 keys, split 3x6_3
- **MCU**: RP2040 (RP2040 Zero compatible)
- **Key conversion**: MUST use `CONVERT_TO=promicro_rp2040` (NOT `rp2040_ce`)
- **Bootloader volume**: RPI-RP2 (appears when in bootloader mode)
- **Layout macro**: `LAYOUT_split_3x6_3`

## Troubleshooting

If keyboard flashes but USB is not detected:
- Check `CONVERT_TO` value - use `promicro_rp2040` not `rp2040_ce`
- Verify bootloader is working (RPI-RP2 volume appears in Finder)
- Run `corne-cli device:info` to check USB detection