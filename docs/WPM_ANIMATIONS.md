# 🏃 WPM-Based Animations

Dynamic OLED animations that respond to your typing speed in real-time!

## Overview

WPM (Words Per Minute) based animations create an interactive typing experience by displaying different animations based on how fast you're typing. The system automatically switches between idle, typing, and optionally fast typing animations.

## Features

- **Automatic Animation Switching**: Seamlessly transitions between animation states based on your typing speed
- **Three Animation States**:
  - **Idle**: When not typing or typing slowly (< 20 WPM by default)
  - **Typing**: Normal typing speed (20-60 WPM by default)
  - **Fast** (Optional): Fast typing (> 60 WPM by default)
- **WPM Counter Display**: Optional real-time WPM counter on secondary OLED
- **Customizable Thresholds**: Adjust speed thresholds to match your typing style
- **Multiple Frame Support**: Use animated GIFs with multiple frames for each state

## Quick Start

### 1. Prepare Your Animations

You'll need at least 2 animated GIFs (or static images):
- **Idle animation**: Calm, slow animation for when you're not typing
- **Typing animation**: More active animation for normal typing

Optionally, add a third:
- **Fast typing animation**: Intense animation for fast typing

**Recommended specs**:
- Size: 128x32 pixels (auto-resized if different)
- Format: GIF, PNG, JPG, BMP
- Frames: 2-10 frames per animation
- File size: Keep under 1MB for fast processing

### 2. Generate WPM Animation

```bash
corne-cli oled wpm
```

The interactive wizard will guide you through:

1. **Select idle animation**: Path to your idle GIF/image
2. **Select typing animation**: Path to your typing GIF/image
3. **Add fast animation?**: Optional fast typing animation
4. **Configure thresholds**: 
   - Idle threshold (default: 20 WPM)
   - Fast typing threshold (default: 60 WPM)
5. **WPM counter**: Display WPM number on secondary OLED
6. **Output filename**: Where to save the generated code

**Example**:
```
$ corne-cli oled wpm

? Path to idle animation: animations/idle_cat.gif
? Path to typing animation: animations/typing_cat.gif
? Add fast animation? Yes
? Path to fast animation: animations/fast_cat.gif
? WPM threshold for idle: 20
? WPM threshold for fast typing: 60
? Display WPM counter? Yes
? Output filename: wpm_animation.h

✔ WPM animation generated successfully!

📦 Generated Files:
  - wpm_animation.h          (Animation code)
  - wpm_animation_rules.mk   (Rules configuration)
  - wpm_animation_keymap_example.c (Usage example)
```

### 3. Install in QMK

Copy the generated files to your QMK keymap directory:

```bash
# Copy animation header
cp wpm_animation.h ~/qmk_firmware/keyboards/crkbd/keymaps/default/

# Add rules to your rules.mk
cat wpm_animation_rules.mk >> ~/qmk_firmware/keyboards/crkbd/keymaps/default/rules.mk
```

### 4. Update Your Keymap

Add to your `keymap.c`:

```c
#include "wpm_animation.h"

#ifdef OLED_ENABLE

bool oled_task_user(void) {
    // This function handles everything automatically
    render_wpm_animation(is_keyboard_master());
    return false;
}

#endif // OLED_ENABLE
```

### 5. Compile and Flash

```bash
cd ~/qmk_firmware
qmk compile -kb crkbd -km default
qmk flash -kb crkbd -km default
```

## Advanced Configuration

### Custom Options

Use command-line options for more control:

```bash
corne-cli oled wpm \
  --width 128 \
  --height 32 \
  --idle-delay 500 \
  --typing-delay 200 \
  --fast-delay 100
```

**Options**:
- `--width <pixels>`: OLED width (default: auto-detect)
- `--height <pixels>`: OLED height (default: auto-detect)  
- `--idle-delay <ms>`: Frame delay for idle animation (default: 400ms)
- `--typing-delay <ms>`: Frame delay for typing animation (default: 200ms)
- `--fast-delay <ms>`: Frame delay for fast typing animation (default: 100ms)

### Customizing Thresholds

Edit the generated `.h` file to adjust WPM thresholds:

```c
// At the top of wpm_animation.h
#define WPM_IDLE_THRESHOLD 15      // Change from 20 to 15
#define WPM_TYPING_THRESHOLD 70    // Change from 60 to 70
```

### Different Display Per Side

The default setup shows:
- **Master side** (left): WPM animation
- **Slave side** (right): WPM counter + status

To customize the slave side, edit the `render_wpm_animation()` function:

```c
void render_wpm_animation(bool is_master) {
    if (is_master) {
        // Master: show animation
        update_animation_frame();
        // ... animation rendering ...
    } else {
        // Slave: customize this section
        uint8_t wpm = get_current_wpm();
        
        oled_write_P(PSTR("My Keyboard\\n"), false);
        oled_write_P(PSTR("WPM: "), false);
        
        char wpm_str[16];
        snprintf(wpm_str, sizeof(wpm_str), "%3d\\n", wpm);
        oled_write(wpm_str, false);
        
        // Add layer indicator
        oled_write_P(PSTR("Layer: "), false);
        switch (get_highest_layer(layer_state)) {
            case 0: oled_write_P(PSTR("Base"), false); break;
            case 1: oled_write_P(PSTR("Lower"), false); break;
            case 2: oled_write_P(PSTR("Raise"), false); break;
        }
    }
}
```

## Examples

### Example 1: Minimal (2 states)

Simple idle/typing animations without fast state:

```bash
corne-cli oled wpm
# Select idle GIF
# Select typing GIF
# Choose "No" for fast animation
```

### Example 2: Full (3 states)

Complete setup with idle, typing, and fast animations:

```bash
corne-cli oled wpm
# Idle: calm animation
# Typing: moderate activity
# Fast: intense animation
```

### Example 3: Static Images

Use static images instead of GIFs:

```bash
corne-cli oled wpm
# Idle: static_idle.png
# Typing: static_typing.png
# Each will be a single-frame animation
```

## Troubleshooting

### Animation doesn't change

**Problem**: Animation stuck on one state

**Solution**:
1. Verify WPM is enabled in `rules.mk`:
   ```make
   WPM_ENABLE = yes
   ```
2. Check thresholds are appropriate for your typing speed
3. Add debug output to see current WPM:
   ```c
   char debug[32];
   snprintf(debug, sizeof(debug), "WPM: %d\\n", get_current_wpm());
   oled_write(debug, false);
   ```

### Compilation errors

**Problem**: Can't find `get_current_wpm()`

**Solution**: Make sure `WPM_ENABLE = yes` is in your `rules.mk`

**Problem**: `OLED_SIZE` undefined

**Solution**: Include the WPM header before using:
```c
#include "wpm_animation.h"
```

### Animation is choppy

**Problem**: Frame rate is too fast or slow

**Solution**: Adjust frame delays in the command:
```bash
corne-cli oled wpm --idle-delay 500 --typing-delay 250
```

Or edit the generated file:
```c
#define IDLE_FRAME_DURATION 500    // Slower
#define TYPING_FRAME_DURATION 250  // Moderate
```

### WPM counter shows incorrect values

**Problem**: WPM seems off

**Solution**: QMK's WPM is calculated over a sliding window. Wait a few seconds of consistent typing for accurate readings. Adjust thresholds if needed.

## Technical Details

### How It Works

1. **WPM Tracking**: QMK's built-in WPM system tracks keystrokes over time
2. **State Detection**: Every render cycle, current WPM is checked against thresholds
3. **Frame Management**: Based on state, the appropriate animation frames are displayed
4. **Smooth Transitions**: When state changes, animation resets to frame 0 for smooth switching

### Memory Usage

WPM animations are stored in PROGMEM (flash memory), not RAM:

- **Idle**: ~512 bytes × frame count
- **Typing**: ~512 bytes × frame count  
- **Fast**: ~512 bytes × frame count (if used)

**Example**: 3 states with 4 frames each = ~6KB flash memory

### Performance

- **CPU Impact**: Minimal - only updates on OLED refresh cycle
- **No Input Lag**: Animation runs separately from key processing
- **Battery Efficient**: OLED timeout still works normally

## Animation Ideas

### Character Themes
- **Cat**: Sleeping → Walking → Running
- **Robot**: Idle → Working → Turbo mode
- **Character**: Sitting → Typing → Fast typing

### Abstract
- **Waves**: Calm → Medium → Storm
- **Fire**: Embers → Flames → Inferno
- **Particles**: Few → Medium → Many

### Retro
- **Pixel character**: Standing → Running → Sprinting
- **8-bit scenes**: Day → Sunset → Night (by activity)
- **Loading bars**: Empty → Filling → Full

## Related Commands

- `corne-cli oled generate` - Convert single image to OLED format
- `corne-cli oled detect` - Detect keyboard OLED size
- `corne-cli oled wizard` - Interactive OLED setup

## See Also

- [OLED Detection Guide](OLED_DETECTION.md)
- [Animated GIF Support](ANIMATED_GIF_SUPPORT.md)
- [QMK WPM Documentation](https://docs.qmk.fm/#/feature_wpm)

---

**Created**: April 3, 2026  
**Version**: 0.3.0  
**Status**: ✅ Production Ready
