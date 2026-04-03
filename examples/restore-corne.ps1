# Script de restauración para backup de Corne
# Restaura un backup previo al teclado

param(
    [Parameter(Mandatory=$false)]
    [string]$BackupPath,
    
    [Parameter(Mandatory=$false)]
    [string]$BackupDir = "$env:USERPROFILE\corne-backups",
    
    [Parameter(Mandatory=$false)]
    [switch]$List,
    
    [Parameter(Mandatory=$false)]
    [switch]$FlashOnly
)

function Write-Success { param($msg) Write-Host "✓ $msg" -ForegroundColor Green }
function Write-Error-Msg { param($msg) Write-Host "✗ $msg" -ForegroundColor Red }
function Write-Info { param($msg) Write-Host "ℹ $msg" -ForegroundColor Cyan }
function Write-Warning-Msg { param($msg) Write-Host "⚠ $msg" -ForegroundColor Yellow }

Write-Host "`n🔄 Restauración de Teclado Corne" -ForegroundColor Cyan
Write-Host ("=" * 60) -ForegroundColor Cyan

# Listar backups disponibles
if ($List -or -not $BackupPath) {
    Write-Info "Backups disponibles:`n"
    
    if (-not (Test-Path $BackupDir)) {
        Write-Error-Msg "No hay directorio de backups: $BackupDir"
        exit 1
    }
    
    $backups = Get-ChildItem $BackupDir -Directory | Sort-Object LastWriteTime -Descending
    
    if ($backups.Count -eq 0) {
        Write-Error-Msg "No hay backups disponibles"
        Write-Info "Crea un backup con: .\backup-corne.ps1"
        exit 1
    }
    
    $i = 1
    $backups | ForEach-Object {
        Write-Host "  [$i] $($_.Name)" -ForegroundColor Yellow
        Write-Host "      Fecha: $($_.LastWriteTime)" -ForegroundColor Gray
        
        $hexFile = "$BackupDir\$($_.Name).hex"
        if (Test-Path $hexFile) {
            $hexSize = [math]::Round((Get-Item $hexFile).Length / 1KB, 2)
            Write-Host "      ✓ .hex disponible ($hexSize KB)" -ForegroundColor Green
        } else {
            Write-Host "      ⚠ solo código fuente" -ForegroundColor Yellow
        }
        Write-Host ""
        $i++
    }
    
    if (-not $BackupPath) {
        $selection = Read-Host "`nSelecciona número de backup (o Enter para cancelar)"
        
        if ([string]::IsNullOrWhiteSpace($selection)) {
            Write-Info "Cancelado"
            exit 0
        }
        
        $index = [int]$selection - 1
        if ($index -ge 0 -and $index -lt $backups.Count) {
            $BackupPath = $backups[$index].FullName
        } else {
            Write-Error-Msg "Selección inválida"
            exit 1
        }
    }
}

# Validar backup path
if (-not (Test-Path $BackupPath)) {
    Write-Error-Msg "Backup no encontrado: $BackupPath"
    exit 1
}

$backupName = (Get-Item $BackupPath).Name
Write-Info "Restaurando: $backupName`n"

# Buscar archivo .hex
$hexFile = "$BackupPath.hex"
if (-not (Test-Path $hexFile)) {
    $hexFile = "$BackupPath\.hex"
}

$qmkPath = "$env:USERPROFILE\qmk_firmware"

if ($FlashOnly) {
    # Solo flashear el .hex
    if (Test-Path $hexFile) {
        Write-Info "Flasheando desde .hex...`n"
        Write-Host "⚠️  Prepara tu teclado para bootloader:" -ForegroundColor Yellow
        Write-Host "   1. Desconecta el USB"
        Write-Host "   2. Presiona Enter cuando estés listo"
        Read-Host
        
        Write-Host "`n⏳ Waiting for bootloader..." -ForegroundColor Yellow
        Write-Host "   Conecta el USB y presiona RESET"
        
        qmk flash -kb crkbd -x $hexFile
        
        if ($LASTEXITCODE -eq 0) {
            Write-Success "¡Firmware restaurado exitosamente!"
        } else {
            Write-Error-Msg "Error flasheando firmware"
        }
    } else {
        Write-Error-Msg "Archivo .hex no disponible en este backup"
        Write-Info "Usa restauración completa sin -FlashOnly"
        exit 1
    }
} else {
    # Restauración completa desde código fuente
    $keymapName = "restored_" + (Get-Date -Format "MMdd_HHmm")
    $restorePath = "$qmkPath\keyboards\crkbd\keymaps\$keymapName"
    
    Write-Info "Restaurando keymap como: $keymapName"
    
    # Copiar archivos
    try {
        Copy-Item $BackupPath $restorePath -Recurse -Force
        Write-Success "Archivos copiados a QMK"
    } catch {
        Write-Error-Msg "Error copiando archivos: $_"
        exit 1
    }
    
    # Compilar
    Write-Host "`n🔨 Compilando firmware..." -ForegroundColor Yellow
    qmk compile -kb crkbd -km $keymapName
    
    if ($LASTEXITCODE -ne 0) {
        Write-Error-Msg "Error compilando. Verifica los archivos."
        exit 1
    }
    
    Write-Success "Firmware compilado`n"
    
    # Flashear
    $flashNow = Read-Host "¿Flashear al teclado ahora? (s/n)"
    
    if ($flashNow -eq "s") {
        Write-Host "`n⚠️  Prepara tu teclado para bootloader:" -ForegroundColor Yellow
        Write-Host "   1. Desconecta el USB"
        Write-Host "   2. Presiona Enter cuando estés listo"
        Read-Host
        
        Write-Host "`n⏳ Waiting for bootloader..." -ForegroundColor Yellow
        Write-Host "   Conecta el USB y presiona RESET"
        
        qmk flash -kb crkbd -km $keymapName
        
        if ($LASTEXITCODE -eq 0) {
            Write-Success "`n¡Teclado restaurado exitosamente!"
        } else {
            Write-Error-Msg "Error flasheando"
        }
    } else {
        Write-Info "Compilación lista en: $restorePath"
        Write-Info "Flashear más tarde con: qmk flash -kb crkbd -km $keymapName"
    }
}

Write-Host "`n✨ Proceso completado" -ForegroundColor Green
