# Script de instalación automática para configurar QMK con la animación
# Uso: .\setup-qmk.ps1

param(
    [string]$KeymapName = "mi_animacion",
    [string]$QmkPath = "$env:USERPROFILE\qmk_firmware"
)

Write-Host "🚀 Configuración automática de QMK con animación OLED" -ForegroundColor Cyan
Write-Host "=" * 60

# Función para verificar si un comando existe
function Test-Command {
    param([string]$Command)
    $null = Get-Command $Command -ErrorAction SilentlyContinue
    return $?
}

# 0. Hacer backup si existe un keymap previo
if (Test-Path "$env:USERPROFILE\qmk_firmware\keyboards\crkbd\keymaps") {
    Write-Host "`n💾 Buscando keymaps existentes..." -ForegroundColor Yellow
    
    $existingKeymaps = Get-ChildItem "$env:USERPROFILE\qmk_firmware\keyboards\crkbd\keymaps" -Directory | 
                       Where-Object { $_.Name -ne "default" -and $_.Name -ne $KeymapName }
    
    if ($existingKeymaps) {
        Write-Host "⚠️  Keymaps encontrados:" -ForegroundColor Yellow
        $existingKeymaps | ForEach-Object { Write-Host "  - $($_.Name)" -ForegroundColor Cyan }
        
        Write-Host "`n¿Hacer backup antes de continuar? (Recomendado)" -ForegroundColor Yellow
        $doBackup = Read-Host "s/n"
        
        if ($doBackup -eq "s") {
            Write-Host "`n📦 Creando backups..." -ForegroundColor Yellow
            
            foreach ($keymap in $existingKeymaps) {
                .\backup-corne.ps1 -KeymapName $keymap.Name -SkipCompile
                if ($LASTEXITCODE -eq 0) {
                    Write-Host "  ✓ Backup de '$($keymap.Name)' completado" -ForegroundColor Green
                }
            }
        }
    }
}

# 1. Verificar Python
Write-Host "`n📦 Verificando requisitos..." -ForegroundColor Yellow
if (-not (Test-Command python)) {
    Write-Host "❌ Python no está instalado" -ForegroundColor Red
    Write-Host "   Descárgalo desde: https://www.python.org/downloads/" -ForegroundColor Red
    exit 1
}
Write-Host "✓ Python instalado" -ForegroundColor Green

# 2. Instalar QMK CLI
Write-Host "`n📥 Instalando QMK CLI..." -ForegroundColor Yellow
if (-not (Test-Command qmk)) {
    python -m pip install --user qmk
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✓ QMK CLI instalado" -ForegroundColor Green
    } else {
        Write-Host "❌ Error instalando QMK CLI" -ForegroundColor Red
        exit 1
    }
} else {
    Write-Host "✓ QMK CLI ya está instalado" -ForegroundColor Green
}

# 3. Setup QMK (si no existe)
if (-not (Test-Path $QmkPath)) {
    Write-Host "`n⚙️ Configurando QMK firmware..." -ForegroundColor Yellow
    Write-Host "   (Esto puede tardar 5-10 minutos la primera vez)" -ForegroundColor Gray
    
    qmk setup -y -H $QmkPath
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✓ QMK firmware instalado en: $QmkPath" -ForegroundColor Green
    } else {
        Write-Host "❌ Error configurando QMK" -ForegroundColor Red
        exit 1
    }
} else {
    Write-Host "`n✓ QMK firmware ya existe en: $QmkPath" -ForegroundColor Green
}

# 4. Crear directorio del keymap
$KeymapPath = Join-Path $QmkPath "keyboards\crkbd\keymaps\$KeymapName"
Write-Host "`n📁 Creando keymap '$KeymapName'..." -ForegroundColor Yellow

if (Test-Path $KeymapPath) {
    Write-Host "⚠️  El keymap '$KeymapName' ya existe" -ForegroundColor Yellow
    $response = Read-Host "¿Sobrescribir? (s/n)"
    if ($response -ne "s") {
        Write-Host "❌ Operación cancelada" -ForegroundColor Red
        exit 0
    }
    Remove-Item $KeymapPath -Recurse -Force
}

New-Item -ItemType Directory -Path $KeymapPath -Force | Out-Null
Write-Host "✓ Directorio creado: $KeymapPath" -ForegroundColor Green

# 5. Copiar archivos
Write-Host "`n📋 Copiando archivos..." -ForegroundColor Yellow

$files = @{
    "examples\moco-jump-32x32_oled_anim.h" = "moco-jump-32x32_oled_anim.h"
    "examples\keymap_example.c" = "keymap.c"
    "examples\config.h" = "config.h"
    "examples\rules.mk" = "rules.mk"
}

foreach ($source in $files.Keys) {
    $dest = Join-Path $KeymapPath $files[$source]
    
    if (Test-Path $source) {
        Copy-Item $source $dest -Force
        Write-Host "  ✓ Copiado: $($files[$source])" -ForegroundColor Green
    } else {
        Write-Host "  ❌ No encontrado: $source" -ForegroundColor Red
    }
}

# 6. Compilar firmware
Write-Host "`n🔨 Compilando firmware..." -ForegroundColor Yellow
Write-Host "   (Esto puede tardar 1-2 minutos)" -ForegroundColor Gray

$compileOutput = qmk compile -kb crkbd -km $KeymapName 2>&1

if ($LASTEXITCODE -eq 0) {
    Write-Host "✓ Firmware compilado exitosamente" -ForegroundColor Green
    
    # Mostrar tamaño del firmware
    $sizeInfo = $compileOutput | Select-String "bytes used"
    if ($sizeInfo) {
        Write-Host "  📊 $sizeInfo" -ForegroundColor Cyan
    }
} else {
    Write-Host "❌ Error compilando firmware" -ForegroundColor Red
    Write-Host $compileOutput -ForegroundColor Red
    exit 1
}

# 7. Instrucciones finales
Write-Host "`n" + ("=" * 60) -ForegroundColor Cyan
Write-Host "🎉 ¡Configuración completada!" -ForegroundColor Green
Write-Host ("=" * 60) -ForegroundColor Cyan

Write-Host "`n📝 Siguiente paso: Flashear al teclado" -ForegroundColor Yellow
Write-Host "`n1. Desconecta el cable USB del teclado"
Write-Host "2. Ejecuta: qmk flash -kb crkbd -km $KeymapName"
Write-Host "3. Cuando diga 'Waiting for bootloader...'"
Write-Host "   - Conecta el USB"
Write-Host "   - Presiona el botón de reset (o corto-circuito RST+GND)"
Write-Host "4. ¡Disfruta tu animación!"

Write-Host "`n📂 Archivos en: $KeymapPath" -ForegroundColor Cyan
Write-Host "`n🔧 Personalizar:" -ForegroundColor Yellow
Write-Host "   - Edita keymap.c para cambiar teclas"
Write-Host "   - Edita config.h para ajustar brillo/timeout OLED"
Write-Host "   - Genera más animaciones con: corne-cli oled generate tu-gif.gif"

Write-Host "`n✨ ¡Listo para flashear!" -ForegroundColor Green
