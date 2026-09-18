import axios from 'axios';
import {
  WeatherEvent, WeatherReport, EmergencyAlert, KPICards,
  StateRanking, AnalyticsInsight, DataSource, SystemHealth, User
} from '../types';

const getApiBaseUrl = () => {
  if (typeof window !== 'undefined') {
    const host = window.location.hostname || '127.0.0.1';
    return `http://${host}:8000/api/v1`;
  }
  return 'http://127.0.0.1:8000/api/v1';
};

const API_BASE_URL = getApiBaseUrl();

export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000,
});

// Attach JWT token if stored
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('weatherpulse_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Global API error logger
api.interceptors.response.use(
  (res) => res,
  (err) => {
    console.warn(`[WeatherPulse API Warning] ${err.config?.method?.toUpperCase()} ${err.config?.url}:`, err.message);
    return Promise.reject(err);
  }
);

// Event APIs
export const getEvents = async (params?: Record<string, any>): Promise<WeatherEvent[]> => {
  const res = await api.get<WeatherEvent[]>('/events', { params });
  return res.data;
};

export const getEventById = async (id: string): Promise<any> => {
  const res = await api.get(`/events/${id}`);
  return res.data;
};

// Report APIs
export const getReports = async (params?: Record<string, any>): Promise<WeatherReport[]> => {
  const res = await api.get<WeatherReport[]>('/reports', { params });
  return res.data;
};

export const getReportById = async (id: string): Promise<WeatherReport> => {
  const res = await api.get<WeatherReport>(`/reports/${id}`);
  return res.data;
};

export const submitCitizenReport = async (data: {
  event_category: string;
  description: string;
  location_name?: string;
  city?: string;
  state?: string;
  latitude?: number;
  longitude?: number;
  photo_url?: string;
  video_url?: string;
}) => {
  const res = await api.post('/reports/citizen', data);
  return res.data;
};

// AI Verification APIs
export const getVerificationQueue = async (tab: string = 'PENDING_REVIEW'): Promise<WeatherReport[]> => {
  const res = await api.get<WeatherReport[]>('/verification/queue', { params: { tab } });
  return res.data;
};

export const executeVerificationAction = async (
  reportId: string,
  action: 'VERIFY' | 'REJECT' | 'MARK_SUSPICIOUS' | 'REQUEST_REVIEW' | 'ESCALATE',
  notes?: string
) => {
  const res = await api.post(`/verification/reports/${reportId}/action`, { action, notes });
  return res.data;
};

// Alert APIs
export const getAlerts = async (level?: string): Promise<EmergencyAlert[]> => {
  const res = await api.get<EmergencyAlert[]>('/alerts', { params: { alert_level: level } });
  return res.data;
};

export const createAlert = async (alertData: any): Promise<EmergencyAlert> => {
  const res = await api.post<EmergencyAlert>('/alerts', alertData);
  return res.data;
};

// Analytics APIs
export const getAnalyticsOverview = async (): Promise<KPICards> => {
  const res = await api.get<KPICards>('/analytics/overview');
  return res.data;
};

export const getAnalyticsCharts = async (): Promise<any> => {
  const res = await api.get('/analytics/charts');
  return res.data;
};

export const getAnalyticsStates = async (): Promise<StateRanking[]> => {
  const res = await api.get<StateRanking[]>('/analytics/states');
  return res.data;
};

export const getAnalyticsInsights = async (): Promise<AnalyticsInsight[]> => {
  const res = await api.get<AnalyticsInsight[]>('/analytics/insights');
  return res.data;
};

export const getFullAnalytics = async (): Promise<any> => {
  const res = await api.get('/analytics/full');
  return res.data;
};

// Sources & System
export const getSources = async (): Promise<DataSource[]> => {
  const res = await api.get<DataSource[]>('/sources');
  return res.data;
};

export const getSourcesHealth = async (): Promise<any> => {
  const res = await api.get('/sources/health');
  return res.data;
};

export const getSystemHealth = async (): Promise<SystemHealth> => {
  const res = await api.get<SystemHealth>('/system/health');
  return res.data;
};

// AI Endpoint
export const classifyText = async (text: string, locationHint?: string) => {
  const res = await api.post('/ai/classify', { text, location_hint: locationHint });
  return res.data;
};

// Simulator APIs (Section 9 & Section 47)
export const getSimulatorStatus = async () => {
  const res = await api.get('/simulator/status');
  return res.data;
};

export const startSimulator = async (interval: number = 4.0) => {
  const res = await api.post('/simulator/start', null, { params: { interval } });
  return res.data;
};

export const stopSimulator = async () => {
  const res = await api.post('/simulator/stop');
  return res.data;
};

export const triggerSimulatorPulse = async () => {
  const res = await api.post('/simulator/pulse');
  return res.data;
};

// Auth
export const login = async (username: string, password: string) => {
  const res = await api.post('/auth/login', { username, password });
  if (res.data.access_token) {
    localStorage.setItem('weatherpulse_token', res.data.access_token);
    localStorage.setItem('weatherpulse_user', JSON.stringify(res.data.user));
  }
  return res.data;
};
