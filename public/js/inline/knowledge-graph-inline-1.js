let simulation, svg, link, node, labels;
        const width = window.innerWidth;
        const height = window.innerHeight - 70;

        const getDemoGraphData = () => ({
            nodes: [
                // Matemáticas
                { id: 'mat1', label: 'Álgebra', group: 'Matemáticas', semester: 1, level: 'Básico', value: 26, color: '#4f46e5', mastery_level: 92, is_unlocked: true, description: 'Ecuaciones lineales, factorización, polinomios y funciones cuadráticas.' },
                { id: 'mat2', label: 'Geometría y Trigonometría', group: 'Matemáticas', semester: 2, level: 'Básico', value: 24, color: '#4f46e5', mastery_level: 85, is_unlocked: true, description: 'Teorema de Pitágoras, funciones trigonométricas, triángulos y áreas.' },
                { id: 'mat3', label: 'Geometría Analítica', group: 'Matemáticas', semester: 3, level: 'Intermedio', value: 25, color: '#6366f1', mastery_level: 78, is_unlocked: true, description: 'La recta, circunferencia, parábola, elipse e hipérbola en el plano cartesiano.' },
                { id: 'mat4', label: 'Cálculo Diferencial', group: 'Matemáticas', semester: 4, level: 'Intermedio', value: 28, color: '#6366f1', mastery_level: 70, is_unlocked: true, description: 'Límites, continuidad, derivadas algebraicas y aplicaciones de optimización.' },
                { id: 'mat5', label: 'Cálculo Integral', group: 'Matemáticas', semester: 5, level: 'Avanzado', value: 26, color: '#818cf8', mastery_level: 55, is_unlocked: false, description: 'Integrales definidas, métodos de integración y cálculo de áreas y volúmenes.' },
                { id: 'mat6', label: 'Probabilidad y Estadística', group: 'Matemáticas', semester: 6, level: 'Avanzado', value: 24, color: '#818cf8', mastery_level: 45, is_unlocked: false, description: 'Distribuciones de probabilidad, medidas de tendencia central e inferencia.' },

                // Ciencias Experimentales
                { id: 'qui1', label: 'Química I', group: 'Ciencias Experimentales', semester: 1, level: 'Básico', value: 24, color: '#059669', mastery_level: 88, is_unlocked: true, description: 'Estructura atómica, tabla periódica, enlaces químicos y nomenclatura inorgánica.' },
                { id: 'qui2', label: 'Química II', group: 'Ciencias Experimentales', semester: 2, level: 'Intermedio', value: 24, color: '#10b981', mastery_level: 75, is_unlocked: true, description: 'Estequiometría, disoluciones, cinética química y compuestos del carbono.' },
                { id: 'bio1', label: 'Biología I', group: 'Ciencias Experimentales', semester: 3, level: 'Básico', value: 23, color: '#059669', mastery_level: 90, is_unlocked: true, description: 'Célula, reproducción celular, metabolismo celular y genética mendeliana.' },
                { id: 'bio2', label: 'Biología II', group: 'Ciencias Experimentales', semester: 4, level: 'Intermedio', value: 23, color: '#10b981', mastery_level: 80, is_unlocked: true, description: 'Evolución biológica, taxonomía, anatomía y fisiología animal y vegetal.' },
                { id: 'fis1', label: 'Física I (Mecánica)', group: 'Ciencias Experimentales', semester: 3, level: 'Intermedio', value: 26, color: '#06b6d4', mastery_level: 82, is_unlocked: true, description: 'Cinemática, leyes de Newton, trabajo, energía, potencia y mecánica de fluidos.' },
                { id: 'fis2', label: 'Física II (Electromagnetismo)', group: 'Ciencias Experimentales', semester: 4, level: 'Avanzado', value: 25, color: '#0891b2', mastery_level: 60, is_unlocked: false, description: 'Termodinámica, ondas, óptica, electrostática, circuitos y magnetismo.' },
                { id: 'eco1', label: 'Ecología y Medio Ambiente', group: 'Ciencias Experimentales', semester: 6, level: 'Avanzado', value: 22, color: '#34d399', mastery_level: 40, is_unlocked: false, description: 'Ecosistemas, biodiversidad, impacto ambiental y desarrollo sustentable.' },

                // Ciencias Sociales y Humanidades
                { id: 'eti1', label: 'Ética y Valores', group: 'Humanidades', semester: 1, level: 'Básico', value: 22, color: '#d97706', mastery_level: 95, is_unlocked: true, description: 'Juicio moral, derechos humanos, valores universales y convivencia democrática.' },
                { id: 'his1', label: 'Historia de México I', group: 'Ciencias Sociales', semester: 3, level: 'Básico', value: 23, color: '#f59e0b', mastery_level: 84, is_unlocked: true, description: 'Culturas prehispánicas, conquista, virreinato y proceso de independencia.' },
                { id: 'his2', label: 'Historia de México II', group: 'Ciencias Sociales', semester: 4, level: 'Intermedio', value: 23, color: '#f59e0b', mastery_level: 72, is_unlocked: true, description: 'Reforma, Porfiriato, Revolución Mexicana y consolidación del Estado moderno.' },
                { id: 'soc1', label: 'Estructura Socioeconómica', group: 'Ciencias Sociales', semester: 5, level: 'Avanzado', value: 22, color: '#b45309', mastery_level: 50, is_unlocked: false, description: 'Modelos económicos de México, globalización y problemáticas sociales contemporáneas.' },
                { id: 'fil1', label: 'Filosofía', group: 'Humanidades', semester: 6, level: 'Avanzado', value: 24, color: '#d97706', mastery_level: 40, is_unlocked: false, description: 'Epistemología, ontología, lógica, pensamiento crítico y corrientes filosóficas.' },

                // Comunicación
                { id: 'com1', label: 'Lengua y Comunicación I', group: 'Comunicación', semester: 1, level: 'Básico', value: 25, color: '#ec4899', mastery_level: 92, is_unlocked: true, description: 'Comprensión lectora, redacción básica, tipos de textos y ortografía.' },
                { id: 'com2', label: 'Lengua y Comunicación II', group: 'Comunicación', semester: 2, level: 'Intermedio', value: 24, color: '#f43f5e', mastery_level: 80, is_unlocked: true, description: 'Argumentación, ensayo crítico, debate e investigación documental.' },
                { id: 'lit1', label: 'Literatura', group: 'Comunicación', semester: 5, level: 'Avanzado', value: 22, color: '#e11d48', mastery_level: 50, is_unlocked: false, description: 'Géneros literarios, narrativa universal, lírica hispanoamericana y dramaturgia.' },
                { id: 'ing1', label: 'Inglés I (A1/A2)', group: 'Comunicación', semester: 1, level: 'Básico', value: 24, color: '#8b5cf6', mastery_level: 86, is_unlocked: true, description: 'Presente simple, vocabulario diario, estructuras comunicativas iniciales.' },
                { id: 'ing2', label: 'Inglés II (A2/B1)', group: 'Comunicación', semester: 2, level: 'Intermedio', value: 24, color: '#7c3aed', mastery_level: 74, is_unlocked: true, description: 'Tiempos pasados, futuro, modales y conversación en situaciones cotidianas.' },
                { id: 'ing3', label: 'Inglés III (B1)', group: 'Comunicación', semester: 3, level: 'Intermedio', value: 23, color: '#6d28d9', mastery_level: 68, is_unlocked: true, description: 'Voz pasiva, condicionales, redacción y escucha avanzada.' },

                // Tecnología y Capacitación
                { id: 'tic1', label: 'Pensamiento Computacional', group: 'Tecnología', semester: 1, level: 'Básico', value: 26, color: '#3b82f6', mastery_level: 94, is_unlocked: true, description: 'Algoritmos, diagramas de flujo, lógica de programación y resolución de problemas.' },
                { id: 'tic2', label: 'Tecnologías Digitales I', group: 'Tecnología', semester: 2, level: 'Intermedio', value: 25, color: '#2563eb', mastery_level: 88, is_unlocked: true, description: 'Herramientas ofimáticas en la nube, ciberseguridad escolar y trabajo colaborativo.' },
                { id: 'tic3', label: 'Programación e IA', group: 'Tecnología', semester: 5, level: 'Avanzado', value: 26, color: '#1d4ed8', mastery_level: 65, is_unlocked: false, description: 'Bases de datos, scripts en Python, prompts de IA y desarrollo web básico.' },
                { id: 'emp1', label: 'Emprendimiento e Innovación', group: 'Capacitación para el Trabajo', semester: 6, level: 'Avanzado', value: 24, color: '#0d9488', mastery_level: 50, is_unlocked: false, description: 'Planes de negocio, modelo Canvas, finanzas básicas y proyectos comunitarios sostenibles.' }
            ],
            edges: [
                // Matemáticas cadena
                { source: 'mat1', target: 'mat2', relation_type: 'prerequisite', label: 'Base geométrica' },
                { source: 'mat2', target: 'mat3', relation_type: 'prerequisite', label: 'Coordenadas' },
                { source: 'mat3', target: 'mat4', relation_type: 'prerequisite', label: 'Funciones y límites' },
                { source: 'mat4', target: 'mat5', relation_type: 'prerequisite', label: 'Antiderivadas' },
                { source: 'mat4', target: 'mat6', relation_type: 'prerequisite', label: 'Modelación continua' },

                // Matemáticas aplicadas a Ciencias
                { source: 'mat1', target: 'qui1', relation_type: 'applied', label: 'Balanceo de ecuaciones' },
                { source: 'qui1', target: 'qui2', relation_type: 'prerequisite', label: 'Estequiometría' },
                { source: 'qui2', target: 'bio1', relation_type: 'applied', label: 'Bioquímica celular' },
                { source: 'bio1', target: 'bio2', relation_type: 'prerequisite', label: 'Genética a organismos' },
                { source: 'bio2', target: 'eco1', relation_type: 'applied', label: 'Ecología' },

                { source: 'mat2', target: 'fis1', relation_type: 'applied', label: 'Vectores y trigonometría' },
                { source: 'mat4', target: 'fis1', relation_type: 'applied', label: 'Velocidad y aceleración' },
                { source: 'fis1', target: 'fis2', relation_type: 'prerequisite', label: 'Energía y campos' },
                { source: 'fis2', target: 'eco1', relation_type: 'applied', label: 'Termodinámica ambiental' },

                // Tecnología
                { source: 'mat1', target: 'tic1', relation_type: 'applied', label: 'Lógica matemática' },
                { source: 'tic1', target: 'tic2', relation_type: 'prerequisite', label: 'Estructuras' },
                { source: 'tic2', target: 'tic3', relation_type: 'prerequisite', label: 'Desarrollo e IA' },
                { source: 'tic3', target: 'emp1', relation_type: 'applied', label: 'Transformación digital' },

                // Humanidades y Sociales
                { source: 'eti1', target: 'his1', relation_type: 'related', label: 'Contexto social' },
                { source: 'his1', target: 'his2', relation_type: 'prerequisite', label: 'Cronología histórica' },
                { source: 'his2', target: 'soc1', relation_type: 'prerequisite', label: 'Estructura social' },
                { source: 'eti1', target: 'fil1', relation_type: 'prerequisite', label: 'Pensamiento axiológico' },
                { source: 'soc1', target: 'fil1', relation_type: 'related', label: 'Filosofía política' },
                { source: 'soc1', target: 'emp1', relation_type: 'applied', label: 'Economía aplicada' },

                // Comunicación
                { source: 'com1', target: 'com2', relation_type: 'prerequisite', label: 'Redacción avanzada' },
                { source: 'com2', target: 'lit1', relation_type: 'prerequisite', label: 'Análisis textual' },
                { source: 'ing1', target: 'ing2', relation_type: 'prerequisite', label: 'Nivel intermedio' },
                { source: 'ing2', target: 'ing3', relation_type: 'prerequisite', label: 'Nivel B1' },
                { source: 'com2', target: 'his2', relation_type: 'related', label: 'Ensayos históricos' }
            ]
        });

        async function initGraph() {
            const token = localStorage.getItem('student_auth_token') ||
                          localStorage.getItem('auth_token') ||
                          localStorage.getItem('bge_auth_token') ||
                          'demo_token';

            try {
                const res = await fetch('/api/knowledge/graph', {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                if (res.ok) {
                    const json = await res.json();
                    if (json.success && json.data && json.data.nodes && json.data.nodes.length > 0) {
                        renderGraph(json.data);
                        return;
                    }
                }
            } catch (error) {}

            renderGraph(getDemoGraphData());
        }

        function renderGraph(data) {
            const container = document.getElementById("graph-container");
            if (!container) return;
            container.innerHTML = '';

            const nodes = data.nodes || [];
            const edges = data.edges || [];
            const nodeMap = new Map(nodes.map(n => [n.id, n]));

            const links = edges
                .map(d => ({
                    ...d,
                    source: d.source || d.from,
                    target: d.target || d.to
                }))
                .filter(l => nodeMap.has(l.source) && nodeMap.has(l.target));

            const nodeList = nodes.map(d => ({
                ...d,
                title: d.title || `Mastery: ${d.mastery_level || 50}%`
            }));

            svg = d3.select("#graph-container").append("svg")
                .attr("viewBox", [0, 0, width, height])
                .call(d3.zoom().on("zoom", (event) => {
                    g.attr("transform", event.transform);
                }));

            const g = svg.append("g");

            svg.append("defs").selectAll("marker")
                .data(["end"])
                .enter().append("marker")
                .attr("id", "arrow")
                .attr("viewBox", "0 -5 10 10")
                .attr("refX", 28)
                .attr("refY", 0)
                .attr("markerWidth", 6)
                .attr("markerHeight", 6)
                .attr("orient", "auto")
                .append("path")
                .attr("d", "M0,-5L10,0L0,5")
                .attr("fill", "#ced4da");

            simulation = d3.forceSimulation(nodeList)
                .force("link", d3.forceLink(links).id(d => d.id).distance(160))
                .force("charge", d3.forceManyBody().strength(-450))
                .force("center", d3.forceCenter(width / 2, height / 2))
                .force("collide", d3.forceCollide().radius(d => (d.value || 20) * 2));

            link = g.append("g")
                .attr("stroke", "#999")
                .attr("stroke-opacity", 0.6)
                .selectAll("line")
                .data(links)
                .join("line")
                .attr("stroke-width", d => Math.sqrt(d.value || 2))
                .attr("stroke", d => d.color || '#94a3b8')
                .attr("marker-end", "url(#arrow)");

            node = g.append("g")
                .attr("stroke", "#fff")
                .attr("stroke-width", 2)
                .selectAll("circle")
                .data(nodeList)
                .join("circle")
                .attr("r", d => d.value || 22)
                .attr("fill", d => d.color || '#3b82f6')
                .attr("cursor", "pointer")
                .call(drag(simulation));

            node.on("click", (event, d) => {
                showPanel(d);
                event.stopPropagation();
            });

            svg.on("click", () => closePanel());

            labels = g.append("g")
                .attr("class", "labels")
                .selectAll("text")
                .data(nodeList)
                .enter().append("text")
                .attr("dy", d => (d.value || 22) + 16)
                .attr("text-anchor", "middle")
                .text(d => d.label)
                .attr("font-size", "12px")
                .attr("font-weight", "600")
                .attr("fill", "#334155")
                .style("pointer-events", "none")
                .style("text-shadow", "1px 1px 3px rgba(255,255,255,0.9)");

            simulation.on("tick", () => {
                link
                    .attr("x1", d => d.source.x)
                    .attr("y1", d => d.source.y)
                    .attr("x2", d => d.target.x)
                    .attr("y2", d => d.target.y);

                node
                    .attr("cx", d => d.x)
                    .attr("cy", d => d.y);

                labels
                    .attr("x", d => d.x)
                    .attr("y", d => d.y);
            });
        }

        function drag(simulation) {
            function dragstarted(event) {
                if (!event.active) simulation.alphaTarget(0.3).restart();
                event.subject.fx = event.subject.x;
                event.subject.fy = event.subject.y;
            }

            function dragged(event) {
                event.subject.fx = event.x;
                event.subject.fy = event.y;
            }

            function dragended(event) {
                if (!event.active) simulation.alphaTarget(0);
                event.subject.fx = null;
                event.subject.fy = null;
            }

            return d3.drag()
                .on("start", dragstarted)
                .on("drag", dragged)
                .on("end", dragended);
        }

        function showPanel(nodeData) {
            const panel = document.getElementById('info-panel');
            const content = document.getElementById('panel-content');
            const percentage = nodeData.mastery_level || 75;

            content.innerHTML = `
                <div class="text-center mb-4">
                    <div class="rounded-circle d-inline-flex align-items-center justify-content-center mb-3 shadow-sm" 
                         style="width: 80px; height: 80px; background-color: ${nodeData.color || '#3b82f6'}; color: white; font-size: 1.8rem; font-weight: bold;">
                         ${percentage}%
                    </div>
                    <h4 class="fw-bold text-dark">${nodeData.label}</h4>
                    <span class="badge bg-light text-primary border">${nodeData.group}</span>
                </div>
                
                <div class="card bg-light border-0 mb-3">
                    <div class="card-body">
                        <h6 class="fw-bold mb-1">Nivel de Dominio</h6>
                        <p class="mb-0 text-muted small">
                            ${percentage >= 80 ? '¡Excelente! Has dominado los conceptos clave de este módulo.' : 'Módulo en progreso. Continúa practicando.'}
                        </p>
                    </div>
                </div>

                <div class="d-grid gap-2">
                    <a href="adaptive-lesson.html?nodeId=${nodeData.id}" class="btn btn-primary">
                        <i class="fas fa-play me-2"></i> Continuar Aprendiendo
                    </a>
                </div>
            `;

            panel.classList.add('active');
        }

        function closePanel() {
            const panel = document.getElementById('info-panel');
            if (panel) panel.classList.remove('active');
        }

        document.addEventListener('DOMContentLoaded', () => {
            initGraph();
        });
