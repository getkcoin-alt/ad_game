import time
import os
import sys
from playwright.sync_api import sync_playwright

sys.stdout.reconfigure(line_buffering=True)

CHROME_PATH = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
ARTIFACT_DIR = "/Users/karnveersingh/.gemini/antigravity/brain/e3e89bad-b1f0-4ad2-9b32-4096d84a6d32"
LIVE_URL = "https://rangoli-jewel-utsav.vercel.app"

def test_live_production():
    print(f"=== TESTING LIVE PRODUCTION AT {LIVE_URL} ===")
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

        print("[Live] Navigating to live URL...")
        page.goto(LIVE_URL, wait_until="networkidle")
        time.sleep(1.5)

        title = page.inner_text(".game-logo-title")
        print(f"[Live] Game Title: {title}")
        assert "Rangoli Utsav" in title

        # Verify Streak System works on Live
        page.evaluate("""
            window.StorageManager.data.winStreak = 2;
            window.StorageManager.save();
            window.game.updateHeaderUI();
        """)
        time.sleep(0.5)

        streak_count = page.inner_text('#header-streak')
        print(f"[Live] Streak on Live: {streak_count}")
        assert streak_count == '2'

        # Start Level 1 on Live
        page.click('#play-main-cta-btn')
        time.sleep(1.5)

        state = page.evaluate("window.game.state")
        print(f"[Live] State on Live: {state}")
        assert state == 'PLAYING'

        # Verify Pillar 2: Shringaar Blessing Tier 2 (spawned 2 specials)
        specials = page.evaluate("""
            (() => {
                let list = [];
                for (let r = 0; r < 8; r++) {
                    for (let c = 0; c < 8; c++) {
                        const g = window.game.grid.get(r, c)?.gem;
                        if (g && g.special !== window.SPECIAL_TYPES.NORMAL) {
                            list.push({ r, c, special: g.special });
                        }
                    }
                }
                return list;
            })()
        """)
        print(f"[Live] Specials on Live Board from Shringaar Blessing: {len(specials)}")
        assert len(specials) >= 2

        # Verify Pillar 1: Tap special to activate directly in place on Live
        first_special = specials[0]
        coords = page.evaluate(f"""
            (() => {{
                const r = window.game.renderer;
                const canvas = document.getElementById('game-canvas');
                const rect = canvas.getBoundingClientRect();
                const x = rect.left + r.boardX + ({first_special['c']} * r.cellSize) + (r.cellSize / 2);
                const y = rect.top + r.boardY + ({first_special['r']} * r.cellSize) + (r.cellSize / 2);
                return {{ x, y }};
            }})()
        """)

        # Tap once to select
        page.touchscreen.tap(coords['x'], coords['y'])
        time.sleep(0.3)
        # Tap second time to detonate directly in place
        page.touchscreen.tap(coords['x'], coords['y'])
        time.sleep(1.0)

        score = page.evaluate("window.game.score")
        print(f"[Live] Score after live tap-to-activate: {score}")
        assert score > 0

        # Verify Pillar 1: Maha Utsav Finale on Live
        page.evaluate("""
            const g = window.game;
            g.score = g.targetScore + 100;
            g.movesLeft = 3;
            g.checkLevelOutcome();
        """)
        time.sleep(0.4)
        maha_state = page.evaluate("window.game.state")
        print(f"[Live] State during Maha Utsav on Live: {maha_state}")
        assert maha_state == 'MAHA_UTSAV'

        # Wait for cascades to settle into victory
        time.sleep(4.5)
        final_state = page.evaluate("window.game.state")
        print(f"[Live] Final State on Live: {final_state}")
        assert final_state == 'WIN'
        assert page.is_visible('#win-modal')

        page.screenshot(path=os.path.join(ARTIFACT_DIR, "live_production_pillars_verified.png"))
        print("[Live] Production Live Verification 100% Passed! Screenshot saved.")

        browser.close()

if __name__ == '__main__':
    test_live_production()
