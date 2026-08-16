// Utilidades de Output
        function log(message, type = 'info') {
            const output = document.getElementById('output');
            const timestamp = new Date().toLocaleTimeString();
            const prefix = type === 'error' ? '❌' : type === 'success' ? '✅' : 'ℹ️';
            output.textContent += `[${timestamp}] ${prefix} ${message}\n`;
            output.scrollTop = output.scrollHeight;
            console.log(`[TEST-LOGIN] ${message}`);
        }

        function clearOutput() {
            document.getElementById('output').textContent = 'Output limpiado.\n';
            log('Output limpiado', 'success');
        }

        function updateStatus(message, type = 'info') {
            const status = document.getElementById('status');
            status.textContent = message;
            status.className = `status ${type}`;
        }

        // Test de Login
        async function testLogin() {
            const email = document.getElementById('email').value;
            const password = document.getElementById('password').value;
            const remember = document.getElementById('remember').checked;

            log('=== INICIANDO TEST DE LOGIN ===');
            log(`Email: ${email}`);
            log(`Password: ${'*'.repeat(password.length)}`);
            log(`Remember: ${remember}`);

            updateStatus('Enviando request...', 'info');

            try {
                log('Enviando POST a /api/auth/login...');

                const response = await fetch('/api/auth/login', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ email, password })
                });

                log(`Status: ${response.status} ${response.statusText}`);

                if (response.ok) {
                    const data = await response.json();
                    log('✅ LOGIN EXITOSO', 'success');
                    log(`Token recibido: ${data.token?.substring(0, 20)}...`);
                    log(`Usuario: ${JSON.stringify(data.user, null, 2)}`);

                    // Guardar en storage
                    sessionStorage.setItem('auth_token', data.token);
                    sessionStorage.setItem('user_data', JSON.stringify(data.user));
                    sessionStorage.setItem('user_role', data.user.role);

                    if (remember) {
                        localStorage.setItem('auth_token', data.token);
                        localStorage.setItem('user_data', JSON.stringify(data.user));
                        localStorage.setItem('remember_me', 'true');
                        log('Sesión guardada en localStorage (30 días)');
                    }

                    updateStatus('✅ Login exitoso! Sesión guardada.', 'success');
                    log('=== TEST COMPLETADO EXITOSAMENTE ===', 'success');

                    // Auto-verificar estado
                    setTimeout(checkAuthState, 500);

                } else {
                    const error = await response.text();
                    log(`❌ LOGIN FALLIDO: ${error}`, 'error');
                    updateStatus('❌ Login fallido. Ver output.', 'error');
                }

            } catch (error) {
                log(`❌ ERROR DE RED: ${error.message}`, 'error');
                updateStatus('❌ Error de red. ¿Servidor corriendo?', 'error');
                console.error(error);
            }
        }

        // Verificar Estado de Autenticación
        function checkAuthState() {
            log('=== VERIFICANDO ESTADO DE AUTENTICACIÓN ===');

            // SessionStorage
            const sessionToken = sessionStorage.getItem('auth_token');
            const sessionUser = sessionStorage.getItem('user_data');
            const sessionRole = sessionStorage.getItem('user_role');

            log('SessionStorage:');
            log(`  auth_token: ${sessionToken ? sessionToken.substring(0, 30) + '...' : 'NO EXISTE'}`);
            log(`  user_data: ${sessionUser || 'NO EXISTE'}`);
            log(`  user_role: ${sessionRole || 'NO EXISTE'}`);

            // LocalStorage
            const localToken = localStorage.getItem('auth_token');
            const localUser = localStorage.getItem('user_data');
            const remember = localStorage.getItem('remember_me');

            log('LocalStorage:');
            log(`  auth_token: ${localToken ? localToken.substring(0, 30) + '...' : 'NO EXISTE'}`);
            log(`  user_data: ${localUser || 'NO EXISTE'}`);
            log(`  remember_me: ${remember || 'NO EXISTE'}`);

            // Estado
            if ((sessionToken || localToken) && (sessionUser || localUser)) {
                try {
                    const userData = JSON.parse(sessionUser || localUser);
                    log('✅ AUTENTICADO', 'success');
                    log(`  Usuario: ${userData.nombre || userData.email}`);
                    log(`  Role: ${userData.role}`);
                    log(`  Email: ${userData.email}`);
                    updateStatus(`✅ Autenticado como: ${userData.nombre || userData.email}`, 'success');
                } catch (e) {
                    log('❌ Error parsing user_data', 'error');
                    updateStatus('❌ Error en datos de usuario', 'error');
                }
            } else {
                log('❌ NO AUTENTICADO', 'error');
                updateStatus('❌ No autenticado', 'error');
            }

            log('=== VERIFICACIÓN COMPLETADA ===');
        }

        // Ver Storage Completo
        function checkStorage() {
            log('=== STORAGE COMPLETO ===');

            // SessionStorage
            log('SessionStorage Keys:');
            Object.keys(sessionStorage).forEach(key => {
                const value = sessionStorage.getItem(key);
                if (value.length > 50) {
                    log(`  ${key}: ${value.substring(0, 50)}...`);
                } else {
                    log(`  ${key}: ${value}`);
                }
            });

            // LocalStorage
            log('LocalStorage Keys:');
            Object.keys(localStorage).forEach(key => {
                const value = localStorage.getItem(key);
                if (value.length > 50) {
                    log(`  ${key}: ${value.substring(0, 50)}...`);
                } else {
                    log(`  ${key}: ${value}`);
                }
            });
        }

        // Limpiar Autenticación
        function clearAuth() {
            log('=== LIMPIANDO AUTENTICACIÓN ===');

            sessionStorage.removeItem('auth_token');
            sessionStorage.removeItem('user_data');
            sessionStorage.removeItem('user_role');

            localStorage.removeItem('auth_token');
            localStorage.removeItem('user_data');
            localStorage.removeItem('remember_me');

            log('✅ Autenticación limpiada', 'success');
            updateStatus('🧹 Autenticación limpiada', 'info');

            setTimeout(checkAuthState, 300);
        }

        // Navegación
        function goTo(path) {
            log(`Navegando a: ${path}`);
            window.location.href = path;
        }

        // Auto-ejecutar al cargar
        window.addEventListener('DOMContentLoaded', () => {
            log('🚀 Página de pruebas cargada');
            log('Verificando estado inicial...');
            checkAuthState();
        });
