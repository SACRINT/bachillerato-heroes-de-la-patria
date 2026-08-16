/**
 * 🎬 VIDEO PLAYER ENGINE
 * Propósito: Integra Plyr con eventos interactivos y seguimiento de progreso
 */

let player;
let videoData = null;
let activeInteraction = null;
const videoId = new URLSearchParams(window.location.search).get('id') || 1; // Default to ID 1 for testing

document.addEventListener('DOMContentLoaded', () => {
    loadVideoData(videoId);
});

async function loadVideoData(id) {
    try {
        const token = localStorage.getItem('token');
        if (!token) {
            window.location.href = 'login.html';
            return;
        }

        const res = await fetch(`/api/videos/${id}/interactive`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const json = await res.json();

        if (json.success) {
            videoData = json.data;
            initPlayer(videoData);
            renderBookmarks(videoData.userBookmarks);
            document.getElementById('video-title').textContent = videoData.title;
        } else {
            alert('Error cargando video: ' + json.error);
        }
    } catch (e) {
        console.error('Error fetching video', e);
    }
}

function initPlayer(data) {
    const videoElement = document.getElementById('player');

    // Setup Source
    if (data.provider === 'youtube') {
        videoElement.dataset.plyrProvider = 'youtube';
        videoElement.dataset.plyrEmbedId = extractYoutubeId(data.video_url);
    } else {
        const source = document.createElement('source');
        source.src = data.video_url;
        source.type = 'video/mp4';
        videoElement.appendChild(source);
    }

    // Initialize Plyr
    player = new Plyr('#player', {
        controls: ['play-large', 'play', 'progress', 'current-time', 'mute', 'volume', 'captions', 'settings', 'pip', 'airplay', 'fullscreen'],
        settings: ['captions', 'quality', 'speed'],
        speed: { selected: 1, options: [0.5, 0.75, 1, 1.25, 1.5, 2] }
    });

    // Event Listeners
    player.on('timeupdate', checkInteractions);
    player.on('timeupdate', throttle(saveProgress, 5000));
    player.on('ended', () => saveProgress(true));

    // Restore Progress
    if (data.userProgress && data.userProgress.last_position_seconds > 0) {
        player.once('ready', () => {
            player.currentTime = data.userProgress.last_position_seconds;
        });
    }
}

// --- INTERACTIONS LOGIC ---

function checkInteractions() {
    if (!videoData || !videoData.interactions) return;

    const currentTime = Math.floor(player.currentTime);

    // Find interaction at current second that hasn't been shown recently
    const interaction = videoData.interactions.find(i =>
        i.timestamp_seconds === currentTime &&
        activeInteraction !== i.id
    );

    if (interaction) {
        showInteraction(interaction);
    }
}

function showInteraction(interaction) {
    activeInteraction = interaction.id;
    if (interaction.pause_video) {
        player.pause();
    }

    const overlay = document.getElementById('interaction-overlay');
    const content = document.getElementById('interaction-content');
    const title = document.getElementById('interaction-title');
    const continueBtn = document.getElementById('interaction-continue');

    // Reset UI
    continueBtn.classList.add('d-none');

    if (interaction.interaction_type === 'quiz') {
        title.textContent = 'Pregunta de Repaso';
        const payload = interaction.content_payload;

        let html = `<p class="lead mb-4">${payload.question}</p>`;
        payload.options.forEach((opt, idx) => {
            html += `<button class="quiz-option" onclick="checkAnswer(this, ${idx}, ${payload.correct})">${opt}</button>`;
        });
        content.innerHTML = (typeof DOMPurify !== 'undefined' ? DOMPurify.sanitize(html) : (typeof sanitizeHTML === 'function' ? sanitizeHTML(html) : html));

    } else {
        title.textContent = 'Información Importante';
        content.innerHTML = `<p>${interaction.content_payload.text}</p>`;
        continueBtn.classList.remove('d-none');
    }

    overlay.classList.add('active');

    // Exit Fullscreen if active (overlays doesn't work well over native fullscreen)
    if (player.fullscreen.active) player.fullscreen.exit();
}

function checkAnswer(btn, selectedIdx, correctIdx) {
    const options = document.querySelectorAll('.quiz-option');
    options.forEach(o => o.disabled = true); // Disable all

    if (selectedIdx === correctIdx) {
        btn.style.borderColor = '#10b981';
        btn.style.backgroundColor = '#d1fae5';
        btn.innerHTML += ' <i class="fas fa-check text-success float-end"></i>';
        setTimeout(() => resumeVideo(), 1500); // Auto continue on correct
    } else {
        btn.style.borderColor = '#ef4444';
        btn.style.backgroundColor = '#fee2e2';
        btn.innerHTML += ' <i class="fas fa-times text-danger float-end"></i>';

        // Highlight correct one
        const correctBtn = options[correctIdx];
        correctBtn.style.borderColor = '#10b981';

        // Show button to continue anyway (or force retry logic)
        document.getElementById('interaction-continue').classList.remove('d-none');
    }
}

function resumeVideo() {
    document.getElementById('interaction-overlay').classList.remove('active');
    player.play();

    // Allow re-triggering this interaction if rewound? 
    // Usually no, but 'activeInteraction' prevents immediate re-trigger loop.
    // Resetting it after a few seconds allows re-trigger on rewind.
    setTimeout(() => { activeInteraction = null; }, 5000);
}

// --- PERSISTENCE ---

async function saveProgress(completed = false) {
    if (!videoData) return;
    const position = Math.floor(player.currentTime);

    try {
        await fetch(`/api/videos/${videoData.id}/progress`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            },
            body: JSON.stringify({ position, completed })
        });
    } catch (e) { console.error('Error saving progress', e); }
}

async function addBookmark() {
    const note = document.getElementById('bookmark-note').value;
    if (!note) return;

    try {
        const timestamp = Math.floor(player.currentTime);
        const res = await fetch(`/api/videos/${videoData.id}/bookmark`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            },
            body: JSON.stringify({ timestamp, note })
        });

        const json = await res.json();
        if (json.success) {
            document.getElementById('bookmark-note').value = '';
            // Add to UI
            addBookmarkToUI(json.data);
        }
    } catch (e) { console.error(e); }
}

function renderBookmarks(bookmarks) {
    const list = document.getElementById('bookmarks-list');
    list.innerHTML = '';
    bookmarks.forEach(addBookmarkToUI);
}

function addBookmarkToUI(bm) {
    const list = document.getElementById('bookmarks-list');
    const min = Math.floor(bm.timestamp_seconds / 60);
    const sec = bm.timestamp_seconds % 60;
    const timeStr = `${min}:${sec.toString().padStart(2, '0')}`;

    const div = document.createElement('div');
    div.className = 'card mb-2 bg-dark border-secondary text-white';
    div.innerHTML = `
        <div class="card-body p-2 d-flex justify-content-between align-items-center">
            <div class="small" style="cursor:pointer;" onclick="player.currentTime = ${bm.timestamp_seconds}">
                <span class="badge bg-primary me-2">${timeStr}</span>
                ${bm.note}
            </div>
            <button class="btn btn-link btn-sm text-danger p-0" onclick="deleteBookmark(${bm.id}, this)"><i class="fas fa-times"></i></button>
        </div>
    `;
    list.prepend(div);
}

// --- UTILS ---

function throttle(func, limit) {
    let inThrottle;
    return function () {
        const args = arguments;
        const context = this;
        if (!inThrottle) {
            func.apply(context, args);
            inThrottle = true;
            setTimeout(() => inThrottle = false, limit);
        }
    }
}

function extractYoutubeId(url) {
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11) ? match[2] : null;
}
