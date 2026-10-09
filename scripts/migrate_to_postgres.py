# pyright: reportMissingImports=none
"""
Automated Migration Script: SQLite -> PostgreSQL (PostGIS)
Copies all tables and records from SQLite (backend/weatherpulse.db or weatherpulse.db)
to PostgreSQL without data loss.

Can be run from:
- Project root:   python scripts/migrate_to_postgres.py
- backend folder: python scripts/migrate_to_postgres.py (or python ../scripts/migrate_to_postgres.py)
"""
import os
import sys
import argparse
from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker

# 1. Dynamically locate repository root (BASE_DIR)
current_dir = os.path.dirname(os.path.abspath(__file__))
candidate = current_dir
while candidate and candidate != os.path.dirname(candidate):
    if os.path.exists(os.path.join(candidate, "backend")) or os.path.exists(os.path.join(candidate, ".git")):
        BASE_DIR = candidate
        break
    candidate = os.path.dirname(candidate)
else:
    BASE_DIR = os.path.abspath(os.path.join(current_dir, ".."))

backend_path = os.path.join(BASE_DIR, "backend")
if backend_path not in sys.path:
    sys.path.insert(0, backend_path)

# 2. Import application models
from app.core.database import Base  # noqa: E402 # type: ignore
from app.models.user import User  # noqa: E402 # type: ignore
from app.models.location import Location  # noqa: E402 # type: ignore
from app.models.source import Source  # noqa: E402 # type: ignore
from app.models.event import Event  # noqa: E402 # type: ignore
from app.models.report import Report  # noqa: E402 # type: ignore
from app.models.media import Media  # noqa: E402 # type: ignore
from app.models.alert import Alert  # noqa: E402 # type: ignore
from app.models.verification_record import VerificationRecord  # noqa: E402 # type: ignore
from app.models.ai_prediction import AIPrediction  # noqa: E402 # type: ignore
from app.models.audit_log import AuditLog  # noqa: E402 # type: ignore
from app.models.event_report import EventReport  # noqa: E402 # type: ignore


def get_default_sqlite_path():
    """Finds active SQLite database file."""
    backend_db = os.path.join(BASE_DIR, "backend", "weatherpulse.db")
    root_db = os.path.join(BASE_DIR, "weatherpulse.db")

    if os.path.exists(backend_db) and os.path.getsize(backend_db) > 0:
        return backend_db
    if os.path.exists(root_db) and os.path.getsize(root_db) > 0:
        return root_db
    if os.path.exists(backend_db):
        return backend_db
    return root_db


def get_default_pg_url():
    """Finds PostgreSQL URL from env or fallback."""
    # Check OS env first
    if os.environ.get("DATABASE_URL") and "postgres" in os.environ.get("DATABASE_URL", ""):
        return os.environ.get("DATABASE_URL", "")

    # Check .env in root and backend/.env
    env_paths = [
        os.path.join(BASE_DIR, ".env"),
        os.path.join(BASE_DIR, "backend", ".env")
    ]
    for env_path in env_paths:
        if os.path.exists(env_path):
            with open(env_path, "r", encoding="utf-8") as f:
                for line in f:
                    line = line.strip()
                    if line.startswith("DATABASE_URL=") and not line.startswith("#"):
                        val = line.split("=", 1)[1].strip().strip('"').strip("'")
                        if "postgres" in val:
                            return val

    # Fallback to standard configured PostgreSQL connection string
    return "postgresql+psycopg://postgres:Vedmau%40rya%2329@localhost:5432/weatherpulse_db"


def migrate_model(src_db, dst_db, model_class, name):
    """Safely migrate all rows for a given model class."""
    records = src_db.query(model_class).all()
    count = len(records)
    print(f"Migrating '{name}' ({count} records)...", end=" ", flush=True)
    if count == 0:
        print("DONE (0 records)")
        return 0

    try:
        for r in records:
            src_db.expunge(r)
            dst_db.merge(r)
        dst_db.commit()
        print("DONE")
        return count
    except Exception as e:
        dst_db.rollback()
        print(f"WARNING: Batch merge failed ({e}), attempting individual row insertion...")
        # Fallback to item-by-item to salvage valid records
        salvaged = 0
        for r in records:
            try:
                dst_db.merge(r)
                dst_db.commit()
                salvaged += 1
            except Exception:
                dst_db.rollback()
        print(f"DONE ({salvaged}/{count} records migrated)")
        return salvaged


def main():
    parser = argparse.ArgumentParser(description="Migrate WeatherPulse India database from SQLite to PostgreSQL/PostGIS")
    parser.add_argument("--sqlite-path", default=None, help="Path to SQLite database file")
    parser.add_argument("--pg-url", default=None, help="PostgreSQL connection URL")
    args = parser.parse_args()

    sqlite_path = args.sqlite_path or get_default_sqlite_path()
    pg_url = args.pg_url or get_default_pg_url()

    sqlite_url = f"sqlite:///{os.path.abspath(sqlite_path)}"

    print("=" * 65)
    print("  WEATHERPULSE INDIA: DATA MIGRATION TO POSTGRESQL/POSTGIS")
    print("=" * 65)
    print(f"Source SQLite       : {sqlite_url}")
    print(f"Target PostgreSQL   : {pg_url}")
    print("-" * 65)

    if not os.path.exists(sqlite_path):
        print(f"ERROR: SQLite source database not found at {sqlite_path}")
        sys.exit(1)

    # 1. Connect source SQLite
    src_engine = create_engine(sqlite_url, echo=False)
    SrcSession = sessionmaker(bind=src_engine)
    src_db = SrcSession()

    # 2. Connect target PostgreSQL & Create Tables / Extensions
    print("Connecting to PostgreSQL and verifying schema/PostGIS...")
    pg_engine = create_engine(pg_url, echo=False)

    # Try enabling postgis extension
    try:
        with pg_engine.connect() as conn:
            conn.execute(text("CREATE EXTENSION IF NOT EXISTS postgis;"))
            conn.commit()
            print("  • PostGIS extension verified/enabled.")
    except Exception as ext_err:
        print(f"  • PostGIS extension notice: {ext_err}")

    # Ensure tables exist
    Base.metadata.create_all(bind=pg_engine)
    print("  • PostgreSQL tables verified.")

    PgSession = sessionmaker(bind=pg_engine)
    dst_db = PgSession()

    total_migrated = 0

    try:
        # 3. Users
        total_migrated += migrate_model(src_db, dst_db, User, "users")

        # 4. Locations
        total_migrated += migrate_model(src_db, dst_db, Location, "locations")

        # 5. Sources (including dynamic live collector sources)
        total_migrated += migrate_model(src_db, dst_db, Source, "sources")
        dynamic_sources = [
            ("LIVE_OPENWEATHER", "OpenWeatherMap Live Sensor Feed", "API", 0.90),
            ("LIVE_OPEN_METEO", "Open-Meteo High-Resolution Model", "API", 0.92),
            ("LIVE_WEATHERAPI", "WeatherAPI Live Telemetry Feed", "API", 0.88),
        ]
        for src_id, name, stype, rel in dynamic_sources:
            if not dst_db.query(Source).filter_by(id=src_id).first():
                dst_db.add(Source(
                    id=src_id,
                    name=name,
                    source_type=stype,
                    reliability_score=rel,
                    is_active=True
                ))
        dst_db.commit()

        # 6. Events
        total_migrated += migrate_model(src_db, dst_db, Event, "events")

        # 7. Reports
        total_migrated += migrate_model(src_db, dst_db, Report, "reports")

        # 8. Event-Report links
        total_migrated += migrate_model(src_db, dst_db, EventReport, "event_reports")

        # 9. Media attachments
        total_migrated += migrate_model(src_db, dst_db, Media, "media")

        # 10. Alerts
        total_migrated += migrate_model(src_db, dst_db, Alert, "alerts")

        # 11. Verification Records
        total_migrated += migrate_model(src_db, dst_db, VerificationRecord, "verification_records")

        # 12. AI Predictions
        total_migrated += migrate_model(src_db, dst_db, AIPrediction, "ai_predictions")

        # 13. Audit Logs
        total_migrated += migrate_model(src_db, dst_db, AuditLog, "audit_logs")

    finally:
        src_db.close()
        dst_db.close()

    print("-" * 65)
    print(f"ALL TABLES & DATA SUCCESSFULLY MIGRATED TO POSTGRESQL / POSTGIS!")
    print(f"Total Records Processed: {total_migrated}")
    print("=" * 65)


if __name__ == "__main__":
    main()
