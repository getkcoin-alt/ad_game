import http.server
import socketserver
import threading
import subprocess
import time
import os

PORT = 8089
DIRECTORY = "/Users/karnveersingh/.gemini/antigravity/scratch/rangoli-jewel-utsav"
CHROME_PATH = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"

class Handler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=DIRECTORY, **kwargs)

    def log_message(self, format, *args):
        pass

def start_server():
    server = socketserver.TCPServer(("", PORT), Handler)
    server_thread = threading.Thread(target=server.serve_forever)
    server_thread.daemon = True
    server_thread.start()
    return server

def capture_screens():
    server = start_server()
    time.sleep(0.5)

    # 1. Gameplay screen test: load page and auto-trigger Level 1 via query param or script
    gameplay_img = os.path.join(DIRECTORY, "assets", "gameplay_preview.png")
    courtyard_img = os.path.join(DIRECTORY, "assets", "courtyard_preview.png")

    # Let's create temporary HTML triggers
    html_game = """<!DOCTYPE html>
    <html>
    <head><meta http-equiv="refresh" content="0; url=index.html#autoplay=1"></head>
    </html>"""

    # We can pass JS execution or load via URL hash
    cmd1 = [
        CHROME_PATH,
        "--headless=new",
        "--disable-gpu",
        "--no-sandbox",
        "--window-size=390,844",
        f"--screenshot={gameplay_img}",
        "--virtual-time-budget=2500",
        f"http://localhost:{PORT}/index.html?startLevel=1"
    ]
    subprocess.run(cmd1, capture_output=True, text=True, timeout=15)

    cmd2 = [
        CHROME_PATH,
        "--headless=new",
        "--disable-gpu",
        "--no-sandbox",
        "--window-size=390,844",
        f"--screenshot={courtyard_img}",
        "--virtual-time-budget=2500",
        f"http://localhost:{PORT}/index.html?showCourtyard=1"
    ]
    subprocess.run(cmd2, capture_output=True, text=True, timeout=15)

    print("Gameplay image exists:", os.path.exists(gameplay_img))
    print("Courtyard image exists:", os.path.exists(courtyard_img))

if __name__ == "__main__":
    capture_screens()
