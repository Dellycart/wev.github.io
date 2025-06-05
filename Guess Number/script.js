// --- Game State Variables ---
let secretNumber; // The number the user needs to guess
let attempts;     // Counter for current attempts
const MAX_ATTEMPTS = 10; // Maximum number of guesses allowed
let guessHistory; // Array to store all guesses made
let score;        // Player's score

// --- DOM Element References ---
const guessInput = document.getElementById('guessInput');
const guessButton = document.getElementById('guessButton');
const restartButton = document.getElementById('restartButton');
const feedbackElement = document.getElementById('feedback');
const emojiElement = document.getElementById('emoji');
const historyListElement = document.getElementById('history');
const scoreDisplayElement = document.getElementById('score');

// --- Game Initialization ---
/**
 * Initializes or resets the game state.
 */
function initializeGame() {
    // Generate a new random secret number between 1 and 100
    secretNumber = Math.floor(Math.random() * 100) + 1;
    attempts = 0;
    guessHistory = [];
    score = 0; // Reset score for a new game

    // Update UI elements to their initial state
    scoreDisplayElement.textContent = score;
    historyListElement.innerHTML = ''; // Clear previous guess history
    guessInput.value = ''; // Clear input field
    feedbackElement.textContent = ''; // Clear feedback message
    feedbackElement.classList.remove('correct', 'incorrect'); // Remove styling classes
    emojiElement.textContent = '🎯'; // Reset emoji
    guessInput.disabled = false; // Enable input
    guessButton.disabled = false; // Enable guess button
    guessInput.focus(); // Set focus to the input field for immediate typing
}

// --- Score Management ---
/**
 * Updates the player's score.
 * @param {number} pointsToAdd - The number of points to add to the score.
 */
function updateScore(pointsToAdd) {
    score += pointsToAdd;
    scoreDisplayElement.textContent = score;
}

// --- Guess History Management ---
/**
 * Adds a new guess entry to the history and updates the display.
 * @param {string} entry - The text content for the history item.
 */
function addGuessToHistory(entry) {
    guessHistory.push(entry);
    const listItem = document.createElement('li');
    listItem.textContent = entry;
    historyListElement.appendChild(listItem);
    // Scroll to the bottom of the history list to show the latest guess
    historyListElement.scrollTop = historyListElement.scrollHeight;
}

// --- Main Game Logic: Check Guess ---
/**
 * Handles the user's guess: validates input, provides feedback, and updates game state.
 */
function checkGuess() {
    const guess = parseInt(guessInput.value); // Get user input and convert to integer

    // Input Validation
    if (isNaN(guess) || guess < 1 || guess > 100) {
        feedbackElement.textContent = 'Please enter a valid number between 1 and 100. 🙏';
        emojiElement.textContent = '⚠️';
        feedbackElement.classList.remove('correct', 'incorrect'); // Clear any previous status colors
        guessInput.value = ''; // Clear invalid input
        return; // Stop function execution
    }

    attempts++; // Increment attempts counter

    // Add current guess to history display
    addGuessToHistory(`Attempt ${attempts}: ${guess}`);

    // Compare guess to secret number
    if (guess === secretNumber) {
        // Correct Guess!
        feedbackElement.textContent = `Magnificent! You guessed the secret bloom (${secretNumber}) in ${attempts} tries! 🎉`;
        feedbackElement.classList.remove('incorrect');
        feedbackElement.classList.add('correct');
        emojiElement.textContent = '🌸'; // Blooming flower emoji
        
        // Award points based on fewer attempts
        const pointsAwarded = Math.max(0, (MAX_ATTEMPTS - attempts + 1) * 20); // More points for less attempts
        updateScore(pointsAwarded);

        // Disable input and button as game is won
        guessInput.disabled = true;
        guessButton.disabled = true;
    } else if (guess < secretNumber) {
        // Guess is too low
        feedbackElement.textContent = 'Too low! Your petal needs more sun. ⬆️';
        feedbackElement.classList.remove('correct');
        feedbackElement.classList.add('incorrect');
        emojiElement.textContent = '🌱'; // Sprout emoji
    } else {
        // Guess is too high
        feedbackElement.textContent = 'Too high! That bloom is out of reach. ⬇️';
        feedbackElement.classList.remove('correct');
        feedbackElement.classList.add('incorrect');
        emojiElement.textContent = '🌿'; // Leaf emoji
    }

    guessInput.value = ''; // Clear the input field for the next guess
    guessInput.focus(); // Keep focus on the input for quick re-entry

    // Check for game over (out of attempts)
    if (attempts >= MAX_ATTEMPTS && guess !== secretNumber) {
        feedbackElement.textContent = `Oh dear! You've run out of attempts. The secret bloom was ${secretNumber}. 🥀`;
        feedbackElement.classList.remove('correct', 'incorrect'); // Remove all status colors
        emojiElement.textContent = '🍂'; // Fading leaf emoji
        
        // Disable input and button as game is over
        guessInput.disabled = true;
        guessButton.disabled = true;
    }
}

// --- Event Listeners ---
// Listen for clicks on the "Bloom!" (Guess) button
guessButton.addEventListener('click', checkGuess);

// Listen for clicks on the "Re-Seed" (Restart) button
restartButton.addEventListener('click', initializeGame);

// Listen for 'Enter' key press on the input field to trigger a guess
guessInput.addEventListener('keypress', function(event) {
    // Check if the pressed key is 'Enter' (key code 13)
    if (event.key === 'Enter') {
        checkGuess();
    }
});

// --- Initial Game Setup on Load ---
// Call initializeGame() when the script loads to set up the first round
initializeGame();
