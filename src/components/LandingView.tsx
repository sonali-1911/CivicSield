import React from 'react';
import { CivicCase } from '../types';
import {
  ShieldAlert,
  ArrowRight,
  FilePlus2,
  LayoutDashboard,
  BarChart3,
  CheckCircle2,
  Clock,
  Flame,
  GitMerge,
  Sparkles,
  Award,
  Layers,
} from 'lucide-react';

interface LandingViewProps {
  cases: CivicCase[];
  onNavigate: (view: 'landing' | 'citizen' | 'command' | 'impact') => void;
  onLaunchJudgeDemo: () => void;
}

export const LandingView: React.FC<LandingViewProps> = ({
  cases,
  onNavigate,
  onLaunchJudgeDemo,
}) => {
  const totalCases = cases.length;
  const criticalCases = cases.filter(
    (c) => c.status !== 'Resolved' && (c.priority_score >= 75 || c.severity === 'critical')
  ).length;
  const resolvedCases = cases.filter((c) => c.status === 'Resolved').length;
  const inProgressCases = cases.filter((c) => c.status === 'In Progress').length;

  return (
    <div className="space-y-12 pb-16">
      {/* Hero Section */}
      <section className="relative overflow-hidden rounded-2xl bg-gradient-to-b from-slate-900 via-slate-900/90 to-slate-950 border border-slate-800 p-8 sm:p-12 shadow-2xl">
        <div className="absolute top-0 right-0 -mr-16 -mt-16 w-96 h-96 bg-teal-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 -ml-16 -mb-16 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 max-w-3xl space-y-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-teal-950/80 border border-teal-800 text-teal-300 text-xs font-semibold">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Hack Devengers 2.0 MVP Specification</span>
          </div>

          <h1 className="text-3xl sm:text-5xl font-extrabold text-white tracking-tight leading-tight">
            Civic issues are easy to report,{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-teal-400 to-blue-400">
              hard to prioritize.
            </span>
          </h1>

          <p className="text-base sm:text-lg text-slate-300 leading-relaxed">
            CivicShield AI structures scattered citizen complaints into an explainable, 
            mathematically prioritized operational queue. It does not replace human judgment—it 
            makes the most urgent, high-consequence problems immediately visible and justifiable.
          </p>

          <div className="flex flex-wrap items-center gap-3 pt-2">
            <button
              id="hero-report-btn"
              onClick={() => onNavigate('citizen')}
              className="px-5 py-3 rounded-xl bg-teal-600 hover:bg-teal-500 text-white font-bold text-sm shadow-lg shadow-teal-600/30 transition-all flex items-center gap-2 cursor-pointer"
            >
              <FilePlus2 className="w-4 h-4" />
              <span>Report an Issue (Citizen)</span>
            </button>

            <button
              id="hero-command-btn"
              onClick={() => onNavigate('command')}
              className="px-5 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-100 font-bold text-sm border border-slate-700 transition-all flex items-center gap-2 cursor-pointer"
            >
              <LayoutDashboard className="w-4 h-4 text-blue-400" />
              <span>Open Command Center</span>
            </button>

            <button
              id="hero-judge-demo-btn"
              onClick={onLaunchJudgeDemo}
              className="px-5 py-3 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 font-bold text-sm border border-amber-500/30 transition-all flex items-center gap-2 cursor-pointer"
            >
              <Award className="w-4 h-4 text-amber-400" />
              <span>Run 2-Minute Judge Walkthrough</span>
            </button>
          </div>
        </div>

        {/* Real-time Ticker Metrics */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-10 pt-8 border-t border-slate-800/80">
          <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800">
            <div className="flex items-center gap-2 text-slate-400 text-xs font-medium mb-1">
              <Layers className="w-3.5 h-3.5 text-teal-400" />
              <span>Total Seeded Cases</span>
            </div>
            <div className="text-2xl font-extrabold text-white">{totalCases}</div>
          </div>

          <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800">
            <div className="flex items-center gap-2 text-slate-400 text-xs font-medium mb-1">
              <Flame className="w-3.5 h-3.5 text-rose-400" />
              <span>Urgent Attention</span>
            </div>
            <div className="text-2xl font-extrabold text-rose-400">{criticalCases}</div>
          </div>

          <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800">
            <div className="flex items-center gap-2 text-slate-400 text-xs font-medium mb-1">
              <Clock className="w-3.5 h-3.5 text-blue-400" />
              <span>Field In Progress</span>
            </div>
            <div className="text-2xl font-extrabold text-blue-400">{inProgressCases}</div>
          </div>

          <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800">
            <div className="flex items-center gap-2 text-slate-400 text-xs font-medium mb-1">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              <span>Resolved Cases</span>
            </div>
            <div className="text-2xl font-extrabold text-emerald-400">{resolvedCases}</div>
          </div>
        </div>
      </section>

      {/* The 3 Core Pillars */}
      <section className="space-y-6">
        <div className="text-center max-w-2xl mx-auto space-y-2">
          <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
            How CivicShield Solves the Triage Bottleneck
          </h2>
          <p className="text-slate-400 text-sm">
            Turning messy citizen input into structured, fair, and explainable municipal operations.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Card 1 */}
          <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-4 hover:border-slate-700 transition-colors">
            <div className="w-12 h-12 rounded-xl bg-teal-500/10 text-teal-400 flex items-center justify-center font-bold text-lg">
              01
            </div>
            <h3 className="text-lg font-bold text-white">AI-Assisted Intake & Extraction</h3>
            <p className="text-slate-400 text-sm leading-relaxed">
              Citizens submit conversational descriptions and photos. CivicShield runs structured 
              extraction (Gemini 3.8 Flash with deterministic fallback) to identify issue category, 
              safety risk, affected people count, and responsible municipal department.
            </p>
            <div className="text-xs font-mono text-teal-400 bg-slate-950 p-2.5 rounded-lg border border-slate-800">
              Contract: Schema validation + human review card before submission.
            </div>
          </div>

          {/* Card 2 */}
          <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-4 hover:border-slate-700 transition-colors">
            <div className="w-12 h-12 rounded-xl bg-blue-500/10 text-blue-400 flex items-center justify-center font-bold text-lg">
              02
            </div>
            <h3 className="text-lg font-bold text-white">Deterministic Priority Scoring</h3>
            <p className="text-slate-400 text-sm leading-relaxed">
              Never an opaque black box. Every case receives a reproducible score (0–100) calculated 
              by a strict formula: 35% Safety Severity + 25% Affected People + 20% Corroboration + 10% 
              Age Unresolved + 10% Sensitive Location.
            </p>
            <div className="text-xs font-mono text-blue-400 bg-slate-950 p-2.5 rounded-lg border border-slate-800">
              Formula: Safety (35) + People (25) + Reports (20) + Age (10) + Location (10).
            </div>
          </div>

          {/* Card 3 */}
          <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-4 hover:border-slate-700 transition-colors">
            <div className="w-12 h-12 rounded-xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center font-bold text-lg">
              03
            </div>
            <h3 className="text-lg font-bold text-white">Spatial Deduplication & Dispatch</h3>
            <p className="text-slate-400 text-sm leading-relaxed">
              When 5 people report the same fallen branch or water main leak within 300 meters, 
              CivicShield flags likely duplicates using Haversine distance and text similarity. 
              Operators merge them with one click, elevating confidence without flooding work queues.
            </p>
            <div className="text-xs font-mono text-indigo-400 bg-slate-950 p-2.5 rounded-lg border border-slate-800">
              Proximity: ≤300m threshold + corroboration weight boost.
            </div>
          </div>
        </div>
      </section>

      {/* The 5-Factor Formula Visualizer */}
      <section className="p-6 sm:p-8 rounded-2xl bg-slate-900 border border-slate-800 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h3 className="text-xl font-bold text-white">The Explainable Priority Scoring Model</h3>
            <p className="text-slate-400 text-sm mt-1">
              Specification Section 1.8 Baseline Formula with normalized factor weights.
            </p>
          </div>
          <div className="text-xs text-slate-400 bg-slate-950 px-3 py-1.5 rounded-lg border border-slate-800 font-mono">
            Score Range: 0 (Routine) to 100 (Critical Safety Emergency)
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-5 gap-3">
          <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-1.5">
            <div className="flex justify-between items-center text-xs">
              <span className="font-semibold text-rose-400">Safety Severity</span>
              <span className="font-mono text-slate-300 font-bold">35%</span>
            </div>
            <p className="text-[11px] text-slate-400 leading-tight">
              Physical harm danger, exposed wiring, gas leaks, unsafe school crossings.
            </p>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-1.5">
            <div className="flex justify-between items-center text-xs">
              <span className="font-semibold text-blue-400">Affected People</span>
              <span className="font-mono text-slate-300 font-bold">25%</span>
            </div>
            <p className="text-[11px] text-slate-400 leading-tight">
              Capped logarithmic scale so high estimates do not dominate other factors.
            </p>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-1.5">
            <div className="flex justify-between items-center text-xs">
              <span className="font-semibold text-indigo-400">Corroboration</span>
              <span className="font-mono text-slate-300 font-bold">20%</span>
            </div>
            <p className="text-[11px] text-slate-400 leading-tight">
              Independent matching reports from distinct citizens increase priority.
            </p>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-1.5">
            <div className="flex justify-between items-center text-xs">
              <span className="font-semibold text-amber-400">Time Unresolved</span>
              <span className="font-mono text-slate-300 font-bold">10%</span>
            </div>
            <p className="text-[11px] text-slate-400 leading-tight">
              Prevents neglected aging tickets from remaining at the bottom forever.
            </p>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-1.5">
            <div className="flex justify-between items-center text-xs">
              <span className="font-semibold text-teal-400">Sensitive Location</span>
              <span className="font-mono text-slate-300 font-bold">10%</span>
            </div>
            <p className="text-[11px] text-slate-400 leading-tight">
              Bonus weighting when located within 300m of schools, hospitals, or transit hubs.
            </p>
          </div>
        </div>
      </section>

      {/* Quick Launch CTA Banner */}
      <section className="p-8 rounded-2xl bg-gradient-to-r from-teal-900/40 via-blue-900/40 to-slate-900 border border-teal-800/50 flex flex-col sm:flex-row items-center justify-between gap-6">
        <div className="space-y-1">
          <h4 className="text-lg font-bold text-white">Ready for the 2-Minute Judge Sequence?</h4>
          <p className="text-slate-300 text-sm">
            Experience the complete end-to-end journey: Report → AI Triage → Ranked Queue → Deduplicate → Assign → Resolve.
          </p>
        </div>
        <button
          id="launch-judge-demo-banner-btn"
          onClick={onLaunchJudgeDemo}
          className="px-6 py-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-extrabold text-sm shadow-xl shadow-amber-500/20 transition-all flex items-center gap-2 shrink-0 cursor-pointer"
        >
          <Award className="w-4 h-4 fill-current" />
          <span>Start Judge Walkthrough</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </section>
    </div>
  );
};
