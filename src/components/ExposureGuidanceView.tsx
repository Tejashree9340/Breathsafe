import React, { useState } from 'react';
import { EXPOSURE_GUIDELINES } from '../data/mockData';
import { 
  ShieldCheck, 
  AlertTriangle, 
  Wind, 
  Heart, 
  Home, 
  Activity, 
  FileText, 
  Info,
  CheckCircle2,
  ExternalLink
} from 'lucide-react';
import { AQICategory } from '../types/environmental';

export const ExposureGuidanceView: React.FC = () => {
  const [selectedCategory, setSelectedCategory] = useState<AQICategory>('Unhealthy for Sensitive Groups');

  const activeGuide = EXPOSURE_GUIDELINES.find(g => g.category === selectedCategory) || EXPOSURE_GUIDELINES[2];

  return (
    <div className="max-w-7xl mx-auto px-6 py-8 space-y-10 text-left">
      
      {/* 1. Header */}
      <div className="pb-4 border-b border-[#282F3B]">
        <span className="text-xs font-semibold text-[#38D9FF] uppercase tracking-wider">
          Evidence-Based Health Standards
        </span>
        <h1 className="text-2xl sm:text-3xl font-bold text-[#F2F5F8] mt-1">
          Atmospheric Exposure & Public Health Guidance
        </h1>
        <p className="text-sm text-[#9CA7B5] mt-1 max-w-3xl leading-relaxed">
          Ground-level particulate and ozone exposure protocols standardized under the <strong>US EPA Air Quality Index</strong> (40 CFR Part 58) and the <strong>World Health Organization (WHO) 2021 Global Air Quality Guidelines</strong>.
        </p>
      </div>

      {/* 2. Interactive AQI Tier Explorer */}
      <div className="space-y-4">
        <h2 className="text-base font-semibold text-[#F2F5F8]">Explore AQI Risk Categories</h2>

        {/* Tier selector bar */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
          {EXPOSURE_GUIDELINES.map(g => {
            const isSelected = g.category === selectedCategory;
            return (
              <button
                key={g.category}
                onClick={() => setSelectedCategory(g.category)}
                className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-[#1B1F27] border-[#38D9FF] shadow-lg ring-1 ring-[#38D9FF]'
                    : 'bg-[#111318] border-[#282F3B] hover:border-[#38D9FF]/40'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs font-bold" style={{ color: g.color }}>
                    {g.aqiRange[0]}–{g.aqiRange[1]}
                  </span>
                  <span className="w-2 h-2 rounded-full" style={{ backgroundColor: g.color }} />
                </div>
                <div className="text-xs font-medium text-[#F2F5F8] mt-1.5 leading-snug">
                  {g.category}
                </div>
              </button>
            );
          })}
        </div>

        {/* Selected Tier Actionable Directive Card */}
        <div className="p-6 bg-[#1B1F27] border border-[#282F3B] rounded-2xl space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-[#282F3B]">
            <div>
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full" style={{ backgroundColor: activeGuide.color }} />
                <h3 className="text-xl font-bold text-[#F2F5F8]">{activeGuide.category}</h3>
              </div>
              <span className="text-xs text-[#9CA7B5] font-mono mt-0.5 block">
                Index Range: {activeGuide.aqiRange[0]} to {activeGuide.aqiRange[1]} (US EPA Standard)
              </span>
            </div>

            <div className="px-3 py-1.5 rounded-lg bg-[#111318] border border-[#282F3B] text-xs font-mono text-[#38D9FF]">
              Protection Level: {activeGuide.recommendedMask}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs sm:text-sm">
            <div className="space-y-4">
              <div className="p-4 bg-[#111318] rounded-xl border border-[#282F3B] space-y-1.5">
                <div className="flex items-center gap-2 font-semibold text-[#F2F5F8]">
                  <Activity className="w-4 h-4 text-[#38D9FF]" />
                  <span>General Public Advisory</span>
                </div>
                <p className="text-[#9CA7B5] leading-relaxed text-xs">
                  {activeGuide.generalPublic}
                </p>
              </div>

              <div className="p-4 bg-[#111318] rounded-xl border border-[#282F3B] space-y-1.5">
                <div className="flex items-center gap-2 font-semibold text-[#FF9B54]">
                  <Heart className="w-4 h-4 text-[#FF9B54]" />
                  <span>Sensitive Groups Advisory</span>
                </div>
                <p className="text-[#9CA7B5] leading-relaxed text-xs">
                  {activeGuide.sensitiveGroups}
                </p>
              </div>
            </div>

            <div className="space-y-4">
              <div className="p-4 bg-[#111318] rounded-xl border border-[#282F3B] space-y-1.5">
                <div className="flex items-center gap-2 font-semibold text-[#F2F5F8]">
                  <Wind className="w-4 h-4 text-[#38D9FF]" />
                  <span>Outdoor Activity Recommendations</span>
                </div>
                <p className="text-[#9CA7B5] leading-relaxed text-xs">
                  {activeGuide.outdoorActivities}
                </p>
              </div>

              <div className="p-4 bg-[#111318] rounded-xl border border-[#282F3B] space-y-1.5">
                <div className="flex items-center gap-2 font-semibold text-[#F2F5F8]">
                  <Home className="w-4 h-4 text-[#38D9FF]" />
                  <span>Indoor Air Filtration & Sealing</span>
                </div>
                <p className="text-[#9CA7B5] leading-relaxed text-xs">
                  {activeGuide.indoorPrecautions}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 3. Scientific Standards Reference Table */}
      <div className="space-y-4">
        <h2 className="text-base font-semibold text-[#F2F5F8]">
          WHO 2021 Global Air Quality Guidelines Comparison
        </h2>

        <div className="overflow-x-auto bg-[#1B1F27] border border-[#282F3B] rounded-xl">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-[#282F3B] text-[#9CA7B5] font-mono uppercase bg-[#111318]/50">
                <th className="p-3.5">Pollutant</th>
                <th className="p-3.5">Averaging Time</th>
                <th className="p-3.5">WHO 2021 AQG</th>
                <th className="p-3.5">US EPA NAAQS</th>
                <th className="p-3.5">Health Significance</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#282F3B]/50 text-[#F2F5F8]">
              <tr>
                <td className="p-3.5 font-bold">PM2.5</td>
                <td className="p-3.5 font-mono text-[#9CA7B5]">24-Hour Mean</td>
                <td className="p-3.5 font-mono text-[#38D9FF]">15 µg/m³</td>
                <td className="p-3.5 font-mono text-[#FF9B54]">35 µg/m³</td>
                <td className="p-3.5 text-[#9CA7B5]">Alveolar penetration, systemic vascular inflammation.</td>
              </tr>
              <tr>
                <td className="p-3.5 font-bold">PM10</td>
                <td className="p-3.5 font-mono text-[#9CA7B5]">24-Hour Mean</td>
                <td className="p-3.5 font-mono text-[#38D9FF]">45 µg/m³</td>
                <td className="p-3.5 font-mono text-[#FF9B54]">150 µg/m³</td>
                <td className="p-3.5 text-[#9CA7B5]">Upper airway irritation, exacerbates asthma & COPD.</td>
              </tr>
              <tr>
                <td className="p-3.5 font-bold">NO2</td>
                <td className="p-3.5 font-mono text-[#9CA7B5]">24-Hour Mean</td>
                <td className="p-3.5 font-mono text-[#38D9FF]">25 µg/m³ (13 ppb)</td>
                <td className="p-3.5 font-mono text-[#FF9B54]">100 ppb (1-hr)</td>
                <td className="p-3.5 text-[#9CA7B5]">Bronchial hyper-responsiveness from combustion exhaust.</td>
              </tr>
              <tr>
                <td className="p-3.5 font-bold">Ozone (O3)</td>
                <td className="p-3.5 font-mono text-[#9CA7B5]">8-Hour Daily Max</td>
                <td className="p-3.5 font-mono text-[#38D9FF]">100 µg/m³ (51 ppb)</td>
                <td className="p-3.5 font-mono text-[#FF9B54]">70 ppb (8-hr)</td>
                <td className="p-3.5 text-[#9CA7B5]">Potent oxidant inducing airway epithelial damage.</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* 4. Mandatory Public Health vs Medical Advice Boundary */}
      <div className="p-5 bg-[#1B1F27] border border-[#38D9FF]/30 rounded-xl space-y-2">
        <div className="flex items-center gap-2 text-xs font-bold text-[#38D9FF] uppercase">
          <Info className="w-4 h-4" />
          <span>Notice of Scope: Public Health Information Only</span>
        </div>
        <p className="text-xs text-[#9CA7B5] leading-relaxed">
          The exposure guidance provided by BreatheSafe AI is derived directly from epidemiological publications and air quality standards published by the US Environmental Protection Agency and the World Health Organization. It is intended strictly for environmental awareness and exposure mitigation. <strong>This information does not constitute personalized clinical or medical advice.</strong> Individuals with underlying pulmonary, cardiovascular, or metabolic conditions should consult their licensed healthcare practitioner for medical treatment plans.
        </p>
      </div>

    </div>
  );
};
