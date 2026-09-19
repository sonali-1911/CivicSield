export type IssueCategory =
  | 'Pothole'
  | 'Garbage'
  | 'Streetlight'
  | 'WaterLeak'
  | 'Drainage'
  | 'Safety'
  | 'Infrastructure'
  | 'Other';

export type IssueSeverity = 'critical' | 'high' | 'medium' | 'low';

export type DepartmentName =
  | 'Roads'
  | 'Sanitation'
  | 'Electricity'
  | 'Water'
  | 'PublicSafety'
  | 'Parks'
  | 'General';

export type CaseStatus = 'Reported' | 'Assigned' | 'In Progress' | 'Resolved' | 'Merged';

export interface SensitiveLocationInfo {
  name: string;
  type: 'school' | 'hospital' | 'transit_hub' | 'dense_public' | 'none';
  distanceMeters: number;
}

export interface PriorityBreakdown {
  safetySeverityRaw: number; // 0-100
  safetySeverityPoints: number; // max 35

  affectedPeopleRaw: number; // 0-100
  affectedPeoplePoints: number; // max 25

  corroborationRaw: number; // 0-100
  corroborationPoints: number; // max 20

  timeUnresolvedRaw: number; // 0-100
  timeUnresolvedPoints: number; // max 10

  sensitiveLocationRaw: number; // 0-100
  sensitiveLocationPoints: number; // max 10

  totalScore: number; // 0-100
  breakdownString: string; // e.g. "Safety 30/35, People 17/25, Corroboration 12/20, Age 6/10, Sensitive location 10/10 = 75/100"
  explanation: string;
}

export interface CaseEvent {
  id: string;
  case_id: string;
  from_status: CaseStatus;
  to_status: CaseStatus;
  actor_label: string;
  note?: string;
  created_at: string;
  after_photo_url?: string;
}

export interface DuplicateLink {
  id: string;
  master_case_id: string;
  related_case_id: string;
  similarity_score: number; // 0-1
  distance_meters: number;
  approved_by: string;
  created_at: string;
}

export interface CivicCase {
  id: string; // e.g. "CS-2026-1042"
  title: string;
  description: string;
  summary: string;
  category: IssueCategory;
  severity: IssueSeverity;
  safety_risk: boolean;
  affected_people_estimate: number;
  latitude: number;
  longitude: number;
  location_label: string;
  sensitive_location_info?: SensitiveLocationInfo;
  suggested_department: DepartmentName;
  assigned_department?: DepartmentName;
  assigned_to?: string;
  status: CaseStatus;
  priority_score: number; // 0-100
  priority_breakdown: PriorityBreakdown;
  ai_confidence: number; // 0-1
  ai_reasoning: string;
  corroborating_reports_count: number;
  corroborating_case_ids: string[];
  image_url?: string;
  after_photo_url?: string;
  reporter_name?: string;
  reporter_contact?: string;
  created_at: string; // ISO string
  updated_at: string;
  resolved_at?: string;
  merged_into_case_id?: string;
}

export interface AITriageResult {
  category: IssueCategory;
  summary: string;
  severity: IssueSeverity;
  safetyRisk: boolean;
  affectedPeopleEstimate: number;
  suggestedDepartment: DepartmentName;
  confidence: number;
  reasoning: string;
  isFallback?: boolean;
}

export interface DepartmentInfo {
  id: DepartmentName;
  name: string;
  color: string;
  response_target_hours: number;
  contactLead: string;
}

export interface CityDistrict {
  id: string;
  name: string;
  centerLat: number;
  centerLng: number;
}
