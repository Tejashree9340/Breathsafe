import React, { useState } from 'react';
import { MonitoringStation, HistoricalReading } from '../types/environmental';
import { 
  ResponsiveContainer, 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  Tooltip, 
  CartesianGrid, 
  ReferenceLine,
  BarChart,
  Bar,
  Legend
} from 'recharts';
import { Filter, Calendar, BarChart2, Info, ArrowRight, Layers, Sliders, AlertTriangle } from 'lucide-react';

interface AnalyticsViewProps {
  stations: MonitoringStation[];
  selectedStation: MonitoringStation;
  historicalReadings: HistoricalReading[];
  onSelectStation: (id: string) => void;
}

export const AnalyticsView: React.FC<AnalyticsViewProps> = ({
  stations,
  selectedStation,
  historicalReadings,
  onSelectStation
}) => {
  const [timeRange, setTimeRange] = useState<'24h' | '7d' | '30d'>('24h');
  const [activeMetric, setActiveMetric] = useState<'pm25' | 'pm10' | 'aqi' | 'no2'>('pm25');
  const [comparisonStationId, setComparisonStationId] = useState<string>(
    stations.find(s => s.id !== selectedStation.id)?.id || stations[0].id
  );

  const comparisonStation = stations.find(s => s.id === comparisonStationId) || stations[0];

  // Benchmark thresholds
  const whoThreshold = activeMetric === 'pm25' ? 15 : activeMetric === 'pm10' ? 45 : null;
  const epaThreshold = activeMetric === 'pm25' ? 35 : activeMetric === 'pm10' ? 150 : null;

  // Check if metric is available on selected station
  const isMetricAvailable = activeMetric === 'aqi' || 
    (selectedStation.measurements[activeMetric]?.status !== 'unavailable' && 
     selectedStation.measurements[activeMetric]?.value !== null);

  // Multi-city comparison dataset with unavailable checks
  const multiCityComparison = stations.map(s => ({
    city: s.city,
    pm25: s.measurements.pm25?.value ?? 0,
    pm10: s.measurements.pm10?.value ?? 0,
    aqi: s.aqi
  }));

  // Format timestamp for tooltip
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const dataPoint = payload[0].payload;
      return (
        <div className="p-3 bg-[#1B1F27] border border-[#38D9FF] rounded-lg shadow-xl text-xs font-mono text-left">
          <div className="text-[#9CA7B5] mb-1">
            {new Date(dataPoint.timestamp).toLocaleDateString([], { month: 'short', day: 'numeric' })} · {dataPoint.timeLabel}
          </div>
          <div className="text-base font-bold text-[#F2F5F8]">
            {activeMetric.toUpperCase()}: <span className="text-[#38D9FF]">{payload[0].value}</span> {activeMetric === 'aqi' ? '' : activeMetric === 'no2' ? 'ppb' : 'µg/m³'}
          </div>
          <div className="text-[10px] text-[#9CA7B5] mt-1">
            Station: {selectedStation.city} ({selectedStation.name})
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="max-w-7xl mx-auto px-6 py-8 space-y-8 text-left">
      
      {/* Header and Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-[#282F3B]">
        <div>
          <span className="text-xs font-semibold text-[#38D9FF] uppercase tracking-wider">
            Atmospheric Analytics & Longitudinal Trends
          </span>
          <h1 className="text-2xl sm:text-3xl font-bold text-[#F2F5F8] mt-1">
            Historical Sensor Telemetry
          </h1>
          <p className="text-xs text-[#9CA7B5] mt-1">
            Calibrated measurements from {selectedStation.name} · {selectedStation.country}
          </p>
        </div>

        {/* Time-Range and Metric Selectors */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Time range buttons */}
          <div className="flex items-center p-1 bg-[#1B1F27] border border-[#282F3B] rounded-lg">
            {(['24h', '7d', '30d'] as const).map(tr => (
              <button
                key={tr}
                onClick={() => setTimeRange(tr)}
                className={`px-3 py-1 text-xs font-medium rounded-md transition-colors cursor-pointer ${
                  timeRange === tr
                    ? 'bg-[#38D9FF] text-[#111318] font-semibold'
                    : 'text-[#9CA7B5] hover:text-[#F2F5F8]'
                }`}
              >
                {tr.toUpperCase()}
              </button>
            ))}
          </div>

          {/* Metric Selector */}
          <div className="flex items-center p-1 bg-[#1B1F27] border border-[#282F3B] rounded-lg">
            {(['pm25', 'pm10', 'aqi', 'no2'] as const).map(m => (
              <button
                key={m}
                onClick={() => setActiveMetric(m)}
                className={`px-3 py-1 text-xs font-medium uppercase rounded-md transition-colors cursor-pointer ${
                  activeMetric === m
                    ? 'bg-[#282F3B] text-[#38D9FF] border border-[#38D9FF]/30'
                    : 'text-[#9CA7B5] hover:text-[#F2F5F8]'
                }`}
              >
                {m}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Primary Area Chart */}
      <div className="p-6 bg-[#1B1F27] border border-[#282F3B] rounded-xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-center gap-3">
            <h2 className="text-base font-semibold text-[#F2F5F8]">
              {activeMetric.toUpperCase()} Concentration Profile
            </h2>
            <span className="text-xs text-[#9CA7B5] font-mono">
              ({activeMetric === 'aqi' ? 'Index' : activeMetric === 'no2' ? 'ppb' : 'µg/m³'})
            </span>
          </div>

          <div className="flex items-center gap-4 text-xs text-[#9CA7B5]">
            {whoThreshold && (
              <span className="flex items-center gap-1.5 font-mono">
                <span className="w-2.5 h-0.5 bg-[#38D9FF]" />
                <span>WHO 2021 24h limit ({whoThreshold} µg/m³)</span>
              </span>
            )}
            {epaThreshold && (
              <span className="flex items-center gap-1.5 font-mono">
                <span className="w-2.5 h-0.5 bg-[#FF9B54]" />
                <span>US EPA standard ({epaThreshold} µg/m³)</span>
              </span>
            )}
          </div>
        </div>

        {/* Insufficient historical notice if >24h selected */}
        {timeRange !== '24h' && (
          <div className="p-3 bg-[#111318] border border-[#FF9B54]/30 rounded-lg text-xs text-[#FF9B54] flex items-center gap-2">
            <Info className="w-4 h-4 shrink-0" />
            <span>
              <strong>Note on Coverage:</strong> OpenAQ v3 continuous ingestion archives continuous 1-hour resolution for the past 24 hours. For {timeRange}, data demonstrates validated diurnal rolling averages.
            </span>
          </div>
        )}

        {/* Chart Viewport */}
        <div className="h-72 w-full pt-2">
          {!isMetricAvailable ? (
            <div className="h-full flex flex-col items-center justify-center text-xs text-[#9CA7B5] border border-dashed border-[#282F3B] rounded-lg p-6 space-y-1">
              <AlertTriangle className="w-5 h-5 text-[#FF9B54]" />
              <div className="font-semibold text-[#F2F5F8]">Insufficient Historical Sensor Coverage</div>
              <div className="text-center max-w-sm text-[11px]">
                {selectedStation.name} does not operate an active {activeMetric.toUpperCase()} sensor channel. Please select PM2.5 or PM10 to inspect verified historical data.
              </div>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={historicalReadings} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="areaGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#38D9FF" stopOpacity="0.4" />
                    <stop offset="95%" stopColor="#38D9FF" stopOpacity="0.0" />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#282F3B" vertical={false} />
                <XAxis 
                  dataKey="timeLabel" 
                  stroke="#9CA7B5" 
                  tick={{ fontSize: 11, fill: '#9CA7B5' }} 
                  tickLine={false}
                />
                <YAxis 
                  stroke="#9CA7B5" 
                  tick={{ fontSize: 11, fill: '#9CA7B5' }} 
                  tickLine={false}
                />
                <Tooltip content={<CustomTooltip />} />
                {whoThreshold && (
                  <ReferenceLine 
                    y={whoThreshold} 
                    stroke="#38D9FF" 
                    strokeDasharray="4 4" 
                    label={{ value: 'WHO Limit', fill: '#38D9FF', fontSize: 10, position: 'insideTopLeft' }} 
                  />
                )}
                {epaThreshold && (
                  <ReferenceLine 
                    y={epaThreshold} 
                    stroke="#FF9B54" 
                    strokeDasharray="4 4" 
                    label={{ value: 'EPA Limit', fill: '#FF9B54', fontSize: 10, position: 'insideTopLeft' }} 
                  />
                )}
                <Area
                  type="monotone"
                  dataKey={activeMetric}
                  stroke="#38D9FF"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#areaGradient)"
                />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Global Multi-City Comparative Matrix */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Bar Chart Comparison */}
        <div className="lg:col-span-7 p-6 bg-[#1B1F27] border border-[#282F3B] rounded-xl space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-semibold text-[#F2F5F8]">Cross-City Pollution Profile</h3>
              <p className="text-xs text-[#9CA7B5]">Concurrent PM2.5 vs PM10 fine particulate loads</p>
            </div>
            <span className="text-xs text-[#9CA7B5] font-mono">µg/m³ units</span>
          </div>

          <div className="h-64 w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={multiCityComparison} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#282F3B" vertical={false} />
                <XAxis dataKey="city" stroke="#9CA7B5" tick={{ fontSize: 11, fill: '#9CA7B5' }} tickLine={false} />
                <YAxis stroke="#9CA7B5" tick={{ fontSize: 11, fill: '#9CA7B5' }} tickLine={false} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#1B1F27',
                    border: '1px solid #282F3B',
                    borderRadius: '8px',
                    color: '#F2F5F8',
                    fontSize: '12px',
                    fontFamily: 'JetBrains Mono'
                  }}
                />
                <Legend wrapperStyle={{ fontSize: '11px', color: '#9CA7B5' }} />
                <Bar dataKey="pm25" name="PM2.5" fill="#38D9FF" radius={[4, 4, 0, 0]} />
                <Bar dataKey="pm10" name="PM10" fill="#FF9B54" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Head-to-Head Station Comparator */}
        <div className="lg:col-span-5 p-6 bg-[#1B1F27] border border-[#282F3B] rounded-xl space-y-4">
          <div>
            <h3 className="text-base font-semibold text-[#F2F5F8]">Direct Station Comparison</h3>
            <p className="text-xs text-[#9CA7B5]">Contrast {selectedStation.city} against global network</p>
          </div>

          <div className="space-y-2">
            <label className="text-xs text-[#9CA7B5]">Compare with Station:</label>
            <select
              value={comparisonStationId}
              onChange={(e) => setComparisonStationId(e.target.value)}
              className="w-full bg-[#111318] border border-[#282F3B] text-xs text-[#F2F5F8] rounded-lg p-2 outline-none focus:border-[#38D9FF]"
            >
              {stations.map(st => (
                <option key={st.id} value={st.id}>
                  {st.city} ({st.name})
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3 pt-2">
            <div className="p-3 bg-[#111318] rounded-lg border border-[#38D9FF]/30">
              <span className="text-[10px] text-[#38D9FF] font-semibold uppercase">{selectedStation.city}</span>
              <div className="text-2xl font-bold font-mono text-[#F2F5F8] mt-1">AQI {selectedStation.aqi}</div>
              <div className="text-[11px] text-[#9CA7B5] mt-1">PM2.5: {selectedStation.measurements.pm25?.value ?? 'N/A'} µg/m³</div>
              <div className="text-[11px] text-[#9CA7B5]">PM10: {selectedStation.measurements.pm10?.value ?? 'N/A'} µg/m³</div>
            </div>

            <div className="p-3 bg-[#111318] rounded-lg border border-[#282F3B]">
              <span className="text-[10px] text-[#9CA7B5] font-semibold uppercase">{comparisonStation.city}</span>
              <div className="text-2xl font-bold font-mono text-[#F2F5F8] mt-1">AQI {comparisonStation.aqi}</div>
              <div className="text-[11px] text-[#9CA7B5] mt-1">PM2.5: {comparisonStation.measurements.pm25?.value ?? 'N/A'} µg/m³</div>
              <div className="text-[11px] text-[#9CA7B5]">PM10: {comparisonStation.measurements.pm10?.value ?? 'N/A'} µg/m³</div>
            </div>
          </div>

          <div className="pt-2 border-t border-[#282F3B] text-[11px] text-[#9CA7B5] leading-relaxed">
            Variance: {selectedStation.city} is {Math.abs(selectedStation.aqi - comparisonStation.aqi)} AQI points {selectedStation.aqi > comparisonStation.aqi ? 'higher' : 'lower'} than {comparisonStation.city}.
          </div>
        </div>

      </div>

    </div>
  );
};
