/**
 * Script para aplicar paginación al CMS Manager
 * Modifica loadEventosExistentes, loadAvisosExistentes y loadComunicadosExistentes
 */

const fs = require('fs');
const path = require('path');

const cmsFilePath = path.join(__dirname, '../../js/cms-manager.js');

// Leer el archivo
let content = fs.readFileSync(cmsFilePath, 'utf8');

// Aplicar cambios a loadEventosExistentes
content = content.replace(
    /async loadEventosExistentes\(\) \{/,
    'async loadEventosExistentes(page = 1) {'
);

content = content.replace(
    /const result = await this\.fetchAPI\('eventos\?limit=100'\);(\s+)const eventos = result\.data \|\| \[\];/,
    `const limit = this.pagination.eventos.limit;
            const offset = (page - 1) * limit;
            const result = await this.fetchAPI(\`eventos?limit=\${limit}&offset=\${offset}\`);
            const eventos = result.data || [];
            const total = result.total || eventos.length;`
);

// Agregar lógica de paginación para eventos (buscar el final del innerHTML de la tabla)
content = content.replace(
    /(container\.innerHTML = html;)(\s+)(} catch \(error\) \{[\s\S]*?console\.error\('Error cargando eventos:', error\);)/,
    `$1

            // Actualizar paginación
            this.pagination.eventos.total = total;
            this.pagination.eventos.page = page;

            // Inicializar o actualizar PaginationManager
            if (!this.paginationManagers.eventos) {
                this.paginationManagers.eventos = new PaginationManager({
                    containerId: 'eventosPaginationContainer',
                    itemsPerPage: limit,
                    totalItems: total,
                    currentPage: page,
                    onPageChange: (newPage) => this.loadEventosExistentes(newPage)
                });
                window.paginationManagers['eventosPaginationContainer'] = this.paginationManagers.eventos;
            } else {
                this.paginationManagers.eventos.updateTotalItems(total);
                this.paginationManagers.eventos.currentPage = page;
            }

            this.paginationManagers.eventos.render();

        $3`
);

// Aplicar cambios a loadAvisosExistentes
content = content.replace(
    /async loadAvisosExistentes\(\) \{/,
    'async loadAvisosExistentes(page = 1) {'
);

content = content.replace(
    /const result = await this\.fetchAPI\('avisos\?limit=100'\);(\s+)const avisos = result\.data \|\| \[\];/,
    `const limit = this.pagination.avisos.limit;
            const offset = (page - 1) * limit;
            const result = await this.fetchAPI(\`avisos?limit=\${limit}&offset=\${offset}\`);
            const avisos = result.data || [];
            const total = result.total || avisos.length;`
);

// Buscar el lugar específico para avisos donde se hace container.innerHTML = html y está antes del catch
const avisosTableEnd = content.indexOf("container.innerHTML = html;", content.indexOf("async loadAvisosExistentes"));
if (avisosTableEnd !== -1) {
    // Encontrar el siguiente } catch para avisos
    let searchStart = avisosTableEnd + 30;
    let catchIndex = content.indexOf("} catch (error) {", searchStart);
    let errorLogIndex = content.indexOf("console.error('Error cargando avisos:", catchIndex);

    if (catchIndex !== -1 && errorLogIndex !== -1) {
        const beforeCatch = content.substring(0, catchIndex);
        const afterCatch = content.substring(catchIndex);

        const paginationCode = `

            // Actualizar paginación
            this.pagination.avisos.total = total;
            this.pagination.avisos.page = page;

            // Inicializar o actualizar PaginationManager
            if (!this.paginationManagers.avisos) {
                this.paginationManagers.avisos = new PaginationManager({
                    containerId: 'avisosPaginationContainer',
                    itemsPerPage: limit,
                    totalItems: total,
                    currentPage: page,
                    onPageChange: (newPage) => this.loadAvisosExistentes(newPage)
                });
                window.paginationManagers['avisosPaginationContainer'] = this.paginationManagers.avisos;
            } else {
                this.paginationManagers.avisos.updateTotalItems(total);
                this.paginationManagers.avisos.currentPage = page;
            }

            this.paginationManagers.avisos.render();

        `;

        content = beforeCatch + paginationCode + afterCatch;
    }
}

// Aplicar cambios a loadComunicadosExistentes
content = content.replace(
    /async loadComunicadosExistentes\(\) \{/,
    'async loadComunicadosExistentes(page = 1) {'
);

content = content.replace(
    /const result = await this\.fetchAPI\('comunicados\?limit=100'\);(\s+)const comunicados = result\.data \|\| \[\];/,
    `const limit = this.pagination.comunicados.limit;
            const offset = (page - 1) * limit;
            const result = await this.fetchAPI(\`comunicados?limit=\${limit}&offset=\${offset}\`);
            const comunicados = result.data || [];
            const total = result.total || comunicados.length;`
);

// Similar para comunicados
const comunicadosTableEnd = content.indexOf("container.innerHTML = html;", content.indexOf("async loadComunicadosExistentes"));
if (comunicadosTableEnd !== -1) {
    let searchStart = comunicadosTableEnd + 30;
    let catchIndex = content.indexOf("} catch (error) {", searchStart);
    let errorLogIndex = content.indexOf("console.error('Error cargando comunicados:", catchIndex);

    if (catchIndex !== -1 && errorLogIndex !== -1) {
        const beforeCatch = content.substring(0, catchIndex);
        const afterCatch = content.substring(catchIndex);

        const paginationCode = `

            // Actualizar paginación
            this.pagination.comunicados.total = total;
            this.pagination.comunicados.page = page;

            // Inicializar o actualizar PaginationManager
            if (!this.paginationManagers.comunicados) {
                this.paginationManagers.comunicados = new PaginationManager({
                    containerId: 'comunicadosPaginationContainer',
                    itemsPerPage: limit,
                    totalItems: total,
                    currentPage: page,
                    onPageChange: (newPage) => this.loadComunicadosExistentes(newPage)
                });
                window.paginationManagers['comunicadosPaginationContainer'] = this.paginationManagers.comunicados;
            } else {
                this.paginationManagers.comunicados.updateTotalItems(total);
                this.paginationManagers.comunicados.currentPage = page;
            }

            this.paginationManagers.comunicados.render();

        `;

        content = beforeCatch + paginationCode + afterCatch;
    }
}

// Guardar el archivo modificado
fs.writeFileSync(cmsFilePath, content, 'utf8');

console.log('✅ Paginación aplicada a cms-manager.js');
console.log('📁 Archivo modificado:', cmsFilePath);

// Copiar a public
const publicCmsFilePath = path.join(__dirname, '../../public/js/cms-manager.js');
fs.copyFileSync(cmsFilePath, publicCmsFilePath);
console.log('✅ Archivo copiado a:', publicCmsFilePath);
