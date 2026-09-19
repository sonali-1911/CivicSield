import { calculatePriorityScore } from '../src/utils/priorityScoring';
import {
  calculateDistanceMeters,
  calculateTextSimilarity,
  findDuplicateCandidates,
} from '../src/utils/duplicateDetection';
import { CivicCase } from '../src/types';

function runUnitTests() {
  console.log('--- Running CivicShield AI Specification Unit Tests ---\n');
  let passed = 0;
  let failed = 0;

  function assert(condition: boolean, testName: string) {
    if (condition) {
      console.log(`✅ PASS: ${testName}`);
      passed++;
    } else {
      console.error(`❌ FAIL: ${testName}`);
      failed++;
    }
  }

  // 1. PRIORITY SCORING TESTS (FR-3 & Section 1.8)
  console.log('Testing FR-3 Priority Scoring...');
  const highPrioritySchool = calculatePriorityScore({
    severity: 'high',
    safetyRisk: true,
    affectedPeopleEstimate: 45,
    corroboratingReportsCount: 2,
    createdAt: new Date().toISOString(),
    sensitiveLocationInfo: {
      name: 'Oakridge Elementary School',
      type: 'school',
      distanceMeters: 45,
    },
  });

  assert(
    highPrioritySchool.totalScore >= 70 && highPrioritySchool.totalScore <= 100,
    `School pothole with safety hazard and 2 reports scores high (Got ${highPrioritySchool.totalScore}/100)`
  );
  assert(
    highPrioritySchool.safetySeverityPoints === 28, // 80 * 0.35 = 28
    `Safety severity points correct (Got ${highPrioritySchool.safetySeverityPoints}/35)`
  );
  assert(
    highPrioritySchool.sensitiveLocationPoints === 10,
    `Sensitive location within 100m gets full 10/10 points (Got ${highPrioritySchool.sensitiveLocationPoints})`
  );
  assert(
    highPrioritySchool.explanation.includes('Oakridge Elementary School'),
    'Explanation mentions sensitive school location'
  );

  const lowPriorityBench = calculatePriorityScore({
    severity: 'low',
    safetyRisk: false,
    affectedPeopleEstimate: 4,
    corroboratingReportsCount: 1,
    createdAt: new Date().toISOString(),
  });
  assert(
    lowPriorityBench.totalScore < 40,
    `Cosmetic park bench issue gets fair low-priority score (Got ${lowPriorityBench.totalScore}/100)`
  );
  assert(
    lowPriorityBench.sensitiveLocationPoints === 0,
    'Unassessed/non-sensitive location awards 0 points'
  );

  // 2. DUPLICATE DETECTION TESTS (FR-6)
  console.log('\nTesting FR-6 Duplicate Detection & Proximity...');
  const dist1 = calculateDistanceMeters(37.7751, -122.4192, 37.7758, -122.4187);
  assert(dist1 < 150, `Haversine distance within 150m calculated correctly (Got ${dist1}m)`);

  const sim1 = calculateTextSimilarity(
    'Fallen large oak tree branch blocking bicycle corridor on 4th',
    'Heavy tree limb down obstructing bike lane near 4th & Pine'
  );
  assert(
    sim1 >= 0.25,
    `Text similarity for similar incidents identified (Got ${Math.round(sim1 * 100)}%)`
  );

  const mockCase1: CivicCase = {
    id: 'CS-TEST-1',
    title: 'Tree branch down on 4th bike lane',
    description: 'Tree limb blocking bike lane on 4th',
    summary: 'Tree limb down',
    category: 'Infrastructure',
    severity: 'medium',
    safety_risk: true,
    affected_people_estimate: 20,
    latitude: 37.7801,
    longitude: -122.4145,
    location_label: '4th & Pine',
    suggested_department: 'Parks',
    status: 'Reported',
    priority_score: 55,
    priority_breakdown: {} as any,
    ai_confidence: 0.9,
    ai_reasoning: 'Test',
    corroborating_reports_count: 1,
    corroborating_case_ids: [],
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  const mockCase2: CivicCase = {
    ...mockCase1,
    id: 'CS-TEST-2',
    latitude: 37.7808,
    longitude: -122.4141,
    description: 'Heavy oak limb snapped across cycle track near 4th and Pine',
  };

  const candidates = findDuplicateCandidates(mockCase1, [mockCase1, mockCase2], 300);
  assert(
    candidates.length === 1 && candidates[0].caseItem.id === 'CS-TEST-2',
    'findDuplicateCandidates correctly flagged candidate within 300m'
  );
  assert(
    candidates[0].isLikelyDuplicate === true,
    'Candidate marked as isLikelyDuplicate = true'
  );

  // 3. REPRODUCIBILITY & BOUNDS TEST
  console.log('\nTesting Determinism and Clamping Bounds...');
  const run1 = calculatePriorityScore({
    severity: 'critical',
    safetyRisk: true,
    affectedPeopleEstimate: 2000,
    corroboratingReportsCount: 10,
    createdAt: new Date(Date.now() - 100 * 3600 * 1000).toISOString(),
    sensitiveLocationInfo: { name: 'Hospital', type: 'hospital', distanceMeters: 20 },
  });
  const run2 = calculatePriorityScore({
    severity: 'critical',
    safetyRisk: true,
    affectedPeopleEstimate: 2000,
    corroboratingReportsCount: 10,
    createdAt: new Date(Date.now() - 100 * 3600 * 1000).toISOString(),
    sensitiveLocationInfo: { name: 'Hospital', type: 'hospital', distanceMeters: 20 },
  });
  assert(run1.totalScore === run2.totalScore, 'Score calculation is 100% deterministic & reproducible');
  assert(run1.totalScore <= 100 && run1.totalScore >= 0, `Score is properly clamped between 0 and 100 (Got ${run1.totalScore})`);

  console.log(`\n========================================`);
  console.log(`Results: ${passed} Passed, ${failed} Failed`);
  console.log(`========================================\n`);

  if (failed > 0) {
    process.exit(1);
  }
}

runUnitTests();
