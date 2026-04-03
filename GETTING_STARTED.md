# Corne CLI - Getting Started

## 📦 Inicialización del Proyecto

### 1. Crear package.json

```bash
npm init -y
```

Luego actualiza el `package.json`:

```json
{
  "name": "corne-cli",
  "version": "0.1.0",
  "description": "CLI tool for customizing Corne keyboards with QMK firmware",
  "bin": {
    "corne-cli": "./bin/corne-cli.js",
    "corne": "./bin/corne-cli.js"
  },
  "scripts": {
    "build": "tsc",
    "dev": "tsx src/cli.ts",
    "start": "node dist/cli.js",
    "test": "jest",
    "test:watch": "jest --watch",
    "test:coverage": "jest --coverage",
    "lint": "eslint src tests --ext .ts",
    "format": "prettier --write \"src/**/*.ts\" \"tests/**/*.ts\"",
    "prepublishOnly": "npm run build"
  },
  "keywords": [
    "corne",
    "keyboard",
    "qmk",
    "firmware",
    "cli"
  ],
  "author": "",
  "license": "MIT"
}
```

### 2. Instalar Dependencias

#### Dependencias de Producción
```bash
npm install commander inquirer chalk ora cli-table3 boxen figures conf node-hid serialport
```

#### Dependencias de Desarrollo
```bash
npm install -D typescript @types/node @types/inquirer tsx jest ts-jest @types/jest eslint @typescript-eslint/parser @typescript-eslint/eslint-plugin prettier eslint-config-prettier
```

### 3. Configurar TypeScript

Crea `tsconfig.json`:

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "commonjs",
    "lib": ["ES2020"],
    "outDir": "./dist",
    "rootDir": "./src",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true,
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true,
    "moduleResolution": "node"
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist", "tests"]
}
```

### 4. Configurar Jest

Crea `jest.config.js`:

```javascript
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/src', '<rootDir>/tests'],
  testMatch: ['**/__tests__/**/*.ts', '**/*.test.ts', '**/*.spec.ts'],
  collectCoverageFrom: [
    'src/**/*.ts',
    '!src/**/*.d.ts',
    '!src/cli.ts',
    '!src/index.ts'
  ],
  coverageThreshold: {
    global: {
      branches: 70,
      functions: 70,
      lines: 70,
      statements: 70
    }
  },
  setupFilesAfterEnv: ['<rootDir>/tests/setup.ts']
};
```

### 5. Configurar ESLint

Crea `.eslintrc.js`:

```javascript
module.exports = {
  parser: '@typescript-eslint/parser',
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended',
    'prettier'
  ],
  parserOptions: {
    ecmaVersion: 2020,
    sourceType: 'module'
  },
  rules: {
    '@typescript-eslint/explicit-function-return-type': 'warn',
    '@typescript-eslint/no-explicit-any': 'warn',
    '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }]
  }
};
```

### 6. Configurar Prettier

Crea `.prettierrc`:

```json
{
  "semi": true,
  "trailingComma": "es5",
  "singleQuote": true,
  "printWidth": 100,
  "tabWidth": 2
}
```

### 7. Crear Estructura de Directorios

```bash
mkdir -p src/commands src/core/bootloader src/core/compiler src/core/keymap src/core/config src/ui src/utils src/types bin tests/unit tests/integration tests/mocks tests/fixtures tests/helpers templates profiles
```

### 8. Crear Archivo CLI Principal

Crea `src/cli.ts`:

```typescript
#!/usr/bin/env node

import { Command } from 'commander';
import chalk from 'chalk';
import { flashCommand } from './commands/flash';
import { keymapCommand } from './commands/keymap';
import { compileCommand } from './commands/compile';
import { configCommand } from './commands/config';

const program = new Command();

program
  .name('corne-cli')
  .description('CLI tool for customizing Corne keyboards with QMK firmware')
  .version('0.1.0');

// Flash command
program
  .command('flash')
  .description('Flash firmware to connected keyboard')
  .option('-f, --firmware <path>', 'Path to firmware file')
  .option('--bootloader <type>', 'Force specific bootloader type')
  .option('--no-verify', 'Skip verification after flashing')
  .action(flashCommand);

// Keymap commands
const keymapCmd = program
  .command('keymap')
  .description('Manage keyboard layouts');

keymapCmd
  .command('list')
  .description('List saved keymap profiles')
  .action(() => keymapCommand.list());

keymapCmd
  .command('create <name>')
  .description('Create a new keymap profile')
  .option('-t, --template <name>', 'Use template (qwerty, dvorak, colemak)')
  .action((name, options) => keymapCommand.create(name, options));

keymapCmd
  .command('edit <name>')
  .description('Edit an existing keymap profile')
  .action((name) => keymapCommand.edit(name));

keymapCmd
  .command('delete <name>')
  .description('Delete a keymap profile')
  .action((name) => keymapCommand.delete(name));

// Compile command
program
  .command('compile')
  .description('Compile firmware from current configuration')
  .option('-p, --profile <name>', 'Use specific keymap profile')
  .option('-o, --output <path>', 'Output path for compiled firmware')
  .action(compileCommand);

// Config command
program
  .command('config')
  .description('Manage CLI configuration')
  .action(configCommand);

program
  .command('config:set <key> <value>')
  .description('Set a configuration value')
  .action((key, value) => configCommand.set(key, value));

// Error handling
program.exitOverride();

try {
  program.parse();
} catch (error: any) {
  if (error.code === 'commander.help') {
    process.exit(0);
  }
  console.error(chalk.red(`\n✗ ${error.message}\n`));
  process.exit(1);
}
```

### 9. Crear Executable Shebang

Crea `bin/corne-cli.js`:

```javascript
#!/usr/bin/env node

require('../dist/cli.js');
```

Hazlo ejecutable:
```bash
chmod +x bin/corne-cli.js
```

### 10. Crear Tests Setup

Crea `tests/setup.ts`:

```typescript
// Global test setup
beforeAll(() => {
  // Silence console output during tests
  jest.spyOn(console, 'log').mockImplementation();
  jest.spyOn(console, 'error').mockImplementation();
  jest.spyOn(console, 'warn').mockImplementation();
});

afterAll(() => {
  jest.restoreAllMocks();
});
```

### 11. Crear .gitignore

```
# Dependencies
node_modules/

# Build output
dist/
*.tsbuildinfo

# Tests
coverage/
.nyc_output/

# IDE
.vscode/
.idea/
*.swp
*.swo

# OS
.DS_Store
Thumbs.db

# Logs
*.log
npm-debug.log*

# Environment
.env
.env.local

# User data
profiles/
*.backup
```

## 🚀 Primeros Pasos

### 1. Compilar el proyecto
```bash
npm run build
```

### 2. Ejecutar en modo desarrollo
```bash
npm run dev -- --help
```

### 3. Enlazar localmente para testing
```bash
npm link
corne-cli --help
```

### 4. Ejecutar tests
```bash
npm test
```

## 📝 Próximos Pasos

Ahora puedes empezar a implementar funcionalidad usando los agentes especializados:

### Paso 1: Implementar Detección de Bootloader
```
@flasher ayúdame a implementar la detección automática de bootloader
```

### Paso 2: Crear Sistema de Keymap
```
@keymap-manager ayúdame a implementar el sistema de perfiles de keymap
```

### Paso 3: Integrar QMK
```
@qmk-firmware ayúdame a implementar la compilación de firmware
```

### Paso 4: Comandos CLI Interactivos
```
@cli-dev ayúdame a crear el comando flash con prompts interactivos
```

### Paso 5: Tests
```
@testing ayúdame a escribir tests para la detección de bootloader
```

## 🔗 Recursos Útiles

- [Commander.js Docs](https://github.com/tj/commander.js)
- [Inquirer.js Docs](https://github.com/SBoudrias/Inquirer.js)
- [QMK Firmware Docs](https://docs.qmk.fm/)
- [node-hid Docs](https://github.com/node-hid/node-hid)
- [Jest Docs](https://jestjs.io/)

## ❓ Problemas Comunes

### Error al importar módulos ES
Si tienes problemas con módulos ES (como `chalk` v5+), considera usar las versiones CommonJS o configurar TypeScript para ES modules.

### Permisos USB en Linux
```bash
sudo usermod -a -G dialout $USER
sudo usermod -a -G plugdev $USER
```

### Windows y drivers USB
Usa [Zadig](https://zadig.akeo.ie/) para instalar drivers WinUSB/libusb para el bootloader.

---

¡Listo para empezar! Usa los agentes especializados para cada tarea. 🚀
