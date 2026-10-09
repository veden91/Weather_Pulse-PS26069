import os
import json
import logging
from typing import Dict, Any, Optional
import httpx
from app.core.config import settings

logger = logging.getLogger(__name__)

METEOROLOGICAL_SYSTEM_PROMPT = """
You are an expert Meteorological Intelligence Officer for the India Meteorological Department (IMD) and Ministry of Earth Sciences (MoES).
Analyze the incoming report text and determine:
1. Is it a valid meteorological/weather report in India?
2. What is the weather category? (One of: Cloudburst, Flash Flood, Cyclone, Landslide, Hailstorm, Heavy Rainfall, Flood, Lightning, Thunderstorm, Dust Storm, Dense Fog, Fog, Heatwave, Cold Wave, Strong Wind, Rainfall)
3. What is the severity? (LOW, MEDIUM, HIGH, CRITICAL)
4. What Indian city and state does it refer to?
5. Confidence score (0.0 to 1.0)
6. Reasoning summary explaining why it is valid or suspicious.

Respond strictly in valid JSON format:
{
  "is_valid_weather_report": true,
  "confidence_score": 0.94,
  "extracted_category": "Heavy Rainfall",
  "extracted_city": "Lucknow",
  "extracted_state": "Uttar Pradesh",
  "severity": "HIGH",
  "reasoning_summary": "Detailed technical explanation..."
}
"""

def verify_report_with_llm(text: str, location_hint: Optional[str] = None) -> Dict[str, Any]:
    """
    Executes Pre-Trained LLM Verification (Google Gemini 1.5/2.0 Flash or REST API).
    Falls back gracefully to local rule-based NLP classifier if API key is missing or network fails.
    """
    api_key = os.getenv("GEMINI_API_KEY") or os.getenv("GOOGLE_API_KEY") or settings.GEMINI_API_KEY

    if api_key:
        try:
            import google.generativeai as genai
            genai.configure(api_key=api_key)
            model_name = "gemini-3.8-flash"
            model = None
            for candidate in ["gemini-3.8-flash", "gemini-3.6-flash", "gemini-2.5-flash", "gemini-flash-latest"]:
                try:
                    model = genai.GenerativeModel(candidate)
                    model_name = candidate
                    break
                except Exception:
                    continue
            if not model:
                model = genai.GenerativeModel("gemini-3.8-flash")

            prompt = f"{METEOROLOGICAL_SYSTEM_PROMPT}\n\nReport Text to Analyze:\n\"{text}\"\nLocation Hint: {location_hint or 'None'}"
            response = model.generate_content(prompt)

            if response.text:
                clean_json = response.text.strip()
                if "```json" in clean_json:
                    clean_json = clean_json.split("```json")[1].split("```")[0].strip()
                elif "```" in clean_json:
                    clean_json = clean_json.split("```")[1].split("```")[0].strip()

                parsed = json.loads(clean_json)
                return {
                    "source_engine": f"Google Gemini LLM ({model_name})",
                    "is_valid": parsed.get("is_valid_weather_report", True),
                    "confidence": parsed.get("confidence_score", 0.90),
                    "category": parsed.get("extracted_category", "Rainfall"),
                    "severity": parsed.get("severity", "MEDIUM"),
                    "city": parsed.get("extracted_city", "Delhi"),
                    "state": parsed.get("extracted_state", "Delhi"),
                    "reasoning": parsed.get("reasoning_summary", "LLM verified meteorological terminology and spatial consistency.")
                }
        except Exception as e:
            logger.warning(f"Gemini LLM SDK call failed or key invalid ({e}). Using local NLP fallback.")

    # Local Fallback Classification Engine
    from app.ai.classifier import classifier
    local_res = classifier.classify(text, location_hint=location_hint)
    return {
        "source_engine": "Local WeatherPulse NLP Classifier (Rule-Based Fallback)",
        "is_valid": True,
        "confidence": local_res["confidence"],
        "category": local_res["event_type"],
        "severity": local_res["severity"],
        "city": local_res.get("city", "Delhi"),
        "state": local_res.get("state", "Delhi"),
        "reasoning": f"Local NLP pattern matching identified category '{local_res['event_type']}' with severity '{local_res['severity']}' in {local_res.get('city')}."
    }
