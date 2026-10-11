import React from 'react';
import { EarthGlobe3D } from './EarthGlobe3D';
import { PandaMascot } from './PandaMascot';
import { MonitoringStation } from '../types/environmental';
import { ArrowRight, ShieldCheck, Activity, Cpu, Database, ChevronRight, CheckCircle2 } from 'lucide-react';

interface LandingHeroProps {
  stations: MonitoringStation[];
  onExploreDashboard: () => void;
  onExploreMap: () => void;
  onSelectStation: (id: string) => void;
}

export const LandingHero: React.FC<LandingHeroProps> = ({
  stations,
  onExploreDashboard,
  onExploreMap,
  onSelectStation
}) => {
  return (
    <div className="relative overflow-hidden pt-8 pb-16">
      {/* Background radial gradient glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[550px] bg-gradient-to-b from-[#38D9FF]/10 via-transparent to-transparent blur-3xl pointer-events-none" />

      {/* Hero Container */}
      <div className="max-w-7xl mx-auto px-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          
          {/* Left Column: Headlines & CTAs */}
          <div className="lg:col-span-6 space-y-6 text-left">
            <div className="inline-flex items-center gap-2 text-xs font-medium text-[#38D9FF] bg-[#1B1F27] border border-[#38D9FF]/30 px-3 py-1.5 rounded-md">
              <span className="w-2 h-2 rounded-full bg-[#38D9FF]" />
              <span>Environmental Hacks 2026 · Global Atmospheric Intelligence</span>
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-[#F2F5F8] leading-[1.08] text-balance">
              See the air. <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#38D9FF] via-[#74E3FF] to-[#FF9B54]">
                Change your day.
              </span>
            </h1>

            <p className="text-base sm:text-lg text-[#9CA7B5] leading-relaxed max-w-xl">
              Real-time atmospheric intelligence streaming directly from reference-grade monitoring stations worldwide. Understand particulate density, plan outdoor exposure, and protect pulmonary health with verified scientific standards.
            </p>

            {/* CTAs */}
            <div className="flex flex-wrap items-center gap-4 pt-2">
              <button
                onClick={onExploreDashboard}
                className="flex items-center gap-2 px-6 py-3 rounded-lg bg-[#38D9FF] hover:bg-[#38D9FF]/90 text-[#111318] text-sm font-semibold transition-all shadow-lg shadow-[#38D9FF]/15 cursor-pointer"
              >
                <span>Explore Dashboard</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <button
                onClick={onExploreMap}
                className="flex items-center gap-2 px-6 py-3 rounded-lg bg-[#1B1F27] hover:bg-[#282F3B] border border-[#282F3B] hover:border-[#38D9FF]/50 text-[#F2F5F8] text-sm font-medium transition-all cursor-pointer"
              >
                <span>Live Pollution Map</span>
              </button>
            </div>

            {/* Mascot Hero Card */}
            <div className="pt-2">
              <PandaMascot variant="hero" currentStation={stations[0]} />
            </div>

            {/* Micro verification strip */}
            <div className="pt-2 flex flex-wrap items-center gap-6 text-xs text-[#9CA7B5]">
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-[#38D9FF]" />
                <span>OpenAQ v3 API Telemetry</span>
              </div>
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-[#38D9FF]" />
                <span>EPA & WHO 2021 Breakpoints</span>
              </div>
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-[#38D9FF]" />
                <span>AWS Serverless Pipeline</span>
              </div>
            </div>
          </div>

          {/* Right Column: 3D Earth Interactive Viewport */}
          <div className="lg:col-span-6 relative flex flex-col items-center">
            <div className="relative w-full aspect-square max-w-[560px] rounded-2xl bg-[#1B1F27]/40 border border-[#282F3B] p-2 overflow-hidden shadow-2xl">
              
              {/* Interactive Three.js Earth */}
              <EarthGlobe3D
                stations={stations}
                onSelectStation={onSelectStation}
                className="w-full h-full"
              />

              {/* Station Quick Badges */}
              <div className="absolute top-4 right-4 z-20 flex flex-col gap-1.5 pointer-events-auto">
                <div className="text-[10px] text-[#9CA7B5] px-2 py-0.5 rounded bg-[#111318]/80 backdrop-blur-sm border border-[#282F3B]">
                  Live Global Nodes
                </div>
                {stations.slice(0, 3).map(station => (
                  <button
                    key={station.id}
                    onClick={() => onSelectStation(station.id)}
                    className="flex items-center justify-between gap-3 px-2.5 py-1 text-left rounded bg-[#111318]/90 hover:bg-[#1B1F27] border border-[#282F3B] hover:border-[#38D9FF]/40 text-xs transition-colors"
                  >
                    <span className="text-[#F2F5F8] font-medium">{station.city}</span>
                    <span className="font-mono text-[11px] text-[#38D9FF]">AQI {station.aqi}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};
