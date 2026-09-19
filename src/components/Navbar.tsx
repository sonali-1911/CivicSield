import React from 'react';
import {
  ShieldAlert,
  FilePlus2,
  LayoutDashboard,
  BarChart3,
  RotateCcw,
  Sparkles,
  Info,
} from 'lucide-react';

interface NavbarProps {
  currentView: 'landing' | 'citizen' | 'command' | 'impact';
  onNavigate: (view: 'landing' | 'citizen' | 'command' | 'impact') => void;
  openCasesCount: number;
  criticalCasesCount: number;
  onResetData: () => void;
  onToggleJudgeDemo: () => void;
  isJudgeDemoActive: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentView,
  onNavigate,
  openCasesCount,
  criticalCasesCount,
  onResetData,
  onToggleJudgeDemo,
  isJudgeDemoActive,
}) => {
  return (
    <header className="bg-slate-950 border-b border-slate-800 sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Identity */}
          <div
            id="brand-logo-btn"
            onClick={() => onNavigate('landing')}
            className="flex items-center gap-3 cursor-pointer group"
          >
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-teal-500 to-blue-600 flex items-center justify-center text-white shadow-md shadow-teal-500/20 group-hover:scale-105 transition-transform">
              <ShieldAlert className="w-6 h-6 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-lg text-white tracking-tight font-display">
                  CivicShield<span className="text-teal-400">AI</span>
                </span>
                <span className="text-[10px] font-semibold tracking-wider uppercase px-1.5 py-0.5 rounded bg-teal-950 text-teal-300 border border-teal-800">
                  MVP v2.0
                </span>
              </div>
              <p className="text-xs text-slate-400 hidden sm:block">Report less. Resolve smarter.</p>
            </div>
          </div>

          {/* Navigation Tabs */}
          <nav aria-label="Main Navigation" className="flex items-center gap-1 sm:gap-2">
            <button
              id="nav-btn-landing"
              onClick={() => onNavigate('landing')}
              className={`px-3 py-1.5 text-xs sm:text-sm font-medium rounded-lg transition-colors flex items-center gap-1.5 ${
                currentView === 'landing'
                  ? 'bg-slate-800 text-white font-semibold shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
              }`}
            >
              <Info className="w-4 h-4 text-slate-400" />
              <span>Overview</span>
            </button>

            <button
              id="nav-btn-citizen"
              onClick={() => onNavigate('citizen')}
              className={`px-3 py-1.5 text-xs sm:text-sm font-medium rounded-lg transition-colors flex items-center gap-1.5 ${
                currentView === 'citizen'
                  ? 'bg-teal-600 text-white font-semibold shadow-sm shadow-teal-600/30'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
              }`}
            >
              <FilePlus2 className="w-4 h-4 text-teal-400" />
              <span>Citizen Portal</span>
            </button>

            <button
              id="nav-btn-command"
              onClick={() => onNavigate('command')}
              className={`px-3 py-1.5 text-xs sm:text-sm font-medium rounded-lg transition-colors flex items-center gap-1.5 relative ${
                currentView === 'command'
                  ? 'bg-blue-600 text-white font-semibold shadow-sm shadow-blue-600/30'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
              }`}
            >
              <LayoutDashboard className="w-4 h-4 text-blue-400" />
              <span>Command Center</span>
              {criticalCasesCount > 0 && (
                <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse ml-0.5"></span>
              )}
            </button>

            <button
              id="nav-btn-impact"
              onClick={() => onNavigate('impact')}
              className={`px-3 py-1.5 text-xs sm:text-sm font-medium rounded-lg transition-colors flex items-center gap-1.5 ${
                currentView === 'impact'
                  ? 'bg-slate-800 text-white font-semibold shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
              }`}
            >
              <BarChart3 className="w-4 h-4 text-emerald-400" />
              <span>Public Impact</span>
            </button>
          </nav>

          {/* Right Action Tools */}
          <div className="flex items-center gap-2">
            <button
              id="judge-demo-toggle-btn"
              onClick={onToggleJudgeDemo}
              title="Launch the 2-minute Hackathon evaluation demo guide"
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg border transition-all flex items-center gap-1.5 ${
                isJudgeDemoActive
                  ? 'bg-amber-500 text-slate-950 border-amber-400 shadow-md shadow-amber-500/20'
                  : 'bg-slate-900 text-amber-300 border-amber-500/40 hover:bg-amber-950/40'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5 fill-current" />
              <span className="hidden md:inline">2-Min Judge Demo</span>
              <span className="md:hidden">Judge</span>
            </button>

            <button
              id="reset-demo-data-btn"
              onClick={() => {
                if (window.confirm('Reset all demo cases and timeline back to the initial 12 realistic scenarios?')) {
                  onResetData();
                }
              }}
              title="Reset seeded demo cases"
              className="p-2 text-slate-400 hover:text-slate-200 hover:bg-slate-900 rounded-lg border border-slate-800 transition-colors"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
