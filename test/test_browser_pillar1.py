import http.server
import socketserver
import threading
import time
import os
import sys
from playwright.sync_api import sync_playwright

sys.stdout.reconfigure(line_buffering=True)

PORT = 8098
PROJECT_DIR = "/Users/karnveersingh/.gemini/antigravity/scratch/rangoli-jewel-utsav"
CHROME_PATH = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
ARTIFACT_DIR = "/Users/karnveersingh/.gemini/antigravity/brain/e3e89bad-b1f0-4ad2-9b32-4096d84a6d32"

socketserver.TCPServer.allow_reuse_address = True

class QuietHandler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=PROJECT_DIR, **kwargs)
    def log_message(self, format, *args):
        pass

def start_server():
    server = socketserver.TCPServer(("", PORT), QuietHandler)
    t = threading.Thread(target=server.serve_forever)
    t.daemon = True
    t.start()
    return server

def test_pillar1_browser():
    server = start_server()
    print(f"=== BROWSER TEST SERVER STARTED AT http://localhost:{PORT} ===")

    console_logs = []
    page_errors = []

    with sync_playwright() as p:
        browser = p.chromium.launch(
            executable_path=CHROME_PATH,
            headless=True,
            args=["--no-sandbox", "--disable-gpu", "--autoplay-policy=no-user-gesture-required"]
        )
        context = browser.new_context(
            viewport={"width": 390, "height": 844},
            device_scale_factor=2,
            is_mobile=True,
            has_touch=True
        )
        page = context.new_page()
        page.on("console", lambda msg: console_logs.append(f"[{msg.type}] {msg.text}"))
        page.on("pageerror", lambda err: page_errors.append(str(err)))

        print("[Test] Loading page...")
        page.goto(f"http://localhost:{PORT}/index.html", wait_until="networkidle")
        time.sleep(1.0)

        # Start Level 1
        print("[Test] Clicking Play CTA...")
        page.click('#play-main-cta-btn')
        time.sleep(1.0)

        state = page.evaluate("window.game.state")
        print(f"[Test] Game state: {state}")
        assert state == 'PLAYING'

        # Test 1: Place an Anar Bomb at (3, 3) and verify tap-to-activate
        page.evaluate("""
            const g = window.game;
            g.grid.grid[3][3].gem = { id: 9999, type: 1, special: window.SPECIAL_TYPES.ANAR_BOMB };
            g.renderer.resize();
        """)
        time.sleep(0.5)

        coords = page.evaluate("""
            (() => {
                const r = window.game.renderer;
                const canvas = document.getElementById('game-canvas');
                const rect = canvas.getBoundingClientRect();
                const x = rect.left + r.boardX + (3 * r.cellSize) + (r.cellSize / 2);
                const y = rect.top + r.boardY + (3 * r.cellSize) + (r.cellSize / 2);
                return { x, y };
            })()
        """)
        print(f"[Test] Tapping special gem at ({coords['x']}, {coords['y']})...")

        # First tap: selects the special gem and displays "Tap again to blast!"
        page.touchscreen.tap(coords['x'], coords['y'])
        time.sleep(0.3)
        selected = page.evaluate("window.game.selectedCell")
        print(f"[Test] Selected cell after 1st tap: {selected}")
        assert selected is not None and selected['r'] == 3 and selected['c'] == 3

        # Second tap: detonates the special gem in place!
        page.touchscreen.tap(coords['x'], coords['y'])
        time.sleep(1.0)

        score = page.evaluate("window.game.score")
        print(f"[Test] Score after direct detonation: {score}")
        assert score > 0

        # Test 2: Trigger Maha Utsav Finale with remaining moves
        print("[Test] Triggering Maha Utsav Finale with 4 remaining moves...")
        page.evaluate("""
            const g = window.game;
            g.score = g.targetScore + 100;
            g.movesLeft = 4;
            g.checkLevelOutcome();
        """)

        time.sleep(0.4)
        maha_state = page.evaluate("window.game.state")
        print(f"[Test] State during Maha Utsav: {maha_state}")
        assert maha_state == 'MAHA_UTSAV'

        # Save screenshot of Maha Utsav in action
        page.screenshot(path=os.path.join(ARTIFACT_DIR, "pillar1_maha_utsav_active.png"))
        print("[Test] Saved Maha Utsav screenshot to artifacts!")

        # Wait for all remaining moves to convert and finale cascades to settle
        time.sleep(4.5)

        final_state = page.evaluate("window.game.state")
        print(f"[Test] Final state after Maha Utsav: {final_state}")
        assert final_state == 'WIN'

        win_visible = page.is_visible('#win-modal')
        print(f"[Test] Win modal visible: {win_visible}")
        assert win_visible

        page.screenshot(path=os.path.join(ARTIFACT_DIR, "pillar1_victory_modal.png"))
        print("[Test] Pillar 1 Browser Verification 100% Passed!")

        browser.close()
    server.shutdown()

if __name__ == '__main__':
    test_pillar1_browser()
