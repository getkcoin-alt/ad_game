"""
Comprehensive Browser Automated Test Suite for Rangoli Utsav
Executes real user sessions inside Google Chrome via Playwright.
"""
import http.server
import socketserver
import threading
import time
import os
import sys
from playwright.sync_api import sync_playwright

PORT = 8092
PROJECT_DIR = "/Users/karnveersingh/.gemini/antigravity/scratch/rangoli-jewel-utsav"
CHROME_PATH = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
ARTIFACT_DIR = "/Users/karnveersingh/.gemini/antigravity/brain/e3e89bad-b1f0-4ad2-9b32-4096d84a6d32"

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

def run_tests():
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

        # Listen for console logs and errors
        page.on("console", lambda msg: console_logs.append(f"[{msg.type}] {msg.text}"))
        page.on("pageerror", lambda err: page_errors.append(str(err)))

        print("\n[Step 1] Loading Game in Mobile Viewport (390x844)...")
        page.goto(f"http://localhost:{PORT}/index.html", wait_until="networkidle")
        time.sleep(1)

        # 1. Verify Page Title & Logo
        title = page.inner_text(".game-logo-title")
        sub = page.inner_text(".game-logo-sub")
        print(f"  ✓ Header rendered: '{title}' - '{sub}'")
        assert "Rangoli Utsav" in title, "Title mismatch"

        # Check initial stats
        lives = page.inner_text("#header-lives")
        coins = page.inner_text("#header-coins")
        stars = page.inner_text("#header-stars")
        print(f"  ✓ Initial Stats: Lives={lives}, Coins={coins}, Stars={stars}")
        assert int(lives) == 5, "Lives should start at 5"
        assert int(coins) >= 150, "Coins should start at >= 150"

        # Capture Step 1 screenshot (Main Menu)
        menu_shot = os.path.join(ARTIFACT_DIR, "test_step1_main_menu.png")
        page.screenshot(path=menu_shot)
        print(f"  ✓ Main Menu screenshot saved: {menu_shot}")

        # 2. Test Language Toggle (English -> Hindi -> English)
        print("\n[Step 2] Testing Bilingual Toggle (English <-> Hindi)...")
        lang_btn = page.locator("#lang-toggle-btn")
        lang_btn.click()
        time.sleep(0.5)

        title_hi = page.inner_text(".game-logo-title")
        print(f"  ✓ Hindi Title: '{title_hi}'")
        assert "रंगोली" in title_hi, "Failed switching to Hindi"

        # Capture Hindi screenshot
        page.screenshot(path=os.path.join(ARTIFACT_DIR, "test_step2_hindi_menu.png"))

        # Switch back to English
        lang_btn.click()
        time.sleep(0.3)
        assert "Rangoli" in page.inner_text(".game-logo-title"), "Failed switching back to English"
        print("  ✓ English restored successfully")

        # 3. Test Shagun Wheel Modal & Spin
        print("\n[Step 3] Testing Daily Shagun Wheel Modal & Spin Physics...")
        page.click("#wheel-btn")
        time.sleep(0.6)

        wheel_modal = page.locator("#wheel-modal")
        assert wheel_modal.is_visible(), "Wheel modal should be visible"

        # Intercept window.alert so it doesn't block the automated test
        page.evaluate("window.alert = (msg) => { window.__lastAlert = msg; console.log('[Browser Alert]', msg); };")

        # Click Spin
        spin_btn = page.locator("#wheel-spin-btn")
        print("  ✓ Triggering Shagun Wheel spin...")
        spin_btn.click()

        # Wait 4.2 seconds for wheel deceleration and prize grant
        time.sleep(4.5)

        # Check alert message
        alert_msg = page.evaluate("window.__lastAlert")
        print(f"  ✓ Prize won on wheel: '{alert_msg}'")
        assert alert_msg is not None, "Wheel did not trigger prize win alert"

        # Close wheel modal
        page.click("#wheel-close-btn")
        time.sleep(0.5)
        assert not wheel_modal.is_visible(), "Wheel modal should be hidden"

        # 4. Test Haveli Courtyard Screen
        print("\n[Step 4] Testing Haveli Courtyard Renovation Screen...")
        page.click("#courtyard-btn")
        time.sleep(0.8)

        courtyard_screen = page.locator("#courtyard-screen")
        assert courtyard_screen.is_visible(), "Courtyard screen should be visible"

        items_count = page.locator(".courtyard-item-card").count()
        print(f"  ✓ Courtyard architectural renovation cards found: {items_count}")
        assert items_count == 6, "Expected 6 Courtyard items"

        # Capture Courtyard screenshot
        courtyard_shot = os.path.join(ARTIFACT_DIR, "test_step4_courtyard.png")
        page.screenshot(path=courtyard_shot)
        print(f"  ✓ Courtyard screenshot saved: {courtyard_shot}")

        # Return to menu
        page.click("#courtyard-screen button:has-text('←')")
        time.sleep(0.5)

        # 5. Test Gameplay - Level 1 (The Royal Courtyard)
        print("\n[Step 5] Launching Level 1 Gameplay...")
        level_1_btn = page.locator(".level-card.unlocked").first
        level_1_btn.click()
        time.sleep(0.8)

        game_screen = page.locator("#game-screen")
        assert game_screen.is_visible(), "Game screen should be visible"

        initial_moves = int(page.inner_text("#ingame-moves"))
        initial_score = int(page.inner_text("#ingame-score"))
        print(f"  ✓ Level 1 Started: Moves={initial_moves}, Score={initial_score}")
        assert initial_moves == 18, "Level 1 should start with 18 moves"

        # Perform a valid move by finding hint or calling swap
        print("  ✓ Finding and executing a legal match-3 move...")
        move_executed = page.evaluate("""() => {
            const hint = window.GameController.grid.findHintMove();
            if (hint && hint.length === 2) {
                window.GameController.attemptSwap(hint[0].r, hint[0].c, hint[1].r, hint[1].c);
                return { from: hint[0], to: hint[1] };
            }
            return null;
        }""")
        print(f"  ✓ Move executed: {move_executed}")
        assert move_executed is not None, "Failed to find valid move"

        # Wait for cascades and animations to settle
        time.sleep(1.8)

        new_score = int(page.inner_text("#ingame-score"))
        new_moves = int(page.inner_text("#ingame-moves"))
        print(f"  ✓ Post-Cascade Board: Moves={new_moves} (was {initial_moves}), Score={new_score} (was {initial_score})")
        assert new_moves == initial_moves - 1, "Moves should decrement by 1"
        assert new_score > initial_score, "Score should have increased from match and cascades"

        # Capture Active Gameplay screenshot
        game_shot = os.path.join(ARTIFACT_DIR, "test_step5_active_match3.png")
        page.screenshot(path=game_shot)
        print(f"  ✓ Active Match-3 screenshot saved: {game_shot}")

        # 6. Test In-Game Booster: Gulal Hammer
        print("\n[Step 6] Testing In-Game Booster (Gulal Hammer)...")
        hammer_btn = page.locator("#booster-hammer-btn")
        hammer_btn.click()
        time.sleep(0.3)
        assert "active-booster" in hammer_btn.get_attribute("class"), "Hammer should be activated"

        # Click cell (3, 3) to shatter
        page.evaluate("window.GameController.handleBoosterClick(3, 3)")
        time.sleep(1.2)

        hammer_count = int(page.inner_text("#booster-hammer-count"))
        print(f"  ✓ Gulal Hammer shattered cell (3, 3), remaining count: {hammer_count}")
        assert hammer_count == 1, "Hammer count should have decreased to 1"

        # 7. Test Ethical Rewarded Ad Recovery (+3 Moves)
        print("\n[Step 7] Testing Out-of-Moves Recovery & Rewarded Ad System...")
        # Simulate running out of moves
        page.evaluate("""() => {
            window.GameController.movesLeft = 0;
            window.GameController.triggerLevelDefeat();
        }""")
        time.sleep(0.6)

        fail_modal = page.locator("#fail-modal")
        assert fail_modal.is_visible(), "Fail modal should appear when moves reach 0"
        print("  ✓ 'Bas Thoda Sa Door!' compassionate recovery modal appeared")

        # Capture Fail Modal screenshot
        fail_shot = os.path.join(ARTIFACT_DIR, "test_step7_fail_recovery_modal.png")
        page.screenshot(path=fail_shot)

        # Click 'Watch Short Ad (+3 Moves)'
        page.click("#fail-ad-btn")
        time.sleep(0.5)

        ad_modal = page.locator("#ad-modal")
        assert ad_modal.is_visible(), "Artisan Ad modal should appear"
        print("  ✓ Artisan Showcase Rewarded Ad started (5s countdown)...")

        # Wait 5.5s for ad countdown completion
        time.sleep(5.6)

        claim_btn = page.locator("#ad-claim-btn")
        assert claim_btn.is_visible(), "Claim Reward button should now be visible"

        claim_btn.click()
        time.sleep(0.6)
        assert not ad_modal.is_visible(), "Ad modal should close"
        assert not fail_modal.is_visible(), "Fail modal should close after reward"

        recovered_moves = int(page.inner_text("#ingame-moves"))
        print(f"  ✓ Reward disbursed! Moves recovered to: {recovered_moves}")
        assert recovered_moves == 3, "Player should have received exactly +3 extra moves"

        # 8. Test Victory Screen (Level Completion)
        print("\n[Step 8] Testing Level Victory Fanfare & Star Reward...")
        page.evaluate("""() => {
            window.GameController.score = 2500;
            window.GameController.triggerLevelVictory();
        }""")
        time.sleep(0.8)

        win_modal = page.locator("#win-modal")
        assert win_modal.is_visible(), "Win modal should be visible"
        stars_earned = page.inner_text("#win-stars")
        print(f"  ✓ Victory Modal: '{page.inner_text('.modal-title')}', Stars: {stars_earned}")
        assert "⭐" in stars_earned, "Should have earned stars"

        # Capture Victory Modal screenshot
        win_shot = os.path.join(ARTIFACT_DIR, "test_step8_victory_modal.png")
        page.screenshot(path=win_shot)

        # 9. Verify 0 Page Errors & Review Telemetry
        print("\n[Step 9] Verifying Console Telemetry & Zero Error Invariant...")
        telemetry_events = page.evaluate("window.AnalyticsEngine.eventLog")
        print(f"  ✓ Total Telemetry Events Logged: {len(telemetry_events)}")
        event_names = [e["eventName"] for e in telemetry_events]
        print(f"  ✓ Telemetry Stream: {event_names}")
        assert "level_start" in event_names, "Missing level_start telemetry"
        assert "level_complete" in event_names, "Missing level_complete telemetry"
        assert "rewarded_ad_completed" in event_names, "Missing rewarded_ad_completed telemetry"

        print(f"\nTotal Browser Page Errors Encountered: {len(page_errors)}")
        if page_errors:
            print("Page Errors:", page_errors)
        assert len(page_errors) == 0, f"Encountered page errors: {page_errors}"

        browser.close()
        print("\n========================================================")
        print("🎉 ALL 9 BROWSER AUTOMATION STEPS COMPLETED FLAWLESSLY!")
        print("========================================================")

if __name__ == "__main__":
    run_tests()
