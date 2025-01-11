// Save controls
const fileTypeSelect = document.getElementById('file-type');
const saveButton = document.getElementById('save-button');
const saveOnlyDotsCheckbox = document.getElementById('save-only-dots');
const transparencySlider = document.getElementById('transparency-slider');
const imageLockToggle = document.getElementById('image-lock-toggle');

// Save File Functionality
function saveCanvasAsFile() {
    const fileType = fileTypeSelect.value;
    const fileName = `canvas.${fileType}`;
    
    const tempCanvas = document.createElement('canvas');
    const tempCtx = tempCanvas.getContext('2d');

    const scale = currentZoom / 100;
    const paperPixelWidth = paperWidth * 96 * scale;
    const paperPixelHeight = paperHeight * 96 * scale;

    tempCanvas.width = paperPixelWidth;
    tempCanvas.height = paperPixelHeight;

    // Draw paper background
    tempCtx.fillStyle = '#fff';
    tempCtx.fillRect(0, 0, paperPixelWidth, paperPixelHeight);

    // Draw elements based on checkbox state
    if (!saveOnlyDotsCheckbox.checked) {
        images.forEach((image) => {
            tempCtx.globalAlpha = image.transparency || 1;
            tempCtx.drawImage(
                image.img,
                image.x - (canvas.width - paperPixelWidth) / 2,
                image.y - (canvas.height - paperPixelHeight) / 2,
                image.width,
                image.height
            );
        });
    }

    // Draw dots
    dots.forEach((dot) => {
        tempCtx.beginPath();
        tempCtx.arc(
            dot.x - (canvas.width - paperPixelWidth) / 2,
            dot.y - (canvas.height - paperPixelHeight) / 2,
            5,
            0,
            Math.PI * 2
        );
        tempCtx.fillStyle = dotColor;
        tempCtx.fill();
        tempCtx.font = '12px Arial';
        tempCtx.fillStyle = 'black';
        tempCtx.fillText(
            dot.number,
            dot.x - (canvas.width - paperPixelWidth) / 2 + 8,
            dot.y - (canvas.height - paperPixelHeight) / 2 + 3
        );
    });

    // Convert the canvas content to the selected file type and download
    tempCanvas.toBlob((blob) => {
        const link = document.createElement('a');
        link.download = fileName;
        link.href = URL.createObjectURL(blob);
        link.click();
    }, `image/${fileType}`);
}

// Handle Transparency
function handleTransparency() {
    const selectedImage = images.find((image) => image.isSelected);
    if (selectedImage) {
        selectedImage.transparency = transparencySlider.value / 100;
        drawCanvas();
    }
}

// Handle Lock/Unlock Movement
function handleLockToggle() {
    const selectedImage = images.find((image) => image.isSelected);
    if (selectedImage) {
        selectedImage.isLocked = imageLockToggle.checked;
    }
}

// Attach event listeners
transparencySlider.addEventListener('input', handleTransparency);
imageLockToggle.addEventListener('change', handleLockToggle);
saveButton.addEventListener('click', saveCanvasAsFile);

// Modify image selection logic in `script.js` to enable/disable controls
canvas.addEventListener('mousedown', (event) => {
    const rect = canvas.getBoundingClientRect();
    const x = event.clientX - rect.left - canvasOffset.x;
    const y = event.clientY - rect.top - canvasOffset.y;

    // Check if clicked on an image
    let clickedImage = images.find((image) => {
        return (
            x >= image.x &&
            x <= image.x + image.width &&
            y >= image.y &&
            y <= image.y + image.height
        );
    });

    if (clickedImage) {
        images.forEach((image) => (image.isSelected = false)); // Deselect others
        clickedImage.isSelected = true;
        transparencySlider.disabled = false;
        imageLockToggle.disabled = false;
        imageLockToggle.checked = clickedImage.isLocked || false;
    } else {
        // Deselect all images
        images.forEach((image) => (image.isSelected = false));
        transparencySlider.disabled = true;
        imageLockToggle.disabled = true;
    }
});
