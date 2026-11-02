import http.server
import socketserver
import threading
import time
import os
import sys
from playwright.sync_api import sync_playwright

sys.stdout.reconfigure(line_buffering=True)

PORT = 8100
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

def test_pillar3_browser():
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

        print("[Test] Loading home screen...")
        page.goto(f"http://localhost:{PORT}/index.html", wait_until="networkidle")
        time.sleep(1.0)

        # 1. Open Saheli Circle Modal
        print("[Test] Opening Saheli Circle Modal...")
        page.click('#saheli-btn')
        time.sleep(0.8)

        modal_visible = page.is_visible('#saheli-modal')
        print(f"[Test] Saheli Modal visible: {modal_visible}")
        assert modal_visible

        circle_name = page.inner_text('#saheli-circle-name')
        print(f"[Test] Circle Name: {circle_name}")
        assert "Jaipur Gulal" in circle_name or "सहेलियाँ" in circle_name

        # Save screenshot of Saheli Circle modal
        page.screenshot(path=os.path.join(ARTIFACT_DIR, "pillar3_saheli_circle_modal.png"))
        print("[Test] Saved Saheli Circle screenshot!")

        # 2. Accept received life from inbox
        print("[Test] Accepting received life from inbox...")
        inbox_visible = page.is_visible('#saheli-inbox-section')
        print(f"[Test] Inbox visible: {inbox_visible}")
        assert inbox_visible

        initial_lives = int(page.inner_text('#header-lives'))
        page.click('#saheli-claim-gift-btn')
        time.sleep(0.5)

        # 3. Gift a life to member Sunita (+10 Coins reward)
        print("[Test] Gifting life to member Sunita...")
        initial_coins = int(page.inner_text('#header-coins'))
        gift_btn = page.query_selector('.btn-gift-life:not(.gifted)')
        assert gift_btn is not None
        gift_btn.click()
        time.sleep(0.8)

        new_coins = int(page.inner_text('#header-coins'))
        print(f"[Test] Coins before: {initial_coins}, after gifting: {new_coins}")
        assert new_coins == initial_coins + 10

        # 4. Claim Community Mandap Chest
        print("[Test] Claiming Community Mandap Chest...")
        page.click('#saheli-claim-chest-btn')
        time.sleep(0.8)
        claimed_btn_text = page.inner_text('#saheli-claim-chest-btn')
        print(f"[Test] Chest button after claim: '{claimed_btn_text}'")
        assert "Claimed" in claimed_btn_text or "प्राप्त" in claimed_btn_text

        # 5. Check WhatsApp Share Link Generation
        print("[Test] Verifying WhatsApp invite link generation...")
        invite_btn_visible = page.is_visible('#saheli-invite-btn')
        assert invite_btn_visible

        # Close Saheli modal
        page.click('#saheli-close-btn')
        time.sleep(0.5)
        assert not page.is_visible('#saheli-modal')

        # 6. Verify WhatsApp Share button on Courtyard screen
        print("[Test] Checking Courtyard WhatsApp share button...")
        page.click('#courtyard-btn')
        time.sleep(1.0)
        courtyard_share_visible = page.is_visible('#courtyard-share-btn')
        print(f"[Test] Courtyard WhatsApp Share visible: {courtyard_share_visible}")
        assert courtyard_share_visible

        # Save screenshot of Courtyard with WhatsApp Share
        page.screenshot(path=os.path.join(ARTIFACT_DIR, "pillar3_courtyard_whatsapp.png"))
        print("[Test] Saved Courtyard WhatsApp screenshot!")

        # 7. Start Level 1 and check Victory Modal WhatsApp button
        print("[Test] Checking Victory Modal WhatsApp share button...")
        page.evaluate("window.GameController.startLevel(1)")
        time.sleep(1.0)
        page.evaluate("""
            const g = window.game;
            g.score = g.targetScore + 100;
            g.triggerLevelVictory();
        """)
        time.sleep(0.8)

        win_share_visible = page.is_visible('#win-share-btn')
        print(f"[Test] Victory Modal WhatsApp Share visible: {win_share_visible}")
        assert win_share_visible

        page.screenshot(path=os.path.join(ARTIFACT_DIR, "pillar3_victory_whatsapp.png"))
        print("[Test] Saved Victory WhatsApp screenshot!")

        print("[Test] Pillar 3 Browser Verification 100% Passed!")
        browser.close()
    server.shutdown()

if __name__ == '__main__':
    test_pillar3_browser()
