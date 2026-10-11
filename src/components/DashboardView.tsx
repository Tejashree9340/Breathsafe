import React, { useState } from 'react';
import { 
  MonitoringStation, 
  HistoricalReading, 
  ExposureGuideline, 
  AlertNotification 
} from '../types/environmental';
import { EarthGlobe3D } from './EarthGlobe3D';
import { 
  Search, 
  MapPin, 
  RefreshCw, 
  ShieldAlert, 
  AlertCircle, 
  ArrowUpRight, 
  Clock, 
  Activity, 
  ExternalLink,
  ChevronRight,
  Info,
  AlertTriangle,
  RotateCcw
} from 'lucide-react';
import { EXPOSURE_GUIDELINES } from '../data/mockData';

interface DashboardViewProps {
  stations: MonitoringStation[];
  selectedStation: MonitoringStation;
  onSelectStation: (stationId: string) => void;
  historicalReadings: HistoricalReading[];
  onOpenMap: () => void;
  onOpenGuidance: () => void;
  onOpenAlerts: () => void;
  notifications: AlertNotification[];
  isRefreshing?: boolean;
  onRefresh?: () => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  stations,
  selectedStation,
  onSelectStation,
  historicalReadings,
  onOpenMap,
  onOpenGuidance,
  onOpenAlerts,
  notifications,
  isRefreshing = false,
  onRefresh
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPollutant, setSelectedPollutant] = useState<'pm25' | 'pm10' | 'no2' | 'o3' | 'co' | 'so2'>('pm25');

  // Filter stations for search
  const filteredStations = stations.filter(s => 
    s.city.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.country.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Current exposure guideline
  const currentGuideline = EXPOSURE_GUIDELINES.find(g => g.category === selectedStation.category) || EXPOSURE_GUIDELINES[0];

  // Helper for AQI category color
  const getCategoryBadgeClass = (category: string) => {
    switch (category) {
      case 'Good': return 'text-[#38D9FF] bg-[#38D9FF]/10 border-[#38D9FF]/30';
      case 'Moderate': return 'text-[#55E6C1] bg-[#55E6C1]/10 border-[#55E6C1]/30';
      case 'Unhealthy for Sensitive Groups': return 'text-[#FFB84D] bg-[#FFB84D]/10 border-[#FFB84D]/30';
      case 'Unhealthy': return 'text-[#FF9B54] bg-[#FF9B54]/10 border-[#FF9B54]/30';
      case 'Very Unhealthy': return 'text-[#FF7A29] bg-[#FF7A29]/10 border-[#FF7A29]/30';
      case 'Hazardous': return 'text-[#FF4757] bg-[#FF4757]/10 border-[#FF4757]/30';
      default: return 'text-[#9CA7B5] bg-[#282F3B] border-[#282F3B]';
    }
  };

  const getAQIProgressColor = (aqi: number) => {
    if (aqi <= 50) return '#38D9FF';
    if (aqi <= 100) return '#55E6C1';
    if (aqi <= 150) return '#FFB84D';
    if (aqi <= 200) return '#FF9B54';
    if (aqi <= 300) return '#FF7A29';
    return '#FF4757';
  };

  const aqiPercentage = Math.min(100, Math.round((selectedStation.aqi / 300) * 100));

  const isPollutantAvailable = selectedStation.measurements[selectedPollutant]?.status !== 'unavailable' && 
                               selectedStation.measurements[selectedPollutant]?.value !== null;

  return (
    <div className="max-w-7xl mx-auto px-6 py-8 space-y-6 text-left">
      
      {/* 1. Header Toolbar & Station Selector */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-[#282F3B]">
        <div>
          <div className="flex items-center gap-2 text-xs text-[#9CA7B5]">
            <span>OpenAQ v3 Ingestion Layer</span>
            <span>·</span>
            <span className="font-mono">{selectedStation.country}</span>
            <span>·</span>
            <span className="capitalize">{selectedStation.sourceType} Station</span>
            {selectedStation.dataSourceUrl && (
              <a
                href={selectedStation.dataSourceUrl}
                target="_blank"
                rel="noreferrer"
                className="text-[#38D9FF] hover:underline flex items-center gap-1 text-[11px]"
              >
                <span>Node ID</span>
                <ExternalLink className="w-2.5 h-2.5" />
              </a>
            )}
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-[#F2F5F8] mt-1 flex items-center gap-3">
            <span>{selectedStation.city}</span>
            <span className="text-sm font-normal text-[#9CA7B5] font-mono">({selectedStation.name})</span>
          </h1>
        </div>

        {/* Search & Station Selector */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative min-w-[240px]">
            <Search className="w-4 h-4 text-[#9CA7B5] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              placeholder="Search station or city..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-[#1B1F27] border border-[#282F3B] focus:border-[#38D9FF] rounded-lg pl-9 pr-8 py-2 text-xs text-[#F2F5F8] placeholder-[#9CA7B5] outline-none transition-colors"
            />
            {searchQuery && (
              <button 
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#9CA7B5] hover:text-[#F2F5F8] text-xs p-1"
              >
                ×
              </button>
            )}
            {searchQuery && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-[#1B1F27] border border-[#282F3B] rounded-lg shadow-2xl max-h-60 overflow-y-auto z-30">
                {filteredStations.length === 0 ? (
                  <div className="p-4 text-xs text-[#9CA7B5] text-center space-y-2">
                    <div>No monitoring stations match "{searchQuery}"</div>
                    <button
                      onClick={() => setSearchQuery('')}
                      className="text-[#38D9FF] hover:underline text-[11px]"
                    >
                      Clear search filter
                    </button>
                  </div>
                ) : (
                  filteredStations.map(s => (
                    <button
                      key={s.id}
                      onClick={() => {
                        onSelectStation(s.id);
                        setSearchQuery('');
                      }}
                      className="w-full text-left p-2.5 hover:bg-[#282F3B] border-b border-[#282F3B]/50 last:border-none flex items-center justify-between text-xs"
                    >
                      <div>
                        <div className="text-[#F2F5F8] font-medium">{s.city}</div>
                        <div className="text-[10px] text-[#9CA7B5] truncate">{s.name}</div>
                      </div>
                      <span className="font-mono text-[#38D9FF] font-semibold">AQI {s.aqi}</span>
                    </button>
                  ))
                )}
              </div>
            )}
          </div>

          <button
            onClick={onRefresh}
            disabled={isRefreshing}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-[#1B1F27] hover:bg-[#282F3B] border border-[#282F3B] text-xs text-[#9CA7B5] hover:text-[#F2F5F8] rounded-lg transition-colors cursor-pointer"
            title="Refresh Station Readings"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-[#38D9FF]' : ''}`} />
            <span className="hidden sm:inline">Sync Telemetry</span>
          </button>
        </div>
      </div>

      {/* Stale Telemetry Warning Banner */}
      {selectedStation.isStale && (
        <div className="p-3.5 bg-[#FF9B54]/10 border border-[#FF9B54]/30 rounded-xl flex items-start sm:items-center justify-between gap-3 text-xs text-[#FF9B54]">
          <div className="flex items-center gap-2.5">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <div>
              <strong>Stale Sensor Telemetry:</strong> Last confirmed transmission was{' '}
              <span className="font-mono">{selectedStation.staleMinutes || '>120'} minutes ago</span> ({new Date(selectedStation.lastUpdated).toLocaleTimeString()}).
              Environmental conditions may have changed since last ingestion cycle.
            </div>
          </div>
          <button
            onClick={onRefresh}
            className="px-2.5 py-1 bg-[#FF9B54]/20 hover:bg-[#FF9B54]/30 text-[#FF9B54] font-medium rounded text-[11px] whitespace-nowrap cursor-pointer transition-colors"
          >
            Probe Station
          </button>
        </div>
      )}

      {/* 2. Top Metric KPI Row */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
        
        {/* Primary AQI Card */}
        <div className="md:col-span-5 p-6 bg-[#1B1F27] border border-[#282F3B] rounded-xl flex flex-col justify-between relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs text-[#9CA7B5] font-medium uppercase tracking-wider">
              Air Quality Index (US EPA)
            </span>
            <span className={`px-2.5 py-0.5 rounded text-xs font-medium border ${getCategoryBadgeClass(selectedStation.category)}`}>
              {selectedStation.category}
            </span>
          </div>

          <div className="my-6 flex items-baseline gap-4">
            <span className="text-6xl font-black font-mono tracking-tight text-[#F2F5F8]">
              {selectedStation.aqi}
            </span>
            <div className="text-xs text-[#9CA7B5]">
              <div>Scale 0–500</div>
              <div className="text-[11px]">Dominant: {selectedStation.primaryPollutant.toUpperCase()}</div>
            </div>
          </div>

          {/* Progress / Gauge bar */}
          <div className="space-y-1.5">
            <div className="w-full h-2 rounded-full bg-[#111318] overflow-hidden flex">
              <div
                className="h-full transition-all duration-500 rounded-full"
                style={{
                  width: `${aqiPercentage}%`,
                  backgroundColor: getAQIProgressColor(selectedStation.aqi)
                }}
              />
            </div>
            <div className="flex justify-between text-[10px] text-[#9CA7B5] font-mono">
              <span>0 Good</span>
              <span>50</span>
              <span>100 Mod</span>
              <span>150 Unhealthy</span>
              <span>300+</span>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-[#282F3B] flex items-center justify-between text-[11px] text-[#9CA7B5]">
            <span className="truncate">Source: {selectedStation.source}</span>
            <span className="font-mono shrink-0">Updated: {new Date(selectedStation.lastUpdated).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
          </div>
        </div>

        {/* 3D Planetary Sync Node */}
        <div className="md:col-span-7 bg-[#1B1F27] border border-[#282F3B] rounded-xl p-4 flex flex-col sm:flex-row items-center gap-4 relative overflow-hidden">
          <div className="w-full sm:w-1/2 h-56 sm:h-full min-h-[220px]">
            <EarthGlobe3D
              stations={stations}
              selectedStationId={selectedStation.id}
              onSelectStation={onSelectStation}
              className="w-full h-full"
            />
          </div>

          <div className="w-full sm:w-1/2 space-y-3 p-2">
            <div className="text-xs font-semibold text-[#38D9FF] flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5" />
              <span>Telemetry Coordinates</span>
            </div>
            <div className="text-xs text-[#9CA7B5] space-y-1 font-mono">
              <div>Lat: {selectedStation.coordinates.latitude.toFixed(4)}° N</div>
              <div>Lon: {selectedStation.coordinates.longitude.toFixed(4)}° E</div>
              <div>Station Type: Continuous Amb. Ground Node</div>
            </div>

            <div className="pt-2 border-t border-[#282F3B] space-y-1">
              <div className="text-[11px] font-medium text-[#F2F5F8]">Quick Station Switch</div>
              <div className="flex flex-wrap gap-1.5">
                {stations.map(st => (
                  <button
                    key={st.id}
                    onClick={() => onSelectStation(st.id)}
                    className={`px-2 py-1 rounded text-[11px] border transition-colors cursor-pointer ${
                      st.id === selectedStation.id
                        ? 'bg-[#38D9FF]/20 border-[#38D9FF] text-[#38D9FF] font-semibold'
                        : 'bg-[#111318] border-[#282F3B] text-[#9CA7B5] hover:text-[#F2F5F8]'
                    }`}
                  >
                    {st.city}
                  </button>
                ))}
              </div>
            </div>

            <button
              onClick={onOpenMap}
              className="w-full flex items-center justify-center gap-1.5 py-1.5 bg-[#111318] hover:bg-[#282F3B] border border-[#282F3B] text-xs text-[#38D9FF] rounded transition-colors cursor-pointer"
            >
              <span>Inspect Full GIS Map</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

      </div>

      {/* 3. Detailed Pollutant Metrics Matrix */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-base font-semibold text-[#F2F5F8] flex items-center gap-2">
            <Activity className="w-4 h-4 text-[#38D9FF]" />
            <span>Validated Pollutant Concentrations</span>
          </h2>
          <span className="text-xs text-[#9CA7B5]">WHO 2021 Benchmarks & EPA Standards</span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {Object.entries(selectedStation.measurements).map(([key, m]) => {
            const isHovered = selectedPollutant === key;
            const isUnavailable = m.status === 'unavailable' || m.value === null;

            return (
              <button
                key={key}
                onClick={() => setSelectedPollutant(key as any)}
                className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer ${
                  isHovered 
                    ? 'bg-[#282F3B] border-[#38D9FF] shadow-lg' 
                    : 'bg-[#1B1F27] border-[#282F3B] hover:border-[#38D9FF]/40'
                } ${isUnavailable ? 'opacity-70' : ''}`}
              >
                <div className="flex items-center justify-between text-xs text-[#9CA7B5]">
                  <span className="font-semibold uppercase text-[#F2F5F8]">{m.parameter}</span>
                  <span className={`w-2 h-2 rounded-full ${
                    isUnavailable ? 'bg-[#9CA7B5]/40' :
                    m.status === 'safe' ? 'bg-[#38D9FF]' :
                    m.status === 'moderate' ? 'bg-[#FFB84D]' :
                    'bg-[#FF4757]'
                  }`} />
                </div>

                <div className="mt-2 text-xl font-bold font-mono text-[#F2F5F8]">
                  {isUnavailable ? (
                    <span className="text-[#9CA7B5] font-normal text-base">Not Monitored</span>
                  ) : (
                    <>
                      {m.value}
                      <span className="text-[11px] font-normal text-[#9CA7B5] ml-1">{m.unit}</span>
                    </>
                  )}
                </div>

                <div className="mt-2 text-[10px] text-[#9CA7B5] truncate">
                  {(m.name || m.parameter.toUpperCase()).split('(')[0]}
                </div>

                {m.whoLimit24h && !isUnavailable && (
                  <div className="mt-1 text-[9px] text-[#9CA7B5] font-mono">
                    WHO: ≤{m.whoLimit24h} {m.unit}
                  </div>
                )}
                {isUnavailable && (
                  <div className="mt-1 text-[9px] text-[#9CA7B5] italic">
                    Sensor unavailable
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* 4. 24-Hour Historical Trend & Exposure Advisory Split */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* 24-Hour Trend Mini-Chart */}
        <div className="lg:col-span-7 p-6 bg-[#1B1F27] border border-[#282F3B] rounded-xl space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-semibold text-[#F2F5F8]">24-Hour Atmospheric Trend</h3>
              <p className="text-xs text-[#9CA7B5]">Continuous ambient readings from {selectedStation.name}</p>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-[#9CA7B5]">Parameter:</span>
              <select
                value={selectedPollutant}
                onChange={(e) => setSelectedPollutant(e.target.value as any)}
                className="bg-[#111318] border border-[#282F3B] text-xs text-[#38D9FF] rounded px-2 py-1 outline-none font-mono"
              >
                <option value="pm25">PM2.5</option>
                <option value="pm10">PM10</option>
                <option value="no2">NO2</option>
                <option value="o3">O3</option>
                <option value="co">CO</option>
                <option value="so2">SO2</option>
              </select>
            </div>
          </div>

          {/* Simple crisp responsive SVG Sparkline Chart */}
          <div className="w-full h-48 relative pt-4">
            {!isPollutantAvailable ? (
              <div className="h-full flex flex-col items-center justify-center text-xs text-[#9CA7B5] border border-dashed border-[#282F3B] rounded-lg p-6 space-y-1">
                <Info className="w-5 h-5 text-[#9CA7B5]" />
                <div className="font-medium text-[#F2F5F8]">{selectedPollutant.toUpperCase()} Sensor Channel Unavailable</div>
                <div className="text-[11px] text-center max-w-sm">
                  This monitoring installation does not operate a physical {selectedPollutant.toUpperCase()} analyzer. Switch to PM2.5 or PM10 above to inspect verified telemetry.
                </div>
              </div>
            ) : historicalReadings.length > 0 ? (
              <svg className="w-full h-full overflow-visible" viewBox="0 0 500 140" preserveAspectRatio="none">
                <defs>
                  <linearGradient id="trendGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#38D9FF" stopOpacity="0.35" />
                    <stop offset="100%" stopColor="#38D9FF" stopOpacity="0.0" />
                  </linearGradient>
                </defs>

                {/* Gridlines */}
                <line x1="0" y1="20" x2="500" y2="20" stroke="#282F3B" strokeDasharray="3 3" />
                <line x1="0" y1="70" x2="500" y2="70" stroke="#282F3B" strokeDasharray="3 3" />
                <line x1="0" y1="120" x2="500" y2="120" stroke="#282F3B" strokeDasharray="3 3" />

                {/* Calculate points */}
                {(() => {
                  const values = historicalReadings.map(r => (r as any)[selectedPollutant] || 0);
                  const min = Math.min(...values);
                  const max = Math.max(...values, min + 1);
                  const points = values.map((val, idx) => {
                    const x = (idx / (values.length - 1)) * 500;
                    const y = 130 - ((val - min) / (max - min)) * 110;
                    return `${x},${y}`;
                  }).join(' ');

                  const areaPoints = `0,140 ${points} 500,140`;

                  return (
                    <>
                      <polygon points={areaPoints} fill="url(#trendGradient)" />
                      <polyline
                        points={points}
                        fill="none"
                        stroke="#38D9FF"
                        strokeWidth="2.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </>
                  );
                })()}
              </svg>
            ) : (
              <div className="h-full flex items-center justify-center text-xs text-[#9CA7B5]">
                Gathering telemetry stream...
              </div>
            )}
          </div>

          <div className="flex items-center justify-between text-[11px] text-[#9CA7B5] font-mono pt-2 border-t border-[#282F3B]">
            <span>24h ago</span>
            <span>12h ago</span>
            <span>Current (Live)</span>
          </div>
        </div>

        {/* Actionable Exposure Guidance Card */}
        <div className="lg:col-span-5 p-6 bg-[#1B1F27] border border-[#282F3B] rounded-xl flex flex-col justify-between space-y-4">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-[#282F3B]">
              <div className="flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 text-[#38D9FF]" />
                <h3 className="text-sm font-semibold text-[#F2F5F8]">Public Health Guidance</h3>
              </div>
              <button
                onClick={onOpenGuidance}
                className="text-xs text-[#38D9FF] hover:underline flex items-center gap-0.5 cursor-pointer"
              >
                <span>Full Guide</span>
                <ChevronRight className="w-3 h-3" />
              </button>
            </div>

            <div className="mt-4 space-y-3 text-xs">
              <div>
                <span className="text-[#9CA7B5] block mb-1">General Population</span>
                <p className="text-[#F2F5F8] leading-relaxed">{currentGuideline.generalPublic}</p>
              </div>

              <div>
                <span className="text-[#9CA7B5] block mb-1">Sensitive Demographics</span>
                <p className="text-[#F2F5F8] leading-relaxed">{currentGuideline.sensitiveGroups}</p>
              </div>

              <div className="pt-2 border-t border-[#282F3B] grid grid-cols-2 gap-3 text-[11px]">
                <div className="p-2.5 rounded bg-[#111318] border border-[#282F3B]">
                  <span className="text-[#9CA7B5] block">Outdoor Activity</span>
                  <span className="text-[#F2F5F8] font-medium mt-0.5 block">{currentGuideline.outdoorActivities.slice(0, 48)}...</span>
                </div>
                <div className="p-2.5 rounded bg-[#111318] border border-[#282F3B]">
                  <span className="text-[#9CA7B5] block">Filtration & Mask</span>
                  <span className="text-[#38D9FF] font-medium mt-0.5 block">{currentGuideline.recommendedMask}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="p-2.5 bg-[#111318] rounded-lg border border-[#282F3B] text-[10px] text-[#9CA7B5] flex items-start gap-2">
            <Info className="w-3.5 h-3.5 text-[#38D9FF] shrink-0 mt-0.5" />
            <span>Public health advisories represent environmental recommendations, not individualized clinical advice. Consult medical providers for chronic conditions.</span>
          </div>
        </div>

      </div>

      {/* 5. Recent Alerts Strip */}
      <div className="p-4 bg-[#1B1F27] border border-[#282F3B] rounded-xl flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-[#FF9B54]/10 text-[#FF9B54] flex items-center justify-center shrink-0">
            <AlertCircle className="w-4 h-4" />
          </div>
          <div>
            <div className="text-xs font-semibold text-[#F2F5F8]">Threshold Alert Engine Active</div>
            <div className="text-[11px] text-[#9CA7B5]">
              {notifications.length} logged trigger events · Monitoring custom particulate thresholds
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={onOpenAlerts}
            className="px-3 py-1.5 bg-[#111318] hover:bg-[#282F3B] border border-[#282F3B] text-xs text-[#F2F5F8] rounded-lg transition-colors cursor-pointer"
          >
            Configure Rules & Triggers
          </button>
        </div>
      </div>

    </div>
  );
};
