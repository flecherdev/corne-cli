# Layer-Specific OLED Animations

Create dynamic OLED displays that change automatically based on your active keyboard layer. Perfect for visual feedback when switching between typing modes!

## 🎯 Overview

Layer-specific animations allow you to display different animations on your OLED based on which layer is currently active:
- **Base layer**: Show a relaxed/idle animation
- **Lower layer**: Show symbols/special characters theme
- **Raise layer**: Show numbers/function keys theme
- **Adjust layer**: Show settings/configuration theme

The CLI automatically generates QMK code that:
- Detects the active layer in real-time
- Switches animations instantly when layers change
- Optionally adds smooth transitions between layers
- Displays layer indicators (optional text overlays)

## 🚀 Quick Start

### 1. Prepare Your Animations

Create one GIF or static image for each layer you want to customize:

```bash
base_layer.gif      # Idle/typing animation for base layer
lower_layer.gif     # Symbols layer animation
raise_layer.gif     # Numbers layer animation
adjust_layer.gif    # Settings layer animation
```

**Recommended specs:**
- Size: 128x32 pixels (auto-detected for your keyboard)
- Format: GIF (animated) or PNG/JPG (static)
- Colors: Monochrome/grayscale (will be converted to 1-bit)
- Frame count: 4-20 frames for smooth animation
- File size: Keep under 1MB per GIF

### 2. Generate Layer Animations

```bash
corne-cli oled layers
```

The interactive wizard will guide you through:
1. Number of layers to configure (1-8)
2. Enable transitions between layers (yes/no)
3. For each layer:
   - Layer name (Base, Lower, Raise, etc.)
   - Animation file path
   - Frame delay (animation speed)
   - Optional text indicator

### 3. Add to Your QMK Keymap

```c
// keymap.c
#include "layer_animation.h"

bool oled_task_user(void) {
    render_layer_animation();
    return false;
}
```

### 4. Compile and Flash

```bash
qmk compile
qmk flash
```

Now your OLED will automatically show different animations for each layer! 🎉

## 📖 Detailed Usage

### Command Options

```bash
corne-cli oled layers [options]

Options:
  -w, --width <pixels>   OLED width in pixels (auto-detected if omitted)
  -t, --height <pixels>  OLED height in pixels (auto-detected if omitted)
```

### Example Session

```bash
$ corne-cli oled layers

🎨 Layer-Specific Animation Generator

Create different OLED animations for each keyboard layer!

? How many layers to configure? 4
? Enable smooth transitions between layers? Yes
? Transition duration (ms): 200

📝 Configuring Layer 0:
? Layer 0 name: Base
? Path to animation for Base: ./animations/base.gif
? Frame delay (ms): 100
? Add text indicator for this layer? No
✓ Base: 8 frames loaded

📝 Configuring Layer 1:
? Layer 1 name: Lower
? Path to animation for Lower: ./animations/symbols.gif
? Frame delay (ms): 80
? Add text indicator for this layer? Yes
? Indicator text (3-4 chars): SYM
✓ Lower: 6 frames loaded

📝 Configuring Layer 2:
? Layer 2 name: Raise
? Path to animation for Raise: ./animations/numbers.gif
? Frame delay (ms): 80
? Add text indicator for this layer? Yes
? Indicator text (3-4 chars): NUM
✓ Raise: 6 frames loaded

📝 Configuring Layer 3:
? Layer 3 name: Adjust
? Path to animation for Adjust: ./animations/settings.gif
? Frame delay (ms): 150
? Add text indicator for this layer? Yes
? Indicator text (3-4 chars): CFG
✓ Adjust: 4 frames loaded

✓ Generating QMK code...
? Output file name: layer_animation.h
✓ Layer animations generated successfully!

┌─────────────────────────────────────────────┐
│                                             │
│  📦 Generated Files:                        │
│                                             │
│  Animation Code: layer_animation.h          │
│  Rules Config:   layer_animation_rules.mk   │
│                                             │
│  Configured Layers:                         │
│                                             │
│    Base       (8 frames @ 100ms)            │
│    Lower      (6 frames @ 80ms)             │
│    Raise      (6 frames @ 80ms)             │
│    Adjust     (4 frames @ 150ms)            │
│                                             │
│  Settings:                                  │
│                                             │
│  Transitions: Enabled                       │
│  Duration:    200ms                         │
│                                             │
└─────────────────────────────────────────────┘
```

## 🎨 Design Tips

### Animation Ideas by Layer

**Base Layer** (Layer 0):
- Calm, slow-moving animations
- Idle/neutral themes (flying birds, floating clouds)
- Subtle movement to avoid distraction
- 100-200ms frame delays

**Symbol/Lower Layer** (Layer 1):
- Symbols floating or highlighting
- Faster animations (60-100ms)
- Visual cues for special characters
- Examples: sparkles, stars, punctuation

**Number/Raise Layer** (Layer 2):
- Number-themed animations
- Calculator, abacus, or counting themes
- Similar speed to Lower layer (60-100ms)
- Digital/tech aesthetic

**Function/Adjust Layer** (Layer 3+):
- Settings gear icon
- Slower, deliberate animations (150-300ms)
- Tool/configuration themes
- Indicates "system mode"

### Performance Considerations

**Frame Count:**
- 4-8 frames: Minimal (low memory usage)
- 8-12 frames: Smooth (recommended)
- 12-20 frames: Very smooth (higher memory)

**Frame Delays:**
- 50-80ms: Fast, energetic
- 80-120ms: Normal, balanced
- 120-200ms: Slow, calm
- 200-500ms: Very slow, slideshow

**Memory Usage:**
Each frame uses 512 bytes for 128x32 OLED (4KB total). Example:
- 4 layers × 8 frames = 32 frames = 16KB
- 4 layers × 12 frames = 48 frames = 24KB

Most keyboards have 32KB available, so keep total frame count under 50-60.

## 🔧 Advanced Configuration

### Custom Layer IDs

If your keymap uses non-standard layer numbers, specify them manually:

```c
// Edit the generated code to match your layer IDs
typedef enum {
    _QWERTY = 0,      // Base layer
    _SYMBOLS = 1,     // Lower layer
    _NUMBERS = 2,     // Raise layer
    _FUNCTION = 3,    // Adjust layer
    _GAMING = 4,      // Gaming layer
} keyboard_layer_t;
```

### Transition Effects

Enable smooth transitions in the wizard:
- **Enabled**: Gradual fade between layer animations (200ms default)
- **Disabled**: Instant switch (more responsive, saves memory)

### Layer Indicators

Optional text overlays show the current layer name:

```c
// In your oled_task_user()
render_layer_animation();
render_layer_indicator();  // Adds "Layer: Base" text
```

Customize position by editing the generated code:
```c
void render_layer_indicator(void) {
    oled_set_cursor(0, 3);  // Bottom-left corner (row 3)
    // ... rest of function
}
```

### Combining with WPM Animations

You can combine layer animations with WPM-based animations for even more dynamic displays:

```c
// Primary display: Layer-specific animation
// Secondary display: WPM counter + animation

bool oled_task_user(void) {
    if (is_keyboard_master()) {
        render_layer_animation();      // Left OLED
    } else {
        render_wpm_animation(false);   // Right OLED
    }
    return false;
}
```

## 🐛 Troubleshooting

### Animation Not Changing

**Problem:** OLED shows only one animation, doesn't change with layers

**Solutions:**
1. Verify layer switching works: Add debug output to see layer changes
   ```c
   dprint("Layer: "); dprintf("%d\n", get_highest_layer(layer_state));
   ```

2. Check layer IDs match your keymap:
   ```c
   // Make sure these match your layer definitions
   enum layers {
       _BASE = 0,
       _LOWER = 1,
       _RAISE = 2
   };
   ```

3. Ensure `render_layer_animation()` is called in `oled_task_user()`

### Compilation Errors

**Problem:** `undefined reference to 'get_highest_layer'`

**Solution:** Add to `rules.mk`:
```make
OLED_ENABLE = yes
```

**Problem:** `error: 'OLED_SIZE' undeclared`

**Solution:** The generated header should define this. If missing, add:
```c
#define OLED_SIZE 512  // For 128x32 display
```

### Transitions Not Smooth

**Problem:** Layer changes are jerky or instant

**Solution:** 
1. Verify transitions are enabled in generated code:
   ```c
   #define LAYER_TRANSITION_ENABLED
   ```

2. Adjust transition duration (increase for smoother):
   ```c
   #define LAYER_TRANSITION_DURATION 300  // 300ms
   ```

### Memory Warnings

**Problem:** `firmware too large` or memory overflow

**Solutions:**
1. Reduce frame count per layer (use 4-6 frames instead of 10+)
2. Disable WPM if using both features
3. Simplify animations (fewer colors/details)
4. Remove unused layers from generated code

## 📚 Examples

### Minimal Setup (2 Layers)

Perfect for split keyboards with simple layout:

```bash
corne-cli oled layers

Layers: 2
Transitions: No

Layer 0 (Base): typing.gif (8 frames, 100ms)
Layer 1 (Lower): symbols.gif (6 frames, 80ms)
```

### Full Setup (4 Layers + Transitions)

Recommended for complex layouts:

```bash
corne-cli oled layers

Layers: 4
Transitions: Yes (200ms)

Layer 0 (Base): idle.gif (10 frames, 120ms)
Layer 1 (Lower): symbols.gif (8 frames, 80ms) + "SYM" indicator
Layer 2 (Raise): numbers.gif (8 frames, 80ms) + "NUM" indicator
Layer 3 (Adjust): settings.gif (6 frames, 150ms) + "CFG" indicator
```

### Gaming Setup

Fast animations for gaming layer:

```bash
Layers: 2
Transitions: No

Layer 0 (Base): idle.gif (8 frames, 100ms)
Layer 1 (Gaming): game-mode.gif (12 frames, 50ms) + "GAME" indicator
```

## 🎬 Animation Resources

### Where to Find Animations

1. **Pixel Art Sites:**
   - [itch.io](https://itch.io/game-assets/free/tag-pixel-art) - Free game assets
   - [OpenGameArt](https://opengameart.org/) - CC0 sprites
   - [Lospec](https://lospec.com/gallery) - Pixel art gallery

2. **Create Your Own:**
   - [Piskel](https://www.piskelapp.com/) - Free online pixel editor
   - [Aseprite](https://www.aseprite.org/) - Professional pixel art tool
   - [GIMP](https://www.gimp.org/) - Free image editor with animation

3. **Convert Videos:**
   ```bash
   # Extract frames from video
   ffmpeg -i input.mp4 -vf "scale=128:32,fps=10" frame_%03d.png
   
   # Create GIF from frames
   ffmpeg -i frame_%03d.png -vf "fps=10" output.gif
   ```

### Recommended Themes

- **Cats:** Different cat poses per layer (sleeping, playing, alert)
- **Weather:** Sun, clouds, rain, storm
- **Tech:** Terminal typing, code scrolling, circuit patterns
- **Gaming:** Pac-Man, Space Invaders, retro game sprites
- **Nature:** Trees, mountains, ocean waves
- **Abstract:** Geometric patterns, matrix effect, waves

## 🤝 Contributing

Have a great animation set to share? Submit it to our [examples repository](https://github.com/corne-cli/animation-library)!

## 📄 Related Documentation

- [WPM Animations](./WPM_ANIMATIONS.md) - Speed-reactive displays
- [OLED Detection](./OLED_DETECTION.md) - Automatic size detection
- [Animation Examples](./ANIMATION_EXAMPLES.md) - Gallery and ideas
- [QMK OLED Driver](https://docs.qmk.fm/#/feature_oled_driver) - Official QMK docs

---

**Need help?** Open an issue on [GitHub](https://github.com/corne-cli/issues) or check the [User Guide](../USER_GUIDE.md).
