// Configuration file for Corne keyboard with OLED animation
#pragma once

// ============================================================================
// OLED CONFIGURATION
// ============================================================================

// Enable 128x32 OLED display
#define OLED_DISPLAY_128X32

// OLED timeout in milliseconds (30 seconds)
// The display will turn off after this period of inactivity
#define OLED_TIMEOUT 30000

// OLED brightness (0-255)
// Lower values = dimmer, higher values = brighter
#define OLED_BRIGHTNESS 128

// OLED rotation (uncomment if your display appears upside down)
// Options: OLED_ROTATION_0, OLED_ROTATION_90, OLED_ROTATION_180, OLED_ROTATION_270
// #define OLED_ROTATION OLED_ROTATION_180

// ============================================================================
// OPTIONAL: ADVANCED OLED SETTINGS
// ============================================================================

// Update frequency (default is usually fine)
// #define OLED_UPDATE_INTERVAL 50

// Scroll timeout
// #define OLED_SCROLL_TIMEOUT 0

// ============================================================================
// KEYBOARD CONFIGURATION
// ============================================================================

// Tap-hold configuration
#define TAPPING_TERM 200

// Prevent accidental holds
#define IGNORE_MOD_TAP_INTERRUPT

// Enable permissive hold for faster layer switching
// #define PERMISSIVE_HOLD

// ============================================================================
// PERFORMANCE OPTIMIZATION
// ============================================================================

// Reduce firmware size if needed
// #define NO_ACTION_MACRO
// #define NO_ACTION_FUNCTION
