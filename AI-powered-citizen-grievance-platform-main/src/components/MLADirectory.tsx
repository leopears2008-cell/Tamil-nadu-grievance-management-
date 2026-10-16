import React, { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { getAvailableDistricts, getConstituenciesForDistrict, getMLAForConstituency, getAllMLAs } from '../data/mlaProfiles';
import { Search, MapPin, Phone, Mail, Building2, User } from 'lucide-react';

export const MLADirectory: React.FC = () => {
  const { language } = useApp();
  const districts = useMemo(() => getAvailableDistricts(), []);
  const [selectedDistrict, setSelectedDistrict] = useState<string>('All Districts');
  const [searchQuery, setSearchQuery] = useState('');

  const availableConstituencies = useMemo(() => getConstituenciesForDistrict(selectedDistrict), [selectedDistrict]);
  const allMLAs = useMemo(() => getAllMLAs(), []);

  const displayedMLAs = useMemo(() => {
    let filtered = selectedDistrict === 'All Districts' 
      ? allMLAs 
      : allMLAs.filter(m => m.district === selectedDistrict);

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      filtered = filtered.filter(m => 
        m.name.toLowerCase().includes(q) || 
        m.constituency.toLowerCase().includes(q) || 
        m.party.toLowerCase().includes(q) ||
        (m.pincodes && m.pincodes.some(p => p.includes(q))) ||
        (m.locations && m.locations.some(l => l.toLowerCase().includes(q)))
      );
    }
    
    return filtered;
  }, [selectedDistrict, searchQuery, allMLAs]);

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 sm:p-8">
        <h2 className="text-xl font-bold text-slate-900 mb-2">
          {language === 'ta' ? 'சட்டமன்ற உறுப்பினர் கையேடு' : 'MLA Directory'}
        </h2>
        <p className="text-sm text-slate-500 mb-8">
          {language === 'ta'
            ? 'உங்கள் மாவட்டத்தையும் தொகுதியையும் தேர்ந்தெடுத்து உங்கள் சட்டமன்ற உறுப்பினரின் விவரங்களை அறியவும்.'
            : 'Search across all constituencies or filter by district to find your representative.'}
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-8">
          <div>
            <label className="text-xs font-semibold text-slate-600 block mb-1.5">
              {language === 'ta' ? 'மாவட்டம்' : 'Filter by District'}
            </label>
            <select
              value={selectedDistrict}
              onChange={(e) => setSelectedDistrict(e.target.value)}
              className="w-full p-3 text-sm text-slate-900 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-600 focus:outline-none bg-slate-50 font-medium"
            >
              {districts.map((d) => (
                <option key={d} value={d}>
                  {d === 'All Districts' && language === 'ta' ? 'அனைத்து மாவட்டங்களும்' : d}
                </option>
              ))}
            </select>
          </div>

          <div className="sm:col-span-2 relative">
            <label className="text-xs font-semibold text-slate-600 block mb-1.5">
              {language === 'ta' ? 'தேடல்' : 'Search MLA, Constituency, or Pincode'}
            </label>
            <div className="relative">
              <Search className="absolute left-3.5 top-3.5 w-4 h-4 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={language === 'ta' ? 'தொகுதி, உறுப்பினர் பெயர், அல்லது பின்கோடு...' : 'Search by constituency, name, location, or pincode...'}
                className="w-full pl-11 p-3 text-sm text-slate-900 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-600 focus:outline-none bg-slate-50"
              />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {displayedMLAs.length > 0 ? (
            displayedMLAs.map((mla, idx) => (
              <div key={`${mla.constituency}-${idx}`} className="bg-indigo-50/40 border border-indigo-100 p-5 rounded-2xl flex flex-col h-full hover:shadow-md transition-shadow">
                <div className="flex items-start space-x-4 mb-4">
                  <img
                    src={mla.avatar}
                    alt="MLA Avatar"
                    className="w-16 h-16 rounded-full border-2 border-indigo-200 shadow-sm shrink-0 bg-white"
                  />
                  <div>
                    <h3 className="text-lg font-bold text-indigo-950 leading-tight mb-1">
                      {mla.name} <span className="text-xs text-indigo-700 font-medium bg-indigo-100 px-1.5 py-0.5 rounded">({mla.party})</span>
                    </h3>
                    <p className="text-xs font-semibold text-slate-700 flex items-center">
                      <MapPin className="w-3.5 h-3.5 mr-1 text-indigo-500" />
                      {mla.constituency}
                    </p>
                    <p className="text-[10px] text-slate-500 mt-0.5 ml-4.5">
                      {mla.district} District
                    </p>
                  </div>
                </div>
                
                <div className="flex flex-col gap-2 mt-auto pt-4 border-t border-indigo-100/50">
                  <div className="flex gap-2">
                    <a
                      href={`tel:${mla.phone}`}
                      className="flex-1 flex items-center justify-center space-x-1.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 px-3 py-2 rounded-lg shadow-sm transition-colors"
                    >
                      <Phone className="w-3.5 h-3.5" />
                      <span>{language === 'ta' ? 'அழைக்க' : 'Call'}</span>
                    </a>
                    <a
                      href={`mailto:${mla.email}`}
                      className="flex-1 flex items-center justify-center space-x-1.5 text-xs font-semibold text-indigo-700 bg-white hover:bg-slate-50 px-3 py-2 rounded-lg border border-indigo-200 shadow-sm transition-colors"
                    >
                      <Mail className="w-3.5 h-3.5" />
                      <span>{language === 'ta' ? 'மின்னஞ்சல்' : 'Email'}</span>
                    </a>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="col-span-full py-12 text-center">
              <User className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <h3 className="text-lg font-semibold text-slate-900 mb-1">
                {language === 'ta' ? 'எந்த தரவும் கிடைக்கவில்லை' : 'No Representatives Found'}
              </h3>
              <p className="text-sm text-slate-500">
                {language === 'ta' ? 'உங்கள் தேடலை மாற்றி மீண்டும் முயற்சிக்கவும்.' : 'Try adjusting your search or district filter.'}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
