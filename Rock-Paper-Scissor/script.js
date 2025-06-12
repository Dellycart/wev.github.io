// --- DOM Elements ---
// Welcome Screen
const welcomeScreen = document.getElementById('welcome-screen');
const playerNameInput = document.getElementById('player-name-input');
const seriesLengthSelect = document.getElementById('series-length-select');
const startGameBtn = document.getElementById('start-game-btn');

// Game Screen
const gameContainer = document.getElementById('game-container');
const playerNameDisplayGame = document.getElementById('player-name-display-game');
const playerHandDiv = document.getElementById('player-hand');
const playerHandImg = document.getElementById('player-hand-img');
const computerHandDiv = document.getElementById('computer-hand');
const computerHandImg = document.getElementById('computer-hand-img');
const gameMessage = document.getElementById('game-message');
const choicesContainer = document.getElementById('choices-container');
const choiceButtons = document.querySelectorAll('.choice-btn');
const playAgainBtn = document.getElementById('play-again-btn');
const playerScoreSpan = document.getElementById('player-score');
const computerScoreSpan = document.getElementById('computer-score');
const tieScoreSpan = document.getElementById('tie-score');

// Elements for series score
const playerSeriesWinsSpan = document.getElementById('player-series-wins');
const computerSeriesWinsSpan = document.getElementById('computer-series-wins');
const currentSeriesLengthSpan = document.getElementById('current-series-length');

// New elements for visual/audio enhancements and overlay buttons
const impactEffectDiv = document.getElementById('impact-effect');
const gameOverOverlay = document.getElementById('game-over-overlay');
const overlayMessage = document.getElementById('overlay-message');
const replaySeriesBtn = document.getElementById('replay-series-btn');
const mainMenuBtn = document.getElementById('main-menu-btn');


// Elements for sounds and effects
const clickSound = document.getElementById('click-sound');
const winSound = document.getElementById('win-sound');
const errorSound = document.getElementById('error-sound');
const soundToggleButton = document.getElementById('sound-toggle-btn');
const shareButton = document.getElementById('share-btn');
const confettiContainer = document.getElementById('confetti-container');
const countdownSound = document.getElementById('countdown-sound');
const impactSound = document.getElementById('impact-sound');
const gameOverSound = document.getElementById('game-over-sound');


// Favicon
const faviconLink = document.getElementById('favicon-link');
const faviconImages = ['Rock.png', 'Paper.png', 'Scissors.png']; // Ensure these images are available
let currentFaviconIndex = 0;
let faviconIntervalId;

// --- Game Variables ---
let playerName = "Player";
let playerScore = 0;
let computerScore = 0;
let tieScore = 0;

let playerSeriesWins = 0;
let computerSeriesWins = 0;
let seriesLength = 3;
let roundsPlayed = 0;

const choices = ['rock', 'paper', 'scissors'];
let isSoundEnabled = true;

// Mapping for image files (ensure these images are available)
const choiceImageMap = {
    'rock': 'Rock.png',
    'paper': 'Paper.png',
    'scissors': 'Scissors.png'
};

// --- Functions ---

// Favicon animation: Cycles through R-P-S favicons
function changeFavicon() {
    faviconLink.href = faviconImages[currentFaviconIndex];
    currentFaviconIndex = (currentFaviconIndex + 1) % faviconImages.length;
}

// Get computer's random choice: Picks one of 'rock', 'paper', 'scissors' randomly
function getComputerChoice() {
    const randomIndex = Math.floor(Math.random() * choices.length);
    return choices[randomIndex];
}

// Determine the winner of a single round
function determineWinner(playerChoice, computerChoice) {
    if (playerChoice === computerChoice) {
        return 'tie';
    } else if (
        (playerChoice === 'rock' && computerChoice === 'scissors') ||
        (playerChoice === 'paper' && computerChoice === 'rock') ||
        (playerChoice === 'scissors' && computerChoice === 'paper')
    ) {
        return 'win';
    } else {
        return 'lose';
    }
}

// --- Audio Functions ---
// Plays an audio element if sound is enabled
function playSound(audioElement) {
    if (isSoundEnabled) {
        audioElement.currentTime = 0; // Reset audio to start for quick successive plays
        audioElement.play().catch(e => console.error("Audio playback failed:", e)); // Catch and log potential playback errors
    }
}

// Specific sound functions for better readability
function playClickSound() {
    playSound(clickSound);
}

function playWinSound() {
    playSound(winSound);
}

function playErrorSound() {
    playSound(errorSound);
}

function playCountdownSound() {
    playSound(countdownSound);
}

function playImpactSound() {
    playSound(impactSound);
}

function playGameOverSound() {
    playSound(gameOverSound);
}

// --- Sound Toggle Function ---
// Toggles sound on/off and updates the button icon
function toggleSound() {
    isSoundEnabled = !isSoundEnabled;
    if (isSoundEnabled) {
        soundToggleButton.innerHTML = '&#128266;'; /* Speaker with sound emoji */
        soundToggleButton.classList.add('on');
    } else {
        soundToggleButton.innerHTML = '&#128263;'; /* Speaker mute emoji */
        soundToggleButton.classList.remove('on');
    }
}

// --- Confetti Effect ---
// Generates and animates confetti particles on screen for a win
function triggerConfetti() {
    const colors = ['#f00', '#0f0', '#00f', '#ff0', '#0ff', '#f0f', '#f80', '#80f']; // Array of vibrant colors
    const numConfetti = 50; // Number of confetti pieces to generate

    for (let i = 0; i < numConfetti; i++) {
        const confetti = document.createElement('div');
        confetti.classList.add('confetti'); // Apply confetti CSS for styling and animation
        confetti.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)]; // Random color
        confetti.style.left = `${Math.random() * 100}%`; // Random horizontal position
        confetti.style.animationDelay = `${Math.random() * 0.5}s`; // Stagger animation start
        confetti.style.animationDuration = `${2 + Math.random() * 1}s`; // Random animation duration
        confetti.style.transform = `scale(${0.5 + Math.random() * 0.5})`; // Random size
        confetti.style.borderRadius = `${Math.random() > 0.5 ? '50%' : '0'}`; // Random shape (circle or square)

        confettiContainer.appendChild(confetti); // Add confetti to the container

        // Remove confetti element after its animation finishes to clean up DOM
        confetti.addEventListener('animationend', () => {
            confetti.remove();
        });
    }
}

// --- Share Function ---
// Allows sharing the game link using Web Share API or copying to clipboard as fallback
function shareGame() {
    const shareData = {
        title: 'Rock Paper Scissors Game',
        text: `I just played Rock Paper Scissors! Can you beat my high score? Try it out!`,
        url: window.location.href // Current game URL
    };

    if (navigator.share) {
        // Use Web Share API if available
        navigator.share(shareData)
            .then(() => console.log('Game shared successfully'))
            .catch((error) => console.error('Error sharing game:', error));
    } else {
        // Fallback for browsers that do not support navigator.share (e.g., desktop browsers without HTTPS)
        // Copy link to clipboard
        const dummyElement = document.createElement('textarea');
        document.body.appendChild(dummyElement);
        dummyElement.value = shareData.url;
        dummyElement.select();
        document.execCommand('copy'); // This is deprecated but widely supported for clipboard copy in iframes
        document.body.removeChild(dummyElement);
        // Use a custom message box instead of alert() for better user experience
        showMessageBox('Game link copied to clipboard! You can paste it to share.');
    }
}

// Custom message box function (replaces alert() for better UX)
function showMessageBox(message) {
    const messageBox = document.createElement('div');
    messageBox.style.cssText = `
        position: fixed;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        background-color: rgba(0, 0, 0, 0.8);
        color: white;
        padding: 20px;
        border-radius: 10px;
        z-index: 100;
        font-family: 'Jost', sans-serif;
        font-size: 1.2em;
        text-align: center;
        box-shadow: 0 5px 15px rgba(0,0,0,0.5);
        opacity: 0;
        animation: fadeInOut 2s forwards;
    `;
    messageBox.textContent = message;
    document.body.appendChild(messageBox);

    // CSS for the fadeInOut animation
    const style = document.createElement('style');
    style.innerHTML = `
        @keyframes fadeInOut {
            0% { opacity: 0; }
            20% { opacity: 1; }
            80% { opacity: 1; }
            100% { opacity: 0; }
        }
    `;
    document.head.appendChild(style);

    setTimeout(() => {
        messageBox.remove();
        style.remove(); // Clean up the dynamic style tag
    }, 2000); // Message disappears after 2 seconds
}


// --- Core Game Round Logic after countdown completes ---
// Handles determining winner, updating scores, and checking for series end
function executeRoundLogic(playerChoice) {
    const computerChoice = getComputerChoice(); // Computer makes its random choice

    // Set hand images based on choices
    playerHandImg.src = choiceImageMap[playerChoice];
    computerHandImg.src = choiceImageMap[computerChoice];

    // Apply reveal animation to hands
    playerHandDiv.style.animation = 'handReveal 0.5s ease-out forwards';
    computerHandDiv.style.animation = 'handReveal 0.5s ease-out forwards';

    // Trigger impact effect when hands clash
    impactEffectDiv.style.animation = 'none'; // Reset animation to re-trigger
    void impactEffectDiv.offsetWidth; // Force reflow to restart animation
    impactEffectDiv.style.animation = 'impact-burst 0.3s ease-out forwards'; // Play impact animation
    playImpactSound(); // Play impact sound effect

    const result = determineWinner(playerChoice, computerChoice); // Determine round winner
    roundsPlayed++; // Increment rounds played in current series

    // Update scores and game message based on result
    gameMessage.classList.remove('win', 'lose', 'tie'); // Clear previous result styling
    if (result === 'win') {
        playerScore++;
        gameMessage.textContent = `${playerName} Wins Round!`;
        gameMessage.classList.add('win');
        playWinSound();
    } else if (result === 'lose') {
        computerScore++;
        gameMessage.textContent = `Computer Wins Round!`;
        gameMessage.classList.add('lose');
        playErrorSound(); // Play a sound for losing
    } else { // tie
        tieScore++;
        gameMessage.textContent = `It's a Tie!`;
        gameMessage.classList.add('tie');
    }

    // Update scoreboard display
    playerScoreSpan.textContent = playerScore;
    computerScoreSpan.textContent = computerScore;
    tieScoreSpan.textContent = tieScore;

    // Timeout to allow reveal animation to play before checking series end
    setTimeout(() => {
        const targetWins = Math.ceil(seriesLength / 2); // Calculate wins needed to win the series
        let seriesWinner = null;

        // Check if either player has reached the target wins for the series
        if (playerScore >= targetWins) {
            seriesWinner = 'player';
            playerSeriesWins++; // Increment player's series wins
        } else if (computerScore >= targetWins) {
            seriesWinner = 'computer';
            computerSeriesWins++; // Increment computer's series wins
        }

        if (seriesWinner) {
            // If a series winner is determined, show the game over overlay
            gameOverOverlay.classList.add('visible');
            replaySeriesBtn.style.display = 'block'; // Show replay series button
            mainMenuBtn.style.display = 'block'; // Show main menu button

            if (seriesWinner === 'player') {
                overlayMessage.innerHTML = `${playerName} WINS THE SERIES! &#127881;`; // Victory message with emoji
                overlayMessage.classList.add('win-color');
                playWinSound(); // Play win sound
                triggerConfetti(); // Trigger confetti effect
            } else {
                overlayMessage.innerHTML = `COMPUTER WINS THE SERIES! &#128128;`; // Defeat message with emoji
                overlayMessage.classList.add('lose-color');
                playGameOverSound(); // Play game over sound for loss
            }
            // Animate the overlay message text
            overlayMessage.style.animation = 'none'; // Reset animation
            void overlayMessage.offsetWidth; // Trigger reflow
            overlayMessage.style.animation = 'overlay-text-in 0.8s ease-out forwards';

            // Update the series wins display on the main game screen
            playerSeriesWinsSpan.textContent = playerSeriesWins;
            computerSeriesWinsSpan.textContent = computerSeriesWins;

            // Reset round scores for the next series (but keep series scores)
            playerScore = 0;
            computerScore = 0;
            tieScore = 0;
            roundsPlayed = 0;

        } else {
            // If no series winner, continue to the next round in the series
            gameMessage.textContent = `Round Over. Select Next Weapon!`;
            gameMessage.classList.add(result); // Apply win/lose/tie color to the message
            playAgainBtn.textContent = 'Play Next Round';
            playAgainBtn.style.display = 'block'; // Show button to start next round
        }
    }, 500); // Duration of reveal animation before checking series end
}


// --- Main Play Round function (with countdown) ---
// Initiates a round with a visual and audio countdown
function playRound(playerChoice) {
    choicesContainer.classList.add('hidden'); // Hide choice buttons during round
    playAgainBtn.style.display = 'none'; // Hide "Play Next Round" button

    gameMessage.classList.remove('win', 'lose', 'tie', 'series-end', 'countdown-animate'); // Clear all previous stylings

    // Set initial hand images (e.g., "Rock" for shaking animation)
    playerHandImg.src = choiceImageMap['rock'];
    computerHandImg.src = choiceImageMap['rock'];

    playerHandDiv.classList.remove('hidden'); // Show hands
    computerHandDiv.classList.remove('hidden');

    // Initial shake animation for hands during countdown
    playerHandDiv.style.animation = 'handShakePlayer 0.5s infinite alternate';
    computerHandDiv.style.animation = 'handShakeComputer 0.5s infinite alternate';

    let countdown = 3;
    gameMessage.textContent = `Ready? ${countdown}...`; // Initial countdown message
    gameMessage.classList.add('countdown-animate'); // Add class for countdown animation
    playCountdownSound();

    const countdownInterval = setInterval(() => {
        countdown--;
        if (countdown > 0) {
            gameMessage.textContent = `${countdown}...`;
            // Reset animation to re-trigger for each countdown number
            gameMessage.style.animation = 'none';
            void gameMessage.offsetWidth; // Force reflow
            gameMessage.style.animation = 'countdown-pulse 0.8s ease-out forwards, countdown-color 0.8s ease-out forwards';
            playCountdownSound();
        } else if (countdown === 0) {
            gameMessage.textContent = `GO!`;
            // Reset animation for "GO!"
            gameMessage.style.animation = 'none';
            void gameMessage.offsetWidth;
            gameMessage.style.animation = 'countdown-pulse 0.8s ease-out forwards, countdown-color 0.8s ease-out forwards';
            playCountdownSound();
        } else {
            clearInterval(countdownInterval); // Stop countdown
            gameMessage.classList.remove('countdown-animate'); // Remove countdown animation class
            playerHandDiv.style.animation = 'none'; // Stop shake animation
            computerHandDiv.style.animation = 'none';
            executeRoundLogic(playerChoice); // Execute actual round logic after countdown
        }
    }, 800); // Interval for countdown (e.g., every 0.8 seconds)
}

// Reset game area to prepare for a new round or game
function resetGameArea() {
    playerHandDiv.classList.add('hidden'); // Hide hands
    computerHandDiv.classList.add('hidden');
    playerHandDiv.style.animation = 'none'; // Clear any lingering animations
    computerHandDiv.style.animation = 'none';

    choicesContainer.classList.remove('hidden'); // Show choice buttons
    playAgainBtn.style.display = 'none'; // Hide "Play Next Round" button
    gameMessage.textContent = 'Select your Weapon'; // Reset game message
    gameMessage.classList.remove('win', 'lose', 'tie', 'series-end', 'countdown-animate'); // Clear all result/animation stylings
    impactEffectDiv.style.animation = 'none'; // Clear any lingering impact effect

    // Ensure overlay buttons are hidden when game area is reset (if coming from game over)
    replaySeriesBtn.style.display = 'none';
    mainMenuBtn.style.display = 'none';
}

// Resets all scores (round and series) to restart a brand new game
function resetAllScoresAndSeries() {
    playerScore = 0;
    computerScore = 0;
    tieScore = 0;
    playerSeriesWins = 0;
    computerSeriesWins = 0;
    roundsPlayed = 0;
    // Update all score displays to 0
    playerScoreSpan.textContent = playerScore;
    computerScoreSpan.textContent = computerScore;
    tieScoreSpan.textContent = tieScore;
    playerSeriesWinsSpan.textContent = playerSeriesWins;
    computerSeriesWinsSpan.textContent = computerSeriesWins;
    resetGameArea(); // Reset the visual game area
}

// --- Event Listeners ---
// Event listener for the "Start Game" button on the welcome screen
startGameBtn.addEventListener('click', () => {
    const inputName = playerNameInput.value.trim();
    if (inputName) {
        playerName = inputName; // Use entered name
    } else {
        playerName = "Challenger"; // Default name
    }
    playerNameDisplayGame.textContent = playerName; // Display player name in game screen

    seriesLength = parseInt(seriesLengthSelect.value); // Get selected series length
    currentSeriesLengthSpan.textContent = seriesLength; // Display series length

    welcomeScreen.style.display = 'none'; // Hide welcome screen
    gameContainer.style.display = 'flex'; // Show game screen (using flex for layout)

    // Start favicon animation interval
    faviconIntervalId = setInterval(changeFavicon, 2000); // Change favicon every 2 seconds
    resetAllScoresAndSeries(); // Initialize scores for a new game
});

// Event listeners for Rock, Paper, Scissors choice buttons
choiceButtons.forEach(button => {
    button.addEventListener('click', () => {
        // Only allow choices if game over overlay is NOT visible and game is ready for input ("Select your Weapon" message)
        if (!gameOverOverlay.classList.contains('visible') && gameMessage.textContent.includes("Select your Weapon")) {
            playClickSound(); // Play button click sound
            const playerChoice = button.id; // Get the ID (rock, paper, or scissors) of the clicked button
            playRound(playerChoice); // Start a new round with the player's choice
        } else if (gameOverOverlay.classList.contains('visible')) {
            // Do nothing if game over overlay is visible, user must click replay/menu button
        } else {
            // This case means a round is in progress (e.g., during countdown or hand reveal animations)
            // Optionally, provide feedback here, e.g., showMessageBox("Round in progress! Please wait...");
        }
    });
});

// Event listener for the "Play Next Round" button (within an ongoing series)
playAgainBtn.addEventListener('click', () => {
    resetGameArea(); // Reset the visual area, but keep series scores to continue the series
});

// Event listener for the "Play Again" button on the OVERLAY (Replay Series)
replaySeriesBtn.addEventListener('click', () => {
    gameOverOverlay.classList.remove('visible'); // Hide the game over overlay
    // Reset all scores (round and series) to start a brand new series with same player/series length
    resetAllScoresAndSeries();
});

// Event listener for the "Main Menu" button on the OVERLAY
mainMenuBtn.addEventListener('click', () => {
    gameOverOverlay.classList.remove('visible'); // Hide the game over overlay
    gameContainer.style.display = 'none'; // Hide the game screen
    welcomeScreen.style.display = 'flex'; // Show the welcome screen
    resetAllScoresAndSeries(); // Reset all scores for a brand new game, including series wins
});

// Event listeners for global control buttons
soundToggleButton.addEventListener('click', toggleSound); // Toggle sound on/off
shareButton.addEventListener('click', shareGame); // Share game link

// --- Initial Setup ---
// Set initial button icons (emojis for better compatibility and visual appeal)
soundToggleButton.innerHTML = '&#128266;'; // Speaker with sound emoji
shareButton.innerHTML = '&#128279;'; // Link emoji

soundToggleButton.classList.add('on'); // Set sound button to 'on' state initially

// Display the default series length on the game screen based on the select element's initial value
currentSeriesLengthSpan.textContent = seriesLengthSelect.value;
