import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { SimulatorProvider } from './store/simulatorContext';
import { AuthProvider } from './store/authContext';
import { DashboardLayout } from './layouts/DashboardLayout';
import { ProtectedRoute } from './components/ProtectedRoute';
import { LandingPage } from './pages/LandingPage';
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
            {/* Public Landing Page & Portal Access Section */}
            <Route path="/" element={<LandingPage />} />
            <Route path="/login" element={<LoginPage />} />

            {/* Protected Portal Operational Routes */}
            <Route element={<DashboardLayout />}>
              {/* Command Center: ADMIN, ANALYST, VERIFIER */}
              <Route
                path="/dashboard"
                element={
                  <ProtectedRoute allowedRoles={['ADMIN', 'ANALYST', 'VERIFIER']}>
                    <CommandCenter />
                  </ProtectedRoute>
                }
              />

              {/* Live Events: All Roles (ADMIN, ANALYST, VERIFIER, CITIZEN) */}
              <Route
                path="/events"
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

              {/* India Geo-Analytics Map: ADMIN, ANALYST, CITIZEN */}
              <Route
                path="/map"
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

              {/* Alert Center: All Roles */}
              <Route
                path="/alerts"
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

              {/* Platform Admin Panel: ADMIN only */}
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

              {/* Citizen Crowd Report Portal: ADMIN, CITIZEN */}
              <Route
                path="/report"
                element={
                  <ProtectedRoute allowedRoles={['ADMIN', 'CITIZEN']}>
                    <CitizenReport />
                  </ProtectedRoute>
                }
              />
            </Route>

            {/* Fallback */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>
      </SimulatorProvider>
    </AuthProvider>
  );
};
