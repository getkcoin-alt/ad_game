#!/usr/bin/env python3
"""
Chrome Browser Autonomous Verification for Heart Energy & Next Life Countdown Timer
"""

import http.server
import socketserver
import threading
import time
import os
from playwright.sync_api import sync_playwright

PORT = 8095
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
        page.wait_for_selector("#header-lives-chip")

        # 1. Verify Full Lives (5/5) shows FULL
        header_text = page.inner_text("#header-lives-timer")
        lives_count = page.inner_text("#header-lives")
        print(f"Initial Header: lives={lives_count}, timerText='{header_text}'")
        assert lives_count == "5", f"Initial lives should be 5, got {lives_count}"
        assert header_text == "FULL", f"Initial timer should be FULL, got '{header_text}'"

        # 2. Simulate 3 lives with 14m 20s remaining
        print("Simulating 3 lives with 14m 20s remaining until next heart...")
        page.evaluate("""() => {
            const sm = window.StorageManager;
            sm.data.lives = 3;
            // 5m 40s elapsed out of 20m -> 14m 20s remaining
            const elapsed = (5 * 60 + 40) * 1000;
            sm.data.lastLifeTimestamp = Date.now() - elapsed;
            sm.save();
            window.game.updateHeaderUI();
            window.game.updateLivesTimerUI();
        }""")
        time.sleep(1.2) # Allow 1-second interval to tick

        timer_ticking = page.inner_text("#header-lives-timer")
        lives_after = page.inner_text("#header-lives")
        print(f"Header after deduction: lives={lives_after}, timerText='{timer_ticking}'")
        assert lives_after == "3", f"Lives should be 3, got {lives_after}"
        assert ":" in timer_ticking, f"Timer should display MM:SS, got '{timer_ticking}'"
        assert timer_ticking.startswith("14:"), f"Timer should start with 14:, got '{timer_ticking}'"

        shot_header = os.path.join(ARTIFACTS_DIR, "heart_timer_header_countdown.png")
        page.screenshot(path=shot_header)
        print(f"Captured screenshot: {shot_header}")

        # 3. Click #header-lives-chip to open #lives-modal
        print("Clicking #header-lives-chip to open Heart Energy & Refill modal...")
        page.click("#header-lives-chip")
        time.sleep(0.4)

        modal_visible = page.is_visible("#lives-modal")
        modal_lives = page.inner_text("#lives-modal-count")
        modal_next = page.inner_text("#lives-modal-next-time")
        modal_full = page.inner_text("#lives-modal-full-time")
        print(f"Modal opened: visible={modal_visible}, lives={modal_lives}/5, next='{modal_next}', full='{modal_full}'")
        assert modal_visible == True, "Lives modal should be open and visible"
        assert modal_lives == "3", "Modal should display 3 lives"
        assert ":" in modal_next, f"Modal next heart should have time format, got '{modal_next}'"
        assert "m" in modal_full or "h" in modal_full, f"Modal full recovery should show duration, got '{modal_full}'"

        shot_modal = os.path.join(ARTIFACTS_DIR, "heart_timer_refill_modal.png")
        page.screenshot(path=shot_modal)
        print(f"Captured screenshot: {shot_modal}")

        # 4. Toggle Language to Hindi
        print("Toggling language to Hindi to verify bilingual 'अगला प्राण' and 'पूर्ण'...")
        page.click("#lives-modal-close-btn")
        time.sleep(0.3)
        page.click("#lang-toggle-btn") # switch to Hindi
        time.sleep(0.4)

        # Re-open modal in Hindi
        page.click("#header-lives-chip")
        time.sleep(0.4)
        modal_title_hi = page.inner_text("#lives-modal h3")
        print(f"Hindi Modal Title: '{modal_title_hi}'")
        assert "प्राण" in modal_title_hi, f"Hindi title should contain 'प्राण', got '{modal_title_hi}'"

        shot_hindi = os.path.join(ARTIFACTS_DIR, "heart_timer_hindi_mode.png")
        page.screenshot(path=shot_hindi)
        print(f"Captured screenshot: {shot_hindi}")

        # 5. Test Coin Refill Button
        print("Testing Instant Heart Refill with 100 Shagun Coins...")
        page.evaluate("() => { window.StorageManager.data.coins = 200; window.StorageManager.save(); }")
        page.click("#lives-refill-coins-btn")
        time.sleep(0.4)

        lives_restored = page.inner_text("#header-lives")
        timer_restored = page.inner_text("#header-lives-timer")
        print(f"After Coin Refill: lives={lives_restored}, timerText='{timer_restored}'")
        assert lives_restored == "5", f"Lives should be fully restored to 5, got {lives_restored}"
        assert timer_restored in ["FULL", "पूर्ण"], f"Timer should display FULL/पूर्ण, got '{timer_restored}'"

        # Switch back to English
        page.click("#lang-toggle-btn")
        time.sleep(0.3)

        browser.close()
        print("\n=======================================================")
        print("ALL HEART TIMER BROWSER TESTS PASSED (100% SUCCESS)!")
        print("=======================================================")

if __name__ == '__main__':
    main()
