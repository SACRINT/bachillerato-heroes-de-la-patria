const http = require('http');

function postLogin() {
    console.log('Attempting login on port 3002...');
    const data = JSON.stringify({
        email: 'profesor@heroespatria.edu.mx',
        password: 'HeroesPatria2024!'
    });

    const options = {
        hostname: 'localhost',
        port: 3002,
        path: '/api/teachers-portal/login',
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Content-Length': data.length
        }
    };

    const req = http.request(options, (res) => {
        let body = '';
        res.on('data', (d) => body += d);
        res.on('end', () => {
            console.log('Login Status:', res.statusCode);
            if (res.statusCode !== 200) {
                console.log('Login Body:', body);
                return;
            }

            const json = JSON.parse(body);
            if (json.success && json.token) {
                console.log('Login Success. Token received.');
                getDashboard(json.token);
            } else {
                console.log('Login Failed:', json);
            }
        });
    });

    req.on('error', (e) => console.error('Login Error:', e));
    req.write(data);
    req.end();
}

function getDashboard(token) {
    console.log('Fetching dashboard...');
    const options = {
        hostname: 'localhost',
        port: 3002,
        path: '/api/teachers-portal/dashboard',
        method: 'GET',
        headers: {
            'Authorization': 'Bearer ' + token
        }
    };

    const req = http.request(options, (res) => {
        let body = '';
        res.on('data', (d) => body += d);
        res.on('end', () => {
            console.log('Dashboard Status:', res.statusCode);
            const json = JSON.parse(body);

            if (res.statusCode === 200) {
                if (json.data && json.data.teacher) {
                    console.log('VERIFICATION SUCCESS: Teacher data present:', json.data.teacher);
                    console.log('Stats:', json.data.stats);
                } else {
                    console.log('VERIFICATION FAILED: Teacher data missing.');
                    console.log('Data:', json.data);
                }
            } else {
                console.log('Dashboard Error Body:', body);
            }
        });
    });

    req.on('error', (e) => console.error('Dashboard Error:', e));
    req.end();
}

postLogin();
