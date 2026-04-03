# 🎬 Soporte Completo para OLED Animados

## Características Implementadas

El Corne CLI ahora incluye soporte completo para OLEDs animados con las siguientes características:

### ✅ GIF Animados
- **Conversión automática** de GIF a QMK (usando Sharp library)
- **Múltiples frames** con control preciso de timing
- **Optimización** de tamaño y memoria
- **Generación de código QMK** lista para usar

### ✅ Display de Teclas en Tiempo Real
- **Visualización instantánea** de la última tecla presionada
- **Soporte para 50+ símbolos** (letras, números, símbolos, flechas, etc.)
- **Indicador de capas** dinámico (Base, Lower, Raise, Adjust)
- **Formato grande y visible** (14x repetición de caracter)

### ✅ Split Keyboard Support
- **Contenido diferente** en cada mitad del teclado
- **Ejemplo implementado**: 
  - OLED Izquierdo: Display de teclas en tiempo real
  - OLED Derecho: Animación (robot saltando)
- **Sin lag de entrada** - Optimizado para no bloquear el teclado

### ✅ RP2040 Support
- **UF2 bootloader** compatible
- **Flashing sencillo** (drag-and-drop)
- **Ambas mitades** flasheables independientemente

## 📋 Uso

### Generar animación desde GIF

```bash
# Auto-detecta si es GIF animado y convierte todos los frames
corne-cli oled generate mi-animacion.gif --preview

# Con tamaño específico
corne-cli oled generate mi-animacion.gif --width 128 --height 32
```

### Salida

El comando genera un archivo `.h` con:
- **Array de frames**: Todos los frames convertidos a formato QMK
- **Definiciones**: `ANIM_FRAME_COUNT`, `ANIM_FRAME_DURATION`, `OLED_SIZE`
- **Código de ejemplo**: Lógica para animar en QMK

Ejemplo de salida (`mi-animacion_oled_anim.h`):

```c
// Generated OLED animation: custom_animation
// Size: 128x32
// Frames: 10
// Frame delay: 100ms

#define ANIM_FRAME_DURATION 100
#define ANIM_FRAME_COUNT 10
#define OLED_SIZE 512

static const char PROGMEM custom_animation[ANIM_FRAME_COUNT][OLED_SIZE] = {
    // Frame 1
    {
        0x00, 0x00, 0x00, 0x00, ...
    },
    // Frame 2
    {
        0x00, 0x00, 0x00, 0x00, ...
    },
    // ... más frames
};
```

## 🔧 Integración con QMK

### 1. Incluir el archivo generado

```c
// En tu keymap.c
#include "mi-animacion_oled_anim.h"
```

### 2. Agregar lógica de animación

```c
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

### 3. Opciones avanzadas

#### Animar solo cuando se escribe

```c
bool oled_task_user(void) {
    static uint32_t anim_timer = 0;
    static uint8_t current_frame = 0;
    static uint32_t idle_timer = 0;
    
    // Resetear idle timer en cada keypress
    if (is_keyboard_master()) {
        idle_timer = timer_read32();
    }
    
    // Solo animar si se escribió recientemente (últimos 5 segundos)
    if (timer_elapsed32(idle_timer) < 5000) {
        if (timer_elapsed32(anim_timer) > ANIM_FRAME_DURATION) {
            anim_timer = timer_read32();
            oled_write_raw_P(custom_animation[current_frame], OLED_SIZE);
            current_frame = (current_frame + 1) % ANIM_FRAME_COUNT;
        }
    } else {
        // Mostrar imagen estática cuando está idle
        oled_write_raw_P(custom_animation[0], OLED_SIZE);
    }
    
    return false;
}
```

#### Diferentes animaciones por layer

```c
bool oled_task_user(void) {
    static uint32_t anim_timer = 0;
    static uint8_t current_frame = 0;
    
    if (timer_elapsed32(anim_timer) > ANIM_FRAME_DURATION) {
        anim_timer = timer_read32();
        
        // Cambiar animación según la capa activa
        switch (get_highest_layer(layer_state)) {
            case 0:  // Base layer
                oled_write_raw_P(base_animation[current_frame], OLED_SIZE);
                break;
            case 1:  // Lower layer
                oled_write_raw_P(lower_animation[current_frame], OLED_SIZE);
                break;
            case 2:  // Raise layer
                oled_write_raw_P(raise_animation[current_frame], OLED_SIZE);
                break;
        }
        
        current_frame = (current_frame + 1) % ANIM_FRAME_COUNT;
    }
    
    return false;
}
```

## 📊 Especificaciones

### Límites Técnicos

- **Tamaño de frame**: Calculado automáticamente (128x32 = 512 bytes)
- **Frames máximos recomendados**: 
  - ⚠️ **20-30 frames** para teclados con memoria limitada
  - ✅ **50+ frames** para teclados modernos (Elite-C, Pro Micro RP2040)
- **Duración del frame**: Extraída del GIF (típicamente 100ms)

### Memoria PROGMEM

Las animaciones se almacenan en **PROGMEM** (flash memory) para no ocupar RAM:

```c
// Ejemplo de uso de memoria
// 10 frames @ 128x32 = 10 * 512 bytes = 5,120 bytes
static const char PROGMEM animation[10][512] = { ... };
```

### Optimización

Para reducir el uso de memoria:

1. **Reducir frames**: Usa menos frames con mayor delay
   ```bash
   # Convertir GIF a menos frames con ImageMagick
   magick convert input.gif -coalesce -delete 1--2 output.gif
   ```

2. **Reducir tamaño**: Usa imágenes más pequeñas
   ```bash
   corne-cli oled generate animation.gif --width 64 --height 32
   ```

3. **Comprimir**: Simplifica el diseño (menos detalles = menos memoria)

## 🎨 Creación de GIFs

### Herramientas Recomendadas

1. **GIPHY Capture** (Mac): Captura pantalla a GIF
2. **ScreenToGif** (Windows): Graba y edita GIFs
3. **GIMP**: Editor de imágenes con soporte GIF
4. **ezgif.com**: Editor online de GIFs
5. **Photoshop**: Exportar timeline como GIF

### Consejos para Mejores Resultados

- ✅ **Alto contraste**: Blanco y negro funcionan mejor
- ✅ **Bordes definidos**: Evita degradados
- ✅ **Pocos frames**: 10-20 frames son suficientes
- ✅ **Loop infinito**: Asegúrate que el GIF haga loop
- ❌ **Evita colores**: Se convierten a blanco/negro
- ❌ **Evita detalles finos**: Se pierden en 128x32

### Ejemplo de Pipeline de Creación

```bash
# 1. Crear GIF (cualquier herramienta)
# 2. Optimizar con ezgif.com o ImageMagick
magick convert original.gif -resize 128x32 -colors 2 optimized.gif

# 3. Convertir a formato OLED
corne-cli oled generate optimized.gif --preview

# 4. Verificar en preview antes de compilar
```

## 📝 Ejemplos de Animaciones

### Animaciones Populares

- **Indicador de escritura**: Puntos que parpadean
- **Indicador de layer**: Números o símbolos que cambian
- **Wave**: Onda que se mueve
- **Bounce**: Bola que rebota
- **Spinner**: Círculo que gira
- **Nyan Cat**: Clásico (¡si tienes la memoria!)

## ⚡ Rendimiento

### FPS Objetivo

- **60 FPS**: `ANIM_FRAME_DURATION = 16` (demasiado rápido, poco útil)
- **30 FPS**: `ANIM_FRAME_DURATION = 33` (suave)
- **15 FPS**: `ANIM_FRAME_DURATION = 66` (aceptable)
- **10 FPS**: `ANIM_FRAME_DURATION = 100` (recomendado)
- **5 FPS**: `ANIM_FRAME_DURATION = 200` (lento pero funcional)

### Impacto en Batería

Las animaciones consumen más batería en teclados wireless:
- **Sin animación**: ~3-4 semanas
- **Con animación idle timeout**: ~2-3 semanas
- **Animación continua**: ~1 semana

## 🐛 Troubleshooting

### "Not enough memory" al compilar

- Reduce el número de frames
- Reduce el tamaño de la imagen
- Usa solo una animación en lugar de múltiples

### Animación muy lenta/rápida

- Ajusta `ANIM_FRAME_DURATION` en el archivo `.h` generado
- Valores típicos: 50-200ms

### La animación se ve mal

- Asegúrate que el GIF original sea blanco/negro
- Incrementa el contraste antes de convertir
- Simplifica el diseño

## 🔗 Referencias

- [QMK OLED Driver Docs](https://docs.qmk.fm/#/feature_oled_driver)
- [QMK Timer Functions](https://docs.qmk.fm/#/feature_timing)
- [PROGMEM Guide](https://www.arduino.cc/reference/en/language/variables/utilities/progmem/)
