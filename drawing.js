const brushColorPicker = document.getElementById('brush-color-picker');
const brushSizeInput = document.getElementById('brush-size');
const eraseModeToggle = document.getElementById('erase-mode-toggle');
const brushToggleButton = document.getElementById('brush-toggle');
const deleteAllLayersButton = document.getElementById('delete-all-layers'); // New button

let isBrushEnabled = false;
let isDrawing = false;
let brushColor = '#000000'; // Default brush color
let brushSize = 5; // Default brush size
let isEraseMode = false;

let drawings = [];
let drawCounter = 1;
let currentDrawing = null;

// Update brush color
brushColorPicker.addEventListener('input', () => {
    brushColor = brushColorPicker.value;
    isEraseMode = false; // Disable erase mode when changing color
    eraseModeToggle.checked = false;
});

// Update brush size
brushSizeInput.addEventListener('input', () => {
    brushSize = parseInt(brushSizeInput.value, 10);
});

// Toggle erase mode
eraseModeToggle.addEventListener('change', () => {
    isEraseMode = eraseModeToggle.checked;
});

// Toggle brush mode
brushToggleButton.addEventListener('click', () => {
    isBrushEnabled = !isBrushEnabled;
    brushToggleButton.textContent = isBrushEnabled ? 'Disable Brush' : 'Enable Brush';
});

// Start drawing
canvas.addEventListener('mousedown', (event) => {
    if (!isBrushEnabled) return;

    const rect = canvas.getBoundingClientRect();
    const x = event.clientX - rect.left - canvasOffset.x;
    const y = event.clientY - rect.top - canvasOffset.y;

    const scale = currentZoom / 100;
    const paperPixelWidth = paperWidth * 96 * scale;
    const paperPixelHeight = paperHeight * 96 * scale;
    const offsetX = (canvas.width - paperPixelWidth) / 2;
    const offsetY = (canvas.height - paperPixelHeight) / 2;

    // Check if the click is within the paper area
    if (
        x >= offsetX &&
        x <= offsetX + paperPixelWidth &&
        y >= offsetY &&
        y <= offsetY + paperPixelHeight
    ) {
        isDrawing = true;
        ctx.beginPath();
        ctx.moveTo(x, y);
        currentDrawing = { points: [], color: brushColor, size: brushSize, erase: false };
    }
});

// Draw on canvas
canvas.addEventListener('mousemove', (event) => {
    if (!isDrawing) return;

    const rect = canvas.getBoundingClientRect();
    const x = event.clientX - rect.left - canvasOffset.x;
    const y = event.clientY - rect.top - canvasOffset.y;

    ctx.lineWidth = brushSize;
    ctx.lineCap = 'round';
    ctx.strokeStyle = isEraseMode ? '#FFFFFF' : brushColor;

    ctx.lineTo(x, y);
    ctx.stroke();

    if (currentDrawing) {
        currentDrawing.points.push({ x, y });
        currentDrawing.color = isEraseMode ? '#FFFFFF' : brushColor;
        currentDrawing.size = brushSize;
        currentDrawing.erase = isEraseMode;
    }
});

// Stop drawing
canvas.addEventListener('mouseup', () => {
    if (isDrawing) {
        ctx.closePath();
        isDrawing = false;

        if (currentDrawing) {
            drawings.push(currentDrawing);
            addDrawingToLayerPanel(drawCounter++);
            currentDrawing = null;
        }
    }
});

// Stop drawing when the mouse leaves the canvas
canvas.addEventListener('mouseleave', () => {
    if (isDrawing) {
        ctx.closePath();
        isDrawing = false;

        if (currentDrawing) {
            drawings.push(currentDrawing);
            addDrawingToLayerPanel(drawCounter++);
            currentDrawing = null;
        }
    }
});

// Redraw all drawings
function redrawDrawings() {
    drawings.forEach((drawing) => {
        ctx.beginPath();
        ctx.lineWidth = drawing.size;
        ctx.lineCap = 'round';
        ctx.strokeStyle = drawing.color;

        drawing.points.forEach((point, index) => {
            if (index === 0) {
                ctx.moveTo(point.x, point.y);
            } else {
                ctx.lineTo(point.x, point.y);
            }
        });

        ctx.stroke();
        ctx.closePath();
    });
}

// Add drawing to the layer panel
function addDrawingToLayerPanel(id) {
    const layerList = document.getElementById('layer-list');
    const layerItem = document.createElement('li');
    layerItem.textContent = `Draw ${id}`;
    layerItem.dataset.drawId = id;

    const deleteIcon = document.createElement('span');
    deleteIcon.textContent = '✖';
    deleteIcon.classList.add('delete-icon');
    deleteIcon.addEventListener('click', () => {
        deleteDrawing(id);
    });

    layerItem.appendChild(deleteIcon);
    layerList.appendChild(layerItem);

    layerItem.addEventListener('click', () => {
        const currentHighlight = highlightedElement;
        highlightedElement = currentHighlight === id ? null : id;
        drawCanvas();
        if (highlightedElement) highlightDrawing(id);
    });
}

// Highlight a drawing
function highlightDrawing(id) {
    const drawing = drawings[id - 1];
    if (!drawing) return;

    drawCanvas();
    ctx.save();
    ctx.lineWidth = drawing.size + 2;
    ctx.strokeStyle = 'red';

    ctx.beginPath();
    drawing.points.forEach((point, index) => {
        if (index === 0) {
            ctx.moveTo(point.x, point.y);
        } else {
            ctx.lineTo(point.x, point.y);
        }
    });
    ctx.stroke();
    ctx.restore();
}

// Delete a drawing by ID
function deleteDrawing(id) {
    drawings = drawings.filter((_, index) => index !== id - 1);

    const layerList = document.getElementById('layer-list');
    layerList.innerHTML = '';
    dots.forEach((dot) => addDotToLayerPanel(dot.number));
    drawings.forEach((_, index) => addDrawingToLayerPanel(index + 1));
    images.forEach((image) => {
        const layerItem = document.createElement('li');
        layerItem.textContent = `Image ${image.id}`;
        layerItem.dataset.imageId = image.id;

        const deleteIcon = document.createElement('span');
        deleteIcon.textContent = '✖';
        deleteIcon.classList.add('delete-icon');
        deleteIcon.addEventListener('click', () => {
            deleteImage(image.id);
        });

        layerItem.appendChild(deleteIcon);
        layerList.appendChild(layerItem);
    });

    drawCanvas();
    redrawDrawings();
}

// Delete all layers
deleteAllLayersButton.addEventListener('click', () => {
    dots = [];
    drawings = [];
    images = [];
    drawCounter = 1;
    dotCounter = 1;

    const layerList = document.getElementById('layer-list');
    layerList.innerHTML = '';

    drawCanvas(); // Clear the canvas
});


canvas.addEventListener('touchstart', (event) => {
    if (!isBrushEnabled) return;

    const touch = event.touches[0];
    const rect = canvas.getBoundingClientRect();
    const x = touch.clientX - rect.left - canvasOffset.x;
    const y = touch.clientY - rect.top - canvasOffset.y;

    const scale = currentZoom / 100;
    const paperPixelWidth = paperWidth * 96 * scale;
    const paperPixelHeight = paperHeight * 96 * scale;
    const offsetX = (canvas.width - paperPixelWidth) / 2;
    const offsetY = (canvas.height - paperPixelHeight) / 2;

    if (
        x >= offsetX &&
        x <= offsetX + paperPixelWidth &&
        y >= offsetY &&
        y <= offsetY + paperPixelHeight
    ) {
        isDrawing = true;
        ctx.beginPath();
        ctx.moveTo(x, y);
        currentDrawing = { points: [], color: brushColor, size: brushSize, erase: false };
    }
});

canvas.addEventListener('touchmove', (event) => {
    if (!isDrawing) return;

    const touch = event.touches[0];
    const rect = canvas.getBoundingClientRect();
    const x = touch.clientX - rect.left - canvasOffset.x;
    const y = touch.clientY - rect.top - canvasOffset.y;

    ctx.lineWidth = brushSize;
    ctx.lineCap = 'round';
    ctx.strokeStyle = isEraseMode ? '#FFFFFF' : brushColor;

    ctx.lineTo(x, y);
    ctx.stroke();

    if (currentDrawing) {
        currentDrawing.points.push({ x, y });
        currentDrawing.color = isEraseMode ? '#FFFFFF' : brushColor;
        currentDrawing.size = brushSize;
        currentDrawing.erase = isEraseMode;
    }
});

canvas.addEventListener('touchend', () => {
    if (isDrawing) {
        ctx.closePath();
        isDrawing = false;

        if (currentDrawing) {
            drawings.push(currentDrawing);
            addDrawingToLayerPanel(drawCounter++);
            currentDrawing = null;
        }
    }
});
