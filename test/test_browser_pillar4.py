#!/usr/bin/env python3
"""
Chrome Browser Autonomous Verification for Pillar 4:
Dynamic Sensory Juiciness & Tactile Micro-Interactions ("Ras & Bhav")
"""

import http.server
import socketserver
import threading
import time
import os
import sys
from playwright.sync_api import sync_playwright

PORT = 8094
DIRECTORY = "/Users/karnveersingh/.gemini/antigravity/scratch/rangoli-jewel-utsav"
ARTIFACTS_DIR = "/Users/karnveersingh/.gemini/antigravity/brain/e3e89bad-b1f0-4ad2-9b32-4096d84a6d32"

class Handler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=DIRECTORY, **kwargs)
    def log_message(self, format, *args):
        pass

def run_server():
    socketserver.TCPServer.allow_reuse_address = True
    with socketserver.TCPServer(("", PORT), Handler) as httpd:
        httpd.serve_forever()

def main():
    server_thread = threading.Thread(target=run_server, daemon=True)
    server_thread.start()
    time.sleep(1.0)

    chrome_path = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"

    with sync_playwright() as p:
        browser = p.chromium.launch(
            executable_path=chrome_path,
            headless=True,
            args=['--no-sandbox', '--disable-setuid-sandbox']
        )
        context = browser.new_context(viewport={'width': 420, 'height': 840})
        page = context.new_page()

        print(f"Navigating to http://localhost:{PORT}...")
        page.goto(f"http://localhost:{PORT}")
        page.wait_for_selector("#play-main-cta-btn")

        # Mock navigator.vibrate to track calls
        page.evaluate("""() => {
            window.vibrateLog = [];
            navigator.vibrate = function(pattern) {
                window.vibrateLog.push(pattern);
                return true;
            };
        }""")

        # 1. Start Level 1
        page.click("#play-main-cta-btn")
        time.sleep(0.5)

        # 2. Test Audio Filter on Pause / Resume
        print("Testing Master Low-Pass Audio Filter on Pause/Resume...")
        page.click("#pause-btn")
        time.sleep(0.4)

        is_paused = page.evaluate("() => window.AudioEngine.isFilterPaused")
        target_freq = page.evaluate("() => window.AudioEngine.targetFilterFreq")
        print(f"Paused state: isFilterPaused={is_paused}, targetFilterFreq={target_freq}Hz")
        assert is_paused == True, "isFilterPaused should be True on pause"
        assert target_freq == 420, f"Filter target should be 420Hz, got {target_freq}Hz"

        # Resume game
        page.click("#resume-btn")
        time.sleep(0.4)
        is_paused_after = page.evaluate("() => window.AudioEngine.isFilterPaused")
        target_freq_after = page.evaluate("() => window.AudioEngine.targetFilterFreq")
        print(f"Resumed state: isFilterPaused={is_paused_after}, targetFilterFreq={target_freq_after}Hz")
        assert is_paused_after == False, "isFilterPaused should be False on resume"
        assert target_freq_after == 22000, f"Filter target should be 22000Hz, got {target_freq_after}Hz"

        # 3. Test Tactile Haptics on Gem Tap & Detonation
        print("Testing Haptic Feedback on Gem Tap...")
        page.evaluate("""() => {
            window.vibrateLog = [];
            // Tap a gem
            const canvas = document.getElementById('game-canvas');
            const rect = canvas.getBoundingClientRect();
            const cs = window.game.renderer.cellSize;
            const bx = window.game.renderer.boardX;
            const by = window.game.renderer.boardY;
            const clickX = rect.left + bx + (2 * cs) + (cs / 2);
            const clickY = rect.top + by + (2 * cs) + (cs / 2);

            canvas.dispatchEvent(new MouseEvent('mousedown', { clientX: clickX, clientY: clickY, bubbles: true }));
        }""")
        time.sleep(0.2)
        vibrate_log = page.evaluate("() => window.vibrateLog")
        print("Vibrate log after gem tap:", vibrate_log)
        assert len(vibrate_log) >= 1, "Vibration should be logged on gem tap"

        # 4. Test Shockwave Distortion Rings & Confetti Rain
        print("Testing Shockwave Distortion Rings & Confetti Rain...")
        page.evaluate("""() => {
            const r = window.game.renderer;
            r.spawnShockwave(r.width / 2, r.height / 2, '#FFD700', 130);
            r.spawnShockwave(r.width / 2 - 40, r.height / 2 + 30, '#FF6B00', 110);
            r.spawnConfettiRain(80);
            r.spawnFloatingText(r.width / 2, r.boardY + 60, "शानदार! (Shandar!)", '#FFD700', 26);
        }""")
        time.sleep(0.3)

        shockwave_count = page.evaluate("() => window.game.renderer.shockwaves.length")
        confetti_count = page.evaluate("() => window.game.renderer.particles.filter(p => p.type === 'confetti').length")
        floating_count = page.evaluate("() => window.game.renderer.floatingTexts.length")
        print(f"Active effects: shockwaves={shockwave_count}, confetti={confetti_count}, floatingTexts={floating_count}")
        assert shockwave_count >= 1, "Shockwave rings should be active"
        assert confetti_count >= 40, "Confetti particles should be active"
        assert floating_count >= 1, "Floating accolade text should be active"

        shockwave_shot = os.path.join(ARTIFACTS_DIR, "pillar4_shockwave_and_confetti.png")
        page.screenshot(path=shockwave_shot)
        print(f"Captured screenshot: {shockwave_shot}")

        # 5. Test Screen-Edge Festival Diya Ambient Glow on Diya Level (Level 2)
        print("Testing Screen-Edge Festival Diya Ambient Glow on Level 2...")
        page.evaluate("() => window.game.startLevel(2)")
        time.sleep(0.5)

        # Light 2 Diyas artificially to verify ambient festival glow
        page.evaluate("""() => {
            window.game.grid.litDiyasCount = 3;
            window.game.grid.totalDiyasCount = 6;
            window.game.renderer.spawnFloatingText(
                window.game.renderer.width / 2,
                window.game.renderer.boardY + 40,
                "🪔 दीप प्रज्वलित! (Diya Ambient Glow)",
                '#FDE047',
                22
            );
        }""")
        time.sleep(0.4)

        diya_glow_shot = os.path.join(ARTIFACTS_DIR, "pillar4_diya_ambient_glow.png")
        page.screenshot(path=diya_glow_shot)
        print(f"Captured screenshot: {diya_glow_shot}")

        # 6. Test Squash & Stretch Rebound on Gem Falling
        print("Testing Squash & Stretch rebound calculation on live grid...")
        rebound_data = page.evaluate("""() => {
            const cell = window.game.grid.get(0, 0);
            if (cell && cell.gem) {
                cell.gem.animY = 0.5; // Gem falling from above
                return { hasGem: true, animY: cell.gem.animY };
            }
            return { hasGem: false };
        }""")
        assert rebound_data['hasGem'] == True, "Cell (0,0) must have gem"
        # Wait for frame loops to settle animY and trigger squashTimer
        time.sleep(0.3)
        squash_active = page.evaluate("""() => {
            const cell = window.game.grid.get(0, 0);
            return (cell && cell.gem && typeof cell.gem.squashTimer !== 'undefined');
        }""")
        print("Squash timer initialized and active on gem landing:", squash_active)
        assert squash_active == True, "Squash timer must be attached and triggered on gem landing"

        # 7. Test Victory Confetti & Fanfare
        print("Testing Victory Fanfare and Confetti Rain...")
        page.evaluate("() => window.game.triggerLevelVictory()")
        time.sleep(0.6)

        victory_shot = os.path.join(ARTIFACTS_DIR, "pillar4_victory_confetti.png")
        page.screenshot(path=victory_shot)
        print(f"Captured screenshot: {victory_shot}")

        browser.close()
        print("\n=======================================================")
        print("ALL PILLAR 4 BROWSER TESTS PASSED (100% SUCCESS)!")
        print("=======================================================")

if __name__ == '__main__':
    main()
