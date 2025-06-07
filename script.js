// script.js

// --- Global Variables and Setup ---
const backgroundCanvas = document.getElementById('backgroundCanvas');
const bgCtx = backgroundCanvas.getContext('2d');
const drawingCanvas = document.getElementById('drawingCanvas');
const drawCtx = drawingCanvas.getContext('2d');

const startButton = document.getElementById('startButton');
const messageDisplay = document.getElementById('messageDisplay');
const centralScoreDisplayWrapper = document.getElementById('centralScoreDisplayWrapper');
const centralScoreText = document.getElementById('centralScoreText');
const scoreMessage = document.getElementById('scoreMessage');
const highScoreDisplay = document.getElementById('highScoreDisplay');

const audioToggleButton = document.querySelector('#audioToggleButton button'); // Get the button element
const audioToggleIcon = audioToggleButton.querySelector('i'); // Get the icon element inside the button
const accuracyMeterWrapper = document.getElementById('accuracyMeterWrapper'); // Wrapper for the numerical accuracy
const accuracyMeterValue = document.getElementById('accuracyMeterValue'); // Span to display accuracy text

let isDrawing = false;
let drawingPoints = [];
let animationFrameId; // For drawing loop
let backgroundAnimationFrameId; // For background animation loop

let targetCircle = null; // Stores {x, y, radius} of the ideal circle.

// Tone.js setup
let synth, reverb, gainNode;
let isSoundEnabled = true; // State for sound toggle

// Define an accuracy color scale (Red -> Yellow -> Green)
const accuracyColorScale = ['#FF0000', '#FFFF00', '#00FF00']; // Red (bad), Yellow (okay), Green (good)

let highScore = 0; // Stores the high score, initialized on load

// Nebula background parameters
const nebulaParticles = [];
const NUM_NEBULA_PARTICLES = 50; // Fewer for performance on mobile
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
 * Resizes all canvases to fit the window and adjusts for device pixel ratio (DPR)
 * to ensure crisp rendering on high-DPI screens (e.g., Retina displays).
 * This function should be called on initial load and whenever the window is resized.
 */
function resizeCanvases() {
    const dpr = window.devicePixelRatio || 1;

    // Set CSS (display) size for all canvases
    backgroundCanvas.style.width = window.innerWidth + 'px';
    backgroundCanvas.style.height = window.innerHeight + 'px';
    drawingCanvas.style.width = window.innerWidth + 'px';
    drawingCanvas.style.height = window.innerHeight + 'px';

    // Set actual resolution (internal drawing buffer size) for all canvases
    backgroundCanvas.width = window.innerWidth * dpr;
    backgroundCanvas.height = window.innerHeight * dpr;
    drawingCanvas.width = window.innerWidth * dpr;
    drawingCanvas.height = window.innerHeight * dpr;

    // Scale the drawing contexts to match the DPR
    bgCtx.setTransform(dpr, 0, 0, dpr, 0, 0);
    drawCtx.setTransform(dpr, 0, 0, dpr, 0, 0);

    // Reinitialize nebula particles for new dimensions
    initNebulaParticles();

    // Redraw the background and user path if necessary
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
 * This function calculates the center and radius from the drawn points.
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
 * This function incorporates checks for circularity, closedness, and general shape validity.
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
    nebulaParticles.length = 0; // Clear existing particles
    for (let i = 0; i < NUM_NEBULA_PARTICLES; i++) {
        nebulaParticles.push({
            x: Math.random() * backgroundCanvas.width,
            y: Math.random() * backgroundCanvas.height,
            radius: Math.random() * 100 + 50, // Larger for nebula clouds
            colorIndex: Math.floor(Math.random() * NEBULA_COLORS.length),
            opacity: Math.random() * 0.1 + 0.05, // Very subtle opacity
            speedX: (Math.random() - 0.5) * 0.2, // Slow movement
            speedY: (Math.random() - 0.5) * 0.2,
            growthRate: (Math.random() - 0.5) * 0.1 // Subtle size change
        });
    }
}

/**
 * Draws the dynamic cosmic/nebula background.
 */
function drawBackground() {
    bgCtx.clearRect(0, 0, backgroundCanvas.width, backgroundCanvas.height);

    // Draw swirling nebula clouds
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

        // Update particle position and size
        p.x += p.speedX;
        p.y += p.speedY;
        p.radius += p.growthRate;

        // Wrap around screen if out of bounds
        if (p.x > backgroundCanvas.width + p.radius) p.x = -p.radius;
        if (p.x < -p.radius) p.x = backgroundCanvas.width + p.radius;
        if (p.y > backgroundCanvas.height + p.radius) p.y = -p.radius;
        if (p.y < -p.radius) p.y = backgroundCanvas.height + p.radius;

        // Reset radius if it gets too big/small
        if (p.radius > 200 || p.radius < 50) {
            p.growthRate *= -1; // Reverse growth
        }
    }

    // Add static twinkling stars (optional, or make them very subtle)
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
const MAX_TRAIL_PARTICLES = 30; // Max number of small particles for the trail

/**
 * Draws the user's freehand path on the drawing canvas with an "energy trail" effect.
 * Applies dynamic glow, thickness, and emits small particles.
 */
function drawUserPath() {
    clearDrawingCanvas(); // Clear to redraw everything each frame

    if (drawingPoints.length < 2) return;

    // The provisional target circle is always calculated based on all drawn points
    let provisionalTargetCircle = calculateCircleProperties(drawingPoints);

    // --- Draw Ghost Target Circle (Subtle Guide) ---
    if (provisionalTargetCircle && provisionalTargetCircle.radius > 10) {
        drawCtx.beginPath();
        drawCtx.arc(provisionalTargetCircle.x, provisionalTargetCircle.y, provisionalTargetCircle.radius, 0, Math.PI * 2);
        drawCtx.strokeStyle = `rgba(100, 150, 255, ${Math.min(0.05 + drawingPoints.length / 5000, 0.2)})`; // Fades in very subtly
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

        let segmentColor = 'rgba(255, 255, 255, 0.5)'; // Default for very early drawing
        let lineWidth = 3; // Base line width, slightly thicker
        let shadowBlur = 0; // Default shadow blur

        if (provisionalTargetCircle && provisionalTargetCircle.radius > 10) {
            const distanceToCenter = Math.sqrt(Math.pow(p2.x - provisionalTargetCircle.x, 2) + Math.pow(p2.y - provisionalTargetCircle.y, 2));
            const deviation = Math.abs(distanceToCenter - provisionalTargetCircle.radius);

            const maxExpectedDeviation = Math.min(window.innerWidth, window.innerHeight) * 0.1;
            let accuracyValue = Math.max(0, 100 - (deviation / maxExpectedDeviation) * 100);

            segmentColor = mapValueToColor(accuracyValue, accuracyColorScale, 0, 100);

            // Dynamic Line Thickness (3 to 8 pixels)
            lineWidth = 3 + (accuracyValue / 100) * 5; // Scales from 3px (0% accuracy) to 8px (100% accuracy)
            lineWidth = Math.max(3, Math.min(8, lineWidth)); // Clamp values

            // Dynamic Glow (0 to 20 blur)
            shadowBlur = (accuracyValue / 100) * 20; // Scales from 0 (0% accuracy) to 20 (100% accuracy)
            shadowBlur = Math.max(0, Math.min(20, shadowBlur)); // Clamp values
            drawCtx.shadowColor = segmentColor; // Shadow matches segment color
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
    // Reset shadow after drawing all segments
    drawCtx.shadowBlur = 0;
    drawCtx.shadowColor = 'transparent';

    // Add new trail particles from the current drawing point
    if (isDrawing && drawingPoints.length > 0) {
        const lastPoint = drawingPoints[drawingPoints.length - 1];
        const currentAccuracy = calculateCircleScore(drawingPoints, provisionalTargetCircle);
        const particleColor = mapValueToColor(currentAccuracy !== -1 ? currentAccuracy : 0, accuracyColorScale, 0, 100);

        // Add a few particles per frame, but not too many
        for (let j = 0; j < Math.random() * 2; j++) { // Randomly 0 or 1 particle per frame
            trailParticles.push({
                x: lastPoint.x,
                y: lastPoint.y,
                size: Math.random() * 3 + 1, // Size from 1 to 4
                color: particleColor,
                opacity: 1,
                vx: (Math.random() - 0.5) * 5, // Random initial velocity
                vy: (Math.random() - 0.5) * 5,
                life: 60 // Frames to live
            });
        }
        // Limit total particles to prevent performance issues
        while (trailParticles.length > MAX_TRAIL_PARTICLES) {
            trailParticles.shift();
        }
    }

    // Draw and update existing trail particles
    for (let i = trailParticles.length - 1; i >= 0; i--) {
        const p = trailParticles[i];
        p.x += p.vx;
        p.y += p.vy;
        p.opacity -= 1 / p.life; // Fade over time
        p.size *= 0.98; // Shrink slightly

        drawCtx.fillStyle = `rgba(${parseInt(p.color.slice(1, 3), 16)}, ${parseInt(p.color.slice(3, 5), 16)}, ${parseInt(p.color.slice(5, 7), 16)}, ${p.opacity})`;
        drawCtx.beginPath();
        drawCtx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        drawCtx.fill();

        if (p.opacity <= 0 || p.size <= 0.5) {
            trailParticles.splice(i, 1); // Remove dead particles
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
        clearDrawingCanvas(); // Clear drawing canvas for this animation

        // Draw the expanding, glowing circle
        const currentRadius = circleProps.radius * (animationProgress / duration);
        const opacity = Math.sin(Math.PI * (animationProgress / duration)); // Fade in and out

        drawCtx.beginPath();
        drawCtx.arc(circleProps.x, circleProps.y, currentRadius, 0, Math.PI * 2);
        drawCtx.strokeStyle = `rgba(150, 255, 255, ${opacity * 0.8})`; // Bright cyan/white
        drawCtx.lineWidth = 5 + (animationProgress / duration) * 10; // Thicker line
        drawCtx.shadowBlur = 30 + (animationProgress / duration) * 20; // Stronger glow
        drawCtx.shadowColor = `rgba(150, 255, 255, ${opacity})`;
        drawCtx.stroke();

        // Emit strong particles from the circle's circumference
        if (animationProgress % 5 === 0) { // Emit particles periodically
            for (let i = 0; i < 10; i++) {
                const angle = Math.random() * Math.PI * 2;
                const px = circleProps.x + currentRadius * Math.cos(angle);
                const py = circleProps.y + currentRadius * Math.sin(angle);
                createParticleEffect(px, py, 1, 'rgba(255, 255, 100, 1)'); // Bright yellow particles
            }
        }

        animationProgress++;
        if (animationProgress <= duration) {
            requestAnimationFrame(birthAnimationLoop);
        } else {
            clearDrawingCanvas(); // Clear animation artifacts
            // Re-draw the final user path if needed after animation
            if (drawingPoints.length > 0) {
                drawUserPath();
            }
            // Now, display the score
            displayScoreFinalState(scoreBeingDisplayed); // Call the function to show the score
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
 * @returns {boolean} True if a new high score was set, false otherwise.
 */
function saveHighScore(score) {
    let newRecord = false;
    if (score > highScore) {
        highScore = score;
        localStorage.setItem('perfectCircleHighScore', highScore.toString());
        highScoreDisplay.textContent = `High Score: ${highScore}%`;
        newRecord = true;
    }
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
        audioToggleButton.classList.add('audio-on', 'pulse-animation'); // Add pulse animation
        if (Tone.context.state !== 'running') {
            setupAudio();
        }
    } else {
        audioToggleIcon.classList.remove('fa-volume-up');
        audioToggleIcon.classList.add('fa-volume-mute');
        audioToggleButton.classList.remove('audio-on', 'pulse-animation'); // Remove pulse animation
        audioToggleButton.classList.add('audio-off');
        if (synth) synth.triggerRelease(); // Release any currently playing notes
    }
}

// --- Accuracy Meter Functionality (Numerical Only) ---
/**
 * Updates the real-time accuracy meter display.
 * @param {number} currentAccuracy - The current accuracy percentage.
 */
function updateAccuracyMeter(currentAccuracy = 0) {
    if (!isDrawing || currentAccuracy === -1) { // Hide if not drawing or accuracy is invalid
        accuracyMeterWrapper.classList.add('hidden');
        return;
    }

    accuracyMeterValue.textContent = `${currentAccuracy}%`;
    accuracyMeterValue.style.color = mapValueToColor(currentAccuracy, accuracyColorScale, 0, 100);
    accuracyMeterWrapper.classList.remove('hidden'); // Ensure it's visible during drawing
}


// --- Game State Management ---
let scoreBeingDisplayed = 0; // Temporary storage for score during animation

/**
 * Starts a new game round. Resets drawing state and UI.
 */
function startGame() {
    clearDrawingCanvas();
    drawingPoints = [];
    isDrawing = false;
    messageDisplay.textContent = 'Draw a perfect circle!';
    startButton.style.display = 'none'; // Hide the start button while drawing
    centralScoreDisplayWrapper.classList.add('hidden');
    centralScoreText.classList.remove('show', 'hide');
    scoreMessage.classList.add('hidden');
    highScoreDisplay.classList.remove('hidden'); // Keep high score visible

    // Show the live accuracy meter
    accuracyMeterWrapper.classList.remove('hidden');
    updateAccuracyMeter(0); // Reset meter to 0% at start

    if (isSoundEnabled && synth) synth.triggerAttackRelease('C4', '8n');
}

/**
 * Concludes the drawing phase, calculates the score, and updates the UI.
 * Handles cases where drawing is too short or a circle cannot be detected.
 */
function finishDrawing() {
    if (!isDrawing) return;
    isDrawing = false;
    cancelAnimationFrame(animationFrameId); // Stop the drawing animation loop

    // Hide the live accuracy meter
    accuracyMeterWrapper.classList.add('hidden');

    // Calculate the final best-fit circle based on all drawn points (auto-calculated center)
    targetCircle = calculateCircleProperties(drawingPoints);

    scoreBeingDisplayed = calculateCircleScore(drawingPoints, targetCircle);

    if (scoreBeingDisplayed === -1) {
        showMessage("Try again! Your drawing wasn't quite a circle.", 'error');
        clearDrawingCanvas(); // Clear the canvas immediately for a fresh start
        if (isSoundEnabled && synth) synth.triggerAttackRelease('F#3', '16n');
        startButton.style.display = 'block'; // Show the start button again
        return; // Exit early if score is invalid
    }

    const newRecord = saveHighScore(scoreBeingDisplayed); // Save score and check for new record

    // If it's a high score (80% or above), trigger birth animation
    if (scoreBeingDisplayed >= 80) {
        animatePerfectCircleBirth(targetCircle); // Pass the final calculated circle
        if (newRecord && isSoundEnabled && synth) {
            synth.triggerAttackRelease('G6', '2n'); // Special sound for new record
        } else if (isSoundEnabled && synth) {
            // Play regular score sound if not new record, but still high score
            if (scoreBeingDisplayed >= 95) {
                synth.triggerAttackRelease('G5', '4n');
            } else if (scoreBeingDisplayed >= 80) {
                synth.triggerAttackRelease('E5', '8n');
            }
        }
    } else {
        // If not a high score, just display the final state immediately
        displayScoreFinalState(scoreBeingDisplayed);
        drawUserPath(); // Redraw user's path with final colors and glow
        if (isSoundEnabled && synth) { // Play regular score sound for lower scores
            synth.triggerAttackRelease('C5', '8n');
        }
    }

    startButton.style.display = 'block'; // Show the start button again
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

    // Particle effect for all scores, but especially good ones
    const rect = drawingCanvas.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    createParticleEffect(centerX, centerY, 50, '#90EE90'); // Light green particles

    showMessage(""); // Clear the main message display
}


/**
 * Resets the game to its initial state, clearing canvases and hiding score.
 * This is called when the "Start" button is clicked after a game has ended.
 */
function resetGame() {
    clearDrawingCanvas();
    drawingPoints = [];
    isDrawing = false;
    targetCircle = null; // Ensure target circle is reset
    centralScoreDisplayWrapper.classList.add('hidden');
    centralScoreText.classList.remove('show');
    centralScoreText.classList.add('hide');
    scoreMessage.classList.add('hidden');
    highScoreDisplay.classList.remove('hidden'); // Keep high score visible
    startButton.style.display = 'block'; // Ensure start button is visible
    messageDisplay.textContent = 'Ready to draw a perfect circle?';
    accuracyMeterWrapper.classList.add('hidden'); // Hide live accuracy meter

    if (isSoundEnabled && synth) synth.triggerAttackRelease('A3', '8n');
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
        return; // Ignore multi-touch for drawing
    }

    if (!isDrawing) { // If not currently drawing, clicking canvas starts a new game
        resetGame(); // Ensure clean state
        startGame(); // Start drawing
    }

    isDrawing = true;
    drawingPoints = [getCanvasCoordinates(e)];
    messageDisplay.textContent = "Drawing...";
    startButton.style.display = 'none'; // Hide the start button while drawing
    centralScoreDisplayWrapper.classList.add('hidden');
    centralScoreText.classList.remove('show');
    scoreMessage.classList.add('hidden');
    highScoreDisplay.classList.add('hidden'); // Hide high score during drawing

    accuracyMeterWrapper.classList.remove('hidden'); // Show live accuracy meter

    if (isSoundEnabled && synth) {
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
        if (isSoundEnabled && synth) synth.triggerRelease();
        finishDrawing();
    }
}

/**
 * The main animation loop for continuously drawing the user's path while `isDrawing` is true.
 */
function drawLoop() {
    if (isDrawing) {
        if (drawingPoints.length >= 20) { // Threshold for calculating provisional score
            // Calculate provisional target circle based on all drawn points for live accuracy
            targetCircle = calculateCircleProperties(drawingPoints);
            if (targetCircle && targetCircle.radius > 5) {
                const provisionalScore = calculateCircleScore(drawingPoints, targetCircle);
                updateAccuracyMeter(provisionalScore); // Update meter with live accuracy
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
                updateAccuracyMeter(0); // Reset meter if no valid circle yet
            }
        } else {
            showMessage('Drawing... (Need more points for a circle!)', 'info');
            messageDisplay.classList.remove('live-accuracy');
            updateAccuracyMeter(0); // Keep meter at 0 if not enough points
        }

        drawUserPath();
        animationFrameId = requestAnimationFrame(drawLoop);
    }
}

// --- Tone.js Initialization ---
/**
 * Initializes Tone.js AudioContext and synth.
 * Must be called after a user gesture (e.g., button click) to bypass browser autoplay policies.
 */
async function setupAudio() {
    if (Tone.context.state !== 'running') {
        await Tone.start();
        console.log('AudioContext started');
    }

    if (!synth) { // Only create synth if it doesn't exist to prevent multiple instances
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
}


// --- Event Listeners ---
window.addEventListener('resize', resizeCanvases);

// startButton always triggers a reset and then starts the game
startButton.addEventListener('click', () => {
    setupAudio().then(() => {
        resetGame(); // Ensure clean state
        startGame(); // Start drawing
    });
});

audioToggleButton.addEventListener('click', toggleSound);

// Pointer events on drawingCanvas will be handled based on isDrawing state
drawingCanvas.addEventListener('pointerdown', handlePointerDown);
drawingCanvas.addEventListener('pointermove', handlePointerMove);
drawingCanvas.addEventListener('pointerup', handlePointerUp);
drawingCanvas.addEventListener('pointercancel', handlePointerUp);


// Initial setup when the DOM is fully loaded and ready
document.addEventListener('DOMContentLoaded', () => {
    resizeCanvases();
    initNebulaParticles(); // Initialize nebula particles
    animateBackground(); // Start background animation loop
    showMessage('Ready to draw a perfect circle!');
    loadHighScore();
    // Hide accuracy meter initially
    accuracyMeterWrapper.classList.add('hidden');

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

messageBoxClose.addEventListener('click', hideCustomMessageBox);
