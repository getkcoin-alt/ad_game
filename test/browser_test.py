import http.server
import socketserver
import threading
import subprocess
import time
import os
import sys

PORT = 8088
DIRECTORY = "/Users/karnveersingh/.gemini/antigravity/scratch/rangoli-jewel-utsav"
CHROME_PATH = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"

class Handler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=DIRECTORY, **kwargs)

    def log_message(self, format, *args):
        pass # suppress server access logs

def start_server():
    server = socketserver.TCPServer(("", PORT), Handler)
    server_thread = threading.Thread(target=server.serve_forever)
    server_thread.daemon = True
    server_thread.start()
    return server

def run_chrome_test():
    server = start_server()
    print(f"HTTP Server started at http://localhost:{PORT}")
    time.sleep(1)

    screenshot_path = os.path.join(DIRECTORY, "assets", "mobile_preview.png")
    
    # Chrome headless command with mobile viewport (390x844)
    cmd = [
        CHROME_PATH,
        "--headless=new",
        "--disable-gpu",
        "--no-sandbox",
        "--window-size=390,844",
        f"--screenshot={screenshot_path}",
        "--virtual-time-budget=2000",
        f"http://localhost:{PORT}/index.html"
    ]

    print("Executing Headless Chrome...")
    res = subprocess.run(cmd, capture_output=True, text=True, timeout=15)
    print("Chrome Return Code:", res.returncode)
    if res.stdout:
        print("Chrome stdout:", res.stdout)
    if res.stderr:
        print("Chrome stderr:", res.stderr)

    if os.path.exists(screenshot_path):
        size = os.path.getsize(screenshot_path)
        print(f"Screenshot successfully captured: {screenshot_path} ({size} bytes)")
    else:
        print("Screenshot not found!")
        sys.exit(1)

if __name__ == "__main__":
    run_chrome_test()
