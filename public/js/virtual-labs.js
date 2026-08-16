/**
 * 🧪 VIRTUAL LABS ENGINE
 * Propósito: Simulador de física simple usando Matter.js
 */

const { Engine, Render, Runner, World, Bodies, Mouse, MouseConstraint, Composite } = Matter;

let engine, render, runner;
let sessionId = null;

document.addEventListener('DOMContentLoaded', () => {
    initPhysics();
    loadLabConfig();
});

function initPhysics() {
    // Create Engine
    engine = Engine.create();
    const canvas = document.getElementById('simulation-canvas');

    // Create Renderer
    render = Render.create({
        element: canvas,
        engine: engine,
        options: {
            width: 1000,
            height: 700,
            wireframes: false,
            background: 'white'
        }
    });

    // Add Walls
    const walls = [
        Bodies.rectangle(500, 710, 1000, 20, { isStatic: true, render: { fillStyle: '#e5e7eb' } }), // Floor
        Bodies.rectangle(500, -10, 1000, 20, { isStatic: true }), // Ceiling
        Bodies.rectangle(-10, 350, 20, 700, { isStatic: true }), // Left
        Bodies.rectangle(1010, 350, 20, 700, { isStatic: true }) // Right
    ];
    World.add(engine.world, walls);

    // Add Mouse Control
    const mouse = Mouse.create(render.canvas);
    const mouseConstraint = MouseConstraint.create(engine, {
        mouse: mouse,
        constraint: { stiffness: 0.2, render: { visible: false } }
    });
    World.add(engine.world, mouseConstraint);

    // Start
    Render.run(render);
    runner = Runner.create();
    Runner.run(runner, engine);
}

// --- APP LOGIC ---

async function loadLabConfig() {
    // Mock Load - En producción fetch de API
    const labTitle = document.getElementById('lab-title');
    labTitle.textContent = "Laboratorio: Caída Libre";

    // Populate Materials
    const list = document.getElementById('materials-list');
    const materials = [
        { name: 'Pelota de Tenis', color: '#a3e635', radius: 20 },
        { name: 'Balón de Basket', color: '#ea580c', radius: 40 },
        { name: 'Caja Madera', color: '#92400e', width: 50, height: 50 }
    ];

    list.innerHTML = materials.map(m => `
        <div class="lab-item" draggable="true" ondragstart='dragStartBlob(event, ${JSON.stringify(m)})'>
            <div style="width: 16px; height: 16px; background: ${m.color}; border-radius: 50%;"></div>
            ${m.name}
        </div>
    `).join('');

    // Start Session API call would go here
}

function updateGravity(val) {
    engine.gravity.y = val / 10; // MatterJS default is 1 (~9.8 equivalent scaling)
    document.getElementById('gravity-val').textContent = `${val} m/s²`;
    logData('Gravedad', val);
}

// --- DRAG AND DROP SPWNING ---

window.dragStartBlob = function (e, data) {
    e.dataTransfer.setData('application/json', JSON.stringify(data));
}

window.allowDrop = function (e) { e.preventDefault(); }

window.drop = function (e) {
    e.preventDefault();
    try {
        const data = JSON.parse(e.dataTransfer.getData('application/json'));
        const rect = document.getElementById('simulation-canvas').getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        spawnObject(x, y, data);
    } catch (err) { console.error(err); }
}

function spawnObject(x, y, config) {
    let body;
    if (config.radius) {
        body = Bodies.circle(x, y, config.radius, {
            render: { fillStyle: config.color },
            restitution: 0.9 // Bouncy
        });
    } else {
        body = Bodies.rectangle(x, y, config.width, config.height, {
            render: { fillStyle: config.color }
        });
    }
    World.add(engine.world, body);
    logData('Objeto Agregado', config.name);
}

// --- LOGGING ---

function logData(type, value) {
    const box = document.getElementById('measurements-log');
    const entry = document.createElement('div');
    entry.className = 'log-entry';
    const time = new Date().toLocaleTimeString();
    entry.innerHTML = `
        <div class="d-flex justify-content-between">
            <strong>${type}</strong>
            <span class="log-time">${time}</span>
        </div>
        <div>${value}</div>
    `;
    box.prepend(entry);

    // En producción: enviar a API /api/labs/session/:id/log
}

window.resetSimulation = function () {
    Composite.clear(engine.world, false, true); // Keep static
    // Re-add static walls manually if cleared, or just clear non-static bodies logic
    // For prototype, simple reload:
    location.reload();
}

window.submitLab = async function () {
    const notes = document.getElementById('lab-notes').value;
    const hypothesis = document.getElementById('lab-hypothesis').value;
    const token = localStorage.getItem('bge_auth_token') || sessionStorage.getItem('bge_auth_token');

    const rewardAmount = 50;
    if (token) {
        try {
            await fetch('/api/wallet/earn', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': 'Bearer ' + token
                },
                body: JSON.stringify({
                    amount: rewardAmount,
                    description: 'Laboratorio Virtual completado: ' + (hypothesis ? hypothesis.slice(0, 35) : 'Simulación 2D')
                })
            });
        } catch (err) {
            console.warn('[LAB] Error registrando recompensa en backend:', err);
        }
    }

    let balance = parseFloat(localStorage.getItem('bge_iacoins_balance') || '250.00');
    balance += rewardAmount;
    localStorage.setItem('bge_iacoins_balance', balance);

    alert(`🎉 ¡Laboratorio completado con éxito!\n\n` +
          `• Recompensa: +${rewardAmount} IACoins acreditadas a tu billetera\n` +
          `• Hipótesis: ${hypothesis || 'Registrada'}\n` +
          `• Conclusiones: ${notes || 'Registradas'}\n\n` +
          `Nuevo Saldo: ${balance.toFixed(2)} IACoins`);

    window.location.href = 'gamification-center.html';
};
