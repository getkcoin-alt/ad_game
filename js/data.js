/**
 * Game Data, Configuration, Localization & Level Definitions
 * Cultural aesthetics inspired by Indian artisan jewellery, Rangoli, and Haveli architecture.
 */

const GEM_TYPES = [
    {
        id: 0,
        name: "Gulal Ruby",
        nameHi: "गुलाल माणिक",
        color: "#E6196E",       // Deep Rani Pink / Magenta
        secondaryColor: "#FF69B4",
        highlightColor: "#FFD1E6",
        symbol: "petal",        // Royal Lotus Petal
        glow: "rgba(230, 25, 110, 0.45)"
    },
    {
        id: 1,
        name: "Haldi Topaz",
        nameHi: "हल्दी पुखराज",
        color: "#F5A623",       // Marigold Saffron / Gold
        secondaryColor: "#FFD000",
        highlightColor: "#FFF8D1",
        symbol: "sun",          // Golden Sunburst
        glow: "rgba(245, 166, 35, 0.45)"
    },
    {
        id: 2,
        name: "Mayur Sapphire",
        nameHi: "मयूर नीलम",
        color: "#00A8B5",       // Royal Turquoise Peacock
        secondaryColor: "#0288D1",
        highlightColor: "#B2EBF2",
        symbol: "feather",      // Peacock Feather Motif
        glow: "rgba(0, 168, 181, 0.45)"
    },
    {
        id: 3,
        name: "Panna Emerald",
        nameHi: "पन्ना मरकत",
        color: "#10B981",       // Lush Emerald Green
        secondaryColor: "#059669",
        highlightColor: "#D1FAE5",
        symbol: "leaf",         // Sacred Betel / Mango Leaf
        glow: "rgba(16, 185, 129, 0.45)"
    },
    {
        id: 4,
        name: "Neelam Amethyst",
        nameHi: "नीलमणि जामुनी",
        color: "#8B5CF6",       // Royal Velvet Purple
        secondaryColor: "#7C3AED",
        highlightColor: "#EDE9FE",
        symbol: "paisley",      // Kalka / Paisley motif
        glow: "rgba(139, 92, 246, 0.45)"
    },
    {
        id: 5,
        name: "Motiram Pearl",
        nameHi: "मोती रत्न",
        color: "#F8FAFC",       // Shimmering Pearl
        secondaryColor: "#E2E8F0",
        highlightColor: "#FFFFFF",
        symbol: "circle",       // Concentric Pearl
        glow: "rgba(255, 255, 255, 0.6)"
    }
];

const SPECIAL_TYPES = {
    NORMAL: 0,
    CHAKRA_ROW: 1,      // Line of 4 (Horizontal)
    CHAKRA_COL: 2,      // Line of 4 (Vertical)
    ANAR_BOMB: 3,       // T or L match (3x3 festive sparkler blast)
    MAYUR_RAINBOW: 4    // Line of 5 (Peacock feather rainbow gem)
};

const OBSTACLE_TYPES = {
    NONE: 0,
    DIYA_UNLIT: 1,      // Unlit earthen Diya (lights up on adjacent match)
    DIYA_LIT: 2,        // Lit Diya with glowing flame
    MARIGOLD_1: 3,      // Single Marigold bloom (needs 1 adjacent match)
    MARIGOLD_2: 4       // Dense Marigold garland (needs 2 adjacent matches)
};

// Handcrafted Levels with distinct win objectives and emotional rhythm
const LEVEL_CONFIGS = [
    {
        id: 1,
        title: "The Royal Courtyard",
        titleHi: "शाही आँगन की शुरुआत",
        subtitle: "Match 3 or more jewels to begin your journey!",
        subtitleHi: "शुरुआत के लिए ३ या अधिक रत्नों को मिलाएँ!",
        moves: 18,
        targetScore: 1200,
        objectiveType: "score",
        targetDiyas: 0,
        targetMarigolds: 0,
        specialChance: 0.0,
        boardSetup: null
    },
    {
        id: 2,
        title: "Festival of Lights",
        titleHi: "दीपोत्सव की तैयारी",
        subtitle: "Match near clay Diyas to light them up for Diwali!",
        subtitleHi: "दीपकों को प्रज्वलित करने के लिए उनके पास रत्न मिलाएँ!",
        moves: 20,
        targetScore: 2000,
        objectiveType: "diyas",
        targetDiyas: 8,
        targetMarigolds: 0,
        diyas: [
            { r: 2, c: 2 }, { r: 2, c: 5 },
            { r: 3, c: 3 }, { r: 3, c: 4 },
            { r: 4, c: 3 }, { r: 4, c: 4 },
            { r: 5, c: 2 }, { r: 5, c: 5 }
        ]
    },
    {
        id: 3,
        title: "Marigold Blooms",
        titleHi: "गेंदे के महकते फूल",
        subtitle: "Clear the fresh marigold blossoms for the Haveli garlands!",
        subtitleHi: "हवेली के तोरण के लिए सुंदर गेंदा फूल एकत्र करें!",
        moves: 22,
        targetScore: 2800,
        objectiveType: "marigolds",
        targetDiyas: 0,
        targetMarigolds: 12,
        marigolds: [
            { r: 1, c: 3, hp: 1 }, { r: 1, c: 4, hp: 1 },
            { r: 2, c: 2, hp: 1 }, { r: 2, c: 5, hp: 1 },
            { r: 5, c: 2, hp: 1 }, { r: 5, c: 5, hp: 1 },
            { r: 6, c: 3, hp: 1 }, { r: 6, c: 4, hp: 1 },
            { r: 3, c: 2, hp: 1 }, { r: 3, c: 5, hp: 1 },
            { r: 4, c: 2, hp: 1 }, { r: 4, c: 5, hp: 1 }
        ]
    },
    {
        id: 4,
        title: "Peacock's Chakra",
        titleHi: "मयूर चक्र का जादू",
        subtitle: "Create 4-in-a-row Chakra gems and light all 10 Diyas!",
        subtitleHi: "४ रत्नों को मिलाकर चक्र बनाएं और सभी १० दीपकों को जलाएं!",
        moves: 21,
        targetScore: 3500,
        objectiveType: "diyas",
        targetDiyas: 10,
        targetMarigolds: 0,
        diyas: [
            { r: 1, c: 1 }, { r: 1, c: 6 },
            { r: 2, c: 3 }, { r: 2, c: 4 },
            { r: 3, c: 2 }, { r: 3, c: 5 },
            { r: 5, c: 3 }, { r: 5, c: 4 },
            { r: 6, c: 1 }, { r: 6, c: 6 }
        ]
    },
    {
        id: 5,
        title: "Rang Mahal Celebration",
        titleHi: "रंग महल भव्य उत्सव",
        subtitle: "A grand festival: Light 8 Diyas AND gather 10 Marigolds!",
        subtitleHi: "भव्य उत्सव: ८ दीपक जलाएं और १० गेंदा फूल एकत्र करें!",
        moves: 24,
        targetScore: 4500,
        objectiveType: "hybrid",
        targetDiyas: 8,
        targetMarigolds: 10,
        diyas: [
            { r: 2, c: 1 }, { r: 2, c: 6 },
            { r: 3, c: 3 }, { r: 3, c: 4 },
            { r: 4, c: 3 }, { r: 4, c: 4 },
            { r: 5, c: 1 }, { r: 5, c: 6 }
        ],
        marigolds: [
            { r: 0, c: 3, hp: 2 }, { r: 0, c: 4, hp: 2 },
            { r: 7, c: 3, hp: 2 }, { r: 7, c: 4, hp: 2 },
            { r: 3, c: 0, hp: 1 }, { r: 4, c: 0, hp: 1 },
            { r: 3, c: 7, hp: 1 }, { r: 4, c: 7, hp: 1 },
            { r: 2, c: 2, hp: 1 }, { r: 5, c: 5, hp: 1 }
        ]
    },
    {
        id: 6,
        title: "The Royal Atelier",
        titleHi: "शाही आभूषण कक्ष",
        subtitle: "Heirloom jewelry challenge: Clear 14 double marigolds!",
        subtitleHi: "शाही आभूषण चुनौती: १४ दोहरे गेंदा फूलों को मुक्त करें!",
        moves: 22,
        targetScore: 5200,
        objectiveType: "marigolds",
        targetDiyas: 0,
        targetMarigolds: 14,
        marigolds: [
            { r: 1, c: 2, hp: 2 }, { r: 1, c: 5, hp: 2 },
            { r: 2, c: 1, hp: 2 }, { r: 2, c: 6, hp: 2 },
            { r: 3, c: 3, hp: 2 }, { r: 3, c: 4, hp: 2 },
            { r: 4, c: 3, hp: 2 }, { r: 4, c: 4, hp: 2 },
            { r: 5, c: 1, hp: 2 }, { r: 5, c: 6, hp: 2 },
            { r: 6, c: 2, hp: 2 }, { r: 6, c: 5, hp: 2 },
            { r: 0, c: 3, hp: 1 }, { r: 7, c: 4, hp: 1 }
        ]
    }
];

// Metagame: Haveli Courtyard Renovation Items
const COURTYARD_ITEMS = [
    {
        id: "marble_floor",
        name: "Royal Marble Inlay",
        nameHi: "शाही संगमरमर फर्श",
        desc: "Pristine white Makrana marble with delicate floral stone inlay.",
        descHi: "मकराना संगमरमर पर सुंदर नक्काशीदार पुष्प कारीगरी।",
        starsRequired: 2,
        icon: "🏛️"
    },
    {
        id: "peacock_rangoli",
        name: "Mayur Mandana Rangoli",
        nameHi: "मयूर मांडना रंगोली",
        desc: "Handcrafted colored powder rangoli with vibrant peacock feather motif.",
        descHi: "गुलाल और अबीर से बना मनमोहक मयूर मांडना।",
        starsRequired: 4,
        icon: "🦚"
    },
    {
        id: "lotus_fountain",
        name: "Carved Brass Fountain",
        nameHi: "नक्काशीदार पीतल फव्वारा",
        desc: "Soothing water fountain gently floating sacred pink lotuses.",
        descHi: "कमल के फूलों से सुसज्जित शीतल जल का फव्वारा।",
        starsRequired: 7,
        icon: "⛲"
    },
    {
        id: "marigold_toran",
        name: "Auspicious Floral Toran",
        nameHi: "शुभ गेंदा तोरण",
        desc: "Handwoven fresh marigold and mango leaf doorway garlands.",
        descHi: "प्रवेश द्वार पर सजी ताजे गेंदे और आम के पत्तों की तोरण।",
        starsRequired: 10,
        icon: "🌼"
    },
    {
        id: "royal_jhula",
        name: "Carved Silver Jhula",
        nameHi: "चांदी का नक्काशीदार झूला",
        desc: "Relaxing swing with plush velvet bolsters for peaceful afternoons.",
        descHi: "दोपहर के विश्राम के लिए मखमली गद्दों वाला सुंदर झूला।",
        starsRequired: 14,
        icon: "🪑"
    },
    {
        id: "evening_diyas",
        name: "Illuminated Deepstambha",
        nameHi: "भव्य दीपस्तंभ",
        desc: "Gleaming multi-tiered brass lamp casting golden warm shadows.",
        descHi: "सैकड़ों दीपकों से जगमगाता दिव्य और मंगलकारी दीपस्तंभ।",
        starsRequired: 18,
        icon: "🪔"
    }
];

// Pillar 3: Saheli Circles (Warm Collaborative Kitty Party Communities)
const SAHELI_CIRCLES = [
    {
        id: "gulal_queens",
        name: "Jaipur Gulal Queens",
        nameHi: "जयपुर गुलाल सहेलियाँ",
        badge: "🌸",
        tagline: "Homemakers & artisans creating festive magic together",
        taglineHi: "साथ मिलकर उत्सव और खुशियां बिखेरने वाली सहेलियाँ",
        targetStars: 60,
        rewardCoins: 200,
        rewardBoosters: { hammer: 1, anar: 1, swap: 1 },
        members: [
            { id: "s1", name: "Sunita Sharma", nameHi: "सुनीता शर्मा", avatar: "🧕", level: 14, stars: 22, needsLife: true },
            { id: "s2", name: "Pooja Verma", nameHi: "पूजा वर्मा", avatar: "👩‍💼", level: 12, stars: 18, needsLife: false },
            { id: "s3", name: "Ananya Joshi", nameHi: "अनन्या जोशी", avatar: "👩‍🎨", level: 9, stars: 15, needsLife: true },
            { id: "s4", name: "Kavita Rao", nameHi: "कविता राव", avatar: "👵", level: 16, stars: 25, needsLife: false }
        ]
    },
    {
        id: "mayur_mandana",
        name: "Royal Mayur Artisans",
        nameHi: "शाही मयूर मांडना संघ",
        badge: "🦚",
        tagline: "Masters of peacock rangoli and temple designs",
        taglineHi: "मयूर रंगोली और मंदिर कला की निपुण सहेलियाँ",
        targetStars: 75,
        rewardCoins: 250,
        rewardBoosters: { hammer: 1, anar: 2, swap: 1 },
        members: [
            { id: "m1", name: "Deepa Nair", nameHi: "दीपा नायर", avatar: "👩‍🍳", level: 15, stars: 28, needsLife: false },
            { id: "m2", name: "Meenakshi Devi", nameHi: "मीनाक्षी देवी", avatar: "👵", level: 20, stars: 36, needsLife: true },
            { id: "m3", name: "Radha Gupta", nameHi: "राधा गुप्ता", avatar: "🧕", level: 11, stars: 19, needsLife: false }
        ]
    }
];

// Complete English & Hindi Localization Dictionary
const I18N = {
    en: {
        gameTitle: "Rangoli Utsav",
        gameSubtitle: "Jewel of India",
        playNow: "Play Now",
        howToPlayTitle: "How to Play",
        moves: "Moves",
        score: "Score",
        target: "Target",
        level: "Level",
        lives: "Lives",
        coins: "Coins",
        stars: "Stars",
        boosters: "Boosters",
        pause: "Pause",
        resume: "Resume",
        retry: "Try Again",
        nextLevel: "Next Level",
        courtyard: "My Courtyard",
        shagunWheel: "Shagun Wheel",
        dailyGift: "Daily Shagun",
        spin: "Spin Wheel",
        spinFree: "Free Daily Spin",
        spinAd: "Spin Again (Short Ad)",
        close: "Close",
        congratulations: "Badhai Ho! (Victory!)",
        levelCleared: "Level Completed!",
        levelFailed: "Bas Thoda Sa Door!",
        levelFailedSub: "So close to victory! Keep your moves going:",
        watchAdMoves: "Watch Short Ad (+3 Moves)",
        useCoinsMoves: "Use 50 Coins (+3 Moves)",
        noThanks: "Try Again",
        sound: "Sound",
        music: "Music",
        lang: "हिन्दी",
        comboGreat: "Sundar! (Beautiful!)",
        comboSuper: "Shandaar! (Superb!)",
        comboAmazing: "Adbhut! (Magnificent!)",
        boosterHammer: "Gulal Hammer",
        boosterHammerDesc: "Tap any jewel or obstacle to shatter it instantly!",
        boosterAnar: "Anar Sparkler",
        boosterAnarDesc: "Detonates a 3x3 celebration blast anywhere on the board!",
        boosterSwap: "Magic Silk",
        boosterSwapDesc: "Swap any two adjacent pieces without using a move!",
        renovateCourtyard: "Beautify Haveli",
        itemUnlocked: "Unlocked!",
        needStars: "stars needed",
        completedCourtyard: "Courtyard in Full Splendor!",
        adTitle: "Supporting Indian Artisans",
        adNotice: "Thank you for supporting our game! Reward will be granted.",
        adCountdown: "Reward in",
        adClaim: "Claim +3 Extra Moves!",
        adClaimReward: "Claim Reward!",
        shringaarStreak: "Shringaar Blessing",
        streakAtRisk: "Win-Streak at risk! Save your blessing:",
        saveStreak: "Save Streak (+3 Moves)",
        saheliCircle: "Saheli Circle",
        communityChest: "Community Mandap Chest",
        askForLives: "Ask for Lives",
        shareWhatsApp: "Share on WhatsApp",
        shareCourtyard: "Share Haveli on WhatsApp",
        giftLife: "Gift Life (+10 🪙)",
        lifeGifted: "✓ Gifted (+10 🪙)",
        claimChest: "Claim Shagun Chest",
        chestClaimed: "✓ Claimed",
        members: "Sahelis",
        inviteSahelis: "Invite Sahelis to Circle",
        inboxGifts: "Shagun Gifts",
        claimGift: "Accept Life (+1 ❤️)",
        lifeRequestedToast: "Life request sent to your Sahelis!",
        giftGivenToast: "You gifted a life and received +10 Shagun Coins!",
        livesFull: "FULL",
        nextLifeIn: "Next heart in",
        fullRecoveryIn: "Full hearts in",
        refillModalTitle: "Heart Energy & Refill",
        refillModalSub: "Hearts regenerate naturally every 20 minutes.",
        refillAllCoins: "Instant Refill (100 🪙)",
        refillAdFree: "Watch Video (+1 ❤️ Free)",
        settingsTitle: "Game Settings",
        musicVol: "Music (\"Raga Tarang\")",
        sfxVol: "Sound Effects",
        haptics: "Vibration Haptics",
        artisanIdLabel: "Artisan ID",
        howToPlayBtn: "How to Play Guide",
        resetProgress: "Reset All Progress",
        resetConfirmPrompt: "Are you sure you want to reset all game progress? This will reset levels, stars, coins, and haveli decor!",
        navLevels: "Levels",
        navCourtyard: "Haveli",
        navSaheli: "Saheli",
        navShagun: "Shagun",
        navSettings: "Settings",
        settingsSaved: "Settings saved!"
    },
    hi: {
        gameTitle: "रंगोली उत्सव",
        gameSubtitle: "शाही रत्न यात्रा",
        playNow: "अभी खेलें",
        howToPlayTitle: "कैसे खेलें",
        moves: "चालें",
        score: "अंक",
        target: "लक्ष्य",
        level: "स्तर",
        lives: "प्राण",
        coins: "सिक्के",
        stars: "सितारे",
        boosters: "सहायक",
        pause: "विश्राम",
        resume: "खेल जारी रखें",
        retry: "पुनः प्रयास",
        nextLevel: "अगला स्तर",
        courtyard: "हमारा आँगन",
        shagunWheel: "शगुन चक्र",
        dailyGift: "दैनिक शगुन",
        spin: "चक्र घुमाएँ",
        spinFree: "मुफ़्त दैनिक घुमाव",
        spinAd: "पुनः घुमाएँ (छोटा संदेश)",
        close: "बंद करें",
        congratulations: "बधाई हो! (शानदार विजय!)",
        levelCleared: "स्तर सफलतापूर्वक पूर्ण!",
        levelFailed: "बस थोड़ा सा दूर!",
        levelFailedSub: "आप जीत के बेहद करीब हैं! अपनी चालें बढ़ाएं:",
        watchAdMoves: "छोटा संदेश देखें (+३ चालें)",
        useCoinsMoves: "५० सिक्कों से (+३ चालें)",
        noThanks: "पुनः खेलें",
        sound: "ध्वनि",
        music: "संगीत",
        lang: "English",
        comboGreat: "सुंदर!",
        comboSuper: "शानदार!",
        comboAmazing: "अद्भुत!",
        boosterHammer: "गुलाल हथौड़ी",
        boosterHammerDesc: "किसी भी रत्न या बाधा को तुरंत तोड़ने के लिए छुएं!",
        boosterAnar: "अनार फुलझड़ी",
        boosterAnarDesc: "बोर्ड पर कहीं भी ३x३ का उत्सव धमाका करें!",
        boosterSwap: "जादुई रेशम धागा",
        boosterSwapDesc: "बिना चाल गंवाए किन्हीं दो रत्नों की जगह बदलें!",
        renovateCourtyard: "आँगन सजाएँ",
        itemUnlocked: "सुशोभित!",
        needStars: "सितारों की आवश्यकता",
        completedCourtyard: "हवेली का भव्य आँगन पूर्ण!",
        adTitle: "भारतीय कारीगरों का समर्थन",
        adNotice: "हमारे खेल का समर्थन करने के लिए धन्यवाद! आपका उपहार तैयार है।",
        adCountdown: "उपहार मिलेगा",
        adClaim: "+३ अतिरिक्त चालें लें!",
        adClaimReward: "उपहार प्राप्त करें!",
        shringaarStreak: "श्रृंगार वरदान",
        streakAtRisk: "वरदान खतरे में है! अपना वरदान बचाएं:",
        saveStreak: "वरदान बचाएं (+३ चालें)",
        saheliCircle: "सहेली मंडल",
        communityChest: "सामुदायिक मंडप खज़ाना",
        askForLives: "सहेलियों से प्राण माँगें",
        shareWhatsApp: "व्हाट्सएप पर साझा करें",
        shareCourtyard: "हवेली व्हाट्सएप पर दिखाएं",
        giftLife: "प्राण दें (+१० 🪙)",
        lifeGifted: "✓ भेजा गया (+१० 🪙)",
        claimChest: "शगुन खज़ाना प्राप्त करें",
        chestClaimed: "✓ प्राप्त किया",
        members: "सहेलियाँ",
        inviteSahelis: "सहेलियों को आमंत्रित करें",
        inboxGifts: "शगुन उपहार",
        claimGift: "प्राण स्वीकार करें (+१ ❤️)",
        lifeRequestedToast: "सहेलियों को प्राण संदेश भेजा गया!",
        giftGivenToast: "आपने सहेली को प्राण भेजा और १० सिक्के पाए!",
        livesFull: "पूर्ण",
        nextLifeIn: "अगला प्राण",
        fullRecoveryIn: "पूर्ण प्राण",
        refillModalTitle: "प्राण ऊर्जा एवं नवीनीकरण",
        refillModalSub: "प्राण हर २० मिनट में स्वतः बनते हैं।",
        refillAllCoins: "तुरंत पूर्ण करें (१०० 🪙)",
        refillAdFree: "छोटा संदेश देखें (+१ ❤️ मुफ़्त)",
        settingsTitle: "खेल सेटिंग्स",
        musicVol: "संगीत (\"राग तरंग\")",
        sfxVol: "ध्वनि प्रभाव",
        haptics: "स्पर्श कंपन (हैप्टिक्स)",
        artisanIdLabel: "कारीगर पहचान",
        howToPlayBtn: "खेलने की विधि",
        resetProgress: "सभी प्रगति रीसेट करें",
        resetConfirmPrompt: "क्या आप वाकई सभी खेल प्रगति रीसेट करना चाहते हैं? इससे स्तर, सितारे, सिक्के और हवेली सजावट रीसेट हो जाएगी!",
        navLevels: "स्तर",
        navCourtyard: "हवेली",
        navSaheli: "सहेली",
        navShagun: "शगुन",
        navSettings: "सेटिंग्स",
        settingsSaved: "सेटिंग्स सहेजी गईं!"
    }
};

// Universal export for browser window and Node.js
const rootScope = typeof window !== 'undefined' ? window : globalThis;
rootScope.GEM_TYPES = GEM_TYPES;
rootScope.SPECIAL_TYPES = SPECIAL_TYPES;
rootScope.OBSTACLE_TYPES = OBSTACLE_TYPES;
rootScope.LEVEL_CONFIGS = LEVEL_CONFIGS;
rootScope.COURTYARD_ITEMS = COURTYARD_ITEMS;
rootScope.SAHELI_CIRCLES = SAHELI_CIRCLES;
rootScope.I18N = I18N;
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { GEM_TYPES, SPECIAL_TYPES, OBSTACLE_TYPES, LEVEL_CONFIGS, COURTYARD_ITEMS, SAHELI_CIRCLES, I18N };
}
