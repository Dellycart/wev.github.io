document.addEventListener('DOMContentLoaded', () => {
    // Get references to key DOM elements
    const problemDisplay = document.getElementById('problem-display');
    const choiceButtonsDiv = document.getElementById('choice-buttons');
    const outcomeDisplay = document.getElementById('outcome-display');
    const outcomeText = document.getElementById('outcome-text');
    const nextProblemButton = document.getElementById('next-problem-button');
    const startButton = document.getElementById('start-button');
    const gameContainer = document.querySelector('.game-container');
    const gameScene = document.getElementById('game-scene');
    const trolley = document.getElementById('trolley');
    const sceneImage = document.getElementById('scene-image');
    const mainTrack = document.querySelector('.main-track');
    const divertedTrack = document.querySelector('.diverted-track');

    // Initialize game state variables
    let currentProblemIndex = 0;
    let problems = []; // This array will hold all the trolley problem scenarios

    // Define your trolley problems here!
    // Each problem object now includes 'imageUrl' for scene graphics,
    // explicitly showing what's on the main and diverted tracks.
    // The placeholder image uses 'placehold.co' for dynamic, descriptive images.
    // Format: https://placehold.co/{width}x{height}/{background color in hex}/{text color in hex}?text={MainTrackText}+%7C+{DivertedTrackText}
    // Using distinct colors to differentiate tracks/elements visually.

    problems = [
        {
            "description": "A runaway trolley is headed towards 5 renowned scientists who are on the verge of discovering immortality. You can pull a lever to divert it to another track, saving them, but on that track is... a single, highly energetic cat who has just invented string theory.",
            "imageUrl": "https://placehold.co/650x180/8B5CF6/FFFFFF?text=5+SCIENTISTS+%7C+Cat",
            "choices": [
                { "text": "Divert (save scientists, sacrifice cat)", "outcome": "Humanity gains immortality, but the universe remains a chaotic mess of unknown dimensions. The cat's intellectual lineage is lost forever." },
                { "text": "Do nothing (save cat, sacrifice scientists)", "outcome": "The cat's groundbreaking theory revolutionizes physics, leading to a golden age of understanding the cosmos. Humanity continues to age and die, but with immense clarity about their place in the universe." }
            ]
        },
        {
            "description": "A trolley is speeding towards 5 people who are about to win the lottery. You can switch tracks, but it will flatten a rare, sentient, singing potato.",
            "imageUrl": "https://placehold.co/650x180/3B82F6/FFFFFF?text=5+LOTTERY+WINNERS+%7C+Singing+Potato",
            "choices": [
                { "text": "Save the lottery winners (sacrifice the potato)", "outcome": "The 5 people become ridiculously wealthy, but the world loses its only source of melodious root vegetables. Humanity's joy is now purely financial." },
                { "text": "Save the potato (sacrifice the lottery winners)", "outcome": "The potato's beautiful tunes continue to uplift spirits, but the 5 would-be millionaires are gone. The world is poorer in cash, richer in song." }
            ]
        },
        {
            "description": "You're on a bridge over a track. A trolley is hurtling towards 5 innocent puppies. You can push a button to summon a giant, sentient rubber duck that will stop the trolley, but it will then immediately solve all global conflicts, rendering diplomacy obsolete.",
            "imageUrl": "https://placehold.co/650x180/FBBF24/333333?text=5+PUPPIES+%7C+Rubber+Duck",
            "choices": [
                { "text": "Summon the duck (save puppies, end diplomacy)", "outcome": "The puppies are safe, and the world is at peace. However, all diplomats, peacekeepers, and international negotiators are now unemployed and directionless, leading to a global existential crisis for the policy sector." },
                { "text": "Do nothing (sacrifice puppies, preserve diplomacy)", "outcome": "The puppies are tragically lost. Diplomacy continues to be a slow, imperfect, and often frustrating process, but humanity retains its capacity for complex political maneuvering." }
            ]
        },
        {
            "description": "A trolley is rushing towards a perfectly crafted, never-before-seen meme that would break the internet. You can divert it to hit a server containing the entire sum of human knowledge, but only you would know it was destroyed.",
            "imageUrl": "https://placehold.co/650x180/10B981/FFFFFF?text=Internet+Meme+%7C+Human+Knowledge",
            "choices": [
                { "text": "Save the meme (destroy knowledge)", "outcome": "The internet is indeed broken by the meme's brilliance. Humanity continues, blissfully unaware that its collective knowledge has been wiped, relying solely on intuition and instinct." },
                { "text": "Save knowledge (destroy the meme)", "outcome": "Human knowledge is preserved, but the world misses out on the greatest meme ever conceived. Life is functional, but a little less hilarious." }
            ]
        },
        {
            "description": "A trolley is speeding towards 5 people who are just about to get perfect, pain-free dental work. You can divert it onto a track where it will destroy the only remaining copies of every single bad Nickelback song.",
            "imageUrl": "https://placehold.co/650x180/EF4444/FFFFFF?text=5+DENTAL+PATIENTS+%7C+Nickelback+Songs",
            "choices": [
                { "text": "Divert (save dental work, destroy Nickelback)", "outcome": "5 people enjoy pristine teeth. The world rejoices as Nickelback's worst hits are wiped from existence. Music critics everywhere spontaneously combust from joy." },
                { "text": "Do nothing (sacrifice dental work, save Nickelback)", "outcome": "5 people endure terrible dental pain. Nickelback's entire discography remains intact, continuing to serve as a cultural benchmark for musical mediocrity." }
            ]
        },
        {
            "description": "A trolley is approaching 5 famous historical figures (e.g., Einstein, Newton, Shakespeare) who have been brought back to life for a day. You can pull a lever to divert it onto a track where it will destroy the world's last remaining supply of avocado toast.",
            "imageUrl": "https://placehold.co/650x180/6366F1/FFFFFF?text=5+HISTORICAL+FIGURES+%7C+Avocado+Toast",
            "choices": [
                { "text": "Divert (save historical figures, destroy avocado toast)", "outcome": "The historical figures live on, sharing their wisdom. Millennials worldwide despair as their brunch staple vanishes. Society grapples with the existential question: what is breakfast without avocado?" },
                { "text": "Do nothing (save avocado toast, sacrifice historical figures)", "outcome": "Avocado toast is safe, enjoyed by many. The historical figures, having seen enough, return to the great beyond. Humanity continues its modern habits, unburdened by ancient wisdom." }
            ]
        },
        {
            "description": "A trolley is speeding towards 5 people who are about to receive free, lifetime supplies of their favorite snack. You can divert it, but it will instead destroy a single, rare philosophical treatise that, if read, would grant everyone perfect contentment.",
            "imageUrl": "https://placehold.co/650x180/EC4899/FFFFFF?text=5+SNACKERS+%7C+Philosophical+Treatise",
            "choices": [
                { "text": "Divert (save snacks, destroy philosophy)", "outcome": "5 people are eternally happy with their snacks. The world remains restless, constantly searching for meaning, forever unaware of the perfect contentment that was almost theirs." },
                { "text": "Do nothing (save philosophy, sacrifice snacks)", "outcome": "The philosophical treatise is saved, and its wisdom brings universal contentment. 5 people miss out on their free snacks, but find true happiness within themselves, no longer needing external gratification." }
            ]
        },
        {
            "description": "A trolley is approaching 5 highly trained circus clowns. You can switch tracks, but it will destroy a microscopic organism that, if allowed to multiply, would make every single human spontaneously burst into song at random intervals.",
            "imageUrl": "https://placehold.co/650x180/06B6D4/FFFFFF?text=5+CIRCUS+CLOWNS+%7C+Singing+Organism",
            "choices": [
                { "text": "Divert (save clowns, destroy organism)", "outcome": "The clowns are safe, continuing their comedic endeavors. The world remains mostly silent, except for intentional musical performances. Order is maintained." },
                { "text": "Do nothing (save organism, sacrifice clowns)", "outcome": "The clowns are gone. The organism multiplies, leading to a world where everyone periodically bursts into musical numbers, making everyday life a chaotic, spontaneous opera." }
            ]
        },
        {
            "description": "A trolley is hurtling towards 5 people who are about to discover the secret to teleportation. You can divert it, but it will destroy the only copy of the 'Cha-Cha Slide' music video.",
            "imageUrl": "https://placehold.co/650x180/A855F7/FFFFFF?text=5+TELEPORTERS+%7C+Cha-Cha+Slide+Video",
            "choices": [
                { "text": "Divert (save teleportation, destroy 'Cha-Cha Slide')", "outcome": "Teleportation is discovered, revolutionizing travel. The 'Cha-Cha Slide' is lost to history, leaving dance floors slightly less awkward but significantly less fun." },
                { "text": "Do nothing (save 'Cha-Cha Slide', sacrifice teleportation)", "outcome": "The 'Cha-Cha Slide' lives on, enabling generations to 'slide to the left'. Teleportation remains a dream, forcing humanity to continue relying on cars and planes, forever stuck in traffic." }
            ]
        },
        {
            "description": "A trolley is speeding towards 5 people who have just been granted the ability to speak to animals. You can divert it, but it will destroy all existing supplies of artisanal cheese.",
            "imageUrl": "https://placehold.co/650x180/22C55E/FFFFFF?text=5+ANIMAL+SPEAKERS+%7C+Artisanal+Cheese",
            "choices": [
                { "text": "Divert (save animal speakers, destroy cheese)", "outcome": "5 people can now converse with creatures, gaining profound insights into the animal kingdom. Cheese connoisseurs worldwide weep, forcing a societal shift towards bland crackers." },
                { "text": "Do nothing (save cheese, sacrifice animal speakers)", "outcome": "Artisanal cheese thrives, providing culinary delight. Humanity remains ignorant of animal thoughts, leaving countless conversations with squirrels unhad." }
            ]
        },
        {
            "description": "A trolley is headed towards 5 people who are about to finish building a machine that converts pollution into rainbows. You can pull a lever to divert it, but it will instead destroy all coffee on Earth.",
            "imageUrl": "https://placehold.co/650x180/6D28D9/FFFFFF?text=5+RAINBOW+MAKERS+%7C+All+Coffee",
            "choices": [
                { "text": "Divert (save rainbow machine, destroy coffee)", "outcome": "The world becomes a colorful paradise, but everyone is perpetually tired and grumpy. Productivity plummets as the population struggles to stay awake without their daily brew." },
                { "text": "Do nothing (save coffee, sacrifice rainbow machine)", "outcome": "Coffee continues to fuel billions, maintaining global energy levels. Pollution remains, and the sky stays stubbornly grey, but at least everyone is adequately caffeinated." }
            ]
        },
        {
            "description": "A trolley is approaching 5 people who are about to compose the greatest symphony ever. You can switch tracks, but it will destroy a single, invaluable antique sock puppet.",
            "imageUrl": "https://placehold.co/650x180/F97316/FFFFFF?text=5+COMPOSERS+%7C+Antique+Sock+Puppet",
            "choices": [
                { "text": "Divert (save symphony, destroy puppet)", "outcome": "The world is blessed with unparalleled musical beauty. Puppet enthusiasts mourn the loss of a historical artifact, but art prevails." },
                { "text": "Do nothing (save puppet, sacrifice symphony)", "outcome": "The sock puppet's legacy is preserved for future generations. The greatest symphony remains unwritten, leaving a void in the world's musical heritage." }
            ]
        },
        {
            "description": "A trolley is hurtling towards 5 people who are about to collectively understand the meaning of life. You can divert it, but it will cause all gravity on Earth to briefly reverse, making everything float upwards for 10 seconds.",
            "imageUrl": "https://placehold.co/650x180/DB2777/FFFFFF?text=5+LIFE+SEARCHERS+%7C+Gravity+Switch",
            "choices": [
                { "text": "Divert (save meaning of life, reverse gravity)", "outcome": "Humanity finally grasps its purpose, but everyone experiences a chaotic 10 seconds of involuntary flight, leading to widespread confusion and minor injuries." },
                { "text": "Do nothing (save gravity, sacrifice meaning of life)", "outcome": "Gravity remains stable, keeping everything firmly on the ground. The meaning of life remains an elusive mystery, leaving humanity to ponder endlessly." }
            ]
        },
        {
            "description": "A trolley is speeding towards 5 people who are about to invent a universal remote that controls reality. You can divert it, but it will destroy all forms of glitter.",
            "imageUrl": "https://placehold.co/650x180/14B8A6/FFFFFF?text=5+REALITY+CONTROLLERS+%7C+All+Glitter",
            "choices": [
                { "text": "Divert (save reality remote, destroy glitter)", "outcome": "Reality can now be manipulated with a click. Craft enthusiasts and pop stars despair at the loss of sparkle, but omnipotence seems a fair trade." },
                { "text": "Do nothing (save glitter, sacrifice reality remote)", "outcome": "Glitter continues to spread joy (and mess) everywhere. Reality remains stubbornly un-remote-controlled, leaving humanity to deal with its unchangeable nature." }
            ]
        },
        {
            "description": "A trolley is approaching 5 people who are about to create a sustainable, infinite energy source. You can divert it, but it will instead destroy every single 'Live, Laugh, Love' sign in existence.",
            "imageUrl": "https://placehold.co/650x180/4CAF50/FFFFFF?text=5+ENERGY+CREATORS+%7C+LLLS+Signs",
            "choices": [
                { "text": "Divert (save infinite energy, destroy 'Live, Laugh, Love')", "outcome": "The world gains limitless, clean energy. Home decor stores suffer a massive loss, and inspirational quotes become less ubiquitous, but the planet is saved." },
                { "text": "Do nothing (save 'Live, Laugh, Love', sacrifice infinite energy)", "outcome": "'Live, Laugh, Love' signs continue to adorn homes worldwide. The quest for infinite energy remains, and the planet continues to struggle with fossil fuels, but at least the inspirational messages endure." }
            ]
        },
        {
            "description": "A trolley is headed towards 5 people who are about to invent truly comfortable high heels. You can pull a lever to divert it, but it will instead destroy all existing copies of 'Rick Astley - Never Gonna Give You Up'.",
            "imageUrl": "https://placehold.co/650x180/60A5FA/FFFFFF?text=5+HEEL+INVENTORS+%7C+Rickroll+Song",
            "choices": [
                { "text": "Divert (save comfortable heels, destroy Rickroll)", "outcome": "Feet everywhere rejoice as comfortable high heels become a reality. The internet mourns the loss of its most enduring prank, and an era of playful deception comes to an end." },
                { "text": "Do nothing (save Rickroll, sacrifice comfortable heels)", "outcome": "The Rickroll continues its reign of unexpected musical interruption. Feet worldwide continue to suffer in uncomfortable footwear, a small price for preserving a cultural phenomenon." }
            ]
        },
        {
            "description": "A trolley is speeding towards 5 people who are about to discover a method for talking to plants. You can divert it onto another track where it will destroy the internet's entire supply of cat videos.",
            "imageUrl": "https://placehold.co/650x180/A3E635/333333?text=5+PLANT+TALKERS+%7C+Cat+Videos",
            "choices": [
                { "text": "Divert (save plant talkers, destroy cat videos)", "outcome": "Humans can now converse with flora, gaining profound botanical insights. The internet becomes a significantly less entertaining place, as viral cat content vanishes into the digital ether." },
                { "text": "Do nothing (save cat videos, sacrifice plant talkers)", "outcome": "Cat videos continue to provide endless amusement and distraction. Plants remain silent, their leafy wisdom forever unheard by humanity." }
            ]
        },
        {
            "description": "You're on a bridge. A trolley is headed for 5 innocent, fluffy bunnies. You can push a button to summon a giant, sentient chef who will stop the trolley, but they will then immediately replace all food on Earth with plain, unseasoned tofu.",
            "imageUrl": "https://placehold.co/650x180/FBCFE8/333333?text=5+BUNNIES+%7C+Tofu+Chef",
            "choices": [
                { "text": "Summon the chef (save bunnies, replace all food)", "outcome": "The bunnies are safe. Humanity's diet becomes incredibly bland, leading to a culinary revolution of seasoning and spice, or a profound acceptance of simplicity." },
                { "text": "Do nothing (sacrifice bunnies, preserve diverse food)", "outcome": "The bunnies are tragically lost. The world's diverse cuisines remain, offering a spectrum of flavors and textures, ensuring culinary joy (and occasional indigestion)." }
            ]
        },
        {
            "description": "A trolley is rushing towards a perfectly preserved ancient Roman chariot. You can divert it to hit a facility housing the blueprint for a machine that cleans all microplastics from the oceans.",
            "imageUrl": "https://placehold.co/650x180/D1D5DB/333333?text=ROMAN+CHARIOT+%7C+Microplastic+Cure",
            "choices": [
                { "text": "Save the chariot (destroy microplastic blueprint)", "outcome": "The ancient chariot is preserved, offering a glimpse into history. The oceans remain choked with microplastics, threatening marine life and human health, but at least the chariot is safe." },
                { "text": "Save the blueprint (destroy the chariot)", "outcome": "The blueprint for microplastic removal is saved, leading to cleaner oceans. A piece of ancient history is lost, but the future of the planet looks brighter (and less plastic-y)." }
            ]
        },
        {
            "description": "A trolley is speeding towards 5 people who are about to discover the secret to perfectly balanced work-life harmony. You can divert it, but it will flatten the only known copy of the recipe for the world's most delicious cookie.",
            "imageUrl": "https://placehold.co/650x180/FECDD3/333333?text=5+HARMONY+SEEKERS+%7C+Best+Cookie+Recipe",
            "choices": [
                { "text": "Divert (save work-life harmony, destroy cookie recipe)", "outcome": "Humanity achieves perfect work-life balance, leading to widespread well-being. The world's most delicious cookie remains a mythical dream, a small sacrifice for collective zen." },
                { "text": "Do nothing (save cookie recipe, sacrifice work-life harmony)", "outcome": "The world's most delicious cookie can now be baked by all. Work-life balance remains elusive, leading to stressed but well-fed populations." }
            ]
        },
        {
            "description": "A trolley is approaching 5 people who are about to invent a device that instantly translates any language. You can switch tracks, but it will destroy all existing forms of sarcasm.",
            "imageUrl": "https://placehold.co/650x180/BFDBFE/333333?text=5+LANGUAGE+TRANSLATORS+%7C+All+Sarcasm",
            "choices": [
                { "text": "Divert (save language device, destroy sarcasm)", "outcome": "Communication barriers vanish, leading to unprecedented global understanding. All irony and subtle wit disappear, making conversations remarkably literal and sometimes painfully sincere." },
                { "text": "Do nothing (save sarcasm, sacrifice language device)", "outcome": "Sarcasm continues to flourish, adding depth and humor (and occasional confusion) to human interaction. Language barriers remain, making international relations a perpetual game of charades." }
            ]
        },
        {
            "description": "A trolley is headed towards 5 people who are about to invent self-tying shoelaces. You can pull a lever to divert it, but it will instead destroy all instances of the number '7'.",
            "imageUrl": "https://placehold.co/650x180/A78BFA/FFFFFF?text=5+SHOELACE+INVENTORS+%7C+Number+7",
            "choices": [
                { "text": "Divert (save self-tying shoelaces, destroy the number 7)", "outcome": "Shoelaces are now effortlessly managed. The number 7 ceases to exist, causing mathematical chaos, calendrical confusion (July?), and the utter collapse of blackjack. Life becomes very inconvenient." },
                { "text": "Do nothing (save the number 7, sacrifice self-tying shoelaces)", "outcome": "The number 7 remains a fundamental part of existence. Shoelaces continue to be a minor daily inconvenience, occasionally tripping people, but the fabric of numerical reality is preserved." }
            ]
        },
        {
            "description": "A trolley is speeding towards 5 innocent, fluffy bunnies. You can divert it onto another track where it will destroy the only copy of every single pop song that peaked at number 2 on the charts.",
            "imageUrl": "https://placehold.co/650x180/FDE68A/333333?text=5+FLUFFY+BUNNIES+%7C+Number+2+Hits",
            "choices": [
                { "text": "Divert (save bunnies, destroy number 2 songs)", "outcome": "The bunnies are safe. A vast collection of nearly-great pop songs vanishes, leaving a void in music history, but sparing humanity from countless 'almost' hits." },
                { "text": "Do nothing (save number 2 songs, sacrifice bunnies)", "outcome": "The bunnies are tragically lost. A treasure trove of almost-chart-topping pop songs is preserved, allowing future generations to ponder the true meaning of 'runner-up' status." }
            ]
        },
        {
            "description": "You're on a bridge. A trolley is headed for 5 legendary meme creators. You can push a button to summon a giant, sentient toaster that will stop the trolley, but it will then immediately toast every single piece of bread on Earth, whether it needs it or not.",
            "imageUrl": "https://placehold.co/650x180/FCA5A5/333333?text=5+MEME+CREATORS+%7C+Giant+Toaster",
            "choices": [
                { "text": "Summon the toaster (save meme creators, toast all bread)", "outcome": "The meme creators live on, ensuring a fresh supply of internet humor. Global breakfast habits are revolutionized as all bread is perpetually toasted, leading to either efficiency or an abundance of charcoal." },
                { "text": "Do nothing (sacrifice meme creators, preserve untoasted bread)", "outcome": "The meme creators are gone. The world's bread supply remains in its raw, untoasted state, preserving the culinary freedom to choose. Internet humor may suffer." }
            ]
        },
        {
            "description": "A trolley is rushing towards a priceless collection of original 'dad jokes'. You can divert it to hit a server containing the cure for all forms of awkward silence.",
            "imageUrl": "https://placehold.co/650x180/6EE7B7/333333?text=DAD+JOKES+%7C+Awkward+Silence+Cure",
            "choices": [
                { "text": "Save the dad jokes (destroy awkward silence cure)", "outcome": "The world's supply of groan-inducing, endearing dad jokes is preserved. Awkward silences continue to plague social gatherings, forcing uncomfortable small talk, but at least there's always a bad pun to break the tension." },
                { "text": "Save the cure (destroy dad jokes)", "outcome": "Awkward silences vanish from human interaction, leading to perfectly fluid conversations. The dad joke is lost forever, making family gatherings slightly less cringeworthy, but also less endearing." }
            ]
        },
        {
            "description": "A trolley is speeding towards 5 people who are about to finish building a machine that can generate unlimited, non-caloric pizza. You can divert it, but it will flatten the world's only remaining stock of 'googly eyes'.",
            "imageUrl": "https://placehold.co/650x180/C4B5FD/FFFFFF?text=5+PIZZA+MAKERS+%7C+Googly+Eyes",
            "choices": [
                { "text": "Divert (save pizza machine, destroy googly eyes)", "outcome": "Unlimited, guilt-free pizza becomes a reality, solving world hunger (and diets). The whimsical art of adding googly eyes to inanimate objects is lost, making life slightly less silly." },
                { "text": "Do nothing (save googly eyes, sacrifice pizza machine)", "outcome": "Googly eyes continue to bring spontaneous joy to everyday objects. Unlimited, non-caloric pizza remains a dream, leaving humanity to battle both hunger and the eternal struggle against calories." }
            ]
        },
        {
            "description": "A trolley is approaching 5 people who are about to perfect cold fusion. You can switch tracks, but it will destroy all red traffic lights.",
            "imageUrl": "https://placehold.co/650x180/EF4444/FFFFFF?text=5+COLD+FUSION+SCIENTISTS+%7C+Red+Traffic+Lights",
            "choices": [
                { "text": "Divert (save cold fusion, destroy red lights)", "outcome": "Infinite clean energy is achieved. Traffic lights only show green and yellow, leading to permanent gridlock and road chaos. Humanity is energy rich, but perpetually stuck." },
                { "text": "Do nothing (save red lights, sacrifice cold fusion)", "outcome": "Red traffic lights continue to regulate traffic, ensuring orderly (if slow) movement. Cold fusion remains a distant dream, leaving humanity reliant on less ideal energy sources." }
            ]
        },
        {
            "description": "A trolley is headed towards 5 people who are about to discover the secret to eternal youth. You can pull a lever to divert it, but it will instead destroy all unpopped kernels in popcorn bags worldwide.",
            "imageUrl": "https://placehold.co/650x180/34D399/FFFFFF?text=5+ETERNAL+YOUTH+%7C+Unpopped+Kernels",
            "choices": [
                { "text": "Divert (save eternal youth, destroy unpopped kernels)", "outcome": "Humanity achieves eternal youth, living forever. The frustrating mystery of the 'old maid' kernel vanishes, but so does the occasional satisfying pop." },
                { "text": "Do nothing (save unpopped kernels, sacrifice eternal youth)", "outcome": "The unpopped kernel continues to be a universal source of minor disappointment. Eternal youth remains elusive, but at least the occasional unpopped kernel ensures life's small frustrations persist." }
            ]
        },
        {
            "description": "A trolley is speeding towards 5 people who are about to invent a device that allows humans to breathe underwater indefinitely. You can divert it onto another track where it will destroy every single novelty oversized foam finger.",
            "imageUrl": "https://placehold.co/650x180/93C5FD/FFFFFF?text=5+UNDERWATER+BREATHERS+%7C+Foam+Fingers",
            "choices": [
                { "text": "Divert (save underwater breathing, destroy foam fingers)", "outcome": "Humanity can now explore the deepest oceans. Sporting events and novelty shops suffer a profound aesthetic loss, but the possibilities for aquatic living are endless." },
                { "text": "Do nothing (save foam fingers, sacrifice underwater breathing)", "outcome": "Oversized foam fingers continue to bring cheer (and mild inconvenience) to sporting events. Underwater breathing remains a fantasy, keeping humanity firmly land-bound." }
            ]
        },
        {
            "description": "You're on a bridge. A trolley is headed for 5 innocent, fluffy bunnies. You can push a button to summon a highly trained, sentient librarian who will stop the trolley, but they will then immediately re-categorize every book in every library on Earth into a single, random, nonsensical order.",
            "imageUrl": "https://placehold.co/650x180/FBCFE8/333333?text=5+BUNNIES+%7C+Librarian",
            "choices": [
                { "text": "Summon the librarian (save bunnies, re-categorize books)", "outcome": "The bunnies are safe. Finding any book in any library becomes an impossible, frustrating quest, transforming research into an epic, lifelong scavenger hunt." },
                { "text": "Do nothing (sacrifice bunnies, preserve library order)", "outcome": "The bunnies are tragically lost. Libraries remain organized and functional, allowing easy access to knowledge, albeit with the cost of innocent, fluffy lives." }
            ]
        },
        {
            "description": "A trolley is rushing towards a priceless collection of rare, vintage video games. You can divert it to hit a server containing the solution to all forms of procrastination.",
            "imageUrl": "https://placehold.co/650x180/BEF264/333333?text=VINTAGE+VIDEO+GAMES+%7C+Procrastination+Cure",
            "choices": [
                { "text": "Save the video games (destroy procrastination solution)", "outcome": "The vintage video games are preserved, offering nostalgic joy. Procrastination continues to plague humanity, ensuring deadlines are always met at the last minute (or not at all)." },
                { "text": "Save the solution (destroy video games)", "outcome": "Procrastination is cured, leading to incredibly productive societies. A significant piece of gaming history is lost, but everyone is now getting things done on time." }
            ]
        },
        {
            "description": "A trolley is speeding towards 5 people who are about to discover the secret to truly painless flossing. You can divert it, but it will flatten every single rubber duck in bathtubs worldwide.",
            "imageUrl": "https://placehold.co/650x180/A5F3FC/333333?text=5+FLOSSERS+%7C+Rubber+Ducks",
            "choices": [
                { "text": "Divert (save painless flossing, destroy rubber ducks)", "outcome": "Dental hygiene becomes a joy. Bathtub toys are annihilated, leading to widespread sadness in bathtubs everywhere. The world becomes a bit less squeaky and yellow." },
                { "text": "Do nothing (save rubber ducks, sacrifice painless flossing)", "outcome": "Rubber ducks continue to float happily in bathtubs. Flossing remains a mildly painful, necessary evil, ensuring dental health but not without minor discomfort." }
            ]
        },
        {
            "description": "A trolley is approaching 5 people who are about to invent teleportation. You can switch tracks, but it will destroy all memes involving cats.",
            "imageUrl": "https://placehold.co/650x180/C084FC/FFFFFF?text=5+TELEPORTERS+%7C+Cat+Memes",
            "choices": [
                { "text": "Divert (save teleportation, destroy cat memes)", "outcome": "Teleportation is achieved, revolutionizing travel. The internet becomes a less whimsical place as countless cat-related memes vanish into the digital ether." },
                { "text": "Do nothing (save cat memes, sacrifice teleportation)", "outcome": "Cat memes continue to bring joy and laughter to billions. Teleportation remains a distant dream, meaning you'll still be stuck in traffic." }
            ]
        },
        {
            "description": "A trolley is headed towards 5 people who are about to discover the secret to making vegetables taste like chocolate. You can pull a lever to divert it, but it will instead destroy all existing copies of 'Happy Birthday' song.",
            "imageUrl": "https://placehold.co/650x180/99F6E4/333333?text=5+CHOCO-VEGGIE+MAKERS+%7C+Happy+Birthday+Song",
            "choices": [
                { "text": "Divert (save chocolate vegetables, destroy 'Happy Birthday')", "outcome": "Children rejoice as vegetables become a treat. Birthday celebrations worldwide become awkwardly silent, as the iconic song vanishes, forcing new, less catchy melodies." },
                { "text": "Do nothing (save 'Happy Birthday', sacrifice chocolate vegetables)", "outcome": "'Happy Birthday' continues to be sung at every celebration. Vegetables remain, well, vegetables, and the eternal struggle of healthy eating persists." }
            ]
        },
        {
            "description": "A trolley is speeding towards 5 people who are about to invent a perpetual motion machine. You can divert it onto another track where it will destroy every single piece of lint in every single belly button worldwide.",
            "imageUrl": "https://placehold.co/650x180/E5E7EB/333333?text=5+MOTION+INVENTORS+%7C+Belly+Button+Lint",
            "choices": [
                { "text": "Divert (save perpetual motion, destroy belly button lint)", "outcome": "Infinite energy is achieved, solving all power crises. Belly buttons are eternally lint-free, a minor but globally satisfying cleanliness improvement." },
                { "text": "Do nothing (save belly button lint, sacrifice perpetual motion)", "outcome": "Belly button lint continues to accumulate, a mysterious and universal phenomenon. Perpetual motion remains an unfulfilled dream, leaving humanity to ponder its energy future." }
            ]
        },
        {
            "description": "You're on a bridge. A trolley is headed for 5 innocent, fluffy bunnies. You can push a button to summon a highly trained, sentient barista who will stop the trolley, but they will then immediately convert all water on Earth into lukewarm decaffeinated coffee.",
            "imageUrl": "https://placehold.co/650x180/FEF9C3/333333?text=5+BUNNIES+%7C+Decaf+Barista",
            "choices": [
                { "text": "Summon the barista (save bunnies, convert all water)", "outcome": "The bunnies are safe. Humanity's primary beverage becomes lukewarm decaf, leading to widespread dehydration, a strange coffee addiction, and a global energy slump." },
                { "text": "Do nothing (sacrifice bunnies, preserve water)", "outcome": "The bunnies are tragically lost. Water remains pure and essential for life, allowing humanity to stay hydrated and healthy, unburdened by an existential coffee crisis." }
            ]
        },
        {
            "description": "A trolley is rushing towards a priceless collection of original 'knock-knock jokes'. You can divert it to hit a server containing the secret to perfectly cooking every food item.",
            "imageUrl": "https://placehold.co/650x180/D1FAEE/333333?text=KNOCK-KNOCK+JOKES+%7C+Cooking+Secret",
            "choices": [
                { "text": "Save the knock-knock jokes (destroy cooking secret)", "outcome": "The world retains its supply of classic, timeless knock-knock humor. Culinary skills remain a varied and sometimes disappointing endeavor, leading to overcooked or undercooked meals, but at least the jokes persist." },
                { "text": "Save the secret (destroy knock-knock jokes)", "outcome": "Every meal becomes perfectly cooked, leading to a culinary utopia. The knock-knock joke is lost forever, making lighthearted introductions slightly less engaging." }
            ]
        },
        {
            "description": "A trolley is speeding towards 5 people who are about to invent a device that allows you to instantly charge any electronic device wirelessly. You can divert it, but it will flatten every single perfectly rolled sushi roll worldwide.",
            "imageUrl": "https://placehold.co/650x180/A3A3A3/FFFFFF?text=5+WIRELESS+CHARGERS+%7C+Perfect+Sushi",
            "choices": [
                { "text": "Divert (save wireless charging, destroy sushi)", "outcome": "Electronic devices are perpetually powered. Sushi connoisseurs despair as their perfectly crafted rolls are annihilated, leading to a global crisis in raw fish cuisine." },
                { "text": "Do nothing (save sushi, sacrifice wireless charging)", "outcome": "Perfectly rolled sushi continues to delight palates. Wireless charging remains a futuristic dream, forcing humanity to continue searching for outlets and untangling cords." }
            ]
        },
        {
            "description": "A trolley is approaching 5 people who are about to discover the secret to truly silent chewing. You can switch tracks, but it will destroy all existing supplies of bubble wrap.",
            "imageUrl": "https://placehold.co/650x180/FCE7F3/333333?text=5+SILENT+CHEWERS+%7C+Bubble+Wrap",
            "choices": [
                { "text": "Divert (save silent chewing, destroy bubble wrap)", "outcome": "Meal times become blissfully quiet. The satisfying 'pop' of bubble wrap is lost forever, depriving many of a simple stress-relief mechanism." },
                { "text": "Do nothing (save bubble wrap, sacrifice silent chewing)", "outcome": "Bubble wrap continues to provide delightful auditory feedback. Chewing noises persist, causing minor annoyance but allowing for the simple pleasure of popping." }
            ]
        },
        {
            "description": "A trolley is headed towards 5 people who are about to invent a universal remote that controls human emotions. You can pull a lever to divert it, but it will instead destroy all existing copies of 'The Macarena' dance.",
            "imageUrl": "https://placehold.co/650x180/EAB308/333333?text=5+EMOTION+CONTROLLERS+%7C+The+Macarena",
            "choices": [
                { "text": "Divert (save emotion remote, destroy 'Macarena')", "outcome": "Human emotions can now be precisely managed, leading to a perfectly regulated society. The 'Macarena' vanishes, making weddings and parties slightly less awkward, but also less universally participative." },
                { "text": "Do nothing (save 'Macarena', sacrifice emotion remote)", "outcome": "The 'Macarena' endures, ready for spontaneous outbreaks at any celebratory gathering. Human emotions remain wild and unpredictable, leading to both joy and chaos." }
            ]
        },
        {
            "description": "A trolley is speeding towards 5 people who are about to discover the formula for turning lead into gold. You can divert it onto another track where it will destroy every single perfectly aligned book on every single bookshelf worldwide.",
            "imageUrl": "https://placehold.co/650x180/9CA3AF/FFFFFF?text=5+ALCHEMISTS+%7C+Aligned+Books",
            "choices": [
                { "text": "Divert (save gold formula, destroy aligned books)", "outcome": "Alchemy becomes real, revolutionizing economics. Book lovers everywhere suffer collective anxiety as their perfectly aligned shelves descend into chaos, but at least there's gold." },
                { "text": "Do nothing (save aligned books, sacrifice gold formula)", "outcome": "Bookshelves remain meticulously organized, bringing quiet satisfaction to many. The dream of turning lead into gold remains just that, a dream." }
            ]
        },
        {
            "description": "You're on a bridge. A trolley is headed for 5 innocent, fluffy bunnies. You can push a button to summon a giant, sentient alarm clock that will stop the trolley, but it will then immediately set all alarms on Earth to go off simultaneously at 3 AM every day.",
            "imageUrl": "https://placehold.co/650x180/FCA5A5/333333?text=5+BUNNIES+%7C+Giant+Alarm+Clock",
            "choices": [
                { "text": "Summon the alarm clock (save bunnies, set all alarms)", "outcome": "The bunnies are safe. Humanity's sleep schedule is irrevocably broken, leading to a perpetually tired, irritable population, but at least the bunnies are cute." },
                { "text": "Do nothing (sacrifice bunnies, preserve alarm freedom)", "outcome": "The bunnies are tragically lost. Alarm clocks continue to function as normal, allowing individuals to choose their own wake-up times, preserving peace and sleep." }
            ]
        },
        {
            "description": "A trolley is rushing towards a priceless collection of unique, hand-knitted sweaters. You can divert it to hit a server containing the secret to ending all forms of telemarketing calls.",
            "imageUrl": "https://placehold.co/650x180/DBEAFE/333333?text=KNITTED+SWEATERS+%7C+Telemarketing+Cure",
            "choices": [
                { "text": "Save the sweaters (destroy telemarketing solution)", "outcome": "The cozy sweaters are saved, providing warmth and style. Telemarketing calls continue to annoy humanity, interrupting dinners and quiet moments, but at least the sweaters are nice." },
                { "text": "Save the solution (destroy sweaters)", "outcome": "Telemarketing calls cease to exist, bringing peace and quiet to countless homes. A significant piece of textile art is lost, but the serenity is priceless." }
            ]
        },
        {
            "description": "A trolley is speeding towards 5 people who are about to invent a device that allows you to instantly learn any skill. You can divert it, but it will flatten every single perfectly toasted marshmallow worldwide.",
            "imageUrl": "https://placehold.co/650x180/FCD34D/333333?text=5+SKILL+LEARNERS+%7C+Toasted+Marshmallows",
            "choices": [
                { "text": "Divert (save skill learning device, destroy marshmallows)", "outcome": "Humanity gains instant mastery of any skill, becoming a race of polymaths. Camping trips and bonfires suffer as perfectly toasted marshmallows vanish, leading to a s'mores crisis." },
                { "text": "Do nothing (save marshmallows, sacrifice skill learning device)", "outcome": "Perfectly toasted marshmallows continue to bring joy to outdoor gatherings. Learning remains a slow, arduous process, but the simple pleasure of a golden-brown marshmallow endures." }
            ]
        },
        {
            "description": "A trolley is approaching 5 people who are about to discover the secret to making any laundry load perfectly folded and put away automatically. You can switch tracks, but it will destroy all existing supplies of glitter glue.",
            "imageUrl": "https://placehold.co/650x180/D8B4FE/FFFFFF?text=5+LAUNDRY+FOLDERS+%7C+Glitter+Glue",
            "choices": [
                { "text": "Divert (save automatic laundry, destroy glitter glue)", "outcome": "Laundry day becomes effortless, revolutionizing household chores. Craft projects everywhere become significantly less sparkly and messy, leading to a more orderly, but less fun, creative world." },
                { "text": "Do nothing (save glitter glue, sacrifice automatic laundry)", "outcome": "Glitter glue continues to add sparkle and mess to art projects. Laundry remains a never-ending, unfolded pile, but at least art is shiny." }
            ]
        },
        {
            "description": "A trolley is headed towards 5 people who are about to invent a device that allows you to travel through time. You can pull a lever to divert it, but it will instead destroy all existing copies of 'Baby Shark'.",
            "imageUrl": "https://placehold.co/650x180/67E8F9/333333?text=5+TIME+TRAVELERS+%7C+Baby+Shark",
            "choices": [
                { "text": "Divert (save time travel, destroy 'Baby Shark')", "outcome": "Time travel becomes possible, opening up endless historical possibilities. Parents worldwide rejoice as the repetitive song vanishes, but a generation of toddlers is left without their anthem." },
                { "text": "Do nothing (save 'Baby Shark', sacrifice time travel)", "outcome": "'Baby Shark' continues to play on repeat, driving adults to the brink of insanity. Time travel remains a fantasy, but at least children are entertained (and adults are suffering)." }
            ]
        },
        {
            "description": "A trolley is speeding towards 5 people who are about to invent truly comfortable socks. You can divert it onto another track where it will destroy every single perfectly ripe avocado in the world.",
            "imageUrl": "https://placehold.co/650x180/D9F99D/333333?text=5+SOCK+MAKERS+%7C+Ripe+Avocados",
            "choices": [
                { "text": "Divert (save comfortable socks, destroy ripe avocados)", "outcome": "Feet everywhere rejoice as comfortable socks become a reality. Brunch menus globally are decimated, and the window for perfect avocado consumption vanishes entirely." },
                { "text": "Do nothing (save ripe avocados, sacrifice comfortable socks)", "outcome": "Perfectly ripe avocados continue to be enjoyed, briefly. Socks remain a constant source of discomfort, but at least toast is delicious (for a fleeting moment)." }
            ]
        },
        {
            "description": "You're on a bridge. A trolley is headed for 5 innocent, fluffy bunnies. You can push a button to summon a giant, sentient garden gnome that will stop the trolley, but it will then immediately convert all grass on Earth into astro turf.",
            "imageUrl": "https://placehold.co/650x180/A3E635/333333?text=5+BUNNIES+%7C+Garden+Gnome",
            "choices": [
                { "text": "Summon the gnome (save bunnies, convert all grass)", "outcome": "The bunnies are safe. The world becomes a vast, green, but entirely artificial landscape. Lawnmowers become obsolete, but nature's wild beauty is replaced by plastic uniformity." },
                { "text": "Do nothing (sacrifice bunnies, preserve natural grass)", "outcome": "The bunnies are tragically lost. Natural grass continues to grow, requiring maintenance but providing natural ecosystems and the sweet scent of freshly cut lawns." }
            ]
        },
        {
            "description": "A trolley is rushing towards a priceless collection of rare, vintage comic books. You can divert it to hit a server containing the secret to perfectly charging your phone battery without degradation.",
            "imageUrl": "https://placehold.co/650x180/FCA5A5/333333?text=VINTAGE+COMIC+BOOKS+%7C+Battery+Secret",
            "choices": [
                { "text": "Save the comic books (destroy battery secret)", "outcome": "The rare comic books are preserved, bringing joy to collectors. Phone batteries continue to degrade over time, forcing periodic replacements, but at least the comics are safe." },
                { "text": "Save the secret (destroy comic books)", "outcome": "Phone batteries now last forever without degradation. A significant piece of gaming history is lost, but endless phone usage without worry is achieved." }
            ]
        },
        {
            "description": "A trolley is speeding towards 5 people who are about to invent a device that allows you to instantly know the answer to any question. You can divert it, but it will flatten every single perfectly inflated party balloon worldwide.",
            "imageUrl": "https://placehold.co/650x180/FFEDD5/333333?text=5+QUESTION+ANSWERERS+%7C+Party+Balloons",
            "choices": [
                { "text": "Divert (save answer device, destroy party balloons)", "outcome": "All questions are instantly answered, leading to a world of perfect knowledge. Parties become significantly less festive as balloons vanish, but ignorance is no more." },
                { "text": "Do nothing (save party balloons, sacrifice answer device)", "outcome": "Party balloons continue to float and delight at celebrations. Questions remain, prompting research and curiosity, but at least the parties are fun." }
            ]
        },
        {
            "description": "A trolley is approaching 5 people who are about to discover the secret to truly clean public restrooms. You can switch tracks, but it will destroy all existing supplies of confetti.",
            "imageUrl": "https://placehold.co/650x180/D1E2FF/333333?text=5+RESTROOM+CLEANERS+%7C+Confetti",
            "choices": [
                { "text": "Divert (save clean restrooms, destroy confetti)", "outcome": "Public restrooms become spotless sanctuaries. Celebrations become significantly less sparkly and messy, as the joy of throwing confetti is lost forever." },
                { "text": "Do nothing (save confetti, sacrifice clean restrooms)", "outcome": "Confetti continues to rain down at joyous occasions. Public restrooms remain a gamble of cleanliness, but at least there's always a shower of colorful paper." }
            ]
        },
        {
            "description": "A trolley is headed towards 5 people who are about to invent a universal truth serum. You can pull a lever to divert it, but it will instead destroy all existing copies of 'The Cha-Cha Slide' dance instructions.",
            "imageUrl": "https://placehold.co/650x180/FCD34D/333333?text=5+TRUTH+SERUM+MAKERS+%7C+Cha-Cha+Slide+Instructions",
            "choices": [
                { "text": "Divert (save truth serum, destroy 'Cha-Cha Slide' instructions)", "outcome": "Truth becomes universally accessible, revolutionizing honesty. Dance floors everywhere become confused messes as the 'Cha-Cha Slide' instructions vanish, but deceit is no more." },
                { "text": "Do nothing (save 'Cha-Cha Slide' instructions, sacrifice truth serum)", "outcome": "The 'Cha-Cha Slide' continues to guide dancers. Truth remains subjective and sometimes elusive, but at least people can still 'slide to the left'." }
            ]
        },
        {
            "description": "A trolley is speeding towards 5 people who are about to invent truly comfortable airplane seats. You can divert it onto another track where it will destroy every single perfectly aligned brick in every single brick wall worldwide.",
            "imageUrl": "https://placehold.co/650x180/D6D32A/333333?text=5+AIRPLANE+SEAT+INVENTORS+%7C+Aligned+Bricks",
            "choices": [
                { "text": "Divert (save comfortable airplane seats, destroy aligned bricks)", "outcome": "Air travel becomes a comfortable experience. Architectural integrity suffers globally as perfectly aligned bricks are thrown into chaos, leading to a world of slightly askew structures." },
                { "text": "Do nothing (save aligned bricks, sacrifice comfortable airplane seats)", "outcome": "Brick walls remain meticulously constructed, pleasing to the eye. Airplane travel continues to be an uncomfortable ordeal, but at least the buildings are straight." }
            ]
        },
        {
            "description": "You're on a bridge. A trolley is headed for 5 innocent, fluffy bunnies. You can push a button to summon a giant, sentient rubber chicken that will stop the trolley, but it will then immediately replace all sound on Earth with its own squeaking noise.",
            "imageUrl": "https://placehold.co/650x180/FDE047/333333?text=5+BUNNIES+%7C+Rubber+Chicken",
            "choices": [
                { "text": "Summon the chicken (save bunnies, replace all sound)", "outcome": "The bunnies are safe. All spoken words, music, and natural sounds are replaced by a pervasive, high-pitched squeaking, leading to mass communication breakdown and a very annoying existence." },
                { "text": "Do nothing (sacrifice bunnies, preserve diverse sounds)", "outcome": "The bunnies are tragically lost. The world's symphony of diverse sounds remains, allowing for communication, music, and the natural auditory experience, unburdened by incessant squeaking." }
            ]
        },
        {
            "description": "A trolley is rushing towards a priceless collection of antique typewriters. You can divert it to hit a server containing the secret to perfectly ripening any fruit instantly.",
            "imageUrl": "https://placehold.co/650x180/9CA3AF/FFFFFF?text=ANTIQUE+TYPEWRITERS+%7C+Fruit+Ripening+Secret",
            "choices": [
                { "text": "Save the typewriters (destroy fruit ripening secret)", "outcome": "The antique typewriters are preserved, offering a glimpse into the past of writing. Fruits continue to ripen at their own pace, often frustratingly slow or too fast, but at least the typewriters are safe." },
                { "text": "Save the secret (destroy typewriters)", "outcome": "Fruits can now be perfectly ripened on demand, revolutionizing agriculture and personal snacking. A significant piece of literary history is lost, but bland fruit is no more." }
            ]
        },
        {
            "description": "A trolley is speeding towards 5 people who are about to invent a device that allows you to instantly clean any dirty object. You can divert it, but it will flatten every single perfectly poured pint of beer worldwide.",
            "imageUrl": "https://placehold.co/650x180/84CC16/333333?text=5+CLEANING+INVENTORS+%7C+Perfect+Pints+of+Beer",
            "choices": [
                { "text": "Divert (save cleaning device, destroy beer pints)", "outcome": "Cleanliness becomes effortless, transforming homes and cities. Beer enthusiasts worldwide despair as their perfectly poured pints are annihilated, leading to a global crisis in brewing and pub culture." },
                { "text": "Do nothing (save beer pints, sacrifice cleaning device)", "outcome": "Perfectly poured pints continue to be enjoyed. Cleaning remains a chore, but at least the beer is perfect." }
            ]
        },
        {
            "description": "A trolley is approaching 5 people who are about to discover the secret to truly comfortable jeans. You can switch tracks, but it will destroy all existing supplies of party poppers.",
            "imageUrl": "https://placehold.co/650x180/FDBA74/333333?text=5+JEANS+INVENTORS+%7C+Party+Poppers",
            "choices": [
                { "text": "Divert (save comfortable jeans, destroy party poppers)", "outcome": "Legs everywhere rejoice as comfortable jeans become a reality. Celebrations become slightly less surprising and loud as the satisfying 'pop' of party poppers is lost forever." },
                { "text": "Do nothing (save party poppers, sacrifice comfortable jeans)", "outcome": "Party poppers continue to add a festive bang to celebrations. Jeans remain a constant source of discomfort, but at least the parties are fun." }
            ]
        },
        {
            "description": "A trolley is headed towards 5 people who are about to invent a universal cure for boredom. You can pull a lever to divert it, but it will instead destroy all existing copies of 'The Chicken Dance'.",
            "imageUrl": "https://placehold.co/650x180/D946EF/FFFFFF?text=5+BOREDOM+CURERS+%7C+The+Chicken+Dance",
            "choices": [
                { "text": "Divert (save boredom cure, destroy 'Chicken Dance')", "outcome": "Boredom is eradicated, leading to a perpetually engaged society. Weddings and Oktoberfests become slightly less awkward and universally participative as 'The Chicken Dance' vanishes." },
                { "text": "Do nothing (save 'Chicken Dance', sacrifice boredom cure)", "outcome": "'The Chicken Dance' endures, ready for spontaneous outbreaks at any gathering. Boredom remains a part of life, but at least there's a silly dance to break the monotony." }
            ]
        },
        {
            "description": "A trolley is speeding towards 5 people who are about to invent truly painless paper cuts. You can divert it onto another track where it will destroy every single perfectly stacked deck of playing cards worldwide.",
            "imageUrl": "https://placehold.co/650x180/4B5563/FFFFFF?text=5+PAPER+CUT+CURERS+%7C+Card+Decks",
            "choices": [
                { "text": "Divert (save painless paper cuts, destroy card decks)", "outcome": "Paper cuts are no longer agonizing. Card games become impossible as perfectly stacked decks are annihilated, leading to a global crisis in casual entertainment." },
                { "text": "Do nothing (save card decks, sacrifice painless paper cuts)", "outcome": "Perfectly stacked decks continue to facilitate card games. Paper cuts remain a minor but sharp agony, but at least the cards are in order." }
            ]
        },
        {
            "description": "You're on a bridge. A trolley is headed for 5 innocent, fluffy bunnies. You can push a button to summon a giant, sentient inflatable tube man that will stop the trolley, but it will then immediately replace all art on Earth with inflatable tube men.",
            "imageUrl": "https://placehold.co/650x180/A7F3D0/333333?text=5+BUNNIES+%7C+Inflatable+Tube+Man",
            "choices": [
                { "text": "Summon the tube man (save bunnies, replace all art)", "outcome": "The bunnies are safe. Art galleries become filled with perpetually dancing, air-filled figures, leading to a bizarre new era of kinetic, absurd art, but a profound loss of traditional aesthetics." },
                { "text": "Do nothing (sacrifice bunnies, preserve diverse art)", "outcome": "The bunnies are tragically lost. The world's diverse artistic heritage remains, offering beauty, reflection, and intellectual challenge, unburdened by inflatable absurdity." }
            ]
        },
        {
            "description": "A trolley is rushing towards a priceless collection of rare, vintage comic books. You can divert it to hit a server containing the secret to perfectly predicting the weather with 100% accuracy.",
            "imageUrl": "https://placehold.co/650x180/93C5FD/FFFFFF?text=VINTAGE+COMIC+BOOKS+%7C+Weather+Secret",
            "choices": [
                { "text": "Save the comic books (destroy weather secret)", "outcome": "The rare comic books are preserved, bringing joy to collectors. Weather forecasts remain somewhat unreliable, leading to occasional surprise downpours and unexpected sunny days, but at least the comics are safe." },
                { "text": "Save the secret (destroy comic books)", "outcome": "Weather can now be perfectly predicted, revolutionizing agriculture, travel, and daily planning. A significant piece of pop culture history is lost, but rainy days are no longer a surprise." }
            ]
        },
        {
            "description": "A trolley is speeding towards 5 people who are about to invent a device that allows you to instantly learn any language. You can divert it, but it will flatten every single perfectly round donut worldwide.",
            "imageUrl": "https://placehold.co/650x180/FDD835/333333?text=5+LANGUAGE+LEARNERS+%7C+Perfect+Donuts",
            "choices": [
                { "text": "Divert (save language device, destroy donuts)", "outcome": "Language barriers vanish, leading to global communication. Donut enthusiasts worldwide despair as their perfectly round treats are annihilated, leading to a crisis in breakfast pastries." },
                { "text": "Do nothing (save donuts, sacrifice language device)", "outcome": "Perfectly round donuts continue to delight. Learning new languages remains a challenging endeavor, but at least breakfast is sweet and circular." }
            ]
        },
        {
            "description": "A trolley is approaching 5 people who are about to discover the secret to truly delicious healthy food. You can switch tracks, but it will destroy all existing supplies of glittery nail polish.",
            "imageUrl": "https://placehold.co/650x180/C026D3/FFFFFF?text=5+HEALTHY+FOOD+INVENTORS+%7C+Glittery+Nail+Polish",
            "choices": [
                { "text": "Divert (save delicious healthy food, destroy glitter nail polish)", "outcome": "Eating healthy becomes a culinary delight, leading to widespread well-being. Manicures become significantly less sparkly, leading to a crisis in festive hand adornment." },
                { "text": "Do nothing (save glitter nail polish, sacrifice delicious healthy food)", "outcome": "Glittery nail polish continues to add sparkle to fingers and toes. Healthy food remains palatable but rarely exciting, but at least the nails are pretty." }
            ]
        },
        {
            "description": "A trolley is headed towards 5 people who are about to invent a universal remote that controls time itself. You can pull a lever to divert it, but it will instead destroy all existing copies of 'The Hokey Pokey' dance.",
            "imageUrl": "https://placehold.co/650x180/6EE7B7/333333?text=5+TIME+CONTROLLERS+%7C+The+Hokey+Pokey",
            "choices": [
                { "text": "Divert (save time remote, destroy 'Hokey Pokey')", "outcome": "Time itself can now be manipulated, leading to unimaginable possibilities. Children's parties and nostalgic adults alike lament the loss of 'The Hokey Pokey', but control over time seems a fair trade." },
                { "text": "Do nothing (save 'Hokey Pokey', sacrifice time remote)", "outcome": "'The Hokey Pokey' endures, ready for spontaneous outbreaks at any gathering. Time remains an unyielding force, but at least everyone can still 'put their right foot in'." }
            ]
        },
        {
            "description": "A trolley is speeding towards 5 people who are about to invent truly silent Velcro. You can divert it onto another track where it will destroy every single perfectly aligned traffic cone worldwide.",
            "imageUrl": "https://placehold.co/650x180/94A3B8/FFFFFF?text=5+SILENT+VELCRO+INVENTORS+%7C+Traffic+Cones",
            "choices": [
                { "text": "Divert (save silent Velcro, destroy traffic cones)", "outcome": "Velcro becomes a discreet fastening solution. Roadworks and construction sites become chaotic free-for-alls as perfectly aligned traffic cones vanish, leading to widespread disorder." },
                { "text": "Do nothing (save traffic cones, sacrifice silent Velcro)", "outcome": "Traffic cones remain perfectly aligned, guiding vehicles and pedestrians. Velcro continues its loud, ripping existence, but at least road safety is preserved." }
            ]
        },
        {
            "description": "You're on a bridge. A trolley is headed for 5 innocent, fluffy bunnies. You can push a button to summon a giant, sentient inflatable hot dog that will stop the trolley, but it will then immediately replace all animals on Earth with inflatable hot dogs.",
            "imageUrl": "https://placehold.co/650x180/FCD34D/333333?text=5+BUNNIES+%7C+Inflatable+Hot+Dog",
            "choices": [
                { "text": "Summon the hot dog (save bunnies, replace all animals)", "outcome": "The bunnies are safe. The natural world is transformed into a bizarre landscape of floating, air-filled hot dogs, leading to ecological collapse and a profound existential crisis for humanity, but at least the bunnies are safe." },
                { "text": "Do nothing (sacrifice bunnies, preserve diverse animals)", "outcome": "The bunnies are tragically lost. The world's diverse animal kingdom remains, offering natural beauty, biodiversity, and the occasional tasty snack (for other animals), unburdened by inflatable replacements." }
            ]
        }
    ];

    /**
     * Renders the scene with the problem-specific image and resets trolley position.
     * @param {string} imageUrl - The URL of the image to display for the current scene.
     */
    function renderScene(imageUrl) {
        // Reset trolley position for the new problem
        trolley.style.transition = 'none'; // Temporarily disable transition for instant reset
        trolley.style.transform = 'translateX(0) translateY(0)'; // Reset position
        trolley.offsetHeight; // Trigger reflow to apply style immediately before re-enabling transition

        // Set the image source
        sceneImage.src = imageUrl;
        sceneImage.alt = "Trolley Problem Scene Visual"; // More descriptive alt text
        sceneImage.onerror = () => { // Fallback in case image fails to load
            sceneImage.src = "https://placehold.co/650x180/CCCCCC/666666?text=Image+Not+Available";
            sceneImage.alt = "Fallback image: Scene not loaded";
        };

        // Ensure tracks are visible and positioned correctly for the scene
        mainTrack.style.display = 'block';
        divertedTrack.style.display = 'block';

        // Re-enable transition after reset
        trolley.style.transition = 'transform 3s linear';
    }

    /**
     * Loads and displays a trolley problem based on the currentProblemIndex.
     * Renders the visual scene for the problem.
     * @param {number} index - The index of the problem to load from the 'problems' array.
     */
    function loadProblem(index) {
        // Check if all problems have been played
        if (index >= problems.length) {
            // Display a game over message and clear interactive elements
            problemDisplay.innerHTML = "<h2>You've faced all the absurdities!</h2><p>Thanks for playing! You've reached the end of the line.</p>";
            choiceButtonsDiv.innerHTML = ""; // Clear choice buttons
            outcomeDisplay.classList.add('hidden'); // Ensure outcome is hidden
            nextProblemButton.classList.add('hidden'); // Hide next button

            // Set a static "Game Over" image
            sceneImage.src = "https://placehold.co/650x180/444444/FFFFFF?text=GAME+OVER%0AThanks+for+playing!";
            sceneImage.alt = "Game Over Scene";
            trolley.style.display = 'none'; // Hide trolley at game end
            mainTrack.style.display = 'none'; // Hide tracks at game end
            divertedTrack.style.display = 'none'; // Hide tracks at game end
            return; // Exit the function
        }

        const problem = problems[index]; // Get the current problem object
        problemDisplay.innerHTML = `<p>${problem.description}</p>`; // Set problem description
        choiceButtonsDiv.innerHTML = ''; // Clear any previously displayed choices
        outcomeDisplay.classList.add('hidden'); // Hide the outcome section for the new problem

        // Render the scene specific to this problem using its image URL
        renderScene(problem.imageUrl);

        // Create buttons for each choice and attach event listeners
        problem.choices.forEach((choice, choiceIndex) => {
            const button = document.createElement('button');
            button.textContent = choice.text; // Set button text
            // Attach a click listener to handle the user's choice
            button.addEventListener('click', () => handleChoice(choiceIndex));
            choiceButtonsDiv.appendChild(button); // Add button to the choices container
        });

        // Ensure choices are visible after problem loads
        choiceButtonsDiv.classList.remove('hidden');
    }

    /**
     * Handles the user's choice for the current problem.
     * Triggers trolley animation and then displays the outcome.
     * @param {number} choiceIndex - The index of the chosen option (0 for divert, 1 for do nothing).
     */
    function handleChoice(choiceIndex) {
        const problem = problems[currentProblemIndex];
        const chosenOutcome = problem.choices[choiceIndex].outcome;

        // Hide choice buttons immediately
        choiceButtonsDiv.classList.add('hidden');

        // Animate trolley
        // Ensure trolley starts at the very left edge of the scene and on the correct track.
        trolley.style.left = '0';
        // The trolley's 'top' changes based on whether it's on the main (bottom) or diverted (top) track.
        // mainTrack.style.bottom: 30% -> trolley.style.top = 70% - half_trolley_height (20px) = 50%
        // divertedTrack.style.top: 30% -> trolley.style.top = 30% - half_trolley_height (20px) = 10%
        // We'll calculate the 'top' based on the choice.

        if (choiceIndex === 0) { // Divert (trolley goes to the top track)
            // Move to the diverted track's vertical position
            trolley.style.transform = 'translateX(calc(100% - 80px)) translateY(-40%)'; // Move right and up to diverted track. Adjust translateY for new track
        } else { // Do nothing (trolley stays on main track)
            // Stay on the main track's vertical position
            trolley.style.transform = 'translateX(calc(100% - 80px)) translateY(0)'; // Move right on main track
        }

        // Display outcome after trolley animation completes
        // The 3500ms delay matches the 3s animation + a buffer
        setTimeout(() => {
            outcomeText.textContent = chosenOutcome; // Display the outcome text
            outcomeDisplay.classList.remove('hidden'); // Show the outcome section
        }, 3500);
    }

    /**
     * Initiates the game, hides the start button, and loads the first problem.
     */
    function startGame() {
        startButton.classList.add('hidden'); // Hide the start button
        gameContainer.classList.remove('dimmed'); // Remove the dimming overlay
        trolley.style.display = 'block'; // Ensure trolley is visible when game starts
        loadProblem(currentProblemIndex); // Load the first problem
    }

    // Event listener for the "Next Problem" button
    nextProblemButton.addEventListener('click', () => {
        currentProblemIndex++; // Increment to the next problem
        loadProblem(currentProblemIndex); // Load the next problem
    });

    // Event listener for the "Start Game" button
    startButton.addEventListener('click', startGame);

    // Initial setup: Dim the game container and show only the start button
    gameContainer.classList.add('dimmed');
    // Initial scene rendering for the "start screen" with a prompt image
    sceneImage.src = "https://placehold.co/650x180/4F46E5/FFFFFF?text=Click+START+to+begin+your+dilemmas!";
    sceneImage.alt = "Waiting for game start visual prompt";
    trolley.style.display = 'none'; // Hide trolley on start screen
    mainTrack.style.display = 'none'; // Hide tracks on start screen
    divertedTrack.style.display = 'none'; // Hide tracks on start screen
});
