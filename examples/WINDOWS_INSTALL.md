# 🪟 Instalación de QMK en Windows - Guía Rápida

QMK en Windows requiere MSYS2. Aquí está el proceso correcto.

## 📦 Instalación Automática (Recomendado)

### Opción 1: QMK MSYS (Más Fácil)

1. **Descargar QMK MSYS**:
   - Ve a: https://msys.qmk.fm/
   - Descarga: `qmk_msys_latest.exe`

2. **Instalar**:
   - Ejecuta el instalador
   - Acepta la ubicación por defecto
   - Espera a que descargue todo (~500MB)

3. **Abrir QMK MSYS**:
   - Busca "QMK MSYS" en el menú inicio
   - Se abrirá una terminal especial

4. **Configurar QMK (primera vez)**:
   ```bash
   qmk setup
   ```
   - Presiona Enter para aceptar la ubicación por defecto
   - Espera 5-10 minutos

5. **Ir al directorio del CLI**:
   ```bash
   cd /c/projects/tools/corne-cli/examples
   ```

6. **Copiar archivos al keymap**:
   ```bash
   # Crear directorio
   mkdir -p ~/qmk_firmware/keyboards/crkbd/keymaps/mi_animacion
   
   # Copiar archivos
   cp king_oled_anim.h ~/qmk_firmware/keyboards/crkbd/keymaps/mi_animacion/
   cp keymap_example.c ~/qmk_firmware/keyboards/crkbd/keymaps/mi_animacion/keymap.c
   cp config.h ~/qmk_firmware/keyboards/crkbd/keymaps/mi_animacion/
   cp rules.mk ~/qmk_firmware/keyboards/crkbd/keymaps/mi_animacion/
   ```

7. **Compilar**:
   ```bash
   qmk compile -kb crkbd -km mi_animacion
   ```

8. **Flashear**:
   ```bash
   qmk flash -kb crkbd -km mi_animacion
   ```

---

## 🔧 Alternativa: Instalación Manual en PowerShell

Si no quieres instalar MSYS2:

### Paso 1: Instalar Dependencias

```powershell
# Instalar Chocolatey (si no lo tienes)
Set-ExecutionPolicy Bypass -Scope Process -Force
[System.Net.ServicePointManager]::SecurityProtocol = [System.Net.ServicePointManager]::SecurityProtocol -bor 3072
iex ((New-Object System.Net.WebClient).DownloadString('https://community.chocolatey.org/install.ps1'))

# Instalar herramientas necesarias
choco install git make avrdude dfu-programmer dfu-util gcc-arm-none-eabi
```

### Paso 2: Clonar QMK manualmente

```powershell
cd $env:USERPROFILE
git clone --recurse-submodules https://github.com/qmk/qmk_firmware.git
cd qmk_firmware
python -m pip install -r requirements.txt
```

### Paso 3: Copiar archivos

```powershell
# Crear directorio
New-Item -ItemType Directory -Force -Path "$env:USERPROFILE\qmk_firmware\keyboards\crkbd\keymaps\mi_animacion"

# Copiar archivos
Copy-Item "C:\projects\tools\corne-cli\examples\king_oled_anim.h" `
          "$env:USERPROFILE\qmk_firmware\keyboards\crkbd\keymaps\mi_animacion\"
          
Copy-Item "C:\projects\tools\corne-cli\examples\keymap_example.c" `
          "$env:USERPROFILE\qmk_firmware\keyboards\crkbd\keymaps\mi_animacion\keymap.c"
          
Copy-Item "C:\projects\tools\corne-cli\examples\config.h" `
          "$env:USERPROFILE\qmk_firmware\keyboards\crkbd\keymaps\mi_animacion\"
          
Copy-Item "C:\projects\tools\corne-cli\examples\rules.mk" `
          "$env:USERPROFILE\qmk_firmware\keyboards\crkbd\keymaps\mi_animacion\"
```

### Paso 4: Compilar manualmente

```powershell
cd $env:USERPROFILE\qmk_firmware
make crkbd:mi_animacion
```

---

## 🎯 Recomendación

**Usa QMK MSYS** (Opción 1) - Es mucho más fácil y todo funciona automáticamente.

### Descarga:
📥 **https://msys.qmk.fm/**

Una vez instalado QMK MSYS:
1. Abre "QMK MSYS" desde el menú inicio
2. Ejecuta los comandos de la guía
3. Todo funcionará correctamente

---

## ✅ Verificar Instalación

```bash
# En QMK MSYS
qmk --version
# Debería mostrar: 1.x.x

qmk doctor
# Verifica que todo esté instalado
```

---

## 🔄 Backup con QMK Instalado

Una vez que tengas QMK funcionando:

```bash
# En QMK MSYS
cd /c/projects/tools/corne-cli/examples

# Listar keymaps disponibles
qmk list-keymaps -kb crkbd

# Hacer backup del default (si existe)
cp -r ~/qmk_firmware/keyboards/crkbd/keymaps/default \
      ~/corne-backups/backup_default_$(date +%Y-%m-%d)
```

---

## 📚 Recursos

- [QMK MSYS Download](https://msys.qmk.fm/)
- [QMK Windows Setup](https://docs.qmk.fm/#/newbs_getting_started?id=windows)
- [QMK Tutorial](https://docs.qmk.fm/#/newbs)
