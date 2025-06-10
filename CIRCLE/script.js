// script.js

// --- Global Variables and Setup ---
const backgroundCanvas = document.getElementById('backgroundCanvas');
const bgCtx = backgroundCanvas.getContext('2d');
const drawingCanvas = document.getElementById('drawingCanvas');
const drawCtx = drawingCanvas.getContext('2d');

const initialStartContainer = document.getElementById('initialStartContainer');
const startButton = document.getElementById('startButton');
const postGameControls = document.getElementById('postGameControls'); // Renamed from postGameButtons
const shareButton = document.getElementById('shareButton');
const messageDisplay = document.getElementById('messageDisplay');
const centralScoreDisplayWrapper = document.getElementById('centralScoreDisplayWrapper');
const centralScoreText = document.getElementById('centralScoreText');
const scoreMessage = document.getElementById('scoreMessage');
const highScoreDisplay = document.getElementById('highScoreDisplay');

const audioToggleButton = document.querySelector('#audioToggleButton button');
const audioToggleIcon = audioToggleButton.querySelector('i');
const accuracyMeterWrapper = document.getElementById('accuracyMeterWrapper');
const accuracyMeterValue = document.getElementById('accuracyMeterValue');

let isDrawing = false;
let drawingPoints = [];
let animationFrameId;
let backgroundAnimationFrameId;

let targetCircle = null;

// Tone.js setup
let drawSynth, victorySynth, clickSynth;
let isSoundEnabled = true;

const accuracyColorScale = ['#FF0000', '#FFFF00', '#00FF00']; // Red (bad), Yellow (okay), Green (good)

// High score now resets with each page refresh (not persistent)
let highScore = 0;

const nebulaParticles = [];
const NUM_NEBULA_PARTICLES = 50;
const NEBULA_COLORS = [
    [255, 0, 255], // Magenta
    [0, 255, 255], // Cyan
    [100, 0, 255], // Purple
    [255, 100, 0]  // Orange
];

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
    const normalizedValue = (clampedValue - minVal) / (maxVal - minVal);

    if (spectrum.length === 1) return spectrum[0];
    if (spectrum.length === 0) return '#FFFFFF';

    const segmentSize = 1.0 / (spectrum.length - 1);
    const segmentIndex = Math.floor(normalizedValue / segmentSize);
    const segmentAmount = (normalizedValue % segmentSize) / segmentSize;

    if (segmentIndex >= spectrum.length - 1) {
        return spectrum[spectrum.length - 1];
    }

    return lerpColor(spectrum[segmentIndex], spectrum[segmentIndex + 1], segmentAmount);
}

/**
 * Resizes all canvases to fit the window and adjusts for device pixel ratio (DPR)
 * to ensure crisp rendering on high-DPI screens (e.g., Retina displays).
 */
function resizeCanvases() {
    const dpr = window.devicePixelRatio || 1;

    backgroundCanvas.style.width = window.innerWidth + 'px';
    backgroundCanvas.style.height = window.innerHeight + 'px';
    drawingCanvas.style.width = window.innerWidth + 'px';
    drawingCanvas.style.height = window.innerHeight + 'px';

    backgroundCanvas.width = window.innerWidth * dpr;
    backgroundCanvas.height = window.innerHeight * dpr;
    drawingCanvas.width = window.innerWidth * dpr;
    drawingCanvas.height = window.innerHeight * dpr;

    bgCtx.setTransform(dpr, 0, 0, dpr, 0, 0);
    drawCtx.setTransform(dpr, 0, 0, dpr, 0, 0);

    initNebulaParticles();
    drawBackground();
    if (isDrawing && drawingPoints.length > 0) {
        drawUserPath();
    }
}

/**
 * Displays a message in the designated message area.
 * @param {string} text - The message content.
 * @param {string} type - The type of message (e.g., 'info', 'warning', 'error') for potential styling.
 */
function showMessage(text, type = 'info') {
    messageDisplay.textContent = text;
    messageDisplay.classList.remove('text-red-400', 'text-yellow-400', 'text-gray-300', 'text-blue-300', 'live-accuracy', 'text-green-400');
    if (type === 'error') {
        messageDisplay.classList.add('text-red-400');
    } else if (type === 'warning') {
        messageDisplay.classList.add('text-yellow-400');
    } else if (type === 'info') {
        messageDisplay.classList.add('text-blue-300');
    } else if (type === 'success') {
        messageDisplay.classList.add('text-green-400');
    }
}

/**
 * Calculates the properties (center and radius) of a circle that best fits a given set of points.
 * @param {Array<Object>} points - An array of {x, y} coordinates drawn by the user.
 * @returns {Object|null} An object {x, y, radius} representing the fitted circle, or null if not enough points.
 */
function calculateCircleProperties(points) {
    if (points.length < 3) return null;

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
 * @param {Array<Object>} drawnPoints - The actual points drawn by the user.
 * @param {Object} targetCircle - The calculated ideal circle {x, y, radius}.
 * @returns {number} The score (0-100), or -1 if the shape is clearly not a circle.
 */
function calculateCircleScore(drawnPoints, targetCircle) {
    if (drawnPoints.length < 20 || !targetCircle || targetCircle.radius < 5) {
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
    const closureThreshold = targetCircle.radius * 0.4;
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

    if (drawnPathLength < targetCircumference * 0.5 || drawnPathLength > targetCircumference * 2.5) {
        penalty += (1 - Math.min(drawnPathLength / targetCircumference, targetCircumference / drawnPathLength)) * 100 * 0.5;
        penalty = Math.min(penalty, 50);
    }

    const maxDimension = Math.min(window.innerWidth, window.innerHeight);
    const normalizedAverageDeviation = averageDeviation / (maxDimension * 0.1);
    let baseScore = Math.max(0, 100 - (normalizedAverageDeviation * 100));

    let finalScore = baseScore - penalty;
    finalScore = Math.max(0, finalScore);

    if (finalScore < 30 || aspectRatio < 0.2 || normalizedStdDev > 0.6 || targetCircle.radius / maxDimension < 0.02) {
        return -1;
    }

    return Math.round(finalScore);
}


// --- Background Animation Functions (Nebula) ---

/**
 * Initializes nebula particles with random properties.
 */
function initNebulaParticles() {
    nebulaParticles.length = 0;
    for (let i = 0; i < NUM_NEBULA_PARTICLES; i++) {
        nebulaParticles.push({
            x: Math.random() * backgroundCanvas.width,
            y: Math.random() * backgroundCanvas.height,
            radius: Math.random() * 100 + 50,
            colorIndex: Math.floor(Math.random() * NEBULA_COLORS.length),
            opacity: Math.random() * 0.1 + 0.05,
            speedX: (Math.random() - 0.5) * 0.2,
            speedY: (Math.random() - 0.5) * 0.2,
            growthRate: (Math.random() - 0.5) * 0.1
        });
    }
}

/**
 * Draws the dynamic cosmic/nebula background.
 */
function drawBackground() {
    bgCtx.clearRect(0, 0, backgroundCanvas.width, backgroundCanvas.height);

    for (let i = 0; i < nebulaParticles.length; i++) {
        const p = nebulaParticles[i];
        const color = NEBULA_COLORS[p.colorIndex];

        const gradient = bgCtx.createRadialGradient(p.x, p.y, p.radius * 0.1, p.x, p.y, p.radius);
        gradient.addColorStop(0, `rgba(${color[0]}, ${color[1]}, ${color[2]}, ${p.opacity})`);
        gradient.addColorStop(1, `rgba(${color[0]}, ${color[1]}, ${color[2]}, 0)`);

        bgCtx.fillStyle = gradient;
        bgCtx.beginPath();
        bgCtx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        bgCtx.fill();

        p.x += p.speedX;
        p.y += p.speedY;
        p.radius += p.growthRate;

        if (p.x > backgroundCanvas.width + p.radius) p.x = -p.radius;
        if (p.x < -p.radius) p.x = backgroundCanvas.width + p.radius;
        if (p.y > backgroundCanvas.height + p.radius) p.y = -p.radius;
        if (p.y < -p.radius) p.y = backgroundCanvas.height + p.radius;

        if (p.radius > 200 || p.radius < 50) {
            p.growthRate *= -1;
        }
    }

    for (let i = 0; i < 50; i++) {
        const x = Math.random() * backgroundCanvas.width;
        const y = Math.random() * backgroundCanvas.height;
        const radius = Math.random() * 1.0;
        const opacity = Math.random() * 0.6 + 0.1;
        bgCtx.beginPath();
        bgCtx.arc(x, y, radius, 0, Math.PI * 2);
        bgCtx.fillStyle = `rgba(255, 255, 255, ${opacity})`;
        bgCtx.fill();
    }
}

/**
 * Main loop for animating the background.
 */
function animateBackground() {
    drawBackground();
    backgroundAnimationFrameId = requestAnimationFrame(animateBackground);
}

/**
 * Clears the drawing canvas.
 */
function clearDrawingCanvas() {
    drawCtx.clearRect(0, 0, drawingCanvas.width, drawingCanvas.height);
}

// Trail particles for the drawing line
const trailParticles = [];
const MAX_TRAIL_PARTICLES = 30;

/**
 * Draws the user's freehand path on the drawing canvas with an "energy trail" effect.
 * Applies dynamic glow, thickness, and emits small particles.
 */
function drawUserPath() {
    clearDrawingCanvas();

    if (drawingPoints.length < 2) return;

    let provisionalTargetCircle = calculateCircleProperties(drawingPoints);

    if (provisionalTargetCircle && provisionalTargetCircle.radius > 10) {
        drawCtx.beginPath();
        drawCtx.arc(provisionalTargetCircle.x, provisionalTargetCircle.y, provisionalTargetCircle.radius, 0, Math.PI * 2);
        drawCtx.strokeStyle = `rgba(100, 150, 255, ${Math.min(0.05 + drawingPoints.length / 5000, 0.2)})`;
        drawCtx.lineWidth = 1;
        drawCtx.shadowBlur = 0;
        drawCtx.shadowColor = 'transparent';
        drawCtx.stroke();
    }

    drawCtx.lineCap = 'round';
    drawCtx.lineJoin = 'round';

    for (let i = 1; i < drawingPoints.length; i++) {
        const p1 = drawingPoints[i - 1];
        const p2 = drawingPoints[i];

        let segmentColor = 'rgba(255, 255, 255, 0.5)';
        let lineWidth = 3;
        let shadowBlur = 0;

        if (provisionalTargetCircle && provisionalTargetCircle.radius > 10) {
            const distanceToCenter = Math.sqrt(Math.pow(p2.x - provisionalTargetCircle.x, 2) + Math.pow(p2.y - provisionalTargetCircle.y, 2));
            const deviation = Math.abs(distanceToCenter - provisionalTargetCircle.radius);

            const maxExpectedDeviation = Math.min(window.innerWidth, window.innerHeight) * 0.1;
            let accuracyValue = Math.max(0, 100 - (deviation / maxExpectedDeviation) * 100);

            segmentColor = mapValueToColor(accuracyValue, accuracyColorScale, 0, 100);

            lineWidth = 3 + (accuracyValue / 100) * 5;
            lineWidth = Math.max(3, Math.min(8, lineWidth));

            shadowBlur = (accuracyValue / 100) * 20;
            shadowBlur = Math.max(0, Math.min(20, shadowBlur));
            drawCtx.shadowColor = segmentColor;
        } else {
             drawCtx.shadowColor = 'transparent';
        }

        drawCtx.beginPath();
        drawCtx.moveTo(p1.x, p1.y);
        drawCtx.lineTo(p2.x, p2.y);

        drawCtx.strokeStyle = segmentColor;
        drawCtx.lineWidth = lineWidth;
        drawCtx.shadowBlur = shadowBlur;
        drawCtx.stroke();
    }
    drawCtx.shadowBlur = 0;
    drawCtx.shadowColor = 'transparent';

    if (isDrawing && drawingPoints.length > 0) {
        const lastPoint = drawingPoints[drawingPoints.length - 1];
        const currentAccuracy = calculateCircleScore(drawingPoints, provisionalTargetCircle);
        const particleColor = mapValueToColor(currentAccuracy !== -1 ? currentAccuracy : 0, accuracyColorScale, 0, 100);

        for (let j = 0; j < Math.random() * 2; j++) {
            trailParticles.push({
                x: lastPoint.x,
                y: lastPoint.y,
                size: Math.random() * 3 + 1,
                color: particleColor,
                opacity: 1,
                vx: (Math.random() - 0.5) * 5,
                vy: (Math.random() - 0.5) * 5,
                life: 60
            });
        }
        while (trailParticles.length > MAX_TRAIL_PARTICLES) {
            trailParticles.shift();
        }
    }

    for (let i = trailParticles.length - 1; i >= 0; i--) {
        const p = trailParticles[i];
        p.x += p.vx;
        p.y += p.vy;
        p.opacity -= 1 / p.life;
        p.size *= 0.98;

        drawCtx.fillStyle = `rgba(${parseInt(p.color.slice(1, 3), 16)}, ${parseInt(p.color.slice(3, 5), 16)}, ${parseInt(p.color.slice(5, 7), 16)}, ${p.opacity})`;
        drawCtx.beginPath();
        drawCtx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        drawCtx.fill();

        if (p.opacity <= 0 || p.size <= 0.5) {
            trailParticles.splice(i, 1);
        }
    }
}


/**
 * Animates the "birth" of a perfect circle for high scores.
 * @param {Object} circleProps - The {x, y, radius} of the circle to animate.
 */
function animatePerfectCircleBirth(circleProps) {
    let animationProgress = 0;
    const duration = 120; // Animation duration in frames

    const birthAnimationLoop = () => {
        clearDrawingCanvas();

        const currentRadius = circleProps.radius * (animationProgress / duration);
        const opacity = Math.sin(Math.PI * (animationProgress / duration));

        drawCtx.beginPath();
        drawCtx.arc(circleProps.x, circleProps.y, currentRadius, 0, Math.PI * 2);
        drawCtx.strokeStyle = `rgba(150, 255, 255, ${opacity * 0.8})`;
        drawCtx.lineWidth = 5 + (animationProgress / duration) * 10;
        drawCtx.shadowBlur = 30 + (animationProgress / duration) * 20;
        drawCtx.shadowColor = `rgba(150, 255, 255, ${opacity})`;
        drawCtx.stroke();

        if (animationProgress % 5 === 0) {
            for (let i = 0; i < 10; i++) {
                const angle = Math.random() * Math.PI * 2;
                const px = circleProps.x + currentRadius * Math.cos(angle);
                const py = circleProps.y + currentRadius * Math.sin(angle);
                createParticleEffect(px, py, 1, 'rgba(255, 255, 100, 1)');
            }
        }

        animationProgress++;
        if (animationProgress <= duration) {
            requestAnimationFrame(birthAnimationLoop);
        } else {
            clearDrawingCanvas(); // Clear animation artifacts
            // After animation, display final score state and allow new drawing
            displayScoreFinalState(scoreBeingDisplayed);
        }
    };
    requestAnimationFrame(birthAnimationLoop);
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
 * Loads the high score. Now resets on page refresh.
 */
function loadHighScore() {
    highScore = 0; // High score always starts at 0 on refresh
    highScoreDisplay.textContent = `High Score: ${highScore}%`;
}

/**
 * Saves the current high score (in memory only).
 * @param {number} score - The score to potentially save as high score.
 * @returns {boolean} True if a new high score was set, false otherwise.
 */
function saveHighScore(score) {
    let newRecord = false;
    if (score > highScore) {
        highScore = score;
        newRecord = true;
    }
    highScoreDisplay.textContent = `High Score: ${highScore}%`;
    return newRecord;
}

// --- Audio Toggle Functionality ---
/**
 * Toggles the background sound on and off.
 */
function toggleSound() {
    isSoundEnabled = !isSoundEnabled;
    if (isSoundEnabled) {
        audioToggleIcon.classList.remove('fa-volume-mute');
        audioToggleIcon.classList.add('fa-volume-up');
        audioToggleButton.classList.remove('audio-off');
        audioToggleButton.classList.add('audio-on', 'pulse-animation');
        if (Tone.context.state !== 'running') {
            setupAudio(); // Ensure audio context is running if re-enabled
        }
    } else {
        audioToggleIcon.classList.remove('fa-volume-up');
        audioToggleIcon.classList.add('fa-volume-mute');
        audioToggleButton.classList.remove('audio-on', 'pulse-animation');
        audioToggleButton.classList.add('audio-off');
        // Stop all active synths when sound is disabled
        if (drawSynth && drawSynth.state === 'started') drawSynth.triggerRelease();
        if (victorySynth && victorySynth.state === 'started') victorySynth.triggerRelease();
        if (clickSynth && clickSynth.state === 'started') clickSynth.triggerRelease();
    }
}

// --- Accuracy Meter Functionality (Numerical Only) ---
/**
 * Updates the real-time accuracy meter display.
 * @param {number} currentAccuracy - The current accuracy percentage.
 */
function updateAccuracyMeter(currentAccuracy = 0) {
    if (!isDrawing || currentAccuracy === -1) {
        accuracyMeterWrapper.classList.add('hidden');
        return;
    }

    accuracyMeterValue.textContent = `${currentAccuracy}%`;
    accuracyMeterValue.style.color = mapValueToColor(currentAccuracy, accuracyColorScale, 0, 100);
    accuracyMeterWrapper.classList.remove('hidden');
}


// --- Game State Management ---
let scoreBeingDisplayed = 0;

/**
 * Initializes a new game round. Called only once from the start button.
 */
function initializeGameSession() {
    // Hide the start button permanently for this session
    initialStartContainer.classList.add('hidden');
    // Ensure the post-game controls are hidden until a game is finished
    postGameControls.classList.add('hidden');
    shareButton.classList.add('hidden'); // Ensure share button is hidden initially

    // Start the first drawing flow
    startNewDrawing();
}

/**
 * Prepares the game for a new drawing. This is called both after the initial start
 * and after a game finishes, to allow continuous drawing.
 */
function startNewDrawing() {
    clearDrawingCanvas();
    drawingPoints = [];
    isDrawing = false; // Set to false to allow handlePointerDown to initiate drawing
    targetCircle = null; // Reset target circle
    messageDisplay.textContent = 'Draw a perfect circle!';

    // Hide score displays and share button when a new drawing is about to start
    centralScoreDisplayWrapper.classList.add('hidden');
    centralScoreText.classList.remove('show', 'hide'); // Reset animation classes
    scoreMessage.classList.add('hidden');
    highScoreDisplay.classList.add('hidden'); // Hide high score during drawing

    accuracyMeterWrapper.classList.remove('hidden');
    updateAccuracyMeter(0); // Reset live accuracy

    if (isSoundEnabled && clickSynth) clickSynth.triggerAttackRelease('C4', '8n');
}

/**
 * Concludes the drawing phase, calculates the score, and updates the UI.
 * Handles cases where drawing is too short or a circle cannot be detected.
 */
function finishDrawing() {
    if (!isDrawing) return; // Ensure this is only called if drawing was active
    isDrawing = false;
    cancelAnimationFrame(animationFrameId); // Stop the drawLoop animation

    if (isSoundEnabled && drawSynth) {
        drawSynth.triggerRelease(); // Stop the drawing sound
    }

    accuracyMeterWrapper.classList.add('hidden'); // Hide live accuracy meter

    targetCircle = calculateCircleProperties(drawingPoints);
    scoreBeingDisplayed = calculateCircleScore(drawingPoints, targetCircle);

    if (scoreBeingDisplayed === -1) {
        showMessage("Try again! Your drawing wasn't quite a circle.", 'error');
        clearDrawingCanvas(); // Clear canvas
        if (isSoundEnabled && clickSynth) {
             clickSynth.triggerAttackRelease('C#2', '8n'); // Lower pitch for error sound
        }
        // Show post-game controls (excluding share button initially)
        postGameControls.classList.remove('hidden');
        shareButton.classList.add('hidden'); // Keep share button hidden if score is invalid
        highScoreDisplay.classList.remove('hidden'); // Show high score again
        // Game is ready for a new drawing simply by user starting to draw
        return;
    }

    const newRecord = saveHighScore(scoreBeingDisplayed);

    // Play success sound for any valid circle, with variations for high scores
    if (isSoundEnabled && victorySynth) {
        if (newRecord) {
            // New high score sound: A high, crisp, and short tone
            victorySynth.triggerAttackRelease('C6', '0.2s', Tone.now(), 0.9);
        } else if (scoreBeingDisplayed >= 95) {
            // Excellent score sound (major 7th chord)
            victorySynth.triggerAttackRelease(['G4', 'B4', 'D5', 'F#5'], '1.2s', Tone.now(), 0.7);
        } else if (scoreBeingDisplayed >= 80) {
            // Good score sound (major triad)
            victorySynth.triggerAttackRelease(['C4', 'E4', 'G4'], '0.8s', Tone.now(), 0.6);
        } else {
            // Standard success sound for any valid circle
            victorySynth.triggerAttackRelease(['A3', 'C#4', 'E4'], '0.6s', Tone.now(), 0.5);
        }
    }

    if (scoreBeingDisplayed >= 80) {
        animatePerfectCircleBirth(targetCircle); // Animation will call displayScoreFinalState
    } else {
        displayScoreFinalState(scoreBeingDisplayed); // Directly display score
        drawUserPath(); // Redraw path if no specific animation
    }

    // After completion (success or fail), show the post-game controls, including share
    postGameControls.classList.remove('hidden');
    shareButton.classList.remove('hidden'); // Share button is only visible after a valid game result
    highScoreDisplay.classList.remove('hidden'); // Ensure high score is visible
    clearDrawingCanvas(); // Clear canvas to invite new drawing
}

/**
 * Displays the final score and message after any animations are complete.
 * @param {number} score - The score to display.
 */
function displayScoreFinalState(score) {
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
    }
    else if (score >= 60) {
        scoreMessage.textContent = "Keep practicing!";
    } else {
        scoreMessage.textContent = "You'll get there!";
    }
    scoreMessage.classList.remove('hidden');

    const rect = drawingCanvas.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    createParticleEffect(centerX, centerY, 50, '#90EE90');

    showMessage(""); // Clear the top message display
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
 * @param {PointerEvent} e - The pointer event.
 */
function handlePointerDown(e) {
    e.preventDefault();

    if (e.pointerType === 'touch' && e.touches && e.touches.length > 1) {
        return; // Ignore multi-touch gestures to avoid accidental drawing
    }

    // Only start a new drawing if not currently drawing and start button is already hidden
    if (!isDrawing) {
        startNewDrawing(); // Prepare UI for a fresh drawing
        isDrawing = true;
        drawingPoints = [getCanvasCoordinates(e)];
        messageDisplay.textContent = "Drawing...";
        accuracyMeterWrapper.classList.remove('hidden');
        highScoreDisplay.classList.add('hidden'); // Hide high score during drawing

        if (isSoundEnabled && drawSynth) {
            // Start a subtle, continuous high-pitched tone for drawing
            drawSynth.triggerAttack(Tone.Midi(60).toFrequency(), Tone.now(), 0.5); // Using C4 frequency
        }

        animationFrameId = requestAnimationFrame(drawLoop);
    }
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
        if (isSoundEnabled && drawSynth) drawSynth.triggerRelease();
        finishDrawing();
    }
}

/**
 * The main animation loop for continuously drawing the user's path while `isDrawing` is true.
 */
function drawLoop() {
    if (isDrawing) {
        if (drawingPoints.length >= 20) {
            targetCircle = calculateCircleProperties(drawingPoints);
            if (targetCircle && targetCircle.radius > 5) {
                const provisionalScore = calculateCircleScore(drawingPoints, targetCircle);
                updateAccuracyMeter(provisionalScore);
                if (provisionalScore !== -1) {
                    let messageType = 'info';
                    if (provisionalScore >= 90) {
                        messageType = 'success';
                    } else if (provisionalScore >= 70) {
                        messageType = 'info';
                    } else {
                        messageType = 'warning';
                    }
                    showMessage(`Accuracy: ${provisionalScore}%`, messageType);
                    messageDisplay.classList.add('live-accuracy');
                    messageDisplay.style.color = mapValueToColor(provisionalScore, accuracyColorScale, 0, 100);
                } else {
                    showMessage('Keep Drawing... (Form a closed shape!)', 'warning');
                    messageDisplay.classList.remove('live-accuracy');
                }
            } else {
                showMessage('Drawing... (Expand your circle!)', 'info');
                messageDisplay.classList.remove('live-accuracy');
                updateAccuracyMeter(0);
            }
        } else {
            showMessage('Drawing... (Need more points for a circle!)', 'info');
            messageDisplay.classList.remove('live-accuracy');
            updateAccuracyMeter(0);
        }

        drawUserPath();
        animationFrameId = requestAnimationFrame(drawLoop);
    }
}

// --- Tone.js Initialization ---
/**
 * Initializes Tone.js AudioContext and synths.
 * Must be called after a user gesture (e.g., button click) to bypass browser autoplay policies.
 */
async function setupAudio() {
    if (Tone.context.state !== 'running') {
        await Tone.start();
        console.log('AudioContext started');
    }

    if (!drawSynth) {
        // Synth for drawing sound (subtle, high-pitched scratching/hissing)
        drawSynth = new Tone.NoiseSynth({
            noise: {
                type: 'white' // White noise for a hiss-like sound
            },
            envelope: {
                attack: 0.001,
                decay: 0.1,
                sustain: 1, // Full sustain for continuous sound while drawing
                release: 0.2
            }
        }).toDestination();
        drawSynth.volume.value = -25; // Very subtle volume, less intrusive

        // Synth for victory sounds (clear, pleasant chord)
        victorySynth = new Tone.PolySynth(Tone.Synth, {
            oscillator: { type: "sine" }, // Smoother, purer tone
            envelope: {
                attack: 0.05,
                decay: 0.8, // Longer decay for a more sustained success feel
                sustain: 0.4,
                release: 1.5 // Long release for the chord to fade out smoothly
            },
            // Add a small amount of vibrato for richness
            vibratoAmount: 0.2,
            vibratoRate: 3
        }).toDestination();
        victorySynth.volume.value = -10; // Decent volume for victory

        // Synth for click/feedback sounds
        clickSynth = new Tone.Synth({
            oscillator: { type: "triangle" }, // Slightly softer than square wave
            envelope: {
                attack: 0.001,
                decay: 0.08, // Slightly longer decay
                sustain: 0.02,
                release: 0.15 // Slightly longer release
            }
        }).toDestination();
        clickSynth.volume.value = -12; // Medium volume
    }
}

// --- Share Button Functionality ---
function shareGame() {
    const shareData = {
        title: 'Perfect Circle Game',
        text: `I scored ${highScore}% in the Perfect Circle game! Can you beat my high score?`,
        url: window.location.href // Current URL of the game
    };

    if (navigator.share) {
        navigator.share(shareData)
            .then(() => console.log('Perfect Circle shared successfully!'))
            .catch((error) => console.error('Error sharing Perfect Circle:', error));
    } else {
        navigator.clipboard.writeText(shareData.url).then(() => {
            showCustomMessage('Link Copied!', 'The game link has been copied to your clipboard. Share it with your friends!');
        }).catch(err => {
            console.error('Failed to copy link:', err);
            showCustomMessage('Cannot Share', 'Please manually copy this link: ' + shareData.url);
        });
    }
}


// --- Event Listeners ---
window.addEventListener('resize', resizeCanvases);

// startButton triggers audio setup and game initialisation
startButton.addEventListener('click', () => {
    setupAudio().then(() => {
        // Once audio context is running, initialize the game session
        initializeGameSession();
    });
});

audioToggleButton.addEventListener('click', toggleSound);
shareButton.addEventListener('click', shareGame);

// Pointer events on drawingCanvas are always active for drawing
drawingCanvas.addEventListener('pointerdown', handlePointerDown);
drawingCanvas.addEventListener('pointermove', handlePointerMove);
drawingCanvas.addEventListener('pointerup', handlePointerUp);
drawingCanvas.addEventListener('pointercancel', handlePointerUp);


// Initial setup when the DOM is fully loaded and ready
document.addEventListener('DOMContentLoaded', () => {
    resizeCanvases();
    initNebulaParticles();
    animateBackground();

    // Initial UI state: Show only the start button and main title/message
    initialStartContainer.classList.remove('hidden'); // Ensure start button is visible
    postGameControls.classList.add('hidden'); // Hide share and audio toggle
    centralScoreDisplayWrapper.classList.add('hidden'); // Hide score display
    accuracyMeterWrapper.classList.add('hidden'); // Hide accuracy meter
    highScoreDisplay.classList.remove('hidden'); // Show high score initially

    showMessage('Ready to draw a perfect circle!');
    loadHighScore(); // Load high score, which now resets on refresh

    // Ensure sound toggle button is visually correct on load
    if (isSoundEnabled) {
        audioToggleButton.classList.add('audio-on', 'pulse-animation');
        audioToggleIcon.classList.add('fa-volume-up');
    } else {
        audioToggleButton.classList.add('audio-off');
        audioToggleIcon.classList.add('fa-volume-mute');
    }
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
