export interface MLAProfile {
  name: string;
  constituency: string;
  district: string;
  phone: string;
  email: string;
  party: string;
  avatar: string;
  officeAddress?: string;
  pincodes?: string[];
  locations?: string[];
}

const mlaMap: Record<string, Partial<MLAProfile>> = {
  'Ariyalur': { name: 'Thiru. K. Chinnappa', constituency: 'Ariyalur', party: 'DMK', pincodes: ['621704', '621713'], locations: ['Ariyalur Town', 'Jayankondam'] },
  'Chengalpattu': { name: 'Thiru. M. Varalakshmi', constituency: 'Chengalpattu', party: 'DMK', pincodes: ['603001', '603002'], locations: ['Chengalpattu Town', 'Mahabalipuram'] },
  'Chennai': { name: 'Thiru. Udhayanidhi Stalin', constituency: 'Chepauk-Thiruvallikeni', party: 'DMK', pincodes: ['600002', '600005'], locations: ['Chepauk', 'Triplicane', 'Marina'] },
  'Coimbatore': { name: 'Thiru. Amman K. Arjunan', constituency: 'Coimbatore North', party: 'AIADMK', pincodes: ['641011', '641012'], locations: ['RS Puram', 'Gandhipuram'] },
  'Cuddalore': { name: 'Thiru. G. Iyappan', constituency: 'Cuddalore', party: 'DMK', pincodes: ['607001', '607002'], locations: ['Cuddalore Port', 'Manjakuppam'] },
  'Dharmapuri': { name: 'Thiru. S. P. Venkateshwaran', constituency: 'Dharmapuri', party: 'PMK', pincodes: ['636701', '636705'], locations: ['Dharmapuri Town'] },
  'Dindigul': { name: 'Thiru. I. Periyasamy', constituency: 'Athoor', party: 'DMK', pincodes: ['624001', '624002'], locations: ['Athoor', 'Dindigul City'] },
  'Erode': { name: 'Thiru. E. V. K. S. Elangovan', constituency: 'Erode East', party: 'INC', pincodes: ['638001', '638011'], locations: ['Brough Road', 'Karungalpalayam'] },
  'Kallakurichi': { name: 'Thiru. M. Senthilkumar', constituency: 'Kallakurichi', party: 'AIADMK', pincodes: ['606202', '606213'], locations: ['Kallakurichi Town'] },
  'Kanchipuram': { name: 'Thiru. C. V. M. P. Ezhilarasan', constituency: 'Kanchipuram', party: 'DMK', pincodes: ['631501', '631502'], locations: ['Kanchipuram City', 'Sriperumbudur'] },
  'Kanyakumari': { name: 'Thiru. M. R. Gandhi', constituency: 'Nagercoil', party: 'BJP', pincodes: ['629001', '629002'], locations: ['Nagercoil Town', 'Kanyakumari Beach'] },
  'Karur': { name: 'Thiru. V. Senthilbalaji', constituency: 'Karur', party: 'DMK', pincodes: ['639001', '639002'], locations: ['Karur Town', 'Vengamedu'] },
  'Krishnagiri': { name: 'Thiru. K. Ashokkumar', constituency: 'Krishnagiri', party: 'AIADMK', pincodes: ['635001', '635002'], locations: ['Krishnagiri Town', 'Hosur'] },
  'Madurai': { name: 'Thiru. G. Thalapathi', constituency: 'Madurai North', party: 'DMK', pincodes: ['625001', '625002'], locations: ['Anna Nagar', 'KK Nagar'] },
  'Mayiladuthurai': { name: 'Thiru. S. Rajakumar', constituency: 'Mayiladuthurai', party: 'INC', pincodes: ['609001', '609002'], locations: ['Mayiladuthurai Town'] },
  'Nagapattinam': { name: 'Thiru. Aloor Sha Navas', constituency: 'Nagapattinam', party: 'VCK', pincodes: ['611001', '611002'], locations: ['Nagapattinam Town', 'Velankanni'] },
  'Namakkal': { name: 'Thiru. P. Ramalingam', constituency: 'Namakkal', party: 'DMK', pincodes: ['637001', '637002'], locations: ['Namakkal Town', 'Tiruchengode'] },
  'Nilgiris': { name: 'Thiru. J. Hutches', constituency: 'Udhagamandalam', party: 'INC', pincodes: ['643001', '643002'], locations: ['Ooty', 'Coonoor'] },
  'Perambalur': { name: 'Thiru. M. Prabhakaran', constituency: 'Perambalur', party: 'DMK', pincodes: ['621212', '621220'], locations: ['Perambalur Town'] },
  'Pudukkottai': { name: 'Thiru. V. Muthuraja', constituency: 'Pudukkottai', party: 'DMK', pincodes: ['622001', '622002'], locations: ['Pudukkottai Town', 'Alangudi'] },
  'Ramanathapuram': { name: 'Thiru. K. Muthuramalingam', constituency: 'Ramanathapuram', party: 'DMK', pincodes: ['623501', '623502'], locations: ['Ramanathapuram Town', 'Rameswaram'] },
  'Ranipet': { name: 'Thiru. R. Gandhi', constituency: 'Ranipet', party: 'DMK', pincodes: ['632401', '632402'], locations: ['Ranipet Town', 'Arcot'] },
  'Salem': { name: 'Thiru. R. Rajendran', constituency: 'Salem North', party: 'DMK', pincodes: ['636001', '636002'], locations: ['Salem City', 'Hasthampatti'] },
  'Sivaganga': { name: 'Thiru. PR. Senthilnathan', constituency: 'Sivaganga', party: 'AIADMK', pincodes: ['630561', '630562'], locations: ['Sivaganga Town', 'Karaikudi'] },
  'Tenkasi': { name: 'Thiru. S. Palani Nadar', constituency: 'Tenkasi', party: 'INC', pincodes: ['627811', '627814'], locations: ['Tenkasi Town', 'Courtallam'] },
  'Thanjavur': { name: 'Thiru. T. K. G. Neelamegam', constituency: 'Thanjavur', party: 'DMK', pincodes: ['613001', '613002'], locations: ['Thanjavur City', 'Kumbakonam'] },
  'Theni': { name: 'Thiru. O. Panneerselvam', constituency: 'Bodinayakanur', party: 'IND', pincodes: ['625513', '625531'], locations: ['Bodinayakanur', 'Theni Town'] },
  'Thoothukudi': { name: 'Thiru. Geetha Jeevan', constituency: 'Thoothukudi', party: 'DMK', pincodes: ['628001', '628002'], locations: ['Thoothukudi City', 'Kovilpatti'] },
  'Tiruchirappalli': { name: 'Thiru. K. N. Nehru', constituency: 'Tiruchirappalli West', party: 'DMK', pincodes: ['620001', '620002'], locations: ['Trichy City', 'Thillai Nagar'] },
  'Tirunelveli': { name: 'Thiru. Nainar Nagenthran', constituency: 'Tirunelveli', party: 'BJP', pincodes: ['627001', '627002'], locations: ['Tirunelveli Town', 'Palayamkottai'] },
  'Tirupathur': { name: 'Thiru. A. Nallathambi', constituency: 'Tirupathur', party: 'DMK', pincodes: ['635601', '635602'], locations: ['Tirupathur Town', 'Jolarpettai'] },
  'Tiruppur': { name: 'Thiru. K. Selvaraj', constituency: 'Tiruppur South', party: 'DMK', pincodes: ['641601', '641604'], locations: ['Tiruppur City', 'Palladam'] },
  'Tiruvallur': { name: 'Thiru. V. G. Raajendran', constituency: 'Tiruvallur', party: 'DMK', pincodes: ['602001', '602002'], locations: ['Tiruvallur Town', 'Avadi'] },
  'Tiruvannamalai': { name: 'Thiru. E. V. Velu', constituency: 'Tiruvannamalai', party: 'DMK', pincodes: ['606601', '606603'], locations: ['Tiruvannamalai Town', 'Polur'] },
  'Tiruvarur': { name: 'Thiru. Poondi K. Kalaivanan', constituency: 'Tiruvarur', party: 'DMK', pincodes: ['610001', '610002'], locations: ['Tiruvarur Town', 'Mannargudi'] },
  'Vellore': { name: 'Thiru. P. Karthikeyan', constituency: 'Vellore', party: 'DMK', pincodes: ['632001', '632002'], locations: ['Vellore City', 'Katpadi'] },
  'Viluppuram': { name: 'Thiru. R. Lakshmanan', constituency: 'Viluppuram', party: 'DMK', pincodes: ['605602', '605603'], locations: ['Viluppuram Town', 'Tindivanam'] },
  'Virudhunagar': { name: 'Thiru. A. R. R. Srinivasan', constituency: 'Virudhunagar', party: 'DMK', pincodes: ['626001', '626002'], locations: ['Virudhunagar Town', 'Sivakasi'] }
};

const defaultConstituencies = ['North', 'South', 'Central', 'East', 'West'];

export const getAvailableDistricts = (): string[] => {
  return ['All Districts', ...Object.keys(mlaMap).sort()];
};

export const getAllMLAs = (): MLAProfile[] => {
  const all: MLAProfile[] = [];
  Object.keys(mlaMap).forEach(d => {
    getConstituenciesForDistrict(d).forEach(c => {
      all.push(getMLAForConstituency(d, c));
    });
  });
  return all;
};

export const getConstituenciesForDistrict = (district: string): string[] => {
  if (district === 'All Districts') {
    const all: string[] = [];
    Object.keys(mlaMap).forEach(d => {
      const hq = mlaMap[d]?.constituency;
      if (hq) all.push(hq);
      all.push(...defaultConstituencies.map(c => `${d} ${c}`).filter(c => c !== hq));
    });
    return all.sort();
  }

  const hq = mlaMap[district]?.constituency;
  if (!hq) return defaultConstituencies.map(c => `${district} ${c}`);
  
  // Return the main HQ constituency, plus a few generic ones for selection
  return [
    hq,
    ...defaultConstituencies.map(c => `${district} ${c}`).filter(c => c !== hq)
  ];
};

export const getMLAForConstituency = (district: string, constituency: string): MLAProfile => {
  if (district === 'All Districts') {
    // Find the actual district for this constituency
    for (const d of Object.keys(mlaMap)) {
      const constituencies = getConstituenciesForDistrict(d);
      if (constituencies.includes(constituency)) {
        return getMLAForConstituency(d, constituency);
      }
    }
    // Fallback
    return getMLAForConstituency('Chennai', constituency);
  }

  const hq = mlaMap[district];
  const isHQ = hq?.constituency === constituency;
  
  const name = isHQ ? hq.name! : `Thiru. Representative (${constituency})`;
  const party = isHQ ? hq.party! : 'IND';

  return {
    name,
    constituency,
    district,
    phone: '+91 94440 00000',
    email: `mla.${constituency.toLowerCase().replace(/[^a-z0-9]/g, '')}@tn.gov.in`,
    party,
    officeAddress: `Constituency MLA Office, Main Road, ${constituency}, ${district} District, Tamil Nadu.`,
    avatar: 'https://ui-avatars.com/api/?name=' + encodeURIComponent(name) + '&background=e0e7ff&color=3730a3&bold=true'
  };
};

export const getMLAForDistrict = (district: string): MLAProfile => {
  const hq = mlaMap[district] || { name: 'Constituency MLA', constituency: district, party: 'Rep' };
  return getMLAForConstituency(district, hq.constituency!);
};
