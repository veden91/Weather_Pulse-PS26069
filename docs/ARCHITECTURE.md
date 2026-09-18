# WeatherPulse India: Architecture & Engineering Specification

## Executive Summary

**WeatherPulse India** is a national-scale, multi-source meteorological intelligence and big data analytics platform engineered for the Ministry of Earth Sciences (MoES) under Smart India Hackathon 2026. The platform continuously ingests, cleans, deduplicates, and analyzes weather observations across all 28 states and 8 union territories of India.

---

## 1. End-to-End Architectural Data Flow

```mermaid
flowchart TD
    subgraph DataSources ["1. Multi-Source Ingestion Layer"]
        IMD["Official IMD APIs & AWS Ground Sensors"]
        SOC["Social Media Telemetry Stream (#IMD, #WeatherPulse)"]
        CIT["Citizen Crowd Portal (/report with GPS)"]
        PUB["Open Government Data (data.gov.in)"]
        SIM["Live Data Simulation Engine"]
    end

    subgraph StreamingMesh ["2. Message Queue & Distributed Bus"]
        KAFKA["Apache Kafka Broker (Topic: weatherpulse.reports.incoming)"]
        ASYNC_BUS["Async In-Memory Streaming Queue (Dev Fallback)"]
    end

    subgraph DataQualityPipeline ["3. 9-Stage Data Quality & AI Pipeline"]
        P1["Stage 1: Raw Ingestion"] --> P2["Stage 2: Schema Validation"]
        P2 --> P3["Stage 3: Noise Cleaning & Normalization"]
        P3 --> P4["Stage 4: Gazetteer NER & Geocoding"]
        P4 --> P5["Stage 5: 16-Class NLP Event Classifier"]
        P5 --> P6["Stage 6: Multi-Factor Trust Scoring (0-100)"]
        P6 --> P7["Stage 7: Spatio-Temporal Deduplication (Haversine <= 15km)"]
        P7 --> P8["Stage 8: Incident Cluster Aggregation"]
        P8 --> P9["Stage 9: Storage & WebSocket Broadcast"]
    end

    subgraph StorageMesh ["4. Persistent Storage & Object Store"]
        POSTGRES[("PostgreSQL 16 + PostGIS Spatial Index")]
        SQLITE[("SQLite Embedded Spatial Engine (Local Dev)")]
        MINIO[("MinIO S3 Media Object Store")]
    end

    subgraph GatewayAPI ["5. FastAPI Gateway & WebSocket Hub"]
        REST["REST API v1 (/events, /reports, /analytics, /verification, /alerts)"]
        WS["WebSocket Telemetry Server (/ws/events)"]
    end

    subgraph CommandDashboard ["6. GIS Intelligence Command Center"]
        MAP_VIEW["Leaflet GIS Map (Pulsing Radar Alerts & Heatmap)"]
        INTEL_PANEL["Section 57 Event Intelligence Dossier"]
        VERIFY_QUEUE["Human-in-the-Loop AI Verification Queue"]
        ANALYTICS_PANEL["10 Real-time Recharts & State Matrix"]
    end

    DataSources --> StreamingMesh
    StreamingMesh --> DataQualityPipeline
    DataQualityPipeline --> StorageMesh
    StorageMesh --> GatewayAPI
    GatewayAPI --> CommandDashboard
```

---

## 2. 9-Stage Data Quality & AI Pipeline

1. **Stage 1 (Raw Ingestion)**: Ingests unstructured text, geocoordinates, media URLs, and source metadata.
2. **Stage 2 (Validation)**: Validates required payload fields, types, and constraints.
3. **Stage 3 (Cleaning)**: Strips HTML entities, control characters, and normalizes whitespaces.
4. **Stage 4 (Geocoding & Gazetteer NER)**: Identifies Indian cities, districts, states, and coordinates using a built-in gazetteer covering 100+ cities across India.
5. **Stage 5 (AI Classification)**: 16-class NLP classifier categorizes event type (`Heavy Rainfall`, `Flood`, `Flash Flood`, `Thunderstorm`, `Lightning`, `Heatwave`, `Cold Wave`, `Fog`, `Dense Fog`, `Dust Storm`, `Strong Wind`, `Cyclone`, `Hailstorm`, `Landslide`, `Cloudburst`, `Rainfall`) and calibrates confidence score.
6. **Stage 6 (AI Trust Scoring)**: Generates a 0–100 credibility score based on source credibility, GPS precision, media presence, and cross-source corroboration.
7. **Stage 7 (Spatio-Temporal Deduplication)**: Calculates spherical Haversine distance (\(\le 15\text{ km}\)) and temporal proximity (\(\le 4\text{ hours}\)) to group reports into single incidents (e.g. `EVENT #LKO-2026-001`).
8. **Stage 8 (Event Aggregation)**: Automatically escalates severity and updates incident dockets.
9. **Stage 9 (Broadcast & Storage)**: Persists records to PostgreSQL/PostGIS or local SQLite and pushes real-time notification to all connected WebSockets.

---

## 3. Technology Stack Summary

| Layer | Technologies |
|---|---|
| **Frontend** | React 18, TypeScript, Vite, Tailwind CSS, Leaflet GIS, Recharts, Lucide Icons |
| **Backend** | Python 3.11, FastAPI, Pydantic V2, SQLAlchemy 2.0, Uvicorn |
| **AI / NLP** | Scikit-learn, TF-IDF, Regex Gazetteer NER, Spherical Haversine Spatial Engine |
| **Database** | PostgreSQL 16 + PostGIS / SQLite zero-dependency local dev engine |
| **Streaming** | Apache Kafka, WebSockets |
| **Storage** | MinIO Object Store / Local uploads volume |
| **DevOps** | Docker, Docker Compose, Nginx |
