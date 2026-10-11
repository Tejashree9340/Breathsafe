import React, { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar';
import { LandingHero } from './components/LandingHero';
import { FeaturesSection } from './components/FeaturesSection';
import { DashboardView } from './components/DashboardView';
import { PollutionMapView } from './components/PollutionMapView';
import { AnalyticsView } from './components/AnalyticsView';
import { ExposureGuidanceView } from './components/ExposureGuidanceView';
import { AlertsSettingsView } from './components/AlertsSettingsView';
import { AwsArchitectureView } from './components/AwsArchitectureView';
import { AuthModal } from './components/AuthModal';
import { PandaMascot } from './components/PandaMascot';

import { 
  MonitoringStation, 
  HistoricalReading, 
  UserProfile, 
  AlertRule, 
  AlertNotification 
} from './types/environmental';
import { environmentalApi } from './services/api';
import { INITIAL_NOTIFICATIONS } from './data/mockData';
import { AlertTriangle, RefreshCw } from 'lucide-react';

export default function App() {
  const [currentTab, setCurrentTab] = useState<'overview' | 'dashboard' | 'map' | 'analytics' | 'guidance' | 'aws' | 'alerts'>('overview');
  const [stations, setStations] = useState<MonitoringStation[]>([]);
  const [selectedStationId, setSelectedStationId] = useState<string>('tokyo-shinjuku');
  const [historicalReadings, setHistoricalReadings] = useState<HistoricalReading[]>([]);
  const [user, setUser] = useState<UserProfile | null>(null);
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [alertRules, setAlertRules] = useState<AlertRule[]>([]);
  const [notifications, setNotifications] = useState<AlertNotification[]>(INITIAL_NOTIFICATIONS);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [initError, setInitError] = useState<string | null>(null);

  // Initial data loading
  const initData = async () => {
    setIsLoading(true);
    setInitError(null);
    try {
      const locs = await environmentalApi.getLocations();
      setStations(locs);
      if (locs.length > 0) {
        setSelectedStationId(locs[0].id);
        const history = await environmentalApi.getLocationHistory(locs[0].id);
        setHistoricalReadings(history);
      }
      const rules = await environmentalApi.getAlerts();
      setAlertRules(rules);
      const profile = await environmentalApi.getProfile();
      setUser(profile);
    } catch (err: any) {
      console.error('Initialization error:', err);
      setInitError(err.message || 'Failed to establish connection to OpenAQ telemetry pipeline.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    initData();
  }, []);

  // Update history when selected station changes
  useEffect(() => {
    async function loadHistory() {
      if (!selectedStationId) return;
      const history = await environmentalApi.getLocationHistory(selectedStationId);
      setHistoricalReadings(history);
    }
    loadHistory();
  }, [selectedStationId]);

  const handleSelectStation = (id: string) => {
    setSelectedStationId(id);
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      const locs = await environmentalApi.getLocations();
      setStations(locs);
      if (selectedStationId) {
        const history = await environmentalApi.getLocationHistory(selectedStationId);
        setHistoricalReadings(history);
      }
    } finally {
      setTimeout(() => setIsRefreshing(false), 500);
    }
  };

  const handleCreateRule = async (rule: Omit<AlertRule, 'id'>) => {
    const created = await environmentalApi.createAlert(rule);
    setAlertRules(prev => [...prev, created]);
  };

  const handleDeleteRule = async (id: string) => {
    await environmentalApi.deleteAlert(id);
    setAlertRules(prev => prev.filter(r => r.id !== id));
  };

  const handleUpdateProfile = async (updates: Partial<UserProfile>) => {
    if (!user) return;
    const updated = await environmentalApi.updateProfile(updates);
    setUser(updated);
  };

  const handleToggleSavedStation = async (stationId: string) => {
    if (!user) return;
    const exists = user.savedStations.includes(stationId);
    const newSaved = exists
      ? user.savedStations.filter(id => id !== stationId)
      : [...user.savedStations, stationId];
    handleUpdateProfile({ savedStations: newSaved });
  };

  const handleMarkNotificationRead = (id: string) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
  };

  const handleTriggerTestNotification = () => {
    const current = stations.find(s => s.id === selectedStationId) || stations[0];
    const newNotif: AlertNotification = {
      id: `notif-${Date.now()}`,
      ruleId: 'manual-test',
      stationName: `${current.city} Continuous Station`,
      message: `Simulated threshold alert: PM2.5 reached ${current.measurements.pm25?.value ?? 65} µg/m³ (WHO benchmark is 15 µg/m³).`,
      severity: (current.aqi > 100) ? 'critical' : 'warning',
      timestamp: new Date().toISOString(),
      read: false,
      valueRecorded: current.measurements.pm25?.value ?? 65,
      threshold: 50.0,
      unit: 'µg/m³'
    };
    setNotifications(prev => [newNotif, ...prev]);
  };

  const selectedStation = stations.find(s => s.id === selectedStationId) || stations[0];
  const unreadAlerts = notifications.filter(n => !n.read).length;

  return (
    <div className="min-h-screen bg-[#111318] text-[#F2F5F8] flex flex-col font-sans selection:bg-[#38D9FF]/20 selection:text-[#38D9FF]">
      
      {/* Universal Top Bar */}
      <Navbar
        currentTab={currentTab}
        onSelectTab={setCurrentTab}
        user={user}
        onOpenAuth={() => setIsAuthOpen(true)}
        unreadAlertCount={unreadAlerts}
      />

      {/* Main View Area */}
      <main className="flex-1">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center min-h-[500px] space-y-4">
            <div className="w-10 h-10 border-2 border-[#38D9FF]/30 border-t-[#38D9FF] rounded-full animate-spin" />
            <div className="text-xs text-[#9CA7B5] font-mono">Initializing OpenAQ v3 Telemetry Stream...</div>
          </div>
        ) : initError ? (
          <div className="flex flex-col items-center justify-center min-h-[500px] p-6 space-y-4 text-center">
            <div className="w-12 h-12 rounded-full bg-[#FF4757]/10 text-[#FF4757] flex items-center justify-center">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <div className="text-base font-semibold text-[#F2F5F8]">Telemetry Ingestion Error</div>
            <p className="text-xs text-[#9CA7B5] max-w-md">{initError}</p>
            <button
              onClick={initData}
              className="flex items-center gap-2 px-4 py-2 bg-[#38D9FF] text-[#111318] text-xs font-semibold rounded-lg hover:bg-[#38D9FF]/90 transition-colors cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Retry Connection</span>
            </button>
          </div>
        ) : (
          <>
            {currentTab === 'overview' && (
              <>
                <LandingHero
                  stations={stations}
                  onExploreDashboard={() => setCurrentTab('dashboard')}
                  onExploreMap={() => setCurrentTab('map')}
                  onSelectStation={(id) => {
                    setSelectedStationId(id);
                    setCurrentTab('dashboard');
                  }}
                />
                <FeaturesSection onNavigateToDashboard={() => setCurrentTab('dashboard')} />
              </>
            )}

            {currentTab === 'dashboard' && selectedStation && (
              <DashboardView
                stations={stations}
                selectedStation={selectedStation}
                onSelectStation={handleSelectStation}
                historicalReadings={historicalReadings}
                onOpenMap={() => setCurrentTab('map')}
                onOpenGuidance={() => setCurrentTab('guidance')}
                onOpenAlerts={() => setCurrentTab('alerts')}
                notifications={notifications}
                isRefreshing={isRefreshing}
                onRefresh={handleRefresh}
              />
            )}

            {currentTab === 'map' && (
              <PollutionMapView
                stations={stations}
                selectedStationId={selectedStationId}
                onSelectStation={(id) => {
                  setSelectedStationId(id);
                }}
                onNavigateToDashboard={() => setCurrentTab('dashboard')}
              />
            )}

            {currentTab === 'analytics' && selectedStation && (
              <AnalyticsView
                stations={stations}
                selectedStation={selectedStation}
                historicalReadings={historicalReadings}
                onSelectStation={handleSelectStation}
              />
            )}

            {currentTab === 'guidance' && (
              <ExposureGuidanceView />
            )}

            {currentTab === 'alerts' && user && (
              <AlertsSettingsView
                stations={stations}
                alertRules={alertRules}
                notifications={notifications}
                user={user}
                onCreateRule={handleCreateRule}
                onDeleteRule={handleDeleteRule}
                onUpdateProfile={handleUpdateProfile}
                onMarkNotificationRead={handleMarkNotificationRead}
                onTriggerTestNotification={handleTriggerTestNotification}
              />
            )}

            {currentTab === 'aws' && (
              <AwsArchitectureView />
            )}
          </>
        )}
      </main>

      {/* Floating 3D Panda Mascot Assistant (active on dashboard/map/analytics/alerts views) */}
      {currentTab !== 'overview' && (
        <PandaMascot
          currentStation={selectedStation}
          variant="floating"
          onInspectStation={() => setCurrentTab('dashboard')}
        />
      )}

      {/* Auth & Profile Modal */}
      <AuthModal
        isOpen={isAuthOpen}
        onClose={() => setIsAuthOpen(false)}
        user={user}
        onLogin={(authedUser, token) => {
          setUser(authedUser);
          environmentalApi.setAuthToken(token);
        }}
        onLogout={() => {
          setUser(null);
          environmentalApi.setAuthToken(null);
        }}
        allStations={stations}
        onToggleSavedStation={handleToggleSavedStation}
      />

    </div>
  );
}
