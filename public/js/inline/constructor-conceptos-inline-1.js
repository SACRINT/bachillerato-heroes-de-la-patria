// Local Maps Database for offline and dynamic gameplay
const CONCEPT_MAPS_DB = {
    biologia: [
        {
            id: 'bio_fotosintesis',
            title: 'Fotosíntesis y Cloroplastos',
            description: 'Conecta los reactivos, procesos y productos del metabolismo vegetal',
            difficulty: 'easy',
            points: 50,
            hints: 3,
            nodes: [
                { id: 'n_central', label: '🌿 Fotosíntesis', type: 'central', x: 50, y: 50 },
                { id: 'n_luz', label: '☀️ Luz Solar', type: 'node', x: 20, y: 20 },
                { id: 'n_clorofila', label: '🔬 Clorofila', type: 'node', x: 20, y: 80 },
                { id: 'n_co2', label: '💨 CO₂ y Agua', type: 'node', x: 80, y: 20 },
                { id: 'n_glucosa', label: '🍎 Glucosa y O₂', type: 'node', x: 80, y: 80 }
            ],
            connections: [
                { from: 'n_luz', to: 'n_central', label: 'es absorbida por', hint: 'La energía radiante es captada en el proceso' },
                { from: 'n_central', to: 'n_clorofila', label: 'ocurre dentro de', hint: 'El pigmento verde se encuentra en los cloroplastos' },
                { from: 'n_co2', to: 'n_central', label: 'sirve como reactivo para', hint: 'El dióxido de carbono y el agua ingresan a la reacción' },
                { from: 'n_central', to: 'n_glucosa', label: 'produce y libera', hint: 'El azúcar energético y el oxígeno son el resultado' }
            ],
            availableLabels: [
                'es absorbida por',
                'ocurre dentro de',
                'sirve como reactivo para',
                'produce y libera',
                'destruye moléculas de',
                'reemplaza el ciclo de'
            ]
        },
        {
            id: 'bio_celula',
            title: 'Estructura de la Célula Eucariota',
            description: 'Identifica las funciones vitales de los orgánulos celulares',
            difficulty: 'medium',
            points: 60,
            hints: 3,
            nodes: [
                { id: 'n_central', label: '🧬 Célula Eucariota', type: 'central', x: 50, y: 50 },
                { id: 'n_nucleo', label: '🏛️ Núcleo', type: 'node', x: 22, y: 22 },
                { id: 'n_mito', label: '⚡ Mitocondria', type: 'node', x: 78, y: 22 },
                { id: 'n_ribo', label: '🧱 Ribosomas', type: 'node', x: 22, y: 78 },
                { id: 'n_membrana', label: '🛡️ Membrana Plasmática', type: 'node', x: 78, y: 78 }
            ],
            connections: [
                { from: 'n_nucleo', to: 'n_central', label: 'resguarda el ADN de', hint: 'El material genético reside en su interior' },
                { from: 'n_mito', to: 'n_central', label: 'genera energía ATP para', hint: 'Es la central energética celular' },
                { from: 'n_ribo', to: 'n_central', label: 'sintetiza proteínas en', hint: 'Fabrica las cadenas de aminoácidos' },
                { from: 'n_membrana', to: 'n_central', label: 'regula el transporte de', hint: 'Capa bilipídica que controla entradas y salidas' }
            ],
            availableLabels: [
                'resguarda el ADN de',
                'genera energía ATP para',
                'sintetiza proteínas en',
                'regula el transporte de',
                'bloquea la mitosis en',
                'desintegra el citoplasma de'
            ]
        }
    ],
    historia: [
        {
            id: 'hist_revolucion',
            title: 'Revolución Mexicana de 1910',
            description: 'Relaciona los principales líderes caudillos con sus proclamaciones y planes',
            difficulty: 'medium',
            points: 60,
            hints: 3,
            nodes: [
                { id: 'n_central', label: '⚔️ Revolución Mexicana', type: 'central', x: 50, y: 50 },
                { id: 'n_madero', label: '📜 Francisco I. Madero', type: 'node', x: 20, y: 20 },
                { id: 'n_plan_sl', label: '🏛️ Plan de San Luis', type: 'node', x: 20, y: 80 },
                { id: 'n_zapata', label: '🌾 Emiliano Zapata', type: 'node', x: 80, y: 20 },
                { id: 'n_plan_ayala', label: '🚜 Plan de Ayala', type: 'node', x: 80, y: 80 }
            ],
            connections: [
                { from: 'n_madero', to: 'n_central', label: 'inició el movimiento de', hint: 'Convocó al levantamiento contra Porfirio Díaz' },
                { from: 'n_madero', to: 'n_plan_sl', label: 'proclamó el', hint: 'Lema: Sufragio Efectivo, No Reelección' },
                { from: 'n_zapata', to: 'n_central', label: 'lideró el ala agraria en', hint: 'Caudillo del Sur en defensa de los campesinos' },
                { from: 'n_zapata', to: 'n_plan_ayala', label: 'promulgó el', hint: 'Lema: Tierra y Libertad' }
            ],
            availableLabels: [
                'inició el movimiento de',
                'proclamó el',
                'lideró el ala agraria en',
                'promulgó el',
                'firmó el Tratado de Versalles con',
                'declaró la monarquía en'
            ]
        }
    ],
    matematicas: [
        {
            id: 'mat_ecuaciones',
            title: 'Ecuaciones Cuadráticas: ax² + bx + c = 0',
            description: 'Comprende los métodos de resolución, propiedades del discriminante y parábola',
            difficulty: 'hard',
            points: 75,
            hints: 3,
            nodes: [
                { id: 'n_central', label: '📐 Ecuación Cuadrática', type: 'central', x: 50, y: 50 },
                { id: 'n_discr', label: '🔍 Discriminante (Δ = b²-4ac)', type: 'node', x: 22, y: 22 },
                { id: 'n_formula', label: '✏️ Fórmula General', type: 'node', x: 78, y: 22 },
                { id: 'n_parabola', label: '📈 Parábola y Vértice', type: 'node', x: 22, y: 78 },
                { id: 'n_raices', label: '🎯 Raíces o Soluciones', type: 'node', x: 78, y: 78 }
            ],
            connections: [
                { from: 'n_discr', to: 'n_central', label: 'clasifica el tipo de raíces de', hint: 'Si Δ > 0 dos reales, si Δ = 0 una, si Δ < 0 complejas' },
                { from: 'n_formula', to: 'n_central', label: 'permite resolver analíticamente', hint: 'x = (-b ± √Δ) / 2a' },
                { from: 'n_parabola', to: 'n_central', label: 'es la gráfica asociada a', hint: 'Curva simétrica con eje vertical' },
                { from: 'n_central', to: 'n_raices', label: 'cruza el eje X en las', hint: 'Intersecciones horizontales donde y = 0' }
            ],
            availableLabels: [
                'clasifica el tipo de raíces de',
                'permite resolver analíticamente',
                'es la gráfica asociada a',
                'cruza el eje X en las',
                'deriva infinitamente hacia',
                'calcula el cateto opuesto de'
            ]
        }
    ],
    quimica: [
        {
            id: 'quim_enlaces',
            title: 'Enlaces Químicos y Valencia',
            description: 'Descubre cómo interactúan los átomos para formar moléculas estables',
            difficulty: 'medium',
            points: 60,
            hints: 3,
            nodes: [
                { id: 'n_central', label: '⚗️ Enlace Químico', type: 'central', x: 50, y: 50 },
                { id: 'n_covalente', label: '🤝 Enlace Covalente', type: 'node', x: 20, y: 20 },
                { id: 'n_ionico', label: '⚡ Enlace Iónico', type: 'node', x: 80, y: 20 },
                { id: 'n_valencia', label: '⚛️ Electrones de Valencia', type: 'node', x: 20, y: 80 },
                { id: 'n_octeto', label: '🛡️ Regla del Octeto', type: 'node', x: 80, y: 80 }
            ],
            connections: [
                { from: 'n_covalente', to: 'n_central', label: 'es un tipo basado en compartir con', hint: 'Se comparten pares de electrones entre no metales' },
                { from: 'n_ionico', to: 'n_central', label: 'es un tipo basado en transferir a', hint: 'Atracción electrostática entre catión y anión' },
                { from: 'n_valencia', to: 'n_central', label: 'determinan la capacidad de', hint: 'Los electrones de la capa más externa forman enlaces' },
                { from: 'n_central', to: 'n_octeto', label: 'busca la estabilidad según la', hint: 'Los átomos buscan 8 electrones de valencia' }
            ],
            availableLabels: [
                'es un tipo basado en compartir con',
                'es un tipo basado en transferir a',
                'determinan la capacidad de',
                'busca la estabilidad según la',
                'fusiona el núcleo atómico de',
                'desintegra el neutrón de'
            ]
        }
    ]
};

// State
let state = {
    sessionId: null,
    topic: null,
    map: null,
    selectedLabel: null,
    userConnections: {},
    usedLabels: [],
    attempts: 0,
    hintsRemaining: 3
};

// Elements
const menuScreen = document.getElementById('menuScreen');
const canvasScreen = document.getElementById('canvasScreen');
const resultsScreen = document.getElementById('resultsScreen');
const topicGrid = document.getElementById('topicGrid');
const mapList = document.getElementById('mapList');
const mapsContainer = document.getElementById('mapsContainer');
const canvasContainer = document.getElementById('canvasContainer');
const svgConnections = document.getElementById('svgConnections');
const labelsContainer = document.getElementById('labelsContainer');

// Init
document.addEventListener('DOMContentLoaded', () => {
    setupTopicSelection();
    const submitBtn = document.getElementById('submitBtn');
    if (submitBtn) submitBtn.addEventListener('click', submitSolution);

    const hintBtn = document.getElementById('hintBtn');
    if (hintBtn) hintBtn.addEventListener('click', getHint);

    const backToMapsBtn = document.getElementById('backToMapsBtn');
    if (backToMapsBtn) backToMapsBtn.addEventListener('click', () => showScreen('menu'));

    const playAgainBtn = document.getElementById('playAgainBtn');
    if (playAgainBtn) playAgainBtn.addEventListener('click', () => showScreen('menu'));
});

// Topic selection
function setupTopicSelection() {
    if (!topicGrid) return;
    topicGrid.querySelectorAll('.topic-card').forEach(card => {
        card.addEventListener('click', () => {
            topicGrid.querySelectorAll('.topic-card').forEach(c => c.classList.remove('selected'));
            card.classList.add('selected');
            const topic = card.dataset.topic;
            state.topic = topic;
            loadMaps(topic);
        });
    });
}

// Load maps
async function loadMaps(topic) {
    let maps = CONCEPT_MAPS_DB[topic] || [];

    // Attempt backend fetch if available
    try {
        const res = await fetch('/api/games/concepts/maps/' + topic);
        if (res.ok) {
            const data = await res.json();
            if (data.success && data.maps && data.maps.length > 0) {
                maps = data.maps;
            }
        }
    } catch (e) {}

    if (!mapsContainer) return;
    mapsContainer.innerHTML = maps.map(m => `
        <div class="map-card" data-map-id="${m.id}">
            <div class="map-info">
                <h3>${m.title}</h3>
                <p>${m.description}</p>
            </div>
            <div class="map-meta">
                <span class="difficulty-badge ${m.difficulty}">${getDiffLabel(m.difficulty)}</span>
                <span class="points-badge">+${m.points} pts</span>
            </div>
        </div>
    `).join('');

    mapsContainer.querySelectorAll('.map-card').forEach(card => {
        card.addEventListener('click', () => startMap(card.dataset.mapId));
    });

    if (mapList) mapList.classList.add('active');
}

function getDiffLabel(d) {
    return { easy: 'Fácil', medium: 'Medio', hard: 'Difícil' }[d] || d;
}

// Start map
function startMap(mapId) {
    const topicMaps = CONCEPT_MAPS_DB[state.topic] || [];
    const selected = topicMaps.find(m => m.id === mapId) || topicMaps[0];

    if (!selected) return;

    state.sessionId = 'session_' + Date.now();
    state.map = selected;
    state.userConnections = {};
    state.usedLabels = [];
    state.attempts = 0;
    state.hintsRemaining = selected.hints || 3;

    const hintsCountEl = document.getElementById('hintsCount');
    if (hintsCountEl) hintsCountEl.textContent = state.hintsRemaining;

    renderMap(selected);
    showScreen('canvas');
}

// Render map
function renderMap(map) {
    const mapTitleEl = document.getElementById('mapTitle');
    const mapDescEl = document.getElementById('mapDescription');
    if (mapTitleEl) mapTitleEl.textContent = map.title;
    if (mapDescEl) mapDescEl.textContent = map.description;

    if (!canvasContainer) return;

    // Remove existing nodes and labels (keep SVG)
    const existingNodes = canvasContainer.querySelectorAll('.concept-node, .connection-label');
    existingNodes.forEach(el => el.remove());

    // Render SVG lines
    if (svgConnections) {
        svgConnections.innerHTML = '';
        map.connections.forEach(conn => {
            const fromNode = map.nodes.find(n => n.id === conn.from);
            const toNode = map.nodes.find(n => n.id === conn.to);
            if (fromNode && toNode) {
                const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
                line.setAttribute('x1', fromNode.x + '%');
                line.setAttribute('y1', fromNode.y + '%');
                line.setAttribute('x2', toNode.x + '%');
                line.setAttribute('y2', toNode.y + '%');
                line.setAttribute('stroke', '#6366f1');
                line.setAttribute('stroke-width', '2');
                line.setAttribute('stroke-dasharray', '5,5');
                line.setAttribute('opacity', '0.6');
                svgConnections.appendChild(line);
            }
        });
    }

    // Render nodes
    map.nodes.forEach(node => {
        const el = document.createElement('div');
        el.className = 'concept-node ' + (node.type === 'central' ? 'central' : '');
        el.style.left = node.x + '%';
        el.style.top = node.y + '%';
        el.textContent = node.label;
        el.dataset.id = node.id;
        canvasContainer.appendChild(el);
    });

    // Render connection labels
    map.connections.forEach((conn, i) => {
        const fromNode = map.nodes.find(n => n.id === conn.from);
        const toNode = map.nodes.find(n => n.id === conn.to);

        const midX = (fromNode.x + toNode.x) / 2;
        const midY = (fromNode.y + toNode.y) / 2;

        const label = document.createElement('div');
        label.className = 'connection-label';
        label.style.left = midX + '%';
        label.style.top = midY + '%';
        label.textContent = '?';
        label.dataset.index = i;
        label.dataset.from = conn.from;
        label.dataset.to = conn.to;

        label.addEventListener('click', () => assignLabel(label));
        canvasContainer.appendChild(label);
    });

    // Render available labels
    if (labelsContainer) {
        labelsContainer.innerHTML = map.availableLabels.map(l => `
            <div class="label-chip" data-label="${l}">${l}</div>
        `).join('');

        labelsContainer.querySelectorAll('.label-chip').forEach(chip => {
            chip.addEventListener('click', () => selectLabel(chip));
        });
    }
}

// Select label
function selectLabel(chip) {
    if (chip.classList.contains('used')) return;

    if (labelsContainer) {
        labelsContainer.querySelectorAll('.label-chip').forEach(c => c.classList.remove('selected'));
    }
    chip.classList.add('selected');
    state.selectedLabel = chip.dataset.label;
}

// Assign label to connection
function assignLabel(connLabel) {
    if (!state.selectedLabel) {
        alert('💡 Selecciona primero una de las etiquetas de abajo para asignarla a este conector.');
        return;
    }

    const index = connLabel.dataset.index;
    const prevLabel = state.userConnections[index];

    // Remove previous label from used
    if (prevLabel) {
        state.usedLabels = state.usedLabels.filter(l => l !== prevLabel);
        if (labelsContainer) {
            const prevChip = labelsContainer.querySelector(`[data-label="${prevLabel}"]`);
            if (prevChip) prevChip.classList.remove('used');
        }
    }

    // Assign new
    state.userConnections[index] = state.selectedLabel;
    connLabel.textContent = state.selectedLabel;
    connLabel.classList.add('filled');
    connLabel.classList.remove('correct', 'incorrect');

    // Mark as used
    state.usedLabels.push(state.selectedLabel);
    if (labelsContainer) {
        const currentChip = labelsContainer.querySelector(`[data-label="${state.selectedLabel}"]`);
        if (currentChip) {
            currentChip.classList.add('used');
            currentChip.classList.remove('selected');
        }
    }

    state.selectedLabel = null;
}

// Submit solution
function submitSolution() {
    state.attempts++;
    const totalConnections = state.map.connections.length;
    let correctCount = 0;

    state.map.connections.forEach((conn, i) => {
        const userAns = state.userConnections[i];
        const isCorrect = (userAns === conn.label);
        if (isCorrect) correctCount++;

        const labelEl = canvasContainer ? canvasContainer.querySelector(`[data-index="${i}"]`) : null;
        if (labelEl) {
            labelEl.classList.remove('filled');
            labelEl.classList.add(isCorrect ? 'correct' : 'incorrect');
            if (!isCorrect) {
                labelEl.textContent = conn.label;
            }
        }
    });

    if (correctCount === totalConnections) {
        const baseCoins = Math.round(state.map.points / 2);
        const bonus = state.attempts === 1 ? 15 : 5;
        const totalCoins = baseCoins + bonus;
        const xpEarned = totalCoins * 2;

        // Award coins backend sync with local fallback
        const token = sessionStorage.getItem('bge_auth_token') ||
            localStorage.getItem('bge_auth_token') ||
            sessionStorage.getItem('authToken') ||
            localStorage.getItem('authToken');

        if (token) {
            fetch('/api/iacoins/earn', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    amount: totalCoins,
                    xp_amount: xpEarned,
                    description: `Constructor de Conceptos - ${state.map.title || 'Mapa completado'}`,
                    reference_type: 'concept_builder',
                    reference_id: state.map.id
                })
            }).then(res => res.json()).then(data => {
                if (data && data.data && data.data.newBalance !== undefined) {
                    localStorage.setItem('bge_iacoins_balance', data.data.newBalance);
                }
            }).catch(e => {
                console.warn('[CONSTRUCTOR] Fallback local wallet update:', e);
                const currentWalletCoins = parseFloat(localStorage.getItem('bge_iacoins_balance') || '250');
                localStorage.setItem('bge_iacoins_balance', currentWalletCoins + totalCoins);
            });
        } else {
            const currentWalletCoins = parseFloat(localStorage.getItem('bge_iacoins_balance') || '250');
            localStorage.setItem('bge_iacoins_balance', currentWalletCoins + totalCoins);
        }

        setTimeout(() => {
            showResults({
                firstTry: state.attempts === 1,
                correct: correctCount,
                total: totalConnections,
                attempts: state.attempts,
                coinsEarned: totalCoins
            });
        }, 1200);
    } else {
        setTimeout(() => {
            alert(`Has acertado ${correctCount} de ${totalConnections} conexiones. Se han mostrado las soluciones en rojo. ¡Inténtalo de nuevo para dominarlo!`);
        }, 1200);
    }
}

// Get hint
function getHint() {
    if (state.hintsRemaining <= 0) {
        alert('Ya has utilizado todas tus pistas para este mapa.');
        return;
    }

    const unassigned = state.map.connections.map((c, i) => ({ ...c, index: i }))
        .filter(c => state.userConnections[c.index] !== c.label);

    if (unassigned.length === 0) {
        alert('¡Todas las conexiones actuales ya están correctas!');
        return;
    }

    const targetConn = unassigned[0];
    state.hintsRemaining--;
    const hintsCountEl = document.getElementById('hintsCount');
    if (hintsCountEl) hintsCountEl.textContent = state.hintsRemaining;

    alert(`💡 PISTA: ${targetConn.hint || `Para conectar "${targetConn.from}" con "${targetConn.to}", la relación correcta es "${targetConn.label}"`}`);
}

// Show results
function showResults(data) {
    showScreen('results');

    const resultsIconEl = document.getElementById('resultsIcon');
    const resultsTitleEl = document.getElementById('resultsTitle');
    const resultCorrectEl = document.getElementById('resultCorrect');
    const resultAttemptsEl = document.getElementById('resultAttempts');
    const resultCoinsEl = document.getElementById('resultCoins');

    if (resultsIconEl) resultsIconEl.textContent = data.firstTry ? '👑' : '🎉';
    if (resultsTitleEl) resultsTitleEl.textContent = data.firstTry ? '¡Perfecto al primer intento!' : '¡Mapa Completado!';
    if (resultCorrectEl) resultCorrectEl.textContent = `${data.correct}/${data.total}`;
    if (resultAttemptsEl) resultAttemptsEl.textContent = data.attempts;
    if (resultCoinsEl) resultCoinsEl.textContent = `+${data.coinsEarned}`;
}

// Show screen
function showScreen(screen) {
    if (menuScreen) menuScreen.classList.remove('active');
    if (canvasScreen) canvasScreen.classList.remove('active');
    if (resultsScreen) resultsScreen.classList.remove('active');

    if (screen === 'menu') {
        if (menuScreen) menuScreen.classList.add('active');
        if (mapList) mapList.classList.remove('active');
        if (topicGrid) topicGrid.querySelectorAll('.topic-card').forEach(c => c.classList.remove('selected'));
    }
    if (screen === 'canvas' && canvasScreen) canvasScreen.classList.add('active');
    if (screen === 'results' && resultsScreen) resultsScreen.classList.add('active');
}
