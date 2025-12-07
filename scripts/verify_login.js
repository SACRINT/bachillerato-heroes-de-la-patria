
import http from 'http';

const data = JSON.stringify({
    username: 'admin',
    password: 'admin123'
});

const options = {
    hostname: 'localhost',
    port: 3000,
    path: '/api/auth/login',
    method: 'POST',
    headers: {
        'Content-Type': 'application/json',
        'Content-Length': data.length
    }
};

const req = http.request(options, (res) => {
    console.log(`STATUS: ${res.statusCode}`);

    let body = '';
    res.on('data', (chunk) => { body += chunk; });
    res.on('end', () => {
        try {
            const parsed = JSON.parse(body);
            if (parsed.success) {
                console.log('LOGIN SUCCESS!');
                console.log('Token:', parsed.tokens.accessToken.substring(0, 20) + '...');
                console.log('Role:', parsed.user.role);
            } else {
                console.log('LOGIN FAILED:', parsed.message);
            }
        } catch (e) {
            console.log('BODY:', body);
        }
    });
});

req.on('error', (e) => {
    console.error(`problem with request: ${e.message}`);
});

req.write(data);
req.end();
