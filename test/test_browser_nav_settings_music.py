#!/usr/bin/env python3
"""
Chrome Browser Autonomous Verification for:
1. Universal Ergonomic Bottom Navigation Dock
2. Unified Settings Hub Modal
3. Addictive Procedural Loop Music ("Raga Tarang")
"""

import http.server
import socketserver
import threading
import time
import os
from playwright.sync_api import sync_playwright

PORT = 8098
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
        page.wait_for_selector("#bottom-nav")

        # ----------------------------------------------------
        # 1. VERIFY BOTTOM DOCK TABS ON HOME MENU
        # ----------------------------------------------------
        print("\n--- 1. Testing Universal Bottom Dock Navigation ---")
        assert page.is_visible("#bottom-nav"), "Bottom navigation dock must be visible on main menu"
        tabs = page.query_selector_all(".nav-tab")
        print(f"Found {len(tabs)} bottom dock tabs.")
        assert len(tabs) == 5, f"Expected 5 dock tabs, found {len(tabs)}"

        # Verify default active tab is 'nav-map'
        map_active = page.eval_on_selector("#nav-map", "el => el.classList.contains('active')")
        assert map_active, "Levels map tab must be active by default on home screen"

        # Tab 2: Switch to Haveli Courtyard
        print("Switching to Courtyard via #nav-courtyard...")
        page.click("#nav-courtyard")
        time.sleep(0.5)
        assert page.is_visible("#courtyard-screen"), "Courtyard screen must be visible"
        courtyard_active = page.eval_on_selector("#nav-courtyard", "el => el.classList.contains('active')")
        assert courtyard_active, "Courtyard tab must have .active class"
        
        courtyard_shot = os.path.join(ARTIFACTS_DIR, "nav_dock_courtyard.png")
        page.screenshot(path=courtyard_shot)
        print(f"✓ Courtyard dock navigation verified. Screenshot: {courtyard_shot}")

        # Tab 3: Open Saheli Circle modal via #nav-saheli
        print("Opening Saheli Circle via #nav-saheli...")
        page.click("#nav-saheli")
        time.sleep(0.5)
        assert page.is_visible("#saheli-modal"), "Saheli modal must be visible"
        saheli_shot = os.path.join(ARTIFACTS_DIR, "nav_dock_saheli_modal.png")
        page.screenshot(path=saheli_shot)
        print(f"✓ Saheli modal opened. Screenshot: {saheli_shot}")
        page.click("#saheli-close-btn")
        time.sleep(0.3)
        assert not page.is_visible("#saheli-modal"), "Saheli modal must be dismissed"

        # Tab 4: Open Shagun Wheel via #nav-shagun
        print("Opening Shagun Wheel via #nav-shagun...")
        page.click("#nav-shagun")
        time.sleep(0.5)
        assert page.is_visible("#wheel-modal"), "Shagun wheel modal must be visible"
        wheel_shot = os.path.join(ARTIFACTS_DIR, "nav_dock_wheel_modal.png")
        page.screenshot(path=wheel_shot)
        print(f"✓ Shagun wheel opened. Screenshot: {wheel_shot}")
        page.click("#wheel-close-btn")
        time.sleep(0.3)
        assert not page.is_visible("#wheel-modal"), "Shagun wheel modal must be dismissed"

        # Return to Levels map
        page.click("#nav-map")
        time.sleep(0.3)
        assert page.is_visible("#menu-screen"), "Menu screen must be visible"

        # ----------------------------------------------------
        # 2. VERIFY DOCK AUTO-HIDING DURING ACTIVE PUZZLE PLAY
        # ----------------------------------------------------
        print("\n--- 2. Testing Dock Auto-Hiding in Active Puzzle Play ---")
        page.click("#play-main-cta-btn")
        time.sleep(0.6)
        assert page.is_visible("#game-screen"), "Game screen must be active"

        dock_hidden = page.eval_on_selector("#bottom-nav", "el => el.classList.contains('hidden-dock')")
        print(f"In-Game Dock hidden state: {dock_hidden}")
        assert dock_hidden, "Bottom dock must have 'hidden-dock' class during active match-3 puzzle play"

        ingame_shot = os.path.join(ARTIFACTS_DIR, "nav_dock_hidden_in_game.png")
        page.screenshot(path=ingame_shot)
        print(f"✓ Dock hidden during gameplay. Screenshot: {ingame_shot}")

        # Pause and quit to main menu
        page.click("#pause-btn")
        time.sleep(0.3)
        page.click("#quit-btn")
        time.sleep(0.5)
        assert page.is_visible("#menu-screen"), "Menu screen must be restored"

        dock_restored = page.eval_on_selector("#bottom-nav", "el => !el.classList.contains('hidden-dock')")
        assert dock_restored, "Bottom dock must be visible again after returning to menu"

        # ----------------------------------------------------
        # 3. VERIFY UNIFIED SETTINGS HUB MODAL
        # ----------------------------------------------------
        print("\n--- 3. Testing Settings Hub Modal ---")
        # Open via header ⚙️ button
        page.click("#settings-btn")
        time.sleep(0.5)
        assert page.is_visible("#settings-modal"), "Settings modal must open from header button"

        settings_shot = os.path.join(ARTIFACTS_DIR, "settings_hub_modal.png")
        page.screenshot(path=settings_shot)
        print(f"✓ Settings modal opened. Screenshot: {settings_shot}")

        # Check Artisan ID is displayed
        artisan_id = page.inner_text("#settings-artisan-id")
        print(f"Artisan ID rendered: '{artisan_id}'")
        assert artisan_id.startswith("#RU-"), f"Expected Artisan ID to start with #RU-, got {artisan_id}"

        # Adjust SFX volume slider
        print("Adjusting SFX slider to 45%...")
        page.eval_on_selector("#settings-sfx-slider", """el => {
            el.value = 45;
            el.dispatchEvent(new Event('input', { bubbles: true }));
        }""")
        time.sleep(0.2)
        sfx_label = page.inner_text("#settings-sfx-val")
        assert sfx_label == "45%", f"Expected 45%, got {sfx_label}"

        # Adjust Music volume slider
        print("Adjusting Music slider to 75%...")
        page.eval_on_selector("#settings-music-slider", """el => {
            el.value = 75;
            el.dispatchEvent(new Event('input', { bubbles: true }));
        }""")
        time.sleep(0.2)
        music_label = page.inner_text("#settings-music-val")
        assert music_label == "75%", f"Expected 75%, got {music_label}"

        # Verify StorageManager and AudioEngine received new values
        audio_state = page.evaluate("""() => {
            return {
                sfxVol: window.AudioEngine.soundVolume,
                musicVol: window.AudioEngine.musicVolume,
                storedSfx: window.StorageManager.data.soundVolume,
                storedMusic: window.StorageManager.data.musicVolume
            };
        }""")
        print(f"Audio Engine State: {audio_state}")
        assert abs(audio_state['sfxVol'] - 0.45) < 0.01, f"AudioEngine sfxVol should be 0.45, got {audio_state['sfxVol']}"
        assert abs(audio_state['musicVol'] - 0.75) < 0.01, f"AudioEngine musicVol should be 0.75, got {audio_state['musicVol']}"

        # Toggle Haptics
        print("Toggling Haptics switch off...")
        page.eval_on_selector("#settings-haptics-toggle", """el => {
            el.checked = false;
            el.dispatchEvent(new Event('change', { bubbles: true }));
        }""")
        time.sleep(0.2)
        haptics_stored = page.evaluate("() => window.StorageManager.data.hapticsEnabled")
        assert haptics_stored == False, "StorageManager should reflect hapticsEnabled: false"

        # Toggle Language to Hindi
        print("Switching language to Hindi in settings...")
        page.click("#settings-lang-btn")
        time.sleep(0.5)

        hindi_title = page.inner_text("#settings-modal .modal-header h2")
        print(f"Hindi Settings Title: '{hindi_title}'")
        assert "सेटिंग्स" in hindi_title, f"Expected Hindi title 'खेल सेटिंग्स', got '{hindi_title}'"

        hindi_nav_levels = page.inner_text("#nav-map .nav-label")
        print(f"Hindi Levels Nav Tab: '{hindi_nav_levels}'")
        assert hindi_nav_levels == "स्तर", f"Expected 'स्तर', got '{hindi_nav_levels}'"

        hindi_settings_shot = os.path.join(ARTIFACTS_DIR, "settings_hub_hindi_mode.png")
        page.screenshot(path=hindi_settings_shot)
        print(f"✓ Hindi settings verified. Screenshot: {hindi_settings_shot}")

        # Close settings modal
        page.click("#settings-close-btn")
        time.sleep(0.3)
        assert not page.is_visible("#settings-modal"), "Settings modal must be dismissed"

        # ----------------------------------------------------
        # 4. VERIFY PROCEDURAL LOOP MUSIC ENGINE ("Raga Tarang")
        # ----------------------------------------------------
        print("\n--- 4. Testing Procedural Loop Music Engine ---")
        music_status = page.evaluate("""() => {
            const ae = window.AudioEngine;
            ae.startMusicLoop();
            return {
                isMusicPlaying: ae.isMusicPlaying,
                hasTimer: ae.musicTimer !== null,
                tanpuraVoices: ae.tanpuraOscillators.length,
                soundVol: ae.soundVolume,
                musicVol: ae.musicVolume
            };
        }""")
        print(f"Procedural Music Status: {music_status}")
        assert music_status['isMusicPlaying'] == True, "AudioEngine.isMusicPlaying must be true"
        assert music_status['hasTimer'] == True, "Music scheduler timer must be active"
        assert music_status['tanpuraVoices'] >= 3, "Tanpura drone bed must have multi-voice oscillators running"

        browser.close()
        print("\n========================================================")
        print("ALL BROWSER AUTOMATION TESTS PASSED 100% SUCCESSFULLY!")
        print("========================================================")

if __name__ == "__main__":
    main()
