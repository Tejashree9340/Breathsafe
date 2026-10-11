import React from 'react';
import { User, Bell, Wind } from 'lucide-react';
import { UserProfile } from '../types/environmental';

interface NavbarProps {
  currentTab: 'overview' | 'dashboard' | 'map' | 'analytics' | 'guidance' | 'aws' | 'alerts';
  onSelectTab: (tab: 'overview' | 'dashboard' | 'map' | 'analytics' | 'guidance' | 'aws' | 'alerts') => void;
  user: UserProfile | null;
  onOpenAuth: () => void;
  unreadAlertCount?: number;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentTab,
  onSelectTab,
  user,
  onOpenAuth,
  unreadAlertCount = 0
}) => {
  return (
    <header className="sticky top-0 z-50 w-full bg-[#111318]/90 backdrop-blur-md border-b border-[#282F3B]">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-8 px-6 py-3.5">
        
        {/* Zone 1: Single Wordmark */}
        <button
          onClick={() => onSelectTab('overview')}
          className="flex items-center gap-2.5 text-left whitespace-nowrap shrink-0 group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#38D9FF] rounded-md"
        >
          <div className="w-8 h-8 rounded-lg bg-[#1B1F27] border border-[#38D9FF]/30 flex items-center justify-center text-[#38D9FF] group-hover:border-[#38D9FF] transition-colors">
            <Wind className="w-4 h-4" />
          </div>
          <span className="text-lg font-bold tracking-tight text-[#F2F5F8]">
            BreatheSafe <span className="text-[#38D9FF]">AI</span>
          </span>
        </button>

        {/* Zone 2: 4–5 Single-Line Concise Nav Links */}
        <nav className="hidden md:flex items-center gap-7 text-sm font-medium text-[#9CA7B5]">
          <button
            onClick={() => onSelectTab('overview')}
            className={`whitespace-nowrap shrink-0 transition-colors hover:text-[#F2F5F8] ${
              currentTab === 'overview' ? 'text-[#38D9FF] font-semibold' : ''
            }`}
          >
            Overview
          </button>
          <button
            onClick={() => onSelectTab('dashboard')}
            className={`whitespace-nowrap shrink-0 transition-colors hover:text-[#F2F5F8] ${
              currentTab === 'dashboard' ? 'text-[#38D9FF] font-semibold' : ''
            }`}
          >
            Dashboard
          </button>
          <button
            onClick={() => onSelectTab('map')}
            className={`whitespace-nowrap shrink-0 transition-colors hover:text-[#F2F5F8] ${
              currentTab === 'map' ? 'text-[#38D9FF] font-semibold' : ''
            }`}
          >
            Pollution Map
          </button>
          <button
            onClick={() => onSelectTab('analytics')}
            className={`whitespace-nowrap shrink-0 transition-colors hover:text-[#F2F5F8] ${
              currentTab === 'analytics' ? 'text-[#38D9FF] font-semibold' : ''
            }`}
          >
            Analytics
          </button>
          <button
            onClick={() => onSelectTab('guidance')}
            className={`whitespace-nowrap shrink-0 transition-colors hover:text-[#F2F5F8] ${
              currentTab === 'guidance' ? 'text-[#38D9FF] font-semibold' : ''
            }`}
          >
            Exposure Guidance
          </button>
          <button
            onClick={() => onSelectTab('aws')}
            className={`whitespace-nowrap shrink-0 transition-colors hover:text-[#F2F5F8] ${
              currentTab === 'aws' ? 'text-[#38D9FF] font-semibold' : ''
            }`}
          >
            AWS Architecture
          </button>
        </nav>

        {/* Zone 3: 1 Primary Action Area */}
        <div className="flex items-center gap-3 shrink-0">
          <button
            onClick={() => onSelectTab('alerts')}
            className="relative p-2 rounded-lg bg-[#1B1F27] border border-[#282F3B] hover:border-[#38D9FF]/40 text-[#9CA7B5] hover:text-[#F2F5F8] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#38D9FF]"
            title="Alerts and Thresholds"
          >
            <Bell className="w-4 h-4" />
            {unreadAlertCount > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 bg-[#FF9B54] text-[#111318] text-[10px] font-bold rounded-full flex items-center justify-center font-mono">
                {unreadAlertCount}
              </span>
            )}
          </button>

          <button
            onClick={onOpenAuth}
            className="flex items-center gap-2 px-3.5 py-1.5 text-xs font-semibold text-[#111318] bg-[#38D9FF] hover:bg-[#38D9FF]/90 rounded-lg transition-colors whitespace-nowrap shrink-0 shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#38D9FF]"
          >
            <User className="w-3.5 h-3.5" />
            <span>{user ? user.name.split(' ')[0] : 'Sign In'}</span>
          </button>
        </div>
      </div>

      {/* Mobile Submenu Bar */}
      <div className="md:hidden flex items-center justify-around px-4 py-2 border-t border-[#282F3B] bg-[#1B1F27]/60 text-xs overflow-x-auto gap-3">
        <button
          onClick={() => onSelectTab('overview')}
          className={`whitespace-nowrap py-1 ${currentTab === 'overview' ? 'text-[#38D9FF]' : 'text-[#9CA7B5]'}`}
        >
          Overview
        </button>
        <button
          onClick={() => onSelectTab('dashboard')}
          className={`whitespace-nowrap py-1 ${currentTab === 'dashboard' ? 'text-[#38D9FF]' : 'text-[#9CA7B5]'}`}
        >
          Dashboard
        </button>
        <button
          onClick={() => onSelectTab('map')}
          className={`whitespace-nowrap py-1 ${currentTab === 'map' ? 'text-[#38D9FF]' : 'text-[#9CA7B5]'}`}
        >
          Map
        </button>
        <button
          onClick={() => onSelectTab('analytics')}
          className={`whitespace-nowrap py-1 ${currentTab === 'analytics' ? 'text-[#38D9FF]' : 'text-[#9CA7B5]'}`}
        >
          Analytics
        </button>
        <button
          onClick={() => onSelectTab('guidance')}
          className={`whitespace-nowrap py-1 ${currentTab === 'guidance' ? 'text-[#38D9FF]' : 'text-[#9CA7B5]'}`}
        >
          Guidance
        </button>
        <button
          onClick={() => onSelectTab('aws')}
          className={`whitespace-nowrap py-1 ${currentTab === 'aws' ? 'text-[#38D9FF]' : 'text-[#9CA7B5]'}`}
        >
          AWS
        </button>
      </div>
    </header>
  );
};
