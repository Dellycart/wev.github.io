// script.js

// --- Global Variables and Setup ---
const backgroundCanvas = document.getElementById('backgroundCanvas');
const bgCtx = backgroundCanvas.getContext('2d');
const drawingCanvas = document.getElementById('drawingCanvas');
const drawCtx = drawingCanvas.getContext('2d');

const startButton = document.getElementById('startButton');
const tryAgainButton = document.getElementById('tryAgainButton');
const messageDisplay = document.getElementById('messageDisplay');
const centralScoreDisplayWrapper = document.getElementById('centralScoreDisplayWrapper');
const centralScoreText = document.getElementById('centralScoreText');
const scoreMessage = document.getElementById('scoreMessage');
const highScoreDisplay = document.getElementById('highScoreDisplay'); 
const orientationOverlay = document.getElementById('orientation-overlay');

let isDrawing = false;
let drawingPoints = [];
let animationFrameId;

let targetCircle = null; // Stores {x, y, radius} of the ideal circle
let currentDrawingColor; // This is now used for the *overall* line color selection (not gradient)
const drawingColors = [ // Array of base colors for line aesthetics (now used for the start/end of the accuracy gradient)
    '#FFD700', // Gold
    '#ADFF2F', // GreenYellow
    '#00FFFF', // Cyan
    '#FF69B4', // HotPink
    '#8A2BE2', // BlueViolet
    '#F4A460', // SandyBrown
    '#90EE90', // LightGreen
    '#FF4500'  // OrangeRed
];
let currentColorIndex = 0; // Index to cycle through drawingColors for initial color

let highScore = 0; // Stores the high score, initialized on load

// Tone.js setup
let synth, reverb, gainNode;

// Define an accuracy color scale (Red -> Yellow -> Green)
const accuracyColorScale = ['#FF0000', '#FFFF00', '#00FF00']; // Red (bad), Yellow (okay), Green (good)


// --- Utility Functions ---

/**
 * Interpolates between two hex colors.
 * @param {string} color1 - Hex string for the first color (e.g., '#RRGGBB').
 * @param {string} color2 - Hex string for the second color (e.g., '#RRGGBB').
 * @param {number} amount - A value between 0 (color1) and 1 (color2).
 * @returns {string} The interpolated color in hex format.
 */
function lerpColor(color1, color2, amount) {
    const f = parseInt(color1.slice(1), 16),
        t = parseInt(color2.slice(1), 16),
        R1 = f >> 16,
        G1 = (f >> 8) & 0x00FF,
        B1 = f & 0x0000FF,
        R2 = t >> 16,
        G2 = (t >> 8) & 0x00FF,
        B2 = t & 0x0000FF;
    
    const R = Math.round((R2 - R1) * amount) + R1;
    const G = Math.round((G2 - G1) * amount) + G1;
    const B = Math.round((B2 - B1) * amount) + B1;

    // Ensure all components are within 0-255 range and format as hex
    const toHex = (c) => Math.min(255, Math.max(0, c)).toString(16).padStart(2, '0');
    return `#${toHex(R)}${toHex(G)}${toHex(B)}`;
}

/**
 * Maps a numerical value (like accuracy or deviation) to a color from a predefined spectrum.
 * @param {number} value - The input value (e.g., accuracy 0-100).
 * @param {Array<string>} spectrum - Array of hex color strings, ordered from 'bad' (low value) to 'good' (high value).
 * @param {number} minVal - Minimum possible value corresponding to the first color in the spectrum.
 * @param {number} maxVal - Maximum possible value corresponding to the last color in the spectrum.
 * @returns {string} Hex color string representing the mapped color.
 */
function mapValueToColor(value, spectrum, minVal, maxVal) {
    const clampedValue = Math.max(minVal, Math.min(maxVal, value));
    const normalizedValue = (clampedValue - minVal) / (maxVal - minVal); // Normalize to 0 to 1
    
    if (spectrum.length === 1) return spectrum[0];
    if (spectrum.length === 0) return '#FFFFFF'; // Default white

    // Calculate segment index and amount within that segment
    const segmentSize = 1.0 / (spectrum.length - 1);
    const segmentIndex = Math.floor(normalizedValue / segmentSize);
    const segmentAmount = (normalizedValue % segmentSize) / segmentSize;

    // Handle edge cases for min/max values
    if (segmentIndex >= spectrum.length - 1) {
        return spectrum[spectrum.length - 1]; // Return the last color if at or beyond max
    }
    
    // Interpolate between the two colors of the current segment
    return lerpColor(spectrum[segmentIndex], spectrum[segmentIndex + 1], segmentAmount);
}

/**
 * Resizes both canvases to fit the window and adjusts for device pixel ratio (DPR)
 * to ensure crisp rendering on high-DPI screens (e.g., Retina displays).
 * This function should be called on initial load and whenever the window is resized.
 */
function resizeCanvases() {
    // Get the device pixel ratio, defaulting to 1 if not available.
    const dpr = window.devicePixelRatio || 1;

    // Set the CSS (display) size of the canvases.
    backgroundCanvas.style.width = window.innerWidth + 'px';
    backgroundCanvas.style.height = window.innerHeight + 'px';
    drawingCanvas.style.width = window.innerWidth + 'px';
    drawingCanvas.style.height = window.innerHeight + 'px';

    // Set the actual resolution (internal drawing buffer size) of the canvases.
    backgroundCanvas.width = window.innerWidth * dpr;
    backgroundCanvas.height = window.innerHeight * dpr;
    drawingCanvas.width = window.innerWidth * dpr;
    drawingCanvas.height = window.innerHeight * dpr;

    // Scale the drawing contexts to match the DPR.
    bgCtx.setTransform(dpr, 0, 0, dpr, 0, 0);
    drawCtx.setTransform(dpr, 0, 0, dpr, 0, 0);

    drawBackground();

    if (isDrawing && drawingPoints.length > 0) {
        drawUserPath(); // Redraw the current path if drawing
    } else if (targetCircle) {
        drawTargetAndUserCircles(targetCircle, drawingPoints); // Redraw final result
    }
}

/**
 * Displays a message in the designated message area.
 * @param {string} text - The message content.
 * @param {string} type - The type of message (e.g., 'info', 'warning', 'error') for potential styling.
 */
function showMessage(text, type = 'info') {
    messageDisplay.textContent = text;
    messageDisplay.classList.remove('text-red-400', 'text-yellow-400', 'text-gray-300', 'text-blue-300'); // Remove all possible previous classes
    if (type === 'error') {
        messageDisplay.classList.add('text-red-400');
    } else if (type === 'warning') {
        messageDisplay.classList.add('text-yellow-400');
    } else if (type === 'info') {
        messageDisplay.classList.add('text-blue-300'); // Use blue for info/live accuracy
    } else {
        messageDisplay.classList.add('text-gray-300');
    }
}

/**
 * Calculates the properties (center and radius) of a circle that best fits a given set of points.
 * This is a simplified approach; a more advanced fitting algorithm would yield better results.
 * @param {Array<Object>} points - An array of {x, y} coordinates drawn by the user.
 * @returns {Object|null} An object {x, y, radius} representing the fitted circle, or null if not enough points.
 */
function calculateCircleProperties(points) {
    if (points.length < 3) return null; // Need at least 3 points to define a circle

    let sumX = 0, sumY = 0;
    for (let p of points) {
        sumX += p.x;
        sumY += p.y;
    }
    const centerX = sumX / points.length;
    const centerY = sumY / points.length;

    let sumRadius = 0;
    for (let p of points) {
        sumRadius += Math.sqrt(Math.pow(p.x - centerX, 2) + Math.pow(p.y - centerY, 2));
    }
    const radius = sumRadius / points.length;

    return { x: centerX, y: centerY, radius: radius };
}

/**
 * Calculates a score for how "perfect" the drawn circle is compared to the target circle.
 * This function incorporates checks for circularity, closedness, and general shape validity.
 * @param {Array<Object>} drawnPoints - The actual points drawn by the user.
 * @param {Object} targetCircle - The calculated ideal circle {x, y, radius}.
 * @returns {number} The score (0-100), or -1 if the shape is clearly not a circle.
 */
function calculateCircleScore(drawnPoints, targetCircle) {
    if (drawnPoints.length < 30 || !targetCircle || targetCircle.radius < 10) {
        return -1;
    }

    let totalDeviation = 0;
    let minRadiusObserved = Infinity;
    let maxRadiusObserved = 0;
    const radii = [];

    let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;

    for (let p of drawnPoints) {
        const distanceToCenter = Math.sqrt(Math.pow(p.x - targetCircle.x, 2) + Math.pow(p.y - targetCircle.y, 2));
        const deviation = Math.abs(distanceToCenter - targetCircle.radius);
        totalDeviation += deviation;

        minRadiusObserved = Math.min(minRadiusObserved, distanceToCenter);
        maxRadiusObserved = Math.max(maxRadiusObserved, distanceToCenter);
        radii.push(distanceToCenter);

        minX = Math.min(minX, p.x);
        maxX = Math.max(maxX, p.x);
        minY = Math.min(minY, p.y);
        maxY = Math.max(maxY, p.y);
    }

    const averageDeviation = totalDeviation / drawnPoints.length;

    let penalty = 0;

    const sumOfSquaredDiffs = radii.reduce((acc, r) => acc + Math.pow(r - targetCircle.radius, 2), 0);
    const variance = sumOfSquaredDiffs / radii.length;
    const stdDev = Math.sqrt(variance);
    const normalizedStdDev = stdDev / targetCircle.radius;
    penalty += Math.min(normalizedStdDev * 100 * 0.5, 40);

    const width = maxX - minX;
    const height = maxY - minY;
    if (width === 0 || height === 0) return -1;
    const aspectRatio = Math.min(width, height) / Math.max(width, height);
    penalty += (1 - aspectRatio) * 100 * 0.4;
    penalty = Math.min(penalty, 30);

    const radiusRangeRatio = (maxRadiusObserved > 0) ? minRadiusObserved / maxRadiusObserved : 0;
    penalty += (1 - radiusRangeRatio) * 100 * 0.4;
    penalty = Math.min(penalty, 30);

    const startToEndDistance = Math.sqrt(Math.pow(drawnPoints[0].x - drawnPoints[drawnPoints.length - 1].x, 2) +
                                          Math.pow(drawnPoints[0].y - drawnPoints[drawnPoints.length - 1].y, 2));
    const closureThreshold = targetCircle.radius * 0.3;
    if (startToEndDistance > closureThreshold) {
        penalty += Math.min( (startToEndDistance / targetCircle.radius) * 20, 40);
    }

    let drawnPathLength = 0;
    for (let i = 1; i < drawnPoints.length; i++) {
        drawnPathLength += Math.sqrt(
            Math.pow(drawnPoints[i].x - drawnPoints[i-1].x, 2) +
            Math.pow(drawnPoints[i].y - drawnPoints[i-1].y, 2)
        );
    }
    const targetCircumference = 2 * Math.PI * targetCircle.radius;

    if (drawnPathLength < targetCircumference * 0.6 || drawnPathLength > targetCircumference * 2.0) {
        penalty += (1 - Math.min(drawnPathLength / targetCircumference, targetCircumference / drawnPathLength)) * 100 * 0.5;
        penalty = Math.min(penalty, 50);
    }

    const maxDimension = Math.min(window.innerWidth, window.innerHeight);
    const normalizedAverageDeviation = averageDeviation / (maxDimension / 4);
    let baseScore = Math.max(0, 100 - (normalizedAverageDeviation * 100));

    let finalScore = baseScore - penalty;
    finalScore = Math.max(0, finalScore);

    if (finalScore < 50 || aspectRatio < 0.4 || normalizedStdDev > 0.4 || targetCircle.radius / maxDimension < 0.05) {
        return -1;
    }

    return Math.round(finalScore);
}


// --- Drawing Functions ---

/**
 * Draws the subtle background elements (e.g., twinkling stars) on the background canvas.
 * Clears the canvas before drawing.
 */
function drawBackground() {
    bgCtx.clearRect(0, 0, backgroundCanvas.width, backgroundCanvas.height);
    for (let i = 0; i < 100; i++) {
        const x = Math.random() * window.innerWidth;
        const y = Math.random() * window.innerHeight;
        const radius = Math.random() * 1.5;
        const opacity = Math.random() * 0.8 + 0.2;
        bgCtx.beginPath();
        bgCtx.arc(x, y, radius, 0, Math.PI * 2);
        bgCtx.fillStyle = `rgba(255, 255, 255, ${opacity})`;
        bgCtx.fill();
    }
}

/**
 * Clears the drawing canvas.
 */
function clearDrawingCanvas() {
    drawCtx.clearRect(0, 0, drawingCanvas.width, drawingCanvas.height);
}

/**
 * Draws the user's freehand path on the drawing canvas.
 * Applies glow and styling to the line using a dynamic gradient based on local accuracy.
 */
function drawUserPath() {
    clearDrawingCanvas();
    if (drawingPoints.length < 2) return;

    // Use a provisional target circle based on all points drawn so far
    let provisionalTargetCircle = calculateCircleProperties(drawingPoints); 

    drawCtx.lineWidth = 4; // Made line thicker from 2 to 4
    drawCtx.lineCap = 'round';
    drawCtx.lineJoin = 'round';

    // Loop to draw segments, applying color based on local accuracy
    for (let i = 1; i < drawingPoints.length; i++) {
        const p1 = drawingPoints[i - 1];
        const p2 = drawingPoints[i];

        // Only apply accuracy-based coloring if we have a provisional target circle
        // and its radius is meaningful. Otherwise, use a neutral color.
        if (provisionalTargetCircle && provisionalTargetCircle.radius > 10) {
            // Calculate deviation of the current point (p2) from the provisional target circle
            const distanceToCenter = Math.sqrt(Math.pow(p2.x - provisionalTargetCircle.x, 2) + Math.pow(p2.y - provisionalTargetCircle.y, 2));
            const deviation = Math.abs(distanceToCenter - provisionalTargetCircle.radius);

            // Define a max expected deviation for color mapping. Adjust this value
            // to make the gradient more or less sensitive to deviation.
            const maxExpectedDeviation = Math.min(window.innerWidth, window.innerHeight) * 0.1; // 10% of smaller screen dimension

            // Map deviation to an accuracy value (higher accuracy = lower deviation)
            // Invert deviation: 0 deviation = 100 accuracy, maxDeviation = 0 accuracy
            let accuracyValue = Math.max(0, 100 - (deviation / maxExpectedDeviation) * 100);
            
            // Get color based on accuracy using the accuracyColorScale
            const segmentColor = mapValueToColor(accuracyValue, accuracyColorScale, 0, 100);

            drawCtx.beginPath();
            drawCtx.moveTo(p1.x, p1.y);
            drawCtx.lineTo(p2.x, p2.y);

            drawCtx.strokeStyle = segmentColor;
            drawCtx.shadowBlur = 8; // Slightly less blur than before, for multiple segments
            drawCtx.shadowColor = segmentColor; // Shadow matches segment color
            drawCtx.stroke();
        } else {
            // If no provisional target circle yet (very early drawing), draw in a neutral color
            drawCtx.beginPath();
            drawCtx.moveTo(p1.x, p1.y);
            drawCtx.lineTo(p2.x, p2.y);
            drawCtx.strokeStyle = 'rgba(255, 255, 255, 0.5)'; // Light grey for initial segments
            drawCtx.shadowBlur = 0;
            drawCtx.shadowColor = 'transparent';
            drawCtx.stroke();
        }
    }
    // Reset shadow after drawing all segments
    drawCtx.shadowBlur = 0;
    drawCtx.shadowColor = 'transparent';
}

/**
 * Draws both the calculated target circle and the user's drawn path.
 * Used after the drawing is finished and scored.
 * @param {Object} target - The calculated ideal circle {x, y, radius}.
 * @param {Array<Object>} userPoints - The points drawn by the user.
 */
function drawTargetAndUserCircles(target, userPoints) {
    clearDrawingCanvas();

    if (userPoints.length > 1) {
        // Only redraw the user's path, do not draw the target circle.
        drawUserPath();
    }

    // Removed the code that draws the purple target circle here.
}

/**
 * Creates a particle burst effect at a given origin.
 * @param {number} originX - The X coordinate of the particle origin (screen pixels).
 * @param {number} originY - The Y coordinate of the particle origin (screen pixels).
 * @param {number} count - The number of particles to create.
 * @param {string} color - The base color of the particles.
 */
function createParticleEffect(originX, originY, count = 30, color = '#FFFFFF') {
    const container = document.body;
    for (let i = 0; i < count; i++) {
        const particle = document.createElement('div');
        particle.classList.add('particle');
        particle.style.backgroundColor = color;

        particle.style.left = `${originX}px`;
        particle.style.top = `${originY}px`;

        const startOffsetX = (Math.random() - 0.5) * 20;
        const startOffsetY = (Math.random() - 0.5) * 20;
        particle.style.transform = `translate(${startOffsetX}px, ${startOffsetY}px) scale(0)`;
        particle.style.opacity = 0;

        const angle = Math.random() * Math.PI * 2;
        const distance = 50 + Math.random() * 100;
        const translateX = Math.cos(angle) * distance;
        const translateY = Math.sin(angle) * distance;

        particle.style.setProperty('--particle-end-transform-x', `${translateX}px`);
        particle.style.setProperty('--particle-end-transform-y', `${translateY}px`);
        
        particle.style.animation = `particle-burst 1s forwards ${i * 0.02}s`; 

        container.appendChild(particle);

        particle.addEventListener('animationend', () => {
            particle.remove();
        }, { once: true });
    }
}


// --- High Score Management ---
/**
 * Loads the high score from localStorage.
 */
function loadHighScore() {
    const storedHighScore = localStorage.getItem('perfectCircleHighScore');
    if (storedHighScore !== null) {
        highScore = parseInt(storedHighScore, 10);
    }
    highScoreDisplay.textContent = `High Score: ${highScore}%`;
    highScoreDisplay.classList.remove('hidden');
}

/**
 * Saves the current high score to localStorage.
 * @param {number} score - The score to potentially save as high score.
 */
function saveHighScore(score) {
    if (score > highScore) {
        highScore = score;
        localStorage.setItem('perfectCircleHighScore', highScore.toString());
        highScoreDisplay.textContent = `High Score: ${highScore}%`;
    }
}

// --- Game State Management ---

/**
 * Starts a new game round. Resets drawing state and UI.
 */
function startGame() {
    clearDrawingCanvas();
    drawingPoints = [];
    isDrawing = false;
    messageDisplay.textContent = 'Draw a perfect circle! Click or touch to start.';
    startButton.style.display = 'none';
    tryAgainButton.style.display = 'none';
    centralScoreDisplayWrapper.classList.add('hidden');
    centralScoreText.classList.remove('show', 'hide');
    scoreMessage.classList.add('hidden');
    highScoreDisplay.classList.remove('hidden');

    // Cycle to the next drawing color for the initial gradient base (though actual gradient changes by accuracy)
    currentColorIndex = (currentColorIndex + 1) % drawingColors.length;

    if (synth) synth.triggerAttackRelease('C4', '8n');
}

/**
 * Concludes the drawing phase, calculates the score, and updates the UI.
 * Handles cases where drawing is too short or a circle cannot be detected.
 */
function finishDrawing() {
    if (!isDrawing) return;
    isDrawing = false;
    cancelAnimationFrame(animationFrameId); // Stop the drawing animation loop

    // Calculate the final best-fit circle for scoring
    targetCircle = calculateCircleProperties(drawingPoints);

    const score = calculateCircleScore(drawingPoints, targetCircle);

    if (score === -1) {
        showMessage("Incorrect Shape! Please draw a circle.", 'error');
        clearDrawingCanvas();
        if (synth) synth.triggerAttackRelease('F#3', '16n');
    } else {
        displayScore(score);
        drawTargetAndUserCircles(targetCircle, drawingPoints); // Re-draw with final targetCircle for accurate visual comparison
        saveHighScore(score);
        if (score >= 95) {
            if (synth) synth.triggerAttackRelease('G5', '4n');
        } else if (score >= 80) {
            if (synth) synth.triggerAttackRelease('E5', '8n');
        } else {
            if (synth) synth.triggerAttackRelease('C5', '8n');
        }
    }
    tryAgainButton.style.display = 'block';
}

/**
 * Displays the calculated score and a corresponding message.
 * @param {number} score - The percentage score for the drawn circle.
 */
function displayScore(score) {
    centralScoreDisplayWrapper.classList.remove('hidden');
    centralScoreText.textContent = `${score}%`;
    centralScoreText.classList.remove('opacity-0', 'scale-50', 'hide');
    centralScoreText.classList.add('show');

    if (score >= 98) {
        scoreMessage.textContent = "Cosmic Perfection!";
    } else if (score >= 90) {
        scoreMessage.textContent = "Stellar!";
    } else if (score >= 80) {
        scoreMessage.textContent = "Great job!";
    } else if (score >= 60) {
        scoreMessage.textContent = "Keep practicing!";
    } else {
        scoreMessage.textContent = "You'll get there!";
    }
    scoreMessage.classList.remove('hidden');

    if (score >= 90) {
        const rect = centralScoreDisplayWrapper.getBoundingClientRect();
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;
        createParticleEffect(centerX, centerY, 50, '#FFD700');
    }

    showMessage(""); // Clear the main message display
}

/**
 * Resets the game to its initial state, clearing canvases and hiding score.
 */
function resetGame() {
    clearDrawingCanvas();
    drawingPoints = [];
    isDrawing = false;
    targetCircle = null;
    centralScoreDisplayWrapper.classList.add('hidden');
    centralScoreText.classList.remove('show');
    centralScoreText.classList.add('hide');
    scoreMessage.classList.add('hidden');
    highScoreDisplay.classList.remove('hidden');
    startButton.style.display = 'block';
    tryAgainButton.style.display = 'none';
    messageDisplay.textContent = 'Ready to draw a perfect circle?';

    if (synth) synth.triggerAttackRelease('A3', '8n');
}

// --- Event Handlers for Drawing ---

/**
 * Retrieves the correct coordinates from a pointer event (mouse or touch).
 * @param {PointerEvent} e - The pointer event object.
 * @returns {Object} An object {x, y} with coordinates relative to the canvas.
 */
function getCanvasCoordinates(e) {
    const clientX = e.touches && e.touches[0] ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches && e.touches[0] ? e.touches[0].clientY : e.clientY;

    const rect = drawingCanvas.getBoundingClientRect();

    return {
        x: clientX - rect.left,
        y: clientY - rect.top
    };
}

/**
 * Handles pointer down events (mouse or touch).
 * Starts the drawing process and initiates the animation loop.
 * @param {PointerEvent} e - The pointer event.
 */
function handlePointerDown(e) {
    e.preventDefault();

    if (e.pointerType === 'touch' && e.touches && e.touches.length > 1) {
        return;
    }

    isDrawing = true;
    drawingPoints = [getCanvasCoordinates(e)];
    messageDisplay.textContent = "Drawing...";
    startButton.style.display = 'none';
    tryAgainButton.style.display = 'none';
    centralScoreDisplayWrapper.classList.add('hidden');
    centralScoreText.classList.remove('show');
    scoreMessage.classList.add('hidden');
    highScoreDisplay.classList.add('hidden');

    if (synth) {
        synth.triggerAttack('C5');
    }

    animationFrameId = requestAnimationFrame(drawLoop);
}

/**
 * Handles pointer move events.
 * Adds new points to the drawing path if drawing is active.
 * @param {PointerEvent} e - The pointer event.
 */
function handlePointerMove(e) {
    if (!isDrawing) return;
    e.preventDefault();
    drawingPoints.push(getCanvasCoordinates(e));
}

/**
 * Handles pointer up or pointer cancel events.
 * Stops the drawing process and triggers score calculation.
 */
function handlePointerUp(e) {
    if (isDrawing) {
        if (synth) synth.triggerRelease();
        finishDrawing();
    }
}

/**
 * The main animation loop for continuously drawing the user's path while `isDrawing` is true.
 */
function drawLoop() {
    if (isDrawing) {
        // Recalculate targetCircle continuously for live feedback
        // Only if enough points are drawn to make a meaningful circle
        if (drawingPoints.length >= 30) {
            targetCircle = calculateCircleProperties(drawingPoints);
            if (targetCircle && targetCircle.radius > 10) { // Ensure a meaningful circle is detected
                // Calculate and display a provisional score
                const provisionalScore = calculateCircleScore(drawingPoints, targetCircle);
                if (provisionalScore !== -1) {
                    showMessage(`Accuracy: ${provisionalScore}%`, 'info');
                } else {
                    showMessage('Keep Drawing... (Try to form a circle!)', 'warning');
                }
            } else {
                showMessage('Drawing... (Need more points for a circle!)', 'info');
            }
        } else {
            showMessage('Drawing... (Start forming a circle!)', 'info');
        }

        drawUserPath(); // Redraw the current path with updated colors
        animationFrameId = requestAnimationFrame(drawLoop);
    }
}

// --- Tone.js Initialization ---
/**
 * Initializes Tone.js AudioContext.
 * Must be called after a user gesture (e.g., button click) to bypass browser autoplay policies.
 */
async function setupAudio() {
    if (Tone.context.state !== 'running') {
        await Tone.start();
        console.log('AudioContext started');
    }

    synth = new Tone.Synth({
        oscillator: { type: "triangle" },
        envelope: {
            attack: 0.005,
            decay: 0.1,
            sustain: 0.5,
            release: 1
        }
    }).toDestination();

    reverb = new Tone.Reverb({
        decay: 3,
        preDelay: 0.2,
        wet: 0.4
    }).toDestination();

    synth.connect(reverb);

    gainNode = new Tone.Gain(0.8);
    reverb.connect(gainNode);
    gainNode.toDestination();
}


// --- Orientation Check ---
/**
 * Checks device orientation and shows an overlay if the device is identified as mobile
 * and is currently in portrait mode. This prompts the user to rotate their device.
 */
function checkOrientation() {
    const isMobile = /Mobi|Android|iPhone|iPad|iPod|Windows Phone/i.test(navigator.userAgent);

    if (isMobile && window.innerHeight > window.innerWidth) {
        orientationOverlay.classList.remove('hidden');
    } else {
        orientationOverlay.classList.add('hidden');
    }
}

// --- Event Listeners ---
window.addEventListener('resize', () => {
    resizeCanvases();
    checkOrientation();
});

window.addEventListener('orientationchange', checkOrientation);

startButton.addEventListener('click', startGame);
tryAgainButton.addEventListener('click', resetGame);

drawingCanvas.addEventListener('pointerdown', handlePointerDown);
drawingCanvas.addEventListener('pointermove', handlePointerMove);
drawingCanvas.addEventListener('pointerup', handlePointerUp);
drawingCanvas.addEventListener('pointercancel', handlePointerUp);


// Initial setup when the DOM is fully loaded and ready
document.addEventListener('DOMContentLoaded', () => {
    resizeCanvases();
    checkOrientation();
    drawBackground();
    showMessage('Ready to draw a perfect circle!');
    loadHighScore();

    startButton.addEventListener('click', () => {
        setupAudio();
    }, { once: true });
});


// --- Custom Message Box Logic ---
const customMessageBox = document.getElementById('customMessageBox');
const messageBoxInner = document.getElementById('messageBoxInner');
const messageBoxTitle = document.getElementById('messageBoxTitle');
const messageBoxContent = document.getElementById('messageBoxContent');
const messageBoxClose = document.getElementById('messageBoxClose');

/**
 * Displays a custom message box to the user.
 * @param {string} title - The title text for the message box.
 * @param {string} content - The main body text for the message box.
 */
function showCustomMessage(title, content) {
    messageBoxTitle.textContent = title;
    messageBoxContent.textContent = content;
    customMessageBox.classList.remove('hidden');
    setTimeout(() => {
        messageBoxInner.classList.remove('scale-0', 'opacity-0');
    }, 10);
}

/**
 * Hides the custom message box.
 */
function hideCustomMessage() {
    messageBoxInner.classList.add('scale-0', 'opacity-0');
    setTimeout(() => {
        customMessageBox.classList.add('hidden');
    }, 300);
}

messageBoxClose.addEventListener('click', hideCustomMessage);
