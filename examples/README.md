# 📦 Carpeta Examples - Corne CLI

Esta carpeta contiene todo lo necesario para configurar tu teclado Corne con la animación generada.

## 📂 Contenido

### 🎬 Animación Generada
| Archivo | Descripción |
|---------|-------------|
| [`king.gif`](king.gif) | Imagen mascota del proyecto (Kings and Pigs by Pixelfrog Assets) |
| [`king_oled_anim.h`](king_oled_anim.h) | Código QMK generado con la animación |

### 📝 Archivos de Configuración
| Archivo | Descripción |
|---------|-------------|
| [`keymap_example.c`](keymap_example.c) | Keymap completo con animación integrada |
| [`config.h`](config.h) | Configuración OLED (brillo, timeout, rotación) |
| [`rules.mk`](rules.mk) | Opciones de compilación optimizadas |

### 🛠️ Scripts de Automatización
| Script | Propósito |
|--------|-----------|
| [`setup-qmk.ps1`](setup-qmk.ps1) | 🚀 Instalación completa (QMK + animación) |
| [`backup-corne.ps1`](backup-corne.ps1) | 💾 Backup de configuración actual |
| [`restore-corne.ps1`](restore-corne.ps1) | 🔄 Restaurar backup previo |

### 📖 Documentación
| Guía | Contenido |
|------|-----------|
| [`SETUP_GUIDE.md`](SETUP_GUIDE.md) | 📘 Instalación paso a paso completa |
| [`BACKUP_RESTORE.md`](BACKUP_RESTORE.md) | 💾 Sistema de backup detallado |
| [`README_BACKUP.md`](README_BACKUP.md) | 🛡️ Guía rápida de scripts de backup |

---

## 🚀 Inicio Rápido

### Opción 1: Automático (Recomendado)

```powershell
# 1. Hacer backup (opcional pero recomendado)
.\backup-corne.ps1 -KeymapName default

# 2. Instalar todo automáticamente
.\setup-qmk.ps1

# 3. Flashear al teclado
# El script te dirá cómo hacer esto
```

**Tiempo estimado**: 5-10 minutos

---

### Opción 2: Manual

Sigue la guía paso a paso: [`SETUP_GUIDE.md`](SETUP_GUIDE.md)

---

## 📖 Documentación por Tarea

### 🎯 Quiero... Ver la animación en mi teclado
➡️ [`SETUP_GUIDE.md`](SETUP_GUIDE.md)

### 🎯 Quiero... Hacer backup antes de cambios
➡️ [`README_BACKUP.md`](README_BACKUP.md) → `.\backup-corne.ps1`

### 🎯 Quiero... Restaurar mi configuración anterior
➡️ [`README_BACKUP.md`](README_BACKUP.md) → `.\restore-corne.ps1`

### 🎯 Quiero... Entender el sistema de backup
➡️ [`BACKUP_RESTORE.md`](BACKUP_RESTORE.md)

### 🎯 Quiero... Crear más animaciones
➡️ [`../docs/ANIMATED_GIF_SUPPORT.md`](../docs/ANIMATED_GIF_SUPPORT.md)

### 🎯 Quiero... Ejemplos avanzados (WPM, capas)
➡️ [`../docs/ANIMATION_EXAMPLES.md`](../docs/ANIMATION_EXAMPLES.md)

---

## 🎬 ¿Qué hace la animación?

La imagen del rey ([`king.gif`](king.gif)):
- ✅ Mascota del proyecto
- ✅ Pixel art adaptado para pantallas OLED
- ✅ 128x32 pixels (tamaño perfecto para Corne)
- ✅ Ocupa ~2KB de memoria
- 🎨 Imagen de [Kings and Pigs](https://pixelfrog-assets.itch.io/kings-and-pigs) by Pixelfrog Assets

### Vista Previa del Código Generado

```c
// king_oled_anim.h
#define ANIM_FRAME_DURATION 400
#define ANIM_FRAME_COUNT 4
#define OLED_SIZE 512

static const char PROGMEM custom_animation[4][512] = {
    // Frame 1, 2, 3, 4...
};
```

---

## 🛡️ Sistema de Backup

### ¿Por qué hacer backup?

- ✅ Volver atrás si algo sale mal
- ✅ Probar configuraciones sin miedo
- ✅ Mantener múltiples versiones
- ✅ Recuperación rápida

### Scripts Disponibles

```powershell
# Crear backup
.\backup-corne.ps1 -KeymapName mi_keymap

# Ver backups guardados
.\backup-corne.ps1 -List

# Restaurar
.\restore-corne.ps1

# Restauración rápida (desde .hex)
.\restore-corne.ps1 -FlashOnly
```

Más info: [`README_BACKUP.md`](README_BACKUP.md)

---

## 📋 Requisitos del Sistema

### Software
- **Python 3.7+** - [Descargar](https://www.python.org/downloads/)
- **Git** - [Descargar](https://git-scm.com/download/win)
- **QMK MSYS** (Windows) - [Descargar](https://msys.qmk.fm/) ⚠️ **REQUERIDO EN WINDOWS**
- **QMK CLI** - Se instala con QMK MSYS o manualmente

💡 **Usuarios de Windows**: Ver [WINDOWS_INSTALL.md](WINDOWS_INSTALL.md) para instalación correcta

### Hardware
- **Teclado Corne** (crkbd) con pantallas OLED 128x32
- **Cable USB** funcional
- **Controlador compatible**: Pro Micro, Elite-C, nice!nano, etc.

---

## 💡 Flujo de Trabajo Recomendado

```
1️⃣ Backup
   ├─ .\backup-corne.ps1
   └─ Guarda configuración actual
   
2️⃣ Setup
   ├─ .\setup-qmk.ps1
   ├─ Instala QMK
   ├─ Crea keymap
   └─ Compila firmware
   
3️⃣ Flash
   ├─ qmk flash -kb crkbd -km mi_animacion
   └─ Flashea al teclado
   
4️⃣ (Opcional) Restaurar
   └─ .\restore-corne.ps1
```

---

## ⚠️ Troubleshooting Rápido

### Error: Scripts de PowerShell bloqueados

```powershell
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```

### Error: QMK no encontrado

```powershell
python -m pip install --user qmk
qmk setup
```

### Error: Firmware muy grande

Edita [`rules.mk`](rules.mk):
```make
LTO_ENABLE = yes          # Optimización
MOUSEKEY_ENABLE = no      # Desactivar features
CONSOLE_ENABLE = no
```

### Animación se ve mal

Ajusta en [`king_oled_anim.h`](king_oled_anim.h):
```c
#define ANIM_FRAME_DURATION 100  // Cambiar velocidad
```

O rotación en [`config.h`](config.h):
```c
#define OLED_ROTATION OLED_ROTATION_180
```

---

## 🎓 Próximos Pasos

Una vez que tengas tu animación funcionando:

1. **Crear más GIFs**: `corne-cli oled generate otro-gif.gif`
2. **Personalizar keymap**: Edita [`keymap_example.c`](keymap_example.c)
3. **Animaciones por capa**: Ver [`ANIMATION_EXAMPLES.md`](../docs/ANIMATION_EXAMPLES.md)
4. **WPM visualizer**: Animaciones según velocidad de escritura
5. **Split screen**: Diferentes animaciones en cada mitad

---

## 🔗 Enlaces Útiles

- [QMK Documentation](https://docs.qmk.fm/)
- [Corne Keyboard GitHub](https://github.com/foostan/crkbd)
- [OLED Driver QMK](https://docs.qmk.fm/#/feature_oled_driver)
- [Corne CLI Main Docs](../README.md)

---

## 🆘 Ayuda

Si encuentras problemas:

1. **Revisa SETUP_GUIDE.md** - Troubleshooting completo
2. **Verifica backups**: `.\backup-corne.ps1 -List`
3. **Restaura al default**: `qmk flash -kb crkbd -km default`
4. **Abre un issue** en el repositorio

---

¡Todo listo para personalizar tu Corne! 🚀
