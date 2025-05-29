// project/src/App.tsx
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './contexts/AuthContext';
import { ThemeProvider } from './contexts/ThemeContext';
import ProtectedRoute from './components/auth/ProtectedRoute';
import React, { Suspense, lazy } from 'react';

const LandingPage = lazy(() => import('./pages/public/LandingPage'));
const ProjectDetailPage = lazy(() => import('./pages/public/ProjectDetailPage'));
const PublicProjectDashboard = lazy(() => import('./pages/public/PublicProjectDashboard'));
const AirdropPage = lazy(() => import('./pages/public/AirdropPage'));

const LoginPage = lazy(() => import('./pages/admin/LoginPage'));
const AdminDashboard = lazy(() => import('./pages/admin/AdminDashboard'));
const NewProjectPage = lazy(() => import('./pages/admin/NewProjectPage'));
const EditProjectPage = lazy(() => import('./pages/admin/EditProjectPage'));

function App() {
  return (
    <AuthProvider>
      <ThemeProvider>
        <div className="min-h-screen bg-neutral-50 dark:bg-neutral-900 font-sans antialiased">
          <Router>
            <Toaster position="top-right" />
            <Suspense fallback={
              <div className="min-h-screen flex items-center justify-center bg-neutral-50 dark:bg-neutral-900">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-500"></div>
              </div>
            }>
              <Routes>
                <Route path="/" element={<LandingPage />} />
                <Route path="/projects" element={<PublicProjectDashboard />} />
                <Route path="/project/:slug" element={<ProjectDetailPage />} />
                <Route path="/airdrop" element={<AirdropPage />} />

                <Route path="/admin/login" element={<LoginPage />} />
                <Route
                  path="/admin"
                  element={
                    <ProtectedRoute>
                      <AdminDashboard />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/admin/new"
                  element={
                    <ProtectedRoute>
                      <NewProjectPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/admin/edit/:id"
                  element={
                    <ProtectedRoute>
                      <EditProjectPage />
                    </ProtectedRoute>
                  }
                />

                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </Suspense>
          </Router>
        </div>
      </ThemeProvider>
    </AuthProvider>
  );
}

export default App;