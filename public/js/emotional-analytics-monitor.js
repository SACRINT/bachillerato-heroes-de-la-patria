
// Gestión de Analítica Emocional para Estudiantes
// Carga y renderiza el historial de emociones

let emotionalChartInstance = null;

window.loadEmotionalHistory = async function () {
    void 0;

    // Obtener token (asumiendo que está en localStorage como 'student_auth_token' o similar)
    // NOTA: adaptive-lesson usa un token hardcoded o login flow. Aquí usaremos el token real.
    const token = localStorage.getItem('student_auth_token');

    if (!token) {
        alert('Por favor inicia sesión para ver tus estadísticas.');
        return;
    }

    try {
        const response = await fetch('/api/emotions/history?limit=20', {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        const result = await response.json();

        if (result.success) {
            renderEmotionalChart(result.data);
        } else {
            console.error('Error cargando historial:', result.error);
        }
    } catch (error) {
        console.error('Error de red:', error);
    }
}

function renderEmotionalChart(data) {
    const ctx = document.getElementById('emotionalHistoryChart');
    if (!ctx) return;

    // Preparar datos para Chart.js
    // Invertir array para cronológico (DB devuelve DESC)
    const sortedData = data.reverse();

    const labels = sortedData.map(item => {
        const date = new Date(item.created_at);
        return `${date.getDate()}/${date.getMonth() + 1} ${date.getHours()}:${date.getMinutes()}`;
    });

    const values = sortedData.map(item => item.valence); // -1 a 1
    const colors = values.map(v => v > 0 ? '#4CAF50' : (v < 0 ? '#F44336' : '#FFC107'));

    // Destruir chart previo si existe
    if (emotionalChartInstance) {
        emotionalChartInstance.destroy();
    }

    emotionalChartInstance = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [{
                label: 'Estado de Ánimo (Valence)',
                data: values,
                borderColor: '#2196F3',
                backgroundColor: 'rgba(33, 150, 243, 0.1)',
                pointBackgroundColor: colors,
                pointRadius: 6,
                fill: true,
                tension: 0.4
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: {
                    min: -1,
                    max: 1,
                    ticks: {
                        callback: function (value) {
                            if (value === 1) return '😁 Excelente';
                            if (value === 0.5) return '🙂 Bien';
                            if (value === 0) return '😐 Neutral';
                            if (value === -0.5) return '😕 Mal';
                            if (value === -1) return '😫 Pésimo';
                            return '';
                        }
                    }
                }
            },
            plugins: {
                legend: {
                    display: false
                },
                tooltip: {
                    callbacks: {
                        label: function (context) {
                            const val = context.raw;
                            let mood = 'Neutral';
                            if (val > 0.5) mood = 'Muy Bien';
                            else if (val > 0) mood = 'Bien';
                            else if (val < -0.5) mood = 'Muy Mal';
                            else if (val < 0) mood = 'Mal';
                            return `Estado: ${mood} (${val})`;
                        }
                    }
                }
            }
        }
    });
}
