import React, { useEffect, useState } from 'react';
import { getEvents } from '../services/api';
import { useAuth } from '../store/authContext';
import { WeatherEvent } from '../types';
import { IndiaWeatherMap } from '../maps/IndiaWeatherMap';
import { EventIntelligencePanel } from '../components/EventIntelligencePanel';
import {
  Layers,
  Filter,
  Play,
  Pause,
  RotateCcw,
  Sliders,
  Calendar,
  CloudRain
} from 'lucide-react';

export const GeoAnalytics: React.FC = () => {
  const { role, user } = useAuth();
  const isCitizen = role === 'CITIZEN' || user?.role === 'CITIZEN' || (user?.role as string) === 'VIEWER';

  const [events, setEvents] = useState<WeatherEvent[]>([]);
  const [filteredEvents, setFilteredEvents] = useState<WeatherEvent[]>([]);
  const [selectedEvent, setSelectedEvent] = useState<WeatherEvent | null>(null);
  const [timeStep, setTimeStep] = useState<number>(100); // 0 to 100 on slider
  const [isPlaying, setIsPlaying] = useState(false);

  // Filters
  const [category, setCategory] = useState('');
  const [severity, setSeverity] = useState('');
  const [state, setState] = useState('');

  useEffect(() => {
    getEvents({ limit: 100 })
      .then((data) => {
        setEvents(data);
        setFilteredEvents(data);
        if (data.length > 0) setSelectedEvent(data[0]);
      })
      .catch((err) => console.error('Error fetching geo events:', err));
  }, []);

  // Filter effect
  useEffect(() => {
    let res = events;
    if (category) res = res.filter((e) => e.event_category === category);
    if (severity) res = res.filter((e) => e.severity === severity);
    if (state) res = res.filter((e) => e.state === state);

    // Filter by timeline slider
    const totalCount = res.length;
    const sliceCount = Math.max(1, Math.round((timeStep / 100) * totalCount));
    setFilteredEvents(res.slice(0, sliceCount));
  }, [category, severity, state, timeStep, events]);

  // Timeline slider playback loop
  useEffect(() => {
    let interval: any = null;
    if (isPlaying) {
      interval = setInterval(() => {
        setTimeStep((prev) => {
          if (prev >= 100) {
            setIsPlaying(false);
            return 100;
          }
          return prev + 10;
        });
      }, 1200);
    }
    return () => clearInterval(interval);
  }, [isPlaying]);

  return (
    <div className="space-y-3 h-[calc(100vh-6.25rem)] flex flex-col overflow-hidden">
      {/* Top Header */}
      <div className={`flex items-center justify-between px-4 py-2.5 rounded-2xl border shrink-0 ${
        isCitizen ? 'bg-[#080808] border-zinc-800' : 'bg-[#121b2d] border-[#1e293b]'
      }`}>
        <div>
          <h1 className={`text-base font-bold flex items-center gap-2 ${isCitizen ? 'text-white' : 'text-slate-100'}`}>
            India Geospatial Weather Analytics & Telemetry Map
            <span className={`text-xs px-2 py-0.5 rounded font-mono ${isCitizen ? 'bg-zinc-800 text-white border border-zinc-700' : 'bg-sky-500/20 text-sky-300'}`}>
              {filteredEvents.length} / {events.length} ACTIVE
            </span>
          </h1>
          <p className={`text-xs ${isCitizen ? 'text-zinc-400' : 'text-slate-400'}`}>
            Interactive multi-layered GIS workspace with spatio-temporal scrubbing & intelligence dossier.
          </p>
        </div>
      </div>

      {/* Main Workspace Layout */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-3.5 min-h-0 overflow-hidden">
        {/* Left Filters Panel (3 cols) */}
        <div className={`lg:col-span-3 p-4 rounded-2xl border flex flex-col gap-3 overflow-y-auto shrink-0 ${
          isCitizen ? 'bg-[#080808] border-zinc-800' : 'bg-[#121b2d] border-[#1e293b]'
        }`}>
          <div className={`text-xs font-bold uppercase tracking-wider flex items-center gap-2 border-b pb-2 ${
            isCitizen ? 'text-white border-zinc-800' : 'text-slate-200 border-[#1e293b]'
          }`}>
            <Filter className={`w-4 h-4 ${isCitizen ? 'text-white' : 'text-sky-400'}`} />
            <span>GIS Layer & Spatial Filters</span>
          </div>

          <div className="space-y-3 text-xs">
            <div>
              <label className={`font-medium block mb-1 ${isCitizen ? 'text-zinc-400' : 'text-slate-400'}`}>Weather Category</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className={`w-full rounded-xl px-3 py-2 text-xs focus:outline-none ${
                  isCitizen ? 'bg-[#000000] border border-zinc-800 text-white focus:border-white' : 'bg-[#0e1626] border border-[#1e293b] text-slate-200 focus:border-sky-500'
                }`}
              >
                <option value="">All Weather Events</option>
                <option value="Heavy Rainfall">Heavy Rainfall</option>
                <option value="Flood">Flood</option>
                <option value="Thunderstorm">Thunderstorm</option>
                <option value="Heatwave">Heatwave</option>
                <option value="Dense Fog">Dense Fog</option>
                <option value="Cyclone">Cyclone</option>
                <option value="Cloudburst">Cloudburst</option>
              </select>
            </div>

            <div>
              <label className={`font-medium block mb-1 ${isCitizen ? 'text-zinc-400' : 'text-slate-400'}`}>Severity Threshold</label>
              <select
                value={severity}
                onChange={(e) => setSeverity(e.target.value)}
                className={`w-full rounded-xl px-3 py-2 text-xs focus:outline-none ${
                  isCitizen ? 'bg-[#000000] border border-zinc-800 text-white focus:border-white' : 'bg-[#0e1626] border border-[#1e293b] text-slate-200 focus:border-sky-500'
                }`}
              >
                <option value="">All Alert Severities</option>
                <option value="CRITICAL">Critical Only</option>
                <option value="HIGH">High Severity</option>
                <option value="MEDIUM">Medium</option>
                <option value="LOW">Low</option>
              </select>
            </div>

            <div>
              <label className={`font-medium block mb-1 ${isCitizen ? 'text-zinc-400' : 'text-slate-400'}`}>State / UT Region</label>
              <select
                value={state}
                onChange={(e) => setState(e.target.value)}
                className={`w-full rounded-xl px-3 py-2 text-xs focus:outline-none ${
                  isCitizen ? 'bg-[#000000] border border-zinc-800 text-white focus:border-white' : 'bg-[#0e1626] border border-[#1e293b] text-slate-200 focus:border-sky-500'
                }`}
              >
                <option value="">All Indian States</option>
                <option value="Uttar Pradesh">Uttar Pradesh</option>
                <option value="Bihar">Bihar</option>
                <option value="Maharashtra">Maharashtra</option>
                <option value="Rajasthan">Rajasthan</option>
                <option value="Delhi">Delhi NCR</option>
                <option value="Andhra Pradesh">Andhra Pradesh</option>
                <option value="West Bengal">West Bengal</option>
                <option value="Assam">Assam</option>
                <option value="Kerala">Kerala</option>
                <option value="Karnataka">Karnataka</option>
              </select>
            </div>
          </div>

          <div className={`mt-auto pt-3 border-t ${isCitizen ? 'border-zinc-800' : 'border-[#1e293b]'}`}>
            <button
              onClick={() => {
                setCategory('');
                setSeverity('');
                setState('');
                setTimeStep(100);
              }}
              className={`w-full py-2 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${
                isCitizen ? 'bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 text-white' : 'bg-[#0e1626] hover:bg-[#18233a] border border-[#1e293b] text-slate-300'
              }`}
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset GIS Filters</span>
            </button>
          </div>
        </div>

        {/* Center Map (5 cols) */}
        <div className="lg:col-span-5 flex flex-col min-h-0 h-full overflow-hidden">
          <div className={`flex-1 rounded-2xl overflow-hidden shadow-2xl border relative h-full min-h-0 ${
            isCitizen ? 'border-zinc-800' : 'border-[#1e293b]'
          }`}>
            <IndiaWeatherMap
              events={filteredEvents}
              selectedEventId={selectedEvent?.id}
              onSelectEvent={(evt) => setSelectedEvent(evt)}
              height="100%"
              isCitizen={isCitizen}
            />
          </div>
        </div>

        {/* Right Section Intelligence Panel (4 cols) */}
        <div className="lg:col-span-4 flex flex-col min-h-0 h-full overflow-y-auto">
          <EventIntelligencePanel
            event={selectedEvent}
            onClose={() => setSelectedEvent(null)}
          />
        </div>
      </div>

      {/* Bottom Section: Spatio-Temporal Timeline Slider */}
      <div className={`px-5 py-3 rounded-2xl border shrink-0 flex flex-col sm:flex-row items-center gap-4 ${
        isCitizen ? 'bg-[#080808] border-zinc-800' : 'bg-[#121b2d] border-[#1e293b]'
      }`}>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsPlaying(!isPlaying)}
            className={`w-8 h-8 rounded-xl flex items-center justify-center transition-colors shadow-md ${
              isCitizen ? 'bg-white text-black hover:bg-zinc-200' : 'bg-sky-600 hover:bg-sky-500 text-white'
            }`}
          >
            {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 ml-0.5" />}
          </button>
          <div className={`text-xs font-semibold whitespace-nowrap ${isCitizen ? 'text-white' : 'text-slate-200'}`}>
            Timeline Scrubber:
          </div>
        </div>

        <div className="flex-1 w-full flex items-center gap-3">
          <span className={`text-[11px] font-mono ${isCitizen ? 'text-zinc-400' : 'text-slate-400'}`}>T - 24 Hours</span>
          <input
            type="range"
            min={10}
            max={100}
            step={10}
            value={timeStep}
            onChange={(e) => setTimeStep(Number(e.target.value))}
            className={`w-full cursor-pointer h-1.5 rounded-lg ${isCitizen ? 'accent-white bg-[#000000]' : 'accent-sky-500 bg-[#0e1626]'}`}
          />
          <span className="text-[11px] font-mono text-emerald-400 font-bold">Live (Now)</span>
        </div>

        <div className={`text-xs font-mono whitespace-nowrap ${isCitizen ? 'text-zinc-400' : 'text-slate-400'}`}>
          {filteredEvents.length} clusters in window
        </div>
      </div>
    </div>
  );
};
