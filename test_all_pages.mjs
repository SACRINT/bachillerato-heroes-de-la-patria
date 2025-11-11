import { chromium } from 'playwright';
import { existsSync, writeFileSync } from 'fs';

// Lista de todas las 34 páginas HTML en public/
const pages = [
    'index.html',
    'admin-dashboard.html',
    'estudiantes.html',
    'padres.html',
    'docentes.html',
    'ar-vr-lab.html',
    'aviso-privacidad.html',
    'biblioteca.html',
    'bolsa-trabajo.html',
    'calendario.html',
    'calificaciones.html',
    'chatbot.html',
    'citas.html',
    'comunidad.html',
    'conocenos.html',
    'contacto.html',
    'convocatorias.html',
    'descargas.html',
    'egresados.html',
    'encuestas.html',
    'force-admin.html',
    'normatividad.html',
    'oferta-educativa.html',
    'offline.html',
    'pagos.html',
    'privacidad.html',
    'reglamento.html',
    'servicios.html',
    'sitios-interes.html',
    'soporte.html',
    'terminos.html',
    'test-dashboard.html',
    'transparencia.html',
    'mensajeria.html'
];

async function testAllPages() {
    const browser = await chromium.launch();
    const context = await browser.createContext();
    const results = [];
    let passedCount = 0;
    let failedCount = 0;

    console.log('🚀 Iniciando testing de todas las 34 páginas HTML...\n');
    console.log('═'.repeat(80));

    for (const page of pages) {
        const pageUrl = `http://localhost:3000/${page}`;
        let pageResult = {
            page,
            url: pageUrl,
            status: 'UNKNOWN',
            errors: [],
            warnings: [],
            networkErrors: [],
            loadTime: 0,
            resourceCount: 0
        };

        try {
            const startTime = Date.now();
            const tabPage = await context.newPage();

            // Escuchar errores de consola
            tabPage.on('console', msg => {
                if (msg.type() === 'error') {
                    pageResult.errors.push(msg.text());
                }
                if (msg.type() === 'warning') {
                    pageResult.warnings.push(msg.text());
                }
            });

            // Escuchar errores de red
            tabPage.on('response', response => {
                if (response.status() >= 400) {
                    pageResult.networkErrors.push({
                        url: response.url(),
                        status: response.status(),
                        statusText: response.statusText()
                    });
                }
            });

            // Navegar a la página
            const response = await tabPage.goto(pageUrl, { waitUntil: 'networkidle', timeout: 15000 });
            const loadTime = Date.now() - startTime;
            pageResult.loadTime = loadTime;

            // Obtener recursos cargados
            const resourceCount = await tabPage.evaluate(() => {
                return {
                    scripts: document.querySelectorAll('script').length,
                    stylesheets: document.querySelectorAll('link[rel="stylesheet"]').length,
                    images: document.querySelectorAll('img').length
                };
            });
            pageResult.resourceCount = resourceCount;

            // Determinar estado
            if (response && response.status() === 200 && pageResult.errors.length === 0) {
                pageResult.status = '✅ PASS';
                passedCount++;
            } else if (response && response.status() === 200) {
                pageResult.status = '⚠️ WARN';
                failedCount++;
            } else {
                pageResult.status = '❌ FAIL';
                failedCount++;
            }

            await tabPage.close();

        } catch (error) {
            pageResult.status = '❌ ERROR';
            pageResult.errors.push(error.message);
            failedCount++;
        }

        // Mostrar resultado
        const statusIcon = pageResult.status.substring(0, 2);
        const pageDisplay = page.padEnd(30);
        const statusDisplay = pageResult.status.padEnd(15);
        const timeDisplay = `${pageResult.loadTime}ms`.padStart(8);

        console.log(`${statusIcon} ${pageDisplay} ${statusDisplay} ${timeDisplay}`);

        // Mostrar errores si existen
        if (pageResult.errors.length > 0) {
            console.log(`   ❌ Errores en consola (${pageResult.errors.length}):`);
            pageResult.errors.slice(0, 3).forEach(error => {
                console.log(`      • ${error.substring(0, 70)}...`);
            });
            if (pageResult.errors.length > 3) {
                console.log(`      ... y ${pageResult.errors.length - 3} más`);
            }
        }

        // Mostrar errores de red si existen
        if (pageResult.networkErrors.length > 0) {
            console.log(`   🌐 Errores de red (${pageResult.networkErrors.length}):`);
            pageResult.networkErrors.slice(0, 3).forEach(err => {
                console.log(`      • ${err.status} ${err.url.substring(0, 60)}...`);
            });
            if (pageResult.networkErrors.length > 3) {
                console.log(`      ... y ${pageResult.networkErrors.length - 3} más`);
            }
        }

        results.push(pageResult);
    }

    await context.close();
    await browser.close();

    // Mostrar resumen
    console.log('\n' + '═'.repeat(80));
    console.log('\n📊 RESUMEN DE TESTING\n');
    console.log(`✅ PASARON:  ${passedCount}/${pages.length}`);
    console.log(`❌ FALLARON: ${failedCount}/${pages.length}`);
    console.log(`📈 Tasa de éxito: ${((passedCount / pages.length) * 100).toFixed(1)}%\n`);

    // Listar páginas con problemas
    const problemPages = results.filter(r => !r.status.includes('✅'));
    if (problemPages.length > 0) {
        console.log('🔍 Páginas con problemas:');
        problemPages.forEach(p => {
            console.log(`   • ${p.page} - ${p.status}`);
            if (p.errors.length > 0) {
                console.log(`     Errores: ${p.errors.length}`);
            }
            if (p.networkErrors.length > 0) {
                console.log(`     Errores de red: ${p.networkErrors.length}`);
            }
        });
    } else {
        console.log('🎉 ¡TODAS LAS PÁGINAS PASARON EL TESTING! ✅');
    }

    // Guardar reporte detallado
    const reportPath = 'test-results.json';
    writeFileSync(reportPath, JSON.stringify({
        timestamp: new Date().toISOString(),
        summary: {
            total: pages.length,
            passed: passedCount,
            failed: failedCount,
            successRate: ((passedCount / pages.length) * 100).toFixed(1) + '%'
        },
        results
    }, null, 2));

    console.log(`\n📁 Reporte detallado guardado en: ${reportPath}`);

    // Retornar código de salida
    process.exit(failedCount === 0 ? 0 : 1);
}

testAllPages().catch(error => {
    console.error('Error en testing:', error);
    process.exit(1);
});
