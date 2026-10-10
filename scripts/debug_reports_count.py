import psycopg
import urllib.request
import json

pg_url = 'postgresql://postgres:Vedmau%40rya%2329@localhost:5432/weatherpulse_db'
with psycopg.connect(pg_url) as conn:
    with conn.cursor() as cur:
        cur.execute('SELECT COUNT(*) FROM reports;')
        pg_reports = cur.fetchone()[0]
        cur.execute('SELECT COUNT(*) FROM events;')
        pg_events = cur.fetchone()[0]

req = urllib.request.urlopen('http://127.0.0.1:8000/api/v1/analytics/overview')
data = json.loads(req.read().decode())

print("=" * 60)
print(f"PostgreSQL DB reports : {pg_reports}")
print(f"PostgreSQL DB events  : {pg_events}")
print(f"API total_reports     : {data.get('total_reports')}")
print(f"API active_events     : {data.get('active_events')}")
print("=" * 60)
