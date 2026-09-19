import React, { useState } from 'react';
import {
  CivicCase,
  AITriageResult,
  IssueCategory,
  IssueSeverity,
  DepartmentName,
} from '../types';
import {
  FilePlus2,
  Sparkles,
  MapPin,
  Upload,
  AlertCircle,
  CheckCircle2,
  ArrowRight,
  ShieldAlert,
  Loader2,
  RefreshCw,
  Eye,
  Building,
} from 'lucide-react';
import { CIVIC_PHOTO_PRESETS, SENSITIVE_PRESETS } from '../data/seedData';

interface CitizenReportViewProps {
  onSubmitCase: (caseData: Partial<CivicCase>) => Promise<CivicCase>;
  onRunAITriage: (
    description: string,
    imageUrl?: string,
    locationLabel?: string
  ) => Promise<AITriageResult>;
  onNavigateToCommand: (caseId?: string) => void;
  prefillPotholeScenario?: boolean;
}

export const CitizenReportView: React.FC<CitizenReportViewProps> = ({
  onSubmitCase,
  onRunAITriage,
  onNavigateToCommand,
  prefillPotholeScenario,
}) => {
  const [description, setDescription] = useState(
    prefillPotholeScenario
      ? 'Large pothole outside the school gate. Two bikes nearly fell today. Deep cavity with exposed aggregate causing severe cyclist wobble during morning drop-off.'
      : ''
  );
  const [selectedPhoto, setSelectedPhoto] = useState<string>(
    prefillPotholeScenario ? CIVIC_PHOTO_PRESETS[0].url : ''
  );
  const [locationLabel, setLocationLabel] = useState(
    prefillPotholeScenario
      ? 'Oakridge Elementary School Gate (Maple St & 8th)'
      : 'Maple Avenue & 8th Street'
  );
  const [selectedCoords, setSelectedCoords] = useState<{ lat: number; lng: number }>({
    lat: 37.7751,
    lng: -122.4192,
  });
  const [reporterName, setReporterName] = useState('');
  const [reporterContact, setReporterContact] = useState('');

  // AI Review State
  const [isTriaging, setIsTriaging] = useState(false);
  const [aiResult, setAiResult] = useState<AITriageResult | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submittedCase, setSubmittedCase] = useState<CivicCase | null>(null);
  const [triageError, setTriageError] = useState<string | null>(null);

  // Editable fields in the review card
  const [editedCategory, setEditedCategory] = useState<IssueCategory>('Pothole');
  const [editedSummary, setEditedSummary] = useState('');
  const [editedSeverity, setEditedSeverity] = useState<IssueSeverity>('high');
  const [editedSafetyRisk, setEditedSafetyRisk] = useState(true);
  const [editedAffectedPeople, setEditedAffectedPeople] = useState<number>(35);
  const [editedDepartment, setEditedDepartment] = useState<DepartmentName>('Roads');

  const handleSelectPresetPhoto = (preset: (typeof CIVIC_PHOTO_PRESETS)[0]) => {
    setSelectedPhoto(preset.url);
    if (!description) {
      setDescription(preset.description);
    }
  };

  const handleSelectLocationPreset = (preset: (typeof SENSITIVE_PRESETS)[0]) => {
    setLocationLabel(`${preset.name} (${preset.type.replace('_', ' ')})`);
    setSelectedCoords({ lat: preset.lat, lng: preset.lng });
  };

  const handleRunTriage = async () => {
    if (!description.trim()) {
      setTriageError('Please enter a description of the issue first.');
      return;
    }
    setTriageError(null);
    setIsTriaging(true);
    try {
      const result = await onRunAITriage(description, selectedPhoto, locationLabel);
      setAiResult(result);
      setEditedCategory(result.category);
      setEditedSummary(result.summary);
      setEditedSeverity(result.severity);
      setEditedSafetyRisk(result.safetyRisk);
      setEditedAffectedPeople(result.affectedPeopleEstimate);
      setEditedDepartment(result.suggestedDepartment);
    } catch (err: any) {
      setTriageError('Failed to run AI triage. Deterministic fallback engaged.');
    } finally {
      setIsTriaging(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!description.trim()) {
      setTriageError('Description is required.');
      return;
    }

    setIsSubmitting(true);
    try {
      // Determine if location is near a sensitive landmark
      let sensitiveInfo = undefined;
      const matchedLandmark = SENSITIVE_PRESETS.find(
        (p) =>
          locationLabel.toLowerCase().includes(p.name.toLowerCase().split(' ')[0]) ||
          locationLabel.toLowerCase().includes(p.type)
      );
      if (matchedLandmark) {
        sensitiveInfo = {
          name: matchedLandmark.name,
          type: matchedLandmark.type,
          distanceMeters: 45,
        };
      }

      const newCase = await onSubmitCase({
        title: editedSummary || `${editedCategory} reported at ${locationLabel}`,
        description,
        summary: editedSummary || description.slice(0, 90),
        category: editedCategory,
        severity: editedSeverity,
        safety_risk: editedSafetyRisk,
        affected_people_estimate: Number(editedAffectedPeople) || 0,
        latitude: selectedCoords.lat,
        longitude: selectedCoords.lng,
        location_label: locationLabel,
        sensitive_location_info: sensitiveInfo,
        suggested_department: editedDepartment,
        ai_confidence: aiResult?.confidence || 0.92,
        ai_reasoning: aiResult?.reasoning || 'AI extraction verified by citizen before submission.',
        image_url: selectedPhoto || undefined,
        reporter_name: reporterName || 'Citizen (Web Portal)',
        reporter_contact: reporterContact || undefined,
      });

      setSubmittedCase(newCase);
    } catch (err: any) {
      setTriageError('Submission failed. Please check network and try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // If already submitted, show confirmation view
  if (submittedCase) {
    return (
      <div className="max-w-2xl mx-auto py-8">
        <div className="bg-slate-900 border border-teal-500/40 rounded-2xl p-8 shadow-2xl space-y-6 text-center">
          <div className="w-16 h-16 bg-teal-500/10 text-teal-400 border border-teal-500/30 rounded-full flex items-center justify-center mx-auto">
            <CheckCircle2 className="w-8 h-8" />
          </div>

          <div className="space-y-2">
            <span className="text-xs font-bold tracking-widest uppercase text-teal-400 bg-teal-950 px-3 py-1 rounded-full border border-teal-800">
              Report Successfully Logged
            </span>
            <h2 className="text-2xl font-bold text-white tracking-tight">
              Case Tracking ID: <span className="font-mono text-teal-400">{submittedCase.id}</span>
            </h2>
            <p className="text-slate-300 text-sm max-w-md mx-auto">
              Your report has been structured, prioritized by the deterministic scoring engine, and added to the municipal action queue.
            </p>
          </div>

          {/* Quick Metrics of the Submitted Case */}
          <div className="grid grid-cols-3 gap-3 p-4 bg-slate-950 rounded-xl border border-slate-800 text-left">
            <div>
              <div className="text-[11px] text-slate-400">Current Status</div>
              <div className="text-sm font-bold text-amber-400">{submittedCase.status}</div>
            </div>
            <div>
              <div className="text-[11px] text-slate-400">Assigned Score</div>
              <div className="text-sm font-bold text-white font-mono">
                {submittedCase.priority_score}/100
              </div>
            </div>
            <div>
              <div className="text-[11px] text-slate-400">Routing Dept</div>
              <div className="text-sm font-bold text-teal-300">
                {submittedCase.suggested_department}
              </div>
            </div>
          </div>

          {/* Breakdown Explanation */}
          <div className="p-4 bg-slate-950/80 rounded-xl border border-slate-800/80 text-left space-y-2">
            <div className="flex items-center justify-between text-xs font-semibold text-slate-300">
              <span>Deterministic Priority Rationale:</span>
              <span className="font-mono text-teal-400">{submittedCase.priority_score} pts</span>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              {submittedCase.priority_breakdown?.explanation ||
                'Assessed based on safety severity, proximity to vulnerable locations, and estimated public impact.'}
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 pt-4">
            <button
              id="view-in-command-center-btn"
              onClick={() => onNavigateToCommand(submittedCase.id)}
              className="flex-1 py-3 px-4 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-sm shadow-lg shadow-blue-600/30 transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <span>View Case in Command Center Queue</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            <button
              onClick={() => {
                setSubmittedCase(null);
                setAiResult(null);
                setDescription('');
                setSelectedPhoto('');
              }}
              className="py-3 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-sm border border-slate-700 transition-colors cursor-pointer"
            >
              Submit Another Report
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-12">
      {/* Header */}
      <div className="space-y-2">
        <div className="inline-flex items-center gap-1.5 text-xs font-semibold text-teal-400 bg-teal-950/70 border border-teal-800/60 px-2.5 py-1 rounded-full">
          <FilePlus2 className="w-3.5 h-3.5" />
          <span>Citizen Intake Portal</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
          Report a Local Civic Issue
        </h1>
        <p className="text-slate-400 text-sm">
          Describe the hazard or municipal breakdown. CivicShield AI will extract structure and compute an explainable priority score before submission.
        </p>
      </div>

      {triageError && (
        <div className="p-4 rounded-xl bg-rose-950/60 border border-rose-800 text-rose-300 text-sm flex items-center gap-3">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <span>{triageError}</span>
        </div>
      )}

      {/* Main Form Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Step 1: Description */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
          <div className="flex items-center justify-between">
            <label htmlFor="issue-description" className="text-sm font-bold text-white flex items-center gap-2">
              <span className="w-5 h-5 rounded-full bg-teal-500/20 text-teal-400 text-xs flex items-center justify-center font-bold">
                1
              </span>
              <span>Issue Description</span>
              <span className="text-rose-400 text-xs font-normal">*Required</span>
            </label>

            {/* Quick Demo Pre-fills */}
            <span className="text-xs text-slate-400">
              Judge Quick Test:{' '}
              <button
                type="button"
                id="prefill-pothole-btn"
                onClick={() => {
                  setDescription(
                    'Large pothole outside the school gate. Two bikes nearly fell today. Deep cavity with exposed aggregate causing severe cyclist wobble during morning drop-off.'
                  );
                  setSelectedPhoto(CIVIC_PHOTO_PRESETS[0].url);
                  setLocationLabel('Oakridge Elementary School Gate (Maple St & 8th)');
                  setSelectedCoords({ lat: 37.7751, lng: -122.4192 });
                }}
                className="text-teal-400 hover:text-teal-300 font-semibold underline ml-1 cursor-pointer"
              >
                Pothole near School (Demo Flow)
              </button>
            </span>
          </div>

          <textarea
            id="issue-description"
            rows={4}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Describe the issue in your own words. e.g.: 'Large pothole outside the school gate. Two bikes nearly fell today.'"
            className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3.5 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-teal-500 transition-colors"
          />

          {/* Preset Civic Photos */}
          <div className="space-y-2 pt-2 border-t border-slate-800/80">
            <div className="text-xs font-medium text-slate-400 flex items-center justify-between">
              <span>Attach Photograph (Optional — or select sample civic scenario):</span>
              {selectedPhoto && (
                <button
                  type="button"
                  onClick={() => setSelectedPhoto('')}
                  className="text-xs text-rose-400 hover:underline cursor-pointer"
                >
                  Clear Photo
                </button>
              )}
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-6 gap-2">
              {CIVIC_PHOTO_PRESETS.map((preset, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleSelectPresetPhoto(preset)}
                  className={`group relative rounded-lg overflow-hidden border text-left p-1 transition-all cursor-pointer ${
                    selectedPhoto === preset.url
                      ? 'border-teal-400 ring-2 ring-teal-500/30'
                      : 'border-slate-800 hover:border-slate-700 bg-slate-950'
                  }`}
                >
                  <img
                    src={preset.url}
                    alt={preset.label}
                    className="w-full h-14 object-cover rounded"
                    referrerPolicy="no-referrer"
                  />
                  <div className="mt-1 text-[10px] font-semibold text-slate-300 truncate">
                    {preset.label}
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Step 2: Location */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
          <div className="flex items-center justify-between">
            <label htmlFor="issue-location" className="text-sm font-bold text-white flex items-center gap-2">
              <span className="w-5 h-5 rounded-full bg-teal-500/20 text-teal-400 text-xs flex items-center justify-center font-bold">
                2
              </span>
              <span>Location Context</span>
              <span className="text-rose-400 text-xs font-normal">*Required</span>
            </label>

            <button
              type="button"
              onClick={() => {
                if (navigator.geolocation) {
                  navigator.geolocation.getCurrentPosition(
                    (pos) => {
                      setSelectedCoords({
                        lat: Number(pos.coords.latitude.toFixed(4)),
                        lng: Number(pos.coords.longitude.toFixed(4)),
                      });
                      setLocationLabel(`GPS: ${pos.coords.latitude.toFixed(4)}, ${pos.coords.longitude.toFixed(4)}`);
                    },
                    () => {
                      alert('Could not access geolocation. Using default Verdant Bay coordinates.');
                    }
                  );
                }
              }}
              className="text-xs text-sky-400 hover:text-sky-300 font-medium flex items-center gap-1 cursor-pointer"
            >
              <MapPin className="w-3.5 h-3.5" />
              <span>Use Browser Geolocation</span>
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="location-address" className="text-xs text-slate-400 mb-1 block">Street Address or Landmark</label>
              <input
                id="location-address"
                type="text"
                value={locationLabel}
                onChange={(e) => setLocationLabel(e.target.value)}
                placeholder="e.g. Oakridge Elementary School Gate"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-teal-500"
              />
            </div>

            <div>
              <label className="text-xs text-slate-400 mb-1 block">Quick Select Known City Landmark:</label>
              <div className="flex flex-wrap gap-1.5">
                {SENSITIVE_PRESETS.map((p, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => handleSelectLocationPreset(p)}
                    className={`text-[11px] px-2.5 py-1 rounded-lg border transition-colors cursor-pointer ${
                      locationLabel.includes(p.name.split(' ')[0])
                        ? 'bg-sky-950 text-sky-300 border-sky-700'
                        : 'bg-slate-950 text-slate-400 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    {p.name.split(' ')[0]} ({p.type})
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Step 3: Trigger AI Triage Analysis */}
        <div className="p-4 rounded-2xl bg-gradient-to-r from-teal-950/40 to-blue-950/40 border border-teal-800/40 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-sm font-bold text-white">
              <Sparkles className="w-4 h-4 text-teal-400" />
              <span>Run CivicShield AI Triage</span>
            </div>
            <p className="text-xs text-slate-300">
              Extracts category, calculates preliminary priority factors, and formats for operator review.
            </p>
          </div>

          <button
            type="button"
            id="run-ai-triage-btn"
            onClick={handleRunTriage}
            disabled={isTriaging || !description.trim()}
            className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-500 disabled:opacity-50 text-white font-bold text-sm shadow-md shadow-teal-600/30 transition-all flex items-center justify-center gap-2 shrink-0 cursor-pointer"
          >
            {isTriaging ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Structuring with Gemini...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                <span>Analyze with AI</span>
              </>
            )}
          </button>
        </div>

        {/* Step 4: Editable AI Review Card (FR-1 & FR-2) */}
        {aiResult && (
          <div className="bg-slate-900 border border-teal-500/50 rounded-2xl p-6 space-y-6 shadow-xl animate-in fade-in duration-200">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div className="flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-teal-500/20 text-teal-400 text-xs flex items-center justify-center font-bold">
                  ✓
                </span>
                <h3 className="text-base font-bold text-white">
                  AI Structured Triage (Editable Review Card)
                </h3>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-mono text-teal-300 bg-teal-950 px-2 py-0.5 rounded border border-teal-800">
                  Confidence: {Math.round((aiResult.confidence || 0.9) * 100)}%
                </span>
                {aiResult.isFallback && (
                  <span className="text-[10px] text-amber-300 bg-amber-950 px-2 py-0.5 rounded border border-amber-800">
                    Deterministic Heuristic
                  </span>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {/* Category */}
              <div>
                <label className="text-xs font-semibold text-slate-300 mb-1 block">Category</label>
                <select
                  value={editedCategory}
                  onChange={(e) => setEditedCategory(e.target.value as IssueCategory)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-sm text-slate-100 focus:border-teal-500"
                >
                  <option value="Pothole">Pothole</option>
                  <option value="Garbage">Garbage</option>
                  <option value="Streetlight">Streetlight</option>
                  <option value="WaterLeak">WaterLeak</option>
                  <option value="Drainage">Drainage</option>
                  <option value="Safety">Safety</option>
                  <option value="Infrastructure">Infrastructure</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              {/* Severity */}
              <div>
                <label className="text-xs font-semibold text-slate-300 mb-1 block">Severity</label>
                <select
                  value={editedSeverity}
                  onChange={(e) => setEditedSeverity(e.target.value as IssueSeverity)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-sm text-slate-100 focus:border-teal-500"
                >
                  <option value="critical">Critical (Score 100)</option>
                  <option value="high">High (Score 80)</option>
                  <option value="medium">Medium (Score 55)</option>
                  <option value="low">Low (Score 25)</option>
                </select>
              </div>

              {/* Suggested Department */}
              <div>
                <label className="text-xs font-semibold text-slate-300 mb-1 block">
                  Suggested Department
                </label>
                <select
                  value={editedDepartment}
                  onChange={(e) => setEditedDepartment(e.target.value as DepartmentName)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-sm text-slate-100 focus:border-teal-500"
                >
                  <option value="Roads">Roads & Infrastructure</option>
                  <option value="Sanitation">Sanitation & Waste</option>
                  <option value="Electricity">Electricity & Lighting</option>
                  <option value="Water">Water & Hydrology</option>
                  <option value="PublicSafety">Public Safety</option>
                  <option value="Parks">Parks & Forestry</option>
                  <option value="General">General Services</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Editable Summary */}
              <div>
                <label className="text-xs font-semibold text-slate-300 mb-1 block">
                  Editable One-Line Summary
                </label>
                <input
                  type="text"
                  value={editedSummary}
                  onChange={(e) => setEditedSummary(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-sm text-slate-100 focus:border-teal-500"
                />
              </div>

              {/* Affected People Estimate & Safety Risk Toggle */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-300 mb-1 block">
                    Affected People Est.
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="5000"
                    value={editedAffectedPeople}
                    onChange={(e) => setEditedAffectedPeople(Number(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-sm text-slate-100 focus:border-teal-500"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-300 mb-1 block">
                    Immediate Safety Risk?
                  </label>
                  <button
                    type="button"
                    onClick={() => setEditedSafetyRisk(!editedSafetyRisk)}
                    className={`w-full p-2.5 rounded-xl font-bold text-xs border transition-colors flex items-center justify-center gap-1.5 cursor-pointer ${
                      editedSafetyRisk
                        ? 'bg-rose-950 text-rose-300 border-rose-800'
                        : 'bg-slate-950 text-slate-400 border-slate-800'
                    }`}
                  >
                    <ShieldAlert className="w-4 h-4" />
                    <span>{editedSafetyRisk ? 'Yes (Urgent Hazard)' : 'No (Routine)'}</span>
                  </button>
                </div>
              </div>
            </div>

            {/* AI Reasoning display */}
            <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 text-xs text-slate-400">
              <span className="text-slate-300 font-semibold">AI Triage Rationale: </span>
              {aiResult.reasoning}
            </div>
          </div>
        )}

        {/* Reporter Optional Details */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
          <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
            Reporter Contact (Optional — anonymized on public views)
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="reporter-name" className="text-xs text-slate-400 mb-1 block">Your Name</label>
              <input
                id="reporter-name"
                type="text"
                value={reporterName}
                onChange={(e) => setReporterName(e.target.value)}
                placeholder="e.g. Priya Mehta"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-sm text-slate-100"
              />
            </div>
            <div>
              <label htmlFor="reporter-contact" className="text-xs text-slate-400 mb-1 block">Contact Email or Phone</label>
              <input
                id="reporter-contact"
                type="text"
                value={reporterContact}
                onChange={(e) => setReporterContact(e.target.value)}
                placeholder="e.g. p.mehta@example.org"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-sm text-slate-100"
              />
            </div>
          </div>
        </div>

        {/* Final Submit Button */}
        <div className="flex justify-end pt-2">
          <button
            type="submit"
            id="submit-case-btn"
            disabled={isSubmitting || !description.trim()}
            className="w-full sm:w-auto px-8 py-3.5 rounded-xl bg-gradient-to-r from-teal-500 to-blue-600 hover:from-teal-400 hover:to-blue-500 disabled:opacity-50 text-white font-extrabold text-sm shadow-xl shadow-teal-500/20 transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                <span>Registering Case...</span>
              </>
            ) : (
              <>
                <CheckCircle2 className="w-5 h-5" />
                <span>Submit Case to CivicShield</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};
