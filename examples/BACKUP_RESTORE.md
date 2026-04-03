# 💾 Guía de Backup y Restauración del Teclado Corne

Esta guía te ayudará a hacer un backup completo de tu configuración actual antes de flashear la animación.

## 🎯 ¿Por qué hacer backup?

- ✅ Volver a tu configuración anterior si no te gusta la animación
- ✅ Recuperarte de errores de compilación
- ✅ Experimentar sin miedo
- ✅ Guardar múltiples configuraciones

## 📋 Métodos de Backup

### Método 1: Backup del Keymap Original (Recomendado)

Este método guarda el código fuente de tu keymap actual para poder recompilarlo.

#### Paso 1: Identificar tu keymap actual

```powershell
# Listar todos los keymaps disponibles para Corne
qmk list-keymaps -kb crkbd
```

Ejemplo de salida:
```
Available keymaps for crkbd:
- default
- via
- colemak
- mi_keymap  ← Tu keymap actual
```

#### Paso 2: Hacer backup del directorio

```powershell
# Crear carpeta de backups
mkdir C:\Users\TuUsuario\corne-backups

# Copiar tu keymap actual
$fecha = Get-Date -Format "yyyy-MM-dd"
$qmkPath = "$env:USERPROFILE\qmk_firmware"
$keymapActual = "mi_keymap"  # Cambia esto por tu keymap

# Backup completo
Copy-Item "$qmkPath\keyboards\crkbd\keymaps\$keymapActual" `
          "C:\Users\$env:USERNAME\corne-backups\backup_${keymapActual}_$fecha" `
          -Recurse -Force

Write-Host "✓ Backup guardado en: C:\Users\$env:USERNAME\corne-backups\backup_${keymapActual}_$fecha"
```

#### Paso 3: Compilar y guardar el .hex

```powershell
# Compilar el firmware actual
qmk compile -kb crkbd -km $keymapActual

# El archivo .hex estará en:
# C:\Users\TuUsuario\qmk_firmware\.build\

# Copiar el .hex al backup
Copy-Item "$qmkPath\.build\crkbd_rev1_${keymapActual}.hex" `
          "C:\Users\$env:USERNAME\corne-backups\backup_${keymapActual}_$fecha.hex"

Write-Host "✓ Archivo .hex guardado"
```

### Método 2: Backup Usando el Keymap Default

Si estás usando el keymap default de QMK (sin modificaciones):

```powershell
# QMK siempre mantiene el keymap default
# Solo necesitas recordar qué keymap usabas

# Para verificar:
qmk list-keymaps -kb crkbd
```

Para restaurar, simplemente flashea el default:
```powershell
qmk flash -kb crkbd -km default
```

### Método 3: Leer Firmware desde el Teclado (Avanzado)

⚠️ **Nota**: Leer firmware directamente del microcontrolador es complejo y no siempre posible.

Para **Pro Micro** (ATmega32U4):

```powershell
# Instalar avrdude si no lo tienes
# avrdude viene con QMK

# Intentar leer firmware (puede no funcionar con bootloaders protegidos)
avrdude -p atmega32u4 -c avr109 -P COM3 -U flash:r:backup.hex:i

# Nota: Cambia COM3 por tu puerto serial
```

**Limitaciones**:
- Muchos bootloaders tienen protección de lectura
- Solo funciona en modo bootloader
- No todos los microcontroladores soportan lectura

## 🔄 Restaurar desde Backup

### Opción A: Desde código fuente (Recomendado)

```powershell
# 1. Copiar el backup de vuelta
$backupDir = "C:\Users\$env:USERNAME\corne-backups\backup_mi_keymap_2026-04-01"
$qmkPath = "$env:USERPROFILE\qmk_firmware"

Copy-Item $backupDir `
          "$qmkPath\keyboards\crkbd\keymaps\mi_keymap_restore" `
          -Recurse -Force

# 2. Compilar
qmk compile -kb crkbd -km mi_keymap_restore

# 3. Flashear
qmk flash -kb crkbd -km mi_keymap_restore
```

### Opción B: Desde archivo .hex

```powershell
# Flashear directamente el archivo .hex guardado
qmk flash -kb crkbd -km default `
    -x "C:\Users\$env:USERNAME\corne-backups\backup_mi_keymap_2026-04-01.hex"
```

O manualmente:

```powershell
# Para Caterina (Pro Micro)
avrdude -p atmega32u4 -c avr109 -P COM3 -U flash:w:backup.hex:i

# Para DFU
dfu-programmer atmega32u4 erase
dfu-programmer atmega32u4 flash backup.hex
dfu-programmer atmega32u4 reset
```

## 🛡️ Backup de Emergencia: Factory Reset

Si todo falla, puedes volver al firmware de fábrica del Corne:

### Para Corne V3/V4

```powershell
# Descargar firmware oficial
# Visita: https://github.com/foostan/crkbd/releases

# O compilar el default de QMK
qmk flash -kb crkbd -km default
```

## 📝 Script Automático de Backup

Guarda este script como `backup-corne.ps1`:

```powershell
# backup-corne.ps1
param(
    [string]$KeymapName = "default",
    [string]$BackupDir = "$env:USERPROFILE\corne-backups"
)

$fecha = Get-Date -Format "yyyy-MM-dd_HHmmss"
$qmkPath = "$env:USERPROFILE\qmk_firmware"
$backupPath = "$BackupDir\backup_${KeymapName}_$fecha"

Write-Host "💾 Creando backup del keymap: $KeymapName" -ForegroundColor Cyan

# Crear directorio de backup
New-Item -ItemType Directory -Path $backupPath -Force | Out-Null

# Copiar keymap
if (Test-Path "$qmkPath\keyboards\crkbd\keymaps\$KeymapName") {
    Copy-Item "$qmkPath\keyboards\crkbd\keymaps\$KeymapName\*" `
              $backupPath -Recurse -Force
    Write-Host "✓ Keymap guardado" -ForegroundColor Green
} else {
    Write-Host "❌ Keymap no encontrado: $KeymapName" -ForegroundColor Red
    exit 1
}

# Compilar y guardar .hex
Write-Host "🔨 Compilando firmware..." -ForegroundColor Yellow
qmk compile -kb crkbd -km $KeymapName

if ($LASTEXITCODE -eq 0) {
    # Buscar el archivo .hex
    $hexFile = Get-ChildItem "$qmkPath\.build\crkbd_*_$KeymapName.hex" | Select-Object -First 1
    
    if ($hexFile) {
        Copy-Item $hexFile.FullName "$backupPath.hex"
        Write-Host "✓ Firmware .hex guardado" -ForegroundColor Green
    }
}

# Crear README con información
$readmeContent = @"
# Backup del Keymap: $KeymapName
Fecha: $fecha
Keyboard: Corne (crkbd)

## Restaurar

### Desde código fuente:
``````powershell
Copy-Item "$backupPath" \`
          "$qmkPath\keyboards\crkbd\keymaps\${KeymapName}_restore" -Recurse
qmk flash -kb crkbd -km ${KeymapName}_restore
``````

### Desde .hex:
``````powershell
qmk flash -kb crkbd -x "$backupPath.hex"
``````
"@

$readmeContent | Out-File "$backupPath\README.md" -Encoding UTF8

Write-Host "`n✅ Backup completado:" -ForegroundColor Green
Write-Host "   📁 Código: $backupPath" -ForegroundColor Cyan
Write-Host "   💾 Firmware: $backupPath.hex" -ForegroundColor Cyan
Write-Host "`n📖 Ver instrucciones: $backupPath\README.md"
```

**Uso del script**:
```powershell
# Backup del keymap default
.\backup-corne.ps1 -KeymapName default

# Backup de tu keymap personalizado
.\backup-corne.ps1 -KeymapName mi_keymap
```

## ⚡ Workflow Recomendado

### Antes de cada cambio:

```powershell
# 1. Hacer backup
.\backup-corne.ps1 -KeymapName mi_keymap_actual

# 2. Crear nuevo keymap para experimentar
qmk new-keymap -kb crkbd -km experimental

# 3. Modificar y probar
# ... editar archivos ...

# 4. Flashear
qmk flash -kb crkbd -km experimental

# 5. Si funciona bien, adoptarlo como principal
# Si no, restaurar el backup
```

## 🗂️ Organización de Backups

Estructura recomendada:

```
C:\Users\TuUsuario\corne-backups\
├── backup_default_2026-04-01/
│   ├── keymap.c
│   ├── config.h
│   ├── rules.mk
│   └── README.md
├── backup_default_2026-04-01.hex
├── backup_mi_keymap_2026-03-15/
│   └── ...
└── backup_animacion_2026-04-01/
    └── ...
```

## 🔍 Verificar Backup

Antes de hacer cambios, verifica que tu backup es válido:

```powershell
# Verificar que el directorio existe y tiene archivos
Get-ChildItem "C:\Users\$env:USERNAME\corne-backups" -Recurse

# Intentar compilar el backup
$backupKeymap = "backup_test"
Copy-Item "C:\Users\$env:USERNAME\corne-backups\backup_mi_keymap_2026-04-01" `
          "$env:USERPROFILE\qmk_firmware\keyboards\crkbd\keymaps\$backupKeymap" -Recurse

qmk compile -kb crkbd -km $backupKeymap

# Si compila sin errores, el backup es válido ✓
```

## 🆘 Problemas Comunes

### "No sé qué keymap estoy usando"

```powershell
# Ver los keymaps modificados recientemente
Get-ChildItem "$env:USERPROFILE\qmk_firmware\keyboards\crkbd\keymaps" | 
    Sort-Object LastWriteTime -Descending | 
    Select-Object Name, LastWriteTime -First 5
```

### "Perdí todos mis archivos"

- Si usas Git en QMK: `git reflog` puede ayudar
- Buscar archivos temporales: `qmk_firmware\.build`
- Revisar papelera de reciclaje

### "No puedo flashear el backup"

Prueba:
1. Flashear el keymap `default` primero
2. Verificar conexión USB
3. Reintentar entrando en bootloader manualmente
4. Usar el script de setup-qmk.ps1 para reconstruir todo

## 📚 Recursos Adicionales

- [QMK Docs: Flashing](https://docs.qmk.fm/#/newbs_flashing)
- [Corne Build Guide](https://github.com/foostan/crkbd/blob/main/corne-cherry/doc/v3/buildguide_en.md)
- [QMK Configurator](https://config.qmk.fm/) - Backup en la nube

## ✅ Checklist de Seguridad

Antes de flashear:

- [ ] Backup del keymap actual creado
- [ ] Archivo .hex compilado y guardado
- [ ] Backup verificado (compila sin errores)
- [ ] Conoces cómo entrar en bootloader
- [ ] Tienes cable USB de respaldo (por si acaso)
- [ ] Sabes restaurar al keymap default

¡Ahora estás listo para experimentar sin miedo! 🚀
