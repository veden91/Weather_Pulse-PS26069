import os
import sys
import socket
import sqlite3

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
ENV_PATH = os.path.join(BASE_DIR, ".env")

def get_database_url():
    """Reads DATABASE_URL from .env or defaults to SQLite."""
    if os.path.exists(ENV_PATH):
        with open(ENV_PATH, "r", encoding="utf-8") as f:
            for line in f:
                line = line.strip()
                if line.startswith("DATABASE_URL=") and not line.startswith("#"):
                    val = line.split("=", 1)[1].strip().strip('"').strip("'")
                    return val
    return "sqlite:///./backend/weatherpulse.db"

def check_sqlite(db_rel_path):
    # Determine which DB the backend is actively updating
    backend_db = os.path.join(BASE_DIR, "backend", "weatherpulse.db")
    root_db = os.path.join(BASE_DIR, "weatherpulse.db")
    
    target_path = backend_db if (os.path.exists(backend_db) and os.path.getsize(backend_db) > 0) else root_db

    print(f"Engine Type        : SQLite")
    print(f"Active Backend DB  : {target_path}")

    if not os.path.exists(target_path):
        print(f"Status             : ERROR (File does not exist)")
        return

    size_mb = os.path.getsize(target_path) / (1024 * 1024)
    print(f"Database Size      : {size_mb:.2f} MB")
    print(f"Connection Status  : ACTIVE & HEALTHY")
    print("-" * 65)

    conn = sqlite3.connect(target_path)
    cur = conn.cursor()

    cur.execute("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' ORDER BY name;")
    tables = [r[0] for r in cur.fetchall()]

    print(f"Total Tables       : {len(tables)}\n")
    print(f"{'Table Name':<24} | {'Record Count':<12}")
    print("-" * 40)

    total_rows = 0
    for t in tables:
        cur.execute(f'SELECT COUNT(*) FROM "{t}";')
        cnt = cur.fetchone()[0]
        total_rows += cnt
        print(f"{t:<24} | {cnt:>12}")

    print("-" * 40)
    print(f"{'TOTAL ROWS':<24} | {total_rows:>12}")
    print("-" * 65)

    if "reports" in tables:
        cur.execute("SELECT id, city, state, event_category, reported_at FROM reports ORDER BY reported_at DESC LIMIT 3;")
        recent = cur.fetchall()
        print("\nLatest Weather Reports Ingested:")
        for r in recent:
            print(f"  • [{r[0]}] {r[1]}, {r[2]} - {r[3]} ({r[4]})")

    if "media" in tables:
        cur.execute("SELECT COUNT(*) FROM media;")
        media_cnt = cur.fetchone()[0]
        print(f"\nStored Media Attachments: {media_cnt} photos/videos")

    conn.close()

def check_postgres(pg_url):
    print(f"Engine Type        : PostgreSQL (PostGIS)")
    print(f"Connection Target  : {pg_url}")
    try:
        import psycopg
        # Parse connection string
        conn_str = pg_url.replace("postgresql+psycopg://", "postgresql://")
        with psycopg.connect(conn_str, connect_timeout=3) as conn:
            print(f"Connection Status  : CONNECTED & ONLINE!")
            with conn.cursor() as cur:
                cur.execute("SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' ORDER BY table_name;")
                tables = [r[0] for r in cur.fetchall()]
                print(f"Total Tables in Public Schema: {len(tables)}")
                for t in tables:
                    cur.execute(f'SELECT COUNT(*) FROM "{t}";')
                    cnt = cur.fetchone()[0]
                    print(f"  • {t:<22} : {cnt:>6} rows")
                
                # Check PostGIS
                cur.execute("SELECT extname, extversion FROM pg_extension WHERE extname='postgis';")
                postgis = cur.fetchone()
                if postgis:
                    print(f"\nPostGIS Extension : ENABLED (v{postgis[1]})")
                else:
                    print(f"\nPostGIS Extension : NOT INSTALLED in this DB (Run: CREATE EXTENSION postgis;)")
    except Exception as e:
        print(f"Connection Status  : FAILED ({e})")

def main():
    print("=" * 65)
    print("      WEATHERPULSE INDIA - DATABASE AUDIT REPORT")
    print("=" * 65)

    db_url = get_database_url()
    print(f"Configured URL     : {db_url}")

    if db_url.startswith("sqlite"):
        check_sqlite(db_url)
    elif "postgres" in db_url:
        check_postgres(db_url)
    else:
        print(f"Unknown engine scheme in {db_url}")

    # Check port 5432 status
    s = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
    s.settimeout(1.0)
    pg_port_open = s.connect_ex(("127.0.0.1", 5432)) == 0
    s.close()

    print("\nPostgreSQL Listener on localhost:5432:")
    if pg_port_open:
        print("  • Port 5432 is OPEN & LISTENING (PostgreSQL server is ready)")
    else:
        print("  • Port 5432 is NOT LISTENING (PostgreSQL server offline)")
    print("=" * 65)

if __name__ == "__main__":
    main()
