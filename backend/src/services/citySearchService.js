import { City, State } from 'country-state-city';
import Fuse from 'fuse.js';

// Common Indian city aliases, historical colonial names, colloquial names, and common typos
const ALIASES = {
  'Delhi': ['delhi', 'dehli', 'dilli', 'new delhi', 'ncr', 'dili', 'ndls', 'del'],
  'New Delhi': ['delhi', 'dehli', 'dilli', 'ndls', 'new delhi', 'ncr'],
  'Noida': ['noida', 'gautam buddha nagar', 'greater noida', 'gb nagar'],
  'Gurgaon': ['gurgaon', 'gurugram', 'gurgao', 'gurganw', 'gurugrm', 'ggn'],
  'Mumbai': ['bombay', 'mumbay', 'mumbhai', 'bby', 'mumbaikar', 'bombai'],
  'Bengaluru': ['bangalore', 'bengaluru', 'bangalor', 'bengalooru', 'blr', 'banglore'],
  'Kolkata': ['calcutta', 'kolkatta', 'kolkataa', 'culcutta', 'ccu', 'kolkatha'],
  'Chennai': ['madras', 'chenai', 'chennay', 'chenna', 'maa', 'madraas'],
  'Hyderabad': ['hydrabad', 'hyderabaad', 'haiderabad', 'secunderabad', 'hyd', 'cyberabad'],
  'Ahmedabad': ['ahmadabad', 'ahemdabad', 'ahemadabad', 'amdavad', 'ahmedbad'],
  'Pune': ['poona', 'puney', 'puna'],
  'Varanasi': ['banaras', 'benares', 'kashi', 'varanaci'],
  'Prayagraj': ['allahabad', 'ilhabad', 'prayag', 'allahbad'],
  'Allahabad': ['prayagraj', 'allahabad', 'ilhabad', 'prayag'],
  'Visakhapatnam': ['vizag', 'vishakapatnam', 'vishakhapatnam', 'waltair'],
  'Kochi': ['cochin', 'kochi', 'kochii', 'ernakulam'],
  'Thiruvananthapuram': ['trivandrum', 'thiruvanantapuram', 'trivendrum', 'tvm'],
  'Vadodara': ['baroda', 'vadodra'],
  'Jaipur': ['jaipr', 'jaypur', 'pink city'],
  'Jodhpur': ['jodhpr', 'jodhpore', 'marwar'],
  'Udaipur': ['udaypur', 'lake city'],
  'Lucknow': ['luknow', 'lakhnau', 'lucknw'],
  'Kanpur': ['cawnpore', 'knp'],
  'Bhopal': ['bhopl', 'bhoopal'],
  'Indore': ['indoor', 'indaur'],
  'Nagpur': ['nagpr', 'orange city'],
  'Surat': ['soorat', 'diamond city'],
  'Patna': ['patliputra', 'patna city'],
  'Ranchi': ['ranci', 'ranchy'],
  'Bhubaneswar': ['bhubaneshwar', 'bhubneswar'],
  'Guwahati': ['gauhati', 'gowahati'],
  'Chandigarh': ['chandigrh', 'chd'],
  'Srinagar': ['shrinagar', 'srinagr'],
  'Amritsar': ['amritsr', 'ambarsar'],
  'Shimla': ['simla'],
  'Dehradun': ['dehra doon', 'doon'],
  'Panaji': ['panjim', 'goa capital'],
  'Coimbatore': ['kovai'],
  'Mysuru': ['mysore'],
  'Mangaluru': ['mangalore'],
  'Vijayawada': ['bezawada'],
  'Madurai': ['madura'],
  'Kozhikode': ['calicut'],
  'Puducherry': ['pondicherry', 'pondy'],
  'Leh': ['ladakh', 'leh ladakh'],
  'Shillong': ['shilong']
};

// Priority major metro weight list
const MAJOR_METROS = new Set([
  'New Delhi', 'Delhi', 'Mumbai', 'Bengaluru', 'Kolkata', 'Chennai', 'Hyderabad',
  'Ahmedabad', 'Pune', 'Jaipur', 'Lucknow', 'Kanpur', 'Nagpur', 'Indore', 'Thane',
  'Bhopal', 'Visakhapatnam', 'Patna', 'Vadodara', 'Ghaziabad', 'Ludhiana', 'Agra',
  'Nashik', 'Faridabad', 'Varanasi', 'Srinagar', 'Chandigarh', 'Amritsar', 'Prayagraj',
  'Guwahati', 'Bhubaneswar', 'Dehradun', 'Shimla', 'Panaji', 'Kochi', 'Thiruvananthapuram'
]);

let fuseInstance = null;
let indianCitiesCache = null;

// Initialize Indian cities and Fuse.js index once
function getSearchEngine() {
  if (fuseInstance && indianCitiesCache) {
    return { fuse: fuseInstance, cities: indianCitiesCache };
  }

  const states = State.getStatesOfCountry('IN');
  const stateMap = new Map(states.map((s) => [s.isoCode, s.name]));
  const rawCities = City.getCitiesOfCountry('IN');

  indianCitiesCache = rawCities.map((c) => {
    const stateName = stateMap.get(c.stateCode) || c.stateCode;
    const aliasesList = ALIASES[c.name] || [];
    const isMajor = MAJOR_METROS.has(c.name);

    return {
      name: c.name,
      state: stateName,
      aliases: aliasesList,
      lat: parseFloat(c.latitude),
      lon: parseFloat(c.longitude),
      isMajor,
      tag: isMajor ? 'Major City' : stateName,
      isIndia: true
    };
  });

  fuseInstance = new Fuse(indianCitiesCache, {
    keys: [
      { name: 'name', weight: 0.6 },
      { name: 'aliases', weight: 0.8 },
      { name: 'state', weight: 0.15 }
    ],
    threshold: 0.35,
    distance: 100,
    ignoreLocation: true,
    includeScore: true,
    shouldSort: true
  });

  return { fuse: fuseInstance, cities: indianCitiesCache };
}

/**
 * Maintained fuzzy search for Indian cities using country-state-city & fuse.js
 */
export function fuzzyFindIndianCities(query, limit = 10) {
  if (!query || !query.trim()) {
    const { cities } = getSearchEngine();
    return cities.filter((c) => c.isMajor).slice(0, limit);
  }

  const cleanQ = query.trim();
  const { fuse } = getSearchEngine();
  const results = fuse.search(cleanQ);

  if (results.length === 0) {
    return [];
  }

  // Check if top match corrected a typo
  const topResult = results[0];
  const isTypo = topResult && topResult.item.name.toLowerCase() !== cleanQ.toLowerCase();
  const didYouMean = isTypo && topResult.score <= 0.35 ? topResult.item.name : null;

  // Format and sort: boost exact matches and major metros
  const formatted = results.slice(0, limit * 2).map((r) => {
    const item = r.item;
    let boost = 0;
    if (item.name.toLowerCase() === cleanQ.toLowerCase()) boost += 50;
    if (item.isMajor) boost += 20;

    return {
      name: item.name,
      state: item.state,
      region: 'India',
      lat: item.lat,
      lon: item.lon,
      tag: item.tag,
      isIndia: true,
      score: r.score,
      rank: (1 - r.score) * 100 + boost,
      didYouMean: didYouMean
    };
  });

  formatted.sort((a, b) => b.rank - a.rank);
  return formatted.slice(0, limit);
}
