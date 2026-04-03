# Script de backup automático para teclado Corne
# Guarda el keymap actual y compila el firmware .hex

param(
    [Parameter(Mandatory=$false)]
    [string]$KeymapName = "default",
    
    [Parameter(Mandatory=$false)]
    [string]$BackupDir = "$env:USERPROFILE\corne-backups",
    
    [Parameter(Mandatory=$false)]
    [switch]$SkipCompile,
    
    [Parameter(Mandatory=$false)]
    [switch]$List
)

# Colores
function Write-Success { param($msg) Write-Host "✓ $msg" -ForegroundColor Green }
function Write-Error-Msg { param($msg) Write-Host "✗ $msg" -ForegroundColor Red }
function Write-Info { param($msg) Write-Host "ℹ $msg" -ForegroundColor Cyan }
function Write-Warning-Msg { param($msg) Write-Host "⚠ $msg" -ForegroundColor Yellow }

Write-Host "`n💾 Backup de Teclado Corne" -ForegroundColor Cyan
Write-Host ("=" * 60) -ForegroundColor Cyan

# Listar backups existentes
if ($List) {
    Write-Info "Backups disponibles en: $BackupDir`n"
    
    if (Test-Path $BackupDir) {
        $backups = Get-ChildItem $BackupDir -Directory | Sort-Object LastWriteTime -Descending
        
        if ($backups.Count -eq 0) {
            Write-Warning-Msg "No hay backups guardados"
        } else {
            $backups | ForEach-Object {
                $size = (Get-ChildItem $_.FullName -Recurse | Measure-Object -Property Length -Sum).Sum / 1KB
                Write-Host "  📁 $($_.Name)" -ForegroundColor Yellow
                Write-Host "     Fecha: $($_.LastWriteTime)" -ForegroundColor Gray
                Write-Host "     Tamaño: $([math]::Round($size, 2)) KB" -ForegroundColor Gray
                
                # Verificar si existe .hex
                $hexFile = "$BackupDir\$($_.Name).hex"
                if (Test-Path $hexFile) {
                    Write-Host "     ✓ Firmware .hex disponible" -ForegroundColor Green
                }
                Write-Host ""
            }
        }
    } else {
        Write-Warning-Msg "Directorio de backups no existe: $BackupDir"
    }
    
    exit 0
}

# Validar QMK
$qmkPath = "$env:USERPROFILE\qmk_firmware"

if (-not (Test-Path $qmkPath)) {
    Write-Error-Msg "QMK firmware no encontrado en: $qmkPath"
    Write-Info "Ejecuta: qmk setup"
    exit 1
}

$keymapPath = "$qmkPath\keyboards\crkbd\keymaps\$KeymapName"

if (-not (Test-Path $keymapPath)) {
    Write-Error-Msg "Keymap no encontrado: $KeymapName"
    Write-Info "Keymaps disponibles:"
    
    $available = Get-ChildItem "$qmkPath\keyboards\crkbd\keymaps" -Directory | Select-Object -ExpandProperty Name
    $available | ForEach-Object { Write-Host "  - $_" -ForegroundColor Yellow }
    
    exit 1
}

# Crear timestamp
$fecha = Get-Date -Format "yyyy-MM-dd_HHmmss"
$backupPath = "$BackupDir\backup_${KeymapName}_$fecha"

Write-Info "Keymap: $KeymapName"
Write-Info "Destino: $backupPath`n"

# Crear directorio de backup
try {
    New-Item -ItemType Directory -Path $backupPath -Force | Out-Null
    Write-Success "Directorio de backup creado"
} catch {
    Write-Error-Msg "Error creando directorio: $_"
    exit 1
}

# Copiar archivos del keymap
try {
    Copy-Item "$keymapPath\*" $backupPath -Recurse -Force
    
    $fileCount = (Get-ChildItem $backupPath -Recurse -File).Count
    Write-Success "Archivos copiados: $fileCount"
    
    # Listar archivos principales
    $mainFiles = Get-ChildItem $backupPath -File | Select-Object -ExpandProperty Name
    $mainFiles | ForEach-Object { Write-Host "  - $_" -ForegroundColor Gray }
    
} catch {
    Write-Error-Msg "Error copiando archivos: $_"
    exit 1
}

# Compilar firmware
if (-not $SkipCompile) {
    Write-Host "`n🔨 Compilando firmware..." -ForegroundColor Yellow
    
    $compileOutput = qmk compile -kb crkbd -km $KeymapName 2>&1
    
    if ($LASTEXITCODE -eq 0) {
        Write-Success "Firmware compilado exitosamente"
        
        # Buscar archivo .hex
        $hexFiles = Get-ChildItem "$qmkPath\.build" -Filter "crkbd_*_$KeymapName.hex" -ErrorAction SilentlyContinue
        
        if ($hexFiles) {
            $hexFile = $hexFiles | Select-Object -First 1
            $hexDestination = "$backupPath.hex"
            
            Copy-Item $hexFile.FullName $hexDestination -Force
            
            $hexSize = [math]::Round((Get-Item $hexDestination).Length / 1KB, 2)
            Write-Success "Firmware .hex guardado ($hexSize KB)"
            Write-Info "Ubicación: $hexDestination"
        } else {
            Write-Warning-Msg "Archivo .hex no encontrado en .build"
        }
        
        # Mostrar tamaño del firmware
        $sizeInfo = $compileOutput | Select-String "bytes used"
        if ($sizeInfo) {
            Write-Host "`n  📊 $sizeInfo" -ForegroundColor Cyan
        }
        
    } else {
        Write-Warning-Msg "Error compilando firmware"
        Write-Host $compileOutput -ForegroundColor Red
        Write-Info "Backup de código guardado, pero sin .hex"
    }
}

# Crear README con instrucciones
$readmeContent = @"
# Backup del Keymap: $KeymapName

**Fecha de creación**: $fecha  
**Keyboard**: Corne (crkbd)  
**QMK Path**: $qmkPath

## 📁 Contenido

Este backup incluye:
- Código fuente del keymap (keymap.c, config.h, rules.mk, etc.)
$(if (-not $SkipCompile) { "- Firmware compilado (.hex)" } else { "- Firmware NO compilado (usa -SkipCompile)" })

## 🔄 Restaurar desde Código Fuente

``````powershell
# 1. Copiar de vuelta a QMK
`$restoreName = "${KeymapName}_restore"
Copy-Item "$backupPath" \`
          "$qmkPath\keyboards\crkbd\keymaps\`$restoreName" \`
          -Recurse -Force

# 2. Compilar
qmk compile -kb crkbd -km `$restoreName

# 3. Flashear al teclado
qmk flash -kb crkbd -km `$restoreName
``````

## ⚡ Restaurar desde .hex (Rápido)

``````powershell
# Flashear directamente el archivo .hex
qmk flash -kb crkbd -x "$backupPath.hex"
``````

**O manualmente**:

``````powershell
# Para Caterina (Pro Micro)
avrdude -p atmega32u4 -c avr109 -P COM3 \`
        -U flash:w:"$backupPath.hex":i

# Para DFU
dfu-programmer atmega32u4 erase
dfu-programmer atmega32u4 flash "$backupPath.hex"
dfu-programmer atmega32u4 reset
``````

## 📝 Información del Keymap

$(
Get-ChildItem $backupPath -File | ForEach-Object {
    "- **$($_.Name)** ($([math]::Round($_.Length / 1KB, 2)) KB)"
}
)

## 🔍 Verificar Backup

``````powershell
# Intentar compilar para verificar integridad
Copy-Item "$backupPath" \`
          "$qmkPath\keyboards\crkbd\keymaps\backup_test" -Recurse
qmk compile -kb crkbd -km backup_test
``````

---

Creado con: Corne CLI Tool  
Script: backup-corne.ps1
"@

$readmeContent | Out-File "$backupPath\README.md" -Encoding UTF8
Write-Success "Documentación creada: README.md"

# Resumen final
Write-Host "`n" + ("=" * 60) -ForegroundColor Cyan
Write-Host "✅ Backup completado exitosamente" -ForegroundColor Green
Write-Host ("=" * 60) -ForegroundColor Cyan

Write-Host "`n📦 Archivos guardados:" -ForegroundColor Yellow
Write-Host "   📁 Código fuente: $backupPath" -ForegroundColor Cyan

if (-not $SkipCompile -and (Test-Path "$backupPath.hex")) {
    Write-Host "   💾 Firmware .hex:  $backupPath.hex" -ForegroundColor Cyan
}

Write-Host "`n📖 Instrucciones de restauración:" -ForegroundColor Yellow
Write-Host "   Ver: $backupPath\README.md"

Write-Host "`n💡 Comandos útiles:" -ForegroundColor Yellow
Write-Host "   # Ver todos los backups"
Write-Host "   .\backup-corne.ps1 -List" -ForegroundColor Gray
Write-Host ""
Write-Host "   # Restaurar rápido desde .hex"
Write-Host "   qmk flash -kb crkbd -x `"$backupPath.hex`"" -ForegroundColor Gray

Write-Host "`n✨ ¡Listo para hacer cambios con seguridad!" -ForegroundColor Green
