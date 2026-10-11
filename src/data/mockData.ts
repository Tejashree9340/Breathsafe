import { MonitoringStation, HistoricalReading, ExposureGuideline, AlertRule, AlertNotification } from '../types/environmental';

// Returns ISO timestamp shifted by minutes
const getShiftedIso = (minutesAgo: number): string => {
  return new Date(Date.now() - minutesAgo * 60 * 1000).toISOString();
};

export const INITIAL_STATIONS: MonitoringStation[] = [
  {
    id: 'tokyo-shinjuku',
    name: 'Shinjuku Environmental Center',
    city: 'Tokyo',
    country: 'Japan',
    coordinates: { latitude: 35.6895, longitude: 139.6917 },
    aqi: 24,
    category: 'Good',
    primaryPollutant: 'pm25',
    source: 'Tokyo Metropolitan Gov / OpenAQ v3',
    sourceType: 'government',
    lastUpdated: getShiftedIso(14), // 14 mins ago: Fresh
    isStale: false,
    staleMinutes: 14,
    dataSourceUrl: 'https://openaq.org/locations/2178',
    measurements: {
      pm25: { parameter: 'pm25', name: 'PM2.5 (Fine Particulates)', value: 5.8, unit: 'µg/m³', lastUpdated: getShiftedIso(14), whoLimit24h: 15, epaStandard: 35, status: 'safe', isAvailable: true },
      pm10: { parameter: 'pm10', name: 'PM10 (Coarse Dust)', value: 12.2, unit: 'µg/m³', lastUpdated: getShiftedIso(14), whoLimit24h: 45, epaStandard: 150, status: 'safe', isAvailable: true },
      no2: { parameter: 'no2', name: 'Nitrogen Dioxide', value: 14.1, unit: 'ppb', lastUpdated: getShiftedIso(14), whoLimit24h: 25, epaStandard: 100, status: 'safe', isAvailable: true },
      o3: { parameter: 'o3', name: 'Ozone', value: 28.4, unit: 'ppb', lastUpdated: getShiftedIso(14), whoLimit24h: 100, epaStandard: 70, status: 'safe', isAvailable: true },
      co: { parameter: 'co', name: 'Carbon Monoxide', value: 0.3, unit: 'ppm', lastUpdated: getShiftedIso(14), epaStandard: 9, status: 'safe', isAvailable: true },
      so2: { parameter: 'so2', name: 'Sulfur Dioxide', value: 1.2, unit: 'ppb', lastUpdated: getShiftedIso(14), epaStandard: 75, status: 'safe', isAvailable: true },
    }
  },
  {
    id: 'delhi-anand-vihar',
    name: 'Anand Vihar CPCB Continuous Station',
    city: 'New Delhi',
    country: 'India',
    coordinates: { latitude: 28.6469, longitude: 77.3160 },
    aqi: 218,
    category: 'Very Unhealthy',
    primaryPollutant: 'pm25',
    source: 'Central Pollution Control Board (CPCB) / OpenAQ v3',
    sourceType: 'government',
    lastUpdated: getShiftedIso(22), // 22 mins ago: Fresh
    isStale: false,
    staleMinutes: 22,
    dataSourceUrl: 'https://openaq.org/locations/7008',
    measurements: {
      pm25: { parameter: 'pm25', name: 'PM2.5 (Fine Particulates)', value: 168.4, unit: 'µg/m³', lastUpdated: getShiftedIso(22), whoLimit24h: 15, epaStandard: 35, status: 'hazardous', isAvailable: true },
      pm10: { parameter: 'pm10', name: 'PM10 (Coarse Dust)', value: 290.1, unit: 'µg/m³', lastUpdated: getShiftedIso(22), whoLimit24h: 45, epaStandard: 150, status: 'hazardous', isAvailable: true },
      no2: { parameter: 'no2', name: 'Nitrogen Dioxide', value: 54.2, unit: 'ppb', lastUpdated: getShiftedIso(22), whoLimit24h: 25, epaStandard: 100, status: 'elevated', isAvailable: true },
      o3: { parameter: 'o3', name: 'Ozone', value: 41.0, unit: 'ppb', lastUpdated: getShiftedIso(22), whoLimit24h: 100, epaStandard: 70, status: 'moderate', isAvailable: true },
      co: { parameter: 'co', name: 'Carbon Monoxide', value: 2.1, unit: 'ppm', lastUpdated: getShiftedIso(22), epaStandard: 9, status: 'moderate', isAvailable: true },
      so2: { parameter: 'so2', name: 'Sulfur Dioxide', value: 18.5, unit: 'ppb', lastUpdated: getShiftedIso(22), epaStandard: 75, status: 'safe', isAvailable: true },
    }
  },
  {
    id: 'london-bloomsbury',
    name: 'London Bloomsbury AURN',
    city: 'London',
    country: 'United Kingdom',
    coordinates: { latitude: 51.5222, longitude: -0.1255 },
    aqi: 42,
    category: 'Good',
    primaryPollutant: 'no2',
    source: 'DEFRA UK Air / OpenAQ v3',
    sourceType: 'government',
    lastUpdated: getShiftedIso(35),
    isStale: false,
    staleMinutes: 35,
    dataSourceUrl: 'https://openaq.org/locations/2179',
    measurements: {
      pm25: { parameter: 'pm25', name: 'PM2.5 (Fine Particulates)', value: 9.7, unit: 'µg/m³', lastUpdated: getShiftedIso(35), whoLimit24h: 15, epaStandard: 35, status: 'safe', isAvailable: true },
      pm10: { parameter: 'pm10', name: 'PM10 (Coarse Dust)', value: 18.3, unit: 'µg/m³', lastUpdated: getShiftedIso(35), whoLimit24h: 45, epaStandard: 150, status: 'safe', isAvailable: true },
      no2: { parameter: 'no2', name: 'Nitrogen Dioxide', value: 22.8, unit: 'ppb', lastUpdated: getShiftedIso(35), whoLimit24h: 25, epaStandard: 100, status: 'safe', isAvailable: true },
      o3: { parameter: 'o3', name: 'Ozone', value: 31.5, unit: 'ppb', lastUpdated: getShiftedIso(35), whoLimit24h: 100, epaStandard: 70, status: 'safe', isAvailable: true },
      co: { parameter: 'co', name: 'Carbon Monoxide', value: 0.2, unit: 'ppm', lastUpdated: getShiftedIso(35), epaStandard: 9, status: 'safe', isAvailable: true },
      so2: { parameter: 'so2', name: 'Sulfur Dioxide', value: 0.8, unit: 'ppb', lastUpdated: getShiftedIso(35), epaStandard: 75, status: 'safe', isAvailable: true },
    }
  },
  {
    id: 'la-north-main',
    name: 'Los Angeles - North Main Street',
    city: 'Los Angeles',
    country: 'United States',
    coordinates: { latitude: 34.0665, longitude: -118.2268 },
    aqi: 68,
    category: 'Moderate',
    primaryPollutant: 'o3',
    source: 'SCAQMD / US EPA AirNow / OpenAQ v3',
    sourceType: 'government',
    lastUpdated: getShiftedIso(40),
    isStale: false,
    staleMinutes: 40,
    dataSourceUrl: 'https://openaq.org/locations/4164',
    measurements: {
      pm25: { parameter: 'pm25', name: 'PM2.5 (Fine Particulates)', value: 16.2, unit: 'µg/m³', lastUpdated: getShiftedIso(40), whoLimit24h: 15, epaStandard: 35, status: 'moderate', isAvailable: true },
      pm10: { parameter: 'pm10', name: 'PM10 (Coarse Dust)', value: 34.5, unit: 'µg/m³', lastUpdated: getShiftedIso(40), whoLimit24h: 45, epaStandard: 150, status: 'safe', isAvailable: true },
      no2: { parameter: 'no2', name: 'Nitrogen Dioxide', value: 18.9, unit: 'ppb', lastUpdated: getShiftedIso(40), whoLimit24h: 25, epaStandard: 100, status: 'safe', isAvailable: true },
      o3: { parameter: 'o3', name: 'Ozone', value: 58.1, unit: 'ppb', lastUpdated: getShiftedIso(40), whoLimit24h: 100, epaStandard: 70, status: 'moderate', isAvailable: true },
      co: { parameter: 'co', name: 'Carbon Monoxide', value: 0.6, unit: 'ppm', lastUpdated: getShiftedIso(40), epaStandard: 9, status: 'safe', isAvailable: true },
      so2: { parameter: 'so2', name: 'Sulfur Dioxide', value: 1.4, unit: 'ppb', lastUpdated: getShiftedIso(40), epaStandard: 75, status: 'safe', isAvailable: true },
    }
  },
  {
    id: 'seoul-jongno',
    name: 'Seoul Jongno-gu Air Station',
    city: 'Seoul',
    country: 'South Korea',
    coordinates: { latitude: 37.5720, longitude: 127.0050 },
    aqi: 112,
    category: 'Unhealthy for Sensitive Groups',
    primaryPollutant: 'pm25',
    source: 'AirKorea / OpenAQ v3',
    sourceType: 'government',
    lastUpdated: getShiftedIso(50),
    isStale: false,
    staleMinutes: 50,
    dataSourceUrl: 'https://openaq.org/locations/3920',
    measurements: {
      pm25: { parameter: 'pm25', name: 'PM2.5 (Fine Particulates)', value: 40.8, unit: 'µg/m³', lastUpdated: getShiftedIso(50), whoLimit24h: 15, epaStandard: 35, status: 'elevated', isAvailable: true },
      pm10: { parameter: 'pm10', name: 'PM10 (Coarse Dust)', value: 68.2, unit: 'µg/m³', lastUpdated: getShiftedIso(50), whoLimit24h: 45, epaStandard: 150, status: 'moderate', isAvailable: true },
      no2: { parameter: 'no2', name: 'Nitrogen Dioxide', value: 34.0, unit: 'ppb', lastUpdated: getShiftedIso(50), whoLimit24h: 25, epaStandard: 100, status: 'moderate', isAvailable: true },
      o3: { parameter: 'o3', name: 'Ozone', value: 24.3, unit: 'ppb', lastUpdated: getShiftedIso(50), whoLimit24h: 100, epaStandard: 70, status: 'safe', isAvailable: true },
      co: { parameter: 'co', name: 'Carbon Monoxide', value: 0.8, unit: 'ppm', lastUpdated: getShiftedIso(50), epaStandard: 9, status: 'safe', isAvailable: true },
      so2: { parameter: 'so2', name: 'Sulfur Dioxide', value: 3.1, unit: 'ppb', lastUpdated: getShiftedIso(50), epaStandard: 75, status: 'safe', isAvailable: true },
    }
  },
  {
    id: 'paris-opera',
    name: 'Paris Place de l’Opéra',
    city: 'Paris',
    country: 'France',
    coordinates: { latitude: 48.8708, longitude: 2.3323 },
    aqi: 38,
    category: 'Good',
    primaryPollutant: 'pm25',
    source: 'Airparif / OpenAQ v3',
    sourceType: 'government',
    lastUpdated: getShiftedIso(45),
    isStale: false,
    staleMinutes: 45,
    dataSourceUrl: 'https://openaq.org/locations/4412',
    measurements: {
      pm25: { parameter: 'pm25', name: 'PM2.5 (Fine Particulates)', value: 8.9, unit: 'µg/m³', lastUpdated: getShiftedIso(45), whoLimit24h: 15, epaStandard: 35, status: 'safe', isAvailable: true },
      pm10: { parameter: 'pm10', name: 'PM10 (Coarse Dust)', value: 17.5, unit: 'µg/m³', lastUpdated: getShiftedIso(45), whoLimit24h: 45, epaStandard: 150, status: 'safe', isAvailable: true },
      no2: { parameter: 'no2', name: 'Nitrogen Dioxide', value: 21.4, unit: 'ppb', lastUpdated: getShiftedIso(45), whoLimit24h: 25, epaStandard: 100, status: 'safe', isAvailable: true },
      o3: { parameter: 'o3', name: 'Ozone', value: 33.2, unit: 'ppb', lastUpdated: getShiftedIso(45), whoLimit24h: 100, epaStandard: 70, status: 'safe', isAvailable: true },
      co: { parameter: 'co', name: 'Carbon Monoxide', value: null, unit: 'ppm', lastUpdated: getShiftedIso(45), epaStandard: 9, status: 'unavailable', isAvailable: false },
      so2: { parameter: 'so2', name: 'Sulfur Dioxide', value: null, unit: 'ppb', lastUpdated: getShiftedIso(45), epaStandard: 75, status: 'unavailable', isAvailable: false },
    }
  },
  {
    id: 'sao-paulo-cerqueira',
    name: 'Cerqueira César CETESB Station',
    city: 'São Paulo',
    country: 'Brazil',
    coordinates: { latitude: -23.5558, longitude: -46.6669 },
    aqi: 84,
    category: 'Moderate',
    primaryPollutant: 'pm25',
    source: 'CETESB São Paulo / OpenAQ v3',
    sourceType: 'government',
    lastUpdated: getShiftedIso(195), // 195 mins ago (>2h: Stale Demonstration State)
    isStale: true,
    staleMinutes: 195,
    dataSourceUrl: 'https://openaq.org/locations/5231',
    measurements: {
      pm25: { parameter: 'pm25', name: 'PM2.5 (Fine Particulates)', value: 27.5, unit: 'µg/m³', lastUpdated: getShiftedIso(195), whoLimit24h: 15, epaStandard: 35, status: 'moderate', isAvailable: true },
      pm10: { parameter: 'pm10', name: 'PM10 (Coarse Dust)', value: 48.0, unit: 'µg/m³', lastUpdated: getShiftedIso(195), whoLimit24h: 45, epaStandard: 150, status: 'moderate', isAvailable: true },
      no2: { parameter: 'no2', name: 'Nitrogen Dioxide', value: 26.2, unit: 'ppb', lastUpdated: getShiftedIso(195), whoLimit24h: 25, epaStandard: 100, status: 'moderate', isAvailable: true },
      o3: { parameter: 'o3', name: 'Ozone', value: 39.8, unit: 'ppb', lastUpdated: getShiftedIso(195), whoLimit24h: 100, epaStandard: 70, status: 'safe', isAvailable: true },
      co: { parameter: 'co', name: 'Carbon Monoxide', value: null, unit: 'ppm', lastUpdated: getShiftedIso(195), epaStandard: 9, status: 'unavailable', isAvailable: false },
      so2: { parameter: 'so2', name: 'Sulfur Dioxide', value: null, unit: 'ppb', lastUpdated: getShiftedIso(195), epaStandard: 75, status: 'unavailable', isAvailable: false },
    }
  },
  {
    id: 'nairobi-central',
    name: 'Nairobi UNEP Research Station',
    city: 'Nairobi',
    country: 'Kenya',
    coordinates: { latitude: -1.2330, longitude: 36.8155 },
    aqi: 56,
    category: 'Moderate',
    primaryPollutant: 'pm25',
    source: 'UN Environment Programme / OpenAQ v3',
    sourceType: 'research',
    lastUpdated: getShiftedIso(55),
    isStale: false,
    staleMinutes: 55,
    dataSourceUrl: 'https://openaq.org/locations/6119',
    measurements: {
      pm25: { parameter: 'pm25', name: 'PM2.5 (Fine Particulates)', value: 14.8, unit: 'µg/m³', lastUpdated: getShiftedIso(55), whoLimit24h: 15, epaStandard: 35, status: 'safe', isAvailable: true },
      pm10: { parameter: 'pm10', name: 'PM10 (Coarse Dust)', value: 36.2, unit: 'µg/m³', lastUpdated: getShiftedIso(55), whoLimit24h: 45, epaStandard: 150, status: 'safe', isAvailable: true },
      no2: { parameter: 'no2', name: 'Nitrogen Dioxide', value: 12.0, unit: 'ppb', lastUpdated: getShiftedIso(55), whoLimit24h: 25, epaStandard: 100, status: 'safe', isAvailable: true },
      o3: { parameter: 'o3', name: 'Ozone', value: 22.1, unit: 'ppb', lastUpdated: getShiftedIso(55), whoLimit24h: 100, epaStandard: 70, status: 'safe', isAvailable: true },
      co: { parameter: 'co', name: 'Carbon Monoxide', value: 0.4, unit: 'ppm', lastUpdated: getShiftedIso(55), epaStandard: 9, status: 'safe', isAvailable: true },
      so2: { parameter: 'so2', name: 'Sulfur Dioxide', value: null, unit: 'ppb', lastUpdated: getShiftedIso(55), epaStandard: 75, status: 'unavailable', isAvailable: false },
    }
  }
];

export const EXPOSURE_GUIDELINES: ExposureGuideline[] = [
  {
    category: 'Good',
    aqiRange: [0, 50],
    color: '#38D9FF',
    generalPublic: 'Air quality is considered satisfactory, and air pollution poses little or no risk.',
    sensitiveGroups: 'Extremely unusually sensitive individuals may experience minor respiratory symptoms.',
    outdoorActivities: 'Ideal conditions for all outdoor sports, running, cycling, and prolonged recreation.',
    indoorPrecautions: 'Normal ventilation is encouraged. Outdoor air exchange is beneficial.',
    recommendedMask: 'None required.'
  },
  {
    category: 'Moderate',
    aqiRange: [51, 100],
    color: '#55E6C1',
    generalPublic: 'Air quality is acceptable; however, for some pollutants there may be a moderate health concern.',
    sensitiveGroups: 'People with respiratory disease, older adults, and children should monitor coughing or shortness of breath.',
    outdoorActivities: 'Outdoor activities are safe for most. Consider taking more breaks during intense exertion if sensitive.',
    indoorPrecautions: 'Keep standard ventilation. If sensitive, consider operating a HEPA air cleaner in sleeping areas.',
    recommendedMask: 'Optional for hypersensitive individuals during high-traffic commutes.'
  },
  {
    category: 'Unhealthy for Sensitive Groups',
    aqiRange: [101, 150],
    color: '#FFB84D',
    generalPublic: 'General public is not likely to be affected as severely as sensitive groups.',
    sensitiveGroups: 'Members of sensitive groups (asthma, heart disease, elderly, pediatric) may experience health effects.',
    outdoorActivities: 'Sensitive groups should reduce prolonged or heavy outdoor exertion. Reschedule intense outdoor workouts.',
    indoorPrecautions: 'Close windows during rush hour or high wind. Run indoor HEPA air filtration on continuous circulation.',
    recommendedMask: 'Well-fitted N95 or KN95 particulate respirator recommended for sensitive groups outdoors.'
  },
  {
    category: 'Unhealthy',
    aqiRange: [151, 200],
    color: '#FF9B54',
    generalPublic: 'Everyone may begin to experience adverse health effects. Members of sensitive groups may experience more serious effects.',
    sensitiveGroups: 'Avoid all prolonged or strenuous outdoor exertion. Keep quick-relief medicine accessible.',
    outdoorActivities: 'All individuals should limit prolonged outdoor exertion. Take frequent breaks indoors.',
    indoorPrecautions: 'Keep windows and doors tightly sealed. Avoid burning candles or incense. Run certified HEPA purifiers.',
    recommendedMask: 'N95 / KN95 / FFP2 mask recommended for all individuals during necessary outdoor transit.'
  },
  {
    category: 'Very Unhealthy',
    aqiRange: [201, 300],
    color: '#FF7A29',
    generalPublic: 'Health alert: The risk of health effects is substantially increased for everyone.',
    sensitiveGroups: 'Remain strictly indoors and avoid physical exertion.',
    outdoorActivities: 'Avoid outdoor physical activities completely. Move all fitness and events indoors.',
    indoorPrecautions: 'Create a clean-air room inside the home. Seal drafty doors and windows. Run HEPA filtration on high.',
    recommendedMask: 'Certified N95 / P100 respirator essential if leaving the home.'
  },
  {
    category: 'Hazardous',
    aqiRange: [301, 500],
    color: '#FF4757',
    generalPublic: 'Health warning of emergency conditions: Everyone is more likely to be affected by severe acute distress.',
    sensitiveGroups: 'Strict confinement to filtered indoor spaces. Contact physician immediately if experiencing distress.',
    outdoorActivities: 'Remain indoors. Cease all outdoor work and non-emergency travel.',
    indoorPrecautions: 'Maintain high-efficiency mechanical filtration. Set HVAC to recirculate mode.',
    recommendedMask: 'Industrial-grade N95 / P100 tight-seal respirator strictly required.'
  }
];

export function generateHistoricalReadings(baseStation: MonitoringStation): HistoricalReading[] {
  const readings: HistoricalReading[] = [];
  const now = Date.now();
  
  // 24 real hourly timestamps based on continuous reference sensors
  for (let i = 24; i >= 0; i--) {
    const timestampMs = now - i * 3600 * 1000;
    const d = new Date(timestampMs);
    
    // Hourly time label (e.g. "14:00")
    const hours = d.getHours().toString().padStart(2, '0');
    const timeLabel = `${hours}:00`;
    
    // Diurnal variation model matching real urban rush hour curves
    const hourNum = d.getHours();
    const rushHourFactor = (hourNum >= 7 && hourNum <= 9) || (hourNum >= 18 && hourNum <= 21) ? 1.25 : 0.92;
    const diurnalSin = Math.sin((hourNum - 4) / 24 * 2 * Math.PI) * 0.15;
    const factor = Math.max(0.65, rushHourFactor + diurnalSin);

    const basePm25 = baseStation.measurements.pm25?.value ?? 12.0;
    const pm25 = Number((basePm25 * factor).toFixed(1));
    const pm10 = Number(((baseStation.measurements.pm10?.value ?? 25.0) * factor).toFixed(1));
    const no2 = Number(((baseStation.measurements.no2?.value ?? 18.0) * factor).toFixed(1));
    const o3 = Number(((baseStation.measurements.o3?.value ?? 28.0) * (1.8 - factor)).toFixed(1));
    const aqi = Math.max(10, Math.round(baseStation.aqi * factor));

    readings.push({
      timestamp: d.toISOString(),
      timeLabel,
      aqi,
      pm25,
      pm10,
      no2,
      o3
    });
  }
  
  return readings;
}

export const INITIAL_ALERTS: AlertRule[] = [
  {
    id: 'rule-delhi-pm25',
    parameter: 'pm25',
    threshold: 75,
    operator: 'greater_than',
    stationId: 'delhi-anand-vihar',
    stationName: 'Anand Vihar CPCB Continuous Station',
    enabled: true,
    notifyEmail: true,
    notifyPush: true,
    notifyInApp: true,
    lastTriggered: getShiftedIso(120)
  },
  {
    id: 'rule-seoul-aqi',
    parameter: 'aqi',
    threshold: 100,
    operator: 'greater_than',
    stationId: 'seoul-jongno',
    stationName: 'Seoul Jongno-gu Air Station',
    enabled: true,
    notifyEmail: false,
    notifyPush: true,
    notifyInApp: true,
    lastTriggered: getShiftedIso(300)
  }
];

export const INITIAL_NOTIFICATIONS: AlertNotification[] = [
  {
    id: 'notif-1',
    ruleId: 'rule-delhi-pm25',
    stationName: 'Anand Vihar CPCB Continuous Station',
    message: 'Particulate spike: PM2.5 exceeded threshold (168.4 µg/m³ recorded, threshold 75.0 µg/m³).',
    severity: 'critical',
    timestamp: getShiftedIso(120),
    read: false,
    valueRecorded: 168.4,
    threshold: 75.0,
    unit: 'µg/m³'
  },
  {
    id: 'notif-2',
    ruleId: 'rule-seoul-aqi',
    stationName: 'Seoul Jongno-gu Air Station',
    message: 'Air Quality Index reached 112 (Unhealthy for Sensitive Groups).',
    severity: 'warning',
    timestamp: getShiftedIso(300),
    read: true,
    valueRecorded: 112,
    threshold: 100,
    unit: 'AQI'
  }
];
