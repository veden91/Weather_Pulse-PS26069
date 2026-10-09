import re
from typing import Dict, Any, Tuple
from app.geospatial.gazetteer import extract_location_from_text

# 16 standard SIH weather event categories
CATEGORIES = [
    "Cloudburst",
    "Flash Flood",
    "Cyclone",
    "Landslide",
    "Hailstorm",
    "Heavy Rainfall",
    "Flood",
    "Lightning",
    "Thunderstorm",
    "Dust Storm",
    "Dense Fog",
    "Fog",
    "Heatwave",
    "Cold Wave",
    "Strong Wind",
    "Rainfall"
]

KEYWORDS_MAP = {
    "Cloudburst": ["cloudburst", "cloud burst", "intense deluge", "torrential cloudburst", "sudden downpour mountains"],
    "Flash Flood": ["flash flood", "flash flooding", "water swept away", "nallah overflowing", "drain collapse flooding"],
    "Flood": ["flood", "flooding", "waterlogged", "waterlogging", "submerged", "inundation", "inundated", "deluge", "water standing"],
    "Cyclone": ["cyclone", "cyclonic", "super cyclone", "landfall", "depression bay of bengal", "storm surge"],
    "Landslide": ["landslide", "mudslide", "debris flow", "rocks falling highway", "road blocked slope"],
    "Hailstorm": ["hail", "hailstorm", "ice pellets", "hail stones", "crop damaged by hail"],
    "Lightning": ["lightning", "lightning strike", "thunderbolt", "electrocution lightning"],
    "Thunderstorm": ["thunderstorm", "thunder", "thunder and lightning", "squall", "electric storm", "severe thundershower"],
    "Dust Storm": ["dust storm", "sandstorm", "andhi", "dust haze", "visibility dust"],
    "Dense Fog": ["dense fog", "zero visibility", "dense smog", "thick fog flights delayed", "heavy morning fog"],
    "Fog": ["fog", "foggy", "mist", "shallow fog", "reduced visibility"],
    "Heatwave": ["heatwave", "heat wave", "loo", "scorching sun", "mercury crossed 45", "extreme heat", "blistering heat"],
    "Cold Wave": ["cold wave", "severe cold", "chilly winds", "frost", "freezing temperatures", "sheet lahar"],
    "Strong Wind": ["strong wind", "gale", "gusty wind", "high wind", "trees uprooted", "tin roofs blown"],
    "Heavy Rainfall": ["heavy rain", "heavy rainfall", "torrential rain", "very heavy rain", "excessive rainfall", "monsoon fury", "incessant rain"],
    "Rainfall": ["rain", "raining", "light rain", "drizzle", "showers", "wet weather", "overcast with rain"]
}

SEVERITY_KEYWORDS = {
    "CRITICAL": ["emergency", "red alert", "submerged", "cloudburst", "flash flood", "super cyclone", "deadly", "fatal", "disaster", "landslide blocked", "evacuation"],
    "HIGH": ["heavy rainfall", "orange alert", "severe", "inundated", "waterlogged", "uprooted", "power outage", "flights delayed", "traffic halted", "warning"],
    "MEDIUM": ["yellow alert", "moderate", "thunderstorm", "waterlogging", "gusty", "scattered", "slow traffic", "advisory"],
    "LOW": ["light rain", "drizzle", "mist", "mild", "passing shower", "slight"]
}

class WeatherClassifier:
    def __init__(self):
        # We can compile regex patterns for rapid classification
        self.category_patterns = {
            cat: [re.compile(r'\b' + re.escape(kw) + r'\b', re.IGNORECASE) for kw in kws]
            for cat, kws in KEYWORDS_MAP.items()
        }

    def classify(self, text: str, location_hint: str = None) -> Dict[str, Any]:
        """
        Classifies incoming text into an event category, severity, confidence, and extracts location.
        """
        text_clean = text.strip()
        
        # 1. Category matching with priority weighting
        best_category = "Rainfall"
        best_confidence = 0.70
        matched = False

        # Check in order of specificity (Cloudburst, Flash Flood, Cyclone higher priority than general Rainfall)
        for cat in CATEGORIES:
            patterns = self.category_patterns.get(cat, [])
            for p in patterns:
                if p.search(text_clean):
                    best_category = cat
                    # Calibrate confidence based on match specificity
                    if cat in ["Cloudburst", "Cyclone", "Flash Flood", "Landslide"]:
                        best_confidence = 0.96
                    elif cat in ["Heavy Rainfall", "Flood", "Hailstorm", "Dust Storm"]:
                        best_confidence = 0.94
                    elif cat in ["Thunderstorm", "Heatwave", "Dense Fog", "Cold Wave"]:
                        best_confidence = 0.91
                    else:
                        best_confidence = 0.85
                    matched = True
                    break
            if matched:
                break

        # 2. Determine severity
        text_lower = text_clean.lower()
        severity = "MEDIUM"
        if best_category in ["Cloudburst", "Flash Flood", "Cyclone", "Landslide"]:
            severity = "CRITICAL"
        elif any(kw in text_lower for kw in SEVERITY_KEYWORDS["CRITICAL"]):
            severity = "CRITICAL"
        elif best_category in ["Heavy Rainfall", "Flood", "Hailstorm", "Dense Fog"] or any(kw in text_lower for kw in SEVERITY_KEYWORDS["HIGH"]):
            severity = "HIGH"
        elif any(kw in text_lower for kw in SEVERITY_KEYWORDS["LOW"]):
            severity = "LOW"

        # 3. Location extraction
        loc_data = extract_location_from_text(text_clean)
        if not loc_data and location_hint:
            loc_data = extract_location_from_text(location_hint)

        location_name = "New Delhi, Delhi"
        state = "Delhi"
        city = "Delhi"
        district = "New Delhi"
        lat = 28.6139
        lon = 77.2090

        if loc_data:
            city = loc_data["city"]
            district = loc_data.get("district", loc_data["city"])
            state = loc_data["state"]
            lat = loc_data["lat"]
            lon = loc_data["lon"]
            # Find specific locality if matched
            for alias in loc_data.get("aliases", []):
                if alias in text_lower:
                    location_name = f"{alias.title()}, {city}"
                    break
            else:
                location_name = f"{city}, {state}"
        elif location_hint:
            location_name = location_hint

        return {
            "event_type": best_category,
            "location": location_name,
            "state": state,
            "city": city,
            "district": district,
            "severity": severity,
            "confidence": round(best_confidence, 2),
            "latitude": lat,
            "longitude": lon
        }

classifier = WeatherClassifier()
