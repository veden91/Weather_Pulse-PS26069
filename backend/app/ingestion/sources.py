import random
import asyncio
import httpx
import logging
from datetime import datetime, timezone
from typing import List, Dict, Any
from app.ingestion.base import BaseSourceCollector
from app.geospatial.gazetteer import INDIAN_LOCATIONS
from app.core.config import settings

logger = logging.getLogger(__name__)

REALISTIC_WEATHER_SCENARIOS = [
    {
        "text": "Heavy rainfall has caused severe waterlogging in Gomti Nagar and Hazratganj, Lucknow. Traffic diverted.",
        "category": "Heavy Rainfall",
        "city": "Lucknow",
        "state": "Uttar Pradesh",
        "severity": "HIGH",
        "has_media": True
    },
    {
        "text": "Severe thunderstorm with wind gusts exceeding 65 km/h across Connaught Place and Rohini, New Delhi. Trees uprooted.",
        "category": "Thunderstorm",
        "city": "Delhi",
        "state": "Delhi",
        "severity": "HIGH",
        "has_media": True
    },
    {
        "text": "Water levels in Ganga rising rapidly, low lying areas in Patliputra and Kankarbagh Patna inundated with flash flood warning.",
        "category": "Flood",
        "city": "Patna",
        "state": "Bihar",
        "severity": "CRITICAL",
        "has_media": True
    },
    {
        "text": "Scorching heatwave conditions prevail across Jaipur and Bikaner with daytime maximum temperature touching 46.5°C.",
        "category": "Heatwave",
        "city": "Jaipur",
        "state": "Rajasthan",
        "severity": "HIGH",
        "has_media": False
    },
    {
        "text": "Extremely dense fog blanketed Chandigarh and Mohali reducing runway visibility to under 50 meters, morning flights delayed.",
        "category": "Dense Fog",
        "city": "Chandigarh",
        "state": "Chandigarh",
        "severity": "MEDIUM",
        "has_media": True
    },
    {
        "text": "Severe squall and gale-force coastal winds hit Mumbai Marine Drive and Bandra, high tide advisory issued for fishermen.",
        "category": "Strong Wind",
        "city": "Mumbai",
        "state": "Maharashtra",
        "severity": "HIGH",
        "has_media": True
    },
    {
        "text": "Intense dust storm accompanied by 55 km/h winds sweep western Rajasthan Jodhpur region reducing highway visibility.",
        "category": "Dust Storm",
        "city": "Jodhpur",
        "state": "Rajasthan",
        "severity": "MEDIUM",
        "has_media": False
    },
    {
        "text": "Deep depression over Bay of Bengal intensifies into severe cyclonic storm approaching coastal Visakhapatnam and Odisha.",
        "category": "Cyclone",
        "city": "Visakhapatnam",
        "state": "Andhra Pradesh",
        "severity": "CRITICAL",
        "has_media": True
    },
    {
        "text": "Massive hailstorm batters grape vineyards and rural farms near Nashik with stones size of golf balls.",
        "category": "Hailstorm",
        "city": "Nashik",
        "state": "Maharashtra",
        "severity": "HIGH",
        "has_media": True
    },
    {
        "text": "Torrential cloudburst reported near higher reaches of Dehradun, torrential runoff overflowing seasonal drains.",
        "category": "Cloudburst",
        "city": "Dehradun",
        "state": "Uttarakhand",
        "severity": "CRITICAL",
        "has_media": True
    },
    {
        "text": "Steady moderate monsoon showers across Bengaluru Whitefield and Electronic City bringing relief from heat.",
        "category": "Rainfall",
        "city": "Bengaluru",
        "state": "Karnataka",
        "severity": "LOW",
        "has_media": False
    },
    {
        "text": "Frequent lightning strikes recorded over rural outskirts of Varanasi during evening thunderstorm.",
        "category": "Lightning",
        "city": "Varanasi",
        "state": "Uttar Pradesh",
        "severity": "HIGH",
        "has_media": False
    }
]

class IMDCollector(BaseSourceCollector):
    def get_source_id(self) -> str:
        return "IMD_OPEN_DATA"

    def get_source_name(self) -> str:
        return "India Meteorological Department (IMD) Open Data"

    def get_source_type(self) -> str:
        return "IMD_API"

    def collect(self) -> List[Dict[str, Any]]:
        # Produces authoritative meteorological telemetry format
        scenario = random.choice(REALISTIC_WEATHER_SCENARIOS)
        loc = next((l for l in INDIAN_LOCATIONS if l["city"] == scenario["city"]), INDIAN_LOCATIONS[0])
        return [{
            "source_id": self.get_source_id(),
            "source_type": self.get_source_type(),
            "text": f"[IMD Bulletins] {scenario['text']}",
            "city": loc["city"],
            "state": loc["state"],
            "district": loc.get("district", loc["city"]),
            "latitude": loc["lat"],
            "longitude": loc["lon"],
            "has_media": scenario["has_media"],
            "raw_payload": {"feed": "imd_nowcast_v2", "station_code": f"IN-{loc['city'][:3].upper()}"}
        }]

class SocialMediaAdapter(BaseSourceCollector):
    def get_source_id(self) -> str:
        return "TWITTER_FEED"

    def get_source_name(self) -> str:
        return "Social Media Feed (#IMD, #WeatherPulse)"

    def get_source_type(self) -> str:
        return "SOCIAL_MEDIA"

    def collect(self) -> List[Dict[str, Any]]:
        scenario = random.choice(REALISTIC_WEATHER_SCENARIOS)
        loc = next((l for l in INDIAN_LOCATIONS if l["city"] == scenario["city"]), INDIAN_LOCATIONS[0])
        # Add social hashtags
        tweet = f"{scenario['text']} #IMD #WeatherAlert #{loc['city']}Weather"
        return [{
            "source_id": self.get_source_id(),
            "source_type": self.get_source_type(),
            "text": tweet,
            "city": loc["city"],
            "state": loc["state"],
            "district": loc.get("district", loc["city"]),
            "latitude": loc["lat"] + random.uniform(-0.02, 0.02),
            "longitude": loc["lon"] + random.uniform(-0.02, 0.02),
            "has_media": scenario["has_media"],
            "raw_payload": {"platform": "X/Twitter", "hashtags": ["IMD", "WeatherAlert"]}
        }]

class CitizenPortalAdapter(BaseSourceCollector):
    def get_source_id(self) -> str:
        return "CITIZEN_PORTAL"

    def get_source_name(self) -> str:
        return "WeatherPulse Citizen Crowd Reports"

    def get_source_type(self) -> str:
        return "CITIZEN"

    def collect(self) -> List[Dict[str, Any]]:
        scenario = random.choice(REALISTIC_WEATHER_SCENARIOS)
        loc = next((l for l in INDIAN_LOCATIONS if l["city"] == scenario["city"]), INDIAN_LOCATIONS[0])
        return [{
            "source_id": self.get_source_id(),
            "source_type": self.get_source_type(),
            "text": f"Citizen crowd report: {scenario['text']}",
            "city": loc["city"],
            "state": loc["state"],
            "district": loc.get("district", loc["city"]),
            "latitude": loc["lat"] + random.uniform(-0.01, 0.01),
            "longitude": loc["lon"] + random.uniform(-0.01, 0.01),
            "has_media": scenario["has_media"],
            "raw_payload": {"channel": "web_mobile_pwa", "verified_user": False}
        }]

class WeatherApiAdapter(BaseSourceCollector):
    def get_source_id(self) -> str:
        return "GOVT_WEATHER_API"

    def get_source_name(self) -> str:
        return "National Weather Station APIs"

    def get_source_type(self) -> str:
        return "WEATHER_API"

    def collect(self) -> List[Dict[str, Any]]:
        scenario = random.choice(REALISTIC_WEATHER_SCENARIOS)
        loc = next((l for l in INDIAN_LOCATIONS if l["city"] == scenario["city"]), INDIAN_LOCATIONS[0])
        return [{
            "source_id": self.get_source_id(),
            "source_type": self.get_source_type(),
            "text": f"Telemetry observation: {scenario['text']}",
            "city": loc["city"],
            "state": loc["state"],
            "district": loc.get("district", loc["city"]),
            "latitude": loc["lat"],
            "longitude": loc["lon"],
            "has_media": False,
            "raw_payload": {"aws_telemetry": True, "quality_flag": 1}
        }]

class PublicDatasetAdapter(BaseSourceCollector):
    def get_source_id(self) -> str:
        return "PUBLIC_DATASET"

    def get_source_name(self) -> str:
        return "Open Government Data (OGD) Platform India"

    def get_source_type(self) -> str:
        return "PUBLIC_DATASET"

    def collect(self) -> List[Dict[str, Any]]:
        scenario = random.choice(REALISTIC_WEATHER_SCENARIOS)
        loc = next((l for l in INDIAN_LOCATIONS if l["city"] == scenario["city"]), INDIAN_LOCATIONS[0])
        return [{
            "source_id": self.get_source_id(),
            "source_type": self.get_source_type(),
            "text": f"Data.gov.in archive record: {scenario['text']}",
            "city": loc["city"],
            "state": loc["state"],
            "district": loc.get("district", loc["city"]),
            "latitude": loc["lat"],
            "longitude": loc["lon"],
            "has_media": False,
            "raw_payload": {"portal": "data.gov.in", "format": "JSON"}
        }]

class LiveOpenWeatherCollector(BaseSourceCollector):
    def get_source_id(self) -> str:
        return "LIVE_OPENWEATHER"
    def get_source_name(self) -> str:
        return "OpenWeatherMap API"
    def get_source_type(self) -> str:
        return "WEATHER_API"

    def collect(self) -> List[Dict[str, Any]]:
        return []

    async def collect_async(self) -> List[Dict[str, Any]]:
        if not settings.OPENWEATHER_API_KEY:
            return []
        
        results = []
        cities = ["Delhi", "Mumbai", "Kolkata", "Chennai", "Bengaluru", "Patna", "Lucknow", "Guwahati"]
        
        async with httpx.AsyncClient() as client:
            for city in cities:
                try:
                    res = await client.get(
                        "https://api.openweathermap.org/data/2.5/weather",
                        params={"q": f"{city},IN", "appid": settings.OPENWEATHER_API_KEY, "units": "metric"}
                    )
                    if res.status_code == 200:
                        data = res.json()
                        temp = data.get("main", {}).get("temp", 0)
                        weather_desc = data.get("weather", [{}])[0].get("description", "")
                        
                        cat = "Cloudy"
                        if "rain" in weather_desc: cat = "Heavy Rainfall"
                        elif "thunderstorm" in weather_desc: cat = "Thunderstorm"
                        elif "fog" in weather_desc: cat = "Dense Fog"
                        elif temp > 40: cat = "Heatwave"
                        
                        text = f"Live OpenWeather observation: {weather_desc.capitalize()}, Temperature: {temp}°C."
                        
                        results.append({
                            "source_id": self.get_source_id(),
                            "source_type": self.get_source_type(),
                            "text": text,
                            "city": city,
                            "state": "Unknown",
                            "latitude": data.get("coord", {}).get("lat", 0),
                            "longitude": data.get("coord", {}).get("lon", 0),
                            "has_media": False,
                            "raw_payload": data
                        })
                except Exception as e:
                    logger.error(f"OpenWeather API Error for {city}: {e}")
        return results

class LiveWeatherApiCollector(BaseSourceCollector):
    def get_source_id(self) -> str:
        return "LIVE_WEATHERAPI"
    def get_source_name(self) -> str:
        return "WeatherAPI.com"
    def get_source_type(self) -> str:
        return "WEATHER_API"

    def collect(self) -> List[Dict[str, Any]]:
        return []

    async def collect_async(self) -> List[Dict[str, Any]]:
        if not settings.WEATHERAPI_KEY:
            return []
        
        results = []
        cities = ["Hyderabad", "Ahmedabad", "Pune", "Jaipur", "Kochi"]
        async with httpx.AsyncClient() as client:
            for city in cities:
                try:
                    res = await client.get(
                        "http://api.weatherapi.com/v1/current.json",
                        params={"key": settings.WEATHERAPI_KEY, "q": city}
                    )
                    if res.status_code == 200:
                        data = res.json()
                        text = f"Live WeatherAPI report: {data['current']['condition']['text']} with {data['current']['precip_mm']}mm precipitation."
                        results.append({
                            "source_id": self.get_source_id(),
                            "source_type": self.get_source_type(),
                            "text": text,
                            "city": city,
                            "state": data.get("location", {}).get("region", "Unknown"),
                            "latitude": data.get("location", {}).get("lat", 0),
                            "longitude": data.get("location", {}).get("lon", 0),
                            "has_media": False,
                            "raw_payload": data
                        })
                except Exception as e:
                    logger.error(f"WeatherAPI Error for {city}: {e}")
        return results

class LiveTwitterCollector(BaseSourceCollector):
    def get_source_id(self) -> str:
        return "LIVE_TWITTER"
    def get_source_name(self) -> str:
        return "Twitter API v2"
    def get_source_type(self) -> str:
        return "SOCIAL_MEDIA"

    def collect(self) -> List[Dict[str, Any]]:
        return []

    async def collect_async(self) -> List[Dict[str, Any]]:
        if not settings.TWITTER_BEARER_TOKEN:
            return []
            
        results = []
        try:
            async with httpx.AsyncClient() as client:
                res = await client.get(
                    "https://api.twitter.com/2/tweets/search/recent",
                    params={"query": "(#IMD OR #WeatherAlert OR #Cyclone) lang:en -is:retweet", "max_results": 10},
                    headers={"Authorization": f"Bearer {settings.TWITTER_BEARER_TOKEN}"}
                )
                if res.status_code == 200:
                    data = res.json()
                    for t in data.get("data", []):
                        # Use default location as NER will resolve it later in processing
                        results.append({
                            "source_id": self.get_source_id(),
                            "source_type": self.get_source_type(),
                            "text": t.get("text", ""),
                            "city": "Unknown",
                            "state": "Unknown",
                            "latitude": 20.0,
                            "longitude": 77.0,
                            "has_media": False,
                            "raw_payload": t
                        })
        except Exception as e:
            logger.error(f"Twitter API Error: {e}")
        return results


SOURCES_REGISTRY = {
    "IMD_OPEN_DATA": IMDCollector(),
    "TWITTER_FEED": LiveTwitterCollector() if settings.TWITTER_BEARER_TOKEN else SocialMediaAdapter(),
    "CITIZEN_PORTAL": CitizenPortalAdapter(),
    "GOVT_WEATHER_API": WeatherApiAdapter(),
    "PUBLIC_DATASET": PublicDatasetAdapter(),
    "LIVE_OPENWEATHER": LiveOpenWeatherCollector(),
    "LIVE_WEATHERAPI": LiveWeatherApiCollector()
}
