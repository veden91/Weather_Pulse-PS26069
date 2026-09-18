import React, { useEffect, useRef } from 'react';
import L from 'leaflet';
import { WeatherEvent } from '../types';

interface IndiaWeatherMapProps {
  events: WeatherEvent[];
  selectedEventId?: string | null;
  onSelectEvent?: (event: WeatherEvent) => void;
  height?: string;
  showFilters?: boolean;
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
  height = '520px',
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markersLayerRef = useRef<L.LayerGroup | null>(null);

  useEffect(() => {
    if (!mapContainerRef.current) return;

    if (!mapInstanceRef.current) {
      // Initialize map centered on India
      const map = L.map(mapContainerRef.current, {
        center: [22.8, 80.0],
        zoom: 5,
        minZoom: 4,
        maxZoom: 14,
        zoomControl: true,
      });

      // CartoDB Dark Matter tile layer for high-tech command center aesthetic
      L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
        attribution: '&copy; OpenStreetMap contributors &copy; CARTO',
        subdomains: 'abcd',
        maxZoom: 19,
      }).addTo(map);

      markersLayerRef.current = L.layerGroup().addTo(map);
      mapInstanceRef.current = map;
    }

    return () => {
      // Clean up on unmount
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  // Update markers when events change
  useEffect(() => {
    if (!mapInstanceRef.current || !markersLayerRef.current) return;

    markersLayerRef.current.clearLayers();

    events.forEach((evt) => {
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

      const marker = L.marker([evt.latitude, evt.longitude], { icon: customIcon });

      // Build popup content
      const popupHtml = `
        <div class="p-1 max-w-[240px]">
          <div class="flex items-center justify-between gap-2 mb-1.5">
            <span class="text-xs font-bold text-sky-400 uppercase tracking-wide">${evt.event_category}</span>
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
  }, [events, selectedEventId, onSelectEvent]);

  return (
    <div className="relative rounded-xl overflow-hidden border border-[#1e293b] shadow-2xl bg-[#0b111e]">
      <div ref={mapContainerRef} style={{ height, width: '100%' }} />

      {/* Map Legend Overlay */}
      <div className="absolute bottom-3 left-3 z-[1000] bg-[#121b2d]/90 backdrop-blur-md border border-[#1e293b] px-3 py-2 rounded-lg text-[10px] text-slate-300 shadow-xl hidden sm:flex items-center gap-3">
        <span className="font-bold text-slate-400 uppercase tracking-wider">Legend:</span>
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
