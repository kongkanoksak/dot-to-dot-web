let canvas = document.getElementById('canvas');
let ctx = canvas.getContext('2d');
let imageLoader = document.getElementById('imageLoader');
let dropArea = document.getElementById('drop-area');
let img = new Image();

let dotSeries = [];  // Store multiple series of dots
let currentSeries = [];  // Track the current series of dots
let dotMode = false;  // Toggle for dot mode
let connectDotsActive = false;  // Toggle for connect-the-dots mode
let dotCount = 0;  // Starting number for each series
let seriesNo = 0;  // Track the current series number
let intervalId = null;
let selectedColor = '#ff0000';  // Default dot color
let fadeAmount = 50;  // Default fade amount to 50%
let isFaded = false;

// Drag-and-Drop Logic
['dragenter', 'dragover'].forEach(eventName => {
    dropArea.addEventListener(eventName, (e) => {
        e.preventDefault();
        dropArea.classList.add('drag-over');
    });
});

['dragleave', 'drop'].forEach(eventName => {
    dropArea.addEventListener(eventName, (e) => {
        e.preventDefault();
        dropArea.classList.remove('drag-over');
    });
});

dropArea.addEventListener('drop', (e) => {
    let dt = e.dataTransfer;
    let file = dt.files[0];
    handleImage(file);
});

dropArea.addEventListener('click', () => {
    imageLoader.click();  // Trigger file input when drop area is clicked
});

// Handle file selection via click or drag-and-drop
imageLoader.addEventListener('change', function(e) {
    let file = e.target.files[0];
    handleImage(file);
});

function handleImage(file) {
    let reader = new FileReader();
    reader.onload = function(event) {
        img.src = event.target.result;
        img.onload = function() {
            canvas.width = img.width + 100;
            canvas.height = img.height + 100;
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            ctx.fillStyle = 'white';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            ctx.drawImage(img, 50, 50);
            document.getElementById('changeColorButton').disabled = false;
        };
    };
    reader.readAsDataURL(file);
}

// Apply fade effect based on the fade percentage
function applyFadeEffect() {
    let fadeValue = parseInt(document.getElementById('fadeAmount').value) || fadeAmount;
    fadeValue = Math.max(0, Math.min(fadeValue, 100));  // Clamp between 0 and 100

    // Redraw the image with the fade effect
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = 'white';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.globalAlpha = (100 - fadeValue) / 100;  // Apply fade effect based on the value
    ctx.drawImage(img, 50, 50);
    ctx.globalAlpha = 1.0;  // Reset alpha for other drawings
}

// Change Color Button Logic (Apply fade)
document.getElementById('changeColorButton').addEventListener('click', function() {
    applyFadeEffect();
    redrawCanvas();
});

// Color Picker Change (for Dot Color)
document.getElementById('colorPicker').addEventListener('input', function() {
    selectedColor = this.value;  // Set selected color
});

// Dot Mode Toggle
document.getElementById('dotButton').addEventListener('click', function() {
    dotMode = !dotMode;  // Toggle dot mode ON/OFF
    if (dotMode) {
        dotCount = 0;  // Reset dot count for the new series
        currentSeries = [];  // Start a new series of dots
        dotSeries.push(currentSeries);  // Add the new series to the series array
        seriesNo++;  // Increment series number
        document.getElementById('startingNo').value = seriesNo;  // Update series number in textbox
        canvas.style.cursor = 'crosshair';
    } else {
        canvas.style.cursor = 'default';
    }
});

// Place Dots
canvas.addEventListener('click', function(e) {
    if (dotMode) {
        let rect = canvas.getBoundingClientRect();
        let x = e.clientX - rect.left;
        let y = e.clientY - rect.top;

        // Draw the dot with the selected color
        ctx.fillStyle = selectedColor;
        ctx.beginPath();
        ctx.arc(x, y, 5, 0, Math.PI * 2);
        ctx.fill();
        ctx.font = '12px Arial';
        ctx.fillStyle = selectedColor;
        ctx.fillText(dotCount, x + 8, y + 8);

        // Store dot data in the current series
        currentSeries.push({ x: x, y: y, number: dotCount, color: selectedColor });
        dotCount++;  // Increment dot number
    }
});

// Undo Button
document.getElementById('undoButton').addEventListener('click', function() {
    if (currentSeries.length > 0) {
        currentSeries.pop();  // Remove the last dot
        dotCount--;
        redrawCanvas();
    }
});

// Clear Button
document.getElementById('clearButton').addEventListener('click', function() {
    dotSeries = [];  // Clear all series
    dotCount = 0;
    seriesNo = 0;  // Reset series number
    currentSeries = [];
    document.getElementById('startingNo').value = seriesNo;
    redrawCanvas();
});

// Redraw Canvas (including dots)
function redrawCanvas() {
    applyFadeEffect();  // Apply fade to image if needed

    // Redraw all dots from all series
    dotSeries.forEach(function(series) {
        series.forEach(function(dot) {
            ctx.fillStyle = dot.color;  // Use the color that was set when the dot was placed
            ctx.beginPath();
            ctx.arc(dot.x, dot.y, 5, 0, Math.PI * 2);
            ctx.fill();
            ctx.font = '12px Arial';
            ctx.fillText(dot.number, dot.x + 8, dot.y + 8);
        });
    });
}

// "Connect the Dots" Button Logic
document.getElementById('connectDotsButton').addEventListener('click', function() {
    if (!connectDotsActive) {
        connectDotsActive = true;
        connectDots();  // Start connecting dots
    } else {
        connectDotsActive = false;
        clearInterval(intervalId);  // Stop connecting dots
        redrawCanvas();  // Redraw to remove lines but keep dots
    }
});

// Function to Connect the Dots (Series-wise, closes the loop)
function connectDots() {
    let seriesIndex = 0;
    let dotIndex = 0;

    intervalId = setInterval(function() {
        if (seriesIndex < dotSeries.length) {
            let series = dotSeries[seriesIndex];
            if (dotIndex < series.length - 1) {
                let start = series[dotIndex];
                let end = series[dotIndex + 1];

                // Draw line from one dot to the next
                ctx.strokeStyle = 'blue';
                ctx.lineWidth = 2;
                ctx.beginPath();
                ctx.moveTo(start.x, start.y);
                ctx.lineTo(end.x, end.y);
                ctx.stroke();

                dotIndex++;
            } else {
                // Close the loop by connecting the last dot to the 0th dot
                let start = series[dotIndex];
                let end = series[0];
                ctx.strokeStyle = 'blue';
                ctx.lineWidth = 2;
                ctx.beginPath();
                ctx.moveTo(start.x, start.y);
                ctx.lineTo(end.x, end.y);
                ctx.stroke();

                seriesIndex++;
                dotIndex = 0;  // Reset for the next series
            }
        } else {
            clearInterval(intervalId);  // Stop once all series are connected
        }
    }, 500);  // Adjust speed if necessary
}

// Download Button
document.getElementById('downloadButton').addEventListener('click', function() {
    let downloadCanvas = document.createElement('canvas');
    let downloadCtx = downloadCanvas.getContext('2d');

    downloadCanvas.width = canvas.width;
    downloadCanvas.height = canvas.height;

    downloadCtx.fillStyle = 'white';
    downloadCtx.fillRect(0, 0, downloadCanvas.width, downloadCanvas.height);

    // Draw dots and numbers for the download canvas
    dotSeries.forEach(function(series) {
        series.forEach(function(dot) {
            downloadCtx.fillStyle = dot.color;
            downloadCtx.beginPath();
            downloadCtx.arc(dot.x, dot.y, 5, 0, Math.PI * 2);
            downloadCtx.fill();
            downloadCtx.font = '12px Arial';
            downloadCtx.fillText(dot.number, dot.x + 8, dot.y + 8);
        });
    });

    let link = document.createElement('a');
    link.download = 'dot-to-dot.png';
    link.href = downloadCanvas.toDataURL('image/png');
    link.click();
});
