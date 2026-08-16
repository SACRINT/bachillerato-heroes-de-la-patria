const output = document.getElementById('output');

        function log(msg) {
            output.textContent += msg + '\n';
            console.log(msg);
        }

        async function testAuth() {
            output.textContent = '';
            log('=== TEST AUTENTICACIÃ“N ===');
            log('secureAdminAuth disponible: ' + (!!window.secureAdminAuth));
            log('apiClient disponible: ' + (!!window.apiClient));

            if (window.secureAdminAuth) {
                log('Usuario autenticado: ' + window.secureAdminAuth.isUserAuthenticated());
                const user = window.secureAdminAuth.getCurrentUser();
                log('Usuario actual: ' + JSON.stringify(user, null, 2));
            }

            if (window.apiClient) {
                log('Token disponible: ' + !!window.apiClient.token);
            }
        }

        async function testBolsaTrabajo() {
            output.textContent = '';
            log('=== TEST BOLSA TRABAJO ===');

            try {
                const response = await fetch('/api/bolsa-trabajo');
                log('Status: ' + response.status);
                const data = await response.json();
                log('Response: ' + JSON.stringify(data, null, 2));
            } catch (error) {
                log('ERROR: ' + error.message);
            }
        }

        async function testStudents() {
            output.textContent = '';
            log('=== TEST ESTUDIANTES ===');

            if (!window.apiClient) {
                log('ERROR: apiClient no disponible');
                return;
            }

            try {
                const response = await window.apiClient.request('/api/admin/students?limit=10');
                log('Response: ' + JSON.stringify(response, null, 2));
            } catch (error) {
                log('ERROR: ' + error.message);
            }
        }

        async function testParents() {
            output.textContent = '';
            log('=== TEST PADRES ===');

            if (!window.apiClient) {
                log('ERROR: apiClient no disponible');
                return;
            }

            try {
                const response = await window.apiClient.request('/api/parents');
                log('Response: ' + JSON.stringify(response, null, 2));
            } catch (error) {
                log('ERROR: ' + error.message);
            }
        }

        async function testBGEFramework() {
            output.textContent = '';
            log('=== TEST BGE FRAMEWORK ===');
            log('BGEFramework disponible: ' + (!!window.BGEFramework));
            log('BGEModule disponible: ' + (!!window.BGEModule));
            log('bgeFramework instancia: ' + (!!window.bgeFramework));

            if (window.bgeFramework) {
                log('Framework inicializado: ' + window.bgeFramework.initialized);
                log('Módulos cargados: ' + Array.from(window.bgeFramework.modules.keys()).join(', '));
            }

            // Esperar a que el módulo de seguridad cargue
            setTimeout(() => {
                log('\n--- DESPUÃ‰S DE 2 SEGUNDOS ---');
                log('secureAdminAuth ahora disponible: ' + (!!window.secureAdminAuth));
                if (window.bgeFramework) {
                    log('Módulos cargados ahora: ' + Array.from(window.bgeFramework.modules.keys()).join(', '));
                }
            }, 2000);
        }
