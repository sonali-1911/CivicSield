import { IssueSeverity, PriorityBreakdown, SensitiveLocationInfo } from '../types';

export interface PriorityInput {
  severity: IssueSeverity;
  safetyRisk: boolean;
  affectedPeopleEstimate: number;
  corroboratingReportsCount: number;
  createdAt: string; // ISO string
  isResolved?: boolean;
  sensitiveLocationInfo?: SensitiveLocationInfo;
}

/**
 * Calculates deterministic priority score according to CivicShield Specification Section 1.8:
 * priorityScore = 0.35 * safetySeverity + 0.25 * affectedPeople + 0.20 * corroboration + 0.10 * timeUnresolved + 0.10 * sensitiveLocation
 */
export function calculatePriorityScore(input: PriorityInput): PriorityBreakdown {
  // 1. Safety severity (Weight: 35%)
  let safetySeverityRaw = 25;
  switch (input.severity) {
    case 'critical':
      safetySeverityRaw = 100;
      break;
    case 'high':
      safetySeverityRaw = 80;
      break;
    case 'medium':
      safetySeverityRaw = 55;
      break;
    case 'low':
      safetySeverityRaw = 25;
      break;
  }
  if (input.safetyRisk && safetySeverityRaw < 75) {
    safetySeverityRaw = Math.min(100, safetySeverityRaw + 25);
  }
  const safetySeverityPoints = Math.round(0.35 * safetySeverityRaw);

  // 2. Affected people (Weight: 25%) - Capped bucketed scale
  const est = Math.max(0, input.affectedPeopleEstimate || 0);
  let affectedPeopleRaw = 10;
  if (est >= 150) {
    affectedPeopleRaw = 100;
  } else if (est >= 50) {
    affectedPeopleRaw = 90;
  } else if (est >= 20) {
    affectedPeopleRaw = 75;
  } else if (est >= 6) {
    affectedPeopleRaw = 55;
  } else if (est >= 1) {
    affectedPeopleRaw = 30;
  }
  const affectedPeoplePoints = Math.round(0.25 * affectedPeopleRaw);

  // 3. Corroboration (Weight: 20%)
  const corrCount = Math.max(1, input.corroboratingReportsCount || 1);
  let corroborationRaw = 15;
  if (corrCount >= 4) {
    corroborationRaw = 100;
  } else if (corrCount === 3) {
    corroborationRaw = 85;
  } else if (corrCount === 2) {
    corroborationRaw = 60;
  } else {
    corroborationRaw = 15;
  }
  const corroborationPoints = Math.round(0.20 * corroborationRaw);

  // 4. Time unresolved (Age) (Weight: 10%)
  let timeUnresolvedRaw = 15;
  if (input.isResolved) {
    timeUnresolvedRaw = 0;
  } else {
    const createdTime = new Date(input.createdAt).getTime();
    const now = Date.now();
    const diffHours = Math.max(0, (now - createdTime) / (1000 * 60 * 60));
    if (diffHours >= 48) {
      timeUnresolvedRaw = 100;
    } else if (diffHours >= 24) {
      timeUnresolvedRaw = 80;
    } else if (diffHours >= 12) {
      timeUnresolvedRaw = 60;
    } else if (diffHours >= 4) {
      timeUnresolvedRaw = 35;
    } else {
      timeUnresolvedRaw = 15;
    }
  }
  const timeUnresolvedPoints = Math.round(0.10 * timeUnresolvedRaw);

  // 5. Sensitive location (Weight: 10%)
  let sensitiveLocationRaw = 0;
  let locAssessed = false;
  if (input.sensitiveLocationInfo && input.sensitiveLocationInfo.type !== 'none') {
    locAssessed = true;
    const dist = input.sensitiveLocationInfo.distanceMeters;
    if (dist <= 100) {
      sensitiveLocationRaw = 100;
    } else if (dist <= 300) {
      sensitiveLocationRaw = 75;
    } else if (dist <= 600) {
      sensitiveLocationRaw = 40;
    } else {
      sensitiveLocationRaw = 20;
    }
  }
  const sensitiveLocationPoints = Math.round(0.10 * sensitiveLocationRaw);

  // Final Score: clamped 0-100
  const rawSum =
    safetySeverityPoints +
    affectedPeoplePoints +
    corroborationPoints +
    timeUnresolvedPoints +
    sensitiveLocationPoints;
  const totalScore = Math.min(100, Math.max(0, rawSum));

  // Breakdown text
  const locLabel = locAssessed
    ? `Sensitive location ${sensitiveLocationPoints}/10`
    : `Sensitive location 0/10 (unassessed)`;

  const breakdownString = `Safety ${safetySeverityPoints}/35, People ${affectedPeoplePoints}/25, Corroboration ${corroborationPoints}/20, Age ${timeUnresolvedPoints}/10, ${locLabel} = ${totalScore}/100`;

  // Generate plain-language explanation strictly consistent with score
  let urgencyDescriptor = 'Low priority';
  if (totalScore >= 75) {
    urgencyDescriptor = 'Critical high priority';
  } else if (totalScore >= 60) {
    urgencyDescriptor = 'High priority';
  } else if (totalScore >= 40) {
    urgencyDescriptor = 'Moderate priority';
  }

  const rationaleParts: string[] = [];

  if (safetySeverityRaw >= 80 || input.safetyRisk) {
    rationaleParts.push(
      input.safetyRisk
        ? 'it presents an immediate public safety hazard'
        : `severity is rated as ${input.severity}`
    );
  }

  if (locAssessed && input.sensitiveLocationInfo) {
    rationaleParts.push(
      `located near ${input.sensitiveLocationInfo.name} (${input.sensitiveLocationInfo.distanceMeters}m away)`
    );
  }

  if (corrCount > 1) {
    rationaleParts.push(`has ${corrCount} corroborating citizen reports`);
  }

  if (est > 20) {
    rationaleParts.push(`impacts an estimated ${est} residents/commuters`);
  }

  if (timeUnresolvedRaw >= 60 && !input.isResolved) {
    rationaleParts.push('has remained unresolved over 12+ hours');
  }

  let explanation = '';
  if (rationaleParts.length > 0) {
    explanation = `${urgencyDescriptor} (${totalScore}/100) because ${rationaleParts.join(', ')}.`;
  } else {
    explanation = `${urgencyDescriptor} (${totalScore}/100) based on standard triage criteria with no immediate safety hazard reported.`;
  }

  return {
    safetySeverityRaw,
    safetySeverityPoints,
    affectedPeopleRaw,
    affectedPeoplePoints,
    corroborationRaw,
    corroborationPoints,
    timeUnresolvedRaw,
    timeUnresolvedPoints,
    sensitiveLocationRaw,
    sensitiveLocationPoints,
    totalScore,
    breakdownString,
    explanation,
  };
}
