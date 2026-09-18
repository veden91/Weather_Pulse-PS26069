import os
import sys
import subprocess
import time
import signal

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
BACKEND_DIR = os.path.join(BASE_DIR, "backend")
FRONTEND_DIR = os.path.join(BASE_DIR, "frontend")

def kill_process_on_port(port):
    """Frees port on Windows if previously occupied."""
    try:
        cmd = f'Get-NetTCPConnection -LocalPort {port} -ErrorAction SilentlyContinue | ForEach-Object {{ Stop-Process -Id $_.OwningProcess -Force }}'
        subprocess.run(["powershell", "-Command", cmd], capture_output=True)
    except Exception:
        pass

def main():
    print("=" * 70)
    print("  WeatherPulse India: National Weather Intelligence & Analytics Platform")
    print("  Ministry of Earth Sciences (MoES) • Smart India Hackathon (SIH 2026)")
    print("=" * 70)

    # 0. Clean up stale ports
    print("\n[0/3] Checking and freeing ports 8000 and 3000...")
    kill_process_on_port(8000)
    time.sleep(1)

    # 1. Verify seed data
    print("\n[1/3] Ensuring database schema and initial seed data...")
    try:
        subprocess.run([sys.executable, os.path.join(BASE_DIR, "scripts", "seed_data.py")], check=True)
    except Exception as e:
        print(f"Warning during seed check: {e}")

    # 2. Launch FastAPI Backend on 127.0.0.1 (Loopback avoids Windows firewall prompts)
    print("\n[2/3] Launching FastAPI Backend on http://127.0.0.1:8000...")
    backend_cmd = [
        sys.executable, "-m", "uvicorn", "app.main:app",
        "--host", "127.0.0.1", "--port", "8000"
    ]
    backend_proc = subprocess.Popen(
        backend_cmd,
        cwd=BACKEND_DIR,
        shell=(os.name == 'nt')
    )

    # Wait for backend to be ready
    time.sleep(3)

    # 3. Launch Vite Frontend
    print("\n[3/3] Launching React Vite Dashboard on http://localhost:3000...")
    npm_cmd = "npm.cmd" if os.name == 'nt' else "npm"
    frontend_proc = subprocess.Popen(
        [npm_cmd, "run", "dev"],
        cwd=FRONTEND_DIR,
        shell=(os.name == 'nt')
    )

    print("\n" + "=" * 70)
    print("  WeatherPulse India is LIVE!")
    print("  - Web GIS Dashboard:  http://localhost:3000")
    print("  - OpenAPI REST Docs:  http://127.0.0.1:8000/docs")
    print("  - WebSocket Stream:   ws://127.0.0.1:8000/ws/events")
    print("  - Demo Admin User:    admin / admin123")
    print("  Press Ctrl+C to terminate all services.")
    print("=" * 70 + "\n")

    def signal_handler(sig, frame):
        print("\nStopping WeatherPulse India services...")
        backend_proc.terminate()
        frontend_proc.terminate()
        sys.exit(0)

    signal.signal(signal.SIGINT, signal_handler)

    try:
        backend_proc.wait()
        frontend_proc.wait()
    except KeyboardInterrupt:
        backend_proc.terminate()
        frontend_proc.terminate()

if __name__ == "__main__":
    main()
