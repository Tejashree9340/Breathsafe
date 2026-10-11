import React, { useEffect, useState, useMemo, useRef, useCallback } from 'react';
import { MapContainer, TileLayer, useMap, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
// @ts-ignore
import Supercluster from 'supercluster';
import { MonitoringStation } from '../types/environmental';
import { environmentalApi, SearchResultLocation } from '../services/api';
import { calculatePollutantAQI, getAQIColor } from '../utils/aqiCalculator';
import { 
  Search, 
  MapPin, 
  Sliders, 
  Info, 
  X, 
  ExternalLink, 
  Activity, 
  ShieldCheck, 
  AlertTriangle, 
  RefreshCw,
  Compass,
  Layers,
  Clock,
  ChevronRight,
  Database,
  Sun,
  Moon
} from 'lucide-react';

// Fix default Leaflet icon paths in bundlers
try {
  delete (L.Icon.Default.prototype as any)._getIconUrl;
  L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
    iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
    shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  });
} catch {
  // Ignore fallback if running in non-browser context
}

interface PollutionMapViewProps {
  stations: MonitoringStation[];
  selectedStationId?: string;
  onSelectStation: (id: string) => void;
  onNavigateToDashboard?: () => void;
}

type PollutantFilter = 'all' | 'pm25' | 'pm10' | 'no2' | 'o3' | 'so2';

// Inner component to handle map events, bounds changes, and supercluster rendering
interface MapControllerProps {
  activePollutant: PollutantFilter;
  stationsMap: Map<string, MonitoringStation>;
  onBoundsChange: (bounds: { minLat: number; maxLat: number; minLng: number; maxLng: number }, zoom: number) => void;
  onSelectStation: (station: MonitoringStation) => void;
  selectedStation: MonitoringStation | null;
  targetFlyTo: { lat: number; lng: number; zoom?: number } | null;
  onClearTargetFlyTo: () => void;
}

const MapController: React.FC<MapControllerProps> = ({
  activePollutant,
  stationsMap,
  onBoundsChange,
  onSelectStation,
  selectedStation,
  targetFlyTo,
  onClearTargetFlyTo
}) => {
  const map = useMap();
  const markersLayerRef = useRef<L.LayerGroup | null>(null);

  // Handle fly-to requests from search
  useEffect(() => {
    if (targetFlyTo) {
      map.flyTo([targetFlyTo.lat, targetFlyTo.lng], targetFlyTo.zoom || 8, {
        duration: 1.5,
        easeLinearity: 0.25
      });
      onClearTargetFlyTo();
    }
  }, [targetFlyTo, map, onClearTargetFlyTo]);

  // Create layer group on mount
  useEffect(() => {
    const layer = L.layerGroup().addTo(map);
    markersLayerRef.current = layer;
    return () => {
      layer.clearLayers();
      layer.remove();
    };
  }, [map]);

  // Hook into Leaflet map events to report bounds and re-cluster visible markers
  useMapEvents({
    moveend: () => {
      renderMarkers();
      const bounds = map.getBounds();
      onBoundsChange({
        minLat: bounds.getSouth(),
        maxLat: bounds.getNorth(),
        minLng: bounds.getWest(),
        maxLng: bounds.getEast()
      }, map.getZoom());
    },
    zoomend: () => {
      renderMarkers();
      const bounds = map.getBounds();
      onBoundsChange({
        minLat: bounds.getSouth(),
        maxLat: bounds.getNorth(),
        minLng: bounds.getWest(),
        maxLng: bounds.getEast()
      }, map.getZoom());
    }
  });

  // Prepare GeoJSON points for Supercluster
  const geojsonPoints = useMemo(() => {
    const points: any[] = [];
    stationsMap.forEach(station => {
      // Check if station has valid data for active pollutant
      if (activePollutant !== 'all') {
        const m = station.measurements[activePollutant];
        if (!m || m.value === null || m.status === 'unavailable') {
          return;
        }
      }

      points.push({
        type: 'Feature',
        geometry: {
          type: 'Point',
          coordinates: [station.coordinates.longitude, station.coordinates.latitude]
        },
        properties: {
          stationId: station.id,
          aqi: station.aqi,
          name: station.name,
          city: station.city
        }
      });
    });
    return points;
  }, [stationsMap, activePollutant]);

  // Build Supercluster Index
  const superclusterIndex = useMemo(() => {
    const SuperclusterConstructor = (Supercluster as any).default || Supercluster;
    const index = new SuperclusterConstructor({
      radius: 40,
      maxZoom: 13
    });
    index.load(geojsonPoints);
    return index;
  }, [geojsonPoints]);

  // Render clusters and individual markers whenever bounds, zoom, or superclusterIndex changes
  const renderMarkers = useCallback(() => {
    const layer = markersLayerRef.current;
    if (!layer) return;

    layer.clearLayers();

    const bounds = map.getBounds();
    const zoom = Math.round(map.getZoom());
    const bbox: [number, number, number, number] = [
      bounds.getWest(),
      bounds.getSouth(),
      bounds.getEast(),
      bounds.getNorth()
    ];

    let clusters: any[] = [];
    try {
      clusters = superclusterIndex.getClusters(bbox, zoom);
    } catch {
      clusters = [];
    }

    clusters.forEach(feature => {
      const [lng, lat] = feature.geometry.coordinates;
      const isCluster = feature.properties.cluster;

      if (isCluster) {
        const count = feature.properties.point_count;
        const clusterId = feature.properties.cluster_id;

        // Dynamic size and glow based on density
        const size = Math.min(54, Math.max(34, 28 + Math.log10(count) * 12));
        
        const clusterHtml = `
          <div class="breathesafe-cluster-badge" style="width: ${size}px; height: ${size}px; font-size: ${size > 42 ? '13px' : '11px'};">
            ${count}
          </div>
        `;

        const clusterIcon = L.divIcon({
          html: clusterHtml,
          className: 'breathesafe-cluster-icon',
          iconSize: [size, size],
          iconAnchor: [size / 2, size / 2]
        });

        const marker = L.marker([lat, lng], { icon: clusterIcon });
        marker.on('click', () => {
          try {
            const expansionZoom = Math.min(15, superclusterIndex.getClusterExpansionZoom(clusterId));
            map.flyTo([lat, lng], expansionZoom, { duration: 0.8 });
          } catch {
            map.flyTo([lat, lng], zoom + 2);
          }
        });
        layer.addLayer(marker);
      } else {
        // Individual monitoring station marker
        const stationId = feature.properties.stationId;
        const station = stationsMap.get(stationId);
        if (!station) return;

        const isSelected = selectedStation?.id === station.id;

        // Determine color based on active pollutant and whether real reading is present
        let color = getAQIColor(station.aqi);
        let displayVal: string | number = station.aqi;
        let isMeasured = true;

        if (activePollutant !== 'all') {
          const m = station.measurements[activePollutant];
          if (m && m.value !== null && m.status !== 'unavailable') {
            displayVal = m.value;
            const res = calculatePollutantAQI(activePollutant, m.value, m.unit);
            if (res) {
              color = getAQIColor(res.aqi);
            }
          } else {
            color = '#6B7280';
            displayVal = '—';
            isMeasured = false;
          }
        }

        const size = isSelected ? 36 : 28;
        const dotHtml = `
          <div class="breathesafe-station-dot" style="
            width: ${size}px;
            height: ${size}px;
            background: #111318;
            border: 2px solid ${color};
            box-shadow: 0 0 ${isSelected ? '20px' : isMeasured ? '8px' : '2px'} ${color}${isSelected ? 'CC' : isMeasured ? '80' : '40'};
            display: flex;
            align-items: center;
            justify-content: center;
            color: ${color};
            font-family: 'JetBrains Mono', monospace;
            font-size: ${size > 30 ? '11px' : '9.5px'};
            font-weight: 700;
          ">
            ${displayVal}
          </div>
        `;

        const markerIcon = L.divIcon({
          html: dotHtml,
          className: 'breathesafe-station-marker',
          iconSize: [size, size],
          iconAnchor: [size / 2, size / 2]
        });

        const marker = L.marker([lat, lng], { icon: markerIcon });
        
        // Tooltip displaying station name and city on hover
        marker.bindTooltip(`
          <div style="font-weight: 700; color: #F2F5F8; font-size: 11px;">${station.name}</div>
          <div style="color: #9CA7B5; font-size: 10px; margin-top: 2px;">
            ${station.city}, ${station.country} · AQI ${station.aqi} (${station.category})
          </div>
        `, {
          direction: 'top',
          offset: [0, -size / 2],
          className: 'breathesafe-leaflet-tooltip'
        });

        marker.on('click', () => {
          onSelectStation(station);
        });
        layer.addLayer(marker);
      }
    });
  }, [map, superclusterIndex, stationsMap, selectedStation, activePollutant, onSelectStation]);

  useEffect(() => {
    renderMarkers();
  }, [renderMarkers]);

  // Ensure map container dimensions and tile grids are correctly rendered on mount, tab switches, and window resizes
  useEffect(() => {
    map.invalidateSize();
    const t1 = setTimeout(() => {
      map.invalidateSize();
      renderMarkers();
    }, 150);
    const t2 = setTimeout(() => {
      map.invalidateSize();
      renderMarkers();
    }, 450);

    const handleResize = () => {
      map.invalidateSize();
      renderMarkers();
    };

    window.addEventListener('resize', handleResize);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      window.removeEventListener('resize', handleResize);
    };
  }, [map, renderMarkers]);

  // Initial trigger
  useEffect(() => {
    const bounds = map.getBounds();
    onBoundsChange({
      minLat: bounds.getSouth(),
      maxLat: bounds.getNorth(),
      minLng: bounds.getWest(),
      maxLng: bounds.getEast()
    }, map.getZoom());
  }, []);

  return null;
};

export const PollutionMapView: React.FC<PollutionMapViewProps> = ({
  stations: initialStations,
  selectedStationId,
  onSelectStation,
  onNavigateToDashboard
}) => {
  // Store all loaded stations by ID to avoid refetching
  const [stationsMap, setStationsMap] = useState<Map<string, MonitoringStation>>(() => {
    const map = new Map<string, MonitoringStation>();
    initialStations.forEach(s => map.set(s.id, s));
    return map;
  });

  const [activePollutant, setActivePollutant] = useState<PollutantFilter>('all');
  const [selectedStation, setSelectedStation] = useState<MonitoringStation | null>(() => {
    return initialStations.find(s => s.id === selectedStationId) || initialStations[0] || null;
  });

  // Search states
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResultLocation[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showSearchDropdown, setShowSearchDropdown] = useState(false);
  const [searchedGeoPin, setSearchedGeoPin] = useState<{ lat: number; lng: number; name: string } | null>(null);

  // Loading & Error states
  const [isLoadingBounds, setIsLoadingBounds] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);
  const [lastUpdatedTime, setLastUpdatedTime] = useState<string>(new Date().toLocaleTimeString());
  const [hasOpenAqKey, setHasOpenAqKey] = useState<boolean>(false);
  const [totalFoundInBounds, setTotalFoundInBounds] = useState<number>(initialStations.length);

  // Target fly to trigger
  const [targetFlyTo, setTargetFlyTo] = useState<{ lat: number; lng: number; zoom?: number } | null>(null);
  
  // Map appearance mode: 'natural' (default OpenStreetMap) or 'night' (dark-contrast filtered)
  const [mapTheme, setMapTheme] = useState<'natural' | 'night'>('natural');

  // Legend visibility
  const [isLegendOpen, setIsLegendOpen] = useState(true);

  // Check backend configuration on mount
  useEffect(() => {
    async function loadConfig() {
      const cfg = await environmentalApi.getConfig();
      setHasOpenAqKey(cfg.hasOpenAqKey);
    }
    loadConfig();
  }, []);

  // Update selectedStation when prop changes
  useEffect(() => {
    if (selectedStationId) {
      const found = stationsMap.get(selectedStationId);
      if (found) setSelectedStation(found);
    }
  }, [selectedStationId, stationsMap]);

  // Debounced bounds query
  const boundsDebounceTimer = useRef<any>(null);

  const handleBoundsChange = useCallback((bounds: { minLat: number; maxLat: number; minLng: number; maxLng: number }, zoom: number) => {
    if (boundsDebounceTimer.current) {
      clearTimeout(boundsDebounceTimer.current);
    }

    boundsDebounceTimer.current = setTimeout(async () => {
      setIsLoadingBounds(true);
      setApiError(null);
      try {
        const queryLimit = zoom < 4 ? 100 : 80;
        const response = await environmentalApi.getLocationsByBounds(
          bounds,
          activePollutant,
          1,
          queryLimit
        );

        if (response && response.results) {
          setStationsMap(prev => {
            const next = new Map(prev);
            response.results.forEach(st => next.set(st.id, st));
            return next;
          });
          setTotalFoundInBounds(response.meta?.totalFound ?? response.results.length);
          setLastUpdatedTime(new Date().toLocaleTimeString());

          // Seamless pagination: if more stations are available in this bounding box, fetch next page
          if (response.meta && response.meta.totalFound > queryLimit) {
            environmentalApi.getLocationsByBounds(bounds, activePollutant, 2, queryLimit)
              .then(p2 => {
                if (p2 && p2.results && p2.results.length > 0) {
                  setStationsMap(prev => {
                    const next = new Map(prev);
                    p2.results.forEach(st => next.set(st.id, st));
                    return next;
                  });
                }
              })
              .catch(() => {});
          }
        }
      } catch (err: any) {
        console.warn('Bounds fetch error:', err);
        setApiError('Unable to update local bounds from OpenAQ v3 stream.');
      } finally {
        setIsLoadingBounds(false);
      }
    }, 280);
  }, [activePollutant]);

  // Handle live global search
  useEffect(() => {
    if (!searchQuery || searchQuery.trim().length < 2) {
      setSearchResults([]);
      setShowSearchDropdown(false);
      return;
    }

    const timer = setTimeout(async () => {
      setIsSearching(true);
      try {
        const results = await environmentalApi.searchLocations(searchQuery);
        setSearchResults(results);
        setShowSearchDropdown(true);
      } finally {
        setIsSearching(false);
      }
    }, 250);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  const handleSelectSearchResult = (item: SearchResultLocation) => {
    setShowSearchDropdown(false);
    setSearchQuery(item.name);

    if (item.category === 'air_quality_station' && item.stationId) {
      // Direct monitoring station match
      const station = stationsMap.get(item.stationId);
      if (station) {
        setSelectedStation(station);
        onSelectStation(station.id);
        setTargetFlyTo({ lat: station.coordinates.latitude, lng: station.coordinates.longitude, zoom: 11 });
      } else {
        setTargetFlyTo({ lat: item.latitude, lng: item.longitude, zoom: 11 });
      }
      setSearchedGeoPin(null);
    } else {
      // Geographic map location (e.g. city/country)
      setSearchedGeoPin({
        lat: item.latitude,
        lng: item.longitude,
        name: item.displayName
      });
      setTargetFlyTo({ lat: item.latitude, lng: item.longitude, zoom: 8 });
    }
  };

  const handleStationClick = (station: MonitoringStation) => {
    setSelectedStation(station);
    onSelectStation(station.id);
    setSearchedGeoPin(null);
  };

  const POLLUTANTS: { id: PollutantFilter; label: string; unit: string }[] = [
    { id: 'all', label: 'Overall AQI', unit: 'Index (EPA)' },
    { id: 'pm25', label: 'PM2.5', unit: 'µg/m³' },
    { id: 'pm10', label: 'PM10', unit: 'µg/m³' },
    { id: 'no2', label: 'NO₂', unit: 'ppb' },
    { id: 'o3', label: 'O₃', unit: 'ppb' },
    { id: 'so2', label: 'SO₂', unit: 'ppb' }
  ];

  return (
    <div className="relative w-full h-[calc(100vh-64px)] min-h-[620px] bg-[#111318] overflow-hidden flex flex-col text-left">
      
      {/* 1. Floating Top Bar: Search, Pollutant Filter Pills, & Real-Time Status */}
      <div className="absolute top-4 left-4 right-4 z-20 pointer-events-none flex flex-col md:flex-row md:items-center justify-between gap-3">
        
        {/* Left: Search Bar & Autocomplete */}
        <div className="relative w-full md:w-96 pointer-events-auto">
          <div className="relative flex items-center bg-[#1B1F27]/95 backdrop-blur-md border border-[#282F3B] focus-within:border-[#38D9FF] rounded-xl shadow-2xl transition-all">
            <Search className="w-4 h-4 text-[#9CA7B5] ml-3.5 shrink-0" />
            <input
              type="text"
              placeholder="Search worldwide cities, countries, or stations..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onFocus={() => { if (searchResults.length > 0) setShowSearchDropdown(true); }}
              className="w-full bg-transparent px-3 py-2.5 text-xs text-[#F2F5F8] placeholder-[#9CA7B5] outline-none"
            />
            {isSearching && (
              <RefreshCw className="w-3.5 h-3.5 text-[#38D9FF] animate-spin mr-3" />
            )}
            {searchQuery && !isSearching && (
              <button 
                onClick={() => { setSearchQuery(''); setShowSearchDropdown(false); }}
                className="text-[#9CA7B5] hover:text-[#F2F5F8] text-xs p-1.5 mr-2"
              >
                ×
              </button>
            )}
          </div>

          {/* Autocomplete Dropdown */}
          {showSearchDropdown && searchResults.length > 0 && (
            <div className="absolute top-full left-0 right-0 mt-1.5 bg-[#1B1F27] border border-[#282F3B] rounded-xl shadow-2xl overflow-hidden z-50 max-h-72 overflow-y-auto">
              <div className="p-2 border-b border-[#282F3B]/60 text-[10px] font-semibold text-[#9CA7B5] uppercase tracking-wider">
                Worldwide Locations & Sensors
              </div>
              {searchResults.map((res, i) => (
                <button
                  key={`${res.placeId}-${i}`}
                  onClick={() => handleSelectSearchResult(res)}
                  className="w-full text-left p-3 hover:bg-[#282F3B] border-b border-[#282F3B]/40 last:border-none flex items-start gap-2.5 transition-colors cursor-pointer"
                >
                  <MapPin className={`w-4 h-4 shrink-0 mt-0.5 ${res.category === 'air_quality_station' ? 'text-[#38D9FF]' : 'text-[#FF9B54]'}`} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold text-[#F2F5F8] truncate">{res.name}</span>
                      <span className={`text-[9px] px-1.5 py-0.2 rounded border font-mono ${
                        res.category === 'air_quality_station'
                          ? 'bg-[#38D9FF]/10 text-[#38D9FF] border-[#38D9FF]/30'
                          : 'bg-[#FF9B54]/10 text-[#FF9B54] border-[#FF9B54]/30'
                      }`}>
                        {res.category === 'air_quality_station' ? 'Monitoring Station' : 'Geographic Place'}
                      </span>
                    </div>
                    <div className="text-[10px] text-[#9CA7B5] truncate mt-0.5">{res.displayName}</div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Center: Pollutant Filter Switchers */}
        <div className="pointer-events-auto flex items-center gap-1.5 p-1 bg-[#1B1F27]/95 backdrop-blur-md border border-[#282F3B] rounded-xl shadow-2xl overflow-x-auto max-w-full">
          {POLLUTANTS.map(p => (
            <button
              key={p.id}
              onClick={() => setActivePollutant(p.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all cursor-pointer ${
                activePollutant === p.id
                  ? 'bg-[#38D9FF] text-[#111318] font-bold shadow-md shadow-[#38D9FF]/20'
                  : 'text-[#9CA7B5] hover:text-[#F2F5F8] hover:bg-[#282F3B]'
              }`}
            >
              <span>{p.label}</span>
            </button>
          ))}
        </div>

        {/* Right: Map Theme Toggle & Telemetry Ingestion Status Pill */}
        <div className="flex items-center gap-2">
          {/* Map Style Toggle */}
          <button
            onClick={() => setMapTheme(prev => prev === 'natural' ? 'night' : 'natural')}
            className="pointer-events-auto flex items-center gap-1.5 px-3 py-2 bg-[#1B1F27]/95 backdrop-blur-md border border-[#282F3B] hover:border-[#38D9FF]/40 rounded-xl text-xs text-[#F2F5F8] transition-colors cursor-pointer shadow-2xl"
            title="Toggle between standard OpenStreetMap tiles and dark-contrast filter"
          >
            {mapTheme === 'natural' ? (
              <>
                <Sun className="w-3.5 h-3.5 text-[#FFB84D]" />
                <span className="text-[11px] font-medium hidden sm:inline">OSM Natural</span>
              </>
            ) : (
              <>
                <Moon className="w-3.5 h-3.5 text-[#38D9FF]" />
                <span className="text-[11px] font-medium hidden sm:inline">OSM Night</span>
              </>
            )}
          </button>

          {/* Telemetry Status */}
          <div className="pointer-events-auto hidden lg:flex items-center gap-2 px-3.5 py-2 bg-[#1B1F27]/95 backdrop-blur-md border border-[#282F3B] rounded-xl text-xs shadow-2xl">
            <span className={`w-2 h-2 rounded-full ${isLoadingBounds ? 'bg-[#FF9B54] animate-ping' : 'bg-[#38D9FF]'}`} />
            <span className="text-[#F2F5F8] font-medium">
              {isLoadingBounds ? 'Syncing Bounds...' : hasOpenAqKey ? 'OpenAQ v3 Live Ingestion' : 'OpenAQ v3 Global Pipeline'}
            </span>
            <span className="text-[#9CA7B5] font-mono text-[11px]">· {lastUpdatedTime}</span>
          </div>
        </div>

      </div>

      {/* 2. Full-Page React Leaflet Map Container */}
      <div className="flex-1 w-full h-full relative" style={{ minHeight: '520px' }}>
        <MapContainer
          center={[20, 0]}
          zoom={2}
          minZoom={2}
          maxZoom={19}
          zoomControl={true}
          scrollWheelZoom={true}
          className={`w-full h-full ${mapTheme === 'night' ? 'breathesafe-night-tiles' : ''}`}
          style={{ width: '100%', height: '100%', position: 'absolute', inset: 0, background: '#111318' }}
        >
          {/* Public OpenStreetMap tile layer (no API key required) */}
          <TileLayer
            url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer">OpenStreetMap</a> contributors'
            maxZoom={19}
          />

          <MapController
            activePollutant={activePollutant}
            stationsMap={stationsMap}
            onBoundsChange={handleBoundsChange}
            onSelectStation={handleStationClick}
            selectedStation={selectedStation}
            targetFlyTo={targetFlyTo}
            onClearTargetFlyTo={() => setTargetFlyTo(null)}
          />
        </MapContainer>
      </div>

      {/* 3. Searched Geographic Place Notice (When user searches city without direct station) */}
      {searchedGeoPin && (
        <div className="absolute top-20 left-4 z-20 p-3 bg-[#1B1F27]/95 border border-[#FF9B54]/40 rounded-xl max-w-sm text-xs shadow-2xl backdrop-blur-md">
          <div className="flex items-center justify-between text-[#FF9B54] font-semibold">
            <div className="flex items-center gap-1.5">
              <MapPin className="w-4 h-4" />
              <span>Location: {searchedGeoPin.name.split(',')[0]}</span>
            </div>
            <button onClick={() => setSearchedGeoPin(null)} className="text-[#9CA7B5] hover:text-[#F2F5F8]">×</button>
          </div>
          <p className="text-[11px] text-[#9CA7B5] mt-1">
            Displaying regulatory monitoring stations nearest to this geographic sector. Pan or zoom in to inspect localized air quality sensors.
          </p>
        </div>
      )}

      {/* 4. Interactive Station Details Drawer (Bottom-Left / Slide-Up) */}
      {selectedStation && (
        <div className="absolute bottom-6 left-4 right-4 md:right-auto md:w-[420px] z-20 bg-[#1B1F27]/95 backdrop-blur-md border border-[#282F3B] hover:border-[#38D9FF]/40 rounded-2xl p-5 shadow-2xl transition-all space-y-4">
          
          {/* Station Title & Close */}
          <div className="flex items-start justify-between gap-3 pb-3 border-b border-[#282F3B]">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono text-[#38D9FF] bg-[#38D9FF]/10 px-2 py-0.5 rounded border border-[#38D9FF]/20">
                  {selectedStation.countryCode} · {selectedStation.sourceType.toUpperCase()}
                </span>
                {selectedStation.isStale && (
                  <span className="text-xs font-mono text-[#FF9B54] bg-[#FF9B54]/10 px-2 py-0.5 rounded border border-[#FF9B54]/30">
                    STALE FEED
                  </span>
                )}
              </div>
              <h3 className="text-lg font-bold text-[#F2F5F8] mt-1.5 leading-snug">
                {selectedStation.city}
              </h3>
              <p className="text-xs text-[#9CA7B5] truncate mt-0.5">
                {selectedStation.name}
              </p>
            </div>
            
            <button
              onClick={() => setSelectedStation(null)}
              className="p-1 rounded-lg text-[#9CA7B5] hover:text-[#F2F5F8] hover:bg-[#282F3B] transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Coordinates & Source Attribution */}
          <div className="grid grid-cols-2 gap-2 text-xs font-mono bg-[#111318] p-2.5 rounded-xl border border-[#282F3B]">
            <div>
              <span className="text-[#9CA7B5] text-[10px] block uppercase">Coordinates</span>
              <span className="text-[#F2F5F8]">
                {selectedStation.coordinates.latitude.toFixed(4)}°, {selectedStation.coordinates.longitude.toFixed(4)}°
              </span>
            </div>
            <div>
              <span className="text-[#9CA7B5] text-[10px] block uppercase">Instrument</span>
              <span className="text-[#F2F5F8] truncate block" title={selectedStation.instrument || 'BAM-1020 / TEOM'}>
                {selectedStation.instrument || 'BAM-1020 / TEOM'}
              </span>
            </div>
          </div>

          {/* Computed AQI & Primary Pollutant Reading (Strictly distinguishing raw concentration from AQI) */}
          <div className="p-3.5 rounded-xl bg-[#111318] border border-[#282F3B] flex items-center justify-between">
            <div>
              <span className="text-[10px] font-semibold text-[#9CA7B5] uppercase tracking-wider block">
                Calculated US EPA AQI
              </span>
              <div className="flex items-baseline gap-2 mt-0.5">
                <span className="text-3xl font-black font-mono" style={{ color: getAQIColor(selectedStation.aqi) }}>
                  {selectedStation.aqi}
                </span>
                <span className="text-xs font-semibold" style={{ color: getAQIColor(selectedStation.aqi) }}>
                  {selectedStation.category}
                </span>
              </div>
              <span className="text-[10px] text-[#9CA7B5] block mt-0.5">
                Based on 40 CFR Part 58 linear interpolation
              </span>
            </div>

            {/* Dominant Sensor Concentration */}
            <div className="text-right">
              <span className="text-[10px] text-[#9CA7B5] uppercase font-mono block">
                {selectedStation.primaryPollutant.toUpperCase()} Concentration
              </span>
              <span className="text-lg font-bold text-[#F2F5F8] font-mono block mt-0.5">
                {selectedStation.measurements[selectedStation.primaryPollutant]?.value ?? '—'}{' '}
                <span className="text-xs text-[#9CA7B5] font-normal">
                  {selectedStation.measurements[selectedStation.primaryPollutant]?.unit ?? 'µg/m³'}
                </span>
              </span>
              <span className="text-[10px] text-[#38D9FF] block">Raw Sensor Reading</span>
            </div>
          </div>

          {/* Available Pollutants Grid */}
          <div className="space-y-1.5">
            <span className="text-[10px] font-semibold text-[#9CA7B5] uppercase tracking-wider block">
              Available Atmospheric Parameters
            </span>
            <div className="grid grid-cols-3 gap-1.5 text-xs">
              {(['pm25', 'pm10', 'no2', 'o3', 'so2', 'co'] as const).map(p => {
                const m = selectedStation.measurements[p];
                const isAvail = m && m.value !== null && m.status !== 'unavailable';
                return (
                  <div
                    key={p}
                    className={`p-2 rounded-lg border flex flex-col justify-between ${
                      isAvail ? 'bg-[#1B1F27] border-[#282F3B]' : 'bg-[#111318]/50 border-[#282F3B]/30 opacity-40'
                    }`}
                  >
                    <span className="text-[10px] font-mono text-[#9CA7B5] uppercase">{p}</span>
                    <span className="font-mono font-bold text-[#F2F5F8] mt-0.5">
                      {isAvail ? m.value : '—'} <span className="text-[9px] font-normal text-[#9CA7B5]">{m?.unit || ''}</span>
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Action Footer */}
          <div className="pt-2 flex items-center justify-between gap-3 text-xs">
            {selectedStation.dataSourceUrl && (
              <a
                href={selectedStation.dataSourceUrl}
                target="_blank"
                rel="noreferrer"
                className="text-[#38D9FF] hover:underline flex items-center gap-1 text-[11px]"
              >
                <span>OpenAQ Node Record</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            )}

            {onNavigateToDashboard && (
              <button
                onClick={() => {
                  onSelectStation(selectedStation.id);
                  onNavigateToDashboard();
                }}
                className="px-3.5 py-1.5 bg-[#38D9FF] hover:bg-[#38D9FF]/90 text-[#111318] text-xs font-semibold rounded-lg flex items-center gap-1 transition-colors cursor-pointer"
              >
                <span>View Full Dashboard</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

        </div>
      )}

      {/* 5. Collapsible Air Quality Scale Legend (Bottom-Right, positioned above OSM attribution) */}
      <div className="absolute bottom-9 right-4 z-20 pointer-events-auto">
        <div className="bg-[#1B1F27]/95 backdrop-blur-md border border-[#282F3B] rounded-2xl shadow-2xl overflow-hidden transition-all">
          <div 
            onClick={() => setIsLegendOpen(!isLegendOpen)}
            className="p-3 flex items-center justify-between gap-4 cursor-pointer hover:bg-[#282F3B]/50 transition-colors"
          >
            <div className="flex items-center gap-2">
              <Layers className="w-3.5 h-3.5 text-[#38D9FF]" />
              <span className="text-xs font-semibold text-[#F2F5F8]">EPA AQI Color Scale</span>
            </div>
            <span className="text-xs text-[#9CA7B5]">{isLegendOpen ? '−' : '+'}</span>
          </div>

          {isLegendOpen && (
            <div className="p-3.5 pt-0 space-y-2 text-xs border-t border-[#282F3B]">
              <div className="flex items-center gap-2.5">
                <span className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: '#38D9FF' }} />
                <span className="text-[#9CA7B5]">0–50:</span>
                <span className="text-[#F2F5F8] font-medium">Good</span>
              </div>
              <div className="flex items-center gap-2.5">
                <span className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: '#55E6C1' }} />
                <span className="text-[#9CA7B5]">51–100:</span>
                <span className="text-[#F2F5F8] font-medium">Moderate</span>
              </div>
              <div className="flex items-center gap-2.5">
                <span className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: '#FFB84D' }} />
                <span className="text-[#9CA7B5]">101–150:</span>
                <span className="text-[#F2F5F8] font-medium">Sensitive Groups</span>
              </div>
              <div className="flex items-center gap-2.5">
                <span className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: '#FF9B54' }} />
                <span className="text-[#9CA7B5]">151–200:</span>
                <span className="text-[#F2F5F8] font-medium">Unhealthy</span>
              </div>
              <div className="flex items-center gap-2.5">
                <span className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: '#FF6B35' }} />
                <span className="text-[#9CA7B5]">201–300:</span>
                <span className="text-[#F2F5F8] font-medium">Very Unhealthy</span>
              </div>
              <div className="flex items-center gap-2.5">
                <span className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: '#FF4757' }} />
                <span className="text-[#9CA7B5]">301+:</span>
                <span className="text-[#F2F5F8] font-medium">Hazardous</span>
              </div>
              <div className="pt-1.5 border-t border-[#282F3B] text-[10px] text-[#9CA7B5]">
                Raw units: µg/m³ (PM) · ppb (NO₂/O₃/SO₂)
              </div>
            </div>
          )}
        </div>
      </div>

    </div>
  );
};
