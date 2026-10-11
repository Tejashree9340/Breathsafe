export type AQICategory = 
  | 'Good' 
  | 'Moderate' 
  | 'Unhealthy for Sensitive Groups' 
  | 'Unhealthy' 
  | 'Very Unhealthy' 
  | 'Hazardous';

export interface PollutantMeasurement {
  parameter: 'pm25' | 'pm10' | 'no2' | 'o3' | 'co' | 'so2';
  name?: string;
  value: number | null;
  unit: string; // e.g. 'µg/m³', 'ppm', 'ppb'
  lastUpdated: string;
  whoLimit24h?: number; // WHO 2021 24h standard
  epaStandard?: number;
  status: 'safe' | 'moderate' | 'elevated' | 'hazardous' | 'unavailable' | 'valid';
  isAvailable?: boolean;
  confidence?: number;
}

export interface MonitoringStation {
  id: string;
  name: string;
  city: string;
  country: string;
  countryCode?: string;
  coordinates: {
    latitude: number;
    longitude: number;
  };
  aqi: number;
  category: AQICategory;
  primaryPollutant: string;
  source: string;
  sourceType: 'government' | 'research' | 'community';
  instrument?: string;
  lastUpdated: string;
  isStale?: boolean;
  staleMinutes?: number;
  dataSourceUrl?: string;
  measurements: Record<string, PollutantMeasurement>;
}

export interface HistoricalReading {
  timestamp: string;
  timeLabel: string;
  aqi: number;
  pm25: number;
  pm10: number;
  no2: number;
  o3: number;
}

export interface ExposureGuideline {
  category: AQICategory;
  aqiRange: [number, number];
  color: string;
  generalPublic: string;
  sensitiveGroups: string;
  outdoorActivities: string;
  indoorPrecautions: string;
  recommendedMask: string;
}

export interface AlertRule {
  id: string;
  parameter: 'aqi' | 'pm25' | 'pm10';
  threshold: number;
  operator: 'greater_than' | 'less_than';
  stationId: string;
  stationName: string;
  enabled: boolean;
  notifyEmail: boolean;
  notifyPush: boolean;
  notifyInApp: boolean;
  lastTriggered?: string;
}

export interface AlertNotification {
  id: string;
  ruleId: string;
  stationName: string;
  message: string;
  severity: 'info' | 'warning' | 'critical';
  timestamp: string;
  read: boolean;
  valueRecorded: number;
  threshold: number;
  unit: string;
}

export interface UserProfile {
  id: string;
  email: string;
  name: string;
  organization?: string;
  role: 'researcher' | 'citizen' | 'environmental_analyst';
  savedStations: string[];
  unitPreference: 'metric' | 'imperial';
  emailAlertsEnabled: boolean;
  pushAlertsEnabled: boolean;
}
