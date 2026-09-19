import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';
import { getInitialSeedCases, getInitialEvents, SENSITIVE_PRESETS } from './src/data/seedData';
import { calculatePriorityScore } from './src/utils/priorityScoring';
import {
  CivicCase,
  CaseEvent,
  AITriageResult,
  IssueCategory,
  IssueSeverity,
  DepartmentName,
} from './src/types';

dotenv.config();

let genAIClient: GoogleGenAI | null = null;
function getGenAI(): GoogleGenAI | null {
  const key = process.env.GEMINI_API_KEY;
  if (!key || key === 'MY_GEMINI_API_KEY' || key.trim() === '') {
    return null;
  }
  if (!genAIClient) {
    genAIClient = new GoogleGenAI({ apiKey: key });
  }
  return genAIClient;
}

// In-memory persistent database for the server session
let casesStore: CivicCase[] = getInitialSeedCases();
let eventsStore: CaseEvent[] = getInitialEvents();

// Deterministic keyword fallback extractor
function deterministicTriageFallback(text: string, locationLabel?: string): AITriageResult {
  const lower = (text + ' ' + (locationLabel || '')).toLowerCase();

  let category: IssueCategory = 'Other';
  let suggestedDepartment: DepartmentName = 'General';
  let severity: IssueSeverity = 'medium';
  let safetyRisk = false;
  let affectedPeopleEstimate = 15;
  let reasoning = 'Deterministic keyword-based analysis of citizen report.';

  if (lower.includes('pothole') || lower.includes('crater') || lower.includes('asphalt') || lower.includes('road cave')) {
    category = 'Pothole';
    suggestedDepartment = 'Roads';
    severity = 'high';
    safetyRisk = true;
    affectedPeopleEstimate = 35;
    reasoning = 'Pavement surface failure identified in transit thoroughfare.';
  } else if (lower.includes('garbage') || lower.includes('trash') || lower.includes('waste') || lower.includes('dumping') || lower.includes('litter') || lower.includes('smell')) {
    category = 'Garbage';
    suggestedDepartment = 'Sanitation';
    severity = 'medium';
    safetyRisk = false;
    affectedPeopleEstimate = 60;
    reasoning = 'Solid waste overflow or improper disposal in pedestrian environment.';
  } else if (lower.includes('wire') || lower.includes('spark') || lower.includes('electric') || lower.includes('electrocution') || lower.includes('shock')) {
    category = 'Safety';
    suggestedDepartment = 'Electricity';
    severity = 'critical';
    safetyRisk = true;
    affectedPeopleEstimate = 50;
    reasoning = 'Live electrical or sparking conductor hazard near public area.';
  } else if (lower.includes('streetlight') || lower.includes('lamp') || lower.includes('lighting') || lower.includes('dark street')) {
    category = 'Streetlight';
    suggestedDepartment = 'Electricity';
    severity = 'low';
    safetyRisk = false;
    affectedPeopleEstimate = 20;
    reasoning = 'Municipal luminaire outage without acute secondary hazards.';
  } else if (lower.includes('water leak') || lower.includes('pipe') || lower.includes('burst') || lower.includes('gushing') || lower.includes('hydrant')) {
    category = 'WaterLeak';
    suggestedDepartment = 'Water';
    severity = lower.includes('hospital') || lower.includes('flood') ? 'critical' : 'high';
    safetyRisk = true;
    affectedPeopleEstimate = 75;
    reasoning = 'Pressurized potable utility conveyance line breach.';
  } else if (lower.includes('drain') || lower.includes('flood') || lower.includes('gutter') || lower.includes('ponding') || lower.includes('sewer backup')) {
    category = 'Drainage';
    suggestedDepartment = 'Water';
    severity = 'medium';
    safetyRisk = false;
    affectedPeopleEstimate = 40;
    reasoning = 'Catch basin or storm water conveyance blockage.';
  } else if (lower.includes('tree') || lower.includes('branch') || lower.includes('bench') || lower.includes('curb') || lower.includes('sidewalk') || lower.includes('bridge') || lower.includes('handrail') || lower.includes('manhole')) {
    category = 'Infrastructure';
    suggestedDepartment = lower.includes('tree') || lower.includes('bench') ? 'Parks' : 'Roads';
    severity = 'medium';
    safetyRisk = lower.includes('bike') || lower.includes('fall') || lower.includes('traffic');
    affectedPeopleEstimate = 30;
    reasoning = 'Physical public infrastructure or urban forestry asset impairment.';
  }

  if (lower.includes('school') || lower.includes('hospital') || lower.includes('danger') || lower.includes('fall') || lower.includes('crash') || lower.includes('bike fell') || lower.includes('nearly fell')) {
    safetyRisk = true;
    if (severity === 'low') severity = 'medium';
    if (severity === 'medium') severity = 'high';
  }

  // Generate crisp one-line summary
  let summary = text.slice(0, 90).trim();
  if (text.length > 90) summary += '...';

  return {
    category,
    summary,
    severity,
    safetyRisk,
    affectedPeopleEstimate,
    suggestedDepartment,
    confidence: 0.88,
    reasoning,
    isFallback: true,
  };
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: '10mb' }));

  // API 1: Health check
  app.get('/api/health', (req, res) => {
    res.json({
      status: 'ok',
      service: 'CivicShield AI Operations Backend',
      geminiConfigured: !!getGenAI(),
      casesCount: casesStore.length,
    });
  });

  // API 2: AI Triage endpoint (with prompt contract & fallback)
  app.post('/api/triage', async (req, res) => {
    const { description, imageUrl, locationLabel } = req.body;

    if (!description || typeof description !== 'string') {
      return res.status(400).json({ error: 'Description is required for triage.' });
    }

    const ai = getGenAI();

    if (!ai) {
      const fallbackResult = deterministicTriageFallback(description, locationLabel);
      return res.json(fallbackResult);
    }

    try {
      const prompt = `You are CivicShield Triage, an assistant that structures civic issue reports.
Return JSON only. Do not invent an exact address, authority response, or resolution.
Classify the report using one category from:
Pothole, Garbage, Streetlight, WaterLeak, Drainage, Safety, Infrastructure, Other.
Estimate severity as critical, high, medium, or low. Explain uncertainty briefly.
Estimate affected people conservatively. If unknown, return 0.
Suggest one department from Roads, Sanitation, Electricity, Water, PublicSafety, Parks, or General. Extract safetyRisk as true or false.

Schema:
{
  "category": string,
  "summary": string,
  "severity": string,
  "safetyRisk": boolean,
  "affectedPeopleEstimate": number,
  "suggestedDepartment": string,
  "confidence": number,
  "reasoning": string
}

Report: ${description}
Location label context: ${locationLabel || 'None provided'}
Image context: ${imageUrl ? 'Attached photo of reported issue' : 'No photo provided'}`;

      const response = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
          temperature: 0.1,
        },
      });

      const rawText = response.text || '';
      let parsed: any;
      try {
        parsed = JSON.parse(rawText);
      } catch (parseErr) {
        const jsonMatch = rawText.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          parsed = JSON.parse(jsonMatch[0]);
        } else {
          throw new Error('Could not parse JSON response from Gemini');
        }
      }

      // Validate & clamp fields according to strict spec contract
      const validCategories: IssueCategory[] = [
        'Pothole',
        'Garbage',
        'Streetlight',
        'WaterLeak',
        'Drainage',
        'Safety',
        'Infrastructure',
        'Other',
      ];
      const validSeverities: IssueSeverity[] = ['critical', 'high', 'medium', 'low'];
      const validDepartments: DepartmentName[] = [
        'Roads',
        'Sanitation',
        'Electricity',
        'Water',
        'PublicSafety',
        'Parks',
        'General',
      ];

      const category: IssueCategory = validCategories.includes(parsed.category)
        ? parsed.category
        : 'Other';
      const severity: IssueSeverity = validSeverities.includes(parsed.severity?.toLowerCase())
        ? parsed.severity.toLowerCase()
        : 'medium';
      const suggestedDepartment: DepartmentName = validDepartments.includes(
        parsed.suggestedDepartment
      )
        ? parsed.suggestedDepartment
        : 'General';

      const result: AITriageResult = {
        category,
        summary: String(parsed.summary || description.slice(0, 90)).trim(),
        severity,
        safetyRisk: Boolean(parsed.safetyRisk),
        affectedPeopleEstimate: Math.max(
          0,
          Math.min(5000, Number(parsed.affectedPeopleEstimate) || 0)
        ),
        suggestedDepartment,
        confidence: Math.max(0, Math.min(1, Number(parsed.confidence) || 0.9)),
        reasoning: String(parsed.reasoning || 'Automated classification using civic ontology'),
        isFallback: false,
      };

      return res.json(result);
    } catch (err: any) {
      console.warn('Gemini triage failed, falling back to deterministic parser:', err.message);
      const fallbackResult = deterministicTriageFallback(description, locationLabel);
      return res.json(fallbackResult);
    }
  });

  // API 3: List all cases
  app.get('/api/cases', (req, res) => {
    res.json({
      cases: casesStore,
      events: eventsStore,
    });
  });

  // API 4: Create new case
  app.post('/api/cases', (req, res) => {
    try {
      const {
        title,
        description,
        summary,
        category,
        severity,
        safety_risk,
        affected_people_estimate,
        latitude,
        longitude,
        location_label,
        sensitive_location_info,
        suggested_department,
        ai_confidence,
        ai_reasoning,
        image_url,
        reporter_name,
        reporter_contact,
      } = req.body;

      if (!description || !category || !location_label) {
        return res.status(400).json({ error: 'Missing required report fields' });
      }

      const caseIdNumber = 1054 + casesStore.length;
      const caseId = `CS-2026-${caseIdNumber}`;
      const nowIso = new Date().toISOString();

      const priorityBreakdown = calculatePriorityScore({
        severity: severity || 'medium',
        safetyRisk: Boolean(safety_risk),
        affectedPeopleEstimate: Number(affected_people_estimate) || 0,
        corroboratingReportsCount: 1,
        createdAt: nowIso,
        sensitiveLocationInfo: sensitive_location_info,
      });

      const newCase: CivicCase = {
        id: caseId,
        title: title || `${category} reported at ${location_label}`,
        description,
        summary: summary || description.slice(0, 90),
        category,
        severity: severity || 'medium',
        safety_risk: Boolean(safety_risk),
        affected_people_estimate: Number(affected_people_estimate) || 0,
        latitude: Number(latitude) || 37.7749,
        longitude: Number(longitude) || -122.4194,
        location_label,
        sensitive_location_info,
        suggested_department: suggested_department || 'General',
        status: 'Reported',
        priority_score: priorityBreakdown.totalScore,
        priority_breakdown: priorityBreakdown,
        ai_confidence: Number(ai_confidence) || 0.9,
        ai_reasoning: ai_reasoning || 'Categorized via CivicShield triage.',
        corroborating_reports_count: 1,
        corroborating_case_ids: [],
        image_url: image_url || undefined,
        reporter_name: reporter_name || 'Anonymous Citizen',
        reporter_contact: reporter_contact || undefined,
        created_at: nowIso,
        updated_at: nowIso,
      };

      casesStore.unshift(newCase);

      const newEvent: CaseEvent = {
        id: `EV-${Date.now()}`,
        case_id: caseId,
        from_status: 'Reported',
        to_status: 'Reported',
        actor_label: reporter_name ? `Citizen (${reporter_name})` : 'Citizen (Web Portal)',
        note: `Case registered. AI extracted ${category} with priority score ${priorityBreakdown.totalScore}/100.`,
        created_at: nowIso,
      };
      eventsStore.unshift(newEvent);

      return res.status(201).json({
        case: newCase,
        event: newEvent,
      });
    } catch (err: any) {
      console.error('Error creating case:', err);
      return res.status(500).json({ error: 'Failed to create case' });
    }
  });

  // API 5: Update case (status, department, assignment, resolution)
  app.patch('/api/cases/:id', (req, res) => {
    const { id } = req.params;
    const { status, assigned_department, assigned_to, note, after_photo_url, actor_label } =
      req.body;

    const caseIndex = casesStore.findIndex((c) => c.id === id);
    if (caseIndex === -1) {
      return res.status(404).json({ error: 'Case not found' });
    }

    const currentCase = casesStore[caseIndex];
    const fromStatus = currentCase.status;
    const nowIso = new Date().toISOString();

    const updatedCase: CivicCase = {
      ...currentCase,
      updated_at: nowIso,
    };

    if (assigned_department) {
      updatedCase.assigned_department = assigned_department;
    }
    if (assigned_to !== undefined) {
      updatedCase.assigned_to = assigned_to;
    }
    if (status && status !== currentCase.status) {
      updatedCase.status = status;
      if (status === 'Resolved') {
        updatedCase.resolved_at = nowIso;
        if (after_photo_url) {
          updatedCase.after_photo_url = after_photo_url;
        }
      }
    }

    // Recalculate priority with new resolution status
    updatedCase.priority_breakdown = calculatePriorityScore({
      severity: updatedCase.severity,
      safetyRisk: updatedCase.safety_risk,
      affectedPeopleEstimate: updatedCase.affected_people_estimate,
      corroboratingReportsCount: updatedCase.corroborating_reports_count,
      createdAt: updatedCase.created_at,
      isResolved: updatedCase.status === 'Resolved',
      sensitiveLocationInfo: updatedCase.sensitive_location_info,
    });
    updatedCase.priority_score = updatedCase.priority_breakdown.totalScore;

    casesStore[caseIndex] = updatedCase;

    // Create timeline event
    const event: CaseEvent = {
      id: `EV-${Date.now()}`,
      case_id: id,
      from_status: fromStatus,
      to_status: updatedCase.status,
      actor_label: actor_label || 'Operator',
      note: note || (status ? `Status updated from ${fromStatus} to ${updatedCase.status}` : 'Case updated'),
      created_at: nowIso,
      after_photo_url: after_photo_url || undefined,
    };
    eventsStore.unshift(event);

    return res.json({
      case: updatedCase,
      event,
    });
  });

  // API 6: Merge duplicate case into master case
  app.post('/api/cases/:id/merge', (req, res) => {
    const { id: masterId } = req.params;
    const { duplicateId, actorLabel, note } = req.body;

    const masterIndex = casesStore.findIndex((c) => c.id === masterId);
    const dupIndex = casesStore.findIndex((c) => c.id === duplicateId);

    if (masterIndex === -1 || dupIndex === -1) {
      return res.status(404).json({ error: 'Master or duplicate case not found' });
    }

    const masterCase = casesStore[masterIndex];
    const dupCase = casesStore[dupIndex];
    const nowIso = new Date().toISOString();

    // Update master case: increment corroboration, merge corroborating IDs
    const newCorrCount = masterCase.corroborating_reports_count + 1;
    const newCorrIds = Array.from(new Set([...masterCase.corroborating_case_ids, dupCase.id]));

    const updatedBreakdown = calculatePriorityScore({
      severity: masterCase.severity,
      safetyRisk: masterCase.safety_risk,
      affectedPeopleEstimate: Math.max(
        masterCase.affected_people_estimate,
        dupCase.affected_people_estimate
      ),
      corroboratingReportsCount: newCorrCount,
      createdAt: masterCase.created_at,
      sensitiveLocationInfo: masterCase.sensitive_location_info || dupCase.sensitive_location_info,
    });

    const updatedMaster: CivicCase = {
      ...masterCase,
      corroborating_reports_count: newCorrCount,
      corroborating_case_ids: newCorrIds,
      priority_breakdown: updatedBreakdown,
      priority_score: updatedBreakdown.totalScore,
      ai_confidence: Math.min(0.99, masterCase.ai_confidence + 0.04),
      updated_at: nowIso,
    };
    casesStore[masterIndex] = updatedMaster;

    // Mark duplicate case as merged
    const updatedDup: CivicCase = {
      ...dupCase,
      status: 'Merged',
      merged_into_case_id: masterId,
      updated_at: nowIso,
    };
    casesStore[dupIndex] = updatedDup;

    // Events for both
    const masterEvent: CaseEvent = {
      id: `EV-${Date.now()}-1`,
      case_id: masterId,
      from_status: masterCase.status,
      to_status: masterCase.status,
      actor_label: actorLabel || 'Operator',
      note:
        note ||
        `Merged duplicate report ${dupCase.id}. Corroborating reports increased to ${newCorrCount}. Priority recalibrated to ${updatedBreakdown.totalScore}/100.`,
      created_at: nowIso,
    };

    const dupEvent: CaseEvent = {
      id: `EV-${Date.now()}-2`,
      case_id: dupCase.id,
      from_status: dupCase.status,
      to_status: 'Merged',
      actor_label: actorLabel || 'Operator',
      note: `Merged into primary case ${masterId} by operator.`,
      created_at: nowIso,
    };

    eventsStore.unshift(masterEvent);
    eventsStore.unshift(dupEvent);

    return res.json({
      masterCase: updatedMaster,
      duplicateCase: updatedDup,
      events: [masterEvent, dupEvent],
    });
  });

  // API 7: Reset to initial seeded demo data
  app.post('/api/cases/reset', (req, res) => {
    casesStore = getInitialSeedCases();
    eventsStore = getInitialEvents();
    res.json({
      message: 'Demo data successfully reset to 12 realistic civic scenarios',
      casesCount: casesStore.length,
      eventsCount: eventsStore.length,
    });
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`CivicShield AI Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
