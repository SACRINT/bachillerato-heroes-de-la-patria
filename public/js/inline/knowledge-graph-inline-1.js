let simulation, svg, link, node, labels;
        const width = window.innerWidth;
        const height = window.innerHeight - 70;

        const getDemoGraphData = () => ({
            nodes: [
                { id: 'mat1', label: 'Álgebra Lineal', group: 'Matemáticas', level: 'Básico', value: 24, color: '#4f46e5', mastery_level: 85, is_unlocked: true },
                { id: 'mat2', label: 'Cálculo Diferencial', group: 'Matemáticas', level: 'Intermedio', value: 28, color: '#6366f1', mastery_level: 70, is_unlocked: true },
                { id: 'mat3', label: 'Cálculo Integral', group: 'Matemáticas', level: 'Avanzado', value: 20, color: '#818cf8', mastery_level: 50, is_unlocked: false },
                { id: 'fis1', label: 'Mecánica Clásica', group: 'Física', level: 'Intermedio', value: 25, color: '#06b6d4', mastery_level: 90, is_unlocked: true },
                { id: 'fis2', label: 'Electromagnetismo', group: 'Física', level: 'Avanzado', value: 18, color: '#0891b2', mastery_level: 40, is_unlocked: false },
                { id: 'qui1', label: 'Química Orgánica', group: 'Química', level: 'Básico', value: 22, color: '#10b981', mastery_level: 65, is_unlocked: true },
                { id: 'inf1', label: 'Pensamiento Computacional', group: 'Tecnología', level: 'Básico', value: 26, color: '#f59e0b', mastery_level: 95, is_unlocked: true }
            ],
            edges: [
                { source: 'mat1', target: 'mat2', relation_type: 'prerequisite' },
                { source: 'mat2', target: 'mat3', relation_type: 'prerequisite' },
                { source: 'mat1', target: 'fis1', relation_type: 'applied' },
                { source: 'mat2', target: 'fis1', relation_type: 'applied' },
                { source: 'mat3', target: 'fis2', relation_type: 'applied' },
                { source: 'fis1', target: 'fis2', relation_type: 'prerequisite' },
                { source: 'mat1', target: 'inf1', relation_type: 'related' }
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
