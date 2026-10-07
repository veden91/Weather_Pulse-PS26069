import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import { WeatherEvent } from '../types';
import { Layers, RotateCcw, Eye, Radio } from 'lucide-react';

// Fix default icon paths for Leaflet in Vite bundler
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

interface IndiaWeatherMapProps {
  events: WeatherEvent[];
  selectedEventId?: string | null;
  onSelectEvent?: (event: WeatherEvent) => void;
  height?: string;
  showFilters?: boolean;
  isCitizen?: boolean;
}

const CATEGORY_COLORS: Record<string, string> = {
  'Heavy Rainfall': '#2563eb', // blue-600
  'Rainfall': '#38bdf8', // sky-400
  'Flood': '#7c3aed', // violet-600
  'Flash Flood': '#9333ea', // purple-600
  'Thunderstorm': '#eab308', // yellow-500
  'Lightning': '#facc15', // yellow-400
  'Heatwave': '#ea580c', // orange-600
  'Cold Wave': '#0284c7', // sky-600
  'Dense Fog': '#64748b', // slate-500
  'Fog': '#94a3b8', // slate-400
  'Dust Storm': '#d97706', // amber-600
  'Strong Wind': '#0d9488', // teal-600
  'Cyclone': '#dc2626', // red-600
  'Hailstorm': '#06b6d4', // cyan-500
  'Cloudburst': '#e11d48', // rose-600
  'Landslide': '#854d0e', // yellow-800
};

export const IndiaWeatherMap: React.FC<IndiaWeatherMapProps> = ({
  events,
  selectedEventId,
  onSelectEvent,
  height = '100%',
  isCitizen = false,
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markersLayerRef = useRef<L.LayerGroup | null>(null);
  const baseLayersRef = useRef<{ [key: string]: L.TileLayer }>({});
  const radarLayerRef = useRef<L.TileLayer | null>(null);

  const [activeBaseLayer, setActiveBaseLayer] = useState<'dark' | 'osm' | 'satellite'>('dark');
  const [showRadarOverlay, setShowRadarOverlay] = useState(true);

  useEffect(() => {
    if (!mapContainerRef.current) return;

    if (!mapInstanceRef.current) {
      // Initialize map centered on India
      const map = L.map(mapContainerRef.current, {
        center: [22.8, 80.0],
        zoom: 5,
        minZoom: 4,
        maxZoom: 16,
        zoomControl: false, // Custom placed zoom control
      });

      // Zoom Control top right
      L.control.zoom({ position: 'topright' }).addTo(map);

      // Add Metric Scale bar
      L.control.scale({ imperial: false, position: 'bottomright' }).addTo(map);

      // Define Basemap Tile Layers
      const darkTile = L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap &copy; CARTO',
        subdomains: 'abcd',
        maxZoom: 19,
      });

      const osmTile = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap contributors',
        maxZoom: 19,
      });

      const satelliteTile = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
        attribution: '&copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community',
        maxZoom: 18,
      });

      baseLayersRef.current = { dark: darkTile, osm: osmTile, satellite: satelliteTile };
      darkTile.addTo(map);

      // Live OpenWeather Precipitation Radar Overlay
      const openWeatherApiKey = '622e8f3d207f2247def2c854e912b29c';
      const radarTile = L.tileLayer(`https://tile.openweathermap.org/map/precipitation_new/{z}/{x}/{y}.png?appid=${openWeatherApiKey}`, {
        opacity: 0.6,
        maxZoom: 18,
      });
      radarLayerRef.current = radarTile;
      radarTile.addTo(map);

      markersLayerRef.current = L.layerGroup().addTo(map);
      mapInstanceRef.current = map;

      // Force layout recalculation
      const t1 = setTimeout(() => map.invalidateSize(), 100);
      const t2 = setTimeout(() => map.invalidateSize(), 400);

      const handleResize = () => map.invalidateSize();
      window.addEventListener('resize', handleResize);

      let resizeObserver: ResizeObserver | null = null;
      if (mapContainerRef.current && typeof ResizeObserver !== 'undefined') {
        resizeObserver = new ResizeObserver(() => {
          map.invalidateSize();
        });
        resizeObserver.observe(mapContainerRef.current);
      }

      return () => {
        clearTimeout(t1);
        clearTimeout(t2);
        window.removeEventListener('resize', handleResize);
        if (resizeObserver) resizeObserver.disconnect();
        if (mapInstanceRef.current) {
          mapInstanceRef.current.remove();
          mapInstanceRef.current = null;
        }
      };
    }
  }, []);

  // Switch Base Layers
  const handleSwitchBaseLayer = (layerKey: 'dark' | 'osm' | 'satellite') => {
    if (!mapInstanceRef.current) return;
    const map = mapInstanceRef.current;
    Object.values(baseLayersRef.current).forEach((layer) => {
      if (map.hasLayer(layer)) map.removeLayer(layer);
    });
    const selected = baseLayersRef.current[layerKey];
    if (selected) {
      selected.addTo(map);
      setActiveBaseLayer(layerKey);
    }
  };

  // Toggle Live Weather Radar Overlay
  const handleToggleRadar = () => {
    if (!mapInstanceRef.current || !radarLayerRef.current) return;
    const map = mapInstanceRef.current;
    const radar = radarLayerRef.current;
    if (map.hasLayer(radar)) {
      map.removeLayer(radar);
      setShowRadarOverlay(false);
    } else {
      radar.addTo(map);
      setShowRadarOverlay(true);
    }
  };

  // Recenter Camera to National View
  const handleRecenter = () => {
    if (mapInstanceRef.current) {
      mapInstanceRef.current.flyTo([22.8, 80.0], 5, { duration: 1.2 });
    }
  };

  // Update markers when events change
  useEffect(() => {
    if (!mapInstanceRef.current || !markersLayerRef.current) return;

    markersLayerRef.current.clearLayers();

    events.forEach((evt) => {
      const lat = Number(evt.latitude);
      const lon = Number(evt.longitude);
      if (isNaN(lat) || isNaN(lon) || (lat === 0 && lon === 0)) return;

      const color = CATEGORY_COLORS[evt.event_category] || '#38bdf8';
      const isCritical = evt.severity === 'CRITICAL';
      const isSelected = selectedEventId === evt.id;

      // Custom HTML Marker with radar pulse ring for critical events
      const markerHtml = `
        <div class="relative flex items-center justify-center cursor-pointer group">
          ${
            isCritical
              ? `<div class="absolute w-8 h-8 rounded-full bg-red-500/30 animate-radar-pulse"></div>`
              : ''
          }
          <div class="w-5 h-5 rounded-full flex items-center justify-center shadow-lg transition-transform duration-200 group-hover:scale-125 ${
            isSelected ? 'ring-2 ring-white scale-125' : ''
          }" style="background-color: ${color}; border: 2px solid #ffffff;">
            <div class="w-1.5 h-1.5 rounded-full bg-white"></div>
          </div>
        </div>
      `;

      const customIcon = L.divIcon({
        className: 'custom-weather-marker',
        html: markerHtml,
        iconSize: [24, 24],
        iconAnchor: [12, 12],
        popupAnchor: [0, -12],
      });

      const marker = L.marker([lat, lon], { icon: customIcon });

      // Build popup content
      const popupHtml = `
        <div class="p-1 max-w-[240px]">
          <div class="flex items-center justify-between gap-2 mb-1.5">
            <span class="text-xs font-bold ${isCitizen ? 'text-white' : 'text-sky-400'} uppercase tracking-wide">${evt.event_category}</span>
            <span class="text-[10px] px-1.5 py-0.5 rounded font-mono font-bold ${
              evt.severity === 'CRITICAL' ? 'bg-red-500/20 text-red-400' : 'bg-amber-500/20 text-amber-400'
            }">${evt.severity}</span>
          </div>
          <div class="text-xs font-semibold text-slate-100 mb-1">${evt.city}, ${evt.state}</div>
          <div class="text-[11px] text-slate-400 mb-2 line-clamp-2">${evt.summary || 'Incident reported by multi-source telemetry.'}</div>
          <div class="flex items-center justify-between text-[10px] text-slate-400 pt-1 border-t border-slate-700">
            <span>Reports: <strong class="text-slate-200">${evt.report_count}</strong></span>
            <span>Confidence: <strong class="text-emerald-400">${Math.round(evt.confidence * 100)}%</strong></span>
          </div>
        </div>
      `;

      marker.bindPopup(popupHtml);

      marker.on('click', () => {
        if (onSelectEvent) {
          onSelectEvent(evt);
        }
      });

      markersLayerRef.current?.addLayer(marker);
    });

    // Invalidate size to ensure markers position accurately
    mapInstanceRef.current.invalidateSize();
  }, [events, selectedEventId, onSelectEvent, isCitizen]);

  return (
    <div className={`relative rounded-xl overflow-hidden border shadow-2xl w-full h-full min-h-[300px] ${
      isCitizen ? 'bg-[#000000] border-zinc-800' : 'bg-[#0b111e] border-[#1e293b]'
    }`}>
      {/* Map Element */}
      <div ref={mapContainerRef} style={{ height: height || '100%', width: '100%', minHeight: '300px' }} />

      {/* Top Left GIS Layer Controls */}
      <div className={`absolute top-3 left-3 z-[1000] flex items-center gap-1.5 backdrop-blur-md border p-1.5 rounded-xl shadow-xl ${
        isCitizen ? 'bg-[#080808]/90 border-zinc-800' : 'bg-[#121b2d]/90 border-[#1e293b]'
      }`}>
        <button
          onClick={() => handleSwitchBaseLayer('dark')}
          className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-all ${
            activeBaseLayer === 'dark'
              ? isCitizen ? 'bg-white text-black shadow-md' : 'bg-sky-600 text-white shadow-md'
              : isCitizen ? 'text-zinc-400 hover:text-white hover:bg-zinc-800' : 'text-slate-400 hover:text-slate-200 hover:bg-[#1a263d]'
          }`}
        >
          Dark
        </button>
        <button
          onClick={() => handleSwitchBaseLayer('osm')}
          className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-all ${
            activeBaseLayer === 'osm'
              ? isCitizen ? 'bg-white text-black shadow-md' : 'bg-sky-600 text-white shadow-md'
              : isCitizen ? 'text-zinc-400 hover:text-white hover:bg-zinc-800' : 'text-slate-400 hover:text-slate-200 hover:bg-[#1a263d]'
          }`}
        >
          OSM
        </button>
        <button
          onClick={() => handleSwitchBaseLayer('satellite')}
          className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-all ${
            activeBaseLayer === 'satellite'
              ? isCitizen ? 'bg-white text-black shadow-md' : 'bg-sky-600 text-white shadow-md'
              : isCitizen ? 'text-zinc-400 hover:text-white hover:bg-zinc-800' : 'text-slate-400 hover:text-slate-200 hover:bg-[#1a263d]'
          }`}
        >
          Satellite
        </button>

        <div className={`h-4 w-px mx-1 ${isCitizen ? 'bg-zinc-800' : 'bg-[#1e293b]'}`} />

        <button
          onClick={handleToggleRadar}
          className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-all flex items-center gap-1 ${
            showRadarOverlay
              ? 'bg-emerald-600/30 text-emerald-300 border border-emerald-500/40'
              : isCitizen ? 'text-zinc-400 hover:text-white hover:bg-zinc-800' : 'text-slate-400 hover:text-slate-200 hover:bg-[#1a263d]'
          }`}
          title="Toggle OpenWeather Precipitation Radar Overlay"
        >
          <Radio className={`w-3.5 h-3.5 ${showRadarOverlay ? 'text-emerald-400 animate-pulse' : 'text-slate-400'}`} />
          <span>Radar</span>
        </button>

        <button
          onClick={handleRecenter}
          className={`p-1 rounded-lg transition-colors ${
            isCitizen ? 'text-zinc-400 hover:text-white hover:bg-zinc-800' : 'text-slate-400 hover:text-sky-300 hover:bg-[#1a263d]'
          }`}
          title="Recenter Map to India View"
        >
          <RotateCcw className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Map Legend Overlay */}
      <div className={`absolute bottom-3 left-3 z-[1000] backdrop-blur-md border px-3 py-2 rounded-lg text-[10px] shadow-xl hidden sm:flex items-center gap-3 ${
        isCitizen ? 'bg-[#080808]/90 border-zinc-800 text-zinc-300' : 'bg-[#121b2d]/90 border-[#1e293b] text-slate-300'
      }`}>
        <span className={`font-bold uppercase tracking-wider ${isCitizen ? 'text-zinc-400' : 'text-slate-400'}`}>Legend:</span>
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-blue-600 inline-block" />
          <span>Rainfall</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-violet-600 inline-block" />
          <span>Flood</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-yellow-500 inline-block" />
          <span>Thunderstorm</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-orange-600 inline-block" />
          <span>Heatwave</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-red-600 inline-block animate-pulse" />
          <span>Cyclone/Critical</span>
        </div>
      </div>
    </div>
  );
};

