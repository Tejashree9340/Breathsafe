import React, { useState } from 'react';
import { 
  AlertRule, 
  AlertNotification, 
  MonitoringStation, 
  UserProfile 
} from '../types/environmental';
import { 
  Bell, 
  Plus, 
  Trash2, 
  AlertTriangle, 
  Check, 
  Sliders, 
  Save, 
  Shield, 
  MapPin, 
  Mail, 
  Smartphone, 
  Info,
  Play
} from 'lucide-react';

interface AlertsSettingsViewProps {
  stations: MonitoringStation[];
  alertRules: AlertRule[];
  notifications: AlertNotification[];
  user: UserProfile;
  onCreateRule: (rule: Omit<AlertRule, 'id'>) => void;
  onDeleteRule: (id: string) => void;
  onUpdateProfile: (updates: Partial<UserProfile>) => void;
  onMarkNotificationRead: (id: string) => void;
  onTriggerTestNotification?: () => void;
}

export const AlertsSettingsView: React.FC<AlertsSettingsViewProps> = ({
  stations,
  alertRules,
  notifications,
  user,
  onCreateRule,
  onDeleteRule,
  onUpdateProfile,
  onMarkNotificationRead,
  onTriggerTestNotification
}) => {
  // New rule state
  const [stationId, setStationId] = useState(stations[0]?.id || '');
  const [parameter, setParameter] = useState<'aqi' | 'pm25' | 'pm10'>('pm25');
  const [threshold, setThreshold] = useState<number>(55);
  const [notifyInApp, setNotifyInApp] = useState(true);
  const [notifyEmail, setNotifyEmail] = useState(true);
  const [notifyPush, setNotifyPush] = useState(false);
  const [isSuccessMessage, setIsSuccessMessage] = useState<string | null>(null);

  // Profile preferences state
  const [unitPref, setUnitPref] = useState<'metric' | 'imperial'>(user.unitPreference || 'metric');
  const [emailAlerts, setEmailAlerts] = useState(user.emailAlertsEnabled);
  const [pushAlerts, setPushAlerts] = useState(user.pushAlertsEnabled);

  const handleCreateNewRule = (e: React.FormEvent) => {
    e.preventDefault();
    const st = stations.find(s => s.id === stationId) || stations[0];
    onCreateRule({
      parameter,
      threshold,
      operator: 'greater_than',
      stationId: st.id,
      stationName: `${st.city} (${st.name})`,
      enabled: true,
      notifyInApp,
      notifyEmail,
      notifyPush
    });
    setIsSuccessMessage(`Alert threshold for ${st.city} registered successfully.`);
    setTimeout(() => setIsSuccessMessage(null), 3000);
  };

  const handleSavePreferences = () => {
    onUpdateProfile({
      unitPreference: unitPref,
      emailAlertsEnabled: emailAlerts,
      pushAlertsEnabled: pushAlerts
    });
    setIsSuccessMessage('Preferences updated.');
    setTimeout(() => setIsSuccessMessage(null), 3000);
  };

  return (
    <div className="max-w-7xl mx-auto px-6 py-8 space-y-8 text-left">
      
      {/* Header */}
      <div className="pb-4 border-b border-[#282F3B] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <span className="text-xs font-semibold text-[#38D9FF] uppercase tracking-wider">
            Auditable Event Triggers
          </span>
          <h1 className="text-2xl sm:text-3xl font-bold text-[#F2F5F8] mt-1">
            Alert Rules & Configuration
          </h1>
          <p className="text-xs text-[#9CA7B5] mt-1">
            Configure physical pollutant limits, monitor threshold triggers, and adjust telemetry preferences.
          </p>
        </div>

        {onTriggerTestNotification && (
          <button
            onClick={onTriggerTestNotification}
            className="flex items-center gap-2 px-3 py-1.5 bg-[#1B1F27] hover:bg-[#282F3B] border border-[#38D9FF]/40 text-[#38D9FF] text-xs font-medium rounded-lg transition-colors cursor-pointer"
          >
            <Play className="w-3.5 h-3.5" />
            <span>Simulate Alarm Event</span>
          </button>
        )}
      </div>

      {isSuccessMessage && (
        <div className="p-3 bg-[#38D9FF]/10 border border-[#38D9FF]/40 rounded-lg text-xs text-[#38D9FF] flex items-center gap-2">
          <Check className="w-4 h-4" />
          <span>{isSuccessMessage}</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left Column: Form & Active Rules */}
        <div className="lg:col-span-7 space-y-6">
          
          {/* Create Alert Form */}
          <div className="p-6 bg-[#1B1F27] border border-[#282F3B] rounded-xl space-y-4">
            <div className="flex items-center gap-2">
              <Plus className="w-4 h-4 text-[#38D9FF]" />
              <h2 className="text-base font-semibold text-[#F2F5F8]">Create New Threshold Alert</h2>
            </div>

            <form onSubmit={handleCreateNewRule} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-[#9CA7B5] block mb-1">Target Monitoring Station</label>
                  <select
                    value={stationId}
                    onChange={(e) => setStationId(e.target.value)}
                    className="w-full bg-[#111318] border border-[#282F3B] text-[#F2F5F8] rounded-lg p-2.5 outline-none focus:border-[#38D9FF]"
                  >
                    {stations.map(st => (
                      <option key={st.id} value={st.id}>
                        {st.city} — {st.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-[#9CA7B5] block mb-1">Pollutant Parameter</label>
                  <select
                    value={parameter}
                    onChange={(e) => setParameter(e.target.value as any)}
                    className="w-full bg-[#111318] border border-[#282F3B] text-[#F2F5F8] rounded-lg p-2.5 outline-none focus:border-[#38D9FF]"
                  >
                    <option value="pm25">PM2.5 Fine Particles (µg/m³)</option>
                    <option value="pm10">PM10 Coarse Dust (µg/m³)</option>
                    <option value="aqi">US EPA Air Quality Index</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-[#9CA7B5] block mb-1">
                  Threshold Trigger Level ({parameter === 'aqi' ? 'Index' : 'µg/m³'})
                </label>
                <div className="flex items-center gap-3">
                  <input
                    type="number"
                    min="1"
                    max="500"
                    value={threshold}
                    onChange={(e) => setThreshold(Number(e.target.value))}
                    className="w-32 bg-[#111318] border border-[#282F3B] text-[#F2F5F8] rounded-lg p-2.5 font-mono text-sm outline-none focus:border-[#38D9FF]"
                  />
                  <span className="text-[#9CA7B5]">
                    Trigger when reading exceeds this value.
                  </span>
                </div>
              </div>

              {/* Notification Channels */}
              <div className="pt-2 border-t border-[#282F3B] space-y-2">
                <span className="text-[#9CA7B5] block font-medium">Dispatch Channels</span>
                <div className="flex flex-wrap items-center gap-4">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={notifyInApp}
                      onChange={(e) => setNotifyInApp(e.target.checked)}
                      className="accent-[#38D9FF]"
                    />
                    <span className="text-[#F2F5F8]">In-App Notification Bar</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={notifyEmail}
                      onChange={(e) => setNotifyEmail(e.target.checked)}
                      className="accent-[#38D9FF]"
                    />
                    <span className="text-[#F2F5F8]">Email Digest ({user.email})</span>
                  </label>
                </div>
              </div>

              <button
                type="submit"
                className="px-4 py-2 bg-[#38D9FF] hover:bg-[#38D9FF]/90 text-[#111318] font-semibold rounded-lg transition-colors cursor-pointer"
              >
                Register Threshold Rule
              </button>
            </form>
          </div>

          {/* Active Alert Rules List */}
          <div className="p-6 bg-[#1B1F27] border border-[#282F3B] rounded-xl space-y-4">
            <h2 className="text-base font-semibold text-[#F2F5F8]">Active Threshold Rules ({alertRules.length})</h2>

            <div className="space-y-2">
              {alertRules.length === 0 ? (
                <div className="p-4 text-xs text-[#9CA7B5] text-center bg-[#111318] rounded-lg">
                  No active alert rules configured.
                </div>
              ) : (
                alertRules.map(rule => (
                  <div
                    key={rule.id}
                    className="p-3.5 bg-[#111318] border border-[#282F3B] rounded-lg flex items-center justify-between text-xs"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-[#F2F5F8]">{rule.stationName}</span>
                        <span className="px-1.5 py-0.5 rounded bg-[#38D9FF]/10 text-[#38D9FF] font-mono uppercase text-[10px]">
                          {rule.parameter} &gt; {rule.threshold}
                        </span>
                      </div>
                      <div className="text-[11px] text-[#9CA7B5] mt-1 flex items-center gap-3">
                        <span>Channels: In-app {rule.notifyEmail ? '· Email' : ''}</span>
                        {rule.lastTriggered && (
                          <span>Last fired: {new Date(rule.lastTriggered).toLocaleTimeString()}</span>
                        )}
                      </div>
                    </div>

                    <button
                      onClick={() => onDeleteRule(rule.id)}
                      className="p-1.5 text-[#9CA7B5] hover:text-[#FF4757] transition-colors cursor-pointer"
                      title="Delete Rule"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Right Column: Alert History & Preferences */}
        <div className="lg:col-span-5 space-y-6">
          
          {/* Recent Trigger History */}
          <div className="p-6 bg-[#1B1F27] border border-[#282F3B] rounded-xl space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-semibold text-[#F2F5F8]">Triggered Alerts Log</h2>
              <span className="text-[11px] text-[#9CA7B5] font-mono">{notifications.length} events</span>
            </div>

            <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
              {notifications.map(notif => (
                <div
                  key={notif.id}
                  onClick={() => onMarkNotificationRead(notif.id)}
                  className={`p-3 rounded-lg border text-xs cursor-pointer transition-colors ${
                    notif.read
                      ? 'bg-[#111318]/50 border-[#282F3B] opacity-75'
                      : 'bg-[#111318] border-[#FF9B54]/40 shadow-sm'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-[#F2F5F8]">{notif.stationName}</span>
                    <span className="text-[10px] text-[#9CA7B5] font-mono">
                      {new Date(notif.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  <p className="text-[11px] text-[#9CA7B5] mt-1">{notif.message}</p>
                </div>
              ))}
            </div>

            <div className="p-3 bg-[#111318] rounded-lg text-[10px] text-[#9CA7B5] flex items-center gap-2">
              <Info className="w-3.5 h-3.5 text-[#38D9FF] shrink-0" />
              <span>
                Notification delivery status: In-app delivery active. Browser Web Push workers registered. Production email delivery utilizes Amazon SES with verified sender domains.
              </span>
            </div>
          </div>

          {/* Preferences & Units */}
          <div className="p-6 bg-[#1B1F27] border border-[#282F3B] rounded-xl space-y-4 text-xs">
            <h2 className="text-base font-semibold text-[#F2F5F8]">Telemetry Preferences</h2>

            <div className="space-y-3">
              <div>
                <label className="text-[#9CA7B5] block mb-1">Measurement Unit System</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setUnitPref('metric')}
                    className={`py-2 px-3 rounded-lg border transition-colors cursor-pointer ${
                      unitPref === 'metric'
                        ? 'bg-[#38D9FF]/20 border-[#38D9FF] text-[#38D9FF] font-semibold'
                        : 'bg-[#111318] border-[#282F3B] text-[#9CA7B5]'
                    }`}
                  >
                    Metric (µg/m³, km)
                  </button>
                  <button
                    type="button"
                    onClick={() => setUnitPref('imperial')}
                    className={`py-2 px-3 rounded-lg border transition-colors cursor-pointer ${
                      unitPref === 'imperial'
                        ? 'bg-[#38D9FF]/20 border-[#38D9FF] text-[#38D9FF] font-semibold'
                        : 'bg-[#111318] border-[#282F3B] text-[#9CA7B5]'
                    }`}
                  >
                    Imperial (ppm, mi)
                  </button>
                </div>
              </div>

              <div className="pt-2 border-t border-[#282F3B] space-y-2">
                <span className="text-[#9CA7B5] block">Notification Dispatch</span>
                <label className="flex items-center justify-between p-2 rounded bg-[#111318] border border-[#282F3B] cursor-pointer">
                  <span className="text-[#F2F5F8]">Email Broadcasts</span>
                  <input
                    type="checkbox"
                    checked={emailAlerts}
                    onChange={(e) => setEmailAlerts(e.target.checked)}
                    className="accent-[#38D9FF]"
                  />
                </label>
                <label className="flex items-center justify-between p-2 rounded bg-[#111318] border border-[#282F3B] cursor-pointer">
                  <span className="text-[#F2F5F8]">System Push Alerts</span>
                  <input
                    type="checkbox"
                    checked={pushAlerts}
                    onChange={(e) => setPushAlerts(e.target.checked)}
                    className="accent-[#38D9FF]"
                  />
                </label>
              </div>

              <button
                onClick={handleSavePreferences}
                className="w-full py-2 bg-[#282F3B] hover:bg-[#38D9FF] hover:text-[#111318] text-[#F2F5F8] font-semibold rounded-lg transition-colors cursor-pointer flex items-center justify-center gap-2"
              >
                <Save className="w-4 h-4" />
                <span>Save Telemetry Settings</span>
              </button>
            </div>
          </div>

        </div>

      </div>

    </div>
  );
};
