# Corne CLI - Agentes de GitHub Copilot

Este documento describe los agentes especializados de GitHub Copilot para el desarrollo del CLI de Corne Keyboard.

## 🎯 ¿Qué son estos agentes?

Los agentes son asistentes de IA especializados que puedes invocar con `@nombre-agente` en el chat de Copilot. Cada agente tiene:
- **Experiencia específica** en un dominio particular
- **Herramientas permitidas** para su área de trabajo
- **Conocimiento contextual** sobre el proyecto Corne CLI

## 📋 Agentes Disponibles

### @qmk-firmware
**Experto en compilación y configuración de firmware QMK**

Úsalo cuando necesites:
- Compilar firmware QMK
- Generar archivos de keymap (`.c`, `.json`)
- Configurar características QMK (RGB, OLED, encoders)
- Depurar errores de compilación
- Integrar QMK CLI en Node.js

**Ejemplo:**
```
@qmk-firmware ayúdame a generar un keymap.c desde una configuración JSON
```

---

### @flasher
**Experto en flasheo de firmware y comunicación con bootloaders**

Úsalo cuando necesites:
- Detectar bootloader conectado (DFU, Caterina, HalfKay, etc.)
- Flashear firmware a la keyboard
- Solucionar problemas de conexión USB/serial
- Integrar herramientas de bootloader (dfu-util, avrdude, etc.)
- Manejar diferentes tipos de bootloader

**Ejemplo:**
```
@flasher necesito implementar la detección automática de bootloader para Pro Micro
```

---

### @keymap-manager
**Experto en gestión de layouts y configuración de teclas**

Úsalo cuando necesites:
- Crear y editar keymaps
- Diseñar capas (layers)
- Gestionar perfiles de configuración
- Validar layouts
- Convertir entre formatos (JSON ↔ YAML ↔ QMK C)
- Implementar backup/restore de configuraciones

**Ejemplo:**
```
@keymap-manager ayúdame a crear un sistema de perfiles para guardar diferentes layouts
```

---

### @cli-dev
**Experto en desarrollo de CLI con Node.js/TypeScript**

Úsalo cuando necesites:
- Crear comandos CLI con Commander.js
- Implementar prompts interactivos (Inquirer)
- Diseñar output de terminal (colores, tablas, spinners)
- Manejar errores y exit codes
- Configurar package.json y scripts
- Gestionar configuración de usuario

**Ejemplo:**
```
@cli-dev necesito crear un comando interactivo para seleccionar y flashear firmware
```

---

### @testing
**Experto en testing de CLI y mocking de hardware**

Úsalo cuando necesites:
- Escribir tests unitarios e integración (Jest)
- Mockear dispositivos USB y puertos seriales
- Testear comandos CLI
- Configurar cobertura de tests
- Implementar TDD
- Mockear child processes (bootloader tools)

**Ejemplo:**
```
@testing ayúdame a crear mocks para dispositivos USB y escribir tests para la detección de bootloader
```

---

## 🚀 Cómo Usar los Agentes

### 1. Invocación Directa
Menciona al agente con `@` seguido del nombre:

```
@qmk-firmware cómo compilo firmware para Corne con OLED habilitado?
```

### 2. Combinación de Agentes
Puedes trabajar con múltiples agentes en secuencia:

```
Primero hablaré con @keymap-manager para diseñar el layout,
luego con @qmk-firmware para compilar,
y finalmente con @flasher para subirlo a la keyboard
```

### 3. Contexto General
Si no mencionas ningún agente, Copilot usará el contexto general del proyecto (definido en [copilot-instructions.md](../copilot-instructions.md)).

## 📁 Estructura del Proyecto

Los agentes están diseñados para trabajar con esta estructura:

```
corne-cli/
├── .github/
│   ├── copilot-instructions.md    # Instrucciones generales del proyecto
│   └── agents/                    # Agentes especializados
│       ├── qmk-firmware.agent.md
│       ├── flasher.agent.md
│       ├── keymap-manager.agent.md
│       ├── cli-dev.agent.md
│       └── testing.agent.md
├── src/
│   ├── commands/                  # Comandos CLI
│   ├── core/                      # Funcionalidad principal
│   │   ├── bootloader/
│   │   ├── compiler/
│   │   ├── keymap/
│   │   └── config/
│   ├── ui/                        # Terminal UI
│   ├── utils/                     # Utilidades
│   └── types/                     # Tipos TypeScript
├── tests/                         # Tests
├── templates/                     # Templates de keymap
└── profiles/                      # Perfiles guardados
```

## 🔧 Stack Tecnológico

### Core
- **TypeScript** - Lenguaje principal
- **Node.js** - Runtime
- **Commander.js** - Framework CLI

### UI Terminal
- **Inquirer** - Prompts interactivos
- **Chalk** - Colores
- **Ora** - Spinners
- **cli-table3** - Tablas
- **boxen** - Cajas decorativas

### Hardware
- **node-hid** - Comunicación USB HID
- **serialport** - Comunicación serial

### Testing
- **Jest** - Framework de testing
- **ts-jest** - TypeScript para Jest

### Bootloader Tools
- `dfu-util` - DFU bootloaders (ARM, RISC-V)
- `dfu-programmer` - Atmel DFU
- `avrdude` - Caterina (Pro Micro)
- `teensy_loader_cli` - HalfKay (Teensy)
- `hid_bootloader_cli` - QMK HID
- `wb32-dfu-updater_cli` - WB32 DFU

## 💡 Ejemplos de Uso

### Ejemplo 1: Crear comando de flash completo
```
@cli-dev crea la estructura básica del comando 'flash'
@flasher implementa la detección de bootloader
@qmk-firmware agrega validación del firmware
@testing escribe tests para todo el flujo
```

### Ejemplo 2: Sistema de keymap
```
@keymap-manager diseña el esquema de datos para keymaps
@keymap-manager implementa guardado y carga de perfiles
@qmk-firmware agrega conversión a formato QMK
@testing crea tests de validación
```

### Ejemplo 3: Workflow completo
```
@cli-dev crea el comando 'corne-cli init'
@keymap-manager implementa creación de keymap inicial
@qmk-firmware agrega compilación
@flasher implementa flasheo automático
@testing agrega tests de integración
```

## 📚 Recursos Adicionales

### Documentación QMK
- [QMK Firmware](https://docs.qmk.fm/)
- [QMK CLI](https://docs.qmk.fm/#/cli)
- [Keycodes](https://docs.qmk.fm/#/keycodes)

### Herramientas Bootloader
- [dfu-util](http://dfu-util.sourceforge.net/)
- [dfu-programmer](http://dfu-programmer.github.io/)
- [AVRDUDE](https://www.nongnu.org/avrdude/)

### Corne Keyboard
- [Corne Keyboard (crkbd)](https://github.com/foostan/crkbd)
- [QMK crkbd](https://github.com/qmk/qmk_firmware/tree/master/keyboards/crkbd)

## 📊 Optimización de Tokens

### Por Qué Importa
Usar agentes especializados puede **reducir el consumo de tokens en 40-60%**. Esto significa:
- ⚡ Respuestas más rápidas
- 💰 Menor costo de API
- 🎯 Contexto más relevante

### Ahorro de Tokens por Técnica

| Técnica | Ahorro Estimado |
|---------|-----------------|
| Usar agente especializado (@qmk-firmware, @flasher, etc.) | ~30-35% |
| Sistema de memoria (`/memories/`) | ~40% |
| Skills personalizados (npm publish, etc.) | ~65-70% |
| Operaciones paralelas | ~50-65% |
| Multi-replace edits | ~60% |
| **Combinado** | **~40-60%** |

### Cómo Optimizar

✅ **Sí hacer**:
```
@flasher implementar detección de bootloader Caterina
```
- Específico, menciona agente, tarea clara

✅ **Sí hacer**:
```
publicar v0.2.3 con fix USB
```
- Activa skill de publicación npm (ahorra ~67% tokens)

❌ **Evitar**:
```
necesito que me ayudes con algo del bootloader, creo que es para flashear
pero no estoy seguro qué tipo de bootloader es
```
- Vago, sin agente, requiere muchas preguntas de clarificación

### Sistema de Memoria

El proyecto usa memoria persistente para evitar repetir contexto:

- **`/memories/`** - Contexto del proyecto (carga automática)
- **`/memories/repo/`** - Convenciones del repositorio
- **`/memories/session/`** - Trabajo en progreso (temporal)

Ver: [Guía Completa de Optimización](../../docs/TOKEN_OPTIMIZATION.md)

### Skills Personalizados

**Publicación npm**: Di "publicar a npm" para activar workflow automático
- Bump version + update CHANGELOG + build + publish + git push
- **Ahorro**: ~10,000 tokens por publicación

**Ubicación**: `.github/skills/npm-publish.skill.md`

## 🎓 Mejores Prácticas

1. **Usa el agente correcto** - Cada agente tiene su especialidad
2. **Se específico** - "ayúdame a X" funciona mejor que "explícame todo"
3. **Itera** - Empieza simple y mejora con cada interacción
4. **Combina agentes** - No dudes en cambiar de agente según la tarea
5. **Testea todo** - Usa @testing frecuentemente para mantener calidad

## 🐛 Troubleshooting

### "El agente no responde correctamente"
- Verifica que estás usando `@nombre-agente` (con @)
- Asegúrate de que la pregunta está en el dominio del agente
- Intenta ser más específico en tu pregunta

### "Necesito funcionalidad que cruza dominios"
- Empieza con un agente y luego cambia a otro
- O usa el contexto general sin mencionar agente específico

---

**¿Preguntas?** Pregunta a cualquier agente o revisa [copilot-instructions.md](../copilot-instructions.md)
