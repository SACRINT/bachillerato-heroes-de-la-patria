// Peer Tutoring Viewer Logic

let currentTutors = [];
let selectedTutor = null;

document.addEventListener('DOMContentLoaded', () => {
    loadTutors();
    setupFilters();
});

async function loadTutors() {
    const grid = document.getElementById('tutors-grid');
    const empty = document.getElementById('empty-state');

    // Get filter values
    const subject = document.getElementById('subject-filter').value;
    const maxPrice = document.getElementById('price-range').value;
    const minRating = document.querySelector('input[name="rating"]:checked').value;

    try {
        const token = localStorage.getItem('token');
        const headers = token ? { 'Authorization': `Bearer ${token}` } : {};

        // Build URL
        const url = `/api/tutors/match?subject=${subject}&maxRate=${maxPrice}&minRating=${minRating}`;

        // Fallback to mock data if API fails or is not ready
        let tutors;
        try {
            const response = await fetch(url, { headers });
            if (!response.ok) throw new Error('API Error');
            const result = await response.json();
            tutors = result.data;
        } catch (e) {
            void 0;
            tutors = getMockTutors(); // Fallback
        }

        currentTutors = applyLocalFilters(tutors, { subject, maxPrice, minRating });

        if (currentTutors.length === 0) {
            grid.innerHTML = '';
            grid.classList.add('d-none');
            empty.classList.remove('d-none');
        } else {
            empty.classList.add('d-none');
            grid.classList.remove('d-none');
            renderTutors(currentTutors, grid);
        }

    } catch (error) {
        console.error('Error loading tutors:', error);
        grid.innerHTML = '<div class="alert alert-danger w-100">Error cargando tutores.</div>';
    }
}

function renderTutors(tutors, container) {
    container.innerHTML = tutors.map(tutor => `
        <div class="col">
            <div class="tutor-card">
                <div class="tutor-header">
                    <img src="${tutor.avatar_url || 'images/default-avatar.png'}" class="tutor-avatar" alt="${tutor.user_name}">
                    <div class="tutor-info">
                        <h3 class="tutor-name">${tutor.user_name}</h3>
                        <div class="tutor-rating">
                            <i class="fas fa-star me-1"></i> ${tutor.rating} 
                            <span class="text-muted fw-normal ms-1">(${tutor.total_reviews} reseñas)</span>
                        </div>
                    </div>
                    <div class="text-end">
                        <div class="tutor-rate">
                            <i class="fas fa-coins coin-icon fs-6"></i> ${tutor.hourly_rate}
                        </div>
                        <small class="text-muted">/hr</small>
                    </div>
                </div>
                
                <div class="mb-3">
                    ${renderSubjects(tutor.subjects)}
                </div>
                
                <p class="tutor-bio">${tutor.bio || 'Sin biografía disponible.'}</p>
                
                <button class="btn btn-outline-primary w-100 mt-auto" onclick="openBookingModal(${tutor.id})">
                    Reservar Sesión
                </button>
            </div>
        </div>
    `).join('');
}

function renderSubjects(subjects) {
    if (!subjects) return '';
    // Normalize if string or json
    const list = Array.isArray(subjects) ? subjects : [subjects];
    return list.map(sub => `<span class="badge-skill">${sub}</span>`).join('');
}

// --- Booking Logic ---

function openBookingModal(tutorId) {
    selectedTutor = currentTutors.find(t => t.id === tutorId);
    if (!selectedTutor) return;

    // Populate modal
    document.getElementById('modal-tutor-name').textContent = selectedTutor.user_name;
    document.getElementById('modal-tutor-img').src = selectedTutor.avatar_url || 'images/default-avatar.png';
    document.getElementById('modal-tutor-rate').textContent = selectedTutor.hourly_rate;
    document.getElementById('modal-cost-preview').textContent = `${selectedTutor.hourly_rate} IACoins`;

    // Reset form
    document.getElementById('booking-form').reset();
    document.querySelectorAll('.time-slot').forEach(el => el.classList.remove('selected'));
    document.getElementById('selected-time').value = '';

    // Show modal
    new bootstrap.Modal(document.getElementById('bookingModal')).show();
}

function selectTime(element, time) {
    document.querySelectorAll('.time-slot').forEach(el => el.classList.remove('selected'));
    element.classList.add('selected');
    document.getElementById('selected-time').value = time;
}

async function confirmBooking() {
    const topic = document.getElementById('session-topic').value;
    const date = document.getElementById('session-date').value;
    const time = document.getElementById('selected-time').value;

    if (!topic || !date || !time) {
        alert('Por favor completa todos los campos de la reserva.');
        return;
    }

    const scheduledAt = `${date}T${time}:00`;

    try {
        const token = localStorage.getItem('token');
        if (!token) {
            alert('Debes iniciar sesión para reservar.');
            return;
        }

        const response = await fetch('/api/tutors/session', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
                tutorId: selectedTutor.id,
                subject: topic, // Using topic as subject for now or allow user select from tutor subjects
                scheduled_at: scheduledAt,
                cost: selectedTutor.hourly_rate,
                notes: `Topic: ${topic}`
            })
        });

        const result = await response.json();

        if (result.success) {
            bootstrap.Modal.getInstance(document.getElementById('bookingModal')).hide();
            alert('¡Sesión reservada exitosamente! Te hemos notificado por correo.');
        } else {
            throw new Error(result.error);
        }

    } catch (error) {
        console.error('Booking error:', error);
        alert('Error al reservar: ' + error.message);
    }
}

// --- Filters & Mock Data ---

function setupFilters() {
    const range = document.getElementById('price-range');
    const display = document.getElementById('price-display');
    range.addEventListener('input', (e) => {
        display.textContent = `${e.target.value} MAX`;
    });
}

function applyFilters() {
    loadTutors();
}

function applyLocalFilters(tutors, filters) {
    // Si el backend no filtra (ej. Mock), filtramos aquí
    return tutors.filter(t => {
        if (filters.subject && !JSON.stringify(t.subjects).includes(filters.subject)) return false;
        if (t.hourly_rate > filters.maxPrice) return false;
        if (t.rating < filters.minRating) return false;
        return true;
    });
}

function getMockTutors() {
    return [
        {
            id: 101,
            user_name: "Ana García",
            avatar_url: "https://randomuser.me/api/portraits/women/44.jpg",
            bio: "Estudiante de 6to semestre. Ganadora de la Olimpiada de Matemáticas 2024. Me encanta explicar cálculo de forma sencilla.",
            rating: 4.9,
            total_reviews: 24,
            hourly_rate: 150,
            subjects: ["Matemáticas", "Física"]
        },
        {
            id: 102,
            user_name: "Carlos Méndez",
            avatar_url: "https://randomuser.me/api/portraits/men/32.jpg",
            bio: "Nativo en inglés (viví 5 años en Texas). Te ayudo con tu pronunciación y gramática para el examen TOEFL.",
            rating: 4.7,
            total_reviews: 18,
            hourly_rate: 120,
            subjects: ["Inglés"]
        },
        {
            id: 103,
            user_name: "Sofía Lerma",
            avatar_url: "https://randomuser.me/api/portraits/women/68.jpg",
            bio: "Experta en Química Orgánica. Tengo apuntes resumidos que te ayudarán a pasar el parcial sin sufrir.",
            rating: 5.0,
            total_reviews: 42,
            hourly_rate: 200,
            subjects: ["Química", "Biología"]
        },
        {
            id: 104,
            user_name: "Miguel Ángel",
            avatar_url: "https://randomuser.me/api/portraits/men/85.jpg",
            bio: "Programador Full Stack. Te enseño Python, JavaScript y cómo sobrevivir a la clase de Informática II.",
            rating: 4.5,
            total_reviews: 9,
            hourly_rate: 100,
            subjects: ["Programación", "Matemáticas"]
        }
    ];
}
