import http.server
import socketserver
import threading
import time
import os
import sys
from playwright.sync_api import sync_playwright

sys.stdout.reconfigure(line_buffering=True)

PORT = 8099
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

def test_pillar2_browser():
    server = start_server()
    print(f"=== BROWSER TEST SERVER STARTED AT http://localhost:{PORT} ===")

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

        print("[Test] Loading page...")
        page.goto(f"http://localhost:{PORT}/index.html", wait_until="networkidle")
        time.sleep(1.0)

        # 1. Set winStreak = 3 in StorageManager to test Tier 3 Maha Blessing
        page.evaluate("""
            window.StorageManager.data.winStreak = 3;
            window.StorageManager.save();
            window.game.updateHeaderUI();
        """)
        time.sleep(0.5)

        # Verify streak badge is visible and shows 3
        streak_badge_visible = page.is_visible('#streak-chip')
        streak_count = page.inner_text('#header-streak')
        print(f"[Test] Streak badge visible: {streak_badge_visible}, count: {streak_count}")
        assert streak_badge_visible
        assert streak_count == '3'

        # 2. Start Level 1 and verify 3 free specials are pre-spawned on the board
        print("[Test] Starting level with Shringaar Blessing Tier 3...")
        page.click('#play-main-cta-btn')
        time.sleep(1.5)

        specials_on_board = page.evaluate("""
            (() => {
                let specials = [];
                const g = window.game;
                for (let r = 0; r < 8; r++) {
                    for (let c = 0; c < 8; c++) {
                        const gem = g.grid.get(r, c)?.gem;
                        if (gem && gem.special !== window.SPECIAL_TYPES.NORMAL) {
                            specials.push({ r, c, type: gem.special });
                        }
                    }
                }
                return specials;
            })()
        """)
        print(f"[Test] Specials on board at start: {len(specials_on_board)} specials -> {specials_on_board}")
        assert len(specials_on_board) >= 3

        # Save screenshot of board with Shringaar Blessing active
        page.screenshot(path=os.path.join(ARTIFACT_DIR, "pillar2_shringaar_blessing_active.png"))
        print("[Test] Saved Shringaar Blessing screenshot to artifacts!")

        # 3. Simulate out-of-moves defeat and verify Loss-Aversion Warning
        print("[Test] Triggering defeat to check loss-aversion streak warning...")
        page.evaluate("""
            const g = window.game;
            g.movesLeft = 0;
            g.triggerLevelDefeat();
        """)
        time.sleep(0.8)

        fail_visible = page.is_visible('#fail-modal')
        streak_warning_visible = page.is_visible('#fail-streak-warning')
        warning_text = page.inner_text('#fail-streak-text')
        ad_btn_text = page.inner_text('#fail-ad-btn')

        print(f"[Test] Fail modal visible: {fail_visible}")
        print(f"[Test] Streak warning visible: {streak_warning_visible}")
        print(f"[Test] Warning text: '{warning_text}'")
        print(f"[Test] Ad button text: '{ad_btn_text}'")

        assert fail_visible
        assert streak_warning_visible
        assert "Save" in warning_text or "वरदान" in warning_text or "3" in warning_text

        # Save screenshot of loss-aversion modal
        page.screenshot(path=os.path.join(ARTIFACT_DIR, "pillar2_loss_aversion_modal.png"))
        print("[Test] Saved loss aversion modal screenshot to artifacts!")

        # 4. Click Watch Ad to save streak
        print("[Test] Claiming ad moves to save streak...")
        page.click('#fail-ad-btn')
        time.sleep(0.5)

        # Ad modal opens
        assert page.is_visible('#ad-modal')
        # Fast-forward simulated ad claim
        page.evaluate("window.AdSystem.claimAdReward()")
        time.sleep(0.8)

        # Fail modal should be dismissed and game state returned to PLAYING
        state = page.evaluate("window.game.state")
        moves = page.evaluate("window.game.movesLeft")
        streak = page.evaluate("window.StorageManager.data.winStreak")
        print(f"[Test] Game resumed: state={state}, movesLeft={moves}, winStreak={streak}")
        assert state == 'PLAYING'
        assert moves >= 3
        assert streak == 3  # Streak was saved!

        print("[Test] Pillar 2 Browser Verification 100% Passed!")
        browser.close()
    server.shutdown()

if __name__ == '__main__':
    test_pillar2_browser()
