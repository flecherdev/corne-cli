# 🚀 Configuración Completa - Instrucciones Finales

## ✅ Estado Actual

### Completado ✓
- ✅ Login a npm como: **flecher**
- ✅ Proyecto compilado exitosamente
- ✅ Repositorio GitHub creado: https://github.com/flecherdev/corne-cli
- ✅ Código pusheado a GitHub (95 archivos)

### Pendiente
- ⏳ Configurar npm token en GitHub Secrets
- ⏳ Primera publicación a npm

---

## 📝 Paso 1: Crear Token de npm (Automation)

### Opción A: Desde la Web (Recomendado)
1. Ve a: https://www.npmjs.com/settings/flecher/tokens
2. Click en **"Generate New Token"**
3. Selecciona **"Automation"** (para CI/CD)
4. Nombra el token: `GITHUB_ACTIONS_CORNE_CLI`
5. Click **"Generate Token"**
6. **COPIA EL TOKEN INMEDIATAMENTE** (solo se muestra una vez)

### Opción B: Desde la línea de comandos
```bash
npm token create --read-only=false --cidr-whitelist=
```

---

## 📝 Paso 2: Configurar Token en GitHub Secrets

1. Ve a tu repositorio: https://github.com/flecherdev/corne-cli
2. Click en **Settings** (pestaña superior)
3. En el menú izquierdo → **Secrets and variables** → **Actions**
4. Click **"New repository secret"**
5. Nombre: `NPM_TOKEN`
6. Valor: **pega el token que copiaste**
7. Click **"Add secret"**

---

## 📝 Paso 3: Primera Publicación a npm

### Opción A: Publicación Manual (Primera vez - Recomendado)

```bash
# Verificar que todo está listo
npm run build
npm test

# Publicar a npm
npm publish --access public
```

### Opción B: Publicación Automática via GitHub Release

```bash
# 1. Crear tag de versión
git tag v0.1.0
git push origin v0.1.0

# 2. Ve a GitHub y crea un Release:
# https://github.com/flecherdev/corne-cli/releases/new
# - Selecciona el tag v0.1.0
# - Escribe las release notes
# - Publica el release
# 
# GitHub Actions automáticamente publicará a npm
```

---

## 🔍 Verificación Post-Publicación

Después de publicar, verifica que todo funciona:

```bash
# Ver el paquete en npm
npm view corne-cli

# Instalar globalmente en otro lugar
npm install -g corne-cli

# Probar el CLI
corne-cli --version
corne-cli --help
```

---

## 🎯 URLs Importantes

- 📦 **npm Package**: https://www.npmjs.com/package/corne-cli
- 🐙 **GitHub Repo**: https://github.com/flecherdev/corne-cli
- 🔑 **npm Tokens**: https://www.npmjs.com/settings/flecher/tokens
- ⚙️ **GitHub Secrets**: https://github.com/flecherdev/corne-cli/settings/secrets/actions
- 🚀 **GitHub Actions**: https://github.com/flecherdev/corne-cli/actions

---

## ⚡ Comandos Rápidos

```bash
# Ver estado de GitHub Actions
# Ve a: https://github.com/flecherdev/corne-cli/actions

# Publicar versión patch (0.1.0 → 0.1.1)
npm version patch
git push origin main --tags
npm publish

# Publicar versión minor (0.1.0 → 0.2.0)
npm version minor
git push origin main --tags
npm publish

# Publicar versión major (0.1.0 → 1.0.0)
npm version major
git push origin main --tags
npm publish
```

---

## 🆘 Solución de Problemas

### Error: "You cannot publish over the previously published versions"
```bash
# Incrementa la versión primero
npm version patch
npm publish
```

### Error: "npm ERR! 403 Forbidden"
```bash
# Verifica que estás logueado
npm whoami

# Si no, login de nuevo
npm login
```

### Error: "Package name already taken"
- El nombre ya existe en npm
- Cambia el nombre en `package.json`
- O usa un scoped package: `@flecher/corne-cli`

---

## 📋 Checklist Final

Antes de la primera publicación:

- [ ] Token de npm creado
- [ ] Token configurado en GitHub Secrets como `NPM_TOKEN`
- [ ] Build exitoso (`npm run build`)
- [ ] Tests pasando (`npm test`) - opcional si no hay tests críticos
- [ ] README actualizado
- [ ] CHANGELOG actualizado
- [ ] Versión correcta en package.json (0.1.0)

**¡Todo listo para publicar!** 🎉

