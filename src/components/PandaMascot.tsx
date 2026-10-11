import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { MessageSquare, X, Volume2, VolumeX, Sparkles, AlertTriangle, ShieldCheck, Clock, ExternalLink, Activity } from 'lucide-react';
import { MonitoringStation } from '../types/environmental';

// Generated high-fidelity asset paths
const MASCOT_EXPLORER_IMG = '/src/assets/images/mascot_breathe_panda_1791723287413.jpg';
const MASCOT_ALERT_IMG = '/src/assets/images/mascot_panda_alert_1791723311983.jpg';

interface PandaMascotProps {
  currentStation?: MonitoringStation | null;
  className?: string;
  variant?: 'floating' | 'embedded' | 'hero';
  onInspectStation?: () => void;
}

const EDUCATIONAL_TIPS = [
  "PM2.5 particles are smaller than 2.5 microns—about 30 times thinner than human hair—allowing them to penetrate into pulmonary alveoli and enter the bloodstream.",
  "Ground-level ozone (O3) forms via photochemical reactions between NOx and volatile organic compounds (VOCs) under sunlight, typically peaking mid-afternoon.",
  "All telemetry in BreatheSafe AI references regulatory reference-grade monitors (BAM-1020, TEOM) verified through the OpenAQ v3 data standard.",
  "Looking for cloud topology? Inspect the AWS Architecture tab to review our Lambda FastAPI, S3 cold storage archives, and DynamoDB schema.",
  "Certified N95 and KN95 respirators capture ≥95% of airborne particulates down to 0.3 microns when securely sealed against the facial contour.",
  "WHO 2021 air quality guidelines revised the 24-hour PM2.5 threshold down to 15 µg/m³, reflecting updated epidemiological evidence on vascular mortality."
];

export const PandaMascot: React.FC<PandaMascotProps> = ({
  currentStation,
  className = '',
  variant = 'floating',
  onInspectStation
}) => {
  const [isOpen, setIsOpen] = useState(true);
  const [tipIndex, setTipIndex] = useState(0);
  const [isMinimized, setIsMinimized] = useState(false);
  const [speechText, setSpeechText] = useState<string>('');
  const [audioFeedback, setAudioFeedback] = useState(false);

  // Determine emotional state and speech based on real API response
  const isHighPollution = currentStation ? currentStation.aqi > 100 : false;
  const isStale = currentStation ? Boolean(currentStation.isStale) : false;

  useEffect(() => {
    if (!currentStation) {
      setSpeechText("Hello! I'm Aero, your atmospheric explorer. Select any monitoring station on Earth to inspect live sensor readings.");
      return;
    }

    // Generate contextual message driven by actual measurements
    const pm25Val = currentStation.measurements.pm25?.value;
    const pm10Val = currentStation.measurements.pm10?.value;
    const o3Val = currentStation.measurements.o3?.value;
    const no2Val = currentStation.measurements.no2?.value;
    const hasMissingSensors = Object.values(currentStation.measurements).some(m => m.status === 'unavailable');

    if (currentStation.isStale) {
      setSpeechText(
        `Sensor notice: Telemetry from ${currentStation.name} has not transmitted in ${currentStation.staleMinutes || '>120'} minutes. Readings are flagged as stale; exercise caution if planning high-exposure transit.`
      );
    } else if (currentStation.aqi > 200) {
      setSpeechText(
        `Critical Alert in ${currentStation.city}! AQI is ${currentStation.aqi} (${currentStation.category}). Fine particulates (PM2.5) are at ${pm25Val ?? 'elevated'} µg/m³, exceeding the WHO 24h standard (${15} µg/m³) by ${(Number(pm25Val || 150) / 15).toFixed(1)}x. Cease outdoor exercise and seal interior airflow.`
      );
    } else if (currentStation.aqi > 100) {
      setSpeechText(
        `Caution in ${currentStation.city}: ${currentStation.category} (AQI ${currentStation.aqi}). Dominant pollutant: ${currentStation.primaryPollutant.toUpperCase()} at ${pm25Val ?? pm10Val} µg/m³. Sensitive groups (asthma, cardiac, elderly) should restrict prolonged outdoor exposure.`
      );
    } else if (currentStation.aqi > 50) {
      setSpeechText(
        `Air quality in ${currentStation.city} is Moderate (AQI ${currentStation.aqi}). PM2.5 is ${pm25Val ?? 'N/A'} µg/m³ and O3 is ${o3Val ?? 'N/A'} ppb. Conditions are acceptable for most individuals; sensitive persons should watch for respiratory symptoms.`
      );
    } else {
      setSpeechText(
        `Clean atmospheric reading in ${currentStation.city} (AQI ${currentStation.aqi}, PM2.5: ${pm25Val ?? 5} µg/m³). Clean baseline confirmed by ${currentStation.sourceType} sensors. Ideal for outdoor training and ventilation!`
      );
    }
  }, [currentStation]);

  const cycleNextTip = () => {
    const nextIdx = (tipIndex + 1) % EDUCATIONAL_TIPS.length;
    setTipIndex(nextIdx);
    setSpeechText(EDUCATIONAL_TIPS[nextIdx]);
  };

  const currentImage = isHighPollution ? MASCOT_ALERT_IMG : MASCOT_EXPLORER_IMG;

  if (variant === 'hero') {
    return (
      <div className={`flex flex-col sm:flex-row items-center gap-5 p-4 bg-[#1B1F27]/90 backdrop-blur-md border border-[#282F3B] rounded-xl max-w-lg ${className}`}>
        {/* Animated Avatar */}
        <motion.div 
          animate={{ y: [0, -4, 0] }}
          transition={{ duration: 3.5, repeat: Infinity, ease: 'easeInOut' }}
          className="relative shrink-0 w-24 h-24 sm:w-28 sm:h-28 rounded-xl overflow-hidden border border-[#38D9FF]/30 bg-[#111318]"
        >
          <img
            src={currentImage}
            alt="Aero the Environmental Explorer Panda"
            className="w-full h-full object-cover"
            referrerPolicy="no-referrer"
          />
          <div className="absolute bottom-1 right-1 px-1.5 py-0.5 rounded bg-[#111318]/90 border border-[#38D9FF]/40 text-[9px] font-mono text-[#38D9FF]">
            AERO v2.6
          </div>
        </motion.div>
        
        <div className="flex-1 text-left">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-[#F2F5F8]">Aero · Atmospheric Guide</span>
            <span className="text-[10px] text-[#38D9FF] bg-[#38D9FF]/10 px-2 py-0.5 rounded border border-[#38D9FF]/20">Active</span>
            {isStale && (
              <span className="text-[10px] text-[#FF9B54] bg-[#FF9B54]/10 px-1.5 py-0.5 rounded border border-[#FF9B54]/30">Stale Feed</span>
            )}
          </div>
          <p className="text-xs text-[#9CA7B5] mt-1.5 leading-relaxed">
            {speechText}
          </p>
          <div className="mt-2.5 flex items-center gap-3">
            <button
              onClick={cycleNextTip}
              className="text-[11px] text-[#38D9FF] hover:text-[#38D9FF]/80 flex items-center gap-1 font-medium transition-colors cursor-pointer"
            >
              <Sparkles className="w-3 h-3" />
              <span>Next Atmospheric Fact</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (variant === 'embedded') {
    return (
      <div className={`p-4 bg-[#1B1F27] border border-[#282F3B] rounded-xl flex items-start gap-3 ${className}`}>
        <motion.div 
          animate={{ y: [0, -3, 0] }}
          transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
          className="relative w-12 h-12 rounded-lg overflow-hidden shrink-0 border border-[#38D9FF]/20 bg-[#111318]"
        >
          <img
            src={currentImage}
            alt="Aero Panda"
            className="w-full h-full object-cover"
            referrerPolicy="no-referrer"
          />
        </motion.div>
        <div className="flex-1 text-left">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-[#F2F5F8]">Aero Telemetry Assessment</span>
            {isHighPollution ? (
              <span className="text-[10px] text-[#FF9B54] flex items-center gap-1">
                <AlertTriangle className="w-3 h-3" /> Precaution Active
              </span>
            ) : (
              <span className="text-[10px] text-[#38D9FF] flex items-center gap-1">
                <ShieldCheck className="w-3 h-3" /> Nominal Conditions
              </span>
            )}
          </div>
          <p className="text-xs text-[#9CA7B5] mt-1 leading-relaxed">{speechText}</p>
        </div>
      </div>
    );
  }

  // Floating variant with idle breathing animation
  return (
    <div className={`fixed bottom-6 right-6 z-40 select-none ${className}`}>
      <AnimatePresence>
        {!isMinimized && isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 15, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 15, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="mb-3 w-84 bg-[#1B1F27]/95 backdrop-blur-md border border-[#282F3B] rounded-xl p-4 shadow-2xl relative text-left"
          >
            {/* Header / Dismiss */}
            <div className="flex items-center justify-between pb-2 border-b border-[#282F3B] mb-2">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-[#38D9FF]" />
                <span className="text-xs font-semibold text-[#F2F5F8]">Aero the Explorer</span>
                <span className="text-[10px] text-[#9CA7B5]">· Field Mascot</span>
              </div>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setIsMinimized(true)}
                  className="text-[#9CA7B5] hover:text-[#F2F5F8] transition-colors p-1"
                  title="Minimize mascot"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Contextual speech text */}
            <p className="text-xs text-[#F2F5F8] leading-relaxed">
              {speechText}
            </p>

            {/* Quick Actions */}
            <div className="flex items-center justify-between mt-3 pt-2 border-t border-[#282F3B] text-[11px]">
              <button
                onClick={cycleNextTip}
                className="text-[#38D9FF] hover:underline flex items-center gap-1 cursor-pointer"
              >
                <Sparkles className="w-3 h-3" />
                <span>Environmental Tip</span>
              </button>
              {currentStation && (
                <span className="text-[#9CA7B5] font-mono text-[10px]">
                  {currentStation.city} (AQI {currentStation.aqi})
                </span>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Floating Mascot Button with subtle idle floating animation */}
      <motion.button
        animate={{ y: [0, -5, 0] }}
        transition={{ duration: 3.8, repeat: Infinity, ease: 'easeInOut' }}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.96 }}
        onClick={() => {
          if (isMinimized) setIsMinimized(false);
          else setIsOpen(!isOpen);
        }}
        className="group relative flex items-center gap-2.5 p-1.5 pr-4 bg-[#1B1F27] hover:bg-[#282F3B] border border-[#38D9FF]/40 hover:border-[#38D9FF] rounded-full shadow-2xl transition-all cursor-pointer"
        title="Chat with Aero the Environmental Explorer"
      >
        <div className="w-10 h-10 rounded-full overflow-hidden border border-[#38D9FF] bg-[#111318] shrink-0">
          <img
            src={currentImage}
            alt="Aero the Explorer"
            className="w-full h-full object-cover"
            referrerPolicy="no-referrer"
          />
        </div>
        <div className="text-left">
          <div className="text-xs font-semibold text-[#F2F5F8] flex items-center gap-1.5">
            <span>Aero</span>
            {isStale ? (
              <span className="w-2 h-2 rounded-full bg-[#FF9B54]" title="Feed is stale" />
            ) : isHighPollution ? (
              <span className="w-2 h-2 rounded-full bg-[#FF7A29]" title="High pollution" />
            ) : (
              <span className="w-2 h-2 rounded-full bg-[#38D9FF]" title="Nominal" />
            )}
          </div>
          <div className="text-[10px] text-[#9CA7B5] leading-none">
            {isMinimized ? "Click to open" : "Live guide active"}
          </div>
        </div>
      </motion.button>
    </div>
  );
};
