from typing import Dict, Any, List
from pydantic import BaseModel

class ServiceStatus(BaseModel):
    name: str
    status: str # HEALTHY, RUNNING, DEGRADED, SIMULATED
    latency_ms: float
    details: str

class SystemMetrics(BaseModel):
    cpu_percent: float
    memory_percent: float
    disk_percent: float
    ingestion_rate_per_sec: float
    processing_latency_avg_ms: float
    queue_backlog_count: int
    active_websocket_connections: int
    failed_jobs_count: int

class SystemHealthResponse(BaseModel):
    overall_status: str # HEALTHY, DEGRADED, DOWN
    uptime_seconds: int
    services: List[ServiceStatus]
    metrics: SystemMetrics
