"""
Forwarder script to allow running `python scripts/check_database.py` directly from backend/
"""
import os
import sys

ROOT_SCRIPT = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "scripts", "check_database.py"))
if os.path.exists(ROOT_SCRIPT):
    with open(ROOT_SCRIPT, "r", encoding="utf-8") as f:
        code = compile(f.read(), ROOT_SCRIPT, "exec")
        exec(code, {"__name__": "__main__", "__file__": ROOT_SCRIPT})
else:
    print(f"Error: Could not locate main script at {ROOT_SCRIPT}")
    sys.exit(1)
