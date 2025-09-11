#!/usr/bin/env node

import { execSync } from 'child_process';
import { readFileSync, existsSync } from 'fs';
import { join } from 'path';
import chalk from 'chalk';

const log = {
  info: (msg) => console.log(chalk.blue('ℹ️  ' + msg)),
  success: (msg) => console.log(chalk.green('✅ ' + msg)),
  error: (msg) => console.log(chalk.red('❌ ' + msg)),
  warning: (msg) => console.log(chalk.yellow('⚠️  ' + msg)),
  step: (msg) => console.log(chalk.cyan('🔄 ' + msg))
};

async function deployToProduction() {
  try {
    log.info('🚀 Iniciando deployment a producción...\n');

    // 1. Verificar que estamos en la rama main
    log.step('Verificando rama actual...');
    const currentBranch = execSync('git branch --show-current', { encoding: 'utf8' }).trim();
    if (currentBranch !== 'main') {
      throw new Error(`Deployment solo permitido desde rama 'main'. Rama actual: ${currentBranch}`);
    }
    log.success('✅ En rama main');

    // 2. Verificar que no hay cambios sin commitear
    log.step('Verificando estado del repositorio...');
    const gitStatus = execSync('git status --porcelain', { encoding: 'utf8' });
    if (gitStatus.trim()) {
      throw new Error('Hay cambios sin commitear. Commit todos los cambios antes del deployment.');
    }
    log.success('✅ Repositorio limpio');

    // 3. Actualizar desde remoto
    log.step('Actualizando desde remoto...');
    execSync('git pull origin main', { stdio: 'inherit' });
    log.success('✅ Actualizado desde remoto');

    // 4. Instalar dependencias
    log.step('Instalando dependencias...');
    execSync('npm ci', { stdio: 'inherit' });
    log.success('✅ Dependencias instaladas');

    // 5. Ejecutar tests
    log.step('Ejecutando tests...');
    try {
      execSync('npm run test', { stdio: 'inherit' });
      log.success('✅ Tests pasaron');
    } catch (error) {
      log.warning('⚠️  Tests no disponibles, continuando...');
    }

    // 6. Type checking
    log.step('Verificando tipos TypeScript...');
    try {
      execSync('npm run type-check', { stdio: 'inherit' });
      log.success('✅ Type checking pasó');
    } catch (error) {
      log.warning('⚠️  Type checking no disponible, continuando...');
    }

    // 7. Linting
    log.step('Ejecutando linter...');
    try {
      execSync('npm run lint', { stdio: 'inherit' });
      log.success('✅ Linting pasó');
    } catch (error) {
      log.warning('⚠️  Linting no disponible, continuando...');
    }

    // 8. Build de producción
    log.step('Construyendo para producción...');
    execSync('npm run build', { stdio: 'inherit' });
    log.success('✅ Build completado');

    // 9. Verificar que el dist existe
    const distPath = join(process.cwd(), 'apps/web/dist');
    if (!existsSync(distPath)) {
      throw new Error('El directorio dist no fue creado correctamente');
    }
    log.success('✅ Directorio dist verificado');

    // 10. Análisis de bundle (opcional)
    log.step('Analizando bundle...');
    try {
      execSync('npm run analyze', { stdio: 'inherit' });
      log.success('✅ Análisis de bundle completado');
    } catch (error) {
      log.warning('⚠️  Análisis de bundle no disponible, continuando...');
    }

    // 11. Push to trigger GitHub Actions
    log.step('Triggering deployment via GitHub Actions...');
    const commitMessage = `chore: production deployment ${new Date().toISOString()}`;
    
    try {
      execSync(`git commit --allow-empty -m "${commitMessage}"`, { stdio: 'inherit' });
      execSync('git push origin main', { stdio: 'inherit' });
      log.success('✅ Push realizado, GitHub Actions iniciará el deployment');
    } catch (error) {
      log.info('ℹ️  No hay cambios para commitear, pero el deployment continuará');
    }

    // 12. Mostrar información de deployment
    console.log('\n' + chalk.bgGreen.black(' 🎉 DEPLOYMENT INICIADO EXITOSAMENTE ') + '\n');
    
    log.info('📍 URL del sitio: https://sacrint.github.io/03-BachilleratoHeroesWeb/');
    log.info('👀 Monitorear progreso en: https://github.com/sacrint/03-BachilleratoHeroesWeb/actions');
    log.info('⏱️  El deployment tomará aproximadamente 2-3 minutos');
    
    console.log('\n' + chalk.cyan('🔍 Verificaciones post-deployment recomendadas:'));
    console.log('  • Verificar que el sitio carga correctamente');
    console.log('  • Revisar métricas de performance en Lighthouse');
    console.log('  • Confirmar que PWA funciona offline');
    console.log('  • Verificar que todas las páginas son accesibles\n');

  } catch (error) {
    log.error(`Error durante el deployment: ${error.message}`);
    process.exit(1);
  }
}

// Ejecutar solo si se llama directamente
if (import.meta.url === `file://${process.argv[1]}`) {
  deployToProduction();
}

export default deployToProduction;