import re
from typing import Optional, Dict, Any, List
from app.geospatial.haversine import haversine_distance_km

INDIAN_LOCATIONS: List[Dict[str, Any]] = [
    # Uttar Pradesh
    {"city": "Lucknow", "district": "Lucknow", "state": "Uttar Pradesh", "lat": 26.8467, "lon": 80.9462, "aliases": ["gomti nagar", "alambagh", "hazratganj", "indira nagar", "charbagh"]},
    {"city": "Kanpur", "district": "Kanpur Nagar", "state": "Uttar Pradesh", "lat": 26.4499, "lon": 80.3319, "aliases": ["kalyanpur", "civil lines kanpur"]},
    {"city": "Varanasi", "district": "Varanasi", "state": "Uttar Pradesh", "lat": 25.3176, "lon": 82.9739, "aliases": ["banaras", "kashi", "assighat"]},
    {"city": "Prayagraj", "district": "Prayagraj", "state": "Uttar Pradesh", "lat": 25.4358, "lon": 81.8463, "aliases": ["allahabad", "civil lines prayagraj"]},
    {"city": "Agra", "district": "Agra", "state": "Uttar Pradesh", "lat": 27.1767, "lon": 78.0081, "aliases": ["tajganj", "dayalbagh"]},
    {"city": "Noida", "district": "Gautam Buddha Nagar", "state": "Uttar Pradesh", "lat": 28.5355, "lon": 77.3910, "aliases": ["greater noida", "sector 62", "sector 18"]},
    {"city": "Gorakhpur", "district": "Gorakhpur", "state": "Uttar Pradesh", "lat": 26.7606, "lon": 83.3732, "aliases": ["golghar"]},
    
    # Bihar
    {"city": "Patna", "district": "Patna", "state": "Bihar", "lat": 25.5941, "lon": 85.1376, "aliases": ["patliputra", "kankarbagh", "boring road", "danapur", "gandhi maidan"]},
    {"city": "Gaya", "district": "Gaya", "state": "Bihar", "lat": 24.7955, "lon": 85.0002, "aliases": ["bodhgaya"]},
    {"city": "Muzaffarpur", "district": "Muzaffarpur", "state": "Bihar", "lat": 26.1209, "lon": 85.3647, "aliases": []},
    {"city": "Bhagalpur", "district": "Bhagalpur", "state": "Bihar", "lat": 25.2425, "lon": 86.9842, "aliases": []},

    # Delhi NCR
    {"city": "Delhi", "district": "New Delhi", "state": "Delhi", "lat": 28.6139, "lon": 77.2090, "aliases": ["new delhi", "connaught place", "rohini", "dwarka", "lajpat nagar", "ito", "chandni chowk", "saket"]},

    # Rajasthan
    {"city": "Jaipur", "district": "Jaipur", "state": "Rajasthan", "lat": 26.9124, "lon": 75.7873, "aliases": ["pink city", "mansarovar", "malviya nagar jaipur", "c scheme"]},
    {"city": "Jodhpur", "district": "Jodhpur", "state": "Rajasthan", "lat": 26.2389, "lon": 73.0243, "aliases": ["sun city"]},
    {"city": "Udaipur", "district": "Udaipur", "state": "Rajasthan", "lat": 24.5854, "lon": 73.7125, "aliases": ["city of lakes"]},
    {"city": "Kota", "district": "Kota", "state": "Rajasthan", "lat": 25.2138, "lon": 75.8648, "aliases": []},
    {"city": "Bikaner", "district": "Bikaner", "state": "Rajasthan", "lat": 28.0229, "lon": 73.3119, "aliases": ["thar"]},

    # Maharashtra
    {"city": "Mumbai", "district": "Mumbai City", "state": "Maharashtra", "lat": 19.0760, "lon": 72.8777, "aliases": ["andheri", "bandra", "dadar", "colaba", "kurla", "borivali", "thane", "navi mumbai", "juhu"]},
    {"city": "Pune", "district": "Pune", "state": "Maharashtra", "lat": 18.5204, "lon": 73.8567, "aliases": ["hinjewadi", "kothrud", "viman nagar", "shivajinagar", "hadapsar"]},
    {"city": "Nagpur", "district": "Nagpur", "state": "Maharashtra", "lat": 21.1458, "lon": 79.0882, "aliases": ["sitabuldi"]},
    {"city": "Nashik", "district": "Nashik", "state": "Maharashtra", "lat": 19.9975, "lon": 73.7898, "aliases": ["panchavati"]},

    # Gujarat
    {"city": "Ahmedabad", "district": "Ahmedabad", "state": "Gujarat", "lat": 23.0225, "lon": 72.5714, "aliases": ["navrangpura", "maninagar", "satellite ahmedabad", "sg highway"]},
    {"city": "Surat", "district": "Surat", "state": "Gujarat", "lat": 21.1702, "lon": 72.8311, "aliases": ["varachha", "adajan"]},
    {"city": "Vadodara", "district": "Vadodara", "state": "Gujarat", "lat": 22.3072, "lon": 73.1812, "aliases": ["baroda", "alkapuri"]},
    {"city": "Rajkot", "district": "Rajkot", "state": "Gujarat", "lat": 22.3039, "lon": 70.8022, "aliases": []},

    # West Bengal
    {"city": "Kolkata", "district": "Kolkata", "state": "West Bengal", "lat": 22.5726, "lon": 88.3639, "aliases": ["howrah", "salt lake", "new town kolkata", "park street", "dum dum", "alipore"]},
    {"city": "Siliguri", "district": "Darjeeling", "state": "West Bengal", "lat": 26.7271, "lon": 88.3953, "aliases": []},
    {"city": "Asansol", "district": "Paschim Bardhaman", "state": "West Bengal", "lat": 23.6739, "lon": 86.9524, "aliases": []},

    # Karnataka
    {"city": "Bengaluru", "district": "Bengaluru Urban", "state": "Karnataka", "lat": 12.9716, "lon": 77.5946, "aliases": ["bangalore", "whitefield", "indiranagar", "koramangala", "electronic city", "hebbal", "jayanagar", "marathahalli"]},
    {"city": "Mysuru", "district": "Mysuru", "state": "Karnataka", "lat": 12.2958, "lon": 76.6394, "aliases": ["mysore"]},
    {"city": "Mangaluru", "district": "Dakshina Kannada", "state": "Karnataka", "lat": 12.9141, "lon": 74.8560, "aliases": ["mangalore"]},

    # Tamil Nadu
    {"city": "Chennai", "district": "Chennai", "state": "Tamil Nadu", "lat": 13.0827, "lon": 80.2707, "aliases": ["t nagar", "velachery", "anna nagar", "adyar", "tambaram", "omr chennai", "mylapore"]},
    {"city": "Coimbatore", "district": "Coimbatore", "state": "Tamil Nadu", "lat": 11.0168, "lon": 76.9558, "aliases": ["rs puram", "peelamedu"]},
    {"city": "Madurai", "district": "Madurai", "state": "Tamil Nadu", "lat": 9.9252, "lon": 78.1198, "aliases": []},

    # Telangana
    {"city": "Hyderabad", "district": "Hyderabad", "state": "Telangana", "lat": 17.3850, "lon": 78.4867, "aliases": ["secunderabad", "hitec city", "gachibowli", "banjara hills", "jubilee hills", "kukatpally", "charminar"]},
    {"city": "Warangal", "district": "Warangal", "state": "Telangana", "lat": 17.9689, "lon": 79.5941, "aliases": ["hanamkonda"]},

    # Madhya Pradesh
    {"city": "Bhopal", "district": "Bhopal", "state": "Madhya Pradesh", "lat": 23.2599, "lon": 77.4126, "aliases": ["arera colony", "mp nagar"]},
    {"city": "Indore", "district": "Indore", "state": "Madhya Pradesh", "lat": 22.7196, "lon": 75.8577, "aliases": ["vijay nagar indore", "rajwada"]},
    {"city": "Jabalpur", "district": "Jabalpur", "state": "Madhya Pradesh", "lat": 23.1815, "lon": 79.9864, "aliases": []},
    {"city": "Gwalior", "district": "Gwalior", "state": "Madhya Pradesh", "lat": 26.2183, "lon": 78.1828, "aliases": []},

    # Assam & North East
    {"city": "Guwahati", "district": "Kamrup Metropolitan", "state": "Assam", "lat": 26.1445, "lon": 91.7362, "aliases": ["dispur", "paltan bazaar", "jalukbari"]},
    {"city": "Shillong", "district": "East Khasi Hills", "state": "Meghalaya", "lat": 25.5788, "lon": 91.8933, "aliases": ["police bazar"]},
    {"city": "Agartala", "district": "West Tripura", "state": "Tripura", "lat": 23.8315, "lon": 91.2868, "aliases": []},

    # Jammu & Kashmir
    {"city": "Srinagar", "district": "Srinagar", "state": "Jammu and Kashmir", "lat": 34.0837, "lon": 74.7973, "aliases": ["lal chowk", "dal lake"]},
    {"city": "Jammu", "district": "Jammu", "state": "Jammu and Kashmir", "lat": 32.7266, "lon": 74.8570, "aliases": ["gandhi nagar jammu"]},

    # Punjab & Haryana
    {"city": "Chandigarh", "district": "Chandigarh", "state": "Chandigarh", "lat": 30.7333, "lon": 76.7794, "aliases": ["sector 17 chandigarh", "mohali", "panchkula"]},
    {"city": "Amritsar", "district": "Amritsar", "state": "Punjab", "lat": 31.6340, "lon": 74.8723, "aliases": ["golden temple"]},
    {"city": "Ludhiana", "district": "Ludhiana", "state": "Punjab", "lat": 30.9010, "lon": 75.8573, "aliases": []},
    {"city": "Gurugram", "district": "Gurugram", "state": "Haryana", "lat": 28.4595, "lon": 77.0266, "aliases": ["gurgaon", "cyber city", "dlf phase 1", "sohna road"]},

    # Kerala
    {"city": "Kochi", "district": "Ernakulam", "state": "Kerala", "lat": 9.9312, "lon": 76.2673, "aliases": ["cochin", "marine drive kochi", "edappally", "kakkanad"]},
    {"city": "Thiruvananthapuram", "district": "Thiruvananthapuram", "state": "Kerala", "lat": 8.5241, "lon": 76.9366, "aliases": ["trivandrum", "kovalam"]},
    {"city": "Kozhikode", "district": "Kozhikode", "state": "Kerala", "lat": 11.2588, "lon": 75.7804, "aliases": ["calicut"]},

    # Odisha
    {"city": "Bhubaneswar", "district": "Khordha", "state": "Odisha", "lat": 20.2961, "lon": 85.8245, "aliases": ["patia", "saheed nagar"]},
    {"city": "Puri", "district": "Puri", "state": "Odisha", "lat": 19.8135, "lon": 85.8312, "aliases": ["grand road puri"]},
    {"city": "Cuttack", "district": "Cuttack", "state": "Odisha", "lat": 20.4625, "lon": 85.8830, "aliases": []},

    # Uttarakhand & Himachal
    {"city": "Dehradun", "district": "Dehradun", "state": "Uttarakhand", "lat": 30.3165, "lon": 78.0322, "aliases": ["rajpur road", "mussoorie"]},
    {"city": "Haridwar", "district": "Haridwar", "state": "Uttarakhand", "lat": 29.9457, "lon": 78.1642, "aliases": ["har ki pauri"]},
    {"city": "Shimla", "district": "Shimla", "state": "Himachal Pradesh", "lat": 31.1048, "lon": 77.1734, "aliases": ["mall road shimla"]},
    {"city": "Manali", "district": "Kullu", "state": "Himachal Pradesh", "lat": 32.2396, "lon": 77.1887, "aliases": []},

    # Andhra Pradesh
    {"city": "Visakhapatnam", "district": "Visakhapatnam", "state": "Andhra Pradesh", "lat": 17.6868, "lon": 83.2185, "aliases": ["vizag", "rk beach"]},
    {"city": "Vijayawada", "district": "NTR", "state": "Andhra Pradesh", "lat": 16.5062, "lon": 80.6480, "aliases": ["benz circle"]},

    # Jharkhand & Chhattisgarh
    {"city": "Ranchi", "district": "Ranchi", "state": "Jharkhand", "lat": 23.3441, "lon": 85.3096, "aliases": ["morabadi", "main road ranchi"]},
    {"city": "Jamshedpur", "district": "East Singhbhum", "state": "Jharkhand", "lat": 22.8046, "lon": 86.2029, "aliases": ["tatanagar", "bistupur"]},
    {"city": "Raipur", "district": "Raipur", "state": "Chhattisgarh", "lat": 21.2514, "lon": 81.6296, "aliases": ["pandri", "telibandha"]},
]

def extract_location_from_text(text: str) -> Optional[Dict[str, Any]]:
    """
    Named Entity & Keyword Extraction for Indian locations in raw weather text.
    """
    text_lower = text.lower()
    
    # 1. First check alias and specific locality names (e.g. "Gomti Nagar, Lucknow")
    for loc in INDIAN_LOCATIONS:
        for alias in loc.get("aliases", []):
            if re.search(r'\b' + re.escape(alias) + r'\b', text_lower):
                return loc

    # 2. Check main city names
    for loc in INDIAN_LOCATIONS:
        city_lower = loc["city"].lower()
        if re.search(r'\b' + re.escape(city_lower) + r'\b', text_lower):
            return loc

    # 3. Check district / state names
    for loc in INDIAN_LOCATIONS:
        district_lower = loc.get("district", "").lower()
        if district_lower and re.search(r'\b' + re.escape(district_lower) + r'\b', text_lower):
            return loc

    for loc in INDIAN_LOCATIONS:
        state_lower = loc["state"].lower()
        if re.search(r'\b' + re.escape(state_lower) + r'\b', text_lower):
            return loc

    return None

def find_nearest_location(lat: float, lon: float) -> Dict[str, Any]:
    """
    Find closest Indian reference city from GPS coordinates.
    """
    best_loc = INDIAN_LOCATIONS[0]
    min_dist = float("inf")
    for loc in INDIAN_LOCATIONS:
        dist = haversine_distance_km(lat, lon, loc["lat"], loc["lon"])
        if dist < min_dist:
            min_dist = dist
            best_loc = loc
    return best_loc
