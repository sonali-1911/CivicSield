import { useState, useEffect, useCallback } from 'react';
import { CivicCase, CaseEvent, AITriageResult, DepartmentName, CaseStatus } from '../types';
import { getInitialSeedCases, getInitialEvents } from './seedData';

export interface CivicShieldStore {
  cases: CivicCase[];
  events: CaseEvent[];
  isLoading: boolean;
  error: string | null;
  fetchCases: () => Promise<void>;
  createCase: (caseData: Partial<CivicCase>) => Promise<CivicCase>;
  updateCaseStatus: (
    id: string,
    status: CaseStatus,
    note?: string,
    assignedDept?: DepartmentName,
    actor?: string,
    afterPhotoUrl?: string
  ) => Promise<CivicCase>;
  mergeCases: (masterId: string, duplicateId: string, note?: string) => Promise<void>;
  resetDemoData: () => Promise<void>;
  runAITriage: (
    description: string,
    imageUrl?: string,
    locationLabel?: string
  ) => Promise<AITriageResult>;
}

export function useCivicShieldStore() {
  const [cases, setCases] = useState<CivicCase[]>(() => {
    const saved = localStorage.getItem('civicshield_cases');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        // fallback
      }
    }
    return getInitialSeedCases();
  });

  const [events, setEvents] = useState<CaseEvent[]>(() => {
    const saved = localStorage.getItem('civicshield_events');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        // fallback
      }
    }
    return getInitialEvents();
  });

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Sync to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('civicshield_cases', JSON.stringify(cases));
      localStorage.setItem('civicshield_events', JSON.stringify(events));
    } catch (e) {
      console.warn('LocalStorage save failed:', e);
    }
  }, [cases, events]);

  const fetchCases = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/cases');
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data.cases)) {
          setCases(data.cases);
        }
        if (Array.isArray(data.events)) {
          setEvents(data.events);
        }
      }
    } catch (err: any) {
      console.warn('Could not fetch cases from server, using local store:', err.message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Fetch on mount
  useEffect(() => {
    fetchCases();
  }, [fetchCases]);

  const runAITriage = async (
    description: string,
    imageUrl?: string,
    locationLabel?: string
  ): Promise<AITriageResult> => {
    try {
      const res = await fetch('/api/triage', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ description, imageUrl, locationLabel }),
      });
      if (res.ok) {
        return await res.json();
      }
      throw new Error('API response was not ok');
    } catch (err) {
      console.warn('Triage API call failed, using client fallback:', err);
      // Client deterministic fallback
      const lower = (description + ' ' + (locationLabel || '')).toLowerCase();
      let category: any = 'Other';
      let suggestedDepartment: any = 'General';
      let severity: any = 'medium';
      let safetyRisk = false;
      let affectedPeopleEstimate = 20;

      if (lower.includes('pothole') || lower.includes('crater') || lower.includes('road')) {
        category = 'Pothole';
        suggestedDepartment = 'Roads';
        severity = 'high';
        safetyRisk = true;
        affectedPeopleEstimate = 45;
      } else if (lower.includes('garbage') || lower.includes('trash') || lower.includes('waste')) {
        category = 'Garbage';
        suggestedDepartment = 'Sanitation';
      } else if (lower.includes('wire') || lower.includes('spark') || lower.includes('electric')) {
        category = 'Safety';
        suggestedDepartment = 'Electricity';
        severity = 'critical';
        safetyRisk = true;
      } else if (lower.includes('streetlight') || lower.includes('lamp') || lower.includes('dark')) {
        category = 'Streetlight';
        suggestedDepartment = 'Electricity';
        severity = 'low';
      } else if (lower.includes('water') || lower.includes('leak') || lower.includes('pipe')) {
        category = 'WaterLeak';
        suggestedDepartment = 'Water';
        severity = 'high';
      } else if (lower.includes('drain') || lower.includes('flood')) {
        category = 'Drainage';
        suggestedDepartment = 'Water';
      }

      return {
        category,
        summary: description.slice(0, 90),
        severity,
        safetyRisk,
        affectedPeopleEstimate,
        suggestedDepartment,
        confidence: 0.9,
        reasoning: 'Deterministic local heuristic triage fallback.',
        isFallback: true,
      };
    }
  };

  const createCase = async (caseData: Partial<CivicCase>): Promise<CivicCase> => {
    try {
      const res = await fetch('/api/cases', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(caseData),
      });
      if (res.ok) {
        const data = await res.json();
        setCases((prev) => [data.case, ...prev]);
        setEvents((prev) => [data.event, ...prev]);
        return data.case;
      }
      throw new Error('Failed to create case on server');
    } catch (err) {
      console.warn('Local fallback case creation');
      const nowIso = new Date().toISOString();
      const newId = `CS-2026-${1054 + cases.length}`;
      const newCase = {
        ...caseData,
        id: newId,
        status: 'Reported',
        created_at: nowIso,
        updated_at: nowIso,
        corroborating_reports_count: 1,
        corroborating_case_ids: [],
      } as CivicCase;
      const newEvent: CaseEvent = {
        id: `EV-${Date.now()}`,
        case_id: newId,
        from_status: 'Reported',
        to_status: 'Reported',
        actor_label: 'Citizen (Web Portal)',
        note: 'Report submitted and triaged.',
        created_at: nowIso,
      };
      setCases((prev) => [newCase, ...prev]);
      setEvents((prev) => [newEvent, ...prev]);
      return newCase;
    }
  };

  const updateCaseStatus = async (
    id: string,
    status: CaseStatus,
    note?: string,
    assignedDept?: DepartmentName,
    actor: string = 'Operator',
    afterPhotoUrl?: string
  ): Promise<CivicCase> => {
    try {
      const res = await fetch(`/api/cases/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status,
          assigned_department: assignedDept,
          note,
          actor_label: actor,
          after_photo_url: afterPhotoUrl,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        setCases((prev) => prev.map((c) => (c.id === id ? data.case : c)));
        setEvents((prev) => [data.event, ...prev]);
        return data.case;
      }
      throw new Error('Server update failed');
    } catch (err) {
      // Local fallback
      const nowIso = new Date().toISOString();
      let updatedCase: any;
      setCases((prev) =>
        prev.map((c) => {
          if (c.id === id) {
            updatedCase = {
              ...c,
              status,
              assigned_department: assignedDept || c.assigned_department,
              after_photo_url: afterPhotoUrl || c.after_photo_url,
              resolved_at: status === 'Resolved' ? nowIso : c.resolved_at,
              updated_at: nowIso,
            };
            return updatedCase;
          }
          return c;
        })
      );
      const newEvent: CaseEvent = {
        id: `EV-${Date.now()}`,
        case_id: id,
        from_status: 'Reported',
        to_status: status,
        actor_label: actor,
        note: note || `Status changed to ${status}`,
        created_at: nowIso,
        after_photo_url: afterPhotoUrl,
      };
      setEvents((prev) => [newEvent, ...prev]);
      return updatedCase;
    }
  };

  const mergeCases = async (masterId: string, duplicateId: string, note?: string) => {
    try {
      const res = await fetch(`/api/cases/${masterId}/merge`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ duplicateId, note }),
      });
      if (res.ok) {
        const data = await res.json();
        setCases((prev) =>
          prev.map((c) => {
            if (c.id === masterId) return data.masterCase;
            if (c.id === duplicateId) return data.duplicateCase;
            return c;
          })
        );
        setEvents((prev) => [...data.events, ...prev]);
        return;
      }
      throw new Error('Merge request failed');
    } catch (err) {
      // Local fallback
      const nowIso = new Date().toISOString();
      setCases((prev) => {
        const dup = prev.find((c) => c.id === duplicateId);
        return prev.map((c) => {
          if (c.id === masterId) {
            return {
              ...c,
              corroborating_reports_count: c.corroborating_reports_count + 1,
              corroborating_case_ids: [...c.corroborating_case_ids, duplicateId],
              priority_score: Math.min(100, c.priority_score + 8),
              updated_at: nowIso,
            };
          }
          if (c.id === duplicateId) {
            return {
              ...c,
              status: 'Merged',
              merged_into_case_id: masterId,
              updated_at: nowIso,
            };
          }
          return c;
        });
      });
      setEvents((prev) => [
        {
          id: `EV-${Date.now()}-1`,
          case_id: masterId,
          from_status: 'Reported',
          to_status: 'Reported',
          actor_label: 'Operator',
          note: `Merged duplicate report ${duplicateId}. Corroboration score elevated.`,
          created_at: nowIso,
        },
        ...prev,
      ]);
    }
  };

  const resetDemoData = async () => {
    try {
      await fetch('/api/cases/reset', { method: 'POST' });
    } catch (e) {
      // ignore
    }
    const freshCases = getInitialSeedCases();
    const freshEvents = getInitialEvents();
    setCases(freshCases);
    setEvents(freshEvents);
    localStorage.removeItem('civicshield_cases');
    localStorage.removeItem('civicshield_events');
  };

  return {
    cases,
    events,
    isLoading,
    error,
    fetchCases,
    createCase,
    updateCaseStatus,
    mergeCases,
    resetDemoData,
    runAITriage,
  };
}
