# 🖥️ Usar QMK MSYS en VS Code

Configuración para usar la terminal de QMK MSYS directamente en VS Code.

## ✅ Ya está Configurado

El archivo [`.vscode/settings.json`](../.vscode/settings.json) ya tiene la configuración de QMK MSYS.

## 🚀 Cómo Usar

### Método 1: Terminal por Defecto (Ya Configurado)

1. **Abrir nueva terminal** en VS Code:
   - Presiona: `Ctrl + Shift + ñ` (o `Ctrl + ñ` en algunos teclados)
   - O desde el menú: **Terminal > New Terminal**

2. La terminal QMK MSYS se abrirá automáticamente ✅

### Método 2: Selector de Terminal

Si quieres cambiar entre terminales (PowerShell, QMK MSYS, etc.):

1. **Abrir selector de terminal**:
   - Click en la flecha **▼** junto al botón **+** en el panel de terminal
   - O presiona: `Ctrl + Shift + P` → Escribe `Terminal: Select Default Profile`

2. **Seleccionar**:
   - **QMK MSYS** ← Para comandos QMK
   - **PowerShell** ← Para comandos del proyecto (npm, node, etc.)

### Método 3: Múltiples Terminales

Puedes tener ambas abiertas al mismo tiempo:

1. Abre una terminal PowerShell: Click en **▼** → **PowerShell**
2. Abre una terminal QMK MSYS: Click en **▼** → **QMK MSYS**
3. Alterna entre ellas con el selector de pestañas

## 🎯 Comandos de Inicio Rápido

Una vez que tengas la terminal QMK MSYS en VS Code:

```bash
# Verificar que QMK funciona
qmk --version

# Setup QMK (primera vez)
qmk setup

# Ver ubicación actual
pwd

# Ir a la carpeta examples
cd examples

# Copiar archivos al keymap
mkdir -p ~/qmk_firmware/keyboards/crkbd/keymaps/mi_animacion
cp moco-jump-32x32_oled_anim.h ~/qmk_firmware/keyboards/crkbd/keymaps/mi_animacion/
cp keymap_example.c ~/qmk_firmware/keyboards/crkbd/keymaps/mi_animacion/keymap.c
cp config.h ~/qmk_firmware/keyboards/crkbd/keymaps/mi_animacion/
cp rules.mk ~/qmk_firmware/keyboards/crkbd/keymaps/mi_animacion/

# Compilar
qmk compile -kb crkbd -km mi_animacion

# Flashear
qmk flash -kb crkbd -km mi_animacion
```

## 🔧 Configuración Personalizada

Si QMK MSYS está instalado en otra ubicación, edita [`.vscode/settings.json`](../.vscode/settings.json):

```json
{
  "terminal.integrated.profiles.windows": {
    "QMK MSYS": {
      "path": "RUTA_PERSONALIZADA\\usr\\bin\\bash.exe",  // ← Cambiar aquí
      // ...
    }
  }
}
```

Ubicaciones comunes:
- Por defecto: `C:\\QMK_MSYS\\usr\\bin\\bash.exe`
- Portable: `D:\\QMK_MSYS\\usr\\bin\\bash.exe`

## 🐛 Troubleshooting

### Error: "bash.exe not found"

QMK MSYS no está instalado o está en otra ubicación.

**Solución**:
1. Verifica que QMK MSYS esté instalado
2. Busca `bash.exe` en tu sistema:
   - Abre File Explorer
   - Busca: `bash.exe` en `C:\QMK_MSYS`
3. Actualiza la ruta en `.vscode/settings.json`

### La terminal se abre pero los comandos fallan

Verifica las variables de entorno en `.vscode/settings.json`:

```json
"env": {
  "MSYSTEM": "MINGW64",  // ← Debe ser MINGW64
  "CHERE_INVOKING": "1"
}
```

### Quiero volver a PowerShell como default

Edita `.vscode/settings.json`:

```json
{
  "terminal.integrated.defaultProfile.windows": "PowerShell"  // ← Cambiar aquí
}
```

O usa el selector interactivo: `Ctrl + Shift + P` → `Terminal: Select Default Profile`

## 💡 Tips

### Múltiples Terminales al Mismo Tiempo

```
├─ Terminal 1: PowerShell    ← Para npm, node, corne-cli
├─ Terminal 2: QMK MSYS      ← Para qmk compile, qmk flash
└─ Terminal 3: QMK MSYS      ← Para monitorear logs
```

Cada terminal mantiene su propio contexto (cwd, variables, historia).

### Atajos de Teclado Útiles

| Atajo | Acción |
|-------|--------|
| `Ctrl + Shift + ñ` | Nueva terminal |
| `Ctrl + Shift + 5` | Dividir terminal |
| `Ctrl + ñ` | Mostrar/Ocultar panel |
| `Alt + ←/→` | Navegar entre terminales |

### Ejecutar Comandos Directamente

Desde el código, puedes seleccionar una línea y:
- `Ctrl + Shift + P` → `Terminal: Run Selected Text`

Ejemplo:
```bash
qmk compile -kb crkbd -km mi_animacion
```
Selecciona la línea → `Ctrl + Shift + P` → `Run Selected Text` → Se ejecuta en la terminal activa

## 📚 Recursos

- [VS Code Terminal Docs](https://code.visualstudio.com/docs/terminal/profiles)
- [QMK MSYS Download](https://msys.qmk.fm/)
- [QMK Documentation](https://docs.qmk.fm/)

---

¡Ahora puedes usar QMK sin salir de VS Code! 🚀
