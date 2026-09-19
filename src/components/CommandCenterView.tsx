import React, { useState, useMemo } from 'react';
import {
  CivicCase,
  CaseEvent,
  CaseStatus,
  DepartmentName,
  IssueCategory,
} from '../types';
import {
  Search,
  Filter,
  Flame,
  Clock,
  CheckCircle2,
  GitMerge,
  ShieldAlert,
  ArrowUpDown,
  MapPin,
  ChevronRight,
  School,
  Layers,
  Activity,
  SlidersHorizontal,
  RefreshCw,
} from 'lucide-react';
import { CityMap } from './CityMap';
import { DEPARTMENTS } from '../data/seedData';

interface CommandCenterViewProps {
  cases: CivicCase[];
  events: CaseEvent[];
  selectedCaseId: string | null;
  onSelectCase: (caseItem: CivicCase) => void;
  onNavigateToReport: () => void;
}

export const CommandCenterView: React.FC<CommandCenterViewProps> = ({
  cases,
  events,
  selectedCaseId,
  onSelectCase,
  onNavigateToReport,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('All');
  const [departmentFilter, setDepartmentFilter] = useState<string>('All');
  const [categoryFilter, setCategoryFilter] = useState<string>('All');
  const [priorityTierFilter, setPriorityTierFilter] = useState<string>('All');
  const [onlySensitiveLocation, setOnlySensitiveLocation] = useState(false);
  const [showActivityFeed, setShowActivityFeed] = useState(false);

  // Compute live KPIs from actual data (FR-7)
  const totalCount = cases.length;
  const criticalCount = cases.filter(
    (c) => c.status !== 'Resolved' && (c.priority_score >= 80 || c.severity === 'critical')
  ).length;
  const inProgressCount = cases.filter((c) => c.status === 'In Progress').length;
  const resolvedCount = cases.filter((c) => c.status === 'Resolved').length;
  const corroboratedCount = cases.filter((c) => c.corroborating_reports_count > 1).length;

  // Filter and sort cases strictly by priority_score descending
  const filteredCases = useMemo(() => {
    return cases
      .filter((c) => {
        if (c.status === 'Merged') return false; // Merged tickets are archived under master case

        if (statusFilter !== 'All' && c.status !== statusFilter) return false;
        if (
          departmentFilter !== 'All' &&
          c.assigned_department !== departmentFilter &&
          c.suggested_department !== departmentFilter
        )
          return false;
        if (categoryFilter !== 'All' && c.category !== categoryFilter) return false;

        if (onlySensitiveLocation && (!c.sensitive_location_info || c.sensitive_location_info.type === 'none')) {
          return false;
        }

        if (priorityTierFilter === 'Critical' && c.priority_score < 80) return false;
        if (
          priorityTierFilter === 'High' &&
          (c.priority_score < 60 || c.priority_score >= 80)
        )
          return false;
        if (
          priorityTierFilter === 'Medium' &&
          (c.priority_score < 40 || c.priority_score >= 60)
        )
          return false;
        if (priorityTierFilter === 'Low' && c.priority_score >= 40) return false;

        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase();
          const matchId = c.id.toLowerCase().includes(q);
          const matchTitle = c.title.toLowerCase().includes(q);
          const matchDesc = c.description.toLowerCase().includes(q);
          const matchLoc = c.location_label.toLowerCase().includes(q);
          const matchCat = c.category.toLowerCase().includes(q);
          if (!matchId && !matchTitle && !matchDesc && !matchLoc && !matchCat) return false;
        }

        return true;
      })
      .sort((a, b) => {
        // Open critical cases first, resolved cases down
        if (a.status === 'Resolved' && b.status !== 'Resolved') return 1;
        if (a.status !== 'Resolved' && b.status === 'Resolved') return -1;
        // Priority score strictly descending
        return b.priority_score - a.priority_score;
      });
  }, [
    cases,
    statusFilter,
    departmentFilter,
    categoryFilter,
    priorityTierFilter,
    onlySensitiveLocation,
    searchQuery,
  ]);

  return (
    <div className="space-y-6 pb-12">
      {/* Top Banner answering: "What needs attention now?" */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-pulse" />
            <h1 className="text-xl font-extrabold text-white tracking-tight">
              Operational Command Center
            </h1>
            <span className="text-[11px] font-mono text-teal-400 bg-teal-950 px-2 py-0.5 rounded border border-teal-800">
              Live Priority Dispatch
            </span>
          </div>
          <p className="text-xs text-slate-300">
            <strong>Immediate Action:</strong>{' '}
            {criticalCount > 0 ? (
              <span className="text-rose-400 font-semibold">
                {criticalCount} critical safety incident{criticalCount > 1 ? 's' : ''} require immediate department assignment.
              </span>
            ) : (
              <span className="text-emerald-400">All high-consequence safety hazards are assigned.</span>
            )}
          </p>
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto justify-end">
          <button
            onClick={() => setShowActivityFeed(!showActivityFeed)}
            className={`px-3 py-2 rounded-xl text-xs font-semibold border transition-colors flex items-center gap-1.5 cursor-pointer ${
              showActivityFeed
                ? 'bg-teal-950 text-teal-300 border-teal-700'
                : 'bg-slate-950 text-slate-400 border-slate-800 hover:border-slate-700'
            }`}
          >
            <Activity className="w-3.5 h-3.5" />
            <span>Activity Feed</span>
          </button>
        </div>
      </div>

      {/* KPI Cards Row (FR-7) */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        {/* KPI 1 */}
        <div className="p-4 rounded-xl bg-slate-900 border border-slate-800">
          <div className="text-[11px] font-semibold text-slate-400 flex items-center justify-between">
            <span>Total Tracked</span>
            <Layers className="w-3.5 h-3.5 text-slate-500" />
          </div>
          <div className="text-2xl font-black text-white mt-1 font-mono">{totalCount}</div>
          <div className="text-[10px] text-slate-500 mt-1">Across all city sectors</div>
        </div>

        {/* KPI 2 */}
        <div className="p-4 rounded-xl bg-rose-950/20 border border-rose-900/40">
          <div className="text-[11px] font-semibold text-rose-400 flex items-center justify-between">
            <span>Critical Urgency</span>
            <Flame className="w-3.5 h-3.5 text-rose-500" />
          </div>
          <div className="text-2xl font-black text-rose-400 mt-1 font-mono">{criticalCount}</div>
          <div className="text-[10px] text-rose-300/70 mt-1">Score &ge; 80 / Safety risk</div>
        </div>

        {/* KPI 3 */}
        <div className="p-4 rounded-xl bg-blue-950/20 border border-blue-900/40">
          <div className="text-[11px] font-semibold text-blue-400 flex items-center justify-between">
            <span>In Field Progress</span>
            <Clock className="w-3.5 h-3.5 text-blue-500" />
          </div>
          <div className="text-2xl font-black text-blue-400 mt-1 font-mono">{inProgressCount}</div>
          <div className="text-[10px] text-blue-300/70 mt-1">Crews deployed</div>
        </div>

        {/* KPI 4 */}
        <div className="p-4 rounded-xl bg-indigo-950/20 border border-indigo-900/40">
          <div className="text-[11px] font-semibold text-indigo-400 flex items-center justify-between">
            <span>Corroborated</span>
            <GitMerge className="w-3.5 h-3.5 text-indigo-500" />
          </div>
          <div className="text-2xl font-black text-indigo-400 mt-1 font-mono">{corroboratedCount}</div>
          <div className="text-[10px] text-indigo-300/70 mt-1">Multi-citizen reports</div>
        </div>

        {/* KPI 5 */}
        <div className="p-4 rounded-xl bg-emerald-950/20 border border-emerald-900/40 col-span-2 sm:col-span-1">
          <div className="text-[11px] font-semibold text-emerald-400 flex items-center justify-between">
            <span>Resolved</span>
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
          </div>
          <div className="text-2xl font-black text-emerald-400 mt-1 font-mono">{resolvedCount}</div>
          <div className="text-[10px] text-emerald-300/70 mt-1">Verified completions</div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-3">
        <div className="flex flex-col sm:flex-row gap-3">
          {/* Search Input */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by Case ID (e.g. CS-2026-1042), keyword, landmark, or category..."
              className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3.5 py-2 text-xs sm:text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-teal-500"
            />
          </div>

          {/* Quick Status Buttons */}
          <div className="flex items-center gap-1 overflow-x-auto pb-1 sm:pb-0">
            {['All', 'Reported', 'Assigned', 'In Progress', 'Resolved'].map((st) => (
              <button
                key={st}
                onClick={() => setStatusFilter(st)}
                className={`px-3 py-1.5 text-xs font-semibold rounded-lg whitespace-nowrap transition-colors cursor-pointer ${
                  statusFilter === st
                    ? 'bg-slate-800 text-white font-bold border border-slate-700 shadow-sm'
                    : 'text-slate-400 hover:text-slate-200 bg-slate-950 border border-slate-900'
                }`}
              >
                {st}
              </button>
            ))}
          </div>
        </div>

        {/* Second Row of Filters */}
        <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-800/80 text-xs text-slate-400">
          <div className="flex items-center gap-1.5">
            <SlidersHorizontal className="w-3.5 h-3.5 text-slate-500" />
            <span>Filters:</span>
          </div>

          {/* Department Select */}
          <select
            value={departmentFilter}
            onChange={(e) => setDepartmentFilter(e.target.value)}
            className="bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1 text-slate-300 focus:border-teal-500"
          >
            <option value="All">All Departments</option>
            {Object.keys(DEPARTMENTS).map((d) => (
              <option key={d} value={d}>
                {DEPARTMENTS[d as DepartmentName].name}
              </option>
            ))}
          </select>

          {/* Priority Tier */}
          <select
            value={priorityTierFilter}
            onChange={(e) => setPriorityTierFilter(e.target.value)}
            className="bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1 text-slate-300 focus:border-teal-500"
          >
            <option value="All">All Priority Tiers</option>
            <option value="Critical">Critical (&ge; 80 pts)</option>
            <option value="High">High (60–79 pts)</option>
            <option value="Medium">Medium (40–59 pts)</option>
            <option value="Low">Low (&lt; 40 pts)</option>
          </select>

          {/* Sensitive Location Toggle */}
          <button
            type="button"
            onClick={() => setOnlySensitiveLocation(!onlySensitiveLocation)}
            className={`px-2.5 py-1 rounded-lg border transition-colors flex items-center gap-1 cursor-pointer ${
              onlySensitiveLocation
                ? 'bg-sky-950 text-sky-300 border-sky-700'
                : 'bg-slate-950 text-slate-400 border-slate-800 hover:border-slate-700'
            }`}
          >
            <School className="w-3.5 h-3.5" />
            <span>Near Schools / Hospitals / Transit</span>
          </button>

          {(statusFilter !== 'All' ||
            departmentFilter !== 'All' ||
            priorityTierFilter !== 'All' ||
            onlySensitiveLocation ||
            searchQuery) && (
            <button
              onClick={() => {
                setStatusFilter('All');
                setDepartmentFilter('All');
                setPriorityTierFilter('All');
                setOnlySensitiveLocation(false);
                setSearchQuery('');
              }}
              className="text-teal-400 hover:underline ml-auto cursor-pointer"
            >
              Reset Filters
            </button>
          )}
        </div>
      </div>

      {/* Main Operational Split Grid: Priority Queue (Left) & City Map (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Ranked Priority Queue (7 Cols) */}
        <div className="lg:col-span-7 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ArrowUpDown className="w-4 h-4 text-teal-400" />
              <h2 className="text-sm font-bold text-white uppercase tracking-wider">
                Ranked Action Queue ({filteredCases.length})
              </h2>
            </div>
            <span className="text-[11px] text-slate-400">
              Ranked strictly by deterministic score (0–100)
            </span>
          </div>

          {filteredCases.length === 0 ? (
            <div className="p-8 rounded-2xl bg-slate-900 border border-slate-800 text-center space-y-3">
              <p className="text-sm text-slate-400">No cases match the active filter criteria.</p>
              <button
                onClick={() => {
                  setStatusFilter('All');
                  setDepartmentFilter('All');
                  setPriorityTierFilter('All');
                  setSearchQuery('');
                  setOnlySensitiveLocation(false);
                }}
                className="text-xs text-teal-400 underline cursor-pointer"
              >
                Clear all filters
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredCases.map((c) => {
                const isSelected = c.id === selectedCaseId;
                const isCritical = c.priority_score >= 80 || c.severity === 'critical';
                const isHigh = c.priority_score >= 60 && c.priority_score < 80;

                return (
                  <div
                    key={c.id}
                    id={`queue-card-${c.id}`}
                    onClick={() => onSelectCase(c)}
                    className={`group p-4 rounded-xl border transition-all cursor-pointer relative ${
                      isSelected
                        ? 'bg-slate-800/90 border-teal-400 ring-2 ring-teal-500/20 shadow-lg'
                        : isCritical && c.status !== 'Resolved'
                        ? 'bg-slate-900/90 border-rose-900/60 hover:border-rose-700/80 shadow-sm'
                        : 'bg-slate-900 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      {/* Priority Score Stamp */}
                      <div className="flex flex-col items-center justify-center shrink-0 w-14 h-14 rounded-xl bg-slate-950 border border-slate-800">
                        <span
                          className={`text-lg font-black font-mono leading-none ${
                            c.status === 'Resolved'
                              ? 'text-emerald-400'
                              : isCritical
                              ? 'text-rose-400'
                              : isHigh
                              ? 'text-amber-400'
                              : 'text-blue-400'
                          }`}
                        >
                          {c.priority_score}
                        </span>
                        <span className="text-[9px] font-semibold text-slate-500 uppercase mt-0.5">
                          Score
                        </span>
                      </div>

                      {/* Main Info */}
                      <div className="flex-1 min-w-0 space-y-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-mono text-xs font-bold text-teal-400">{c.id}</span>

                          <span
                            className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${
                              c.status === 'Resolved'
                                ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                                : c.status === 'In Progress'
                                ? 'bg-blue-950 text-blue-300 border border-blue-800'
                                : c.status === 'Assigned'
                                ? 'bg-purple-950 text-purple-300 border border-purple-800'
                                : 'bg-amber-950 text-amber-300 border border-amber-800'
                            }`}
                          >
                            {c.status}
                          </span>

                          <span className="text-[10px] font-semibold text-slate-300 bg-slate-800 px-2 py-0.5 rounded">
                            {c.category}
                          </span>

                          {c.corroborating_reports_count > 1 && (
                            <span className="text-[10px] font-bold text-indigo-300 bg-indigo-950 px-2 py-0.5 rounded border border-indigo-800 flex items-center gap-1">
                              <GitMerge className="w-3 h-3" />
                              <span>{c.corroborating_reports_count} Reports</span>
                            </span>
                          )}

                          {c.sensitive_location_info && (
                            <span className="text-[10px] font-bold text-sky-300 bg-sky-950 px-2 py-0.5 rounded border border-sky-800 flex items-center gap-1">
                              <School className="w-3 h-3" />
                              <span>{c.sensitive_location_info.name.split(' ')[0]}</span>
                            </span>
                          )}
                        </div>

                        <h3 className="text-sm font-bold text-white group-hover:text-teal-300 transition-colors line-clamp-1">
                          {c.title}
                        </h3>

                        <p className="text-xs text-slate-400 line-clamp-1">
                          {c.description}
                        </p>

                        <div className="flex flex-wrap items-center gap-3 pt-1 text-[11px] text-slate-400">
                          <span className="flex items-center gap-1">
                            <MapPin className="w-3 h-3 text-slate-500" />
                            <span className="truncate max-w-[180px]">{c.location_label}</span>
                          </span>
                          <span>•</span>
                          <span>
                            Dept:{' '}
                            <strong className="text-slate-300">
                              {c.assigned_department || c.suggested_department}
                            </strong>
                          </span>
                          <span>•</span>
                          <span>
                            Age:{' '}
                            <strong className="text-slate-300">
                              {Math.round(
                                (Date.now() - new Date(c.created_at).getTime()) / (3600 * 1000)
                              )}
                              h
                            </strong>
                          </span>
                        </div>
                      </div>

                      {/* Right Inspect Trigger */}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onSelectCase(c);
                        }}
                        className="self-center p-2 rounded-lg bg-slate-950 hover:bg-teal-600 hover:text-white text-slate-400 border border-slate-800 transition-all cursor-pointer"
                        title="Inspect case breakdown and controls"
                      >
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Right Column: GIS Spatial Map (5 Cols) */}
        <div className="lg:col-span-5 space-y-4 lg:sticky lg:top-24">
          <CityMap
            cases={cases}
            selectedCaseId={selectedCaseId}
            onSelectCase={onSelectCase}
            highlightCategory={categoryFilter !== 'All' ? categoryFilter : null}
          />

          {/* Quick Context Card */}
          <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-400 space-y-1">
            <span className="font-semibold text-slate-200">GIS Proximity Deduplication:</span>
            <p>
              Cases clustered within 300 meters of each other trigger automatic duplicate alerts.
              Select any case to review matching incident reports and merge corroborating data.
            </p>
          </div>
        </div>
      </div>

      {/* Floating or Bottom Activity Feed (FR-4) */}
      {showActivityFeed && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div className="flex items-center gap-2">
              <Activity className="w-4 h-4 text-teal-400" />
              <h3 className="text-sm font-bold text-white">
                Live Citywide Operational Activity Log
              </h3>
            </div>
            <span className="text-xs text-slate-400">{events.length} total timeline events</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            {events.slice(0, 9).map((evt) => (
              <div
                key={evt.id}
                className="p-3 rounded-xl bg-slate-950 border border-slate-800/80 text-xs space-y-1"
              >
                <div className="flex justify-between items-center text-slate-400 text-[10px]">
                  <span className="font-mono text-teal-400 font-bold">{evt.case_id}</span>
                  <span>{new Date(evt.created_at).toLocaleTimeString()}</span>
                </div>
                <div className="font-semibold text-slate-200">{evt.actor_label}</div>
                <p className="text-slate-400 text-[11px] line-clamp-2">{evt.note}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
