// Whiteboard Logic
const canvas = document.getElementById('whiteboard');
const ctx = canvas.getContext('2d');
const wrapper = document.getElementById('canvas-wrapper');

let isDrawing = false;
let currentTool = 'pen';
let currentColor = '#000000';
let currentLineWidth = 2;
let lastX = 0;
let lastY = 0;

// Resize canvas
function resizeCanvas() {
    canvas.width = wrapper.clientWidth;
    canvas.height = wrapper.clientHeight;
}
window.addEventListener('resize', resizeCanvas);
resizeCanvas();

// Initial Drawing State
ctx.lineJoin = 'round';
ctx.lineCap = 'round';

// --- Events ---

canvas.addEventListener('mousedown', startDrawing);
canvas.addEventListener('mousemove', draw);
canvas.addEventListener('mouseup', stopDrawing);
canvas.addEventListener('mouseout', stopDrawing);

// Touch support
canvas.addEventListener('touchstart', (e) => {
    e.preventDefault();
    const touch = e.touches[0];
    const mouseEvent = new MouseEvent('mousedown', {
        clientX: touch.clientX,
        clientY: touch.clientY
    });
    canvas.dispatchEvent(mouseEvent);
});

canvas.addEventListener('touchmove', (e) => {
    e.preventDefault();
    const touch = e.touches[0];
    const mouseEvent = new MouseEvent('mousemove', {
        clientX: touch.clientX,
        clientY: touch.clientY
    });
    canvas.dispatchEvent(mouseEvent);
});

canvas.addEventListener('touchend', () => {
    const mouseEvent = new MouseEvent('mouseup', {});
    canvas.dispatchEvent(mouseEvent);
});


function startDrawing(e) {
    isDrawing = true;
    [lastX, lastY] = [e.offsetX, e.offsetY];
}

function draw(e) {
    if (!isDrawing) return;

    if (currentTool === 'pen') {
        ctx.strokeStyle = currentColor;
        ctx.lineWidth = currentLineWidth;
        ctx.beginPath();
        ctx.moveTo(lastX, lastY);
        ctx.lineTo(e.offsetX, e.offsetY);
        ctx.stroke();

        // Emit logic here (Socket.emit('draw', { x, y, lx, ly, color ... }))
    } else if (currentTool === 'eraser') {
        ctx.clearRect(e.offsetX - 10, e.offsetY - 10, 20, 20);
        // Emit logic here
    }

    [lastX, lastY] = [e.offsetX, e.offsetY];
}

function stopDrawing() {
    isDrawing = false;
    // Emit end stroke
}

// --- Tools ---

function setTool(tool) {
    currentTool = tool;

    // UI Update
    document.querySelectorAll('.tool-btn').forEach(btn => btn.classList.remove('active'));
    // Find button by onclick attr roughly
    const btns = document.querySelectorAll('.tool-btn');
    if (tool === 'pen') btns[0].classList.add('active');
    if (tool === 'eraser') btns[1].classList.add('active');
    if (tool === 'rect') btns[2].classList.add('active');
}

function setColor(color) {
    currentColor = color;
    // Prevent button click from switching tool if clicked on color
    event.stopPropagation();
}

function clearCanvas() {
    if (confirm('¿Borrar toda la pizarra?')) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        // Emit clear
    }
}

async function saveSnapshot() {
    // Save locally or to server
    const dataURL = canvas.toDataURL();
    void 0;

    // POST /api/collab/sessions/:id/snapshot
    // Real impl: fetch(...)
    alert('Pizarra guardada con éxito');
}
