# OLED Detection Documentation

## Automatic OLED Size Detection

El CLI ahora puede detectar automáticamente el tamaño de las pantallas OLED basándose en el modelo de teclado conectado.

## Teclados Soportados

| Teclado | VID:PID | OLED Size | Displays |
|---------|---------|-----------|----------|
| Corne (crkbd) | 0xfeed:0x0000 | 128x32 | 2 |
| Corne (foostan) | 0x4653:0x0001 | 128x32 | 2 |
| Lily58 | 0xfeed:0x6060 | 128x32 | 2 |
| Sofle | 0xfeed:0x0000 | 128x32 | 2 |
| Kyria | 0xfeed:0x1307 | 128x64 | 2 |

## Comandos

### Detectar tamaño OLED

```bash
corne-cli oled detect
```

Este comando detecta automáticamente:
- El modelo de teclado conectado
- El tamaño de las pantallas OLED (ancho x alto)
- La cantidad de pantallas

### Generar imagen con auto-detección

```bash
# El tamaño se detecta automáticamente
corne-cli oled generate mi-imagen.png --preview

# O especificar manualmente
corne-cli oled generate mi-imagen.png --width 128 --height 64
```

### Ver información del dispositivo

```bash
corne-cli devices
```

Muestra:
- Modelo de teclado detectado
- Especificaciones OLED
- Estado del dispositivo

## Configuración en Keymaps

Al crear o editar un keymap, el CLI guarda las dimensiones OLED:

```json
{
  "name": "mi-keymap",
  "config": {
    "oledConfig": {
      "enabled": true,
      "width": 128,
      "height": 32,
      "leftDisplay": { ... },
      "rightDisplay": { ... }
    }
  }
}
```

## Agregar Nuevos Teclados

Para agregar soporte para un nuevo teclado, editar `src/core/bootloader/constants.ts`:

```typescript
export const KNOWN_KEYBOARDS: KeyboardModel[] = [
  // Existing keyboards...
  { 
    vid: 0x1234, 
    pid: 0x5678, 
    name: 'Mi Teclado', 
    oledWidth: 128, 
    oledHeight: 32, 
    oledCount: 2 
  },
];
```

## Uso Manual

Si tu teclado no es detectado automáticamente, puedes especificar el tamaño manualmente:

```bash
# Generar imagen con tamaño específico
corne-cli oled generate imagen.png --width 128 --height 64 --preview

# El CLI mostrará los tamaños comunes si no puede auto-detectar:
# • 128x32 pixels (Corne, Lily58, Sofle)
# • 128x64 pixels (Kyria, algunos customs)
```
