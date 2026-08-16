// Game State
        let gameState = {
            gameId: null,
            category: null,
            questions: [],
            currentIndex: 0,
            score: 0,
            correctAnswers: 0,
            streak: 0,
            maxStreak: 0,
            timer: null,
            timeLeft: 30,
            questionStartTime: null
        };

        // Question Bank
        const QUESTION_BANK = {
            matematicas: [
                { question: '¿Cuál es la derivada de f(x) = x³ - 4x + 7?', options: ['3x² - 4', '3x² - 4x', 'x² - 4', '3x³ - 4'], correct: 0, points: 15, difficulty: 'medium' },
                { question: '¿Cuál es el valor de x en la ecuación: 2x + 8 = 20?', options: ['4', '6', '8', '12'], correct: 1, points: 10, difficulty: 'easy' },
                { question: '¿Cuál es la integral indefinida de ∫ 2x dx?', options: ['x² + C', '2x² + C', 'x + C', '2 + C'], correct: 0, points: 15, difficulty: 'medium' },
                { question: '¿Cuánto vale el seno de 90 grados (π/2 rad)?', options: ['0', '0.5', '1', '-1'], correct: 2, points: 10, difficulty: 'easy' },
                { question: '¿Cuál es el área de un círculo con radio r = 3? (usar π)', options: ['6π', '9π', '12π', '3π'], correct: 1, points: 10, difficulty: 'easy' }
            ],
            historia: [
                { question: '¿En qué año dio inicio la Revolución Mexicana?', options: ['1810', '1910', '1921', '1857'], correct: 1, points: 10, difficulty: 'easy' },
                { question: '¿Quién promulgó la Constitución Política de los Estados Unidos Mexicanos de 1917?', options: ['Venustiano Carranza', 'Francisco I. Madero', 'Emiliano Zapata', 'Porfirio Díaz'], correct: 0, points: 15, difficulty: 'medium' },
                { question: '¿En qué año se consumó la Independencia de México con el Ejército Trigarante?', options: ['1810', '1821', '1824', '1836'], correct: 1, points: 10, difficulty: 'easy' },
                { question: '¿Qué batalla conmemora la victoria del ejército mexicano liderado por Ignacio Zaragoza el 5 de mayo de 1862?', options: ['Batalla de Chapultepec', 'Batalla de Puebla', 'Batalla de Angostura', 'Batalla de Celaya'], correct: 1, points: 10, difficulty: 'easy' },
                { question: '¿Qué documento declaró por primera vez la abolición de la esclavitud en México por Miguel Hidalgo?', options: ['Sentimientos de la Nación', 'Bando de Hidalgo en Guadalajara', 'Plan de Iguala', 'Tratados de Córdoba'], correct: 1, points: 20, difficulty: 'hard' }
            ],
            ciencias: [
                { question: '¿Cuál es el símbolo químico del Oro en la tabla periódica?', options: ['Ag', 'Fe', 'Au', 'Cu'], correct: 2, points: 10, difficulty: 'easy' },
                { question: '¿Cuál es la primera ley de Newton?', options: ['Ley de Inercia', 'Fuerza igual a masa por aceleración', 'Acción y Reacción', 'Ley de Gravitación'], correct: 0, points: 10, difficulty: 'easy' },
                { question: '¿Qué orgánulo celular es conocido como la central energética de la célula eucariota?', options: ['Ribosoma', 'Mitocondria', 'Aparato de Golgi', 'Lisosoma'], correct: 1, points: 15, difficulty: 'medium' },
                { question: '¿Cuál es el pH de una sustancia neutra a 25°C como el agua pura?', options: ['0', '7', '14', '5.5'], correct: 1, points: 10, difficulty: 'easy' },
                { question: '¿Qué tipo de enlace químico se forma cuando dos átomos comparten uno o más pares de electrones?', options: ['Enlace Iónico', 'Enlace Covalente', 'Enlace Metálico', 'Puente de Hidrógeno'], correct: 1, points: 15, difficulty: 'medium' }
            ],
            literatura: [
                { question: '¿Quién es el autor de la obra cumbre "Cien años de soledad"?', options: ['Mario Vargas Llosa', 'Gabriel García Márquez', 'Octavio Paz', 'Jorge Luis Borges'], correct: 1, points: 10, difficulty: 'easy' },
                { question: '¿Qué figura retórica consiste en exagerar intencionadamente una cualidad o hecho?', options: ['Metáfora', 'Hipérbole', 'Aliteración', 'Símil'], correct: 1, points: 10, difficulty: 'easy' },
                { question: '¿Quién escribió la obra poética y filosófica "El laberinto de la soledad"?', options: ['Carlos Fuentes', 'Octavio Paz', 'Juan Rulfo', 'Jaime Sabines'], correct: 1, points: 15, difficulty: 'medium' },
                { question: '¿A qué género literario pertenece la novela "Pedro Páramo"?', options: ['Realismo Mágico', 'Ciencia Ficción', 'Romanticismo', 'Poesía Épica'], correct: 0, points: 15, difficulty: 'medium' }
            ]
        };

        // DOM Elements
        const menuScreen = document.getElementById('menuScreen');
        const questionScreen = document.getElementById('questionScreen');
        const resultsScreen = document.getElementById('resultsScreen');
        const categoryGrid = document.getElementById('categoryGrid');
        const startBtn = document.getElementById('startBtn');
        const optionsGrid = document.getElementById('optionsGrid');
        const playAgainBtn = document.getElementById('playAgainBtn');

        // Initialize
        document.addEventListener('DOMContentLoaded', () => {
            loadStats();
            setupCategorySelection();
            setupEventListeners();
        });

        function getStoredToken() {
            return localStorage.getItem('token') ||
                   localStorage.getItem('bge_auth_token') ||
                   sessionStorage.getItem('authToken') ||
                   localStorage.getItem('authToken') || '';
        }

        // Load user stats
        async function loadStats() {
            const savedScore = localStorage.getItem('bge_trivia_score') || '450';
            const savedGames = localStorage.getItem('bge_trivia_games') || '8';
            const savedStreak = localStorage.getItem('bge_trivia_streak') || '5';

            document.getElementById('totalScore').textContent = parseInt(savedScore).toLocaleString();
            document.getElementById('gamesPlayed').textContent = savedGames;
            document.getElementById('bestStreak').textContent = savedStreak;

            const token = getStoredToken();
            if (!token) return;

            try {
                const res = await fetch('/api/games/trivia/stats', {
                    headers: { 'Authorization': 'Bearer ' + token }
                });
                if (res.ok) {
                    const data = await res.json();
                    if (data.success && data.stats) {
                        document.getElementById('totalScore').textContent = data.stats.totalScore.toLocaleString();
                        document.getElementById('gamesPlayed').textContent = data.stats.gamesPlayed;
                        document.getElementById('bestStreak').textContent = data.stats.bestStreak;
                    }
                }
            } catch (e) {}
        }

        // Category selection
        function setupCategorySelection() {
            categoryGrid.querySelectorAll('.category-card').forEach(card => {
                card.addEventListener('click', () => {
                    categoryGrid.querySelectorAll('.category-card').forEach(c => c.classList.remove('selected'));
                    card.classList.add('selected');
                    gameState.category = card.dataset.category;
                    startBtn.disabled = false;
                    startBtn.textContent = '🚀 ¡Comenzar Duelo!';
                });
            });
        }

        // Event listeners
        function setupEventListeners() {
            startBtn.addEventListener('click', startGame);
            if (playAgainBtn) {
                playAgainBtn.addEventListener('click', () => {
                    showScreen('menu');
                    resetGame();
                });
            }
        }

        // Start game
        async function startGame() {
            startBtn.disabled = true;
            startBtn.textContent = 'Iniciando Duelo...';

            const token = getStoredToken();
            let questions = [];

            if (token) {
                try {
                    const res = await fetch('/api/games/trivia/start', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': 'Bearer ' + token
                        },
                        body: JSON.stringify({
                            category: gameState.category,
                            questionCount: 5
                        })
                    });

                    if (res.ok) {
                        const data = await res.json();
                        if (data.success && data.game && data.game.questions) {
                            gameState.gameId = data.game.id;
                            questions = data.game.questions;
                        }
                    }
                } catch (err) {}
            }

            if (!questions || questions.length === 0) {
                if (gameState.category === 'random' || !QUESTION_BANK[gameState.category]) {
                    const allCategories = ['matematicas', 'historia', 'ciencias', 'literatura'];
                    allCategories.forEach(cat => {
                        questions.push(...QUESTION_BANK[cat]);
                    });
                    questions = questions.sort(() => Math.random() - 0.5).slice(0, 5);
                } else {
                    questions = [...QUESTION_BANK[gameState.category]].sort(() => Math.random() - 0.5);
                }
                gameState.gameId = 'local_' + Date.now();
            }

            gameState.questions = questions;
            gameState.currentIndex = 0;
            gameState.score = 0;
            gameState.correctAnswers = 0;
            gameState.streak = 0;
            gameState.maxStreak = 0;

            showScreen('question');
            displayQuestion();
        }

        // Display current question
        function displayQuestion() {
            const question = gameState.questions[gameState.currentIndex];
            const total = gameState.questions.length;

            document.getElementById('questionNumber').textContent = 'Pregunta ' + (gameState.currentIndex + 1) + '/' + total;
            document.getElementById('questionText').textContent = question.question;
            document.getElementById('questionDifficulty').textContent =
                'Dificultad: ' + getDifficultyLabel(question.difficulty) + ' • ' + (question.points || 10) + ' puntos';
            document.getElementById('progressFill').style.width = ((gameState.currentIndex) / total * 100) + '%';
            document.getElementById('currentScore').textContent = gameState.score;
            document.getElementById('correctCount').textContent = gameState.correctAnswers;
            document.getElementById('currentStreak').textContent = gameState.streak;

            // Render options
            optionsGrid.innerHTML = question.options.map((opt, i) => `
                <button class="option-btn" data-index="${i}">${opt}</button>
            `).join('');

            // Add click handlers
            optionsGrid.querySelectorAll('.option-btn').forEach(btn => {
                btn.addEventListener('click', () => selectAnswer(parseInt(btn.dataset.index)));
            });

            // Start timer
            gameState.questionStartTime = Date.now();
            gameState.timeLeft = 30;
            startTimer();
        }

        function getDifficultyLabel(diff) {
            const labels = { easy: 'Fácil', medium: 'Media', hard: 'Difícil' };
            return labels[diff] || diff || 'Media';
        }

        // Timer
        function startTimer() {
            clearInterval(gameState.timer);
            document.getElementById('timerValue').textContent = gameState.timeLeft;
            document.getElementById('timer').classList.remove('danger');

            gameState.timer = setInterval(() => {
                gameState.timeLeft--;
                document.getElementById('timerValue').textContent = gameState.timeLeft;

                if (gameState.timeLeft <= 5) {
                    document.getElementById('timer').classList.add('danger');
                }

                if (gameState.timeLeft <= 0) {
                    clearInterval(gameState.timer);
                    selectAnswer(-1); // Time out
                }
            }, 1000);
        }

        // Select answer
        async function selectAnswer(answerIndex) {
            clearInterval(gameState.timer);

            const question = gameState.questions[gameState.currentIndex];
            let isCorrect = false;
            let correctIndex = question.correct ?? 0;
            let pointsAwarded = 0;

            const token = getStoredToken();
            const timeSpent = Date.now() - (gameState.questionStartTime || Date.now());

            if (token && gameState.gameId && !gameState.gameId.startsWith('local_')) {
                try {
                    const res = await fetch('/api/games/trivia/answer', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': 'Bearer ' + token
                        },
                        body: JSON.stringify({
                            gameId: gameState.gameId,
                            questionIndex: gameState.currentIndex,
                            answer: answerIndex,
                            timeSpent: timeSpent
                        })
                    });

                    if (res.ok) {
                        const data = await res.json();
                        if (data.success && data.result) {
                            isCorrect = data.result.isCorrect;
                            correctIndex = data.result.correctAnswer;
                            pointsAwarded = data.result.pointsEarned;
                            gameState.score = data.result.totalScore;
                            gameState.streak = data.result.currentStreak;
                        }
                    }
                } catch (apiErr) {
                    console.warn('[TRIVIA] Fallback local answer:', apiErr);
                }
            } else {
                isCorrect = (answerIndex === correctIndex);
                pointsAwarded = isCorrect ? (question.points || 10) + (gameState.streak * 2) : 0;
                if (isCorrect) {
                    gameState.score += pointsAwarded;
                    gameState.streak++;
                } else {
                    gameState.streak = 0;
                }
            }

            // Disable all buttons
            optionsGrid.querySelectorAll('.option-btn').forEach(btn => {
                btn.disabled = true;
                const idx = parseInt(btn.dataset.index);
                if (idx === correctIndex) {
                    btn.classList.add('correct');
                } else if (idx === answerIndex && !isCorrect) {
                    btn.classList.add('incorrect');
                }
            });

            // Update state
            if (isCorrect) {
                gameState.correctAnswers++;
                gameState.maxStreak = Math.max(gameState.maxStreak, gameState.streak);
            }

            showScorePopup(isCorrect, pointsAwarded);

            document.getElementById('currentScore').textContent = gameState.score;
            document.getElementById('correctCount').textContent = gameState.correctAnswers;
            document.getElementById('currentStreak').textContent = gameState.streak;

            setTimeout(() => {
                gameState.currentIndex++;
                if (gameState.currentIndex < gameState.questions.length) {
                    displayQuestion();
                } else {
                    finishGame();
                }
            }, 1400);
        }

        // Show score popup
        function showScorePopup(isCorrect, points) {
            const popup = document.createElement('div');
            popup.className = 'score-popup ' + (isCorrect ? 'positive' : 'negative');
            popup.textContent = isCorrect ? '+' + points : '✗';
            document.body.appendChild(popup);
            setTimeout(() => popup.remove(), 1000);
        }

        // Finish game
        async function finishGame() {
            const totalQuestions = gameState.questions.length;
            const accuracy = Math.round((gameState.correctAnswers / totalQuestions) * 100);
            let coinsEarned = Math.round(gameState.score / 10);
            let serverResults = null;

            const token = getStoredToken();
            if (token && gameState.gameId && !gameState.gameId.startsWith('local_')) {
                try {
                    const res = await fetch('/api/games/trivia/finish', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': 'Bearer ' + token
                        },
                        body: JSON.stringify({
                            gameId: gameState.gameId
                        })
                    });

                    if (res.ok) {
                        const data = await res.json();
                        if (data.success && data.results) {
                            serverResults = data.results;
                            coinsEarned = serverResults.coinsEarned;
                        }
                    }
                } catch (apiErr) {
                    console.warn('[TRIVIA] Error finishing game on server:', apiErr);
                }
            }

            // Persist stats
            const prevScore = parseInt(localStorage.getItem('bge_trivia_score') || '450');
            const prevGames = parseInt(localStorage.getItem('bge_trivia_games') || '8');
            const prevStreak = parseInt(localStorage.getItem('bge_trivia_streak') || '5');

            localStorage.setItem('bge_trivia_score', prevScore + gameState.score);
            localStorage.setItem('bge_trivia_games', prevGames + 1);
            localStorage.setItem('bge_trivia_streak', Math.max(prevStreak, gameState.maxStreak));

            // Sync wallet balance
            const currentWalletCoins = parseFloat(localStorage.getItem('bge_iacoins_balance') || '250');
            localStorage.setItem('bge_iacoins_balance', currentWalletCoins + coinsEarned);

            const results = {
                score: gameState.score,
                correctAnswers: gameState.correctAnswers,
                totalQuestions: totalQuestions,
                accuracy: accuracy,
                maxStreak: gameState.maxStreak,
                coinsEarned: coinsEarned,
                perfectBonus: accuracy === 100,
                achievements: [
                    { icon: '🧠', name: 'Sabio del Bachillerato' },
                    { icon: '⚡', name: 'Racha x' + gameState.maxStreak }
                ]
            };

            displayResults(results);
        }

        // Display results
        function displayResults(results) {
            showScreen('results');

            // Trophy based on accuracy
            let trophy = '🎮';
            let title = '¡Buen intento!';
            if (results.accuracy >= 90) {
                trophy = '🏆';
                title = '¡Increíble!';
            } else if (results.accuracy >= 70) {
                trophy = '🥈';
                title = '¡Muy bien!';
            } else if (results.accuracy >= 50) {
                trophy = '🥉';
                title = '¡Bien hecho!';
            }

            document.getElementById('resultsTrophy').textContent = results.perfectBonus ? '👑' : trophy;
            document.getElementById('resultsTitle').textContent = results.perfectBonus ? '¡PERFECTO!' : title;
            document.getElementById('finalScore').textContent = results.score + ' pts';
            document.getElementById('resultCorrect').textContent = results.correctAnswers + '/' + results.totalQuestions;
            document.getElementById('resultAccuracy').textContent = results.accuracy + '%';
            document.getElementById('resultStreak').textContent = results.maxStreak;
            document.getElementById('coinsEarned').textContent = results.coinsEarned;

            // Achievements
            const achievementsList = document.getElementById('achievementsList');
            if (achievementsList) {
                achievementsList.innerHTML = results.achievements.map(a => `
                    <div class="achievement-badge">
                        <span>${a.icon}</span>
                        <span>${a.name}</span>
                    </div>
                `).join('');
            }
        }

        // Show screen
        function showScreen(screen) {
            menuScreen.classList.remove('active');
            questionScreen.classList.remove('active');
            resultsScreen.classList.remove('active');

            if (screen === 'menu') menuScreen.classList.add('active');
            if (screen === 'question') questionScreen.classList.add('active');
            if (screen === 'results') resultsScreen.classList.add('active');
        }

        // Reset game
        function resetGame() {
            gameState = {
                gameId: null,
                category: null,
                questions: [],
                currentIndex: 0,
                score: 0,
                correctAnswers: 0,
                streak: 0,
                maxStreak: 0,
                timer: null,
                timeLeft: 30,
                questionStartTime: null
            };

            categoryGrid.querySelectorAll('.category-card').forEach(c => c.classList.remove('selected'));
            startBtn.disabled = true;
            startBtn.textContent = 'Selecciona una categoría';

            loadStats();
        }
