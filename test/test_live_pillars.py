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

        # Verify Pillar 3: WhatsApp Share Button on Victory Modal
        win_share_visible = page.is_visible('#win-share-btn')
        print(f"[Live] Victory Modal WhatsApp Share: {win_share_visible}")
        assert win_share_visible

        # Go to Main Menu
        page.click('#win-menu-btn')
        time.sleep(1.0)

        # Verify Pillar 3: Saheli Circle Modal on Live
        page.click('#saheli-btn')
        time.sleep(0.8)
        assert page.is_visible('#saheli-modal')
        circle_title = page.inner_text('#saheli-circle-name')
        print(f"[Live] Saheli Circle Title: {circle_title}")
        assert "Jaipur Gulal" in circle_title or "सहेलियाँ" in circle_title

        # Gift life to member
        initial_coins = int(page.inner_text('#header-coins'))
        gift_btn = page.query_selector('.btn-gift-life:not(.gifted)')
        if gift_btn:
            gift_btn.click()
            time.sleep(0.6)
            new_coins = int(page.inner_text('#header-coins'))
            print(f"[Live] Coins after gifting life: {new_coins} (was {initial_coins})")
            assert new_coins == initial_coins + 10

        page.screenshot(path=os.path.join(ARTIFACT_DIR, "live_production_pillars_all_verified.png"))
        print("[Live] Pillars 1, 2, and 3 Live Verification 100% Passed! Screenshot saved.")

        browser.close()

if __name__ == '__main__':
    test_live_production()
