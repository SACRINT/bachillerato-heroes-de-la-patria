
// Logic for handling Parent Credentials in Admin Dashboard

document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('generateCredentialsForm');
    const tableBody = document.getElementById('credentialsTableBody');
    const exportBtn = document.getElementById('exportCredentialsBtn');

    // Store latest generated data for export (since it contains the temp passwords)
    let lastGeneratedData = [];

    if (form) {
        form.addEventListener('submit', async (e) => {
            e.preventDefault();

            if (!confirm('¿Está seguro de generar credenciales? Esto creará cuentas para los alumnos seleccionados.')) return;

            const formData = new FormData(form);
            const data = Object.fromEntries(formData.entries());

            // Convert empty strings to null/undefined or handle in backend
            // Our backend expects { grado: "1", grupo: "A" } or nothing.

            try {
                showLoading(true);
                const token = localStorage.getItem('token');
                const response = await fetch('/api/parents/credentials/generate', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    },
                    body: JSON.stringify(data)
                });

                const result = await response.json();

                if (result.success) {
                    lastGeneratedData = result.data;
                    renderTable(result.data);
                    alert(`Éxito: ${result.message}`);
                } else {
                    alert('Error: ' + result.error || result.message);
                }
            } catch (error) {
                console.error('Error generating credentials:', error);
                alert('Error de conexión al generar credenciales');
            } finally {
                showLoading(false);
            }
        });
    }

    if (exportBtn) {
        exportBtn.addEventListener('click', () => {
            if (!lastGeneratedData || lastGeneratedData.length === 0) {
                alert('No hay datos recientes con contraseñas para exportar. Genere un nuevo lote.');
                return;
            }

            // Create CSV
            let csv = 'Usuario,Password Temporal,Matricula,ID Estudiante\n';
            lastGeneratedData.forEach(row => {
                // row: { student_id, username, temp_pass }
                csv += `${row.username},${row.temp_pass},${row.username.replace('P-', '')},${row.student_id}\n`;
            });

            const blob = new Blob([csv], { type: 'text/csv' });
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.setAttribute('hidden', '');
            a.setAttribute('href', url);
            a.setAttribute('download', 'credenciales_padres_' + new Date().toISOString().slice(0, 10) + '.csv');
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
        });
    }

    function renderTable(data) {
        tableBody.innerHTML = '';
        if (data.length === 0) {
            tableBody.innerHTML = '<tr><td colspan="5" class="text-center">No se generaron credenciales</td></tr>';
            return;
        }

        data.forEach(item => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>${item.username}</td>
                <td class="text-danger fw-bold">${item.temp_pass}</td>
                <td>ID: ${item.student_id}</td>
                <td>-</td>
                <td><span class="badge bg-success">Generada</span></td>
            `;
            tableBody.appendChild(tr);
        });
    }

    function showLoading(isLoading) {
        const btn = form.querySelector('button[type="submit"]');
        if (btn) {
            btn.disabled = isLoading;
            btn.innerHTML = isLoading ? '<i class="fas fa-spinner fa-spin"></i> Generando...' : '<i class="fas fa-magic me-2"></i>Generar Credenciales';
        }
    }
});
