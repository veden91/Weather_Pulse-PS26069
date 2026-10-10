import React, { useState } from 'react';
import { submitCitizenReport } from '../services/api';
import { useAuth } from '../store/authContext';
import {
  Send,
  MapPin,
  Camera,
  Video,
  CheckCircle2,
  Clock,
  Sparkles,
  ShieldCheck,
  RotateCcw,
  Upload,
  X,
  ExternalLink,
  Globe
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
  const { role, user } = useAuth();
  const isCitizen = role === 'CITIZEN' || user?.role === 'CITIZEN' || (user?.role as string) === 'VIEWER';

  const [category, setCategory] = useState('Heavy Rainfall');
  const [description, setDescription] = useState('');
  const [locationName, setLocationName] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [lat, setLat] = useState<number | undefined>(undefined);
  const [lon, setLon] = useState<number | undefined>(undefined);
  const [mediaType, setMediaType] = useState<'image' | 'video'>('image');
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

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.type.startsWith('video/')) {
      setMediaType('video');
    } else {
      setMediaType('image');
    }

    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setPhotoUrl(reader.result);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    const isVideo = mediaType === 'video' || (photoUrl && (photoUrl.startsWith('data:video') || Boolean(photoUrl.match(/\.(mp4|webm|mov|ogg)($|\?)/i))));
    try {
      const res = await submitCitizenReport({
        event_category: category,
        description,
        location_name: locationName,
        city: city || undefined,
        state: state || undefined,
        latitude: lat,
        longitude: lon,
        photo_url: !isVideo ? (photoUrl || undefined) : undefined,
        video_url: isVideo ? (photoUrl || undefined) : undefined,
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
    setMediaType('image');
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div className={`p-6 rounded-2xl border shadow-xl text-center space-y-2 ${
        isCitizen ? 'bg-[#080808] border-zinc-800' : 'bg-[#121b2d] border-[#1e293b]'
      }`}>
        <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-mono border ${
          isCitizen ? 'bg-zinc-900 text-white border-zinc-700' : 'bg-sky-500/10 text-sky-400 border-sky-500/20'
        }`}>
          <Sparkles className="w-3.5 h-3.5" />
          <span>National Weather Crowd Observation Portal</span>
        </div>
        <h1 className={`text-xl font-bold ${isCitizen ? 'text-white' : 'text-slate-100'}`}>
          Report Weather Phenomenon & Ground Impact
        </h1>
        <p className={`text-xs max-w-lg mx-auto leading-relaxed ${isCitizen ? 'text-zinc-400' : 'text-slate-400'}`}>
          Help disaster management teams and meteorologists verify real-time weather incidents, floods & heavy rainfall in your area.
        </p>
      </div>

      {/* Submission Form or Receipt */}
      {!receipt ? (
        <form onSubmit={handleSubmit} className={`p-6 rounded-2xl border shadow-2xl space-y-4 ${
          isCitizen ? 'bg-[#080808] border-zinc-800' : 'bg-[#121b2d] border-[#1e293b]'
        }`}>
          <div>
            <label className={`text-xs font-semibold block mb-1.5 ${isCitizen ? 'text-zinc-300' : 'text-slate-300'}`}>
              Event Category *
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className={`w-full rounded-xl p-2.5 text-xs focus:outline-none ${
                isCitizen
                  ? 'bg-[#000000] border border-zinc-800 text-white focus:border-white'
                  : 'bg-[#0e1626] border border-[#1e293b] text-slate-200 focus:border-sky-500'
              }`}
            >
              {EVENT_CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className={`text-xs font-semibold block mb-1.5 ${isCitizen ? 'text-zinc-300' : 'text-slate-300'}`}>
              Description of Observed Weather Event *
            </label>
            <textarea
              required
              rows={4}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="e.g. Heavy rainfall has caused waterlogging in Gomti Nagar, Lucknow. Roads flooded up to 2 feet."
              className={`w-full rounded-xl p-3 text-xs leading-relaxed focus:outline-none ${
                isCitizen
                  ? 'bg-[#000000] border border-zinc-800 text-white placeholder-zinc-500 focus:border-white'
                  : 'bg-[#0e1626] border border-[#1e293b] text-slate-100 placeholder-slate-400 focus:border-sky-500'
              }`}
            />
          </div>

          {/* Location with Geolocation auto-detect */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className={`text-xs font-semibold ${isCitizen ? 'text-zinc-300' : 'text-slate-300'}`}>Location</label>
              <button
                type="button"
                onClick={handleUseCurrentLocation}
                disabled={isDetectingLocation}
                className={`text-[11px] flex items-center gap-1 font-medium disabled:opacity-50 ${
                  isCitizen ? 'text-white hover:underline' : 'text-sky-400 hover:text-sky-300'
                }`}
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
              className={`w-full rounded-xl p-2.5 text-xs focus:outline-none ${
                isCitizen
                  ? 'bg-[#000000] border border-zinc-800 text-white focus:border-white placeholder-zinc-500'
                  : 'bg-[#0e1626] border border-[#1e293b] text-slate-200 focus:border-sky-500 placeholder-slate-400'
              }`}
            />

            <div className="grid grid-cols-2 gap-3 pt-1">
              <input
                type="text"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                placeholder="City (e.g. Lucknow)"
                className={`w-full rounded-xl p-2 text-xs focus:outline-none ${
                  isCitizen ? 'bg-[#000000] border border-zinc-800 text-white placeholder-zinc-500' : 'bg-[#0e1626] border border-[#1e293b] text-slate-200'
                }`}
              />
              <input
                type="text"
                value={state}
                onChange={(e) => setState(e.target.value)}
                placeholder="State (e.g. Uttar Pradesh)"
                className={`w-full rounded-xl p-2 text-xs focus:outline-none ${
                  isCitizen ? 'bg-[#000000] border border-zinc-800 text-white placeholder-zinc-500' : 'bg-[#0e1626] border border-[#1e293b] text-slate-200'
                }`}
              />
            </div>
          </div>

          {/* Photo & Video Attachment Section */}
          <div className="space-y-2 pt-2 border-t border-zinc-800/80">
            <div className="flex items-center justify-between">
              <label className={`text-xs font-semibold block ${isCitizen ? 'text-zinc-300' : 'text-slate-300'}`}>
                Photo / Video Proof Attachment (Optional)
              </label>
              <div className={`flex items-center gap-1 p-0.5 rounded-lg border ${
                isCitizen ? 'bg-zinc-900 border-zinc-800' : 'bg-[#0e1626] border-[#1e293b]'
              }`}>
                <button
                  type="button"
                  onClick={() => setMediaType('image')}
                  className={`px-2.5 py-1 rounded text-[11px] font-semibold flex items-center gap-1 transition-all ${
                    mediaType === 'image'
                      ? isCitizen ? 'bg-white text-black shadow' : 'bg-sky-600 text-white shadow'
                      : isCitizen ? 'text-zinc-400 hover:text-white' : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <Camera className="w-3 h-3" />
                  <span>Photo</span>
                </button>
                <button
                  type="button"
                  onClick={() => setMediaType('video')}
                  className={`px-2.5 py-1 rounded text-[11px] font-semibold flex items-center gap-1 transition-all ${
                    mediaType === 'video'
                      ? isCitizen ? 'bg-white text-black shadow' : 'bg-emerald-600 text-white shadow'
                      : isCitizen ? 'text-zinc-400 hover:text-white' : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <Video className="w-3 h-3" />
                  <span>Video</span>
                </button>
              </div>
            </div>

            {/* Upload File or Quick Samples */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <label className={`flex items-center justify-center gap-2 p-2.5 rounded-xl border border-dashed cursor-pointer text-xs font-semibold transition-all ${
                isCitizen
                  ? 'bg-[#000000] border-zinc-700 hover:border-white text-zinc-300 hover:text-white'
                  : 'bg-[#0e1626] border-[#1e293b] hover:border-sky-500 text-slate-300'
              }`}>
                <Upload className={`w-4 h-4 ${mediaType === 'video' ? 'text-emerald-400' : 'text-sky-400'}`} />
                <span>Upload {mediaType === 'video' ? 'Video File' : 'Photo File'}</span>
                <input
                  type="file"
                  accept={mediaType === 'video' ? 'video/*' : 'image/*'}
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </label>

              <div className="flex gap-1.5">
                <button
                  type="button"
                  onClick={() => {
                    setMediaType('image');
                    setPhotoUrl('https://images.unsplash.com/photo-1519692933481-e162a57d6721?w=800&auto=format&fit=crop&q=60');
                  }}
                  className={`flex-1 py-2 rounded-xl border text-[11px] font-semibold flex items-center justify-center gap-1 transition-all ${
                    isCitizen
                      ? 'bg-zinc-900 border-zinc-800 text-zinc-300 hover:bg-zinc-800 hover:text-white'
                      : 'bg-[#152033] border-[#1e293b] text-slate-300 hover:bg-[#1e293b]'
                  }`}
                >
                  <Camera className="w-3 h-3 text-sky-400" />
                  <span>Sample Photo</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setMediaType('video');
                    setPhotoUrl('https://assets.mixkit.co/videos/preview/mixkit-rain-falling-on-the-water-43307-large.mp4');
                  }}
                  className={`flex-1 py-2 rounded-xl border text-[11px] font-semibold flex items-center justify-center gap-1 transition-all ${
                    isCitizen
                      ? 'bg-zinc-900 border-zinc-800 text-zinc-300 hover:bg-zinc-800 hover:text-white'
                      : 'bg-[#152033] border-[#1e293b] text-slate-300 hover:bg-[#1e293b]'
                  }`}
                >
                  <Video className="w-3 h-3 text-emerald-400" />
                  <span>Sample Video</span>
                </button>
              </div>
            </div>

            {/* Direct URL Link Input */}
            <input
              type="url"
              value={photoUrl}
              onChange={(e) => {
                const val = e.target.value;
                setPhotoUrl(val);
                if (val.match(/\.(mp4|webm|mov|ogg)($|\?)/i) || val.includes('video')) {
                  setMediaType('video');
                }
              }}
              placeholder={`Paste ${mediaType === 'video' ? 'video' : 'photo'} URL link (https://...)...`}
              className={`w-full rounded-xl p-2.5 text-xs focus:outline-none ${
                isCitizen
                  ? 'bg-[#000000] border border-zinc-800 text-white focus:border-white placeholder-zinc-500'
                  : 'bg-[#0e1626] border border-[#1e293b] text-slate-200 focus:border-sky-500 placeholder-slate-400'
              }`}
            />

            {/* Media Live Preview Card */}
            {photoUrl && (
              <div className={`p-2.5 rounded-xl border relative overflow-hidden ${
                isCitizen ? 'bg-[#000000] border-zinc-800' : 'bg-[#0e1626] border-[#1e293b]'
              }`}>
                <div className="flex items-center justify-between mb-1.5 px-1">
                  <span className={`text-[11px] font-mono uppercase font-bold flex items-center gap-1.5 ${
                    mediaType === 'video' ? 'text-emerald-400' : 'text-sky-400'
                  }`}>
                    {mediaType === 'video' ? <Video className="w-3.5 h-3.5" /> : <Camera className="w-3.5 h-3.5" />}
                    Attached {mediaType === 'video' ? 'Video' : 'Photo'} Preview
                  </span>
                  <button
                    type="button"
                    onClick={() => setPhotoUrl('')}
                    className="text-[11px] text-rose-400 hover:text-rose-300 font-semibold"
                  >
                    Remove
                  </button>
                </div>

                {mediaType === 'video' || photoUrl.startsWith('data:video') || photoUrl.match(/\.(mp4|webm|mov|ogg)($|\?)/i) ? (
                  <video
                    src={photoUrl}
                    controls
                    className="w-full h-44 object-cover rounded-lg border border-zinc-800 bg-black"
                  />
                ) : (
                  <img
                    src={photoUrl}
                    alt="Weather Observation Proof"
                    className="w-full h-44 object-cover rounded-lg border border-zinc-800"
                    onError={(e) => {
                      (e.target as HTMLElement).style.display = 'none';
                    }}
                  />
                )}
              </div>
            )}
          </div>

          <div className="pt-3">
            <button
              type="submit"
              disabled={submitting}
              className={`w-full py-3 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all shadow-lg active:scale-98 disabled:opacity-50 ${
                isCitizen ? 'bg-white text-black hover:bg-zinc-200' : 'bg-sky-600 hover:bg-sky-500 text-white'
              }`}
            >
              <Send className="w-4 h-4" />
              <span>{submitting ? 'Submitting to Ingestion Pipeline...' : 'Submit Weather Report'}</span>
            </button>
          </div>
        </form>
      ) : (
        /* Section 31 Receipt Dossier */
        <div className={`p-6 rounded-2xl border shadow-2xl space-y-4 animate-in zoom-in-95 duration-200 ${
          isCitizen ? 'bg-[#080808] border-zinc-800' : 'bg-[#121b2d] border-emerald-500/40'
        }`}>
          <div className="text-center space-y-1">
            <div className="w-12 h-12 rounded-full bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400 mx-auto mb-2">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <h2 className={`text-base font-bold uppercase tracking-wider ${isCitizen ? 'text-white' : 'text-slate-100'}`}>
              Report Successfully Ingested
            </h2>
            <p className={`text-xs font-mono ${isCitizen ? 'text-zinc-400' : 'text-slate-400'}`}>
              Assigned Tracking Docket: <strong className={isCitizen ? 'text-white' : 'text-sky-400'}>{receipt.report_id}</strong>
            </p>
          </div>

          <div className={`p-4 rounded-xl border space-y-2 text-xs ${
            isCitizen ? 'bg-[#000000] border-zinc-800' : 'bg-[#0e1626] border-[#1e293b]'
          }`}>
            <div className={`flex justify-between py-1 border-b ${isCitizen ? 'border-zinc-800' : 'border-[#1e293b]'}`}>
              <span className={isCitizen ? 'text-zinc-400' : 'text-slate-400'}>Assigned Cluster Event:</span>
              <span className={`font-mono font-bold ${isCitizen ? 'text-white' : 'text-slate-200'}`}>{receipt.event_id}</span>
            </div>
            <div className={`flex justify-between py-1 border-b ${isCitizen ? 'border-zinc-800' : 'border-[#1e293b]'}`}>
              <span className={isCitizen ? 'text-zinc-400' : 'text-slate-400'}>AI Classification Status:</span>
              <span className="font-mono font-bold text-emerald-400">{receipt.ai_status}</span>
            </div>
            <div className={`flex justify-between py-1 border-b ${isCitizen ? 'border-zinc-800' : 'border-[#1e293b]'}`}>
              <span className={isCitizen ? 'text-zinc-400' : 'text-slate-400'}>AI Confidence Rating:</span>
              <span className="font-mono font-bold text-emerald-400">
                {Math.round(receipt.confidence * 100)}%
              </span>
            </div>
            <div className={`flex justify-between py-1 ${receipt.trust_score ? (isCitizen ? 'border-b border-zinc-800' : 'border-b border-[#1e293b]') : ''}`}>
              <span className={isCitizen ? 'text-zinc-400' : 'text-slate-400'}>Verification Cell Status:</span>
              <span className="font-mono font-bold text-amber-400">
                {receipt.verification_status}
              </span>
            </div>
            {receipt.trust_score && (
              <div className="flex justify-between py-1">
                <span className={isCitizen ? 'text-zinc-400' : 'text-slate-400'}>Multi-Factor Trust Score:</span>
                <span className={`font-mono font-bold ${receipt.trust_score >= 80 ? 'text-emerald-400' : 'text-sky-400'}`}>
                  {receipt.trust_score} / 100 {receipt.trust_score >= 85 ? '(Auto-Verified)' : ''}
                </span>
              </div>
            )}
          </div>

          {/* Section: TinyFish Live Web Corroboration */}
          {receipt.citations && receipt.citations.length > 0 && (
            <div className={`p-4 rounded-xl border space-y-2.5 ${
              isCitizen ? 'bg-zinc-950/80 border-zinc-800' : 'bg-[#0b1324] border-sky-500/30'
            }`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-lg bg-sky-500/20 text-sky-400 flex items-center justify-center">
                    <Globe className="w-3.5 h-3.5" />
                  </div>
                  <span className="text-xs font-bold text-slate-200">
                    TinyFish Live Web Corroboration
                  </span>
                </div>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  {receipt.citations.length} Sources Confirmed
                </span>
              </div>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                Autonomous AI search detected matching real-time news bulletins and meteorological advisories in this area:
              </p>
              <div className="space-y-1.5 pt-1">
                {receipt.citations.map((c: any, idx: number) => (
                  <a
                    key={idx}
                    href={c.url}
                    target="_blank"
                    rel="noreferrer"
                    className="block p-2 rounded-lg bg-[#0e1626]/80 hover:bg-[#15233d] border border-slate-800/80 hover:border-sky-500/40 transition-colors group text-left"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <span className="text-xs font-semibold text-slate-200 group-hover:text-sky-300 line-clamp-1">
                        {c.title}
                      </span>
                      <ExternalLink className="w-3 h-3 text-slate-400 group-hover:text-sky-400 shrink-0 mt-0.5" />
                    </div>
                    {c.snippet && (
                      <p className="text-[10px] text-slate-400 line-clamp-2 mt-0.5 leading-normal">
                        {c.snippet}
                      </p>
                    )}
                  </a>
                ))}
              </div>
            </div>
          )}

          <div className="pt-2 flex justify-center">
            <button
              onClick={handleReset}
              className={`px-5 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 transition-all ${
                isCitizen ? 'bg-white text-black hover:bg-zinc-200' : 'bg-sky-600 hover:bg-sky-500 text-white'
              }`}
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

