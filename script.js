const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');
const sizeSelect = document.getElementById('size-select');
const widthInput = document.getElementById('width-input');
const heightInput = document.getElementById('height-input');
const zoomInput = document.getElementById('zoom-input');
const dotToggle = document.getElementById('dot-toggle');
const uploadImageButton = document.getElementById('upload-image');

let isDotModeEnabled = false;
let dots = [];
let images = [];
let dotCounter = 1;

let currentZoom = 100;
let draggingObject = null;
let resizingImage = null;
let isMiddleMousePressed = false;
let canvasOffset = { x: 0, y: 0 };

let paperWidth = 5.83; // A5 width in inches
let paperHeight = 8.27; // A5 height in inches

function setCanvasFullscreen() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    drawCanvas();
}

function drawCanvas() {
    ctx.setTransform(1, 0, 0, 1, canvasOffset.x, canvasOffset.y); // Apply panning offset
    ctx.clearRect(-canvasOffset.x, -canvasOffset.y, canvas.width, canvas.height); // Clear the canvas relative to offset

    drawPaper(); // Redraw the paper
    drawImages(); // Redraw the images
    redrawDrawings(); // Redraw all existing drawings
    drawDots(); // Redraw the dots
}

function drawPaper() {
    const scale = currentZoom / 100;
    const paperPixelWidth = paperWidth * 96 * scale;
    const paperPixelHeight = paperHeight * 96 * scale;

    const offsetX = (canvas.width - paperPixelWidth) / 2;
    const offsetY = (canvas.height - paperPixelHeight) / 2;

    ctx.fillStyle = '#fff';
    ctx.fillRect(offsetX, offsetY, paperPixelWidth, paperPixelHeight);
    ctx.strokeStyle = '#ccc';
    ctx.strokeRect(offsetX, offsetY, paperPixelWidth, paperPixelHeight);
}

const dotColorPicker = document.getElementById('dot-color-picker');
let dotColor = '#0000ff'; // Default color for dots

dotColorPicker.addEventListener('input', () => {
    dotColor = dotColorPicker.value;
    drawCanvas();
});

let dotSize = 5;
let fontSize = 12;

const dotSizeSelect = document.getElementById('dot-size-select');

const sizeMap = {
    normal: { dot: 5, font: 12 },
    medium: { dot: 8, font: 16 },
    large: { dot: 12, font: 20 },
    'extra-large': { dot: 16, font: 24 }
};

dotSizeSelect.addEventListener('change', () => {
    const selectedSize = dotSizeSelect.value;
    dotSize = sizeMap[selectedSize].dot;
    fontSize = sizeMap[selectedSize].font;
    drawCanvas();
});

function drawDots() {
    dots.forEach((dot) => {
        ctx.beginPath();
        ctx.arc(dot.x, dot.y, dotSize, 0, Math.PI * 2);
        ctx.fillStyle = dotColor;
        ctx.fill();
        ctx.font = `${fontSize}px Arial`;
        ctx.fillStyle = 'black';
        ctx.fillText(dot.number, dot.x + dotSize + 3, dot.y + dotSize / 2);
    });
}

function drawImages() {
    images.forEach((image) => {
        ctx.save();
        ctx.globalAlpha = image.transparency || 1;
        ctx.drawImage(image.img, image.x, image.y, image.width, image.height);

        if (!isDotModeEnabled) {
            ctx.fillStyle = 'red';
            ctx.fillRect(
                image.x + image.width - 10,
                image.y + image.height - 10,
                10,
                10
            );
        }

        ctx.restore();
    });
}

function updateDotsAfterResize(oldZoom, newZoom) {
    const scale = newZoom / oldZoom;
    dots.forEach((dot) => {
        dot.x *= scale;
        dot.y *= scale;
    });
}

let highlightedElement = null;

function addDotToLayerPanel(id) {
    const layerList = document.getElementById('layer-list');
    const layerItem = document.createElement('li');
    layerItem.textContent = `Dot ${id}`;
    layerItem.dataset.dotId = id;

    const deleteIcon = document.createElement('span');
    deleteIcon.textContent = '✖';
    deleteIcon.classList.add('delete-icon');
    deleteIcon.addEventListener('click', () => {
        deleteDot(id);
    });

    layerItem.appendChild(deleteIcon);
    layerList.appendChild(layerItem);

    layerItem.addEventListener('click', () => {
        const currentHighlight = highlightedElement;
        highlightedElement = currentHighlight === id ? null : id;
        drawCanvas();
        if (highlightedElement) highlightDot(dots.find((dot) => dot.number === id));
    });
}

function updateLayerPanel() {
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

        layerItem.addEventListener('click', () => {
            const currentHighlight = highlightedElement;
            highlightedElement = currentHighlight === image.id ? null : image.id;
            drawCanvas();
            if (highlightedElement) highlightImage(image);
        });
    });
}

function highlightDot(dot) {
    if (!dots.includes(dot)) return;

    drawCanvas();
    ctx.save();
    ctx.beginPath();
    ctx.arc(dot.x, dot.y, 10, 0, Math.PI * 2);
    ctx.strokeStyle = 'red';
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.restore();
}

function highlightImage(image) {
    if (!images.includes(image)) return;

    drawCanvas();
    ctx.save();
    ctx.strokeStyle = 'red';
    ctx.lineWidth = 2;
    ctx.strokeRect(image.x, image.y, image.width, image.height);
    ctx.restore();
}

function deleteDot(dotNumber) {
    drawCanvas();
    dots = dots.filter((dot) => dot.number !== dotNumber);
    dots.forEach((dot, index) => {
        dot.number = index + 1;
    });

    dotCounter = dots.length + 1;
    updateLayerPanel();
    drawCanvas();
    redrawDrawings();
}

function deleteImage(imageId) {
    drawCanvas();
    images = images.filter((image) => image.id !== imageId);

    updateLayerPanel();
    drawCanvas();
}

sizeSelect.addEventListener('change', () => {
    let width, height;
    switch (sizeSelect.value) {
        case 'A4':
            width = 8.27;
            height = 11.69;
            break;
        case 'A5':
            width = 5.83;
            height = 8.27;
            break;
        case 'Letter':
            width = 8.5;
            height = 11;
            break;
    }
    paperWidth = width;
    paperHeight = height;

    widthInput.value = paperWidth.toFixed(2);
    heightInput.value = paperHeight.toFixed(2);
    drawCanvas();
});

[widthInput, heightInput].forEach((input) => {
    input.addEventListener('blur', () => {
        paperWidth = parseFloat(widthInput.value);
        paperHeight = parseFloat(heightInput.value);
        drawCanvas();
    });
});

zoomInput.addEventListener('input', () => {
    const oldZoom = currentZoom;
    currentZoom = parseInt(zoomInput.value, 10);
    updateDotsAfterResize(oldZoom, currentZoom);
    drawCanvas();
    redrawDrawings();
});

dotToggle.addEventListener('click', () => {
    isDotModeEnabled = !isDotModeEnabled;
    dotToggle.textContent = isDotModeEnabled ? 'Disable Dot-to-Dot' : 'Enable Dot-to-Dot';
    draggingObject = null;
    resizingImage = null;
});

uploadImageButton.addEventListener('click', () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/jpeg, image/png, image/webp';

    input.addEventListener('change', (event) => {
        const file = event.target.files[0];
        if (!file) return;

        const img = new Image();
        img.src = URL.createObjectURL(file);

        img.onload = () => {
            const aspectRatio = img.width / img.height;
            const paperPixelWidth = paperWidth * 96 * (currentZoom / 100);
            const paperPixelHeight = paperHeight * 96 * (currentZoom / 100);
            const offsetX = (canvas.width - paperPixelWidth) / 2;
            const offsetY = (canvas.height - paperPixelHeight) / 2;

            const imageObj = {
                id: `image-${images.length + 1}`,
                img,
                x: offsetX + 10,
                y: offsetY + 10,
                width: 200,
                height: 200 / aspectRatio,
            };

            images.push(imageObj);
            updateLayerPanel();
            drawCanvas();
        };
    });

    input.click();
});

canvas.addEventListener('mousedown', (event) => {
    const rect = canvas.getBoundingClientRect();
    const x = event.clientX - rect.left - canvasOffset.x;
    const y = event.clientY - rect.top - canvasOffset.y;

    if (event.button === 0 && isDotModeEnabled) {
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
            const newDot = { x, y, number: dotCounter++ };
            dots.push(newDot);
            addDotToLayerPanel(newDot.number);
            updateLayerPanel();
            drawCanvas();
        }
    } else if (event.button === 1) {
        isMiddleMousePressed = true;

        [...dots, ...images].forEach((object) => {
            if (object.width) {
                if (object.isLocked) return;
                const inResizeArea =
                    x >= object.x + object.width - 10 &&
                    x <= object.x + object.width &&
                    y >= object.y + object.height - 10 &&
                    y <= object.y + object.height;

                if (inResizeArea) {
                    resizingImage = object;
                } else if (
                    x >= object.x &&
                    x <= object.x + object.width &&
                    y >= object.y &&
                    y <= object.y + object.height
                ) {
                    draggingObject = object;
                }
            } else {
                if (Math.sqrt((object.x - x) ** 2 + (object.y - y) ** 2) < 10) {
                    draggingObject = object;
                }
            }
        });
    }
});

canvas.addEventListener('mousemove', (event) => {
    if (draggingObject || resizingImage) {
        const rect = canvas.getBoundingClientRect();
        const x = event.clientX - rect.left - canvasOffset.x;
        const y = event.clientY - rect.top - canvasOffset.y;

        if (resizingImage) {
            const aspectRatio = resizingImage.width / resizingImage.height;
            resizingImage.width = Math.max(50, x - resizingImage.x);
            resizingImage.height = resizingImage.width / aspectRatio;

            const paperPixelWidth = paperWidth * 96 * (currentZoom / 100);
            const paperPixelHeight = paperHeight * 96 * (currentZoom / 100);
            const offsetX = (canvas.width - paperPixelWidth) / 2;
            const offsetY = (canvas.height - paperPixelHeight) / 2;

            resizingImage.width = Math.min(
                resizingImage.width,
                paperPixelWidth - (resizingImage.x - offsetX)
            );
            resizingImage.height = Math.min(
                resizingImage.height,
                paperPixelHeight - (resizingImage.y - offsetY)
            );
        } else if (draggingObject && isMiddleMousePressed) {
            if (draggingObject.isLocked) return;

            const scale = currentZoom / 100;
            const paperPixelWidth = paperWidth * 96 * scale;
            const paperPixelHeight = paperHeight * 96 * scale;
            const offsetX = (canvas.width - paperPixelWidth) / 2;
            const offsetY = (canvas.height - paperPixelHeight) / 2;

            const objectWidth = draggingObject.width || 0;
            const objectHeight = draggingObject.height || 0;

            draggingObject.x = Math.max(
                offsetX,
                Math.min(x - objectWidth / 2, offsetX + paperPixelWidth - objectWidth)
            );
            draggingObject.y = Math.max(
                offsetY,
                Math.min(y - objectHeight / 2, offsetY + paperPixelHeight - objectHeight)
            );
        }

        drawCanvas();
    }
});

canvas.addEventListener('mouseup', () => {
    draggingObject = null;
    resizingImage = null;
    isMiddleMousePressed = false;
});

setCanvasFullscreen();
window.addEventListener('resize', setCanvasFullscreen);
