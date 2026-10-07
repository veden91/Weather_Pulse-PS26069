import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { SimulatorProvider } from './store/simulatorContext';
import { AuthProvider } from './store/authContext';
import { DashboardLayout } from './layouts/DashboardLayout';
import { ProtectedRoute } from './components/ProtectedRoute';
import { LandingPage } from './pages/LandingPage';
import { PublicEventExplorer } from './pages/PublicEventExplorer';
import { PublicAlertCenter } from './pages/PublicAlertCenter';
import { PublicGeoAnalytics } from './pages/PublicGeoAnalytics';
import { LoginPage } from './pages/LoginPage';
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
    <AuthProvider>
      <SimulatorProvider>
        <BrowserRouter>
          <Routes>
            {/* Standalone Public Feature Routes (Direct access, no sidebar, no landing page scroll) */}
            <Route path="/" element={<LandingPage />} />
            <Route path="/events" element={<PublicEventExplorer />} />
            <Route path="/alerts" element={<PublicAlertCenter />} />
            <Route path="/map" element={<PublicGeoAnalytics />} />
            <Route path="/login" element={<LoginPage />} />

            {/* Protected Operational Portal Routes (With DashboardLayout & Sidebar) */}
            <Route element={<DashboardLayout />}>
              {/* Command Center: ADMIN, VERIFIER */}
              <Route
                path="/dashboard"
                element={
                  <ProtectedRoute allowedRoles={['ADMIN', 'VERIFIER']}>
                    <CommandCenter />
                  </ProtectedRoute>
                }
              />

              {/* Portal Live Events */}
              <Route
                path="/portal/events"
                element={
                  <ProtectedRoute allowedRoles={['ADMIN', 'ANALYST', 'VERIFIER', 'CITIZEN']}>
                    <EventExplorer />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/events/:id"
                element={
                  <ProtectedRoute allowedRoles={['ADMIN', 'ANALYST', 'VERIFIER', 'CITIZEN']}>
                    <EventDetails />
                  </ProtectedRoute>
                }
              />

              {/* Reports Explorer: ADMIN, ANALYST, VERIFIER */}
              <Route
                path="/reports"
                element={
                  <ProtectedRoute allowedRoles={['ADMIN', 'ANALYST', 'VERIFIER']}>
                    <ReportsExplorer />
                  </ProtectedRoute>
                }
              />

              {/* Portal India Geo-Analytics Map */}
              <Route
                path="/portal/map"
                element={
                  <ProtectedRoute allowedRoles={['ADMIN', 'ANALYST', 'CITIZEN']}>
                    <GeoAnalytics />
                  </ProtectedRoute>
                }
              />

              {/* Analytics & Insights: ADMIN, ANALYST */}
              <Route
                path="/analytics"
                element={
                  <ProtectedRoute allowedRoles={['ADMIN', 'ANALYST']}>
                    <AnalyticsDashboard />
                  </ProtectedRoute>
                }
              />

              {/* AI Verification Center: ADMIN, VERIFIER */}
              <Route
                path="/verification"
                element={
                  <ProtectedRoute allowedRoles={['ADMIN', 'VERIFIER']}>
                    <VerificationCenter />
                  </ProtectedRoute>
                }
              />

              {/* Portal Alert Center */}
              <Route
                path="/portal/alerts"
                element={
                  <ProtectedRoute allowedRoles={['ADMIN', 'ANALYST', 'VERIFIER', 'CITIZEN']}>
                    <AlertCenter />
                  </ProtectedRoute>
                }
              />

              {/* Data Sources: ADMIN only */}
              <Route
                path="/sources"
                element={
                  <ProtectedRoute allowedRoles={['ADMIN']}>
                    <DataSources />
                  </ProtectedRoute>
                }
              />

              {/* Admin Panel: ADMIN only */}
              <Route
                path="/admin"
                element={
                  <ProtectedRoute allowedRoles={['ADMIN']}>
                    <AdminPanel />
                  </ProtectedRoute>
                }
              />

              {/* System Health: ADMIN only */}
              <Route
                path="/system"
                element={
                  <ProtectedRoute allowedRoles={['ADMIN']}>
                    <SystemHealth />
                  </ProtectedRoute>
                }
              />

              {/* Citizen Incident Reporting Form: CITIZEN */}
              <Route
                path="/report"
                element={
                  <ProtectedRoute allowedRoles={['CITIZEN']}>
                    <CitizenReport />
                  </ProtectedRoute>
                }
              />
            </Route>

            {/* Fallback Catch-all Route */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>
      </SimulatorProvider>
    </AuthProvider>
  );
};
