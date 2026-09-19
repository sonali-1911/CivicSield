import React, { useState } from 'react';
import { CivicCase } from '../types';
import { MapPin, School, Building2, Train, AlertTriangle, Layers } from 'lucide-react';
import { SENSITIVE_PRESETS } from '../data/seedData';

interface CityMapProps {
  cases: CivicCase[];
  selectedCaseId?: string | null;
  onSelectCase: (caseItem: CivicCase) => void;
  highlightCategory?: string | null;
  highlightDuplicateClusterId?: string | null;
}

// Bounding box for Verdant Bay coordinate system
// Lat: ~37.760 to 37.792 (Span: 0.032)
// Lng: -122.445 to -122.398 (Span: 0.047)
const MAP_BOUNDS = {
  minLat: 37.762,
  maxLat: 37.79,
  minLng: -122.445,
  maxLng: -122.398,
};

function projectToSvg(lat: number, lng: number, width: number, height: number) {
  const xRatio = (lng - MAP_BOUNDS.minLng) / (MAP_BOUNDS.maxLng - MAP_BOUNDS.minLng);
  // Invert Y because SVG coordinates increase downwards
  const yRatio = 1 - (lat - MAP_BOUNDS.minLat) / (MAP_BOUNDS.maxLat - MAP_BOUNDS.minLat);

  const padding = 35;
  const x = padding + xRatio * (width - padding * 2);
  const y = padding + yRatio * (height - padding * 2);

  return {
    x: Math.max(padding, Math.min(width - padding, x)),
    y: Math.max(padding, Math.min(height - padding, y)),
  };
}

export const CityMap: React.FC<CityMapProps> = ({
  cases,
  selectedCaseId,
  onSelectCase,
  highlightCategory,
  highlightDuplicateClusterId,
}) => {
  const [hoveredCase, setHoveredCase] = useState<CivicCase | null>(null);
  const [activeDistrictFilter, setActiveDistrictFilter] = useState<string | null>(null);

  const svgWidth = 800;
  const svgHeight = 520;

  // Filter cases if category or district is selected
  const visibleCases = cases.filter((c) => {
    if (c.status === 'Merged') return false; // hide merged subsidiary reports on main view
    if (highlightCategory && c.category !== highlightCategory) return false;
    return true;
  });

  return (
    <div className="relative w-full h-full bg-slate-950 rounded-xl overflow-hidden border border-slate-800 shadow-inner flex flex-col">
      {/* Top Map Bar */}
      <div className="p-3 bg-slate-900/90 border-b border-slate-800 flex items-center justify-between z-10 backdrop-blur-sm">
        <div className="flex items-center gap-2">
          <Layers className="w-4 h-4 text-teal-400" />
          <span className="text-xs font-bold text-slate-200 uppercase tracking-wider">
            Verdant Bay GIS Spatial Queue
          </span>
          <span className="text-[11px] bg-slate-800 text-slate-400 px-2 py-0.5 rounded-full border border-slate-700">
            {visibleCases.length} Active Pins
          </span>
        </div>

        {/* Legend */}
        <div className="hidden sm:flex items-center gap-3 text-[11px] text-slate-400">
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-500 shadow-sm shadow-rose-500/50"></span>
            Critical (Score 80+)
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-400"></span>
            High (60-79)
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-blue-400"></span>
            Medium (40-59)
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400"></span>
            Resolved
          </span>
        </div>
      </div>

      {/* Interactive Map Stage */}
      <div className="relative flex-1 w-full overflow-hidden flex items-center justify-center p-2">
        <svg
          viewBox={`0 0 ${svgWidth} ${svgHeight}`}
          className="w-full h-full select-none"
          style={{ maxHeight: '540px' }}
        >
          <defs>
            <radialGradient id="waterGradient" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#0369a1" stopOpacity="0.3" />
              <stop offset="100%" stopColor="#0f172a" stopOpacity="0.8" />
            </radialGradient>
            <pattern id="gridPattern" width="40" height="40" patternUnits="userSpaceOnUse">
              <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#1e293b" strokeWidth="0.75" />
            </pattern>
          </defs>

          {/* Grid Background */}
          <rect width={svgWidth} height={svgHeight} fill="#0b1120" />
          <rect width={svgWidth} height={svgHeight} fill="url(#gridPattern)" />

          {/* Geographic Waterway / Bay */}
          <path
            d="M 520 0 C 530 140, 570 240, 680 320 C 720 350, 770 380, 800 400 L 800 0 Z"
            fill="url(#waterGradient)"
            stroke="#0284c7"
            strokeWidth="1.5"
            strokeOpacity="0.4"
          />
          <text x="690" y="90" fill="#0284c7" fontSize="11" opacity="0.6" fontWeight="bold">
            VERDANT HARBOR
          </text>

          {/* City Districts Shading */}
          <g id="district-zones" opacity="0.4">
            {/* Oakridge School District */}
            <rect
              x="220"
              y="160"
              width="210"
              height="140"
              rx="12"
              fill="#1e1b4b"
              stroke="#4338ca"
              strokeDasharray="4 4"
            />
            <text x="235" y="185" fill="#a5b4fc" fontSize="10" fontWeight="bold">
              Oakridge Education Zone
            </text>

            {/* Medical District */}
            <rect
              x="360"
              y="80"
              width="190"
              height="110"
              rx="12"
              fill="#064e3b"
              stroke="#059669"
              strokeDasharray="4 4"
            />
            <text x="375" y="105" fill="#6ee7b7" fontSize="10" fontWeight="bold">
              St. Jude Medical Quarter
            </text>

            {/* Market & Commercial Core */}
            <rect
              x="280"
              y="280"
              width="230"
              height="150"
              rx="12"
              fill="#312e81"
              stroke="#6366f1"
              strokeDasharray="4 4"
            />
            <text x="295" y="305" fill="#c7d2fe" fontSize="10" fontWeight="bold">
              Central Market & Transit Plaza
            </text>
          </g>

          {/* Arterial Roadways */}
          <g id="arterial-roads" stroke="#334155" strokeWidth="3" opacity="0.8">
            <line x1="60" y1="230" x2="740" y2="230" stroke="#475569" strokeWidth="4" />
            <line x1="380" y1="30" x2="380" y2="490" stroke="#475569" strokeWidth="4" />
            <line x1="160" y1="80" x2="680" y2="390" stroke="#334155" strokeWidth="2.5" />
            <line x1="140" y1="420" x2="650" y2="120" stroke="#334155" strokeWidth="2" />
          </g>
          <text x="70" y="222" fill="#64748b" fontSize="9" fontWeight="600">
            MAPLE ARTERIAL (E-W)
          </text>
          <text x="390" y="470" fill="#64748b" fontSize="9" fontWeight="600">
            4TH AVENUE (N-S)
          </text>

          {/* Sensitive Location Landmarks */}
          {SENSITIVE_PRESETS.map((landmark, idx) => {
            const pos = projectToSvg(landmark.lat, landmark.lng, svgWidth, svgHeight);
            return (
              <g key={`landmark-${idx}`} transform={`translate(${pos.x}, ${pos.y})`}>
                <circle r="14" fill="#0f172a" stroke="#38bdf8" strokeWidth="1.5" opacity="0.7" />
                <circle r="4" fill="#38bdf8" />
                <text
                  y="24"
                  textAnchor="middle"
                  fill="#7dd3fc"
                  fontSize="9.5"
                  fontWeight="600"
                  className="pointer-events-none drop-shadow-sm"
                >
                  {landmark.name.split(' ')[0]} {landmark.name.split(' ')[1]}
                </text>
              </g>
            );
          })}

          {/* Duplicate Proximity Rings (Highlight 300m radius if selected or cluster candidate) */}
          {visibleCases.map((c) => {
            if (c.corroborating_reports_count > 1 || c.id === highlightDuplicateClusterId) {
              const pos = projectToSvg(c.latitude, c.longitude, svgWidth, svgHeight);
              return (
                <g key={`radius-${c.id}`}>
                  <circle
                    cx={pos.x}
                    cy={pos.y}
                    r="48"
                    fill="#38bdf8"
                    fillOpacity="0.08"
                    stroke="#38bdf8"
                    strokeWidth="1"
                    strokeDasharray="3 3"
                    className="animate-pulse"
                  />
                  <text
                    x={pos.x}
                    y={pos.y - 52}
                    textAnchor="middle"
                    fill="#38bdf8"
                    fontSize="8.5"
                    fontWeight="bold"
                  >
                    300m Cluster
                  </text>
                </g>
              );
            }
            return null;
          })}

          {/* Active Case Pins */}
          {visibleCases.map((c) => {
            const pos = projectToSvg(c.latitude, c.longitude, svgWidth, svgHeight);
            const isSelected = c.id === selectedCaseId;
            const isCritical = c.priority_score >= 80 || c.severity === 'critical';
            const isHigh = c.priority_score >= 60 && c.priority_score < 80;
            const isResolved = c.status === 'Resolved';

            let pinColor = '#3b82f6'; // default medium blue
            if (isResolved) pinColor = '#10b981'; // emerald
            else if (isCritical) pinColor = '#ef4444'; // crimson
            else if (isHigh) pinColor = '#f59e0b'; // amber
            else if (c.priority_score < 40) pinColor = '#64748b'; // slate

            return (
              <g
                key={c.id}
                id={`map-pin-${c.id}`}
                transform={`translate(${pos.x}, ${pos.y})`}
                className="cursor-pointer transition-transform hover:scale-125"
                onClick={() => onSelectCase(c)}
                onMouseEnter={() => setHoveredCase(c)}
                onMouseLeave={() => setHoveredCase(null)}
              >
                {/* Active Selection Ring */}
                {isSelected && (
                  <circle
                    r="22"
                    fill="none"
                    stroke="#ffffff"
                    strokeWidth="2.5"
                    strokeDasharray="4 2"
                    className="animate-spin"
                  />
                )}

                {/* Pulse Ring for Critical Safety Cases */}
                {isCritical && !isResolved && (
                  <circle
                    r="16"
                    fill={pinColor}
                    fillOpacity="0.3"
                    className="animate-ping"
                  />
                )}

                {/* Pin Head */}
                <circle
                  r={isSelected ? '12' : '9.5'}
                  fill={pinColor}
                  stroke="#ffffff"
                  strokeWidth="2"
                  className="shadow-lg"
                />

                {/* Pin Label or Priority Score Number */}
                <text
                  y="3.5"
                  textAnchor="middle"
                  fill="#ffffff"
                  fontSize={isSelected ? '8' : '7.5'}
                  fontWeight="bold"
                  className="pointer-events-none"
                >
                  {c.priority_score}
                </text>

                {/* Corroboration Badge */}
                {c.corroborating_reports_count > 1 && (
                  <g transform="translate(8, -8)">
                    <circle r="5.5" fill="#4f46e5" stroke="#ffffff" strokeWidth="1" />
                    <text
                      y="2.5"
                      textAnchor="middle"
                      fill="#ffffff"
                      fontSize="6.5"
                      fontWeight="bold"
                    >
                      {c.corroborating_reports_count}
                    </text>
                  </g>
                )}
              </g>
            );
          })}
        </svg>

        {/* Floating Tooltip Hover */}
        {hoveredCase && (
          <div
            className="absolute bottom-4 left-4 max-w-sm bg-slate-900/95 border border-slate-700 text-slate-100 p-3 rounded-xl shadow-2xl backdrop-blur-md z-20 pointer-events-none transition-all"
            style={{ animation: 'fadeIn 0.15s ease' }}
          >
            <div className="flex items-center justify-between gap-2 mb-1">
              <span className="font-mono text-xs font-bold text-teal-400">
                {hoveredCase.id}
              </span>
              <span
                className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                  hoveredCase.status === 'Resolved'
                    ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                    : hoveredCase.priority_score >= 80
                    ? 'bg-rose-950 text-rose-300 border border-rose-800'
                    : 'bg-amber-950 text-amber-300 border border-amber-800'
                }`}
              >
                {hoveredCase.status} • Score: {hoveredCase.priority_score}/100
              </span>
            </div>

            <h4 className="font-semibold text-xs text-white line-clamp-1">
              {hoveredCase.title}
            </h4>
            <p className="text-[11px] text-slate-400 line-clamp-2 mt-1">
              {hoveredCase.description}
            </p>

            <div className="flex items-center gap-2 mt-2 pt-2 border-t border-slate-800 text-[10px] text-slate-400">
              <span>Dept: <strong className="text-slate-200">{hoveredCase.assigned_department || hoveredCase.suggested_department}</strong></span>
              <span>•</span>
              <span>Reports: <strong className="text-slate-200">{hoveredCase.corroborating_reports_count}</strong></span>
              {hoveredCase.sensitive_location_info && (
                <>
                  <span>•</span>
                  <span className="text-sky-300 font-medium">{hoveredCase.sensitive_location_info.name}</span>
                </>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Footer Info */}
      <div className="px-3 py-2 bg-slate-900 border-t border-slate-800 flex items-center justify-between text-[11px] text-slate-400">
        <span>Click any pin to inspect explainable scoring, duplicates, and dispatch controls.</span>
        <span className="text-teal-400 font-mono text-[10px]">Coordinate Datum: WGS84 Verdant Grid</span>
      </div>
    </div>
  );
};
