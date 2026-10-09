import psycopg
import urllib.parse

pwd = "Vedmau@rya#29"
encoded_pwd = urllib.parse.quote_plus(pwd)

print("=" * 60)
print("  POSTGRESQL & POSTGIS INITIALIZATION FOR WEATHERPULSE")
print("=" * 60)
print(f"Encoded Password: {encoded_pwd}")

try:
    # 1. Connect to default postgres DB
    with psycopg.connect(
        host="localhost",
        port=5432,
        user="postgres",
        password=pwd,
        dbname="postgres",
        connect_timeout=3
    ) as conn:
        conn.autocommit = True
        print(" Connected to PostgreSQL as superuser 'postgres'!")
        
        # 2. Check or create weatherpulse_db
        with conn.cursor() as cur:
            cur.execute("SELECT 1 FROM pg_database WHERE datname = 'weatherpulse_db';")
            if not cur.fetchone():
                print(" Creating 'weatherpulse_db' database...")
                cur.execute("CREATE DATABASE weatherpulse_db;")
                print(" 'weatherpulse_db' created successfully!")
            else:
                print(" 'weatherpulse_db' already exists!")

    # 3. Connect to weatherpulse_db and enable PostGIS
    with psycopg.connect(
        host="localhost",
        port=5432,
        user="postgres",
        password=pwd,
        dbname="weatherpulse_db",
        connect_timeout=3
    ) as conn:
        conn.autocommit = True
        with conn.cursor() as cur:
            try:
                cur.execute("CREATE EXTENSION IF NOT EXISTS postgis;")
                print(" PostGIS extension successfully enabled on weatherpulse_db!")
                cur.execute("SELECT postgis_full_version();")
                v = cur.fetchone()[0]
                print(f"   PostGIS Version Info: {v[:60]}...")
            except Exception as e:
                print(f" PostGIS extension warning: {e}")

    # Output recommended connection string
    pg_url = f"postgresql+psycopg://postgres:{encoded_pwd}@localhost:5432/weatherpulse_db"
    print("\nTarget DATABASE_URL for .env:")
    print(f"  {pg_url}")
    print("=" * 60)

except Exception as e:
    print(f"Connection Failed: {e}")
