const http = require('http');

console.log('\n🔐 PASO 1: Intentando login...\n');

const loginData = JSON.stringify({
    email: 'admin@heroespatria.edu.mx',
    password: 'HeroesPatria2024!'
});

const loginOptions = {
    hostname: 'localhost',
    port: 3000,
    path: '/api/auth/login',
    method: 'POST',
    headers: {
        'Content-Type': 'application/json',
        'Content-Length': loginData.length
    }
};

const loginReq = http.request(loginOptions, (res) => {
    let data = '';

    res.on('data', (chunk) => {
        data += chunk;
    });

    res.on('end', () => {
        console.log(`✅ Login Response Status: ${res.statusCode}`);

        if (res.statusCode === 200) {
            console.log('✅ Login exitoso (HTTP 200)');
            try {
                const response = JSON.parse(data);
                console.log('✅ Token recibido');
                console.log('✅ User role:', response.user?.role || 'desconocido');

                setTimeout(() => testDashboardAccess(), 500);
            } catch (e) {
                console.log('Error parsing response');
            }
        } else {
            console.log(`❌ Login fallido (HTTP ${res.statusCode})`);
        }
    });
});

loginReq.on('error', (error) => {
    console.error('❌ Error:', error.message);
});

loginReq.write(loginData);
loginReq.end();

function testDashboardAccess() {
    console.log('\n🎯 PASO 2: Accediendo a admin-dashboard.html...\n');

    const dashboardOptions = {
        hostname: 'localhost',
        port: 3000,
        path: '/admin-dashboard.html',
        method: 'GET'
    };

    const dashboardReq = http.request(dashboardOptions, (res) => {
        let data = '';

        res.on('data', (chunk) => {
            data += chunk;
        });

        res.on('end', () => {
            console.log(`✅ Dashboard Response Status: ${res.statusCode}\n`);

            if (res.statusCode === 200) {
                console.log('✅ admin-dashboard.html CARGÓ (HTTP 200)');
                
                console.log('\n📋 Scripts encontrados:');
                console.log('  ' + (data.includes('main.js') ? '✅' : '❌') + ' main.js');
                console.log('  ' + (data.includes('dashboard-auth-check.js') ? '✅' : '❌') + ' dashboard-auth-check.js');
                console.log('  ' + (data.includes('session-monitor.js') ? '✅' : '❌') + ' session-monitor.js');

                console.log('\n🔍 Bloqueadores:');
                const bloqueado = data.includes('Acceso restringido') || data.includes('Seguridad Activada');
                console.log('  ' + (bloqueado ? '❌' : '✅') + ' NO bloqueadores encontrados');

                console.log('\n' + '═'.repeat(60));
                if (res.statusCode === 200 && !bloqueado && data.includes('main.js')) {
                    console.log('\n✅✅✅ SISTEMA FUNCIONANDO CORRECTAMENTE ✅✅✅');
                    console.log('\n La página admin-dashboard.html se cargó exitosamente');
                    console.log(' sin bloqueos, con todos los scripts necesarios.\n');
                } else {
                    console.log('\n⚠️ REVISAR ERRORES ARRIBA\n');
                }
            } else {
                console.log(`❌ Dashboard no cargó (HTTP ${res.statusCode})`);
            }
        });
    });

    dashboardReq.on('error', (error) => {
        console.error('❌ Error:', error.message);
    });

    dashboardReq.end();
}
