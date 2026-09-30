/**
 * Advanced Typo-Tolerant & Phonetic Search Engine for Indian Cities & Regions
 */

// Levenshtein edit distance calculation
export function levenshteinDistance(s1, s2) {
  const m = s1.length;
  const n = s2.length;
  const dp = Array.from({ length: m + 1 }, () => new Array(n + 1).fill(0));

  for (let i = 0; i <= m; i++) dp[i][0] = i;
  for (let j = 0; j <= n; j++) dp[0][j] = j;

  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      if (s1[i - 1] === s2[j - 1]) {
        dp[i][j] = dp[i - 1][j - 1];
      } else {
        dp[i][j] = 1 + Math.min(
          dp[i - 1][j],     // deletion
          dp[i][j - 1],     // insertion
          dp[i - 1][j - 1]  // substitution
        );
      }
    }
  }

  return dp[m][n];
}

// Normalized similarity [0, 1]
export function stringSimilarity(str1, str2) {
  const s1 = (str1 || '').toLowerCase().trim();
  const s2 = (str2 || '').toLowerCase().trim();
  if (s1 === s2) return 1.0;
  if (!s1 || !s2) return 0.0;

  const maxLen = Math.max(s1.length, s2.length);
  const dist = levenshteinDistance(s1, s2);
  return Math.max(0, 1 - dist / maxLen);
}

// Clean and normalize strings for phonetic comparison
export function cleanSearchQuery(text) {
  return (text || '')
    .toLowerCase()
    .replace(/[^\w\s]/gi, '')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Common Indian city aliases, historical colonial names, colloquial names, and common typos
 */
export const CITY_ALIASES = {
  'New Delhi': ['delhi', 'dilli', 'dehli', 'delhy', 'new delhi', 'ncr', 'dili', 'ndls', 'del'],
  'Noida': ['noida', 'gautam buddha nagar', 'greater noida', 'gb nagar'],
  'Gurgaon (Gurugram)': ['gurgaon', 'gurugram', 'gurgao', 'gurganw', 'gurugrm', 'ggn'],
  'Mumbai': ['bombay', 'mumbay', 'mumbhai', 'bby', 'mumbaikar', 'bombai'],
  'Bengaluru': ['bangalore', 'bengaluru', 'bangalor', 'bengalooru', 'blr', 'banglore', 'bengaluru city'],
  'Kolkata': ['calcutta', 'kolkatta', 'kolkataa', 'culcutta', 'ccu', 'kolkatha'],
  'Chennai': ['madras', 'chenai', 'chennay', 'chenna', 'maa', 'madraas'],
  'Hyderabad': ['hydrabad', 'hyderabaad', 'haiderabad', 'secunderabad', 'hyd', 'hitec city', 'cyberabad'],
  'Ahmedabad': ['ahmadabad', 'ahemdabad', 'ahemadabad', 'amdavad', 'ahmedbad', 'karnavati', 'adi'],
  'Pune': ['poona', 'puney', 'puna', 'punecity'],
  'Varanasi': ['banaras', 'benares', 'kashi', 'varanaci', 'banares'],
  'Prayagraj (Allahabad)': ['allahabad', 'prayagraj', 'ilhabad', 'prayag', 'allahbad', 'pryj'],
  'Visakhapatnam': ['vizag', 'vishakapatnam', 'vishakhapatnam', 'waltair', 'vizag city'],
  'Kochi': ['cochin', 'kochi', 'kochii', 'ernakulam', 'cochi'],
  'Thiruvananthapuram': ['trivandrum', 'thiruvanantapuram', 'trivendrum', 'tvm'],
  'Vadodara': ['baroda', 'vadodra', 'barodha'],
  'Jaipur': ['jaipr', 'jaypur', 'pink city', 'jaipoor'],
  'Jodhpur': ['jodhpr', 'jodhpore', 'sun city', 'marwar'],
  'Udaipur': ['udaypur', 'lake city', 'mewar'],
  'Lucknow': ['luknow', 'lakhnau', 'lucknw', 'city of nawabs', 'lko'],
  'Kanpur': ['cawnpore', 'knp', 'kanpoor'],
  'Bhopal': ['bhopl', 'bhoopal', 'city of lakes'],
  'Indore': ['indoor', 'indaur', 'indor'],
  'Nagpur': ['nagpr', 'orange city', 'ngp'],
  'Surat': ['soorat', 'diamond city', 'srt'],
  'Patna': ['patliputra', 'patna city', 'patnah'],
  'Ranchi': ['ranci', 'ranchy'],
  'Bhubaneswar': ['bhubaneshwar', 'bhubneswar', 'temple city', 'bbsr'],
  'Guwahati': ['gauhati', 'gowahati', 'guwathi'],
  'Chandigarh': ['chandigrh', 'chd', 'the beautiful city'],
  'Srinagar': ['shrinagar', 'srinagr', 'srinager'],
  'Amritsar': ['amritsr', 'ambarsar', 'golden temple city', 'asr'],
  'Shimla': ['simla', 'shimla city', 'queen of hills'],
  'Dehradun': ['dehra doon', 'doon', 'ddn'],
  'Panaji': ['panjim', 'panaji goa', 'goa capital'],
  'Coimbatore': ['kovai', 'cbe'],
  'Mysuru': ['mysore', 'mysuru city'],
  'Mangaluru': ['mangalore', 'mng'],
  'Vijayawada': ['bezawada', 'vja'],
  'Madurai': ['madura', 'temple city'],
  'Kozhikode': ['calicut', 'clt'],
  'Puducherry': ['pondicherry', 'pondy', 'pondicherri'],
  'Leh': ['ladakh', 'leh ladakh', 'leh city'],
  'Shillong': ['shilong', 'scotland of the east']
};

/**
 * Score a single city against query
 */
export function scoreCityMatch(city, query) {
  const cleanQ = cleanSearchQuery(query);
  if (!cleanQ) return 0;

  const cityName = cleanSearchQuery(city.name);
  const stateName = cleanSearchQuery(city.state);

  // Exact Match = 100
  if (cityName === cleanQ) return 100;
  if (stateName === cleanQ) return 80;

  // Exact prefix match = 90
  if (cityName.startsWith(cleanQ)) return 90;
  if (cleanQ.startsWith(cityName)) return 85;

  // Substring match
  if (cityName.includes(cleanQ)) return 75;
  if (stateName.includes(cleanQ)) return 60;

  // Check Aliases & Colloquial names
  const aliases = CITY_ALIASES[city.name] || [];
  for (const alias of aliases) {
    const cleanAlias = cleanSearchQuery(alias);
    if (cleanAlias === cleanQ) return 98; // virtually exact
    if (cleanAlias.startsWith(cleanQ)) return 88;
    if (cleanAlias.includes(cleanQ)) return 72;

    // Fuzzy distance against alias
    const sim = stringSimilarity(cleanQ, cleanAlias);
    if (sim >= 0.75) {
      return Math.round(sim * 85);
    }
  }

  // Direct Levenshtein similarity against city name
  const nameSim = stringSimilarity(cleanQ, cityName);
  if (nameSim >= 0.70) {
    return Math.round(nameSim * 70);
  }

  // Also check state similarity
  const stateSim = stringSimilarity(cleanQ, stateName);
  if (stateSim >= 0.75) {
    return Math.round(stateSim * 50);
  }

  return 0;
}
