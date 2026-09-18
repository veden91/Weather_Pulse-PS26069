export type Severity = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
export type VerificationStatus = 'PENDING' | 'VERIFIED' | 'REJECTED' | 'SUSPICIOUS' | 'NEEDS_REVIEW';

export interface WeatherEvent {
  id: string;
  title: string;
  event_category: string;
  severity: Severity;
  confidence: number;
  verification_status: VerificationStatus;
  city: string;
  district?: string;
  state: string;
  latitude: number;
  longitude: number;
  radius_km: number;
  report_count: number;
  source_count: number;
  first_reported_at: string;
  last_reported_at: string;
  is_active: boolean;
  summary?: string;
}

export interface WeatherReport {
  id: string;
  source_id: string;
  event_id?: string;
  text: string;
  event_category: string;
  severity: Severity;
  confidence: number;
  trust_score: number;
  verification_status: VerificationStatus;
  city: string;
  district?: string;
  state: string;
  latitude: number;
  longitude: number;
  reported_at: string;
  ingested_at: string;
  processing_status: string;
  media?: Array<{
    id: string;
    media_type: string;
    media_url: string;
    thumbnail_url?: string;
    caption?: string;
  }>;
  ai_reasoning?: string;
  ai_model_name?: string;
  raw_payload?: string;
}

export interface EmergencyAlert {
  id: string;
  title: string;
  description: string;
  alert_level: Severity | 'INFO';
  category: string;
  city: string;
  district?: string;
  state: string;
  latitude: number;
  longitude: number;
  report_count: number;
  trend_description: string;
  is_active: boolean;
  issued_at: string;
  expires_at?: string;
}

export interface KPICards {
  total_reports: number;
  reports_today: number;
  active_events: number;
  verified_reports: number;
  suspicious_reports: number;
  states_affected: number;
  ai_processed_percentage: number;
  reports_per_min: number;
}

export interface ChartDataPoint {
  label: string;
  value: number;
  secondary_value?: number;
  metadata?: Record<string, any>;
}

export interface StateRanking {
  state: string;
  events_count: number;
  reports_count: number;
  top_event_category: string;
  severity_level: string;
}

export interface AnalyticsInsight {
  id: string;
  category: string;
  insight_text: string;
  impact_level: 'HIGH' | 'MEDIUM' | 'LOW' | 'CRITICAL';
  timestamp: string;
}

export interface DataSource {
  id: string;
  name: string;
  source_type: string;
  endpoint_url?: string;
  is_active: boolean;
  reliability_score: number;
  latency_ms: number;
  last_sync_at: string;
  records_ingested: number;
  error_count: number;
  status_label: string;
}

export interface User {
  id: string;
  username: string;
  email: string;
  full_name: string;
  role: 'ADMIN' | 'ANALYST' | 'VERIFIER' | 'VIEWER';
  department: string;
}

export interface SystemHealth {
  overall_status: string;
  uptime_seconds: number;
  services: Array<{
    name: string;
    status: string;
    latency_ms: number;
    details: string;
  }>;
  metrics: {
    cpu_percent: number;
    memory_percent: number;
    disk_percent: number;
    ingestion_rate_per_sec: number;
    processing_latency_avg_ms: number;
    queue_backlog_count: number;
    active_websocket_connections: number;
    failed_jobs_count: number;
  };
}
