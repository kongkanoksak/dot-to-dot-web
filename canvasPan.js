let isPanning = false;
let panStart = { x: 0, y: 0 };

// Function to check if the mouse is inside the paper area
function isMouseInsidePaper(event) {
    const rect = canvas.getBoundingClientRect();
    const x = event.clientX - rect.left - canvasOffset.x;
    const y = event.clientY - rect.top - canvasOffset.y;

    const scale = currentZoom / 100;
    const paperPixelWidth = paperWidth * 96 * scale;
    const paperPixelHeight = paperHeight * 96 * scale;

    const offsetX = (canvas.width - paperPixelWidth) / 2;
    const offsetY = (canvas.height - paperPixelHeight) / 2;

    return (
        x >= offsetX &&
        x <= offsetX + paperPixelWidth &&
        y >= offsetY &&
        y <= offsetY + paperPixelHeight
    );
}

// Start panning when the middle mouse button is pressed outside the paper
canvas.addEventListener('mousedown', (event) => {
    if (event.button === 1 && !isMouseInsidePaper(event) && !isDotModeEnabled) {
        isPanning = true;
        panStart = { x: event.clientX, y: event.clientY };
        canvas.style.cursor = 'grab';
    }
});


// Handle mouse movement for panning
canvas.addEventListener('mousemove', (event) => {
    if (isPanning) {
        const dx = event.clientX - panStart.x;
        const dy = event.clientY - panStart.y;

        canvasOffset.x += dx;
        canvasOffset.y += dy;

        panStart = { x: event.clientX, y: event.clientY };

        drawCanvas(); // Redraw the canvas with the updated offset
    }
});

// Stop panning when the middle mouse button is released
canvas.addEventListener('mouseup', () => {
    if (isPanning) {
        isPanning = false;
        canvas.style.cursor = 'default';
    }
});

// Reset panning state if the mouse leaves the canvas
canvas.addEventListener('mouseleave', () => {
    if (isPanning) {
        isPanning = false;
        canvas.style.cursor = 'default';
    }
});
