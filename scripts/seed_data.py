import os
import sys
import random
import uuid
from datetime import datetime, timezone, timedelta

# Add backend directory to sys.path
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.append(os.path.join(BASE_DIR, "backend"))

from app.core.database import Base, engine, SessionLocal
from app.core.security import get_password_hash
from app.models.user import User, UserRole
from app.models.source import Source
from app.models.event import Event
from app.models.report import Report
from app.models.event_report import EventReport
from app.models.ai_prediction import AIPrediction
from app.models.media import Media
from app.models.alert import Alert
from app.geospatial.gazetteer import INDIAN_LOCATIONS
from app.ai.classifier import CATEGORIES

def seed_database():
    print("Creating all database tables...")
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()

    try:
        # 1. Seed Users
        print("Seeding administrative & duty officer users...")
        if db.query(User).count() == 0:
            users_data = [
                ("admin", "admin@weatherpulse.gov.in", "Director General (Disaster Operations)", "admin123", UserRole.ADMIN.value, "Ministry of Earth Sciences"),
                ("analyst", "analyst@weatherpulse.gov.in", "Senior Meteorological Analyst", "analyst123", UserRole.ANALYST.value, "National Weather Intelligence Centre"),
                ("verifier", "verifier@imd.gov.in", "IMD Duty Verification Officer", "verifier123", UserRole.VERIFIER.value, "IMD Weather Watch Cell"),
                ("citizen", "citizen@weatherpulse.gov.in", "Verified Volunteer Observer", "citizen123", UserRole.VIEWER.value, "Citizen Weather Network")
            ]
            for username, email, full_name, pwd, role, dept in users_data:
                u = User(
                    email=email,
                    username=username,
                    full_name=full_name,
                    hashed_password=get_password_hash(pwd),
                    role=role,
                    department=dept
                )
                db.add(u)
            db.commit()

        # 2. Seed Sources
        print("Seeding ingestion sources...")
        if db.query(Source).count() == 0:
            sources_data = [
                ("IMD_OPEN_DATA", "India Meteorological Department (IMD) Open Data", "IMD_API", "https://mausam.imd.gov.in/api/v2", 0.98, 38, "Connected"),
                ("TWITTER_FEED", "Social Media Stream (#IMD, #WeatherPulse)", "SOCIAL_MEDIA", "https://api.twitter.com/2/tweets/search/stream", 0.68, 52, "Connected"),
                ("CITIZEN_PORTAL", "WeatherPulse Citizen Crowd Reports", "CITIZEN", "https://weatherpulse.gov.in/api/v1/reports/citizen", 0.76, 24, "Connected"),
                ("GOVT_WEATHER_API", "National Automatic Weather Stations (AWS) Network", "WEATHER_API", "https://aws.imd.gov.in/api/telemetry", 0.94, 45, "Connected"),
                ("PUBLIC_DATASET", "Open Government Data (OGD) Platform India", "PUBLIC_DATASET", "https://data.gov.in/api/datastore/resource.json", 0.90, 85, "Connected"),
                ("SIMULATOR", "WeatherPulse Real-time Data Simulator", "SIMULATOR", "internal://stream.simulator", 0.85, 5, "Simulation Mode")
            ]
            for sid, name, stype, url, rel, lat, status in sources_data:
                s = Source(
                    id=sid,
                    name=name,
                    source_type=stype,
                    endpoint_url=url,
                    reliability_score=rel,
                    latency_ms=lat,
                    status_label=status,
                    records_ingested=random.randint(120, 850)
                )
                db.add(s)
            db.commit()

        # 3. Seed Events & Reports
        if db.query(Event).count() == 0:
            print("Seeding 25+ clustered events across India...")
            now = datetime.now(timezone.utc)

            # Define seed scenarios for 22 cities across India
            SEED_SCENARIOS = [
                ("Heavy Rainfall", "HIGH", "Lucknow", "Uttar Pradesh", "Heavy monsoon downpours causing extensive waterlogging across Gomti Nagar, Hazratganj, and Charbagh. Transport services impacted."),
                ("Flood", "CRITICAL", "Patna", "Bihar", "Ganga and Punpun rivers breached danger mark; severe inundation in low-lying localities of Patliputra, Kankarbagh, and Rajendra Nagar."),
                ("Thunderstorm", "HIGH", "Delhi", "Delhi", "Squall with gusty winds clocking 70 km/h and intense lightning across New Delhi, Rohini, and Connaught Place. Tree falls reported."),
                ("Heatwave", "HIGH", "Jaipur", "Rajasthan", "Severe heatwave with maximum temperatures hovering near 46.8°C across Jaipur and western Rajasthan districts."),
                ("Dense Fog", "MEDIUM", "Chandigarh", "Chandigarh", "Visibility dropped to zero across Chandigarh-Mohali international runway and NH-44 during early morning hours."),
                ("Strong Wind", "HIGH", "Mumbai", "Maharashtra", "Strong south-westerly coastal winds exceeding 60 km/h with 4.5m swell waves reported along Marine Drive and Bandra-Worli Sea Link."),
                ("Dust Storm", "MEDIUM", "Jodhpur", "Rajasthan", "Dense dust storm swept through Jodhpur and Barmer border regions, causing sudden drop in horizontal visibility to 200m."),
                ("Cyclone", "CRITICAL", "Visakhapatnam", "Andhra Pradesh", "Severe Cyclonic Storm tracking towards northern Andhra Pradesh and Odisha coastline; storm surge warning issued."),
                ("Hailstorm", "HIGH", "Nashik", "Maharashtra", "Unseasonal hailstorm and squally showers hit agricultural belts around Nashik, causing damage to grape vineyards."),
                ("Cloudburst", "CRITICAL", "Dehradun", "Uttarakhand", "Intense localized cloudburst triggered flash floods along Rispana river catchment, damaging approach roads."),
                ("Lightning", "HIGH", "Varanasi", "Uttar Pradesh", "Intense cloud-to-ground lightning discharge observed over rural blocks of Varanasi and Chandauli."),
                ("Flash Flood", "CRITICAL", "Guwahati", "Assam", "Brahmaputra tributaries overflowing rapidly; flash flood warnings in effect across Kamrup Metropolitan and Anil Nagar."),
                ("Rainfall", "LOW", "Bengaluru", "Karnataka", "Continuous gentle to moderate monsoon showers covering Bengaluru Urban, Whitefield, and Electronic City."),
                ("Cold Wave", "HIGH", "Srinagar", "Jammu and Kashmir", "Sub-zero chill with night temperatures plunging to -4.2°C; Dal Lake edges freezing over."),
                ("Heavy Rainfall", "HIGH", "Kolkata", "West Bengal", "Intense rain bands from coastal Bay of Bengal causing severe water accumulation in Central Kolkata and Salt Lake."),
                ("Strong Wind", "MEDIUM", "Chennai", "Tamil Nadu", "Gusty onshore winds and intermittent rain squalls along Marina Beach and coastal Chennai districts."),
                ("Thunderstorm", "MEDIUM", "Hyderabad", "Telangana", "Evening thundershowers with frequent lightning strikes over HITEC City, Gachibowli, and Banjara Hills."),
                ("Heatwave", "HIGH", "Ahmedabad", "Gujarat", "Orange alert heatwave conditions prevailing across Ahmedabad and Gandhinagar with daytime highs touching 45°C."),
                ("Flash Flood", "HIGH", "Kochi", "Kerala", "Torrential monsoon surge overflowing Periyar river embankments in Ernakulam district."),
                ("Thunderstorm", "MEDIUM", "Bhopal", "Madhya Pradesh", "Scattered pre-monsoon convective thunderstorms over Upper Lake and MP Nagar Bhopal."),
                ("Dense Fog", "MEDIUM", "Amritsar", "Punjab", "Thick winter radiation fog engulfing Amritsar and border sectors, slowing rail freight traffic."),
                ("Heavy Rainfall", "HIGH", "Bhubaneswar", "Odisha", "Active monsoon trough dumping 85mm rainfall within 6 hours across Bhubaneswar and Cuttack urban belts.")
            ]

            sample_media_images = [
                "https://images.unsplash.com/photo-1519692933481-e162a57d6721?w=800&auto=format&fit=crop&q=60",
                "https://images.unsplash.com/photo-1534274988757-a28bf1a57c17?w=800&auto=format&fit=crop&q=60",
                "https://images.unsplash.com/photo-1527482797697-8795b05a13fe?w=800&auto=format&fit=crop&q=60",
                "https://images.unsplash.com/photo-1515694346937-94d85e41e6f0?w=800&auto=format&fit=crop&q=60"
            ]

            sources_list = ["IMD_OPEN_DATA", "TWITTER_FEED", "CITIZEN_PORTAL", "GOVT_WEATHER_API"]

            for i, (category, severity, city, state, summary) in enumerate(SEED_SCENARIOS):
                loc = next((l for l in INDIAN_LOCATIONS if l["city"] == city), None)
                if not loc:
                    continue

                event_id = f"EVT-{city[:3].upper()}-2026-{(i+1):03d}"
                report_count = random.randint(4, 18)
                source_count = min(report_count, random.randint(2, 4))
                ver_status = "VERIFIED" if severity in ["HIGH", "CRITICAL"] and i % 2 == 0 else ("PENDING" if i % 3 == 0 else "VERIFIED")
                confidence = round(random.uniform(0.88, 0.98), 2)
                event_time = now - timedelta(hours=random.randint(1, 24), minutes=random.randint(0, 59))

                event = Event(
                    id=event_id,
                    title=f"{category} alert in {city}, {state}",
                    event_category=category,
                    severity=severity,
                    confidence=confidence,
                    verification_status=ver_status,
                    city=city,
                    district=loc.get("district", city),
                    state=state,
                    latitude=loc["lat"],
                    longitude=loc["lon"],
                    radius_km=15.0,
                    report_count=report_count,
                    source_count=source_count,
                    first_reported_at=event_time,
                    last_reported_at=event_time + timedelta(minutes=random.randint(20, 120)),
                    is_active=True,
                    summary=summary
                )
                db.add(event)
                db.flush()

                # Generate reports for this event
                for r_idx in range(report_count):
                    rep_id = f"REP-2026-{event_id.split('-')[-1]}{r_idx+1:03d}"
                    src = random.choice(sources_list)
                    trust_score = random.randint(85, 99) if ver_status == "VERIFIED" else random.randint(55, 84)
                    rep_time = event_time + timedelta(minutes=r_idx * 6)
                    
                    rep_text = f"{summary.split('.')[0]}. Observation recorded near {loc['city']} coordinates."
                    if src == "TWITTER_FEED":
                        rep_text = f"{rep_text} #IMD #WeatherPulse #{city}Rain"

                    report = Report(
                        id=rep_id,
                        source_id=src,
                        event_id=event.id,
                        text=rep_text,
                        event_category=category,
                        severity=severity,
                        confidence=confidence,
                        trust_score=trust_score,
                        verification_status=ver_status,
                        city=city,
                        district=loc.get("district", city),
                        state=state,
                        latitude=loc["lat"] + random.uniform(-0.015, 0.015),
                        longitude=loc["lon"] + random.uniform(-0.015, 0.015),
                        reported_at=rep_time,
                        ingested_at=rep_time + timedelta(seconds=12),
                        processing_status="PROCESSED"
                    )
                    db.add(report)
                    db.flush()

                    # Add event_report link
                    db.add(EventReport(
                        event_id=event.id,
                        report_id=report.id,
                        similarity_score=round(random.uniform(0.88, 0.99), 2)
                    ))

                    # Add AI prediction
                    db.add(AIPrediction(
                        report_id=report.id,
                        predicted_category=category,
                        confidence=confidence,
                        predicted_severity=severity,
                        extracted_location=f"{city}, {state}",
                        extracted_state=state,
                        trust_score=trust_score,
                        reasoning_summary=f"High multi-source agreement ({source_count} sources) corroborating {category} in {city}."
                    ))

                    # Attach media to first report
                    if r_idx == 0:
                        db.add(Media(
                            report_id=report.id,
                            media_type="IMAGE",
                            media_url=random.choice(sample_media_images),
                            caption=f"Ground photo from {city}, {state}"
                        ))

            # 4. Seed Critical Alerts (Section 27)
            print("Seeding active emergency alerts...")
            sample_alerts = [
                ("CRITICAL", "Flood", "Patna", "Bihar", 25.5941, 85.1376, 142, "+38% in last 30 minutes", "Ganga water level crossed danger limit by 1.2m; emergency evacuation centers activated."),
                ("CRITICAL", "Cyclone", "Visakhapatnam", "Andhra Pradesh", 17.6868, 83.2185, 98, "+24% in last 30 minutes", "Severe cyclonic system approaching northern Andhra coast; ports hoisted great danger signal 8."),
                ("HIGH", "Heavy Rainfall", "Lucknow", "Uttar Pradesh", 26.8467, 80.9462, 115, "+31% in last 30 minutes", "Continuous downpours causing severe waterlogging on arterial roads; orange alert in force."),
                ("HIGH", "Heatwave", "Jaipur", "Rajasthan", 26.9124, 75.7873, 76, "+12% in last 30 minutes", "Severe daytime heatwave alert; peak temperatures expected to remain above 46°C.")
            ]
            for level, cat, city, state, lat, lon, r_cnt, trend, desc in sample_alerts:
                alt = Alert(
                    id=f"ALT-{city[:3].upper()}-2026",
                    title=f"{level}: {cat} Emergency Warning in {city}",
                    description=desc,
                    alert_level=level,
                    category=cat,
                    city=city,
                    district=city,
                    state=state,
                    latitude=lat,
                    longitude=lon,
                    report_count=r_cnt,
                    trend_description=trend,
                    is_active=True,
                    issued_at=now - timedelta(minutes=45)
                )
                db.add(alt)

            db.commit()
            print("Seeding completed successfully! 22+ events, 150+ reports, 4 emergency alerts loaded.")

    finally:
        db.close()

if __name__ == "__main__":
    seed_database()
