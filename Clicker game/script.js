document.addEventListener('DOMContentLoaded', () => {
    const ideaCountDisplay = document.getElementById('ideaCount');
    const creditCountDisplay = document.getElementById('creditCount');
    const clickBtn = document.getElementById('clickBtn');
    const progressBar = document.getElementById('progressBar');
    const messageDisplay = document.getElementById('message');
    const toggleDarkBtn = document.getElementById('toggleDark');
    const restartBtn = document.getElementById('restartBtn');
    const sparkContainer = document.getElementById('sparkContainer');
    const currentFormatTitle = document.getElementById('currentFormatTitle');
    const ideaFormatVisual = document.getElementById('ideaFormatVisual');
    const advantageList = document.getElementById('advantageList');

    // --- Game State Variables ---
    let ideaCount = 0;
    let credits = 0;
    let ideasPerClick = 1; // Base IPC
    let creditThreshold = 5; // Ideas needed to earn 1 credit
    let ideasSinceLastCredit = 0;
    let currentFormatIndex = 0;
    let autoClickerInterval = null; // To store the interval ID for the auto-clicker

    // --- Sound Effects ---
    const sounds = {
        click: new Audio('sounds/click.mp3'),
        purchase: new Audio('sounds/purchase.mp3'),
        error: new Audio('sounds/error.mp3'),
        success: new Audio('sounds/success.mp3'),
        song1: new Audio('sounds/song1.mp3'), // Example ambient song
        song2: new Audio('sounds/song2.mp3')  // Another example ambient song
    };

    // Set volumes and loop for songs
    if (sounds.click) sounds.click.volume = 0.5;
    if (sounds.purchase) sounds.purchase.volume = 0.7;
    if (sounds.error) sounds.error.volume = 0.7;
    if (sounds.success) sounds.success.volume = 0.7;
    if (sounds.song1) { sounds.song1.volume = 0.3; sounds.song1.loop = true; }
    if (sounds.song2) { sounds.song2.volume = 0.3; sounds.song2.loop = true; }

    let currentSong = null; // To keep track of the currently playing song audio object

    function playSound(soundName) {
        if (sounds[soundName]) {
            sounds[soundName].currentTime = 0; // Rewind to start for quick plays
            sounds[soundName].play().catch(e => console.warn(`Sound playback failed for ${soundName}:`, e));
        }
    }

    function playSong(songName) {
        if (currentSong) {
            currentSong.pause();
            currentSong.currentTime = 0;
        }
        if (sounds[songName]) {
            currentSong = sounds[songName];
            currentSong.play().catch(e => console.warn(`Song playback failed for ${songName}:`, e));
        }
    }

    function stopCurrentSong() {
        if (currentSong) {
            currentSong.pause();
            currentSong.currentTime = 0;
            currentSong = null;
        }
    }

    // --- Progression for Idea Formats ---
    const ideaFormats = [
        { name: "Basic Concept", threshold: 0, cssClass: "format-basic", message: "Starting with a spark!" },
        { name: "Raw Data", threshold: 20, cssClass: "format-concept", message: "Raw data is accumulating!" },
        { name: "Blueprint Draft", threshold: 50, cssClass: "format-blueprint", message: "Drafting a blueprint for success!" },
        { name: "Working Prototype", threshold: 150, cssClass: "format-prototype", message: "A prototype is forming!" },
        { name: "Feedback Loop", threshold: 300, cssClass: "format-feedback", message: "Refining ideas with feedback!" },
        { name: "Viable Solution", threshold: 750, cssClass: "format-solution", message: "You've found a viable solution!" },
        { name: "Breakthrough Discovery", threshold: 1500, cssClass: "format-breakthrough", message: "A groundbreaking discovery!" },
        { name: "Innovation Engine", threshold: 3000, cssClass: "format-innovation", message: "The innovation engine is roaring!" },
        { name: "Timeless Masterpiece", threshold: 6000, cssClass: "format-masterpiece", message: "A timeless masterpiece created!" }
    ];

    // --- Shop Advantages ---
    const advantages = [
        {
            id: 'autoClicker',
            name: 'Auto-Idea Generator',
            description: 'Automatically generates 1 idea per second.',
            cost: 50,
            effect: { type: 'auto-ideas', value: 1 },
            bought: false,
            element: null
        },
        {
            id: 'doubleClick',
            name: 'Double Click Power',
            description: 'Doubles your ideas per click.',
            cost: 20,
            effect: { type: 'ipc-multiplier', value: 2 },
            bought: false,
            element: null
        },
        {
            id: 'creditBoost',
            name: 'Credit Efficiency',
            description: 'Reduces ideas needed for 1 credit by 1.',
            cost: 30,
            effect: { type: 'credit-threshold-reduce', value: 1 },
            bought: false,
            element: null
        },
        {
            id: 'superBoost',
            name: 'Super Brainstorm',
            description: 'Increases ideas per click by 5.',
            cost: 100,
            effect: { type: 'ipc-add', value: 5 },
            bought: false,
            element: null
        },
        {
            id: 'ambientSong1',
            name: 'Calm Research Music',
            description: 'Adds a relaxing background track to your idea sessions.',
            cost: 75,
            effect: { type: 'play-song', value: 'song1' },
            bought: false,
            element: null
        },
        {
            id: 'ambientSong2',
            name: 'Energetic Innovation Beat',
            description: 'Picks up the pace with an inspiring background rhythm.',
            cost: 120,
            effect: { type: 'play-song', value: 'song2' },
            bought: false,
            element: null
        },
        {
            id: 'visualDots',
            name: 'Dot Matrix Display',
            description: 'Adds a subtle dot matrix pattern to the background.',
            cost: 40,
            effect: { type: 'add-visual-class', value: 'pattern-dots' },
            bought: false,
            element: null
        },
        {
            id: 'visualGrid',
            name: 'Structural Grid Overlay',
            description: 'Applies a structured grid pattern, aiding organization.',
            cost: 60,
            effect: { type: 'add-visual-class', value: 'pattern-grid' },
            bought: false,
            element: null
        }
    ];

    // --- Game State Management ---
    function loadGameState() {
        ideaCount = parseInt(localStorage.getItem('ideaCount')) || 0;
        credits = parseInt(localStorage.getItem('credits')) || 0;
        ideasPerClick = parseInt(localStorage.getItem('ideasPerClick')) || 1;
        creditThreshold = parseInt(localStorage.getItem('creditThreshold')) || 5;
        ideasSinceLastCredit = parseInt(localStorage.getItem('ideasSinceLastCredit')) || 0;
        currentFormatIndex = parseInt(localStorage.getItem('currentFormatIndex')) || 0;

        const savedAdvantages = JSON.parse(localStorage.getItem('advantages')) || [];
        advantages.forEach(adv => {
            const savedAdv = savedAdvantages.find(sAdv => sAdv.id === adv.id);
            if (savedAdv) {
                adv.bought = savedAdv.bought;
            }
        });

        // Apply bought advantages that are persistent (e.g., auto-clicker, visual classes, current song)
        advantages.forEach(adv => {
            if (adv.bought) {
                if (adv.effect.type === 'auto-ideas') {
                    applyAdvantageEffect(adv.effect, true); // Re-start auto-clicker
                }
                if (adv.effect.type === 'add-visual-class') {
                    document.body.classList.add(adv.effect.value);
                }
                if (adv.effect.type === 'play-song' && localStorage.getItem('currentPlayingSong') === adv.effect.value) {
                    playSong(adv.effect.value);
                }
            }
        });

        // Ensure currentFormatIndex is within bounds if new formats were added/removed
        if (currentFormatIndex >= ideaFormats.length) {
            currentFormatIndex = ideaFormats.length - 1;
        }
    }

    function saveGameState() {
        localStorage.setItem('ideaCount', ideaCount);
        localStorage.setItem('credits', credits);
        localStorage.setItem('ideasPerClick', ideasPerClick);
        localStorage.setItem('creditThreshold', creditThreshold);
        localStorage.setItem('ideasSinceLastCredit', ideasSinceLastCredit);
        localStorage.setItem('currentFormatIndex', currentFormatIndex);

        const savedAdvantages = advantages.map(adv => ({ id: adv.id, bought: adv.bought }));
        localStorage.setItem('advantages', JSON.stringify(savedAdvantages));

        // Save current playing song to persist across sessions
        if (currentSong) {
            localStorage.setItem('currentPlayingSong', Object.keys(sounds).find(key => sounds[key] === currentSong));
        } else {
            localStorage.removeItem('currentPlayingSong');
        }
    }

    function resetGame() {
        if (confirm("Are you sure you want to restart? All progress will be lost!")) {
            localStorage.clear(); // Clear all saved data
            location.reload(); // Reload the page to reset the game state
        }
    }

    // --- UI Update Functions ---
    function updateDisplay() {
        ideaCountDisplay.textContent = ideaCount;
        creditCountDisplay.textContent = credits;

        // Update progress bar for next format unlock
        const nextFormat = ideaFormats[currentFormatIndex + 1];
        if (nextFormat) {
            const currentFormatThreshold = ideaFormats[currentFormatIndex].threshold;
            const progressRange = nextFormat.threshold - currentFormatThreshold;
            const currentProgress = ideaCount - currentFormatThreshold;
            progressBar.style.width = `${(currentProgress / progressRange) * 100}%`;
            document.querySelector('.progress-label').textContent = `Progress to "${nextFormat.name}"`;
        } else {
            progressBar.style.width = `100%`;
            document.querySelector('.progress-label').textContent = "All formats unlocked!";
        }

        updateShopButtons();
        updateIdeaFormatVisual();
    }

    // Apply the visual format based on idea count
    function updateIdeaFormatVisual() {
        let newFormatIndex = currentFormatIndex;
        for (let i = ideaFormats.length - 1; i >= 0; i--) {
            if (ideaCount >= ideaFormats[i].threshold) {
                newFormatIndex = i;
                break;
            }
        }

        if (newFormatIndex !== currentFormatIndex) {
            currentFormatIndex = newFormatIndex;
            localStorage.setItem('currentFormatIndex', currentFormatIndex);
            const unlockedFormat = ideaFormats[currentFormatIndex];
            currentFormatTitle.textContent = unlockedFormat.name;
            messageDisplay.textContent = `New Idea Format Unlocked: "${unlockedFormat.name}"! ${unlockedFormat.message}`;
            messageDisplay.classList.add('flash-message');
            setTimeout(() => {
                messageDisplay.classList.remove('flash-message');
                messageDisplay.textContent = '';
            }, 2500);
            playSound('success'); // Play a distinct sound for unlocks
        }

        // Always ensure the correct class is applied for the current format
        // This handles initial load and format changes
        ideaFormatVisual.className = ''; // Clear all previous format classes
        ideaFormatVisual.classList.add(ideaFormats[currentFormatIndex].cssClass);
        currentFormatTitle.textContent = ideaFormats[currentFormatIndex].name;
    }

    // --- Game Logic ---
    function handleClick(e) {
        ideaCount += ideasPerClick;
        ideasSinceLastCredit += ideasPerClick;

        while (ideasSinceLastCredit >= creditThreshold) {
            credits++;
            ideasSinceLastCredit -= creditThreshold;
            // Optional: Play a credit sound
        }

        updateDisplay();
        createSpark(e);
        saveGameState();
        playSound('click'); // Play click sound
    }

    // Create a visual spark animation
    function createSpark(e) {
        const spark = document.createElement('div');
        spark.classList.add('spark');
        sparkContainer.appendChild(spark);

        const btnRect = clickBtn.getBoundingClientRect();
        const sparkSize = Math.random() * 20 + 10;
        const clickX = e.clientX - btnRect.left;
        const clickY = e.clientY - btnRect.top;

        spark.style.width = `${sparkSize}px`;
        spark.style.height = `${sparkSize}px`;
        spark.style.left = `${clickX}px`;
        spark.style.top = `${clickY}px`;
        spark.style.backgroundColor = `hsl(${Math.random() * 360}, 100%, 70%)`; // Random vibrant color

        spark.addEventListener('animationend', () => {
            spark.remove();
        });
    }

    // --- Shop Functions ---
    function renderShop() {
        advantageList.innerHTML = ''; // Clear existing list
        advantages.forEach(adv => {
            const itemDiv = document.createElement('div');
            itemDiv.classList.add('advantage-item');
            itemDiv.innerHTML = `
                <h3>${adv.name}</h3>
                <p>${adv.description}</p>
                <div class="cost">Cost: ${adv.cost} Credits</div>
                <button class="buy-btn" data-id="${adv.id}" ${adv.bought ? 'disabled' : ''}>
                    ${adv.bought ? 'Purchased!' : 'Buy'}
                </button>
            `;
            advantageList.appendChild(itemDiv);
            adv.element = itemDiv.querySelector('.buy-btn'); // Store reference to the button
        });
        addShopListeners();
        updateShopButtons(); // Initial update after rendering
    }

    function addShopListeners() {
        advantageList.querySelectorAll('.buy-btn').forEach(button => {
            button.addEventListener('click', (e) => {
                const advId = e.target.dataset.id;
                buyAdvantage(advId);
            });
        });
    }

    function buyAdvantage(id) {
        const adv = advantages.find(a => a.id === id);
        if (adv && !adv.bought && credits >= adv.cost) {
            credits -= adv.cost;
            adv.bought = true;
            applyAdvantageEffect(adv.effect);
            messageDisplay.textContent = `"${adv.name}" purchased!`;
            messageDisplay.style.backgroundColor = 'var(--success-color)';
            messageDisplay.style.color = 'white';
            setTimeout(() => {
                messageDisplay.textContent = '';
                messageDisplay.style.backgroundColor = '';
                messageDisplay.style.color = '';
            }, 2000);
            playSound('purchase');
            updateDisplay();
            saveGameState();
        } else if (adv && credits < adv.cost) {
            messageDisplay.textContent = `Not enough credits for "${adv.name}"!`;
            messageDisplay.style.backgroundColor = 'var(--error-color)';
            messageDisplay.style.color = 'white';
            setTimeout(() => {
                messageDisplay.textContent = '';
                messageDisplay.style.backgroundColor = '';
                messageDisplay.style.color = '';
            }, 2000);
            playSound('error');
        }
    }

    function applyAdvantageEffect(effect, loading = false) {
        switch (effect.type) {
            case 'ipc-multiplier':
                ideasPerClick *= effect.value;
                break;
            case 'ipc-add':
                ideasPerClick += effect.value;
                break;
            case 'credit-threshold-reduce':
                creditThreshold = Math.max(1, creditThreshold - effect.value); // Don't go below 1
                break;
            case 'auto-ideas':
                if (!loading) { // Only start new interval if not loading from saved state
                    if (autoClickerInterval) clearInterval(autoClickerInterval); // Clear existing to prevent duplicates
                    startAutoClicker(effect.value);
                }
                break;
            case 'play-song':
                stopCurrentSong(); // Stop any currently playing song
                playSong(effect.value);
                break;
            case 'add-visual-class':
                document.body.classList.add(effect.value);
                break;
            case 'remove-visual-class':
                document.body.classList.remove(effect.value);
                break;
        }
        // If loading, we don't want to re-save. Otherwise, save state.
        if (!loading) {
            saveGameState();
        }
    }

    function updateShopButtons() {
        advantages.forEach(adv => {
            if (adv.element) { // Ensure the element exists (it will after renderShop)
                if (adv.bought) {
                    adv.element.disabled = true;
                    adv.element.textContent = 'Purchased!';
                } else {
                    adv.element.disabled = credits < adv.cost;
                }
            }
        });
    }

    function startAutoClicker(ideasPerSecond) {
        if (autoClickerInterval) clearInterval(autoClickerInterval); // Clear any existing
        autoClickerInterval = setInterval(() => {
            ideaCount += ideasPerSecond;
            ideasSinceLastCredit += ideasPerSecond;
            while (ideasSinceLastCredit >= creditThreshold) {
                credits++;
                ideasSinceLastCredit -= creditThreshold;
            }
            updateDisplay();
            saveGameState();
        }, 1000); // Every second
    }

    // --- Dark Mode Toggle ---
    function toggleDarkMode() {
        document.body.classList.toggle('dark-mode');
        const isDarkMode = document.body.classList.contains('dark-mode');
        localStorage.setItem('darkMode', isDarkMode);
        toggleDarkBtn.setAttribute('aria-pressed', isDarkMode);
    }

    // --- Initialization ---
    // Add CSS for flash message animation if not already present
    const style = document.createElement('style');
    style.innerHTML = `
        @keyframes flash {
            0% { opacity: 0; transform: scale(0.8); }
            50% { opacity: 1; transform: scale(1); }
            100% { opacity: 0; transform: scale(0.8); }
        }
        .flash-message {
            animation: flash 2s forwards ease-out;
        }
    `;
    document.head.appendChild(style);


    // Initial setup
    loadGameState(); // Load state first
    updateDisplay(); // Then update display based on loaded state
    renderShop(); // Render shop after loading advantages (important for button references)

    // Apply dark mode preference on load
    if (localStorage.getItem('darkMode') === 'true') {
        document.body.classList.add('dark-mode');
        toggleDarkBtn.setAttribute('aria-pressed', 'true');
    }

    // --- Event Listeners ---
    clickBtn.addEventListener('click', handleClick);
    toggleDarkBtn.addEventListener('click', toggleDarkMode);
    restartBtn.addEventListener('click', resetGame);
});
