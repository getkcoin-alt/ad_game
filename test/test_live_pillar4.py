#!/usr/bin/env python3
"""
Live Production Verification for Pillar 4 on https://rangoli-jewel-utsav.vercel.app
"""

import os
import time
from playwright.sync_api import sync_playwright

ARTIFACTS_DIR = "/Users/karnveersingh/.gemini/antigravity/brain/e3e89bad-b1f0-4ad2-9b32-4096d84a6d32"
LIVE_URL = "https://rangoli-jewel-utsav.vercel.app"
CHROME_PATH = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"

def main():
    print(f"Connecting to live production URL: {LIVE_URL}...")
    with sync_playwright() as p:
        browser = p.chromium.launch(
            executable_path=CHROME_PATH,
            headless=True,
            args=['--no-sandbox', '--disable-setuid-sandbox']
        )
        context = browser.new_context(viewport={'width': 420, 'height': 840})
        page = context.new_page()

        page.goto(LIVE_URL)
        page.wait_for_selector("#play-main-cta-btn")

        # Mock navigator.vibrate
        page.evaluate("""() => {
            window.liveVibrateLog = [];
            navigator.vibrate = function(pattern) {
                window.liveVibrateLog.push(pattern);
                return true;
            };
        }""")

        # 1. Start Level 1
        page.click("#play-main-cta-btn")
        time.sleep(0.5)

        # 2. Verify Audio Filter on Live Production
        print("Testing Master Low-Pass Audio Filter on Live Production...")
        page.click("#pause-btn")
        time.sleep(0.4)
        is_paused = page.evaluate("() => window.AudioEngine.isFilterPaused")
        target_freq = page.evaluate("() => window.AudioEngine.targetFilterFreq")
        print(f"Live Paused: isFilterPaused={is_paused}, targetFilterFreq={target_freq}Hz")
        assert is_paused == True
        assert target_freq == 420

        page.click("#resume-btn")
        time.sleep(0.4)
        is_paused_after = page.evaluate("() => window.AudioEngine.isFilterPaused")
        target_freq_after = page.evaluate("() => window.AudioEngine.targetFilterFreq")
        print(f"Live Resumed: isFilterPaused={is_paused_after}, targetFilterFreq={target_freq_after}Hz")
        assert is_paused_after == False
        assert target_freq_after == 22000

        # 3. Verify Live Shockwaves, Confetti & Accolades
        print("Spawning Live Shockwaves and Confetti on Live Production...")
        page.evaluate("""() => {
            const r = window.game.renderer;
            r.spawnShockwave(r.width / 2, r.height / 2, '#FFD700', 120);
            r.spawnShockwave(r.width / 2, r.height / 2 + 20, '#FF4500', 100);
            r.spawnConfettiRain(70);
            r.spawnFloatingText(r.width / 2, r.boardY + 50, "अद्भुत! (Adbhut!)", '#FFD700', 28);
        }""")
        time.sleep(0.3)

        shockwaves = page.evaluate("() => window.game.renderer.shockwaves.length")
        confetti = page.evaluate("() => window.game.renderer.particles.filter(p => p.type === 'confetti').length")
        print(f"Live Effects: shockwaves={shockwaves}, confetti={confetti}")
        assert shockwaves >= 1
        assert confetti >= 40

        # 4. Verify Live Haptic Engine
        print("Testing Live Haptic Engine...")
        page.evaluate("""() => {
            window.HapticEngine.matchPulse();
            window.HapticEngine.explosion();
        }""")
        vibrate_log = page.evaluate("() => window.liveVibrateLog")
        print(f"Live Vibrate Log: {vibrate_log}")
        assert len(vibrate_log) >= 2

        # 5. Capture Live Production Screenshot
        live_shot = os.path.join(ARTIFACTS_DIR, "live_production_pillar4_verified.png")
        page.screenshot(path=live_shot)
        print(f"Saved live production screenshot to {live_shot}")

        browser.close()
        print("\n=======================================================")
        print("LIVE PRODUCTION PILLAR 4 FULLY VERIFIED (100% SUCCESS)!")
        print("=======================================================")

if __name__ == '__main__':
    main()
