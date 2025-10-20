import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Obtener argumentos
const args = process.argv.slice(2);
const targetVersion = args[0];
const force = args.includes('--force');

if (!targetVersion) {
  console.error('❌ Uso: node rollback-version.js <version> [--force]');
  console.error('   Ejemplo: node rollback-version.js v1.2.0');
  console.error('   Con force: node rollback-version.js v1.2.0 --force');
  
  // Mostrar versiones disponibles
  try {
    const tags = execSync('git tag -l "v*" --sort=-version:refname', { encoding: 'utf8' });
    console.log('\n📋 Versiones disponibles:');
    tags.split('\n').filter(tag => tag.trim()).slice(0, 10).forEach(tag => {
      console.log(`   ${tag}`);
    });
  } catch (error) {
    console.log('   (No se pudieron listar las versiones)');
  }
  
  process.exit(1);
}

// Verificar que la versión existe
try {
  execSync(`git rev-parse ${targetVersion}`, { stdio: 'ignore' });
} catch (error) {
  console.error(`❌ La versión ${targetVersion} no existe`);
  process.exit(1);
}

// Advertencia si no es force
if (!force) {
  console.log(`⚠️  ADVERTENCIA: Vas a hacer rollback a ${targetVersion}`);
  console.log('   Esto revertirá todos los cambios posteriores');
  console.log('   Usa --force para confirmar');
  process.exit(1);
}

try {
  // Obtener información de la versión objetivo
  const commitInfo = execSync(`git show ${targetVersion} --format="%h %s" --no-patch`, { encoding: 'utf8' });
  
  console.log(`🔄 Haciendo rollback a ${targetVersion}`);
  console.log(`📝 Commit: ${commitInfo.trim()}`);
  
  // Hacer checkout a la versión objetivo
  execSync(`git checkout ${targetVersion}`, { stdio: 'inherit' });
  
  // Leer la versión del archivo
  const versionPath = path.join(__dirname, '../src/constants/version.ts');
  const versionContent = fs.readFileSync(versionPath, 'utf8');
  const versionMatch = versionContent.match(/VERSION: '([^']+)'/);
  
  if (versionMatch) {
    const fileVersion = versionMatch[1];
    console.log(`✅ Rollback completado a versión ${fileVersion}`);
    
    // Crear un nuevo commit de rollback
    const today = new Date().toISOString().split('T')[0];
    const rollbackMessage = `rollback: revert to version ${fileVersion}`;
    
    // Actualizar fecha de build
    const newContent = versionContent.replace(
      /BUILD_DATE: '\d{4}-\d{2}-\d{2}'/,
      `BUILD_DATE: '${today}'`
    );
    fs.writeFileSync(versionPath, newContent);
    
    execSync('git add .', { stdio: 'inherit' });
    execSync(`git commit -m "${rollbackMessage}"`, { stdio: 'inherit' });
    
    console.log('');
    console.log('🚀 Para deployar el rollback:');
    console.log('   git push --force-with-lease');
    console.log('');
    console.log('⚠️  IMPORTANTE: Notifica al equipo sobre el rollback');
  }
  
} catch (error) {
  console.error('❌ Error durante el rollback:', error.message);
  console.log('');
  console.log('🔧 Para recuperarte manualmente:');
  console.log('   git checkout main');
  console.log('   git reset --hard HEAD');
  process.exit(1);
}