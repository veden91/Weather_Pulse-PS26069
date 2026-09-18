from abc import ABC, abstractmethod
from typing import List, Dict, Any

class BaseSourceCollector(ABC):
    @abstractmethod
    def get_source_id(self) -> str:
        """Returns unique source identifier, e.g. 'IMD_OPEN_DATA'"""
        pass

    @abstractmethod
    def get_source_name(self) -> str:
        """Returns human-readable name of the source"""
        pass

    @abstractmethod
    def get_source_type(self) -> str:
        """Returns category type: IMD_API, SOCIAL_MEDIA, CITIZEN, WEATHER_API, PUBLIC_DATASET, SIMULATOR"""
        pass

    @abstractmethod
    def collect(self) -> List[Dict[str, Any]]:
        """Collects raw reports from the source"""
        pass
