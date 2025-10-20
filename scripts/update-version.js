import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Obtener argumentos de línea de comandos
const args = process.argv.slice(2);
const versionType = args[0]; // patch, minor, major
const message = args[1] || 'Version update';
const autoCommit = args.includes('--commit');

if (!versionType || !['patch', 'minor', 'major'].includes(versionType)) {
  console.error('❌ Uso: node scripts/update-version.js <patch|minor|major> [mensaje] [--commit]');
  console.error('   Ejemplo: node scripts/update-version.js minor "Fix token authentication"');
  console.error('   Con auto-commit: node scripts/update-version.js minor "Fix auth" --commit');
  process.exit(1);
}

// Verificar que estamos en un repo git limpio
try {
  const gitStatus = execSync('git status --porcelain', { encoding: 'utf8' });
  if (gitStatus.trim() && !autoCommit) {
    console.error('❌ Hay cambios sin commitear. Haz commit primero o usa --commit');
    console.error('   git add . && git commit -m "cambios pendientes"');
    process.exit(1);
  }
} catch (error) {
  console.error('❌ No estás en un repositorio Git');
  process.exit(1);
}

// Leer archivo de versión actual
const versionPath = path.join(__dirname, '../src/constants/version.ts');
const versionContent = fs.readFileSync(versionPath, 'utf8');

// Extraer versión actual
const versionMatch = versionContent.match(/VERSION: '(\d+)\.(\d+)\.(\d+)'/);
if (!versionMatch) {
  console.error('❌ No se pudo encontrar la versión en el archivo');
  process.exit(1);
}

let [, major, minor, patch] = versionMatch.map(Number);
const oldVersion = `${major}.${minor}.${patch}`;

// Incrementar según el tipo
switch (versionType) {
  case 'patch':
    patch++;
    break;
  case 'minor':
    minor++;
    patch = 0;
    break;
  case 'major':
    major++;
    minor = 0;
    patch = 0;
    break;
}

const newVersion = `${major}.${minor}.${patch}`;
const today = new Date().toISOString().split('T')[0];

// Actualizar contenido del archivo
let newContent = versionContent
  .replace(/VERSION: '\d+\.\d+\.\d+'/, `VERSION: '${newVersion}'`)
  .replace(/BUILD_DATE: '\d{4}-\d{2}-\d{2}'/, `BUILD_DATE: '${today}'`);

// Actualizar changelog
const changelogRegex = /(CHANGELOG: \{[^}]*)'([^']+)': '[^']*'/;
if (changelogRegex.test(newContent)) {
  newContent = newContent.replace(changelogRegex, `$1'${newVersion}': '${message}'`);
} else {
  // Si no existe el changelog, agregarlo
  newContent = newContent.replace(
    /(CHANGELOG: \{)/,
    `$1\n    '${newVersion}': '${message}',`
  );
}

// Escribir archivo actualizado
fs.writeFileSync(versionPath, newContent);

console.log(`✅ Versión actualizada: ${oldVersion} → ${newVersion}`);
console.log(`📝 Mensaje: ${message}`);
console.log(`📅 Fecha: ${today}`);

if (autoCommit) {
  try {
    // Auto-commit usando Commitizen (deshabilitar Husky)
    execSync('git add .', { stdio: 'inherit' });
    
    console.log('');
    console.log('🎯 Usando Commitizen para el commit...');
    console.log(`📝 Sugerencia: Selecciona "feat" y usa: "${message}"`);
    
    // Usar Commitizen para el commit con Husky deshabilitado
    execSync('HUSKY=0 npx cz', { stdio: 'inherit', env: { ...process.env, HUSKY: '0' } });
    
    // Crear tag después del commit
    execSync(`git tag v${newVersion}`, { stdio: 'inherit' });
    
    console.log('');
    console.log('✅ Commit con Commitizen y tag creados');
    console.log('🚀 Para deployar:');
    console.log('   git push && git push --tags');
  } catch (error) {
    console.error('❌ Error en auto-commit:', error.message);
    console.log('💡 Tip: Puedes hacer el commit manualmente y luego crear el tag:');
    console.log(`   HUSKY=0 git commit -m "v${newVersion}: ${message}"`);
    console.log(`   git tag v${newVersion}`);
    process.exit(1);
  }
} else {
  console.log('');
  console.log('🚀 Próximos pasos:');
  console.log('   git add .');
  console.log('   npx cz  # Usar Commitizen');
  console.log(`   git tag v${newVersion}`);
  console.log('   git push && git push --tags');
  console.log('');
  console.log('💡 O usar el comando con auto-commit:');
  console.log(`   npm run version:${versionType}:commit "${message}"`);
}

console.log('');
console.log('🔄 Para rollback en caso de problemas:');
console.log(`   git revert v${newVersion}`);
console.log(`   # O volver a versión anterior:`);
console.log(`   git reset --hard v${oldVersion}`);
console.log(`   # O usar el script de rollback:`);
console.log(`   npm run version:rollback v${oldVersion}`);