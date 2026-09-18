import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { SimulatorProvider } from './store/simulatorContext';
import { DashboardLayout } from './layouts/DashboardLayout';
import { CommandCenter } from './pages/CommandCenter';
import { EventExplorer } from './pages/EventExplorer';
import { EventDetails } from './pages/EventDetails';
import { ReportsExplorer } from './pages/ReportsExplorer';
import { GeoAnalytics } from './pages/GeoAnalytics';
import { AnalyticsDashboard } from './pages/AnalyticsDashboard';
import { VerificationCenter } from './pages/VerificationCenter';
import { AlertCenter } from './pages/AlertCenter';
import { DataSources } from './pages/DataSources';
import { AdminPanel } from './pages/AdminPanel';
import { SystemHealth } from './pages/SystemHealth';
import { CitizenReport } from './pages/CitizenReport';

export const App: React.FC = () => {
  return (
    <SimulatorProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<DashboardLayout />}>
            <Route index element={<Navigate to="/dashboard" replace />} />
            <Route path="dashboard" element={<CommandCenter />} />
            <Route path="events" element={<EventExplorer />} />
            <Route path="events/:id" element={<EventDetails />} />
            <Route path="reports" element={<ReportsExplorer />} />
            <Route path="map" element={<GeoAnalytics />} />
            <Route path="analytics" element={<AnalyticsDashboard />} />
            <Route path="verification" element={<VerificationCenter />} />
            <Route path="alerts" element={<AlertCenter />} />
            <Route path="sources" element={<DataSources />} />
            <Route path="admin" element={<AdminPanel />} />
            <Route path="system" element={<SystemHealth />} />
            <Route path="report" element={<CitizenReport />} />
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </SimulatorProvider>
  );
};
