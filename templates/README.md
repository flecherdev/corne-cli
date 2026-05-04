# Templates

Templates para el teclado Corne.

## Disponibles

| Template | Descripción |
|----------|-------------|
| `minimal` | Layout básico mínimo - punto de partida |
| `qwerty` | QWERTY estándar con capas de función y navegación |
| `programmer` | Optimizado para programación - símbolos, números, navegación rápida |
| `designer` | Para diseño - herramientas creativas, RGB, navegación |
| `audio` | Para producción de audio - controles de medios, shortcuts DAW |
| `gamer` | Gaming - WASD, macros, cambio rápido de perfiles |
| `writer` | Escritura - acentos, navegación, funciones |

## Uso

```bash
# Listar templates
corne-cli templates:list

# Crear keymap desde template
corne-cli keymap:create mi-layout --template programmer

# Aplicar y generar archivos
corne-cli templates:apply programmer --target ./mi-keymap

# Compilar
corne-cli compile --keymap mi-layout --output keymap.c
```