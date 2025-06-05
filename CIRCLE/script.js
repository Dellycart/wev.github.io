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
const orientationOverlay = document.getElementById('orientation-overlay');

let isDrawing = false;
let drawingPoints = [];
let animationFrameId;

let targetCircle = null; // Stores {x, y, radius} of the ideal circle

// Tone.js setup
let synth, reverb, gainNode;

// --- Utility Functions ---

/**
 * Resizes both canvases to fit the window and adjusts for device pixel ratio (DPR)
 * to ensure crisp rendering on high-DPI screens (e.g., Retina displays).
 * This function should be called on initial load and whenever the window is resized.
 */
function resizeCanvases() {
    // Get the device pixel ratio, defaulting to 1 if not available
    const dpr = window.devicePixelRatio || 1;

    // Set the CSS (display) size of the canvases
    backgroundCanvas.style.width = window.innerWidth + 'px';
    backgroundCanvas.style.height = window.innerHeight + 'px';
    drawingCanvas.style.width = window.innerWidth + 'px';
    drawingCanvas.style.height = window.innerHeight + 'px';

    // Set the actual resolution (internal drawing buffer size) of the canvases
    // This multiplies the CSS size by the DPR for higher resolution on high-DPI screens.
    backgroundCanvas.width = window.innerWidth * dpr;
    backgroundCanvas.height = window.innerHeight * dpr;
    drawingCanvas.width = window.innerWidth * dpr;
    drawingCanvas.height = window.innerHeight * dpr;

    // Scale the drawing contexts to match the DPR.
    // This means all subsequent drawing operations (e.g., lineTo, arc) can use CSS pixel coordinates,
    // and the browser will automatically draw them at the higher device pixel resolution.
    bgCtx.setTransform(dpr, 0, 0, dpr, 0, 0); // Reset and apply scale
    drawCtx.setTransform(dpr, 0, 0, dpr, 0, 0); // Reset and apply scale

    // Redraw background elements after resize, as the canvas was cleared
    drawBackground();

    // If there's an active drawing or a scored circle displayed, redraw it
    if (isDrawing && drawingPoints.length > 0) {
        drawUserPath();
    } else if (targetCircle) {
        drawTargetAndUserCircles(targetCircle, drawingPoints);
    }
}

function showMessage(text, type = 'info') {
    messageDisplay.textContent = text;
    // Add classes for different message types (e.g., 'text-green-400' for success)
    // You could expand this to apply different Tailwind classes based on 'type'
    // e.g., if (type === 'error') messageDisplay.classList.add('text-red-400');
}

function calculateCircleProperties(points) {
    if (points.length < 3) return null; // Need at least 3 points to define a circle

    // More robust circle fitting algorithm (e.g., Least Squares)
    // For simplicity, we'll use a basic approach here (average center, average radius)
    // A proper Neal.fun-like implementation would use a more sophisticated algorithm
    // like the Kasa algorithm or geometric fitting.

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

function calculateCircleScore(drawnPoints, targetCircle) {
    if (!targetCircle || drawnPoints.length === 0) return 0;

    let totalDeviation = 0;
    const count = drawnPoints.length;

    for (let p of drawnPoints) {
        const distanceToCenter = Math.sqrt(Math.pow(p.x - targetCircle.x, 2) + Math.pow(p.y - targetCircle.y, 2));
        const deviation = Math.abs(distanceToCenter - targetCircle.radius);
        totalDeviation += deviation;
    }

    const averageDeviation = totalDeviation / count;

    // Normalize deviation to a 0-100 score. This needs careful tuning.
    // Smaller averageDeviation means better score.
    // Max deviation could be something like the canvas diagonal, or a fixed large value.
    // Use the actual CSS dimensions for calculation as points are in CSS pixels
    const maxPossibleDeviation = Math.min(window.innerWidth, window.innerHeight) / 2;
    let score = Math.max(0, 100 - (averageDeviation / maxPossibleDeviation) * 100);

    // Additional checks for circularity and closed loop for higher scores
    // Neal.fun likely checks if the start and end points are close, and if the path forms a closed loop.
    const startToEndDistance = drawnPoints.length > 1 ?
        Math.sqrt(Math.pow(drawnPoints[0].x - drawnPoints[drawnPoints.length - 1].x, 2) +
                  Math.pow(drawnPoints[0].y - drawnPoints[drawnPoints.length - 1].y, 2)) :
        Infinity;

    const closureThreshold = Math.min(window.innerWidth, window.innerHeight) * 0.05; // 5% of smaller dimension
    if (startToEndDistance > closureThreshold) {
        score *= 0.8; // Penalize for not closing the loop
    }

    // Also, check for aspect ratio (is it actually a circle, or an ellipse?)
    // This requires a more complex ellipse fitting or checking bounding box aspect ratio.
    // If aspect ratio is far from 1, penalize.

    return Math.round(score);
}


// --- Drawing Functions ---

function drawBackground() {
    // Clear the background canvas before redrawing
    bgCtx.clearRect(0, 0, backgroundCanvas.width, backgroundCanvas.height);
    // Draw twinkling stars or subtle nebulae here
    // Example: Random circles for stars
    for (let i = 0; i < 100; i++) {
        // Coordinates should be in CSS pixel space, as the context is scaled
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

function clearDrawingCanvas() {
    // Clear the drawing canvas before redrawing
    drawCtx.clearRect(0, 0, drawingCanvas.width, drawingCanvas.height);
}

function drawUserPath() {
    clearDrawingCanvas();
    if (drawingPoints.length < 2) return;

    drawCtx.beginPath();
    drawCtx.moveTo(drawingPoints[0].x, drawingPoints[0].y);

    // Apply glow effect to drawing line
    drawCtx.shadowBlur = 15;
    drawCtx.shadowColor = 'rgba(147, 197, 253, 0.8)'; // blue-300
    drawCtx.lineWidth = 4; // Make the line a bit thicker

    // Dynamic drawing color - subtle change based on distance from current estimated perfect circle
    // This requires calculating targetCircle *during* drawing, which is computationally intensive.
    // For simpler implementation, keep it constant or use a subtle gradient.
    drawCtx.strokeStyle = 'rgb(147, 197, 253)'; // Tailwind's blue-300

    drawCtx.lineCap = 'round';
    drawCtx.lineJoin = 'round';

    for (let i = 1; i < drawingPoints.length; i++) {
        drawCtx.lineTo(drawingPoints[i].x, drawingPoints[i].y);
    }
    drawCtx.stroke();

    // Reset shadow after drawing the path
    drawCtx.shadowBlur = 0;
    drawCtx.shadowColor = 'transparent';
}

function drawTargetAndUserCircles(target, userPoints) {
    clearDrawingCanvas();

    if (userPoints.length > 1) {
        drawUserPath(); // Redraw the user's path first
    }

    if (!target) return;

    // Draw the target perfect circle (e.g., dashed, pulsing, glowing)
    drawCtx.beginPath();
    drawCtx.arc(target.x, target.y, target.radius, 0, Math.PI * 2);
    drawCtx.strokeStyle = 'rgba(168, 85, 247, 0.7)'; // Tailwind's purple-500
    drawCtx.lineWidth = 3;
    drawCtx.setLineDash([10, 8]); // Dashed line
    drawCtx.shadowBlur = 10;
    drawCtx.shadowColor = 'rgba(168, 85, 247, 0.7)';
    drawCtx.stroke();
    drawCtx.setLineDash([]); // Reset line dash
    drawCtx.shadowBlur = 0;
}

// --- Game State Management ---

function startGame() {
    clearDrawingCanvas();
    drawingPoints = [];
    isDrawing = false; // Ensure it's not drawing until interaction
    messageDisplay.textContent = 'Draw a perfect circle! Click or touch to start.';
    startButton.style.display = 'none';
    tryAgainButton.style.display = 'none';
    centralScoreDisplayWrapper.classList.add('hidden');
    centralScoreText.classList.remove('show', 'hide');
    scoreMessage.classList.add('hidden'); // Hide score message

    // Tone.js: Play a subtle 'start' sound
    if (synth) synth.triggerAttackRelease('C4', '8n');
}

function finishDrawing() {
    if (!isDrawing) return;
    isDrawing = false;
    cancelAnimationFrame(animationFrameId);

    if (drawingPoints.length < 50) { // Arbitrary threshold for minimal drawing
        showMessage("Not enough points to form a circle. Try drawing more!", 'warning');
        tryAgainButton.style.display = 'block';
        // Tone.js: Play a 'short' sound
        if (synth) synth.triggerAttackRelease('C3', '16n');
        return;
    }

    targetCircle = calculateCircleProperties(drawingPoints);
    if (!targetCircle) {
        showMessage("Could not detect a circle. Try again!", 'error');
        tryAgainButton.style.display = 'block';
        // Tone.js: Play an 'error' sound
        if (synth) synth.triggerAttackRelease('F#3', '16n');
        return;
    }

    const score = calculateCircleScore(drawingPoints, targetCircle);
    displayScore(score);
    drawTargetAndUserCircles(targetCircle, drawingPoints); // Draw both
    tryAgainButton.style.display = 'block';

    // Tone.js: Play score-based feedback
    if (score > 90) {
        if (synth) synth.triggerAttackRelease('G5', '4n'); // High score chime
    } else if (score > 70) {
        if (synth) synth.triggerAttackRelease('E5', '8n'); // Medium score sound
    } else {
        if (synth) synth.triggerAttackRelease('C5', '8n'); // Low score sound
    }
}

function displayScore(score) {
    centralScoreDisplayWrapper.classList.remove('hidden');
    centralScoreText.textContent = `${score}%`;
    centralScoreText.classList.remove('opacity-0', 'scale-50', 'hide');
    centralScoreText.classList.add('show');

    // Add score-based messages
    if (score >= 98) {
        scoreMessage.textContent = "Cosmic Perfection!";
        scoreMessage.classList.remove('hidden');
    } else if (score >= 90) {
        scoreMessage.textContent = "Stellar!";
        scoreMessage.classList.remove('hidden');
    } else if (score >= 80) {
        scoreMessage.textContent = "Great job!";
        scoreMessage.classList.remove('hidden');
    } else if (score >= 60) {
        scoreMessage.textContent = "Keep practicing!";
        scoreMessage.classList.remove('hidden');
    } else {
        scoreMessage.textContent = "You'll get there!";
        scoreMessage.classList.remove('hidden');
    }

    showMessage(""); // Clear main message
}

function resetGame() {
    clearDrawingCanvas();
    drawingPoints = [];
    isDrawing = false;
    targetCircle = null;
    centralScoreDisplayWrapper.classList.add('hidden');
    centralScoreText.classList.remove('show');
    centralScoreText.classList.add('hide'); // Animate out
    scoreMessage.classList.add('hidden');
    startButton.style.display = 'block'; // Show start button again
    tryAgainButton.style.display = 'none';
    messageDisplay.textContent = 'Ready to draw a perfect circle?';

    // Tone.js: Play a 'clear' sound
    if (synth) synth.triggerAttackRelease('A3', '8n');
}

// --- Event Handlers ---

/**
 * Handles pointer down events (mouse or touch).
 * Prevents default browser behaviors like scrolling/zooming.
 * Stores the starting point and begins the drawing loop.
 */
function handlePointerDown(e) {
    e.preventDefault(); // Prevent default touch/mouse behavior (like scrolling/text selection)
    isDrawing = true;
    // Get coordinates relative to the canvas element.
    // These coordinates are in CSS pixels, which is correct because the canvas context is scaled.
    const rect = drawingCanvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    drawingPoints = [{ x: x, y: y }]; // Start new drawing path
    messageDisplay.textContent = "Drawing...";
    startButton.style.display = 'none';
    tryAgainButton.style.display = 'none';
    centralScoreDisplayWrapper.classList.add('hidden');
    centralScoreText.classList.remove('show');
    scoreMessage.classList.add('hidden');

    // Tone.js: Start drawing sound
    if (synth) {
        synth.triggerAttack('C5'); // Sustain a note
    }

    // Start a continuous drawing animation loop
    animationFrameId = requestAnimationFrame(drawLoop);
}

/**
 * Handles pointer move events.
 * Adds new points to the drawing path if currently drawing.
 */
function handlePointerMove(e) {
    if (!isDrawing) return;
    // Get coordinates relative to the canvas element.
    const rect = drawingCanvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    drawingPoints.push({ x: x, y: y });
    // drawUserPath(); // Redraw only on move, or let requestAnimationFrame handle it
    // The drawLoop already calls drawUserPath, so no need to call it here.
}

/**
 * Handles pointer up or pointer cancel events.
 * Stops drawing and calculates the score.
 */
function handlePointerUp() {
    if (isDrawing) {
        // Tone.js: Stop drawing sound
        if (synth) synth.triggerRelease();
        finishDrawing();
    }
}

/**
 * The main animation loop for drawing the user's path.
 * Requested by requestAnimationFrame for smooth drawing.
 */
function drawLoop() {
    if (isDrawing) {
        drawUserPath();
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

    // Basic Synth for feedback
    synth = new Tone.Synth().toDestination();

    // Reverb for a 'cosmic' feel
    reverb = new Tone.Reverb({
        decay: 3,
        preDelay: 0.2
    }).toDestination();

    // Connect synth to reverb
    synth.connect(reverb);

    // Optional: Global gain node for volume control if needed
    // Connect reverb to gainNode, then gainNode to destination
    gainNode = new Tone.Gain(0.8);
    reverb.connect(gainNode);
    gainNode.toDestination();

    // Initial ambient sound (very subtle) - uncomment if desired
    // const ambientSynth = new Tone.PolySynth(Tone.Synth, {
    //     oscillator: { type: "triangle" },
    //     envelope: { attack: 4, decay: 0.5, sustain: 0.2, release: 5 }
    // }).toDestination();
    // ambientSynth.triggerAttackRelease(["C2", "G2"], "20s");
}


// --- Orientation Check ---
/**
 * Checks device orientation and shows an overlay if the device is mobile and in portrait mode.
 * This prompts the user to rotate their device for a better experience.
 */
function checkOrientation() {
    // Check if the user agent indicates a mobile device
    const isMobile = /Mobi|Android|iPhone|iPad|iPod/i.test(navigator.userAgent);

    // If it's a mobile device AND the height is greater than the width (portrait mode)
    if (isMobile && window.innerHeight > window.innerWidth) {
        orientationOverlay.classList.remove('hidden');
    } else { // Landscape or desktop
        orientationOverlay.classList.add('hidden');
    }
}

// --- Event Listeners ---
// Listen for window resize events to adjust canvas size and check orientation
window.addEventListener('resize', () => {
    resizeCanvases();
    checkOrientation();
});

// Listen for device orientation changes (specific to mobile)
window.addEventListener('orientationchange', checkOrientation);

// Button event listeners
startButton.addEventListener('click', startGame);
tryAgainButton.addEventListener('click', resetGame);

// Drawing canvas event listeners for unified mouse and touch input
drawingCanvas.addEventListener('pointerdown', handlePointerDown);
drawingCanvas.addEventListener('pointermove', handlePointerMove);
drawingCanvas.addEventListener('pointerup', handlePointerUp);
drawingCanvas.addEventListener('pointercancel', handlePointerUp); // Handles cases where pointer leaves the surface or drawing is interrupted


// Initial setup when the DOM is fully loaded
document.addEventListener('DOMContentLoaded', () => {
    // Initial resize and orientation check
    resizeCanvases();
    checkOrientation();
    drawBackground(); // Initial background draw
    showMessage('Ready to draw a perfect circle!');

    // Initialize Tone.js only on the first user interaction (e.g., first start button click)
    // This is crucial for satisfying browser autoplay policies for audio.
    startButton.addEventListener('click', () => {
        setupAudio(); // Ensure audio context starts on user gesture
        // The startGame() call is already part of the startButton's primary listener.
    }, { once: true }); // The { once: true } option ensures this listener only runs once
});

// Custom message box handling (from your HTML)
const customMessageBox = document.getElementById('customMessageBox');
const messageBoxInner = document.getElementById('messageBoxInner');
const messageBoxTitle = document.getElementById('messageBoxTitle');
const messageBoxContent = document.getElementById('messageBoxContent');
const messageBoxClose = document.getElementById('messageBoxClose');

/**
 * Displays a custom message box to the user.
 * @param {string} title - The title of the message box.
 * @param {string} content - The main content/message to display.
 */
function showCustomMessage(title, content) {
    messageBoxTitle.textContent = title;
    messageBoxContent.textContent = content;
    customMessageBox.classList.remove('hidden');
    // Animate in the message box with a slight delay for transition
    setTimeout(() => {
        messageBoxInner.classList.remove('scale-0', 'opacity-0');
    }, 10);
}

/**
 * Hides the custom message box.
 */
function hideCustomMessage() {
    messageBoxInner.classList.add('scale-0', 'opacity-0');
    // Hide the container after the transition finishes
    setTimeout(() => {
        customMessageBox.classList.add('hidden');
    }, 300); // Match CSS transition duration
}

// Attach event listener to close the message box
messageBoxClose.addEventListener('click', hideCustomMessage);

// Example of how to use custom message:
// showCustomMessage("Welcome!", "Draw a circle and see how perfect it is!");
