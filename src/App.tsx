import React, { useState } from 'react';
import { useCivicShieldStore } from './data/store';
import { CivicCase } from './types';
import { Navbar } from './components/Navbar';
import { EmergencyDisclaimer } from './components/EmergencyDisclaimer';
import { LandingView } from './components/LandingView';
import { CitizenReportView } from './components/CitizenReportView';
import { CommandCenterView } from './components/CommandCenterView';
import { PublicImpactView } from './components/PublicImpactView';
import { CaseDetailDrawer } from './components/CaseDetailDrawer';
import { JudgeDemoWalkthrough } from './components/JudgeDemoWalkthrough';

export default function App() {
  const {
    cases,
    events,
    isLoading,
    createCase,
    updateCaseStatus,
    mergeCases,
    resetDemoData,
    runAITriage,
  } = useCivicShieldStore();

  const [currentView, setCurrentView] = useState<'landing' | 'citizen' | 'command' | 'impact'>(
    'landing'
  );
  const [selectedCaseId, setSelectedCaseId] = useState<string | null>(null);
  const [isJudgeDemoActive, setIsJudgeDemoActive] = useState(false);

  const selectedCase = cases.find((c) => c.id === selectedCaseId) || null;

  const openCasesCount = cases.filter((c) => c.status !== 'Resolved' && c.status !== 'Merged').length;
  const criticalCasesCount = cases.filter(
    (c) => c.status !== 'Resolved' && (c.priority_score >= 80 || c.severity === 'critical')
  ).length;

  const handleSelectCase = (caseItem: CivicCase) => {
    setSelectedCaseId(caseItem.id);
  };

  const handleSelectCaseById = (caseId: string) => {
    setSelectedCaseId(caseId);
  };

  const handleCloseDrawer = () => {
    setSelectedCaseId(null);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans antialiased selection:bg-teal-500 selection:text-white">
      {/* Emergency Non-Crisis Disclaimer */}
      <EmergencyDisclaimer />

      {/* Main Navigation */}
      <Navbar
        currentView={currentView}
        onNavigate={(view) => {
          setCurrentView(view);
          setSelectedCaseId(null);
        }}
        openCasesCount={openCasesCount}
        criticalCasesCount={criticalCasesCount}
        onResetData={resetDemoData}
        onToggleJudgeDemo={() => setIsJudgeDemoActive((prev) => !prev)}
        isJudgeDemoActive={isJudgeDemoActive}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 pt-6 sm:pt-8">
        {currentView === 'landing' && (
          <LandingView
            cases={cases}
            onNavigate={(view) => {
              setCurrentView(view);
              setSelectedCaseId(null);
            }}
            onLaunchJudgeDemo={() => {
              setIsJudgeDemoActive(true);
            }}
          />
        )}

        {currentView === 'citizen' && (
          <CitizenReportView
            onSubmitCase={createCase}
            onRunAITriage={runAITriage}
            onNavigateToCommand={(caseId) => {
              setCurrentView('command');
              if (caseId) setSelectedCaseId(caseId);
            }}
          />
        )}

        {currentView === 'command' && (
          <CommandCenterView
            cases={cases}
            events={events}
            selectedCaseId={selectedCaseId}
            onSelectCase={handleSelectCase}
            onNavigateToReport={() => setCurrentView('citizen')}
          />
        )}

        {currentView === 'impact' && <PublicImpactView cases={cases} />}
      </main>

      {/* Case Detail Drawer */}
      {selectedCase && (
        <CaseDetailDrawer
          caseItem={selectedCase}
          allCases={cases}
          events={events}
          onClose={handleCloseDrawer}
          onUpdateStatus={updateCaseStatus}
          onMergeCases={mergeCases}
          onSelectCaseById={handleSelectCaseById}
        />
      )}

      {/* 2-Minute Judge Walkthrough Overlay */}
      {isJudgeDemoActive && (
        <JudgeDemoWalkthrough
          currentView={currentView}
          onNavigate={(view) => setCurrentView(view)}
          onSelectCaseById={handleSelectCaseById}
          onClose={() => setIsJudgeDemoActive(false)}
          cases={cases}
        />
      )}

      {/* Footer */}
      <footer className="border-t border-slate-900 bg-slate-950 py-6 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <div>
            <strong>CivicShield AI</strong> — Hack Devengers 2.0 Hackathon MVP. Report less. Resolve smarter.
          </div>
          <div className="text-[11px] text-slate-600">
            Powered by Gemini 3.8 Flash & Deterministic Priority Scoring
          </div>
        </div>
      </footer>
    </div>
  );
}
