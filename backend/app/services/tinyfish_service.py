import os
import logging
from typing import List, Dict, Any, Optional
from tinyfish import TinyFish

from app.core.config import settings

logger = logging.getLogger(__name__)

class TinyFishService:
    def __init__(self, api_key: Optional[str] = None):
        self.api_key = api_key or settings.TINYFISH_API_KEY or os.getenv("TINYFISH_API_KEY", "")
        self.client = TinyFish(api_key=self.api_key) if self.api_key else None

    def corroborate_report(self, city: str, category: str, text: Optional[str] = None) -> List[Dict[str, Any]]:
        """
        Queries TinyFish Search API for live web intelligence, news, and official advisories
        matching the reported incident in India.
        """
        if not self.client:
            logger.info("TinyFish client not initialized (TINYFISH_API_KEY missing). Skipping web corroboration.")
            return []

        # Target live Indian meteorological incidents
        query = f"{city} {category} weather rainfall alert India today"
        try:
            response = self.client.search.query(
                query,
                location="IN",
                language="en",
            )
            citations = []
            for item in getattr(response, "results", [])[:3]:
                citations.append({
                    "title": getattr(item, "title", "Live Meteorological Report"),
                    "url": getattr(item, "url", ""),
                    "snippet": getattr(item, "snippet", "") or getattr(item, "description", ""),
                    "source": getattr(item, "site_name", "Web Intelligence")
                })
            logger.info(f"TinyFish found {len(citations)} corroborating sources for {city} ({category}).")
            return citations
        except Exception as e:
            logger.warning(f"TinyFish corroboration failed for {city} ({category}): {e}")
            return []

tinyfish_service = TinyFishService()
