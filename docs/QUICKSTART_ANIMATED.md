# Quick Start: Animated OLED

## 🚀 En 3 Pasos

### 1. Detectar tu teclado

```bash
corne-cli oled detect
```

Salida:
```
✔ Keyboard detected!

╭──────────────────────────────────────────────────────────╮
│  🖥️  OLED Display Information                            │
│                                                          │
│  Keyboard: Corne (foostan)                               │
│  Display Size: 128x32 pixels                             │
│  Number of Displays: 2                                   │
╰──────────────────────────────────────────────────────────╯
```

### 2. Convertir tu GIF animado

```bash
corne-cli oled generate mi-animacion.gif --preview
```

Salida:
```
✔ Generated animated OLED (10 frames, 128x32): mi-animacion_oled_anim.h

🎬 Animation Preview (10 frames):
┌────────────────────────────────┐
│████░░░░░░░░░░░░░░░░░░░░░░████│
│██░░░░░░░░░░░░░░░░░░░░░░░░░░██│
│░░░░████████░░░░░░████████░░░░│
│░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░│
└────────────────────────────────┘
Frame delay: 100ms
```

### 3. Usar en QMK

Agrega a tu `keymap.c`:

```c
#include "mi-animacion_oled_anim.h"

bool oled_task_user(void) {
    static uint32_t anim_timer = 0;
    static uint8_t current_frame = 0;
    
    if (timer_elapsed32(anim_timer) > ANIM_FRAME_DURATION) {
        anim_timer = timer_read32();
        oled_write_raw_P(custom_animation[current_frame], OLED_SIZE);
        current_frame = (current_frame + 1) % ANIM_FRAME_COUNT;
    }
    
    return false;
}
```

## 📊 Formatos Soportados

| Formato | Estático | Animado | Notas |
|---------|----------|---------|-------|
| GIF | ✅ | ✅ | Mejor para animaciones |
| PNG | ✅ | ❌ | Mejor para imágenes estáticas |
| JPG | ✅ | ❌ | Se convierte a blanco/negro |
| BMP | ✅ | ❌ | Soporte básico |

## 🎨 Ejemplos de Uso

### Animación de Layer Indicator

```bash
# Crea GIF de 3 frames mostrando "Layer 0", "Layer 1", "Layer 2"
corne-cli oled generate layers.gif
```

### Logo Animado al Iniciar

```bash
# Animación que se muestra al conectar el teclado
corne-cli oled generate boot-logo.gif
```

### Indicador de WPM

```bash
# Barras animadas que crecen según velocidad de escritura
corne-cli oled generate wpm-bars.gif
```

## 💡 Tips

1. **Mantén los frames simples**: 10-20 frames son suficientes
2. **Alto contraste**: Usa blanco/negro para mejores resultados
3. **Loop infinito**: Asegúrate que el GIF haga loop correctamente
4. **Tamaño correcto**: El CLI redimensiona automáticamente a 128x32
5. **Vista previa**: Siempre usa `--preview` para verificar antes de compilar

## 🔗 Más Información

- [Documentación completa de GIF animados](ANIMATED_GIF_SUPPORT.md)
- [Detección automática de tamaño OLED](OLED_DETECTION.md)
- [Guía de inicio rápido](../GETTING_STARTED.md)

## 🎯 Comandos Relacionados

```bash
# Ver todos los comandos OLED
corne-cli oled --help

# Listar templates disponibles
corne-cli oled templates

# Asistente interactivo
corne-cli oled wizard

# Generar texto personalizado
corne-cli oled text
```
