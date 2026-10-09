from typing import List, Optional
from fastapi import APIRouter, Query
from app.geospatial.gazetteer import INDIAN_LOCATIONS

router = APIRouter()

@router.get("")
def list_locations(
    search: Optional[str] = None,
    state: Optional[str] = None,
    limit: int = 50
):
    results = INDIAN_LOCATIONS
    if state:
        results = [loc for loc in results if loc["state"].lower() == state.lower()]
    if search:
        s = search.lower()
        results = [
            loc for loc in results
            if s in loc["city"].lower() or s in loc["state"].lower() or any(s in a for a in loc.get("aliases", []))
        ]
    return results[:limit]
