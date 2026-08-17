/**
 * Logic for VAK Assessment Quiz
 */
(function () {
    'use strict';

    const questions = [
        {
            id: 'q1',
            text: 'Cuando aprendes algo nuevo, prefieres:',
            options: [
                { text: 'Ver diagramas, gráficos o imágenes', category: 'visual' },
                { text: 'Escuchar la explicación del profesor', category: 'auditory' },
                { text: 'Intentarlo tú mismo con tus manos', category: 'kinesthetic' }
            ]
        },
        {
            id: 'q2',
            text: 'Si te pierdes en una ciudad, tú:',
            options: [
                { text: 'Miras un mapa o GPS', category: 'visual' },
                { text: 'Preguntas a alguien por indicaciones', category: 'auditory' },
                { text: 'Sigues caminando hasta encontrar algo familiar', category: 'kinesthetic' }
            ]
        },
        {
            id: 'q3',
            text: 'Para relajarte prefieres:',
            options: [
                { text: 'Ver una película o leer', category: 'visual' },
                { text: 'Escuchar música', category: 'auditory' },
                { text: 'Hacer ejercicio o deporte', category: 'kinesthetic' }
            ]
        },
        {
            id: 'q4',
            text: 'En clase, te distraes más por:',
            options: [
                { text: 'El movimiento fuera de la ventana', category: 'visual' },
                { text: 'Ruidos o conversaciones', category: 'auditory' },
                { text: 'La incomodidad de estar sentado tanto tiempo', category: 'kinesthetic' }
            ]
        },
        {
            id: 'q5',
            text: 'Recuerdas mejor a alguien por:',
            options: [
                { text: 'Su cara', category: 'visual' },
                { text: 'Su voz o nombre', category: 'auditory' },
                { text: 'Lo que hicieron juntos', category: 'kinesthetic' }
            ]
        }
    ];

    let currentQuestionIndex = 0;
    const userResponses = [];

    // --- State Management ---

    window.startQuiz = function () {
        document.getElementById('intro-screen').classList.add('d-none');
        document.getElementById('question-screen').classList.remove('d-none');
        loadQuestion(0);
    };

    function loadQuestion(index) {
        const q = questions[index];
        document.getElementById('question-text').textContent = q.text;

        // Update progress bar
        const progress = ((index) / questions.length) * 100;
        document.getElementById('quiz-progress').style.width = `${progress}%`;

        const container = document.getElementById('options-container');
        container.innerHTML = '';

        q.options.forEach((opt, idx) => {
            const btn = document.createElement('div');
            btn.className = 'quiz-option';
            btn.innerHTML = `
                <div class="option-key">${String.fromCharCode(65 + idx)}</div>
                <span>${opt.text}</span>
            `;
            btn.onclick = () => selectOption(q.id, opt.category);
            container.appendChild(btn);
        });
    }

    function selectOption(qId, category) {
        userResponses.push({ questionId: qId, category: category, value: 20 }); // 20 pts per question (5 questions -> 100 max)

        currentQuestionIndex++;

        if (currentQuestionIndex < questions.length) {
            loadQuestion(currentQuestionIndex);
        } else {
            finishQuiz();
        }
    }

    async function finishQuiz() {
        document.getElementById('question-screen').classList.add('d-none');
        document.getElementById('result-screen').classList.remove('d-none'); // Show partial result while calculating or saving?

        // Send to Backend
        try {
            const token = sessionStorage.getItem('bge_auth_token') || localStorage.getItem('bge_auth_token');
            const headers = { 'Content-Type': 'application/json' };
            if (token) headers['Authorization'] = `Bearer ${token}`;

            const res = await fetch('/api/adaptive-content/vak/assess', {
                method: 'POST',
                headers,
                body: JSON.stringify({
                    responses: userResponses
                })
            });

            const json = await res.json();

            if (json.success && json.data) {
                displayResults(json.data);
            } else {
                calculateResultsLocally(); // Fallback
            }
        } catch (e) {
            console.error(e);
            calculateResultsLocally();
        }
    }

    function calculateResultsLocally() {
        let v = 0, a = 0, k = 0;
        userResponses.forEach(r => {
            if (r.category === 'visual') v += 20;
            if (r.category === 'auditory') a += 20;
            if (r.category === 'kinesthetic') k += 20;
        });

        let dominant = 'multimodal';
        if (v > a && v > k) dominant = 'visual';
        else if (a > v && a > k) dominant = 'auditory';
        else if (k > v && k > a) dominant = 'kinesthetic';

        displayResults({
            visual_score: v, auditory_score: a, kinesthetic_score: k,
            dominant_style: dominant
        });
    }

    function displayResults(profile) {
        document.getElementById('result-title').textContent = profile.dominant_style.toUpperCase();

        let desc = '';
        let icon = 'fa-brain';

        switch (profile.dominant_style) {
            case 'visual':
                desc = 'Tienes una memoria fotográfica. Aprendes mejor con videos, infografías y mapas mentales.';
                icon = 'fa-eye';
                break;
            case 'auditory':
                desc = 'Absorbes mejor la información escuchando. Los podcasts y debates son ideales para ti.';
                icon = 'fa-headphones';
                break;
            case 'kinesthetic':
                desc = 'Necesitas "hacer" para aprender. Las prácticas y experimentos son tu fuerte.';
                icon = 'fa-hands';
                break;
            default:
                desc = 'Eres versátil y puedes adaptarte a múltiples formas de aprendizaje.';
                icon = 'fa-cubes';
        }

        document.getElementById('result-description').textContent = desc;
        document.getElementById('result-icon').className = `fas ${icon}`;

        // Animate bars
        setTimeout(() => {
            document.getElementById('bar-v').style.width = `${profile.visual_score || 0}%`;
            document.getElementById('bar-a').style.width = `${profile.auditory_score || 0}%`;
            document.getElementById('bar-k').style.width = `${profile.kinesthetic_score || 0}%`;
        }, 300);

        // Inject Dynamic Buttons for Demo Flow
        const actionArea = document.querySelector('.assessment-card .btn').parentNode; // The link to dashboard
        if (actionArea) {
            actionArea.innerHTML = `
                <div class="d-grid gap-2 d-md-flex justify-content-md-center">
                    <a href="adaptive-lesson.html" class="btn btn-primary rounded-pill px-4">
                        <i class="fas fa-magic me-2"></i> Ver Lección Adaptada (Demo)
                    </a>
                    <a href="iacoins-dashboard.html" class="btn btn-outline-light rounded-pill px-4">
                        Ir a mi Dashboard
                    </a>
                </div>
             `;
        }
    }

})();
