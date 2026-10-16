import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { MapPin, X, AlertCircle, CheckCircle2, ChevronRight } from 'lucide-react';

interface InteractiveMapProps {
  onSelectGrievance?: (id: string) => void;
}

export const InteractiveMap: React.FC<InteractiveMapProps> = ({ onSelectGrievance }) => {
  const { language, navigateToTrack } = useApp();
  const [activeDistrict, setActiveDistrict] = useState<string>('Chennai');

  const districtHotspots = [
    {
      id: 'Chennai',
      nameEn: 'Chennai District',
      nameTa: 'சென்னை மாவட்டம்',
      total: 480,
      activeCritical: 8,
      cx: '72%',
      cy: '28%',
      pins: [
        {
          id: 'GRV-2026-00124',
          title: 'Damaged Street Lights',
          priority: 'Medium',
          location: 'Triplicane, Marina',
        },
        {
          id: 'GRV-2026-00125',
          title: 'Water Main Leakage & Flooding',
          priority: 'High',
          location: 'Anna Nagar 4th Avenue',
        },
      ],
    },
    {
      id: 'Madurai',
      nameEn: 'Madurai District',
      nameTa: 'மதுரை மாவட்டம்',
      total: 240,
      activeCritical: 4,
      cx: '52%',
      cy: '75%',
      pins: [
        {
          id: 'GRV-2026-00126',
          title: 'Garbage Dump Overflow',
          priority: 'Medium',
          location: 'Simmakkal Market',
        },
      ],
    },
    {
      id: 'Coimbatore',
      nameEn: 'Coimbatore District',
      nameTa: 'கோயம்புத்தூர் மாவட்டம்',
      total: 310,
      activeCritical: 3,
      cx: '30%',
      cy: '56%',
      pins: [
        {
          id: 'GRV-2026-00128',
          title: 'Dangerous Pothole on Flyover',
          priority: 'Critical',
          location: 'Avinashi Road',
        },
      ],
    },
    {
      id: 'Tiruchirappalli',
      nameEn: 'Trichy District',
      nameTa: 'திருச்சிராப்பள்ளி மாவட்டம்',
      total: 175,
      activeCritical: 2,
      cx: '55%',
      cy: '52%',
      pins: [
        {
          id: 'GRV-2026-00129',
          title: 'Open Sewage Manhole',
          priority: 'High',
          location: 'Thillai Nagar',
        },
      ],
    },
    {
      id: 'Salem',
      nameEn: 'Salem District',
      nameTa: 'சேலம் மாவட்டம்',
      total: 135,
      activeCritical: 1,
      cx: '48%',
      cy: '40%',
      pins: [
        {
          id: 'GRV-2026-00130',
          title: 'Drainage Canal Blockage',
          priority: 'Low',
          location: 'Suramangalam Main Rd',
        },
      ],
    },
  ];

  const current = districtHotspots.find((d) => d.id === activeDistrict) || districtHotspots[0];

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-6">
      <div className="flex justify-between items-center pb-3 border-b border-slate-100">
        <div>
          <h3 className="text-base font-bold text-slate-900 flex items-center space-x-2">
            <MapPin className="w-5 h-5 text-indigo-600" />
            <span>
              {language === 'ta'
                ? 'தமிழ்நாடு நேரலை குறைதீர்ப்பு வரைபடம்'
                : 'Tamil Nadu Live Grievance Map'}
            </span>
          </h3>
          <p className="text-xs text-slate-500">
            Interactive GIS civic heatmap and real-time district incident logs
          </p>
        </div>

        <div className="flex items-center space-x-2 text-xs">
          <span className="flex items-center space-x-1">
            <span className="w-2.5 h-2.5 rounded-full bg-red-600 inline-block" />
            <span className="text-slate-600">Critical</span>
          </span>
          <span className="flex items-center space-x-1">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500 inline-block" />
            <span className="text-slate-600">Medium</span>
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Visual Map Canvas / Hotspot Selector (7 cols) */}
        <div className="lg:col-span-7 bg-slate-950 rounded-2xl p-6 relative min-h-[320px] flex items-center justify-center overflow-hidden border border-slate-800">
          <div className="absolute inset-0 bg-[radial-gradient(#4f46e5_1px,transparent_1px)] [background-size:16px_16px] opacity-20" />

          {/* Map District Pins */}
          {districtHotspots.map((d) => {
            const isSelected = activeDistrict === d.id;
            return (
              <button
                key={d.id}
                type="button"
                onClick={() => setActiveDistrict(d.id)}
                style={{ top: d.cy, left: d.cx }}
                className={`absolute -translate-x-1/2 -translate-y-1/2 p-1.5 rounded-2xl transition-all duration-200 flex items-center space-x-1.5 ${
                  isSelected
                    ? 'bg-indigo-600 text-white ring-4 ring-indigo-400/40 z-20 scale-110 shadow-lg'
                    : 'bg-slate-900/90 text-slate-200 hover:bg-slate-800 border border-slate-700 z-10'
                }`}
              >
                <MapPin className={`w-3.5 h-3.5 ${d.activeCritical > 2 ? 'text-red-400 animate-bounce' : 'text-amber-300'}`} />
                <span className="text-[11px] font-bold">{d.id}</span>
                <span className="bg-white/20 text-[10px] px-1 rounded font-mono">
                  {d.pins.length}
                </span>
              </button>
            );
          })}

          <div className="absolute bottom-3 left-3 text-[10px] text-slate-400 font-mono">
            GIS Coordinates: 13.0827° N, 80.2707° E | Tamil Nadu Geo-grid
          </div>
        </div>

        {/* District Active Incidents Panel (5 cols) */}
        <div className="lg:col-span-5 space-y-4 flex flex-col justify-between">
          <div className="space-y-3">
            <div className="bg-indigo-50 p-4 rounded-2xl border border-indigo-200">
              <span className="text-[10px] font-bold uppercase text-indigo-800 block">
                Selected District Hotspot
              </span>
              <h4 className="text-base font-bold text-indigo-950 mt-0.5">
                {language === 'ta' ? current.nameTa : current.nameEn}
              </h4>
              <div className="flex items-center space-x-3 mt-2 text-xs">
                <span className="font-semibold text-slate-700">
                  {current.total} Total Registered
                </span>
                <span>•</span>
                <span className="font-bold text-red-600">
                  {current.activeCritical} Critical Active
                </span>
              </div>
            </div>

            {/* Pinned incidents inside selected district */}
            <div className="space-y-2">
              <span className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
                Active Incidents Pinned:
              </span>
              {current.pins.map((pin) => (
                <div
                  key={pin.id}
                  onClick={() => navigateToTrack(pin.id)}
                  className="p-3 bg-slate-50 hover:bg-indigo-50/60 rounded-xl border border-slate-200 hover:border-indigo-300 transition-all cursor-pointer flex justify-between items-center text-xs group"
                >
                  <div>
                    <div className="flex items-center space-x-2">
                      <span className="font-mono font-bold text-indigo-800">{pin.id}</span>
                      <span
                        className={`text-[10px] font-bold px-1.5 py-0.2 rounded ${
                          pin.priority === 'Critical'
                            ? 'bg-red-100 text-red-800'
                            : 'bg-amber-100 text-amber-800'
                        }`}
                      >
                        {pin.priority}
                      </span>
                    </div>
                    <p className="text-slate-800 font-medium mt-0.5">{pin.title}</p>
                    <p className="text-[11px] text-slate-500">{pin.location}</p>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-indigo-600 group-hover:translate-x-1 transition-transform" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
