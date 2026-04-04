# QMK Setup for macOS

Guía completa para instalar QMK Firmware en macOS y compilar firmware para tu Corne keyboard.

## 📋 Requisitos previos

- macOS 10.15 (Catalina) o superior
- Homebrew instalado
- Conexión a internet

## 🚀 Instalación paso a paso

### 1. Instalar Homebrew (si no lo tenés)
cp ~/qmk_firmware/crkbd_rev1_mi_corne_sparkfun_pm2040.uf2 /Volumes/RPI-RP2/             
```bash
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
```

### 2. Instalar dependencias necesarias

```bash
# Instalar herramientas de compilación
brew install git python3

# Instalar QMK CLI
python3 -m pip install --user qmk

# O si preferís usar brew:
brew install qmk/qmk/qmk
```

### 3. Configurar QMK

```bash
# Inicializar QMK (descarga el repositorio ~500MB)
qmk setup

# Durante la instalación te preguntará:
# "Would you like to clone qmk/qmk_firmware to /Users/tu-usuario/qmk_firmware? [y/n]"
# Responde: y

# Verificar instalación
qmk doctor
```

### 4. Instalar herramientas de flasheo

```bash
# Para RP2040 (Pro Micro RP2040)
# No necesita nada extra, usa UF2

# Para otros bootloaders:
brew install --cask qmk-toolbox

# Herramientas de línea de comandos
brew install avrdude dfu-util dfu-programmer
```

## ⚙️ Configuración del teclado Corne

### 1. Crear tu keymap personalizado

```bash
# Ir al directorio de QMK
cd ~/qmk_firmware

# Crear un nuevo keymap basado en el default
qmk new-keymap -kb crkbd/rev1 -km mi_corne

# Esto crea:
# ~/qmk_firmware/keyboards/crkbd/keymaps/mi_corne/
```

### 2. Agregar los archivos generados por corne-cli

```bash
# Si generaste animaciones con corne-cli oled layers:
cp layer_animation.h ~/qmk_firmware/keyboards/crkbd/keymaps/mi_corne/
cp layer_animation_rules.mk ~/qmk_firmware/keyboards/crkbd/keymaps/mi_corne/

# Agregar contenido de rules.mk
cat layer_animation_rules.mk >> ~/qmk_firmware/keyboards/crkbd/keymaps/mi_corne/rules.mk
```

### 3. Editar keymap.c

```bash
# Editar con tu editor favorito
code ~/qmk_firmware/keyboards/crkbd/keymaps/mi_corne/keymap.c
# O
vim ~/qmk_firmware/keyboards/crkbd/keymaps/mi_corne/keymap.c
```

Agregar al inicio del archivo:
```c
#include "layer_animation.h"
```

Agregar la función OLED:
```c
#ifdef OLED_ENABLE
bool oled_task_user(void) {
    if (is_keyboard_master()) {
        render_layer_animation();
    } else {
        // Contenido para el otro OLED
        oled_write_P(PSTR("Layer\n"), false);
    }
    return false;
}
#endif
```

## 🔨 Compilación

### Opción 1: Compilar para RP2040 (Pro Micro RP2040)

```bash
# Compilar
qmk compile -kb crkbd/rev1 -km mi_corne -e CONVERT_TO=promicro_rp2040

# El archivo .uf2 estará en:
# ~/qmk_firmware/crkbd_rev1_mi_corne_promicro_rp2040.uf2
```

### Opción 2: Compilar para Pro Micro original (ATmega32U4)

```bash
qmk compile -kb crkbd/rev1 -km mi_corne
```

### Opción 3: Compilar para Elite-C

```bash
qmk compile -kb crkbd/rev1 -km mi_corne -e CONVERT_TO=elite_c
```

## 📲 Flashear el firmware

### Para RP2040 (UF2 Bootloader)

**Lado izquierdo:**
1. Desconectar el cable USB
2. Mantener presionado el botón RESET/BOOT
3. Conectar el cable USB
4. Soltar el botón - aparecerá un drive "RPI-RP2"
5. Copiar el archivo .uf2:
   ```bash
   cp ~/qmk_firmware/*.uf2 /Volumes/RPI-RP2/
   ```
6. El teclado se reiniciará automáticamente

**Lado derecho:**
1. Conectar ambos lados con el cable TRRS
2. Repetir el proceso en el lado derecho

### Para Pro Micro / Elite-C (Caterina bootloader)

```bash
# Flashear directamente
qmk flash -kb crkbd/rev1 -km mi_corne

# Presiona reset cuando se indique
```

### Usando QMK Toolbox (GUI)

1. Abrir QMK Toolbox
2. Seleccionar el archivo .hex o .uf2
3. Presionar el botón RESET en el teclado
4. Click en "Flash"

## 🔍 Troubleshooting

### Error: "qmk: command not found"

```bash
# Agregar Python bin al PATH
echo 'export PATH="$HOME/Library/Python/3.x/bin:$PATH"' >> ~/.zshrc
source ~/.zshrc

# O reinstalar con brew
brew install qmk/qmk/qmk
```

### Error: "avr-gcc not found"

```bash
brew tap osx-cross/avr
brew install avr-gcc
```

### Error de permisos en /dev/tty

```bash
# Agregar tu usuario al grupo dialout (equivalente en macOS)
sudo dscl . -append /Groups/_lpadmin GroupMembership $(whoami)
```

### El OLED no muestra animaciones

1. Verificar que OLED_ENABLE esté en rules.mk
2. Verificar que el header esté incluido en keymap.c
3. Revisar el tamaño del firmware (no debe exceder el límite)

### Firmware muy grande

```bash
# Ver tamaño actual
qmk compile -kb crkbd/rev1 -km mi_corne --verbose

# Reducir features en rules.mk:
# CONSOLE_ENABLE = no
# COMMAND_ENABLE = no
# MOUSEKEY_ENABLE = no
```

## 📚 Recursos adicionales

- **QMK Docs:** https://docs.qmk.fm/
- **Corne Guide:** https://github.com/foostan/crkbd
- **QMK Discord:** https://discord.gg/Uq7gcHh
- **corne-cli docs:** Ver las guías en docs/

## 🎯 Comandos útiles

```bash
# Ver información del teclado
qmk list-keymaps -kb crkbd/rev1

# Limpiar build
qmk clean

# Ver configuración
qmk config

# Actualizar QMK
qmk git-submodule

# Compilar con verbose
qmk compile -kb crkbd/rev1 -km mi_corne -v
```

## 🔄 Workflow típico

```bash
# 1. Generar animaciones con corne-cli
corne-cli oled layers

# 2. Copiar archivos al keymap
cp layer_animation.h ~/qmk_firmware/keyboards/crkbd/keymaps/mi_corne/

# 3. Editar keymap.c (agregar include y función OLED)
code ~/qmk_firmware/keyboards/crkbd/keymaps/mi_corne/keymap.c

# 4. Compilar
qmk compile -kb crkbd/rev1 -km mi_corne -e CONVERT_TO=promicro_rp2040

# 5. Flashear
cp ~/qmk_firmware/*.uf2 /Volumes/RPI-RP2/

# 6. Repetir para el otro lado
```

---

**¡Listo!** Ahora tenés QMK instalado y configurado en macOS. 🎉
