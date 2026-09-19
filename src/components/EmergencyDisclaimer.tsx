import React from 'react';
import { AlertTriangle, PhoneCall } from 'lucide-react';

export const EmergencyDisclaimer: React.FC = () => {
  return (
    <aside aria-label="Emergency warning" className="bg-slate-900 border-b border-slate-800 text-slate-300 text-xs py-2 px-4">
      <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
          <span>
            <strong className="text-white font-medium">Non-Emergency Prototype:</strong> CivicShield is an operational triage system. For active fires, gas leaks, crimes in progress, or immediate medical emergencies, call local emergency services immediately.
          </span>
        </div>
        <div className="flex items-center gap-3 shrink-0 text-slate-400">
          <span className="flex items-center gap-1 font-semibold text-rose-300">
            <PhoneCall className="w-3.5 h-3.5" /> Emergency: 911 / 112
          </span>
          <span className="text-slate-600">|</span>
          <span>Municipal Hotline: 311</span>
        </div>
      </div>
    </aside>
  );
};
