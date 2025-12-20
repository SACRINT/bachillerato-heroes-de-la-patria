const http = require('http');

const options = {
    hostname: 'localhost',
    port: 3001,
    path: '/api/citas-improved/available-slots?fecha=2025-12-19&departamento=administracion',
    method: 'GET'
};

const req = http.request(options, (res) => {
    let data = '';
    res.on('data', (chunk) => {
        data += chunk;
    });
    res.on('end', () => {
        console.log(data);
    });
});

req.on('error', (error) => {
    console.error(error);
});

req.end();
