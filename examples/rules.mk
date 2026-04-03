# Build options for Corne keyboard with OLED animation

# ============================================================================
# REQUIRED FOR OLED
# ============================================================================

# Enable OLED displays
OLED_ENABLE = yes
OLED_DRIVER = ssd1306

# ============================================================================
# OPTIMIZATION (Recommended)
# ============================================================================

# Link Time Optimization - reduces firmware size significantly
LTO_ENABLE = yes

# ============================================================================
# FEATURES (Disable what you don't use to save space)
# ============================================================================

# Mouse keys (cursor control with keyboard)
MOUSEKEY_ENABLE = no

# Debug console (not needed in production)
CONSOLE_ENABLE = no

# Commands for debug and configuration
COMMAND_ENABLE = no

# Bootmagic Lite (hold key during boot to reset)
BOOTMAGIC_ENABLE = yes

# Extrakey features (media keys, volume control)
EXTRAKEY_ENABLE = yes

# NKRO (N-Key Rollover) - allows pressing many keys simultaneously
NKRO_ENABLE = yes

# ============================================================================
# OPTIONAL FEATURES
# ============================================================================

# RGB underglow (if your Corne has RGB LEDs)
# RGBLIGHT_ENABLE = yes

# RGB matrix (per-key RGB)
# RGB_MATRIX_ENABLE = no

# Audio (if you have a buzzer)
# AUDIO_ENABLE = no

# WPM counter (words per minute)
# WPM_ENABLE = yes

# Encoder support (if you have rotary encoders)
# ENCODER_ENABLE = no

# ============================================================================
# SPACE SAVING (Uncomment if you run out of program memory)
# ============================================================================

# These reduce functionality but save space
# NO_ACTION_MACRO = yes
# NO_ACTION_FUNCTION = yes
# MAGIC_ENABLE = no
# SPACE_CADET_ENABLE = no
# GRAVE_ESC_ENABLE = no
