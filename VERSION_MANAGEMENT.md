# Sistema de Versionado y Rollback

## 📋 Comandos Disponibles

### **Incrementar Versión**
```bash
# Solo actualizar archivo (requiere commit manual)
npm run version:patch    # 1.2.1 → 1.2.2 (bugfixes)
npm run version:minor    # 1.2.1 → 1.3.0 (features, token cleanup)
npm run version:major    # 1.2.1 → 2.0.0 (breaking changes)

# Con auto-commit y tag
npm run version:patch:commit "Fix UI bug"
npm run version:minor:commit "Add new auth system"
npm run version:major:commit "Complete redesign"
```

### **Información de Versiones**
```bash
npm run version:current  # Ver versión actual
npm run version:list     # Listar últimas 10 versiones
git tag -l "v*"         # Ver todas las versiones
```

### **Rollback**
```bash
# Ver versiones disponibles
npm run version:rollback

# Hacer rollback (requiere --force)
npm run version:rollback v1.2.0 --force
```

## 🔄 Flujo de Trabajo

### **1. Desarrollo Normal (Recomendado)**
```bash
# Hacer cambios en el código...
# Ejemplo: Agregar nueva funcionalidad al LMS

git add .
git commit -m "feat: add quiz functionality to LMS courses"
# O usar Commitizen: npx cz

# Incrementar versión (repo debe estar limpio)
npm run version:minor "Add quiz functionality"

# Commit de la versión
git add .
npx cz  # Selecciona "chore" -> "version" -> "bump to v1.5.0"

# Tag y deploy
git tag v1.5.0
git push && git push --tags
```

### **2. Bug Fix Rápido**
```bash
# Arreglar bug...
# Ejemplo: Fix en el editor de contenido LMS

git add .
git commit -m "fix: resolve token cleanup issue in course editor"

# Patch version (solo para bugs)
npm run version:patch "Fix token cleanup issue"

# Commit de la versión
git add .
npx cz  # Selecciona "chore" -> "version" -> "bump to v1.4.1"

# Tag y deploy
git tag v1.4.1
git push && git push --tags
```

### **3. Flujo Automático (Todo en uno)**
```bash
# Hacer cambios...
# NO hacer commit todavía

# El script hace todo automáticamente
npm run version:minor:commit "Add new auth system"
git push && git push --tags
```

### **4. Rollback de Emergencia**
```bash
# Ver versiones disponibles
npm run version:list

# Rollback a versión estable
npm run version:rollback v1.4.0 --force

# Deploy del rollback
git push --force-with-lease
```

## 🎯 Ejemplo Completo: Arreglar Bug

### **Escenario:** Bug en el sistema de autenticación

```bash
# 1. Identificar y arreglar el bug
# Editas: src/utils/use-axios-private.tsx
# Fix: Problema con refresh token

# 2. Commit del fix
git add .
git commit -m "fix: resolve infinite loop in token refresh"

# 3. Incrementar versión PATCH (es un bug)
npm run version:patch "Fix infinite token refresh loop"

# Output:
# ✅ Versión actualizada: 1.4.0 → 1.4.1
# 📝 Mensaje: Fix infinite token refresh loop
# 📅 Fecha: 2025-10-20

# 4. Commit de la versión
git add .
npx cz
# Selecciona: chore(version): bump to v1.4.1

# 5. Tag y deploy
git tag v1.4.1
git push && git push --tags

# 6. Verificar deploy
npm run version:current  # v1.4.1
```

## 🚀 Ejemplo Completo: Nueva Feature

### **Escenario:** Agregar sistema de certificados

```bash
# 1. Desarrollar la feature
# Crear: src/pages/lms/certificates/
# Modificar: varios archivos...

# 2. Commit de la feature
git add .
npx cz
# Selecciona: feat(lms): add certificate generation system

# 3. Incrementar versión MINOR (nueva feature)
npm run version:minor "Add certificate generation system"

# Output:
# ✅ Versión actualizada: 1.4.1 → 1.5.0
# 📝 Mensaje: Add certificate generation system
# 📅 Fecha: 2025-10-20

# 4. Commit de la versión
git add .
npx cz
# Selecciona: chore(version): bump to v1.5.0

# 5. Tag y deploy
git tag v1.5.0
git push && git push --tags

# 6. Los usuarios verán limpieza de tokens (MINOR limpia tokens)
```

## 📝 Tipos de Versión

### **PATCH (1.2.1 → 1.2.2)**
- ✅ Bugfixes
- ✅ Cambios de UI menores
- ✅ Optimizaciones
- ❌ **NO limpia tokens**

### **MINOR (1.2.1 → 1.3.0)**
- ✅ Nuevas features
- ✅ Cambios en autenticación
- ✅ Updates de seguridad
- ✅ **SÍ limpia tokens**

### **MAJOR (1.2.1 → 2.0.0)**
- ✅ Breaking changes
- ✅ Reestructuración completa
- ✅ Migración de datos
- ✅ **SÍ limpia tokens**

## 🚨 Casos de Emergencia

### **Si el deploy falló:**
```bash
# Opción 1: Rollback completo
npm run version:rollback v1.2.0 --force
git push --force-with-lease

# Opción 2: Revert específico
git revert v1.2.1
git push
```

### **Si los usuarios reportan problemas:**
```bash
# Rollback inmediato
npm run version:rollback v1.2.0 --force
git push --force-with-lease

# Notificar al equipo
echo "🚨 ROLLBACK: Reverted to v1.2.0 due to issues"
```

### **Si se perdió el historial:**
```bash
# Recuperar desde remoto
git fetch --all --tags
git reset --hard origin/main

# Ver versiones disponibles
npm run version:list
```

## 🔧 Configuración

### **Archivo de versión:** `src/constants/version.ts`
- `VERSION`: Versión actual
- `CLEAR_TOKENS_ON_VERSION_CHANGE`: Si limpiar tokens
- `CHANGELOG`: Historial de cambios

### **Scripts:** `scripts/`
- `update-version.js`: Incrementar versión
- `rollback-version.js`: Hacer rollback

## 📊 Monitoreo

### **Logs en producción:**
```javascript
// En browser console
console.log(APP_CONFIG.VERSION)
console.log(APP_CONFIG.CHANGELOG)
```

### **Verificar deploy:**
```bash
# Ver última versión deployada
curl -s https://app.metromedics.co | grep -o 'VERSION.*'
```

## ⚠️ Mejores Prácticas

1. **Siempre hacer backup antes de MAJOR**
2. **Probar en staging antes de producción**
3. **Comunicar MINOR versions al equipo (limpian tokens)**
4. **Tener plan de rollback para cada deploy**
5. **Monitorear errores post-deploy**
6. **Usar PATCH solo para bugs**
7. **Usar MINOR para features y cambios de auth**
8. **Repo limpio antes de versionado automático**

## 🔍 Troubleshooting

### **Error: "Hay cambios sin commitear"**
```bash
# Solución 1: Commit manual primero
git add .
git commit -m "pending changes"
npm run version:patch "bug fix"

# Solución 2: Usar flujo automático
npm run version:patch:commit "bug fix"
```

### **Error: "Cannot read properties of undefined"**
```bash
# Problema con import.meta.env
# Ya está solucionado en version.ts
npm run version:current  # Debería funcionar
```

### **Rollback no funciona**
```bash
# Verificar que la versión existe
git tag -l "v*"

# Usar rollback con force
npm run version:rollback v1.4.0 --force
```

## 📱 Quick Reference

```bash
# Comandos más usados
npm run version:patch "bug description"     # Bug fix
npm run version:minor "feature description" # New feature  
npm run version:current                     # Ver versión
git tag v1.x.x && git push --tags         # Deploy
```