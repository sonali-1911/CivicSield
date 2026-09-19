import { CivicCase, CaseEvent, DepartmentInfo, DepartmentName } from '../types';
import { calculatePriorityScore } from '../utils/priorityScoring';

export const DEPARTMENTS: Record<DepartmentName, DepartmentInfo> = {
  Roads: {
    id: 'Roads',
    name: 'Roads & Infrastructure',
    color: '#d97706',
    response_target_hours: 24,
    contactLead: 'Foreman Dave Reynolds',
  },
  Sanitation: {
    id: 'Sanitation',
    name: 'Waste Management & Sanitation',
    color: '#059669',
    response_target_hours: 12,
    contactLead: 'Supervisor Elena Ramos',
  },
  Electricity: {
    id: 'Electricity',
    name: 'Power & Street Lighting',
    color: '#6366f1',
    response_target_hours: 8,
    contactLead: 'Chief Tech Marcus Vance',
  },
  Water: {
    id: 'Water',
    name: 'Water Supply & Hydrology',
    color: '#0284c7',
    response_target_hours: 6,
    contactLead: 'Eng. Farah Al-Mansoor',
  },
  PublicSafety: {
    id: 'PublicSafety',
    name: 'Public Safety & Code Enforcement',
    color: '#e11d48',
    response_target_hours: 2,
    contactLead: 'Officer Sarah Chen',
  },
  Parks: {
    id: 'Parks',
    name: 'Parks & Urban Forestry',
    color: '#0d9488',
    response_target_hours: 48,
    contactLead: 'Director Liam Cooper',
  },
  General: {
    id: 'General',
    name: 'Municipal General Services',
    color: '#475569',
    response_target_hours: 36,
    contactLead: 'Coordinator Maya Lin',
  },
};

export const SENSITIVE_PRESETS = [
  { name: 'Oakridge Elementary School', type: 'school' as const, lat: 37.7749, lng: -122.4194 },
  { name: 'St. Jude Regional Hospital', type: 'hospital' as const, lat: 37.7812, lng: -122.4112 },
  { name: 'Central Metro Transit Station', type: 'transit_hub' as const, lat: 37.7833, lng: -122.4089 },
  { name: 'Golden Age Senior Living Complex', type: 'dense_public' as const, lat: 37.7715, lng: -122.4245 },
  { name: 'Central Marketplace Plaza', type: 'dense_public' as const, lat: 37.7788, lng: -122.4167 },
  { name: 'Harbor Commercial Strip', type: 'dense_public' as const, lat: 37.7876, lng: -122.4011 },
];

export const CIVIC_PHOTO_PRESETS = [
  {
    label: 'Deep Asphalt Pothole',
    category: 'Pothole',
    url: 'https://images.unsplash.com/photo-1515162816999-a0c47dc192f7?auto=format&fit=crop&w=800&q=80',
    description: 'Large pothole outside the school gate. Two bikes nearly fell today.',
  },
  {
    label: 'Overflowing Waste Bins',
    category: 'Garbage',
    url: 'https://images.unsplash.com/photo-1605600659908-0ef719419d41?auto=format&fit=crop&w=800&q=80',
    description: 'Overflowing commercial waste containers spilling onto pedestrian walkway near Central Market Gate 4.',
  },
  {
    label: 'Dark Broken Streetlight',
    category: 'Streetlight',
    url: 'https://images.unsplash.com/photo-1509114397022-ed747cca3f65?auto=format&fit=crop&w=800&q=80',
    description: 'Streetlight pole #42 fixture dark for three consecutive nights on Elmwood residential lane.',
  },
  {
    label: 'Burst Water Main',
    category: 'WaterLeak',
    url: 'https://images.unsplash.com/photo-1584467735871-8e85353a8413?auto=format&fit=crop&w=800&q=80',
    description: 'High-pressure clean water escaping cracked underground pipe near hospital emergency entrance.',
  },
  {
    label: 'Clogged Storm Drain',
    category: 'Drainage',
    url: 'https://images.unsplash.com/photo-1541888946425-d0fbb18615f3?auto=format&fit=crop&w=800&q=80',
    description: 'Curbside catch basin blocked with mud and leaves, pooling 6 inches of water along Maple Avenue sidewalk.',
  },
  {
    label: 'Fallen Tree Branch',
    category: 'Infrastructure',
    url: 'https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?auto=format&fit=crop&w=800&q=80',
    description: 'Heavy oak limb snapped across the two-way cycle lane near 4th and Pine, blocking cyclist passage.',
  },
];

export function getInitialSeedCases(): CivicCase[] {
  const now = Date.now();
  const hoursAgo = (h: number) => new Date(now - h * 3600 * 1000).toISOString();

  // Case 1: High priority pothole near school with two corroborating reports (Core Judge Demo!)
  const c1Created = hoursAgo(18);
  const c1Breakdown = calculatePriorityScore({
    severity: 'high',
    safetyRisk: true,
    affectedPeopleEstimate: 45,
    corroboratingReportsCount: 2,
    createdAt: c1Created,
    sensitiveLocationInfo: {
      name: 'Oakridge Elementary School',
      type: 'school',
      distanceMeters: 45,
    },
  });

  // Case 2: Overflowing garbage point near market
  const c2Created = hoursAgo(14);
  const c2Breakdown = calculatePriorityScore({
    severity: 'medium',
    safetyRisk: false,
    affectedPeopleEstimate: 120,
    corroboratingReportsCount: 1,
    createdAt: c2Created,
    sensitiveLocationInfo: {
      name: 'Central Marketplace Plaza',
      type: 'dense_public',
      distanceMeters: 90,
    },
  });

  // Case 3: Broken streetlight on low-traffic road (Fair queue ordering demo - low/medium)
  const c3Created = hoursAgo(6);
  const c3Breakdown = calculatePriorityScore({
    severity: 'low',
    safetyRisk: false,
    affectedPeopleEstimate: 12,
    corroboratingReportsCount: 1,
    createdAt: c3Created,
    sensitiveLocationInfo: undefined,
  });

  // Case 4: Blocked drain after heavy rain
  const c4Created = hoursAgo(10);
  const c4Breakdown = calculatePriorityScore({
    severity: 'high',
    safetyRisk: false,
    affectedPeopleEstimate: 35,
    corroboratingReportsCount: 1,
    createdAt: c4Created,
    sensitiveLocationInfo: undefined,
  });

  // Case 5: Water leak near hospital
  const c5Created = hoursAgo(5);
  const c5Breakdown = calculatePriorityScore({
    severity: 'critical',
    safetyRisk: true,
    affectedPeopleEstimate: 80,
    corroboratingReportsCount: 1,
    createdAt: c5Created,
    sensitiveLocationInfo: {
      name: 'St. Jude Regional Hospital',
      type: 'hospital',
      distanceMeters: 60,
    },
  });

  // Case 6: Resolved case with after-photo and timeline
  const c6Created = hoursAgo(36);
  const c6Breakdown = calculatePriorityScore({
    severity: 'high',
    safetyRisk: true,
    affectedPeopleEstimate: 60,
    corroboratingReportsCount: 2,
    createdAt: c6Created,
    isResolved: true,
    sensitiveLocationInfo: {
      name: 'Riverfront Promenade',
      type: 'dense_public',
      distanceMeters: 30,
    },
  });

  // Case 7 & 8: Duplicate candidates ready to merge
  const c7Created = hoursAgo(8);
  const c7Breakdown = calculatePriorityScore({
    severity: 'medium',
    safetyRisk: true,
    affectedPeopleEstimate: 25,
    corroboratingReportsCount: 1,
    createdAt: c7Created,
    sensitiveLocationInfo: undefined,
  });

  const c8Created = hoursAgo(3);
  const c8Breakdown = calculatePriorityScore({
    severity: 'medium',
    safetyRisk: true,
    affectedPeopleEstimate: 20,
    corroboratingReportsCount: 1,
    createdAt: c8Created,
    sensitiveLocationInfo: undefined,
  });

  // Case 9: Low-priority fair queue benchmark (Sunset Meadow park bench)
  const c9Created = hoursAgo(72);
  const c9Breakdown = calculatePriorityScore({
    severity: 'low',
    safetyRisk: false,
    affectedPeopleEstimate: 4,
    corroboratingReportsCount: 1,
    createdAt: c9Created,
    sensitiveLocationInfo: undefined,
  });

  // Case 10: Critical exposed wire near playground
  const c10Created = hoursAgo(2);
  const c10Breakdown = calculatePriorityScore({
    severity: 'critical',
    safetyRisk: true,
    affectedPeopleEstimate: 70,
    corroboratingReportsCount: 2,
    createdAt: c10Created,
    sensitiveLocationInfo: {
      name: 'Oakridge Community Playground',
      type: 'school',
      distanceMeters: 80,
    },
  });

  // Case 11: Jammed crosswalk signal at Senior Living
  const c11Created = hoursAgo(16);
  const c11Breakdown = calculatePriorityScore({
    severity: 'high',
    safetyRisk: true,
    affectedPeopleEstimate: 95,
    corroboratingReportsCount: 1,
    createdAt: c11Created,
    sensitiveLocationInfo: {
      name: 'Golden Age Senior Living Complex',
      type: 'dense_public',
      distanceMeters: 40,
    },
  });

  // Case 12: Sunken manhole on commercial corridor
  const c12Created = hoursAgo(28);
  const c12Breakdown = calculatePriorityScore({
    severity: 'medium',
    safetyRisk: false,
    affectedPeopleEstimate: 150,
    corroboratingReportsCount: 1,
    createdAt: c12Created,
    sensitiveLocationInfo: {
      name: 'Harbor Commercial Strip',
      type: 'dense_public',
      distanceMeters: 110,
    },
  });

  return [
    {
      id: 'CS-2026-1042',
      title: 'Large asphalt pothole outside school entrance',
      description:
        'Large pothole outside the school gate. Two bikes nearly fell today. Deep cavity with exposed aggregate causing severe cyclist wobble during morning drop-off.',
      summary: 'Hazardous deep pothole located directly in school arrival lane risking bike falls.',
      category: 'Pothole',
      severity: 'high',
      safety_risk: true,
      affected_people_estimate: 45,
      latitude: 37.7751,
      longitude: -122.4192,
      location_label: 'Oakridge Elementary School Gate (Maple St & 8th)',
      sensitive_location_info: {
        name: 'Oakridge Elementary School',
        type: 'school',
        distanceMeters: 45,
      },
      suggested_department: 'Roads',
      status: 'Reported',
      priority_score: c1Breakdown.totalScore,
      priority_breakdown: c1Breakdown,
      ai_confidence: 0.94,
      ai_reasoning:
        'Road pavement failure situated in school transition corridor with observed cyclist near-misses.',
      corroborating_reports_count: 2,
      corroborating_case_ids: ['CS-2026-1049'],
      image_url:
        'https://images.unsplash.com/photo-1515162816999-a0c47dc192f7?auto=format&fit=crop&w=800&q=80',
      reporter_name: 'Priya Mehta (Parent)',
      reporter_contact: 'p.mehta@example.org',
      created_at: c1Created,
      updated_at: c1Created,
    },
    {
      id: 'CS-2026-1043',
      title: 'Overflowing commercial waste containers at Market Gate 4',
      description:
        'Commercial bins overflowing into pedestrian walkway near Market Gate 4. Attracting rodents and spreading odor across busy food shopping corridor.',
      summary: 'Severe trash bin overflow blocking pedestrian sidewalk at central food market.',
      category: 'Garbage',
      severity: 'medium',
      safety_risk: false,
      affected_people_estimate: 120,
      latitude: 37.7791,
      longitude: -122.4163,
      location_label: 'Central Market Plaza, Gate 4',
      sensitive_location_info: {
        name: 'Central Marketplace Plaza',
        type: 'dense_public',
        distanceMeters: 90,
      },
      suggested_department: 'Sanitation',
      assigned_department: 'Sanitation',
      assigned_to: 'Sanitation Truck Unit #3',
      status: 'Assigned',
      priority_score: c2Breakdown.totalScore,
      priority_breakdown: c2Breakdown,
      ai_confidence: 0.91,
      ai_reasoning:
        'High pedestrian footfall public market with hygiene risks and sidewalk obstruction.',
      corroborating_reports_count: 1,
      corroborating_case_ids: [],
      image_url:
        'https://images.unsplash.com/photo-1605600659908-0ef719419d41?auto=format&fit=crop&w=800&q=80',
      reporter_name: 'David K., Vendor',
      created_at: c2Created,
      updated_at: hoursAgo(8),
    },
    {
      id: 'CS-2026-1044',
      title: 'Broken streetlight fixture on Elmwood residential lane',
      description:
        'Streetlight pole #42 fixture has been dark for three consecutive nights on Elmwood quiet cul-de-sac. Low evening traffic.',
      summary: 'Residential cul-de-sac luminaire non-functional; low immediate traffic risk.',
      category: 'Streetlight',
      severity: 'low',
      safety_risk: false,
      affected_people_estimate: 12,
      latitude: 37.7689,
      longitude: -122.4312,
      location_label: 'Elmwood Lane near house #18',
      suggested_department: 'Electricity',
      status: 'Reported',
      priority_score: c3Breakdown.totalScore,
      priority_breakdown: c3Breakdown,
      ai_confidence: 0.88,
      ai_reasoning: 'Non-vital lighting fixture on low-speed residential dead-end street.',
      corroborating_reports_count: 1,
      corroborating_case_ids: [],
      image_url:
        'https://images.unsplash.com/photo-1509114397022-ed747cca3f65?auto=format&fit=crop&w=800&q=80',
      reporter_name: 'Arthur Pendelton',
      created_at: c3Created,
      updated_at: c3Created,
    },
    {
      id: 'CS-2026-1045',
      title: 'Blocked storm drain basin after rain causing road ponding',
      description:
        'Curbside storm catch basin completely obstructed with packed leaves and urban runoff silt. 6-inch pool spreading across Maple Ave.',
      summary: 'Storm drain clogged with debris resulting in deep roadway ponding.',
      category: 'Drainage',
      severity: 'high',
      safety_risk: false,
      affected_people_estimate: 35,
      latitude: 37.7734,
      longitude: -122.4215,
      location_label: 'Corner of Maple Ave & 10th St',
      suggested_department: 'Water',
      assigned_department: 'Water',
      assigned_to: 'Drainage Vacuum Crew #1',
      status: 'In Progress',
      priority_score: c4Breakdown.totalScore,
      priority_breakdown: c4Breakdown,
      ai_confidence: 0.92,
      ai_reasoning:
        'Drainage failure causing standing surface water with potential vehicle hydroplaning.',
      corroborating_reports_count: 1,
      corroborating_case_ids: [],
      image_url:
        'https://images.unsplash.com/photo-1541888946425-d0fbb18615f3?auto=format&fit=crop&w=800&q=80',
      reporter_name: 'Maria Torres',
      created_at: c4Created,
      updated_at: hoursAgo(2),
    },
    {
      id: 'CS-2026-1046',
      title: 'Pressurized water main leak near hospital ambulance dock',
      description:
        'Potable water gushing from underground rupture directly adjacent to St. Jude Hospital ER ambulance approach. Water pooling into basement drive.',
      summary: 'Critical water main rupture threatening access to regional hospital emergency portal.',
      category: 'WaterLeak',
      severity: 'critical',
      safety_risk: true,
      affected_people_estimate: 80,
      latitude: 37.7815,
      longitude: -122.4115,
      location_label: 'St. Jude Hospital ER Access Way',
      sensitive_location_info: {
        name: 'St. Jude Regional Hospital',
        type: 'hospital',
        distanceMeters: 60,
      },
      suggested_department: 'Water',
      assigned_department: 'Water',
      assigned_to: 'Emergency Pipeline Repair Crew',
      status: 'In Progress',
      priority_score: c5Breakdown.totalScore,
      priority_breakdown: c5Breakdown,
      ai_confidence: 0.97,
      ai_reasoning:
        'Critical utility failure impacting primary medical emergency egress and critical infrastructure.',
      corroborating_reports_count: 1,
      corroborating_case_ids: [],
      image_url:
        'https://images.unsplash.com/photo-1584467735871-8e85353a8413?auto=format&fit=crop&w=800&q=80',
      reporter_name: 'Facility Security Desk',
      created_at: c5Created,
      updated_at: hoursAgo(1),
    },
    {
      id: 'CS-2026-1047',
      title: 'Damaged safety handrail on Riverfront pedestrian walkway',
      description:
        'Steel handrail detached from bridge anchor bolts, leaving a 12-foot unguarded fall into the canal. Completed inspection and welded new structural stanchions.',
      summary: 'Structural handrail failure repaired with reinforced anchor plates.',
      category: 'Infrastructure',
      severity: 'high',
      safety_risk: true,
      affected_people_estimate: 60,
      latitude: 37.7845,
      longitude: -122.4042,
      location_label: 'Riverfront Promenade West Span',
      sensitive_location_info: {
        name: 'Riverfront Promenade',
        type: 'dense_public',
        distanceMeters: 30,
      },
      suggested_department: 'Infrastructure' as any,
      assigned_department: 'Roads',
      assigned_to: 'Civic Welding Team B',
      status: 'Resolved',
      priority_score: c6Breakdown.totalScore,
      priority_breakdown: c6Breakdown,
      ai_confidence: 0.95,
      ai_reasoning: 'Fall hazard over public waterway in high pedestrian traffic corridor.',
      corroborating_reports_count: 2,
      corroborating_case_ids: [],
      image_url:
        'https://images.unsplash.com/photo-1541888946425-d0fbb18615f3?auto=format&fit=crop&w=800&q=80',
      after_photo_url:
        'https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=800&q=80',
      reporter_name: 'Civic Patrol Volunteer',
      created_at: c6Created,
      updated_at: hoursAgo(4),
      resolved_at: hoursAgo(4),
    },
    {
      id: 'CS-2026-1048',
      title: 'Fallen large oak tree branch blocking bicycle corridor on 4th',
      description:
        'Large oak branch cracked and fell directly across the two-way cycle lane on 4th Street near Pine. Commuters forced into car lanes.',
      summary: 'Tree obstruction blocking designated bicycle track.',
      category: 'Infrastructure',
      severity: 'medium',
      safety_risk: true,
      affected_people_estimate: 25,
      latitude: 37.7801,
      longitude: -122.4145,
      location_label: '4th Street & Pine Avenue bike corridor',
      suggested_department: 'Parks',
      status: 'Reported',
      priority_score: c7Breakdown.totalScore,
      priority_breakdown: c7Breakdown,
      ai_confidence: 0.93,
      ai_reasoning:
        'Urban forestry obstruction on active alternate transportation corridor.',
      corroborating_reports_count: 1,
      corroborating_case_ids: [],
      image_url:
        'https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?auto=format&fit=crop&w=800&q=80',
      reporter_name: 'Julian Hayes',
      created_at: c7Created,
      updated_at: c7Created,
    },
    {
      id: 'CS-2026-1049',
      title: 'Heavy tree limb down obstructing bike lane near 4th & Pine',
      description:
        'Snapped tree limb obstructing bike lane right on 4th near pine. Bikes having to swerve into vehicle traffic suddenly.',
      summary: 'Duplicate report of fallen tree branch on 4th St bike lane.',
      category: 'Infrastructure',
      severity: 'medium',
      safety_risk: true,
      affected_people_estimate: 20,
      latitude: 37.7808,
      longitude: -122.4141,
      location_label: '4th Street by Pine, north bound bike lane',
      suggested_department: 'Parks',
      status: 'Reported',
      priority_score: c8Breakdown.totalScore,
      priority_breakdown: c8Breakdown,
      ai_confidence: 0.91,
      ai_reasoning:
        'Physical hazard in cyclist right of way. Matches CS-2026-1048 within 95m.',
      corroborating_reports_count: 1,
      corroborating_case_ids: [],
      image_url:
        'https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?auto=format&fit=crop&w=800&q=80',
      reporter_name: 'Rachel Wong',
      created_at: c8Created,
      updated_at: c8Created,
    },
    {
      id: 'CS-2026-1050',
      title: 'Faded and peeling wood stain on park bench at Sunset Meadow',
      description:
        'The wooden park bench facing the duck pond has weathered grey stain peeling off. No splintering or structural compromise, purely cosmetic refurbishment needed.',
      summary: 'Cosmetic wood refinishing needed on park bench; no structural or safety hazard.',
      category: 'Infrastructure',
      severity: 'low',
      safety_risk: false,
      affected_people_estimate: 4,
      latitude: 37.7654,
      longitude: -122.4412,
      location_label: 'Sunset Meadow Park, North Pond trail',
      suggested_department: 'Parks',
      status: 'Reported',
      priority_score: c9Breakdown.totalScore,
      priority_breakdown: c9Breakdown,
      ai_confidence: 0.96,
      ai_reasoning:
        'Aesthetic park amenity wear without safety impact; low priority queue placement.',
      corroborating_reports_count: 1,
      corroborating_case_ids: [],
      image_url:
        'https://images.unsplash.com/photo-1519331379826-f10be5486c6f?auto=format&fit=crop&w=800&q=80',
      reporter_name: 'Gordon Miller',
      created_at: c9Created,
      updated_at: c9Created,
    },
    {
      id: 'CS-2026-1051',
      title: 'Exposed sparking wire dangling near community playground swing set',
      description:
        'Storm damage caused overhead illumination wire to detach and hang 5 feet above the woodchip play surface. Visible sparks noticed when wind blows.',
      summary: 'Life-safety electrical hazard with live conductor within reach of children.',
      category: 'Safety',
      severity: 'critical',
      safety_risk: true,
      affected_people_estimate: 70,
      latitude: 37.7758,
      longitude: -122.4187,
      location_label: 'Oakridge Community Playground, Play structure area',
      sensitive_location_info: {
        name: 'Oakridge Community Playground',
        type: 'school',
        distanceMeters: 80,
      },
      suggested_department: 'Electricity',
      assigned_department: 'Electricity',
      assigned_to: 'High-Voltage Rapid Response Unit 1',
      status: 'In Progress',
      priority_score: c10Breakdown.totalScore,
      priority_breakdown: c10Breakdown,
      ai_confidence: 0.98,
      ai_reasoning:
        'Severe acute electrocution danger in immediate vicinity of child recreation zone.',
      corroborating_reports_count: 2,
      corroborating_case_ids: [],
      image_url:
        'https://images.unsplash.com/photo-1544725176-7c40e5a71c5e?auto=format&fit=crop&w=800&q=80',
      reporter_name: 'Coach Marcus Bell',
      created_at: c10Created,
      updated_at: hoursAgo(1),
    },
    {
      id: 'CS-2026-1052',
      title: 'Pedestrian crossing call-button jammed at Senior Living center',
      description:
        'Pedestrian crosswalk button physically crushed and jammed into bezel. Seniors unable to activate pedestrian walk light across 4-lane arterial road.',
      summary: 'Disabled crossing actuator forcing vulnerable pedestrians to cross without signal.',
      category: 'Safety',
      severity: 'high',
      safety_risk: true,
      affected_people_estimate: 95,
      latitude: 37.7718,
      longitude: -122.4242,
      location_label: 'Golden Age Blvd at 14th Ave Crosswalk',
      sensitive_location_info: {
        name: 'Golden Age Senior Living Complex',
        type: 'dense_public',
        distanceMeters: 40,
      },
      suggested_department: 'Roads',
      assigned_department: 'Roads',
      assigned_to: 'Traffic Signal Electronics Crew',
      status: 'Assigned',
      priority_score: c11Breakdown.totalScore,
      priority_breakdown: c11Breakdown,
      ai_confidence: 0.94,
      ai_reasoning:
        'Critical pedestrian accessibility failure adjacent to retirement community.',
      corroborating_reports_count: 1,
      corroborating_case_ids: [],
      image_url:
        'https://images.unsplash.com/photo-1508873696983-2df5293cb325?auto=format&fit=crop&w=800&q=80',
      reporter_name: 'Grace O’Connor (Nurse)',
      created_at: c11Created,
      updated_at: hoursAgo(7),
    },
    {
      id: 'CS-2026-1053',
      title: 'Sunken cast iron manhole rim causing vehicle bottom-out',
      description:
        'Utility sewer ring settled 4 inches below asphalt grade along right travel lane. Delivery trucks and city buses clattering heavily at speed.',
      summary: 'Depressed utility collar creating vehicular shock and road surface stress.',
      category: 'Infrastructure',
      severity: 'medium',
      safety_risk: false,
      affected_people_estimate: 150,
      latitude: 37.7872,
      longitude: -122.4019,
      location_label: 'Harbor Commercial Strip, 200 block eastbound',
      sensitive_location_info: {
        name: 'Harbor Commercial Strip',
        type: 'dense_public',
        distanceMeters: 110,
      },
      suggested_department: 'Roads',
      status: 'Reported',
      priority_score: c12Breakdown.totalScore,
      priority_breakdown: c12Breakdown,
      ai_confidence: 0.89,
      ai_reasoning:
        'Sub-grade settlement on high-volume commercial transit corridor.',
      corroborating_reports_count: 1,
      corroborating_case_ids: [],
      image_url:
        'https://images.unsplash.com/photo-1578885136359-16c8bd4d3a8e?auto=format&fit=crop&w=800&q=80',
      reporter_name: 'BART Transit Driver #84',
      created_at: c12Created,
      updated_at: c12Created,
    },
  ];
}

export function getInitialEvents(): CaseEvent[] {
  const now = Date.now();
  const hoursAgo = (h: number) => new Date(now - h * 3600 * 1000).toISOString();

  return [
    {
      id: 'EV-1001',
      case_id: 'CS-2026-1042',
      from_status: 'Reported',
      to_status: 'Reported',
      actor_label: 'Citizen (Priya Mehta)',
      note: 'Report submitted via mobile web portal with photo outside school gate.',
      created_at: hoursAgo(18),
    },
    {
      id: 'EV-1002',
      case_id: 'CS-2026-1042',
      from_status: 'Reported',
      to_status: 'Reported',
      actor_label: 'CivicShield AI Triage Engine',
      note: 'AI classified as High severity Pothole with immediate safety risk near school. Priority score computed: 83/100.',
      created_at: hoursAgo(18),
    },
    {
      id: 'EV-1003',
      case_id: 'CS-2026-1047',
      from_status: 'Reported',
      to_status: 'Assigned',
      actor_label: 'Dispatcher J. Vance',
      note: 'Assigned to Roads & Infrastructure Welding Team B for urgent bridge barrier repair.',
      created_at: hoursAgo(30),
    },
    {
      id: 'EV-1004',
      case_id: 'CS-2026-1047',
      from_status: 'Assigned',
      to_status: 'In Progress',
      actor_label: 'Civic Welding Team B',
      note: 'Crew on site. Setting up safety perimeter and grinding off fractured mounting flanges.',
      created_at: hoursAgo(16),
    },
    {
      id: 'EV-1005',
      case_id: 'CS-2026-1047',
      from_status: 'In Progress',
      to_status: 'Resolved',
      actor_label: 'Foreman Dave Reynolds',
      note: 'Replaced structural stanchions with galvanized grade-8 anchors. Handrail load tested to 400 lbs. Safe for public reopening.',
      created_at: hoursAgo(4),
      after_photo_url:
        'https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=800&q=80',
    },
  ];
}
