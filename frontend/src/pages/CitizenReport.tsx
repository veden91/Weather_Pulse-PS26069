import React, { useState } from 'react';
import { submitCitizenReport } from '../services/api';
import {
  Send,
  MapPin,
  Camera,
  Video,
  CheckCircle2,
  Clock,
  Sparkles,
  ShieldCheck,
  RotateCcw
} from 'lucide-react';

const EVENT_CATEGORIES = [
  'Heavy Rainfall',
  'Flood',
  'Flash Flood',
  'Thunderstorm',
  'Lightning',
  'Heatwave',
  'Cold Wave',
  'Dense Fog',
  'Fog',
  'Dust Storm',
  'Strong Wind',
  'Cyclone',
  'Hailstorm',
  'Cloudburst',
  'Landslide',
  'Rainfall'
];

export const CitizenReport: React.FC = () => {
  const [category, setCategory] = useState('Heavy Rainfall');
  const [description, setDescription] = useState('');
  const [locationName, setLocationName] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [lat, setLat] = useState<number | undefined>(undefined);
  const [lon, setLon] = useState<number | undefined>(undefined);
  const [photoUrl, setPhotoUrl] = useState('');
  const [isDetectingLocation, setIsDetectingLocation] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [receipt, setReceipt] = useState<any | null>(null);

  const handleUseCurrentLocation = () => {
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by your browser.');
      return;
    }
    setIsDetectingLocation(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLat(pos.coords.latitude);
        setLon(pos.coords.longitude);
        setLocationName(`GPS: ${pos.coords.latitude.toFixed(4)}, ${pos.coords.longitude.toFixed(4)}`);
        setIsDetectingLocation(false);
      },
      (err) => {
        console.warn('Geolocation error:', err);
        // Fallback default Lucknow for testing
        setLat(26.8467);
        setLon(80.9462);
        setLocationName('Gomti Nagar, Lucknow');
        setCity('Lucknow');
        setState('Uttar Pradesh');
        setIsDetectingLocation(false);
      }
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await submitCitizenReport({
        event_category: category,
        description,
        location_name: locationName,
        city: city || undefined,
        state: state || undefined,
        latitude: lat,
        longitude: lon,
        photo_url: photoUrl || undefined,
      });
      setReceipt(res);
    } catch (err) {
      console.error('Error submitting citizen report:', err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleReset = () => {
    setReceipt(null);
    setDescription('');
    setLocationName('');
    setCity('');
    setState('');
    setPhotoUrl('');
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div className="bg-[#121b2d] p-6 rounded-xl border border-[#1e293b] shadow-xl text-center space-y-2">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-sky-500/10 text-sky-400 text-xs font-mono border border-sky-500/20">
          <Sparkles className="w-3.5 h-3.5" />
          <span>National Weather Crowd Observation Portal</span>
        </div>
        <h1 className="text-xl font-bold text-slate-100">
          Report Weather Phenomenon & Ground Impact
        </h1>
        <p className="text-xs text-slate-400 max-w-lg mx-auto leading-relaxed">
          Section 31: Help disaster management teams and meteorologists verify real-time weather incidents in your area.
        </p>
      </div>

      {/* Submission Form or Receipt */}
      {!receipt ? (
        <form onSubmit={handleSubmit} className="bg-[#121b2d] p-6 rounded-xl border border-[#1e293b] shadow-2xl space-y-4">
          <div>
            <label className="text-xs text-slate-300 font-semibold block mb-1.5">
              Event Category *
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full bg-[#0e1626] border border-[#1e293b] rounded-lg p-2.5 text-xs text-slate-200 focus:outline-none focus:border-sky-500"
            >
              {EVENT_CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-xs text-slate-300 font-semibold block mb-1.5">
              Description of Observed Weather Event *
            </label>
            <textarea
              required
              rows={4}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="e.g. Heavy rainfall has caused waterlogging in Gomti Nagar, Lucknow. Roads flooded up to 2 feet."
              className="w-full bg-[#0e1626] border border-[#1e293b] rounded-lg p-3 text-xs text-slate-100 placeholder-slate-400 focus:outline-none focus:border-sky-500 leading-relaxed"
            />
          </div>

          {/* Location with Geolocation auto-detect */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs text-slate-300 font-semibold">Location</label>
              <button
                type="button"
                onClick={handleUseCurrentLocation}
                disabled={isDetectingLocation}
                className="text-[11px] text-sky-400 hover:text-sky-300 flex items-center gap-1 font-medium disabled:opacity-50"
              >
                <MapPin className="w-3.5 h-3.5" />
                <span>{isDetectingLocation ? 'Detecting GPS...' : 'Use Current Location'}</span>
              </button>
            </div>
            <input
              type="text"
              value={locationName}
              onChange={(e) => setLocationName(e.target.value)}
              placeholder="Area / Locality name (e.g. Hazratganj, Lucknow)"
              className="w-full bg-[#0e1626] border border-[#1e293b] rounded-lg p-2.5 text-xs text-slate-200 focus:outline-none focus:border-sky-500"
            />

            <div className="grid grid-cols-2 gap-3 pt-1">
              <input
                type="text"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                placeholder="City (e.g. Lucknow)"
                className="w-full bg-[#0e1626] border border-[#1e293b] rounded-lg p-2 text-xs text-slate-200"
              />
              <input
                type="text"
                value={state}
                onChange={(e) => setState(e.target.value)}
                placeholder="State (e.g. Uttar Pradesh)"
                className="w-full bg-[#0e1626] border border-[#1e293b] rounded-lg p-2 text-xs text-slate-200"
              />
            </div>
          </div>

          {/* Media attachment simulator */}
          <div className="space-y-1.5 pt-1">
            <label className="text-xs text-slate-300 font-semibold block">
              Photo / Video URL (Optional Proof)
            </label>
            <div className="flex gap-2">
              <input
                type="url"
                value={photoUrl}
                onChange={(e) => setPhotoUrl(e.target.value)}
                placeholder="Paste photo link or use sample: https://images.unsplash.com/..."
                className="flex-1 bg-[#0e1626] border border-[#1e293b] rounded-lg p-2 text-xs text-slate-200"
              />
              <button
                type="button"
                onClick={() =>
                  setPhotoUrl(
                    'https://images.unsplash.com/photo-1519692933481-e162a57d6721?w=800&auto=format&fit=crop&q=60'
                  )
                }
                className="px-3 py-2 rounded-lg bg-[#152033] border border-[#1e293b] text-xs font-semibold text-slate-300 hover:bg-[#1e293b]"
              >
                Sample Media
              </button>
            </div>
          </div>

          <div className="pt-3">
            <button
              type="submit"
              disabled={submitting}
              className="w-full py-3 rounded-lg bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs flex items-center justify-center gap-2 transition-all shadow-lg active:scale-98 disabled:opacity-50"
            >
              <Send className="w-4 h-4" />
              <span>{submitting ? 'Submitting to Ingestion Pipeline...' : 'Submit Weather Report'}</span>
            </button>
          </div>
        </form>
      ) : (
        /* Section 31 Receipt Dossier */
        <div className="bg-[#121b2d] p-6 rounded-xl border border-emerald-500/40 shadow-2xl space-y-4 animate-in zoom-in-95 duration-200">
          <div className="text-center space-y-1">
            <div className="w-12 h-12 rounded-full bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400 mx-auto mb-2">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <h2 className="text-base font-bold text-slate-100 uppercase tracking-wider">
              Report Successfully Ingested
            </h2>
            <p className="text-xs text-slate-400 font-mono">
              Assigned Tracking Docket: <strong className="text-sky-400">{receipt.report_id}</strong>
            </p>
          </div>

          <div className="bg-[#0e1626] p-4 rounded-lg border border-[#1e293b] space-y-2 text-xs">
            <div className="flex justify-between py-1 border-b border-[#1e293b]">
              <span className="text-slate-400">Assigned Cluster Event:</span>
              <span className="font-mono font-bold text-slate-200">{receipt.event_id}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-[#1e293b]">
              <span className="text-slate-400">AI Classification Status:</span>
              <span className="font-mono font-bold text-emerald-400">{receipt.ai_status}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-[#1e293b]">
              <span className="text-slate-400">AI Confidence Rating:</span>
              <span className="font-mono font-bold text-emerald-400">
                {Math.round(receipt.confidence * 100)}%
              </span>
            </div>
            <div className="flex justify-between py-1">
              <span className="text-slate-400">Verification Cell Status:</span>
              <span className="font-mono font-bold text-amber-400">
                {receipt.verification_status}
              </span>
            </div>
          </div>

          <div className="pt-2 flex justify-center">
            <button
              onClick={handleReset}
              className="px-5 py-2 rounded-lg bg-sky-600 hover:bg-sky-500 text-white text-xs font-bold flex items-center gap-2"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Submit Another Observation</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
