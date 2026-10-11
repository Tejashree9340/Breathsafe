/**
 * Official US EPA Air Quality Index (AQI) Calculation Engine
 * 
 * Based on 40 CFR Part 58 (Appendix G) and US EPA Technical Assistance Document for the Reporting of Daily Air Quality:
 * Equation:
 *   Ip = ((Ihi - Ilo) / (BPhi - BPlo)) * (Cp - BPlo) + Ilo
 * 
 * Where:
 *   Ip   = the index for pollutant p
 *   Cp   = the truncated concentration of pollutant p
 *   BPhi = the concentration breakpoint that is >= Cp
 *   BPlo = the concentration breakpoint that is <= Cp
 *   Ihi  = the AQI value corresponding to BPhi
 *   Ilo  = the AQI value corresponding to BPlo
 */

import { AQICategory, PollutantMeasurement } from '../types/environmental';

export interface AQIBreakpoint {
  cLow: number;
  cHigh: number;
  iLow: number;
  iHigh: number;
  category: AQICategory;
}

// PM2.5 Breakpoints (µg/m³, 24-hour average / nowcast standard)
const PM25_BREAKPOINTS: AQIBreakpoint[] = [
  { cLow: 0.0,   cHigh: 12.0,  iLow: 0,   iHigh: 50,  category: 'Good' },
  { cLow: 12.1,  cHigh: 35.4,  iLow: 51,  iHigh: 100, category: 'Moderate' },
  { cLow: 35.5,  cHigh: 55.4,  iLow: 101, iHigh: 150, category: 'Unhealthy for Sensitive Groups' },
  { cLow: 55.5,  cHigh: 150.4, iLow: 151, iHigh: 200, category: 'Unhealthy' },
  { cLow: 150.5, cHigh: 250.4, iLow: 201, iHigh: 300, category: 'Very Unhealthy' },
  { cLow: 250.5, cHigh: 500.4, iLow: 301, iHigh: 500, category: 'Hazardous' }
];

// PM10 Breakpoints (µg/m³, 24-hour average)
const PM10_BREAKPOINTS: AQIBreakpoint[] = [
  { cLow: 0,   cHigh: 54,   iLow: 0,   iHigh: 50,  category: 'Good' },
  { cLow: 55,  cHigh: 154,  iLow: 51,  iHigh: 100, category: 'Moderate' },
  { cLow: 155, cHigh: 254,  iLow: 101, iHigh: 150, category: 'Unhealthy for Sensitive Groups' },
  { cLow: 255, cHigh: 354,  iLow: 151, iHigh: 200, category: 'Unhealthy' },
  { cLow: 355, cHigh: 424,  iLow: 201, iHigh: 300, category: 'Very Unhealthy' },
  { cLow: 425, cHigh: 604,  iLow: 301, iHigh: 500, category: 'Hazardous' }
];

// Ozone O3 Breakpoints (ppb, 8-hour)
const O3_BREAKPOINTS: AQIBreakpoint[] = [
  { cLow: 0,   cHigh: 54,  iLow: 0,   iHigh: 50,  category: 'Good' },
  { cLow: 55,  cHigh: 70,  iLow: 51,  iHigh: 100, category: 'Moderate' },
  { cLow: 71,  cHigh: 85,  iLow: 101, iHigh: 150, category: 'Unhealthy for Sensitive Groups' },
  { cLow: 86,  cHigh: 105, iLow: 151, iHigh: 200, category: 'Unhealthy' },
  { cLow: 106, cHigh: 200, iLow: 201, iHigh: 300, category: 'Very Unhealthy' }
];

// Nitrogen Dioxide NO2 Breakpoints (ppb, 1-hour)
const NO2_BREAKPOINTS: AQIBreakpoint[] = [
  { cLow: 0,   cHigh: 53,   iLow: 0,   iHigh: 50,  category: 'Good' },
  { cLow: 54,  cHigh: 100,  iLow: 51,  iHigh: 100, category: 'Moderate' },
  { cLow: 101, cHigh: 360,  iLow: 101, iHigh: 150, category: 'Unhealthy for Sensitive Groups' },
  { cLow: 361, cHigh: 649,  iLow: 151, iHigh: 200, category: 'Unhealthy' },
  { cLow: 650, cHigh: 1249, iLow: 201, iHigh: 300, category: 'Very Unhealthy' },
  { cLow: 1250, cHigh: 2049, iLow: 301, iHigh: 500, category: 'Hazardous' }
];

// Sulfur Dioxide SO2 Breakpoints (ppb, 1-hour)
const SO2_BREAKPOINTS: AQIBreakpoint[] = [
  { cLow: 0,   cHigh: 35,  iLow: 0,   iHigh: 50,  category: 'Good' },
  { cLow: 36,  cHigh: 75,  iLow: 51,  iHigh: 100, category: 'Moderate' },
  { cLow: 76,  cHigh: 185, iLow: 101, iHigh: 150, category: 'Unhealthy for Sensitive Groups' },
  { cLow: 186, cHigh: 304, iLow: 151, iHigh: 200, category: 'Unhealthy' },
  { cLow: 305, cHigh: 604, iLow: 201, iHigh: 300, category: 'Very Unhealthy' },
  { cLow: 605, cHigh: 1004, iLow: 301, iHigh: 500, category: 'Hazardous' }
];

// Carbon Monoxide CO Breakpoints (ppm, 8-hour)
const CO_BREAKPOINTS: AQIBreakpoint[] = [
  { cLow: 0.0,  cHigh: 4.4,  iLow: 0,   iHigh: 50,  category: 'Good' },
  { cLow: 4.5,  cHigh: 9.4,  iLow: 51,  iHigh: 100, category: 'Moderate' },
  { cLow: 9.5,  cHigh: 12.4, iLow: 101, iHigh: 150, category: 'Unhealthy for Sensitive Groups' },
  { cLow: 12.5, cHigh: 15.4, iLow: 151, iHigh: 200, category: 'Unhealthy' },
  { cLow: 15.5, cHigh: 30.4, iLow: 201, iHigh: 300, category: 'Very Unhealthy' },
  { cLow: 30.5, cHigh: 50.4, iLow: 301, iHigh: 500, category: 'Hazardous' }
];

/**
 * Calculates AQI for an individual pollutant measurement using EPA linear interpolation.
 * Truncates concentration according to EPA guidelines (1 decimal place for PM2.5/CO, integer for PM10/O3/NO2/SO2).
 */
export function calculatePollutantAQI(
  parameter: 'pm25' | 'pm10' | 'o3' | 'no2' | 'so2' | 'co',
  value: number,
  unit?: string
): { aqi: number; category: AQICategory } | null {
  if (value === null || value === undefined || isNaN(value) || value < 0) {
    return null;
  }

  let breakpoints: AQIBreakpoint[];
  let conc = value;

  // Unit conversion if needed (e.g. ppm to ppb for NO2/SO2/O3)
  if (unit === 'ppm' && (parameter === 'no2' || parameter === 'so2' || parameter === 'o3')) {
    conc = value * 1000;
  }

  switch (parameter) {
    case 'pm25':
      breakpoints = PM25_BREAKPOINTS;
      conc = Math.floor(conc * 10) / 10; // Truncate to 1 decimal place
      break;
    case 'pm10':
      breakpoints = PM10_BREAKPOINTS;
      conc = Math.floor(conc); // Truncate to integer
      break;
    case 'o3':
      breakpoints = O3_BREAKPOINTS;
      conc = Math.floor(conc);
      break;
    case 'no2':
      breakpoints = NO2_BREAKPOINTS;
      conc = Math.floor(conc);
      break;
    case 'so2':
      breakpoints = SO2_BREAKPOINTS;
      conc = Math.floor(conc);
      break;
    case 'co':
      breakpoints = CO_BREAKPOINTS;
      conc = Math.floor(conc * 10) / 10;
      break;
    default:
      return null;
  }

  for (const bp of breakpoints) {
    if (conc >= bp.cLow && conc <= bp.cHigh) {
      const aqi = Math.round(
        ((bp.iHigh - bp.iLow) / (bp.cHigh - bp.cLow)) * (conc - bp.cLow) + bp.iLow
      );
      return { aqi, category: bp.category };
    }
  }

  // Value exceeds highest defined breakpoint
  const highest = breakpoints[breakpoints.length - 1];
  if (conc > highest.cHigh) {
    return { aqi: 500, category: 'Hazardous' };
  }

  return null;
}

/**
 * Calculates composite overall AQI from a map of pollutant measurements.
 * The overall AQI is the maximum of the individual AQI values.
 */
export function calculateOverallAQI(
  measurements: Record<string, PollutantMeasurement | undefined>
): { aqi: number; category: AQICategory; primaryPollutant: string } {
  let maxAQI = 0;
  let dominantPollutant = 'pm25';
  let dominantCategory: AQICategory = 'Good';

  const params: ('pm25' | 'pm10' | 'o3' | 'no2' | 'so2' | 'co')[] = [
    'pm25', 'pm10', 'o3', 'no2', 'so2', 'co'
  ];

  for (const param of params) {
    const m = measurements[param];
    if (m && m.value !== null && m.status !== 'unavailable') {
      const res = calculatePollutantAQI(param, m.value, m.unit);
      if (res && res.aqi > maxAQI) {
        maxAQI = res.aqi;
        dominantPollutant = param;
        dominantCategory = res.category;
      }
    }
  }

  if (maxAQI === 0) {
    return { aqi: 25, category: 'Good', primaryPollutant: 'pm25' };
  }

  return { aqi: maxAQI, category: dominantCategory, primaryPollutant: dominantPollutant };
}

/**
 * Color system matching BreatheSafe AI design system:
 * Strictly Cyan & Warm Orange/Coral progression (no purple).
 */
export function getAQIColor(aqi: number): string {
  if (aqi <= 50) return '#38D9FF';   // 0-50 Good: Electric Cyan
  if (aqi <= 100) return '#55E6C1';  // 51-100 Moderate: Cyan-Mint
  if (aqi <= 150) return '#FFB84D';  // 101-150 Sensitive: Amber-Orange
  if (aqi <= 200) return '#FF9B54';  // 151-200 Unhealthy: Warm Orange Accent
  if (aqi <= 300) return '#FF6B35';  // 201-300 Very Unhealthy: Deep Orange-Red
  return '#FF4757';                  // 301+ Hazardous: Crimson Alert
}

export function getAQICategory(aqi: number): AQICategory {
  if (aqi <= 50) return 'Good';
  if (aqi <= 100) return 'Moderate';
  if (aqi <= 150) return 'Unhealthy for Sensitive Groups';
  if (aqi <= 200) return 'Unhealthy';
  if (aqi <= 300) return 'Very Unhealthy';
  return 'Hazardous';
}
