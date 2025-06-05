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
    // Get the device pixel ratio, defaulting to 1 if not available.
    // This is crucial for high-resolution screens to prevent blurriness.
    const dpr = window.devicePixelRatio || 1;

    // Set the CSS (display) size of the canvases.
    // These are the dimensions that the browser uses for layout.
    backgroundCanvas.style.width = window.innerWidth + 'px';
    backgroundCanvas.style.height = window.innerHeight + 'px';
    drawingCanvas.style.width = window.innerWidth + 'px';
    drawingCanvas.style.height = window.innerHeight + 'px';

    // Set the actual resolution (internal drawing buffer size) of the canvases.
    // This multiplies the CSS size by the DPR for higher pixel density.
    backgroundCanvas.width = window.innerWidth * dpr;
    backgroundCanvas.height = window.innerHeight * dpr;
    drawingCanvas.width = window.innerWidth * dpr;
    drawingCanvas.height = window.innerHeight * dpr;

    // Scale the drawing contexts to match the DPR.
    // This means all subsequent drawing operations (e.g., lineTo, arc, text)
    // can use CSS pixel coordinates, and the browser will automatically draw them
    // at the higher device pixel resolution, making everything look sharp.
    bgCtx.setTransform(dpr, 0, 0, dpr, 0, 0); // Reset and apply scale
    drawCtx.setTransform(dpr, 0, 0, dpr, 0, 0); // Reset and apply scale

    // Redraw background elements after resize, as the canvas contents are cleared upon resizing
    drawBackground();

    // If there's an active drawing or a scored circle displayed, redraw it to maintain visual state
    if (isDrawing && drawingPoints.length > 0) {
        drawUserPath();
    } else if (targetCircle) {
        drawTargetAndUserCircles(targetCircle, drawingPoints);
    }
}

/**
 * Displays a message in the designated message area.
 * @param {string} text - The message content.
 * @param {string} type - The type of message (e.g., 'info', 'warning', 'error') for potential styling.
 */
function showMessage(text, type = 'info') {
    messageDisplay.textContent = text;
    // You could expand this to apply different Tailwind classes based on 'type'
    // e.g., if (type === 'error') messageDisplay.classList.add('text-red-400');
}

/**
 * Calculates the properties (center and radius) of a circle that best fits a given set of points.
 * This is a simplified approach; a more advanced fitting algorithm would yield better results.
 * @param {Array<Object>} points - An array of {x, y} coordinates drawn by the user.
 * @returns {Object|null} An object {x, y, radius} representing the fitted circle, or null if not enough points.
 */
function calculateCircleProperties(points) {
    if (points.length < 3) return null; // Need at least 3 points to define a circle

    // Summing up coordinates to find the average center point
    let sumX = 0, sumY = 0;
    for (let p of points) {
        sumX += p.x;
        sumY += p.y;
    }
    const centerX = sumX / points.length;
    const centerY = sumY / points.length;

    // Calculating the average radius based on distance from the average center
    let sumRadius = 0;
    for (let p of points) {
        sumRadius += Math.sqrt(Math.pow(p.x - centerX, 2) + Math.pow(p.y - centerY, 2));
    }
    const radius = sumRadius / points.length;

    return { x: centerX, y: centerY, radius: radius };
}

/**
 * Calculates a score for how "perfect" the drawn circle is compared to the target circle.
 * @param {Array<Object>} drawnPoints - The actual points drawn by the user.
 * @param {Object} targetCircle - The calculated ideal circle {x, y, radius}.
 * @returns {number} The score (0-100).
 */
function calculateCircleScore(drawnPoints, targetCircle) {
    if (!targetCircle || drawnPoints.length === 0) return 0;

    let totalDeviation = 0;
    const count = drawnPoints.length;

    // Calculate the average deviation of drawn points from the target circle's circumference
    for (let p of drawnPoints) {
        const distanceToCenter = Math.sqrt(Math.pow(p.x - targetCircle.x, 2) + Math.pow(p.y - targetCircle.y, 2));
        const deviation = Math.abs(distanceToCenter - targetCircle.radius);
        totalDeviation += deviation;
    }

    const averageDeviation = totalDeviation / count;

    // Normalize deviation to a 0-100 score. This scaling needs careful tuning.
    // Smaller averageDeviation means a better score.
    // The maxPossibleDeviation is used to set a baseline for "perfect" vs "terrible".
    const maxPossibleDeviation = Math.min(window.innerWidth, window.innerHeight) / 2;
    let score = Math.max(0, 100 - (averageDeviation / maxPossibleDeviation) * 100);

    // Penalize if the drawn path does not form a closed loop (start and end points are far apart)
    const startToEndDistance = drawnPoints.length > 1 ?
        Math.sqrt(Math.pow(drawnPoints[0].x - drawnPoints[drawnPoints.length - 1].x, 2) +
                  Math.pow(drawnPoints[0].y - drawnPoints[drawnPoints.length - 1].y, 2)) :
        Infinity; // If less than 2 points, consider it infinite distance

    const closureThreshold = Math.min(window.innerWidth, window.innerHeight) * 0.05; // 5% of smaller dimension for closure
    if (startToEndDistance > closureThreshold) {
        score = score * 0.8; // Penalize for not closing the loop
    }

    // Further improvements could include checking aspect ratio (to distinguish circles from ellipses)
    // and overall smoothness of the curve.

    return Math.round(score);
}


// --- Drawing Functions ---

/**
 * Draws the subtle background elements (e.g., twinkling stars) on the background canvas.
 * Clears the canvas before drawing.
 */
function drawBackground() {
    bgCtx.clearRect(0, 0, backgroundCanvas.width, backgroundCanvas.height);
    // Draw twinkling stars or subtle nebulae here
    // Coordinates for drawing should be in CSS pixel space (window.innerWidth/Height),
    // as the context has already been scaled by DPR.
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
 * Applies glow and styling to the line.
 */
function drawUserPath() {
    clearDrawingCanvas(); // Clear canvas before redrawing to show updated path
    if (drawingPoints.length < 2) return; // Need at least two points to draw a line

    drawCtx.beginPath();
    drawCtx.moveTo(drawingPoints[0].x, drawingPoints[0].y);

    // Apply glow effect
    drawCtx.shadowBlur = 15;
    drawCtx.shadowColor = 'rgba(147, 197, 253, 0.8)'; // Tailwind blue-300 with transparency
    drawCtx.lineWidth = 4;
    drawCtx.strokeStyle = 'rgb(147, 197, 253)'; // Solid color for the drawn line
    drawCtx.lineCap = 'round'; // Rounded ends for line segments
    drawCtx.lineJoin = 'round'; // Rounded joins for line segments

    for (let i = 1; i < drawingPoints.length; i++) {
        drawCtx.lineTo(drawingPoints[i].x, drawingPoints[i].y);
    }
    drawCtx.stroke();

    // Reset shadow after drawing the path to avoid affecting other drawings
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
    clearDrawingCanvas(); // Clear the canvas to draw both elements fresh

    if (userPoints.length > 1) {
        drawUserPath(); // Redraw the user's path first
    }

    if (!target) return;

    // Draw the target perfect circle (e.g., dashed, pulsing, glowing)
    drawCtx.beginPath();
    drawCtx.arc(target.x, target.y, target.radius, 0, Math.PI * 2);
    drawCtx.strokeStyle = 'rgba(168, 85, 247, 0.7)'; // Tailwind purple-500 with transparency
    drawCtx.lineWidth = 3;
    drawCtx.setLineDash([10, 8]); // Dashed line to distinguish it from the user's drawing
    drawCtx.shadowBlur = 10;
    drawCtx.shadowColor = 'rgba(168, 85, 247, 0.7)';
    drawCtx.stroke();
    drawCtx.setLineDash([]); // Reset line dash to default for subsequent drawings
    drawCtx.shadowBlur = 0; // Reset shadow
}

// --- Game State Management ---

/**
 * Starts a new game round. Resets drawing state and UI.
 */
function startGame() {
    clearDrawingCanvas();
    drawingPoints = [];
    isDrawing = false; // Ensure it's not drawing until interaction begins
    messageDisplay.textContent = 'Draw a perfect circle! Click or touch to start.';
    startButton.style.display = 'none';
    tryAgainButton.style.display = 'none';
    centralScoreDisplayWrapper.classList.add('hidden');
    centralScoreText.classList.remove('show', 'hide'); // Reset score animation classes
    scoreMessage.classList.add('hidden'); // Hide score message

    // Tone.js: Play a subtle 'start' sound
    if (synth) synth.triggerAttackRelease('C4', '8n');
}

/**
 * Concludes the drawing phase, calculates the score, and updates the UI.
 * Handles cases where drawing is too short or a circle cannot be detected.
 */
function finishDrawing() {
    if (!isDrawing) return; // Only process if drawing was active
    isDrawing = false;
    cancelAnimationFrame(animationFrameId); // Stop the drawing animation loop

    // Minimum number of points required for a meaningful drawing
    if (drawingPoints.length < 50) {
        showMessage("Not enough points to form a circle. Try drawing more!", 'warning');
        tryAgainButton.style.display = 'block';
        if (synth) synth.triggerAttackRelease('C3', '16n'); // Short, low sound for feedback
        return;
    }

    // Calculate the best-fit circle from the drawn points
    targetCircle = calculateCircleProperties(drawingPoints);
    if (!targetCircle) {
        showMessage("Could not detect a circle. Try again!", 'error');
        tryAgainButton.style.display = 'block';
        if (synth) synth.triggerAttackRelease('F#3', '16n'); // Error sound
        return;
    }

    // Calculate the score and display it
    const score = calculateCircleScore(drawingPoints, targetCircle);
    displayScore(score);
    drawTargetAndUserCircles(targetCircle, drawingPoints); // Show both the user's drawing and the ideal circle
    tryAgainButton.style.display = 'block'; // Show the "Clear" button

    // Tone.js: Play score-based feedback sounds
    if (score > 90) {
        if (synth) synth.triggerAttackRelease('G5', '4n'); // High score chime
    } else if (score > 70) {
        if (synth) synth.triggerAttackRelease('E5', '8n'); // Medium score sound
    } else {
        if (synth) synth.triggerAttackRelease('C5', '8n'); // Low score sound
    }
}

/**
 * Displays the calculated score and a corresponding message.
 * @param {number} score - The percentage score for the drawn circle.
 */
function displayScore(score) {
    centralScoreDisplayWrapper.classList.remove('hidden');
    centralScoreText.textContent = `${score}%`;
    centralScoreText.classList.remove('opacity-0', 'scale-50', 'hide'); // Remove hide animation if present
    centralScoreText.classList.add('show'); // Trigger pop-in animation

    // Set score-based messages
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
    scoreMessage.classList.remove('hidden'); // Make the score message visible

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
    centralScoreText.classList.add('hide'); // Animate score out
    scoreMessage.classList.add('hidden');
    startButton.style.display = 'block'; // Show start button again
    tryAgainButton.style.display = 'none'; // Hide clear button
    messageDisplay.textContent = 'Ready to draw a perfect circle?';

    // Tone.js: Play a 'clear' sound
    if (synth) synth.triggerAttackRelease('A3', '8n');
}

// --- Event Handlers for Drawing ---

/**
 * Retrieves the correct coordinates from a pointer event (mouse or touch).
 * @param {PointerEvent} e - The pointer event object.
 * @returns {Object} An object {x, y} with coordinates relative to the canvas.
 */
function getCanvasCoordinates(e) {
    // For touch events, e.clientX/Y might not be the exact touch point,
    // so we prefer e.touches[0].clientX/Y if available.
    // For mouse/pen, e.clientX/Y is correct.
    const clientX = e.touches && e.touches[0] ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches && e.touches[0] ? e.touches[0].clientY : e.clientY;

    // Get the bounding rectangle of the canvas to calculate relative coordinates
    const rect = drawingCanvas.getBoundingClientRect();

    // Return coordinates relative to the canvas's top-left corner
    // These coordinates are in CSS pixels, which are then scaled by the context's DPR transform.
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
    // CRITICAL: Prevent default browser actions (like scrolling, zooming, context menus)
    // that interfere with drawing on touch devices.
    e.preventDefault();

    // Only start drawing if a single pointer is down (avoids multi-touch issues for simple drawing)
    if (e.pointerType === 'touch' && e.touches && e.touches.length > 1) {
        return; // Ignore multi-touch for drawing
    }

    isDrawing = true;
    drawingPoints = [getCanvasCoordinates(e)]; // Start new drawing path with the first point
    messageDisplay.textContent = "Drawing...";
    startButton.style.display = 'none';
    tryAgainButton.style.display = 'none';
    centralScoreDisplayWrapper.classList.add('hidden');
    centralScoreText.classList.remove('show');
    scoreMessage.classList.add('hidden');

    // Tone.js: Start drawing sound (sustain note)
    if (synth) {
        synth.triggerAttack('C5');
    }

    // Start a continuous drawing animation loop for smooth rendering
    animationFrameId = requestAnimationFrame(drawLoop);
}

/**
 * Handles pointer move events.
 * Adds new points to the drawing path if drawing is active.
 * @param {PointerEvent} e - The pointer event.
 */
function handlePointerMove(e) {
    if (!isDrawing) return;
    // CRITICAL: Prevent default browser actions like scrolling during a touch-move while drawing.
    e.preventDefault();
    drawingPoints.push(getCanvasCoordinates(e));
    // The drawLoop (requestAnimationFrame) will handle redrawing, so no direct call here.
}

/**
 * Handles pointer up or pointer cancel events.
 * Stops the drawing process and triggers score calculation.
 */
function handlePointerUp(e) {
    if (isDrawing) {
        // Tone.js: Stop drawing sound (release note)
        if (synth) synth.triggerRelease();
        finishDrawing(); // Finalize the drawing and calculate score
    }
}

/**
 * The main animation loop for continuously drawing the user's path while `isDrawing` is true.
 */
function drawLoop() {
    if (isDrawing) {
        drawUserPath(); // Redraw the current path
        animationFrameId = requestAnimationFrame(drawLoop); // Request next frame
    }
}

// --- Tone.js Initialization ---
/**
 * Initializes Tone.js AudioContext.
 * Must be called after a user gesture (e.g., button click) to bypass browser autoplay policies.
 */
async function setupAudio() {
    if (Tone.context.state !== 'running') {
        // Await Tone.start() ensures the AudioContext is fully running before attempting to play sounds.
        await Tone.start();
        console.log('AudioContext started');
    }

    // Basic Synth for sound feedback during gameplay
    synth = new Tone.Synth({
        oscillator: { type: "triangle" }, // A softer, more continuous wave for drawing
        envelope: {
            attack: 0.005,
            decay: 0.1,
            sustain: 0.5,
            release: 1
        }
    }).toDestination();

    // Reverb for a 'cosmic' feel or space ambiance
    reverb = new Tone.Reverb({
        decay: 3,        // How long the reverb tail is
        preDelay: 0.2,   // Delay before the reverb starts
        wet: 0.4         // Amount of wet signal (reverb) vs dry signal
    }).toDestination();

    // Connect synth to reverb to apply the effect
    synth.connect(reverb);

    // Optional: Global gain node for volume control if needed, connected to destination
    gainNode = new Tone.Gain(0.8); // Set initial volume
    reverb.connect(gainNode);
    gainNode.toDestination(); // Connect the gain node to the final audio output
}


// --- Orientation Check ---
/**
 * Checks device orientation and shows an overlay if the device is identified as mobile
 * and is currently in portrait mode. This prompts the user to rotate their device.
 */
function checkOrientation() {
    // Simple check to identify if it's likely a mobile device based on user agent
    const isMobile = /Mobi|Android|iPhone|iPad|iPod|Windows Phone/i.test(navigator.userAgent);

    // If it's a mobile device AND the height is greater than the width (portrait mode)
    if (isMobile && window.innerHeight > window.innerWidth) {
        orientationOverlay.classList.remove('hidden'); // Show the overlay
    } else { // Landscape mode or desktop browser
        orientationOverlay.classList.add('hidden'); // Hide the overlay
    }
}

// --- Event Listeners ---
// Listen for window resize events to adjust canvas size and re-check orientation
window.addEventListener('resize', () => {
    resizeCanvases();
    checkOrientation();
});

// Listen for actual device orientation changes (more specific to mobile device rotation)
window.addEventListener('orientationchange', checkOrientation);

// Button event listeners for game control
startButton.addEventListener('click', startGame);
tryAgainButton.addEventListener('click', resetGame);

// Drawing canvas event listeners for unified mouse, pen, and touch input.
// 'pointerdown' covers mousedown, touchstart, pen down.
// 'pointermove' covers mousemove, touchmove, pen move.
// 'pointerup' covers mouseup, touchend, pen up.
// 'pointercancel' handles cases where a pointer event is interrupted (e.g., finger leaves screen, call comes in).
drawingCanvas.addEventListener('pointerdown', handlePointerDown);
drawingCanvas.addEventListener('pointermove', handlePointerMove);
drawingCanvas.addEventListener('pointerup', handlePointerUp);
drawingCanvas.addEventListener('pointercancel', handlePointerUp);


// Initial setup when the DOM is fully loaded and ready
document.addEventListener('DOMContentLoaded', () => {
    // Perform initial canvas resizing and orientation check
    resizeCanvases();
    checkOrientation();
    drawBackground(); // Draw the initial background stars
    showMessage('Ready to draw a perfect circle!'); // Initial welcome message

    // Initialize Tone.js only on the very first user interaction with the 'Start' button.
    // This is a browser requirement to allow audio to play (prevents autoplay).
    startButton.addEventListener('click', () => {
        setupAudio(); // Asynchronously start the audio context
        // startGame() is already called by the primary startButton listener,
        // so no need to call it twice here.
    }, { once: true }); // The { once: true } option ensures this audio setup listener only runs once.
});


// --- Custom Message Box Logic (from your HTML) ---
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
    customMessageBox.classList.remove('hidden'); // Make the overlay visible
    // Small timeout to allow the 'hidden' class removal to register
    // before triggering the animation.
    setTimeout(() => {
        messageBoxInner.classList.remove('scale-0', 'opacity-0'); // Animate the box in
    }, 10);
}

/**
 * Hides the custom message box.
 */
function hideCustomMessage() {
    messageBoxInner.classList.add('scale-0', 'opacity-0'); // Animate the box out
    // Hide the overlay completely after the animation finishes
    setTimeout(() => {
        customMessageBox.classList.add('hidden');
    }, 300); // Matches the CSS transition duration
}

// Attach event listener to close the message box when the 'OK' button is clicked
messageBoxClose.addEventListener('click', hideCustomMessage);

// Example of how to use the custom message box:
// showCustomMessage("Welcome!", "Draw a circle and see how perfect it is!");
