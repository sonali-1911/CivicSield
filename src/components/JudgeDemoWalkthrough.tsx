import React, { useState } from 'react';
import {
  Award,
  ChevronRight,
  ChevronLeft,
  X,
  CheckCircle2,
  Sparkles,
  Play,
  RotateCcw,
  ExternalLink,
} from 'lucide-react';
import { CivicCase } from '../types';

interface JudgeDemoWalkthroughProps {
  currentView: 'landing' | 'citizen' | 'command' | 'impact';
  onNavigate: (view: 'landing' | 'citizen' | 'command' | 'impact') => void;
  onSelectCaseById: (caseId: string) => void;
  onClose: () => void;
  cases: CivicCase[];
}

interface DemoStep {
  stepNumber: number;
  title: string;
  judgeScript: string;
  actionLabel: string;
  targetView: 'landing' | 'citizen' | 'command' | 'impact';
  highlightCaseId?: string;
  executeAction?: () => void;
}

export const JudgeDemoWalkthrough: React.FC<JudgeDemoWalkthroughProps> = ({
  currentView,
  onNavigate,
  onSelectCaseById,
  onClose,
  cases,
}) => {
  const [currentStepIdx, setCurrentStepIdx] = useState(0);

  const steps: DemoStep[] = [
    {
      stepNumber: 1,
      title: 'Introduction & Value Proposition',
      judgeScript:
        '“Civic issues are easy to report but hard to prioritize. CivicShield turns them into an explainable action queue.”',
      actionLabel: 'Go to Landing Page',
      targetView: 'landing',
    },
    {
      stepNumber: 2,
      title: 'Submit School Pothole Report',
      judgeScript:
        '“A citizen spots a severe road cavity directly outside Oakridge Elementary School where bikes are slipping during morning drop-off.”',
      actionLabel: 'Open Citizen Portal',
      targetView: 'citizen',
    },
    {
      stepNumber: 3,
      title: 'AI Structured Extraction & Review Card',
      judgeScript:
        '“CivicShield AI structures the raw text into Category: Pothole, Severity: High, Safety Risk: True, Dept: Roads. The citizen verifies before submitting.”',
      actionLabel: 'Inspect Review Card in Citizen Portal',
      targetView: 'citizen',
    },
    {
      stepNumber: 4,
      title: 'Command Center Priority Queue',
      judgeScript:
        '“In the Command Center, cases are ranked strictly by reproducible 0–100 scores. High-consequence safety hazards immediately rise to the top.”',
      actionLabel: 'Open Command Center Queue',
      targetView: 'command',
      highlightCaseId: 'CS-2026-1042',
    },
    {
      stepNumber: 5,
      title: 'Explainable Score Breakdown (FR-5)',
      judgeScript:
        '“High priority because it is a safety hazard near a school and has corroborating reports. The 5 factors (Safety 35%, People 25%, Corroboration 20%, Age 10%, Location 10%) are visible.”',
      actionLabel: 'Open CS-2026-1042 Breakdown',
      targetView: 'command',
      highlightCaseId: 'CS-2026-1042',
      executeAction: () => onSelectCaseById('CS-2026-1042'),
    },
    {
      stepNumber: 6,
      title: 'GIS Map & Proximity Duplicate Detection (FR-6)',
      judgeScript:
        '“When multiple citizens report the same issue within 300 meters, operators see matching candidates and can merge with one click.”',
      actionLabel: 'Inspect Proximity & Duplicates',
      targetView: 'command',
      highlightCaseId: 'CS-2026-1048',
      executeAction: () => onSelectCaseById('CS-2026-1048'),
    },
    {
      stepNumber: 7,
      title: 'Assignment & Field Progress',
      judgeScript:
        '“Operator assigns the ticket to Roads & Infrastructure. Status updates to In Progress with an immutable event timeline entry.”',
      actionLabel: 'Inspect Department Dispatch',
      targetView: 'command',
      highlightCaseId: 'CS-2026-1045',
      executeAction: () => onSelectCaseById('CS-2026-1045'),
    },
    {
      stepNumber: 8,
      title: 'Resolution Verification & After-Photo',
      judgeScript:
        '“The field crew uploads an after-photo proof and marks the incident Resolved, completing the audit trail.”',
      actionLabel: 'Inspect Resolved Case (CS-2026-1047)',
      targetView: 'command',
      highlightCaseId: 'CS-2026-1047',
      executeAction: () => onSelectCaseById('CS-2026-1047'),
    },
    {
      stepNumber: 9,
      title: 'Public Impact & Concluding Message',
      judgeScript:
        '“CivicShield does not replace human judgment; it makes the right decision easier to see and justify.”',
      actionLabel: 'Open Public Impact Dashboard',
      targetView: 'impact',
    },
  ];

  const currentStep = steps[currentStepIdx];

  const handleStepAction = () => {
    onNavigate(currentStep.targetView);
    if (currentStep.executeAction) {
      currentStep.executeAction();
    } else if (currentStep.highlightCaseId) {
      onSelectCaseById(currentStep.highlightCaseId);
    }
  };

  return (
    <div className="fixed bottom-4 left-4 right-4 sm:left-auto sm:right-6 sm:w-96 z-50 bg-slate-900 border-2 border-amber-500/60 rounded-2xl p-4 shadow-2xl backdrop-blur-md animate-in slide-in-from-bottom-4 duration-300">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-2 mb-3">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-full bg-amber-500/20 text-amber-400 flex items-center justify-center font-bold text-xs">
            <Award className="w-3.5 h-3.5" />
          </div>
          <div>
            <span className="text-[10px] font-bold tracking-wider uppercase text-amber-400">
              Judge Evaluation Guide
            </span>
            <h4 className="text-xs font-bold text-white">
              Step {currentStep.stepNumber} of {steps.length}: {currentStep.title}
            </h4>
          </div>
        </div>

        <button
          onClick={onClose}
          className="text-slate-400 hover:text-white p-1 rounded transition-colors cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Script Box */}
      <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 space-y-1 mb-3">
        <div className="text-[10px] font-semibold text-slate-400 uppercase">
          Presenter Pitch Script:
        </div>
        <p className="text-xs text-amber-200 font-medium italic leading-relaxed">
          {currentStep.judgeScript}
        </p>
      </div>

      {/* Interactive Trigger Button */}
      <button
        onClick={handleStepAction}
        className="w-full py-2 px-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs shadow-md transition-all flex items-center justify-center gap-1.5 cursor-pointer mb-3"
      >
        <Play className="w-3.5 h-3.5 fill-current" />
        <span>{currentStep.actionLabel}</span>
      </button>

      {/* Stepper Navigation */}
      <div className="flex items-center justify-between pt-1 border-t border-slate-800 text-xs">
        <button
          onClick={() => setCurrentStepIdx((p) => Math.max(0, p - 1))}
          disabled={currentStepIdx === 0}
          className="text-slate-400 hover:text-white disabled:opacity-30 font-semibold flex items-center gap-1 cursor-pointer"
        >
          <ChevronLeft className="w-3.5 h-3.5" />
          <span>Previous</span>
        </button>

        <span className="text-[11px] font-mono text-slate-500">
          {currentStepIdx + 1} / {steps.length}
        </span>

        <button
          onClick={() => setCurrentStepIdx((p) => Math.min(steps.length - 1, p + 1))}
          disabled={currentStepIdx === steps.length - 1}
          className="text-amber-400 hover:text-amber-300 disabled:opacity-30 font-bold flex items-center gap-1 cursor-pointer"
        >
          <span>Next Step</span>
          <ChevronRight className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};
