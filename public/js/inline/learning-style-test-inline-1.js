// Questions Data (Simplified VAK)
        const questions = [
            {
                id: 'q1',
                text: "Cuando estudias para un examen, ¿qué te ayuda más?",
                options: [
                    { text: "Leer mis apuntes y ver diagramas", category: "visual", value: 5 },
                    { text: "Escuchar grabaciones o explicarlo en voz alta", category: "auditory", value: 5 },
                    { text: "Hacer ejercicios prácticos o moverme mientras estudio", category: "kinesthetic", value: 5 }
                ]
            },
            {
                id: 'q2',
                text: "Si te pierdes en una ciudad nueva, ¿qué haces?",
                options: [
                    { text: "Miro un mapa o uso el GPS", category: "visual", value: 5 },
                    { text: "Pregunto a alguien por indicaciones", category: "auditory", value: 5 },
                    { text: "Sigo caminando hasta encontrar algo familiar", category: "kinesthetic", value: 5 }
                ]
            },
            {
                id: 'q3',
                text: "¿Qué tipo de clases prefieres?",
                options: [
                    { text: "Con muchas diapositivas y videos", category: "visual", value: 5 },
                    { text: "Debates y discusiones grupales", category: "auditory", value: 5 },
                    { text: "Laboratorios y actividades prácticas", category: "kinesthetic", value: 5 }
                ]
            },
            {
                id: 'q4',
                text: "Cuando compras algo nuevo, ¿cómo aprendes a usarlo?",
                options: [
                    { text: "Leo el manual de instrucciones", category: "visual", value: 5 },
                    { text: "Pido que alguien me explique", category: "auditory", value: 5 },
                    { text: "Empiezo a probar botones hasta que funcione", category: "kinesthetic", value: 5 }
                ]
            },
            {
                id: 'q5',
                text: "En tu tiempo libre, ¿qué prefieres?",
                options: [
                    { text: "Ver películas o leer", category: "visual", value: 5 },
                    { text: "Escuchar música o podcasts", category: "auditory", value: 5 },
                    { text: "Hacer deporte o manualidades", category: "kinesthetic", value: 5 }
                ]
            },
            {
                id: 'q6',
                text: "¿Cómo recuerdas mejor a las personas?",
                options: [
                    { text: "Por su cara", category: "visual", value: 5 },
                    { text: "Por su nombre o voz", category: "auditory", value: 5 },
                    { text: "Por lo que hicimos juntos", category: "kinesthetic", value: 5 }
                ]
            }
        ];

        let currentQuestionIndex = 0;
        let responses = [];
        let selectedOption = null;

        // Init
        document.addEventListener('DOMContentLoaded', async () => {
            const token = localStorage.getItem('student_auth_token');
            if (!token) {
                window.location.href = 'login.html';
                return;
            }

            // Check if profile exists
            try {
                const res = await fetch('/api/personality/profile', {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                const data = await res.json();

                document.getElementById('loading-state').classList.add('d-none');

                if (data.success && data.data) {
                    // Profile exists, show result directly
                    showResult(data.data);
                } else {
                    // Show Intro
                    document.getElementById('intro-card').classList.remove('d-none');
                }
            } catch (e) {
                console.error(e);
                document.getElementById('loading-state').innerHTML = '<p class="text-danger">Error de conexión</p>';
            }
        });

        function startQuiz() {
            document.getElementById('intro-card').classList.add('d-none');
            document.getElementById('quiz-card').classList.remove('d-none');
            renderQuestion();
        }

        function renderQuestion() {
            const q = questions[currentQuestionIndex];
            document.getElementById('current-q-num').textContent = currentQuestionIndex + 1;
            document.getElementById('question-text').textContent = q.text;

            // Progress bar
            const progress = ((currentQuestionIndex) / questions.length) * 100;
            document.getElementById('quiz-progress').style.width = `${progress}%`;

            const container = document.getElementById('options-container');
            container.innerHTML = '';

            q.options.forEach((opt, idx) => {
                const btn = document.createElement('button');
                btn.className = 'option-btn w-100';
                btn.innerHTML = `<div class="d-flex align-items-center">
                    <div class="rounded-circle bg-light me-3 d-flex align-items-center justify-content-center option-letter-circle">
                        ${String.fromCharCode(65 + idx)}
                    </div>
                    <span>${opt.text}</span>
                </div>`;
                btn.onclick = () => selectOption(btn, opt);
                container.appendChild(btn);
            });

            document.getElementById('next-btn').disabled = true;
            selectedOption = null;
        }

        function selectOption(btnElement, optionData) {
            // Remove active from others
            document.querySelectorAll('.option-btn').forEach(b => b.classList.remove('selected'));
            btnElement.classList.add('selected');
            selectedOption = optionData;
            document.getElementById('next-btn').disabled = false;
        }

        function nextQuestion() {
            if (!selectedOption) return;

            // Save response
            responses.push({
                questionId: questions[currentQuestionIndex].id,
                category: selectedOption.category,
                value: selectedOption.value
            });

            currentQuestionIndex++;

            if (currentQuestionIndex < questions.length) {
                renderQuestion();
            } else {
                submitQuiz();
            }
        }

        async function submitQuiz() {
            document.getElementById('quiz-card').classList.add('d-none');
            document.getElementById('loading-state').classList.remove('d-none');
            const loadText = document.querySelector('#loading-state span');
            if (loadText) loadText.textContent = "Analizando tu perfil...";

            try {
                const token = localStorage.getItem('student_auth_token');
                const res = await fetch('/api/personality/assess', {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ responses })
                });

                const data = await res.json();
                document.getElementById('loading-state').classList.add('d-none');

                if (data.success) {
                    showResult(data.data);
                } else {
                    alert('Error guardando resultados');
                }
            } catch (e) {
                console.error(e);
                alert('Error de conexión');
            }
        }

        function showResult(profile) {
            document.getElementById('result-card').classList.remove('d-none');

            // Map english dominant style to spanish
            const styles = {
                'visual': { name: 'Visual', icon: 'fa-eye', desc: 'Aprendes mejor viendo material gráfico, videos y diagramas.' },
                'auditory': { name: 'Auditivo', icon: 'fa-headphones', desc: 'Aprendes mejor escuchando explicaciones y discutiendo ideas.' },
                'kinesthetic': { name: 'Kinestésico', icon: 'fa-running', desc: 'Aprendes mejor haciendo, construyendo y con actividad física.' },
                'multimodal': { name: 'Multimodal', icon: 'fa-star', desc: 'Tienes un equilibrio excelente entre varios estilos.' }
            };

            const styleInfo = styles[profile.dominant_style] || styles['multimodal'];

            document.getElementById('result-style').textContent = styleInfo.name;
            document.getElementById('result-desc').textContent = styleInfo.desc;
            document.getElementById('result-icon-el').className = `fas ${styleInfo.icon} result-icon`;

            // Update bars (Normalize roughly to 100 for display)
            const total = (parseFloat(profile.visual_score) + parseFloat(profile.auditory_score) + parseFloat(profile.kinesthetic_score)) || 1;

            const vPer = Math.round((profile.visual_score / total) * 100);
            const aPer = Math.round((profile.auditory_score / total) * 100);
            const kPer = Math.round((profile.kinesthetic_score / total) * 100);

            document.getElementById('bar-visual').style.width = `${vPer}%`;
            document.getElementById('bar-visual').textContent = `${vPer}%`;

            document.getElementById('bar-auditory').style.width = `${aPer}%`;
            document.getElementById('bar-auditory').textContent = `${aPer}%`;

            document.getElementById('bar-kinesthetic').style.width = `${kPer}%`;
            document.getElementById('bar-kinesthetic').textContent = `${kPer}%`;
        }
