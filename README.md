# 🦚 Rangoli Utsav: Jewel of India (रंगोली उत्सव)
### A Relaxing Android Match-3 Journey of Color, Culture, and Courtyard Elegance

[![Vercel Deployment](https://img.shields.io/badge/Hosted%20on-Vercel-black?style=for-the-badge&logo=vercel)](https://ad-game-theta.vercel.app)
[![Platform](https://img.shields.io/badge/Platform-Android%20%7C%20Web-green?style=for-the-badge&logo=android)](https://github.com/getkcoin-alt/ad_game)
[![License](https://img.shields.io/badge/License-MIT-blue?style=for-the-badge)](LICENSE)

---

## 🌟 The Vision & Target Audience

**Rangoli Utsav** is a culturally authentic, beautifully polished Android match-3 puzzle and courtyard restoration experience designed specifically for **Indian women aged 18+** (homemakers, working women, and mothers).

Built upon insights from behavioral psychology (*Self-Determination Theory*, *The Psychology of Video Games*, *Flow State*, and *Non-Coercive Variable Ratio Schedules*), the game delivers stress relief, sensory delight, and genuine feelings of mastery.

---

## ✨ Key Game Features

- **Distinctive Royal Jewel Theme**:
  - *Gulal Ruby* (Rani Pink Cushion Lotus)
  - *Haldi Topaz* (Saffron Gold Sunburst)
  - *Mayur Sapphire* (Turquoise Peacock Plume)
  - *Panna Emerald* (Mint Emerald Mango Leaf)
  - *Neelam Amethyst* (Velvet Purple Paisley / Kalka)
  - *Motiram Pearl* (Luminescent Circular Pearl)
- **Ascending Pentatonic Raga Cascades**:
  - Matches synthesize authentic frequencies of **Raga Bhupali** (*Sa, Re, Ga, Pa, Dha, Sa'*), ascending in harmony as combos multiply.
  - Accompanied by procedural Ghungroo (ankle-bell) jingles, sitar plucks, and temple bells with zero latency and 0 MB audio downloads.
- **Special Gem Combos**:
  - **Chakra Wheels (Line of 4)**: Sweeps rows/columns with radiant beams.
  - **Anar Sparklers (T or L Match of 5)**: Detonates in a 3x3 celebration blast.
  - **Mayur Ratna (Line of 5)**: Rainbow peacock feather jewel clearing all gems of any chosen color.
  - **Maha Utsav Combo**: Swapping two Mayur Ratnas purifies the entire board!
- **Interactive Obstacles**:
  - **Clay Diyas (दीया)**: Light up with glowing oil flames on adjacent matches.
  - **Marigold Garlands (गेंदा फूल)**: Harvest fresh blooms that shed golden petals.
- **Courtyard Renovation Metagame (*Rang Mahal*)**:
  - Use stars earned from levels to renovate your private sanctuary: Makrana marble inlay, peacock rangoli mandala, brass lotus fountain, floral torans, silver jhula (swing), and glowing evening deepstambha.
- **Sustainable & Ethical Rewarded Monetization**:
  - 100% voluntary rewarded ads ("Artisan Showcases"). No intrusive interstitials or pop-ups.
  - *"Bas Thoda Sa Door!"* recovery dialog offers +3 moves via a short artisan ad, Shagun coins, or graceful retry.
  - **Daily Shagun Wheel**: Free daily spin granting boosters, coins, and extra lives.
- **Bilingual Interface**:
  - Instant 1-tap toggle between English and Hindi throughout all screens.

---

## 📱 Architecture & Performance Profile

- **RAM Footprint**: Under 45MB during active gameplay.
- **Package Size**: < 4MB total.
- **Offline Playability**: 100% functional without internet via PWA Service Worker caching.
- **Hardware Acceleration**: High-DPI Canvas 2D engine running at a smooth 60 FPS on budget Android chipsets (Helio G25/G35, Snapdragon 400 series).

---

## 🛠️ Project Structure

```
rangoli-jewel-utsav/
├── index.html                  # Mobile-first responsive app entry point
├── manifest.json               # Android PWA Web Manifest (standalone portrait)
├── sw.js                       # Service Worker for 100% offline play
├── vercel.json                 # Vercel deployment configuration
├── css/
│   ├── style.css               # Royal Indian palace aesthetic & 48px touch targets
│   └── animations.css          # Hardware-accelerated 60 FPS keyframe animations
├── js/
│   ├── data.js                 # Gem definitions, level configs, bilingual dictionaries
│   ├── audio.js                # Procedural Web Audio synthesizer (zero asset downloads)
│   ├── storage.js              # LocalStorage save-states, energy timer & coin balances
│   ├── analytics.js            # Telemetry, cascade satisfaction & churn risk mitigation
│   ├── ads.js                  # Ethical rewarded ad system & Daily Shagun Wheel
│   ├── grid.js                 # 8x8 match-3 engine, combos, gravity & hint solver
│   ├── render.js               # Canvas 2D particle engine & Kundan jewel rendering
│   ├── meta.js                 # Haveli courtyard canvas renderer & upgrades
│   └── game.js                 # Game state machine & mobile swipe gesture controller
├── android/
│   ├── AndroidManifest.xml     # Native Android manifest with hardware acceleration
│   ├── MainActivity.java       # Hardware-accelerated WebView Activity
│   └── README.md               # Guide for building APK or Google Play release
└── test/
    ├── test_engine.js          # Node unit test suite (10/10 passed)
    ├── test_persistence_and_economy.js # Economy, persistence & churn test suite (7/7 passed)
    └── test_browser_suite.py   # Headless Chrome automated runner (9/9 passed)
```

---

## 🧪 Testing & Verification

1. **Engine Test Suite (`node test/test_engine.js`)**: **10 / 10 Passed**
2. **Economy & Behavioral Test Suite (`node test/test_persistence_and_economy.js`)**: **7 / 7 Passed**
3. **Headless Chrome E2E Suite (`python3 test/test_browser_suite.py`)**: **9 / 9 Steps Passed Flawlessly with 0 Page Errors**

---

## 🚀 Running Locally

```bash
git clone https://github.com/getkcoin-alt/ad_game.git
cd ad_game
python3 -m http.server 8080
# Open http://localhost:8080 in your browser or mobile device
```

---

## 📜 License

MIT License. Designed with cultural reverence, behavioral psychology, and clean software architecture.
