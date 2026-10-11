import React, { useState } from 'react';
import { 
  ShieldCheck, 
  Cpu, 
  Database, 
  Activity, 
  MapPin, 
  Layers, 
  Bell, 
  ChevronDown, 
  ChevronUp, 
  ExternalLink,
  Flame,
  Wind
} from 'lucide-react';

const HARDWARE_STATION_IMG = '/src/assets/images/sensor_station_hardware_1791723322752.jpg';

const FAQS = [
  {
    q: "How are the AQI calculations derived in BreatheSafe AI?",
    a: "We implement the United States Environmental Protection Agency (US EPA) Air Quality Index formula. AQI is calculated using linear piecewise interpolation across validated pollutant concentration breakpoints (PM2.5, PM10, NO2, O3, CO, SO2). The governing index corresponds to the maximum sub-index across all active sensors at that location."
  },
  {
    q: "Where does the atmospheric data come from?",
    a: "All monitoring stations query reference-grade regulatory sensors and continuous ambient air quality stations aggregated by OpenAQ v3, including CPCB India, UK DEFRA, Airparif France, AirKorea, and US EPA AirNow. We never simulate or fabricate synthetic live sensor readings."
  },
  {
    q: "How does BreatheSafe AI differ from consumer weather apps?",
    a: "Consumer weather apps often blend modeled estimates or unverified low-cost sensors without disclosing sensor errors or raw pollutant micrograms per cubic meter. BreatheSafe AI displays raw physical measurements (PM2.5 in µg/m³, NO2 in ppb), data timestamps, station metadata, and explicit WHO 2021 air quality guideline thresholds."
  },
  {
    q: "How is the AWS architecture structured?",
    a: "The architecture utilizes an AWS API Gateway coupled with an AWS Lambda FastAPI backend. Telemetry is archived to Amazon S3 for cold historical analytics, while Amazon CloudWatch manages metric telemetry and alarm thresholds. Local execution works seamlessly without hardcoded AWS keys."
  }
];

export const FeaturesSection: React.FC<{ onNavigateToDashboard: () => void }> = ({ onNavigateToDashboard }) => {
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(0);

  return (
    <div className="space-y-20 py-12">
      
      {/* 1. Core Platform Capabilities */}
      <section className="max-w-7xl mx-auto px-6">
        <div className="text-left max-w-2xl mb-12">
          <span className="text-xs font-semibold text-[#38D9FF] tracking-wider uppercase">Engineered for Precision</span>
          <h2 className="text-2xl sm:text-3xl font-bold text-[#F2F5F8] mt-1.5">
            Scientific Air Intelligence Platform
          </h2>
          <p className="text-sm text-[#9CA7B5] mt-2 leading-relaxed">
            From particulate matter to photochemical smog, analyze atmospheric health through authenticated, transparent instrumentation.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="p-6 bg-[#1B1F27] border border-[#282F3B] hover:border-[#38D9FF]/40 rounded-xl transition-all space-y-3">
            <div className="w-10 h-10 rounded-lg bg-[#38D9FF]/10 text-[#38D9FF] flex items-center justify-center">
              <Activity className="w-5 h-5" />
            </div>
            <h3 className="text-base font-semibold text-[#F2F5F8]">Multi-Pollutant Spectrum</h3>
            <p className="text-xs text-[#9CA7B5] leading-relaxed">
              Track PM2.5, PM10, NO2, O3, CO, and SO2 simultaneously with clear physical units (µg/m³ and ppb) rather than ambiguous consumer ratings.
            </p>
          </div>

          <div className="p-6 bg-[#1B1F27] border border-[#282F3B] hover:border-[#38D9FF]/40 rounded-xl transition-all space-y-3">
            <div className="w-10 h-10 rounded-lg bg-[#38D9FF]/10 text-[#38D9FF] flex items-center justify-center">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <h3 className="text-base font-semibold text-[#F2F5F8]">WHO 2021 & EPA Guidance</h3>
            <p className="text-xs text-[#9CA7B5] leading-relaxed">
              Actionable exposure advice categorizing safe outdoor activity duration, HEPA air cleaner ventilation thresholds, and certified N95 respirator guidance.
            </p>
          </div>

          <div className="p-6 bg-[#1B1F27] border border-[#282F3B] hover:border-[#38D9FF]/40 rounded-xl transition-all space-y-3">
            <div className="w-10 h-10 rounded-lg bg-[#38D9FF]/10 text-[#38D9FF] flex items-center justify-center">
              <Cpu className="w-5 h-5" />
            </div>
            <h3 className="text-base font-semibold text-[#F2F5F8]">AWS Serverless Pipeline</h3>
            <p className="text-xs text-[#9CA7B5] leading-relaxed">
              Microsecond response times via AWS Lambda and API Gateway, with persistent cold archival in S3 buckets and CloudWatch threshold auditing.
            </p>
          </div>
        </div>
      </section>

      {/* 2. Sensor Hardware & Data Ingestion Flow */}
      <section className="max-w-7xl mx-auto px-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center bg-[#1B1F27]/60 border border-[#282F3B] rounded-2xl p-6 sm:p-10">
          
          <div className="lg:col-span-6 space-y-4 text-left">
            <div className="inline-block text-xs font-semibold text-[#38D9FF]">Ingestion & Quality Control</div>
            <h2 className="text-2xl sm:text-3xl font-bold text-[#F2F5F8]">
              Calibrated Laser Optical Particle Counters
            </h2>
            <p className="text-xs sm:text-sm text-[#9CA7B5] leading-relaxed">
              Government and research installations leverage laser nephelometry and beta attenuation monitors (BAM-1020). BreatheSafe AI applies strict quality flags, filtering out zero-drift, flow rate anomalies, and stale data feeds before calculating the index.
            </p>

            <div className="space-y-2.5 pt-2">
              <div className="flex items-center gap-3 text-xs text-[#F2F5F8]">
                <span className="w-1.5 h-1.5 rounded-full bg-[#38D9FF]" />
                <span>Zero fabrication: strictly authenticated OpenAQ v3 sensor endpoints</span>
              </div>
              <div className="flex items-center gap-3 text-xs text-[#F2F5F8]">
                <span className="w-1.5 h-1.5 rounded-full bg-[#38D9FF]" />
                <span>Automated detection of stale feeds ({'>'}24 hours without transmission)</span>
              </div>
              <div className="flex items-center gap-3 text-xs text-[#F2F5F8]">
                <span className="w-1.5 h-1.5 rounded-full bg-[#38D9FF]" />
                <span>Clear distinction between public health guidelines and medical advice</span>
              </div>
            </div>

            <div className="pt-4">
              <button
                onClick={onNavigateToDashboard}
                className="px-5 py-2.5 bg-[#38D9FF] hover:bg-[#38D9FF]/90 text-[#111318] text-xs font-semibold rounded-lg transition-colors cursor-pointer"
              >
                Inspect Live Monitoring Stations
              </button>
            </div>
          </div>

          <div className="lg:col-span-6">
            <div className="relative rounded-xl overflow-hidden border border-[#282F3B] bg-[#111318] shadow-xl">
              <img
                src={HARDWARE_STATION_IMG}
                alt="Environmental Particle Counter Station"
                className="w-full h-auto object-cover max-h-[380px]"
                referrerPolicy="no-referrer"
              />
              <div className="absolute bottom-3 left-3 bg-[#111318]/90 backdrop-blur-md border border-[#282F3B] px-3 py-1.5 rounded text-[11px] text-[#9CA7B5] flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-[#38D9FF]" />
                <span className="text-[#F2F5F8] font-mono">Reference Station Ingestion Active</span>
              </div>
            </div>
          </div>

        </div>
      </section>

      {/* 3. FAQ Section */}
      <section className="max-w-4xl mx-auto px-6 text-left">
        <div className="text-left mb-8">
          <span className="text-xs font-semibold text-[#38D9FF] uppercase tracking-wider">Methodology & Transparency</span>
          <h2 className="text-2xl font-bold text-[#F2F5F8] mt-1">Frequently Asked Questions</h2>
        </div>

        <div className="space-y-3">
          {FAQS.map((item, idx) => {
            const isOpen = openFaqIndex === idx;
            return (
              <div
                key={idx}
                className="border border-[#282F3B] bg-[#1B1F27] rounded-xl overflow-hidden transition-colors"
              >
                <button
                  onClick={() => setOpenFaqIndex(isOpen ? null : idx)}
                  className="w-full p-4 flex items-center justify-between text-left text-sm font-semibold text-[#F2F5F8] hover:text-[#38D9FF] transition-colors"
                >
                  <span>{item.q}</span>
                  {isOpen ? <ChevronUp className="w-4 h-4 shrink-0 text-[#38D9FF]" /> : <ChevronDown className="w-4 h-4 shrink-0 text-[#9CA7B5]" />}
                </button>
                {isOpen && (
                  <div className="px-4 pb-4 text-xs text-[#9CA7B5] leading-relaxed border-t border-[#282F3B]/50 pt-3">
                    {item.a}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>

      {/* 4. Footer */}
      <footer className="border-t border-[#282F3B] pt-12 pb-16 bg-[#111318]">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-6 text-xs text-[#9CA7B5]">
          <div className="flex items-center gap-2 text-left">
            <span className="font-bold text-[#F2F5F8]">BreatheSafe AI</span>
            <span>·</span>
            <span>Environmental Hacks 2026 Submission</span>
          </div>

          <div className="flex items-center gap-6 text-center">
            <span>Data: OpenAQ v3 Community & Gov APIs</span>
            <span>·</span>
            <span>Cartography: © OpenStreetMap contributors</span>
            <span>·</span>
            <span>Cloud: AWS Serverless Reference Architecture</span>
          </div>

          <div className="text-right">
            <span>Empowering public health through open atmospheric telemetry.</span>
          </div>
        </div>
      </footer>

    </div>
  );
};
