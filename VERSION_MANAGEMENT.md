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

### **1. Desarrollo Normal**
```bash
# Hacer cambios...
git add .
git commit -m "feat: nueva funcionalidad"

# Incrementar versión
npm run version:minor:commit "Add new feature"

# Deploy
git push && git push --tags
```

### **2. Hotfix Urgente**
```bash
# Fix crítico...
git add .
git commit -m "fix: critical security issue"

# Patch version
npm run version:patch:commit "Security fix"

# Deploy inmediato
git push && git push --tags
```

### **3. Rollback de Emergencia**
```bash
# Ver versiones disponibles
npm run version:list

# Rollback a versión estable
npm run version:rollback v1.2.0 --force

# Deploy del rollback
git push --force-with-lease
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
3. **Comunicar MINOR versions al equipo**
4. **Tener plan de rollback para cada deploy**
5. **Monitorear errores post-deploy**