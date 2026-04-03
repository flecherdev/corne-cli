# 🚀 Guía Completa: Ver tu Animación en el Teclado Corne

Esta guía te llevará paso a paso desde la instalación de QMK hasta ver tu animación funcionando.

## 📋 Requisitos Previos

- Python 3.7 o superior
- Git
- Tu teclado Corne conectado
- Acceso a una terminal/PowerShell

## 0️⃣ 💾 IMPORTANTE: Hacer Backup (RECOMENDADO)

**Antes de hacer cualquier cambio**, haz un backup de tu configuración actual:

### Opción Rápida: Script Automático

```powershell
# Ejecutar script de backup
.\backup-corne.ps1 -KeymapName default

# O si ya tienes un keymap personalizado:
.\backup-corne.ps1 -KeymapName mi_keymap_actual
```

### Opción Manual

```powershell
# Ver qué keymaps tienes
qmk list-keymaps -kb crkbd

# Crear backup manual
$fecha = Get-Date -Format "yyyy-MM-dd"
Copy-Item "$env:USERPROFILE\qmk_firmware\keyboards\crkbd\keymaps\tu_keymap" `
          "$env:USERPROFILE\corne-backups\backup_$fecha" -Recurse
```

📖 **Guía completa de backup**: Ver [BACKUP_RESTORE.md](BACKUP_RESTORE.md)

---

## 1️⃣ Instalar QMK

### Windows

```powershell
# Instalar QMK CLI
python -m pip install --user qmk

# Verificar instalación
qmk --version

# Configurar QMK (primera vez)
qmk setup
```

Durante `qmk setup`:
- Te preguntará dónde instalar QMK firmware (por defecto `C:\Users\TuUsuario\qmk_firmware`)
- Presiona Enter para aceptar
- Esperará a que descargue todo (puede tardar 5-10 minutos)

### macOS/Linux

```bash
# Instalar QMK CLI
python3 -m pip install --user qmk

# Verificar instalación
qmk --version

# Configurar QMK
qmk setup
```

## 2️⃣ Crear tu Keymap Personalizado

Ahora vamos a crear un keymap personalizado con tu animación.

### Opción A: Comando Automático

```powershell
# Ubicación típica de QMK
cd C:\Users\TuUsuario\qmk_firmware

# Crear nuevo keymap basado en el default
qmk new-keymap -kb crkbd -km mi_animacion
```

### Opción B: Manual

```powershell
cd C:\Users\TuUsuario\qmk_firmware\keyboards\crkbd\keymaps

# Crear carpeta para tu keymap
mkdir mi_animacion
cd mi_animacion
```

## 3️⃣ Copiar Archivos

Ahora copia los archivos generados por el CLI:

### Paso 3.1: Crear la estructura

```powershell
# Desde la carpeta mi_animacion
New-Item -ItemType Directory -Force -Path "."
```

### Paso 3.2: Copiar archivos

1. **Copia** `examples\king_oled_anim.h` a la carpeta `mi_animacion`

2. **Copia** `examples\keymap_example.c` y renómbralo a `keymap.c` en la carpeta `mi_animacion`

```powershell
# Ejemplo desde PowerShell (ajusta las rutas)
Copy-Item "C:\projects\tools\corne-cli\examples\king_oled_anim.h" `
          "C:\Users\TuUsuario\qmk_firmware\keyboards\crkbd\keymaps\mi_animacion\"

Copy-Item "C:\projects\tools\corne-cli\examples\keymap_example.c" `
          "C:\Users\TuUsuario\qmk_firmware\keyboards\crkbd\keymaps\mi_animacion\keymap.c"
```

### Paso 3.3: Crear config.h y rules.mk

#### config.h
```c
// config.h
#pragma once

// Habilitar OLED
#define OLED_DISPLAY_128X32

// Timeout del OLED (30 segundos de inactividad)
#define OLED_TIMEOUT 30000

// Brillo del OLED (0-255)
#define OLED_BRIGHTNESS 128

// Opcional: rotar pantalla si la ves al revés
// #define OLED_ROTATION OLED_ROTATION_180
```

#### rules.mk
```make
# rules.mk

# Habilitar OLED
OLED_ENABLE = yes
OLED_DRIVER = ssd1306

# Optimización de espacio (recomendado)
LTO_ENABLE = yes

# Desactivar features que no uses para ahorrar espacio
MOUSEKEY_ENABLE = no
CONSOLE_ENABLE = no
COMMAND_ENABLE = no
```

La estructura final debe ser:
```
qmk_firmware/keyboards/crkbd/keymaps/mi_animacion/
├── keymap.c
├── config.h
├── rules.mk
└── king_oled_anim.h
```

## 4️⃣ Compilar el Firmware

```powershell
# Desde cualquier ubicación
qmk compile -kb crkbd -km mi_animacion
```

Deberías ver algo como:
```
Compiling: keyboards/crkbd/keymaps/mi_animacion/keymap.c
...
Linking: .build/crkbd_rev1_mi_animacion.elf
Creating hex file: .build/crkbd_rev1_mi_animacion.hex
Size after: ████████ bytes used (XX%)
```

Si ves errores, revisa la sección de Troubleshooting al final.

## 5️⃣ Flashear al Teclado

### Paso 5.1: Preparar el teclado

1. **Desconecta** el cable USB del teclado
2. Ten listo el **botón de reset** (generalmente debajo o necesitas un clip)

### Paso 5.2: Flashear

```powershell
qmk flash -kb crkbd -km mi_animacion
```

Verás:
```
Waiting for bootloader...
```

### Paso 5.3: Activar bootloader

**Mientras dice "Waiting for bootloader"**:
1. **Conecta** el cable USB al teclado
2. **Presiona** el botón de reset (o corto-circuito los pines RST y GND)
3. El teclado entrará en modo bootloader

El proceso continuará automáticamente:
```
*** DFU device connected
*** Programming
*** DFU device disconnected
*** Done!
```

## 6️⃣ ¡Listo! Verificar

1. El teclado se reiniciará automáticamente
2. Deberías ver **tu animación** en las pantallas OLED
3. La animación se repite en loop (4 frames, 400ms cada uno)

## 🔧 Troubleshooting

### Error: "region 'progmem' overflowed"

Tu firmware es muy grande. Soluciones:

1. **Activa LTO** en `rules.mk`:
   ```make
   LTO_ENABLE = yes
   ```

2. **Desactiva features**:
   ```make
   MOUSEKEY_ENABLE = no
   CONSOLE_ENABLE = no
   COMMAND_ENABLE = no
   RGB_MATRIX_ENABLE = no  # Si no usas RGB
   ```

3. **Reduce frames** de la animación (usa un GIF con menos frames)

### Error: "oled_display.h: No such file"

Asegúrate de tener:
```make
# rules.mk
OLED_ENABLE = yes
```

### OLED muestra la animación al revés

Cambia la rotación en `keymap.c`:
```c
oled_rotation_t oled_init_user(oled_rotation_t rotation) {
    return OLED_ROTATION_180;  // O 270, o 90
}
```

### Animación muy lenta/rápida

Edita `king_oled_anim.h`:
```c
#define ANIM_FRAME_DURATION 100  // Prueba valores entre 50-500ms
```

Y recompila.

### El teclado no entra en bootloader

Métodos según tu Corne:

1. **V3/V4**: Doble-tap en el botón de reset
2. **V2**: Corto-circuito RST y GND con un clip
3. **Elite-C**: Presiona el botón pequeño en el controlador
4. **Pro Micro**: Corto-circuito los pines RST y GND rápidamente 2 veces

### Solo se ve en una pantalla

El Corne tiene 2 pantallas (izquierda y derecha). Por defecto la animación se muestra en ambas. Si quieres diferentes animaciones:

```c
bool oled_task_user(void) {
    if (timer_elapsed32(anim_timer) > ANIM_FRAME_DURATION) {
        anim_timer = timer_read32();
        
        // Alternar según mitad del teclado
        if (is_keyboard_left()) {
            oled_write_raw_P(custom_animation[current_frame], OLED_SIZE);
        } else {
            // Aquí puedes mostrar otra cosa
            oled_write_P(PSTR("Layer Info\nhere"), false);
        }
        
        current_frame = (current_frame + 1) % ANIM_FRAME_COUNT;
    }
    return false;
}
```

## 🎨 Próximos Pasos

Ahora que tienes tu animación funcionando, puedes:

1. **Crear más animaciones** con diferentes GIFs
2. **Animaciones por capa**: Muestra diferente animación según la capa activa
3. **Animación al escribir**: Solo anima cuando presionas teclas
4. **Split screen**: Diferentes animaciones en cada mitad

Consulta `docs/ANIMATION_EXAMPLES.md` para más ejemplos avanzados.

## 📚 Recursos

- [QMK Documentation](https://docs.qmk.fm/)
- [Corne Keyboard Guide](https://github.com/foostan/crkbd)
- [OLED Driver Documentation](https://docs.qmk.fm/#/feature_oled_driver)
- [Corne CLI Animated GIF Guide](../docs/ANIMATED_GIF_SUPPORT.md)

## 💡 Comandos Útiles

```powershell
# Recompilar y flashear en un comando
qmk flash -kb crkbd -km mi_animacion

# Ver el tamaño del firmware
qmk compile -kb crkbd -km mi_animacion

# Limpiar archivos compilados
qmk clean

# Listar todos los keymaps disponibles
qmk list-keymaps -kb crkbd
```

---

¿Problemas? Abre un issue en el repositorio con:
- Versión de QMK: `qmk --version`
- Tipo de controlador (Pro Micro, Elite-C, etc.)
- Mensaje de error completo
