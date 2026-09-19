import React, { useState } from 'react';
import {
  CivicCase,
  CaseEvent,
  CaseStatus,
  DepartmentName,
} from '../types';
import {
  X,
  ShieldAlert,
  MapPin,
  Clock,
  Users,
  GitMerge,
  ArrowRight,
  CheckCircle2,
  Calendar,
  Layers,
  ChevronRight,
  ExternalLink,
  MessageSquare,
  AlertTriangle,
  FileCheck2,
} from 'lucide-react';
import { findDuplicateCandidates, DuplicateCandidate } from '../utils/duplicateDetection';
import { DEPARTMENTS } from '../data/seedData';

interface CaseDetailDrawerProps {
  caseItem: CivicCase | null;
  allCases: CivicCase[];
  events: CaseEvent[];
  onClose: () => void;
  onUpdateStatus: (
    id: string,
    status: CaseStatus,
    note?: string,
    department?: DepartmentName,
    actor?: string,
    afterPhotoUrl?: string
  ) => Promise<any>;
  onMergeCases: (masterId: string, duplicateId: string, note?: string) => Promise<any>;
  onSelectCaseById: (caseId: string) => void;
}

export const CaseDetailDrawer: React.FC<CaseDetailDrawerProps> = ({
  caseItem,
  allCases,
  events,
  onClose,
  onUpdateStatus,
  onMergeCases,
  onSelectCaseById,
}) => {
  const [selectedDept, setSelectedDept] = useState<DepartmentName>(
    caseItem?.assigned_department || caseItem?.suggested_department || 'Roads'
  );
  const [transitionNote, setTransitionNote] = useState('');
  const [afterPhotoUrl, setAfterPhotoUrl] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);
  const [showMergeConfirm, setShowMergeConfirm] = useState<DuplicateCandidate | null>(null);

  if (!caseItem) return null;

  // Filter events for this case
  const caseEvents = events.filter((e) => e.case_id === caseItem.id);

  // Find candidate duplicates
  const duplicateCandidates = findDuplicateCandidates(caseItem, allCases, 450);

  const breakdown = caseItem.priority_breakdown;

  const handleStatusChange = async (newStatus: CaseStatus) => {
    setIsUpdating(true);
    try {
      await onUpdateStatus(
        caseItem.id,
        newStatus,
        transitionNote || `Status transitioned to ${newStatus}`,
        selectedDept,
        'Operator (Command Center)',
        newStatus === 'Resolved' ? afterPhotoUrl : undefined
      );
      setTransitionNote('');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleConfirmMerge = async () => {
    if (!showMergeConfirm) return;
    setIsUpdating(true);
    try {
      await onMergeCases(
        caseItem.id,
        showMergeConfirm.caseItem.id,
        `Merged duplicate ${showMergeConfirm.caseItem.id} (${showMergeConfirm.matchReason})`
      );
      setShowMergeConfirm(null);
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <div className="fixed inset-y-0 right-0 z-50 w-full max-w-2xl bg-slate-950 border-l border-slate-800 shadow-2xl flex flex-col overflow-hidden animate-in slide-in-from-right duration-200">
      {/* Drawer Header */}
      <div className="p-4 sm:p-5 bg-slate-900 border-b border-slate-800 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <div
            className={`w-3.5 h-3.5 rounded-full ${
              caseItem.status === 'Resolved'
                ? 'bg-emerald-400'
                : caseItem.priority_score >= 80
                ? 'bg-rose-500 animate-pulse'
                : caseItem.priority_score >= 60
                ? 'bg-amber-400'
                : 'bg-blue-400'
            }`}
          />
          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-xs font-bold text-teal-400">{caseItem.id}</span>
              <span
                className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${
                  caseItem.status === 'Resolved'
                    ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                    : caseItem.status === 'In Progress'
                    ? 'bg-blue-950 text-blue-300 border border-blue-800'
                    : caseItem.status === 'Assigned'
                    ? 'bg-purple-950 text-purple-300 border border-purple-800'
                    : 'bg-amber-950 text-amber-300 border border-amber-800'
                }`}
              >
                {caseItem.status}
              </span>
            </div>
            <h2 className="text-sm sm:text-base font-bold text-white line-clamp-1 mt-0.5">
              {caseItem.title}
            </h2>
          </div>
        </div>

        <button
          onClick={onClose}
          className="p-2 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Drawer Body Scrollable */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
        {/* Urgent Safety Banner if applicable */}
        {caseItem.safety_risk && caseItem.status !== 'Resolved' && (
          <div className="p-3.5 rounded-xl bg-rose-950/70 border border-rose-800/80 text-rose-200 text-xs flex items-center gap-2.5">
            <ShieldAlert className="w-5 h-5 text-rose-400 shrink-0" />
            <div>
              <strong className="text-white font-semibold">Acute Safety Hazard Flagged:</strong> Requires prioritized department dispatch under City SLA protocol.
            </div>
          </div>
        )}

        {/* FR-5 EXPLAINABILITY CARD: Deterministic Priority Breakdown */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4 shadow-sm">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div className="flex items-center gap-2">
              <Layers className="w-4 h-4 text-teal-400" />
              <h3 className="text-sm font-bold text-white">Explainable Priority Engine (FR-5)</h3>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-400">Total Score:</span>
              <span
                className={`font-mono text-base font-extrabold px-2.5 py-0.5 rounded-lg ${
                  caseItem.priority_score >= 80
                    ? 'bg-rose-950 text-rose-400 border border-rose-800'
                    : caseItem.priority_score >= 60
                    ? 'bg-amber-950 text-amber-400 border border-amber-800'
                    : 'bg-blue-950 text-blue-400 border border-blue-800'
                }`}
              >
                {caseItem.priority_score}/100
              </span>
            </div>
          </div>

          {/* Plain Language Rationale */}
          <div className="p-3 bg-slate-950 rounded-xl border border-slate-800/80 text-xs text-slate-200 leading-relaxed">
            <span className="text-teal-400 font-semibold">Priority Rationale: </span>
            {breakdown?.explanation ||
              'Calculated deterministically from severity, public exposure, corroborating reports, and location sensitivity.'}
          </div>

          {/* Factor Breakdown Bars */}
          <div className="space-y-3 pt-1">
            <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
              Factor Weight Contributions:
            </div>

            {/* Factor 1: Safety (35%) */}
            <div className="space-y-1">
              <div className="flex justify-between text-xs">
                <span className="text-slate-300 font-medium">Safety Severity (Weight 35%)</span>
                <span className="font-mono text-rose-400 font-bold">
                  {breakdown?.safetySeverityPoints || 0}/35 pts
                </span>
              </div>
              <div className="w-full h-2 bg-slate-950 rounded-full overflow-hidden border border-slate-800">
                <div
                  className="h-full bg-rose-500 rounded-full transition-all"
                  style={{
                    width: `${((breakdown?.safetySeverityPoints || 0) / 35) * 100}%`,
                  }}
                />
              </div>
            </div>

            {/* Factor 2: People (25%) */}
            <div className="space-y-1">
              <div className="flex justify-between text-xs">
                <span className="text-slate-300 font-medium">Affected People (Weight 25%)</span>
                <span className="font-mono text-blue-400 font-bold">
                  {breakdown?.affectedPeoplePoints || 0}/25 pts
                </span>
              </div>
              <div className="w-full h-2 bg-slate-950 rounded-full overflow-hidden border border-slate-800">
                <div
                  className="h-full bg-blue-500 rounded-full transition-all"
                  style={{
                    width: `${((breakdown?.affectedPeoplePoints || 0) / 25) * 100}%`,
                  }}
                />
              </div>
            </div>

            {/* Factor 3: Corroboration (20%) */}
            <div className="space-y-1">
              <div className="flex justify-between text-xs">
                <span className="text-slate-300 font-medium">Corroboration Reports (Weight 20%)</span>
                <span className="font-mono text-indigo-400 font-bold">
                  {breakdown?.corroborationPoints || 0}/20 pts
                </span>
              </div>
              <div className="w-full h-2 bg-slate-950 rounded-full overflow-hidden border border-slate-800">
                <div
                  className="h-full bg-indigo-500 rounded-full transition-all"
                  style={{
                    width: `${((breakdown?.corroborationPoints || 0) / 20) * 100}%`,
                  }}
                />
              </div>
            </div>

            {/* Factor 4: Time (10%) */}
            <div className="space-y-1">
              <div className="flex justify-between text-xs">
                <span className="text-slate-300 font-medium">Time Unresolved / Age (Weight 10%)</span>
                <span className="font-mono text-amber-400 font-bold">
                  {breakdown?.timeUnresolvedPoints || 0}/10 pts
                </span>
              </div>
              <div className="w-full h-2 bg-slate-950 rounded-full overflow-hidden border border-slate-800">
                <div
                  className="h-full bg-amber-500 rounded-full transition-all"
                  style={{
                    width: `${((breakdown?.timeUnresolvedPoints || 0) / 10) * 100}%`,
                  }}
                />
              </div>
            </div>

            {/* Factor 5: Sensitive Location (10%) */}
            <div className="space-y-1">
              <div className="flex justify-between text-xs">
                <span className="text-slate-300 font-medium">Sensitive Location (Weight 10%)</span>
                <span className="font-mono text-teal-400 font-bold">
                  {breakdown?.sensitiveLocationPoints || 0}/10 pts
                </span>
              </div>
              <div className="w-full h-2 bg-slate-950 rounded-full overflow-hidden border border-slate-800">
                <div
                  className="h-full bg-teal-500 rounded-full transition-all"
                  style={{
                    width: `${((breakdown?.sensitiveLocationPoints || 0) / 10) * 100}%`,
                  }}
                />
              </div>
            </div>
          </div>

          <div className="pt-2 text-[11px] font-mono text-slate-400 text-center border-t border-slate-800/80">
            {breakdown?.breakdownString}
          </div>
        </div>

        {/* FR-6 DUPLICATE DETECTION & MERGE SECTION */}
        {duplicateCandidates.length > 0 && caseItem.status !== 'Merged' && (
          <div className="bg-slate-900 border border-indigo-500/40 rounded-2xl p-5 space-y-4 shadow-sm">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <GitMerge className="w-4 h-4 text-indigo-400" />
                <h3 className="text-sm font-bold text-white">
                  Duplicate Reports Detected ({duplicateCandidates.length})
                </h3>
              </div>
              <span className="text-[10px] font-semibold text-indigo-300 bg-indigo-950 px-2 py-0.5 rounded border border-indigo-800">
                Spatial Radius &le; 400m
              </span>
            </div>

            <p className="text-xs text-slate-400">
              Multiple citizen reports match this incident. Merging combines corroborating evidence, 
              increases priority confidence, and leaves a single clean work ticket for the crew.
            </p>

            <div className="space-y-3">
              {duplicateCandidates.map((dup) => (
                <div
                  key={dup.caseItem.id}
                  className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 hover:border-slate-700 transition-colors space-y-2"
                >
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-mono font-bold text-indigo-300">
                      {dup.caseItem.id}
                    </span>
                    <span className="text-slate-400">
                      {dup.distanceMeters}m away • {Math.round(dup.similarityScore * 100)}% text match
                    </span>
                  </div>

                  <p className="text-xs text-slate-300 line-clamp-2">
                    {dup.caseItem.description}
                  </p>

                  <div className="flex items-center justify-between pt-1">
                    <button
                      type="button"
                      onClick={() => onSelectCaseById(dup.caseItem.id)}
                      className="text-xs text-slate-400 hover:text-slate-200 underline cursor-pointer"
                    >
                      View Report Details
                    </button>

                    <button
                      type="button"
                      onClick={() => setShowMergeConfirm(dup)}
                      className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-sm transition-colors flex items-center gap-1.5 cursor-pointer"
                    >
                      <GitMerge className="w-3.5 h-3.5" />
                      <span>Merge Into This Case</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Modal / Confirmation Box for Merging */}
        {showMergeConfirm && (
          <div className="p-4 rounded-xl bg-indigo-950/80 border border-indigo-500/60 text-xs space-y-3">
            <div className="font-bold text-white text-sm flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-indigo-400" />
              <span>Confirm Permanent Case Merge</span>
            </div>
            <p className="text-slate-300 leading-relaxed">
              Are you sure you want to merge <strong>{showMergeConfirm.caseItem.id}</strong> into this primary case (<strong>{caseItem.id}</strong>)?
              This will increment corroboration to {caseItem.corroborating_reports_count + 1} and recalibrate priority score.
            </p>
            <div className="flex justify-end gap-2 pt-1">
              <button
                type="button"
                onClick={() => setShowMergeConfirm(null)}
                className="px-3 py-1.5 rounded-lg bg-slate-800 text-slate-300 font-semibold cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmMerge}
                disabled={isUpdating}
                className="px-4 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-bold cursor-pointer"
              >
                {isUpdating ? 'Merging...' : 'Confirm & Recalibrate'}
              </button>
            </div>
          </div>
        )}

        {/* Case Details & Photos */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
          <h3 className="text-sm font-bold text-white">Citizen Report Details</h3>

          <div className="space-y-2 text-xs">
            <div className="text-slate-400">
              <strong className="text-slate-200">Location:</strong> {caseItem.location_label}
            </div>
            {caseItem.sensitive_location_info && (
              <div className="text-sky-300">
                <strong className="text-slate-200">Sensitive Proximity:</strong>{' '}
                {caseItem.sensitive_location_info.name} (
                {caseItem.sensitive_location_info.distanceMeters}m)
              </div>
            )}
            <div className="text-slate-400">
              <strong className="text-slate-200">Citizen Description:</strong>
              <p className="mt-1 text-slate-300 bg-slate-950 p-3 rounded-xl border border-slate-800 leading-relaxed">
                {caseItem.description}
              </p>
            </div>
          </div>

          {/* Photos: Before & After */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
            {caseItem.image_url && (
              <div className="space-y-1">
                <span className="text-[11px] font-semibold text-slate-400">Citizen Report Photo:</span>
                <img
                  src={caseItem.image_url}
                  alt="Citizen report"
                  className="w-full h-36 object-cover rounded-xl border border-slate-800"
                  referrerPolicy="no-referrer"
                />
              </div>
            )}

            {caseItem.after_photo_url && (
              <div className="space-y-1">
                <span className="text-[11px] font-semibold text-emerald-400">
                  Post-Resolution Verification Photo:
                </span>
                <img
                  src={caseItem.after_photo_url}
                  alt="Post resolution"
                  className="w-full h-36 object-cover rounded-xl border border-emerald-800/80"
                  referrerPolicy="no-referrer"
                />
              </div>
            )}
          </div>
        </div>

        {/* Department Assignment & Operational Controls */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
          <h3 className="text-sm font-bold text-white">Department Assignment & Field Lifecycle</h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs text-slate-400 mb-1 block">Assigned Municipal Department</label>
              <select
                value={selectedDept}
                onChange={(e) => setSelectedDept(e.target.value as DepartmentName)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-slate-100 focus:border-teal-500"
              >
                {Object.keys(DEPARTMENTS).map((d) => (
                  <option key={d} value={d}>
                    {DEPARTMENTS[d as DepartmentName].name} (SLA: {DEPARTMENTS[d as DepartmentName].response_target_hours}h)
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-xs text-slate-400 mb-1 block">Assigned Field Unit / Lead</label>
              <input
                type="text"
                readOnly
                value={
                  caseItem.assigned_to ||
                  DEPARTMENTS[selectedDept]?.contactLead ||
                  'Pending Assignment'
                }
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-slate-400"
              />
            </div>
          </div>

          {/* Operational Action Note */}
          <div>
            <label className="text-xs text-slate-400 mb-1 block">Operator Note for Timeline</label>
            <input
              type="text"
              value={transitionNote}
              onChange={(e) => setTransitionNote(e.target.value)}
              placeholder="e.g. Dispatched asphalt patching truck unit #2 with cold mix."
              className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-slate-100 placeholder-slate-500 focus:border-teal-500"
            />
          </div>

          {/* Resolution Photo field if resolving */}
          {caseItem.status !== 'Resolved' && (
            <div>
              <label className="text-xs text-slate-400 mb-1 block">
                After-Photo URL (Optional when resolving)
              </label>
              <input
                type="text"
                value={afterPhotoUrl}
                onChange={(e) => setAfterPhotoUrl(e.target.value)}
                placeholder="https://images.unsplash.com/... or paste image URL"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-slate-100 placeholder-slate-500 focus:border-teal-500"
              />
            </div>
          )}

          {/* Status Progression Buttons */}
          <div className="flex flex-wrap gap-2 pt-2 border-t border-slate-800/80">
            {caseItem.status === 'Reported' && (
              <button
                type="button"
                id="assign-case-btn"
                onClick={() => handleStatusChange('Assigned')}
                disabled={isUpdating}
                className="flex-1 py-2.5 px-4 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs shadow-md transition-all flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <ArrowRight className="w-3.5 h-3.5" />
                <span>Assign to {selectedDept}</span>
              </button>
            )}

            {(caseItem.status === 'Reported' || caseItem.status === 'Assigned') && (
              <button
                type="button"
                id="start-work-btn"
                onClick={() => handleStatusChange('In Progress')}
                disabled={isUpdating}
                className="flex-1 py-2.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-md transition-all flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Clock className="w-3.5 h-3.5" />
                <span>Mark In Progress</span>
              </button>
            )}

            {caseItem.status !== 'Resolved' && (
              <button
                type="button"
                id="resolve-case-btn"
                onClick={() => {
                  if (!afterPhotoUrl) {
                    setAfterPhotoUrl(
                      'https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=800&q=80'
                    );
                  }
                  handleStatusChange('Resolved');
                }}
                disabled={isUpdating}
                className="flex-1 py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-md transition-all flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Mark Resolved</span>
              </button>
            )}
          </div>
        </div>

        {/* FR-4 Audit Event Timeline */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-teal-400" />
            <h3 className="text-sm font-bold text-white">Case Audit Timeline ({caseEvents.length})</h3>
          </div>

          <div className="relative pl-6 space-y-4 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-800">
            {caseEvents.map((evt) => (
              <div key={evt.id} className="relative space-y-1 text-xs">
                {/* Timeline node */}
                <div className="absolute -left-6 top-1 w-2.5 h-2.5 rounded-full bg-teal-400 ring-4 ring-slate-950" />
                <div className="flex items-center justify-between text-slate-400">
                  <span className="font-semibold text-slate-200">{evt.actor_label}</span>
                  <span className="text-[10px] text-slate-500">
                    {new Date(evt.created_at).toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </span>
                </div>
                <p className="text-slate-300">{evt.note}</p>
                {evt.after_photo_url && (
                  <div className="pt-1">
                    <img
                      src={evt.after_photo_url}
                      alt="Verification"
                      className="w-24 h-16 object-cover rounded border border-emerald-700"
                      referrerPolicy="no-referrer"
                    />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
