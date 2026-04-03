# 🛡️ Sistema de Backup y Restauración

Sistema completo para proteger tu configuración de teclado antes de hacer cambios.

## 📝 Scripts Disponibles

| Script | Propósito | Uso |
|--------|-----------|-----|
| [`backup-corne.ps1`](backup-corne.ps1) | 💾 Hacer backup del keymap actual | Antes de cambios |
| [`restore-corne.ps1`](restore-corne.ps1) | 🔄 Restaurar un backup previo | Si algo sale mal |
| [`setup-qmk.ps1`](setup-qmk.ps1) | 🚀 Instalar y configurar animación | Setup inicial |

---

## 🚀 Inicio Rápido

### 1️⃣ Hacer Backup (PRIMERO)

```powershell
# Backup automático del keymap actual
.\backup-corne.ps1 -KeymapName default

# Ver todos los backups
.\backup-corne.ps1 -List
```

**Resultado**: Guarda tu configuración en `C:\Users\TuUsuario\corne-backups\`

### 2️⃣ Instalar Animación

```powershell
# Setup completo con la animación del robot
.\setup-qmk.ps1
```

**Resultado**: Instala QMK, crea keymap con animación, compila firmware

### 3️⃣ Restaurar (si es necesario)

```powershell
# Ver backups y elegir uno
.\restore-corne.ps1

# O restaurar uno específico
.\restore-corne.ps1 -BackupPath "C:\Users\TuUsuario\corne-backups\backup_default_2026-04-01"

# O solo flashear el .hex (rápido)
.\restore-corne.ps1 -FlashOnly
```

---

## 📖 Uso Detallado

### backup-corne.ps1

**Crear backup del keymap actual**:
```powershell
.\backup-corne.ps1 -KeymapName mi_keymap
```

**Opciones**:
- `-KeymapName` : Nombre del keymap a respaldar (default: "default")
- `-BackupDir` : Carpeta de destino (default: `$env:USERPROFILE\corne-backups`)
- `-SkipCompile` : No compilar .hex (solo guardar código fuente)
- `-List` : Ver backups existentes

**Ejemplos**:
```powershell
# Backup del default
.\backup-corne.ps1 -KeymapName default

# Backup sin compilar (más rápido)
.\backup-corne.ps1 -KeymapName mi_keymap -SkipCompile

# Ver backups guardados
.\backup-corne.ps1 -List

# Backup a ubicación personalizada
.\backup-corne.ps1 -KeymapName custom -BackupDir "D:\Backups"
```

**Qué guarda**:
- ✅ Código fuente (keymap.c, config.h, rules.mk, headers)
- ✅ Firmware compilado (.hex)
- ✅ README con instrucciones de restauración
- ✅ Metadata (fecha, tamaño, configuración)

---

### restore-corne.ps1

**Restaurar backup anterior**:
```powershell
.\restore-corne.ps1
```

Sin argumentos, muestra lista interactiva de backups.

**Opciones**:
- `-BackupPath` : Ruta al backup específico
- `-List` : Mostrar backups disponibles
- `-FlashOnly` : Solo flashear .hex sin recompilar

**Ejemplos**:
```powershell
# Modo interactivo (recomendado)
.\restore-corne.ps1

# Restaurar backup específico
.\restore-corne.ps1 -BackupPath "C:\Users\Usuario\corne-backups\backup_default_2026-04-01"

# Solo flashear (rápido, usa .hex guardado)
.\restore-corne.ps1 -FlashOnly

# Ver backups
.\restore-corne.ps1 -List
```

**Proceso**:
1. Seleccionas backup de la lista
2. Copia archivos a QMK
3. Compila firmware
4. Pregunta si quieres flashear inmediatamente
5. Flash automático al teclado

---

### setup-qmk.ps1

**Instalación completa de QMK con animación**:
```powershell
.\setup-qmk.ps1
```

**Opciones**:
- `-KeymapName` : Nombre para el nuevo keymap (default: "mi_animacion")
- `-QmkPath` : Ubicación de QMK (default: `$env:USERPROFILE\qmk_firmware`)

**Ejemplos**:
```powershell
# Setup estándar
.\setup-qmk.ps1

# Keymap personalizado
.\setup-qmk.ps1 -KeymapName robot_animation

# QMK en ubicación personalizada
.\setup-qmk.ps1 -QmkPath "D:\QMK\qmk_firmware"
```

**El script automáticamente**:
1. ✅ Detecta keymaps existentes
2. ✅ Ofrece hacer backup (recomendado)
3. ✅ Instala QMK CLI (si necesario)
4. ✅ Descarga QMK firmware (si necesario)
5. ✅ Crea keymap con animación
6. ✅ Copia archivos necesarios
7. ✅ Compila firmware
8. ✅ Muestra instrucciones de flash

---

## 🎯 Workflows Recomendados

### Workflow 1: Primera Vez (Sin QMK instalado)

```powershell
# Paso 1: Setup completo
.\setup-qmk.ps1

# Paso 2: Flashear
qmk flash -kb crkbd -km mi_animacion
```

### Workflow 2: Experimentar (QMK ya instalado)

```powershell
# Paso 1: Backup de configuración actual
.\backup-corne.ps1 -KeymapName mi_keymap_actual

# Paso 2: Instalar nueva animación
.\setup-qmk.ps1 -KeymapName experimental

# Paso 3: Probar
qmk flash -kb crkbd -km experimental

# Paso 4 (opcional): Si no te gusta, restaurar
.\restore-corne.ps1
```

### Workflow 3: Backup Regular

```powershell
# Backup semanal/mensual
.\backup-corne.ps1 -KeymapName production

# Ver historial de backups
.\backup-corne.ps1 -List
```

### Workflow 4: Recuperación de Emergencia

```powershell
# Algo salió mal y necesitas volver rápido
.\restore-corne.ps1 -FlashOnly

# Selecciona el último backup trabajando
# Flash inmediato desde .hex guardado
```

---

## 📁 Estructura de Backups

```
C:\Users\TuUsuario\corne-backups\
│
├── backup_default_2026-04-01_143022/
│   ├── keymap.c
│   ├── config.h
│   ├── rules.mk
│   ├── moco-jump-32x32_oled_anim.h
│   └── README.md
│
├── backup_default_2026-04-01_143022.hex  (firmware compilado)
│
├── backup_mi_keymap_2026-03-15_093045/
│   └── ...
│
└── backup_mi_keymap_2026-03-15_093045.hex
```

Cada backup incluye:
- 📁 **Carpeta**: Código fuente completo
- 💾 **Archivo .hex**: Firmware listo para flashear
- 📖 **README.md**: Instrucciones específicas de restauración

---

## ⚠️ Problemas Comunes

### "No puedo ejecutar scripts de PowerShell"

```powershell
# Habilitar ejecución de scripts (una vez)
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```

### "QMK no encontrado"

El script `setup-qmk.ps1` instala QMK automáticamente. O manualmente:
```powershell
python -m pip install --user qmk
qmk setup
```

### "Keymap no encontrado"

Ver keymaps disponibles:
```powershell
qmk list-keymaps -kb crkbd
```

### "Error compilando después de restaurar"

Puede que el backup tenga dependencias faltantes. Prueba restaurar el keymap `default`:
```powershell
qmk flash -kb crkbd -km default
```

---

## 🆘 Restauración de Emergencia

Si TODO falla y no puedes recuperar:

```powershell
# 1. Reinstalar QMK desde cero
Remove-Item "$env:USERPROFILE\qmk_firmware" -Recurse -Force
qmk setup

# 2. Flashear default
qmk flash -kb crkbd -km default

# 3. Luego restaurar tu backup
.\restore-corne.ps1
```

---

## 📚 Documentación Adicional

- 📖 [SETUP_GUIDE.md](SETUP_GUIDE.md) - Guía completa de instalación
- 💾 [BACKUP_RESTORE.md](BACKUP_RESTORE.md) - Detalles técnicos de backup
- 🎬 [ANIMATION_EXAMPLES.md](../docs/ANIMATION_EXAMPLES.md) - Ejemplos avanzados

---

## ✅ Checklist de Seguridad

Antes de hacer cambios importantes:

- [ ] Backup realizado con `.\backup-corne.ps1`
- [ ] Backup verificado con `.\backup-corne.ps1 -List`
- [ ] Sabes cómo restaurar: `.\restore-corne.ps1`
- [ ] Conoces el bootloader de tu teclado
- [ ] Tienes el cable USB funcionando

---

## 💡 Tips

- **Backup frecuente**: Haz backup antes de cada cambio importante
- **Nombres descriptivos**: Usa `-KeymapName` con nombres claros
- **Mantén backups**: No borres backups antiguos que funcionen bien
- **Prueba restauración**: Verifica que tus backups funcionan (úsalos en test)
- **Git opcional**: Considera versionar tus keymaps con Git para historial completo

¡Ahora puedes experimentar sin miedo! 🚀
