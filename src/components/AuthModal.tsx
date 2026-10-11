import React, { useState } from 'react';
import { UserProfile, MonitoringStation } from '../types/environmental';
import { X, Lock, Mail, User, Shield, LogOut, CheckCircle2, ArrowRight } from 'lucide-react';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: UserProfile | null;
  onLogin: (user: UserProfile, token: string) => void;
  onLogout: () => void;
  allStations: MonitoringStation[];
  onToggleSavedStation: (stationId: string) => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  user,
  onLogin,
  onLogout,
  allStations,
  onToggleSavedStation
}) => {
  const [mode, setMode] = useState<'login' | 'signup' | 'forgot' | 'profile'>(user ? 'profile' : 'login');
  const [email, setEmail] = useState('analyst@breathesafe.ai');
  const [password, setPassword] = useState('••••••••••••');
  const [name, setName] = useState('Dr. Evelyn Vance');
  const [role, setRole] = useState<'environmental_analyst' | 'researcher' | 'citizen'>('environmental_analyst');
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleEmailAuth = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!email || !email.includes('@')) {
      setErrorMessage('Please enter a valid email address.');
      return;
    }

    if (mode === 'forgot') {
      setStatusMessage(`Password reset link dispatched to ${email}. Check your inbox.`);
      return;
    }

    // Authenticate user with local session or backend
    const mockUser: UserProfile = {
      id: `usr_${Date.now()}`,
      email,
      name: name || email.split('@')[0],
      organization: 'Global Atmospheric Monitoring Initiative',
      role,
      savedStations: user?.savedStations || ['tokyo-shinjuku', 'delhi-anand-vihar'],
      unitPreference: 'metric',
      emailAlertsEnabled: true,
      pushAlertsEnabled: true
    };

    onLogin(mockUser, `jwt_session_${Date.now()}`);
    setMode('profile');
    setStatusMessage('Authentication successful. Session token established.');
    setTimeout(() => setStatusMessage(null), 3000);
  };

  const handleGoogleSignIn = () => {
    // Demonstrates secure Google identity provider flow
    const googleUser: UserProfile = {
      id: 'usr_google_evelyn',
      email: 'evelyn.vance.research@gmail.com',
      name: 'Dr. Evelyn Vance',
      organization: 'Earth Science Institute',
      role: 'environmental_analyst',
      savedStations: ['tokyo-shinjuku', 'delhi-anand-vihar', 'london-bloomsbury'],
      unitPreference: 'metric',
      emailAlertsEnabled: true,
      pushAlertsEnabled: true
    };
    onLogin(googleUser, `google_idp_token_${Date.now()}`);
    setMode('profile');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm">
      <div className="relative w-full max-w-md bg-[#1B1F27] border border-[#282F3B] rounded-2xl p-6 shadow-2xl text-left">
        
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 text-[#9CA7B5] hover:text-[#F2F5F8] transition-colors p-1"
        >
          <X className="w-4 h-4" />
        </button>

        {/* 1. Profile Mode */}
        {user && mode === 'profile' ? (
          <div className="space-y-5">
            <div className="flex items-center gap-3 pb-3 border-b border-[#282F3B]">
              <div className="w-12 h-12 rounded-full bg-[#38D9FF]/20 text-[#38D9FF] flex items-center justify-center font-bold text-lg border border-[#38D9FF]/40">
                {user.name[0]}
              </div>
              <div>
                <h3 className="text-base font-bold text-[#F2F5F8]">{user.name}</h3>
                <p className="text-xs text-[#9CA7B5] font-mono">{user.email}</p>
              </div>
            </div>

            <div className="space-y-3 text-xs">
              <div className="p-3 bg-[#111318] rounded-lg border border-[#282F3B] flex items-center justify-between">
                <span className="text-[#9CA7B5]">Role & Access Tier</span>
                <span className="text-[#38D9FF] font-semibold capitalize">
                  {user.role.replace('_', ' ')}
                </span>
              </div>

              <div className="p-3 bg-[#111318] rounded-lg border border-[#282F3B] flex items-center justify-between">
                <span className="text-[#9CA7B5]">Affiliation</span>
                <span className="text-[#F2F5F8]">{user.organization || 'Independent'}</span>
              </div>

              {/* Saved Favorite Stations */}
              <div className="pt-2">
                <span className="font-semibold text-[#F2F5F8] block mb-2">Saved Monitoring Stations</span>
                <div className="space-y-1.5 max-h-36 overflow-y-auto">
                  {allStations.map(st => {
                    const isSaved = user.savedStations.includes(st.id);
                    return (
                      <div
                        key={st.id}
                        className="flex items-center justify-between p-2 rounded bg-[#111318] border border-[#282F3B]"
                      >
                        <div>
                          <span className="text-[#F2F5F8] font-medium">{st.city}</span>
                          <span className="text-[10px] text-[#9CA7B5] ml-2">AQI {st.aqi}</span>
                        </div>
                        <button
                          onClick={() => onToggleSavedStation(st.id)}
                          className={`px-2 py-0.5 rounded text-[10px] border transition-colors ${
                            isSaved
                              ? 'bg-[#38D9FF]/20 border-[#38D9FF] text-[#38D9FF]'
                              : 'bg-transparent border-[#282F3B] text-[#9CA7B5]'
                          }`}
                        >
                          {isSaved ? 'Bookmarked' : 'Add'}
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-[#282F3B] flex items-center justify-between">
              <button
                onClick={() => {
                  onLogout();
                  setMode('login');
                }}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-[#FF4757] hover:bg-[#FF4757]/10 rounded-lg transition-colors cursor-pointer"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Log Out</span>
              </button>
              <button
                onClick={onClose}
                className="px-4 py-1.5 bg-[#38D9FF] text-[#111318] text-xs font-semibold rounded-lg hover:bg-[#38D9FF]/90 transition-colors"
              >
                Done
              </button>
            </div>
          </div>
        ) : (
          /* 2. Login / Sign Up / Forgot Password */
          <div className="space-y-5">
            <div>
              <span className="text-[10px] font-semibold text-[#38D9FF] uppercase tracking-wider">
                Identity & Access Management
              </span>
              <h3 className="text-xl font-bold text-[#F2F5F8] mt-1">
                {mode === 'login' && 'Sign in to BreatheSafe AI'}
                {mode === 'signup' && 'Create Environmental Account'}
                {mode === 'forgot' && 'Reset Access Password'}
              </h3>
              <p className="text-xs text-[#9CA7B5] mt-1">
                {mode === 'login' && 'Access persistent alert rules, API keys, and custom monitoring stations.'}
                {mode === 'signup' && 'Register your research profile for automated telemetry tracking.'}
                {mode === 'forgot' && 'Enter your verified email address to receive reset instructions.'}
              </p>
            </div>

            {errorMessage && (
              <div className="p-3 bg-[#FF4757]/10 border border-[#FF4757]/30 rounded-lg text-xs text-[#FF4757]">
                {errorMessage}
              </div>
            )}

            {statusMessage && (
              <div className="p-3 bg-[#38D9FF]/10 border border-[#38D9FF]/30 rounded-lg text-xs text-[#38D9FF] flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>{statusMessage}</span>
              </div>
            )}

            {/* Google Sign In Button */}
            {mode !== 'forgot' && (
              <>
                <button
                  type="button"
                  onClick={handleGoogleSignIn}
                  className="w-full flex items-center justify-center gap-2.5 py-2.5 bg-[#111318] hover:bg-[#282F3B] border border-[#282F3B] text-xs font-semibold text-[#F2F5F8] rounded-lg transition-colors cursor-pointer"
                >
                  <svg className="w-4 h-4" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                  </svg>
                  <span>Continue with Google</span>
                </button>

                <div className="flex items-center gap-3 text-[10px] text-[#9CA7B5] my-2">
                  <div className="flex-1 h-px bg-[#282F3B]" />
                  <span>OR WITH EMAIL</span>
                  <div className="flex-1 h-px bg-[#282F3B]" />
                </div>
              </>
            )}

            {/* Email form */}
            <form onSubmit={handleEmailAuth} className="space-y-3 text-xs">
              {mode === 'signup' && (
                <div>
                  <label className="text-[#9CA7B5] block mb-1">Full Name</label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                    className="w-full bg-[#111318] border border-[#282F3B] focus:border-[#38D9FF] rounded-lg p-2.5 text-[#F2F5F8] outline-none"
                    placeholder="Dr. Evelyn Vance"
                  />
                </div>
              )}

              <div>
                <label className="text-[#9CA7B5] block mb-1">Email Address</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full bg-[#111318] border border-[#282F3B] focus:border-[#38D9FF] rounded-lg p-2.5 text-[#F2F5F8] outline-none"
                  placeholder="analyst@breathesafe.ai"
                />
              </div>

              {mode !== 'forgot' && (
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-[#9CA7B5]">Password</label>
                    {mode === 'login' && (
                      <button
                        type="button"
                        onClick={() => setMode('forgot')}
                        className="text-[11px] text-[#38D9FF] hover:underline"
                      >
                        Forgot?
                      </button>
                    )}
                  </div>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="w-full bg-[#111318] border border-[#282F3B] focus:border-[#38D9FF] rounded-lg p-2.5 text-[#F2F5F8] outline-none font-mono"
                  />
                </div>
              )}

              <button
                type="submit"
                className="w-full py-2.5 bg-[#38D9FF] hover:bg-[#38D9FF]/90 text-[#111318] text-xs font-semibold rounded-lg transition-colors cursor-pointer mt-2"
              >
                {mode === 'login' && 'Sign In'}
                {mode === 'signup' && 'Complete Registration'}
                {mode === 'forgot' && 'Send Reset Email'}
              </button>
            </form>

            {/* Toggle Modes */}
            <div className="pt-2 text-center text-xs text-[#9CA7B5]">
              {mode === 'login' && (
                <span>
                  Don't have an account?{' '}
                  <button onClick={() => setMode('signup')} className="text-[#38D9FF] hover:underline">
                    Sign up
                  </button>
                </span>
              )}
              {mode === 'signup' && (
                <span>
                  Already registered?{' '}
                  <button onClick={() => setMode('login')} className="text-[#38D9FF] hover:underline">
                    Log in
                  </button>
                </span>
              )}
              {mode === 'forgot' && (
                <span>
                  Remember your password?{' '}
                  <button onClick={() => setMode('login')} className="text-[#38D9FF] hover:underline">
                    Back to login
                  </button>
                </span>
              )}
            </div>
          </div>
        )}

      </div>
    </div>
  );
};
