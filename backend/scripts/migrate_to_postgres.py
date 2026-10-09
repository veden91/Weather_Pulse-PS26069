"""
Forwarder script to allow running `python scripts/migrate_to_postgres.py` directly from backend/
"""
import os
import sys

# Route execution to main scripts/migrate_to_postgres.py
ROOT_SCRIPT = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "scripts", "migrate_to_postgres.py"))
if os.path.exists(ROOT_SCRIPT):
    with open(ROOT_SCRIPT, "r", encoding="utf-8") as f:
        code = compile(f.read(), ROOT_SCRIPT, "exec")
        exec(code, {"__name__": "__main__", "__file__": ROOT_SCRIPT})
else:
    print(f"Error: Could not locate main script at {ROOT_SCRIPT}")
    sys.exit(1)
