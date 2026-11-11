export interface CentroidInfo {
  coords: [number, number];
  zoom: number;
}

export const STATE_CENTROIDS: Record<string, CentroidInfo> = {
  'All India': { coords: [22.5937, 78.9629], zoom: 5 },
  'Rajasthan': { coords: [26.9124, 75.7873], zoom: 7 },
  'Delhi NCR': { coords: [28.6139, 77.2090], zoom: 10 },
  'Uttar Pradesh': { coords: [26.8467, 80.9462], zoom: 7 },
  'Maharashtra': { coords: [19.7515, 75.7139], zoom: 7 },
  'Jharkhand': { coords: [23.6102, 85.2799], zoom: 7 },
  'Karnataka': { coords: [15.3173, 75.7139], zoom: 7 },
  'Bihar': { coords: [25.0961, 85.3131], zoom: 7 },
  'West Bengal': { coords: [22.9868, 87.8550], zoom: 7 },
  'Telangana': { coords: [18.1124, 79.0193], zoom: 7 },
  'Gujarat': { coords: [22.2587, 71.1924], zoom: 7 },
  'Haryana': { coords: [29.0588, 76.0856], zoom: 8 },
  'Punjab': { coords: [31.1471, 75.3412], zoom: 8 },
  'Madhya Pradesh': { coords: [22.9734, 78.6569], zoom: 7 },
  'Tamil Nadu': { coords: [11.1271, 78.6569], zoom: 7 },
  'Kerala': { coords: [10.8505, 76.2711], zoom: 7 },
  'Andhra Pradesh': { coords: [15.9129, 79.7400], zoom: 7 },
  'Assam': { coords: [26.2006, 92.9376], zoom: 7 },
  'Odisha': { coords: [20.9517, 85.0985], zoom: 7 },
  'Chhattisgarh': { coords: [21.2787, 81.8661], zoom: 7 },
  'Uttarakhand': { coords: [30.0668, 79.0193], zoom: 8 },
  'Himachal Pradesh': { coords: [31.1048, 77.1734], zoom: 8 },
  'Goa': { coords: [15.2993, 74.1240], zoom: 10 },
  'Jammu and Kashmir': { coords: [33.7782, 76.5762], zoom: 7 },
  'Ladakh': { coords: [34.1526, 77.5771], zoom: 7 },
  'Chandigarh': { coords: [30.7333, 76.7794], zoom: 12 },
};

export function matchesState(stateFilter: string, textOrLocations: (string | undefined | null)[]): boolean {
  if (!stateFilter || stateFilter === 'All India') return true;
  const filterLower = stateFilter.toLowerCase();
  
  const synonyms: Record<string, string[]> = {
    'rajasthan': ['rajasthan', 'jaipur', 'sindhi camp', 'rj'],
    'delhi ncr': ['delhi', 'new delhi', 'connaught place', 'ncr', 'dl'],
    'uttar pradesh': ['uttar pradesh', 'lucknow', 'bahraich', 'ghaziabad', 'noida', 'up'],
    'maharashtra': ['maharashtra', 'mumbai', 'pune', 'andheri', 'mh'],
    'jharkhand': ['jharkhand', 'dhanbad', 'jamtara', 'deoghar', 'jh'],
    'karnataka': ['karnataka', 'bengaluru', 'bangalore', 'ka'],
    'bihar': ['bihar', 'patna', 'br'],
    'west bengal': ['west bengal', 'kolkata', 'wb'],
    'telangana': ['telangana', 'hyderabad', 'ts'],
    'punjab': ['punjab', 'jalandhar', 'chandigarh', 'pb'],
    'haryana': ['haryana', 'mewat', 'gurugram', 'hr'],
    'gujarat': ['gujarat', 'ahmedabad', 'gj'],
    'madhya pradesh': ['madhya pradesh', 'indore', 'bhopal', 'mp'],
  };

  const keysToMatch = synonyms[filterLower] || [filterLower];

  return textOrLocations.some(text => {
    if (!text) return false;
    const lower = text.toLowerCase();
    return keysToMatch.some(k => lower.includes(k));
  });
}

export function matchesRisk(riskTierOrScore: string | number, selectedLevels: string[]): boolean {
  if (!selectedLevels || selectedLevels.length === 0) return true;
  let tier = 'Low';
  if (typeof riskTierOrScore === 'number') {
    if (riskTierOrScore >= 76) tier = 'Critical';
    else if (riskTierOrScore >= 51) tier = 'High';
    else if (riskTierOrScore >= 26) tier = 'Moderate';
    else tier = 'Low';
  } else {
    const norm = riskTierOrScore.toLowerCase();
    if (norm.includes('crit')) tier = 'Critical';
    else if (norm.includes('high')) tier = 'High';
    else if (norm.includes('mod') || norm.includes('med')) tier = 'Moderate';
    else tier = 'Low';
  }
  return selectedLevels.includes(tier);
}

export function matchesAmount(amount: number, range: string): boolean {
  if (!range || range === 'all') return true;
  switch (range) {
    case 'below10k': return amount < 10000;
    case '10k-50k': return amount >= 10000 && amount <= 50000;
    case '50k-2L': return amount > 50000 && amount <= 200000;
    case '2L-10L': return amount > 200000 && amount <= 1000000;
    case 'above10L': return amount > 1000000;
    default: return true;
  }
}

export function matchesTime(timeStr: string | undefined | null, timeRange: string): boolean {
  if (!timeRange || timeRange === '24h' || timeRange === '30d' || !timeStr) return true;
  const lower = timeStr.toLowerCase();
  if (timeRange === '1h') {
    return lower.includes('min ago') || lower.includes('immediate');
  }
  if (timeRange === '6h') {
    return (
      lower.includes('min ago') ||
      lower.includes('1h') ||
      lower.includes('2h') ||
      lower.includes('3h') ||
      lower.includes('4h') ||
      lower.includes('immediate') ||
      lower.includes('today')
    );
  }
  if (timeRange === '7d') {
    return !lower.includes('month') && !lower.includes('2022') && !lower.includes('2024');
  }
  return true;
}
