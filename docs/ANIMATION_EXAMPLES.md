# 🎬 Ejemplos de Animaciones OLED

Esta guía muestra ejemplos prácticos de animaciones para tu teclado Corne.

## 📁 Estructura de Archivos

```
qmk_firmware/keyboards/crkbd/keymaps/mi_keymap/
├── keymap.c
├── config.h
├── rules.mk
└── animations/
    ├── boot_logo_anim.h      # Logo al iniciar
    ├── typing_anim.h         # Animación al escribir
    ├── idle_anim.h           # Animación en reposo
    └── layer_indicator.h     # Indicador de capa
```

## 🚀 Ejemplo 1: Logo de Inicio Simple

### Crear el GIF
1. Crea un GIF de 5-10 frames con tu logo
2. Asegúrate que tenga buen contraste (blanco/negro)

### Convertir
```bash
corne-cli oled generate boot-logo.gif -o animations/boot_logo_anim.h
```

### Usar en QMK
```c
// keymap.c
#include "animations/boot_logo_anim.h"

static bool show_boot_animation = true;
static uint32_t boot_timer = 0;

bool oled_task_user(void) {
    if (show_boot_animation) {
        static uint32_t anim_timer = 0;
        static uint8_t current_frame = 0;
        
        // Mostrar animación por 3 segundos
        if (timer_elapsed32(boot_timer) > 3000) {
            show_boot_animation = false;
            return false;
        }
        
        if (timer_elapsed32(anim_timer) > BOOT_ANIM_FRAME_DURATION) {
            anim_timer = timer_read32();
            oled_write_raw_P(boot_logo_animation[current_frame], OLED_SIZE);
            current_frame = (current_frame + 1) % BOOT_ANIM_FRAME_COUNT;
        }
    } else {
        // Mostrar información normal después del boot
        render_status();
    }
    
    return false;
}

void keyboard_post_init_user(void) {
    boot_timer = timer_read32();
}
```

## ⌨️ Ejemplo 2: Animación al Escribir

### Crear el GIF
Un simple indicador que se mueve cuando escribes.

### Convertir
```bash
corne-cli oled generate typing-indicator.gif -o animations/typing_anim.h
```

### Usar en QMK
```c
// keymap.c
#include "animations/typing_anim.h"

static uint32_t idle_timer = 0;
static uint32_t anim_timer = 0;
static uint8_t current_frame = 0;

bool process_record_user(uint16_t keycode, keyrecord_t *record) {
    if (record->event.pressed) {
        idle_timer = timer_read32(); // Reset idle timer
    }
    return true;
}

bool oled_task_user(void) {
    // Si escribió recientemente (últimos 5 segundos)
    if (timer_elapsed32(idle_timer) < 5000) {
        // Mostrar animación de escritura
        if (timer_elapsed32(anim_timer) > TYPING_ANIM_FRAME_DURATION) {
            anim_timer = timer_read32();
            oled_write_raw_P(typing_animation[current_frame], OLED_SIZE);
            current_frame = (current_frame + 1) % TYPING_ANIM_FRAME_COUNT;
        }
    } else {
        // Mostrar pantalla estática en idle
        oled_write_P(PSTR("Corne\nKeyboard"), false);
    }
    
    return false;
}
```

## 🎨 Ejemplo 3: Indicador de Capa Animado

### Crear 3 GIFs (uno por capa)
- `layer0.gif` - Base layer
- `layer1.gif` - Lower layer
- `layer2.gif` - Raise layer

### Convertir
```bash
corne-cli oled generate layer0.gif -o animations/layer0_anim.h
corne-cli oled generate layer1.gif -o animations/layer1_anim.h
corne-cli oled generate layer2.gif -o animations/layer2_anim.h
```

### Modificar los nombres en los archivos generados
Edita cada `.h` y cambia `custom_animation` a un nombre único:
- `layer0_animation`
- `layer1_animation`
- `layer2_animation`

### Usar en QMK
```c
// keymap.c
#include "animations/layer0_anim.h"
#include "animations/layer1_anim.h"
#include "animations/layer2_anim.h"

bool oled_task_user(void) {
    static uint32_t anim_timer = 0;
    static uint8_t current_frame = 0;
    
    uint8_t layer = get_highest_layer(layer_state);
    
    if (timer_elapsed32(anim_timer) > ANIM_FRAME_DURATION) {
        anim_timer = timer_read32();
        
        switch (layer) {
            case 0:
                oled_write_raw_P(layer0_animation[current_frame], OLED_SIZE);
                break;
            case 1:
                oled_write_raw_P(layer1_animation[current_frame], OLED_SIZE);
                break;
            case 2:
                oled_write_raw_P(layer2_animation[current_frame], OLED_SIZE);
                break;
        }
        
        current_frame = (current_frame + 1) % ANIM_FRAME_COUNT;
    }
    
    return false;
}
```

## 🌊 Ejemplo 4: Wave Effect

### Concepto
Una onda que se mueve de izquierda a derecha continuamente.

### Crear el GIF
1. Crea 10-15 frames de una línea sinusoidal
2. Cada frame desplaza la onda un poco

### Convertir
```bash
corne-cli oled generate wave.gif -o animations/wave_anim.h --preview
```

### Usar en QMK
```c
// keymap.c
#include "animations/wave_anim.h"

bool oled_task_user(void) {
    static uint32_t anim_timer = 0;
    static uint8_t current_frame = 0;
    
    // Loop infinito de wave
    if (timer_elapsed32(anim_timer) > 50) { // Rápido: 20 FPS
        anim_timer = timer_read32();
        oled_write_raw_P(wave_animation[current_frame], OLED_SIZE);
        current_frame = (current_frame + 1) % WAVE_ANIM_FRAME_COUNT;
    }
    
    return false;
}
```

## 📊 Ejemplo 5: WPM Visualizer Animado

### Concepto
Barras que crecen según tu velocidad de escritura (WPM).

### Crear múltiples GIFs
- `wpm_low.gif` (1-3 barras)
- `wpm_medium.gif` (4-6 barras)
- `wpm_high.gif` (7-10 barras)

### Convertir
```bash
corne-cli oled generate wpm_low.gif -o animations/wpm_low_anim.h
corne-cli oled generate wpm_medium.gif -o animations/wpm_medium_anim.h
corne-cli oled generate wpm_high.gif -o animations/wpm_high_anim.h
```

### Usar en QMK
```c
// keymap.c
#include "animations/wpm_low_anim.h"
#include "animations/wpm_medium_anim.h"
#include "animations/wpm_high_anim.h"

bool oled_task_user(void) {
    static uint32_t anim_timer = 0;
    static uint8_t current_frame = 0;
    
    uint8_t wpm = get_current_wpm();
    
    if (timer_elapsed32(anim_timer) > 100) {
        anim_timer = timer_read32();
        
        // Seleccionar animación según WPM
        if (wpm < 30) {
            oled_write_raw_P(wpm_low_animation[current_frame], OLED_SIZE);
        } else if (wpm < 60) {
            oled_write_raw_P(wpm_medium_animation[current_frame], OLED_SIZE);
        } else {
            oled_write_raw_P(wpm_high_animation[current_frame], OLED_SIZE);
        }
        
        current_frame = (current_frame + 1) % WPM_ANIM_FRAME_COUNT;
    }
    
    return false;
}
```

## 🎮 Ejemplo 6: Split Screen (Dos Animaciones)

### Concepto
Pantalla izquierda y derecha con diferentes animaciones.

```c
// keymap.c
#include "animations/left_anim.h"
#include "animations/right_anim.h"

bool oled_task_user(void) {
    static uint32_t anim_timer = 0;
    static uint8_t current_frame = 0;
    
    if (timer_elapsed32(anim_timer) > 100) {
        anim_timer = timer_read32();
        
        // Alternar según qué mitad del teclado es
        if (is_keyboard_left()) {
            oled_write_raw_P(left_animation[current_frame], OLED_SIZE);
        } else {
            oled_write_raw_P(right_animation[current_frame], OLED_SIZE);
        }
        
        current_frame = (current_frame + 1) % ANIM_FRAME_COUNT;
    }
    
    return false;
}
```

## 📝 Config.h Recomendada

```c
// config.h

// Habilitar OLED
#define OLED_DISPLAY_128X32

// Timeout del OLED (opcional)
#define OLED_TIMEOUT 30000  // 30 segundos

// Brillo del OLED (0-255)
#define OLED_BRIGHTNESS 128

// Rotación (si es necesario)
// #define OLED_ROTATION OLED_ROTATION_180
```

## 📝 Rules.mk Recomendada

```make
# rules.mk

# Habilitar OLED
OLED_ENABLE = yes
OLED_DRIVER = SSD1306

# Si usas WPM
WPM_ENABLE = yes

# Optimización de espacio si necesitas
LTO_ENABLE = yes
```

## 💾 Consideraciones de Memoria

### Espacio Ocupado por Frame
- **128x32 OLED** = 512 bytes por frame
- **10 frames** = 5,120 bytes
- **20 frames** = 10,240 bytes

### Límites Típicos
- **Pro Micro (ATmega32U4)**: ~28KB disponibles
  - Máximo recomendado: **20-30 frames** (10-15KB)
  
- **Elite-C / RP2040**: Mucho más espacio
  - Puedes usar **50+ frames** sin problema

### Optimizar Memoria
```bash
# En rules.mk
LTO_ENABLE = yes           # Link Time Optimization
CONSOLE_ENABLE = no        # Desactivar console
COMMAND_ENABLE = no        # Desactivar command
MOUSEKEY_ENABLE = no       # Si no usas mouse keys
```

## 🐛 Troubleshooting

### Error: "region 'progmem' overflowed"
- Reduce el número de frames en tu GIF
- Activa `LTO_ENABLE = yes`
- Desactiva features que no uses

### Animación muy lenta
- Reduce `ANIM_FRAME_DURATION` en el `.h` generado
- Típicamente: 50-100ms funciona bien

### Animación se ve mal
- Aumenta el contraste del GIF original
- Simplifica el diseño (menos detalles)
- Convierte a blanco/negro antes de generar

## 🔗 Recursos

- [QMK OLED Driver](https://docs.qmk.fm/#/feature_oled_driver)
- [QMK WPM Feature](https://docs.qmk.fm/#/feature_wpm)
- [GIMP - Editor de GIF](https://www.gimp.org/)
- [ezgif.com - Editor online](https://ezgif.com/)
