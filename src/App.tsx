// project/src/App.tsx
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './contexts/AuthContext';
import { ThemeProvider } from './contexts/ThemeContext';
import ProtectedRoute from './components/auth/ProtectedRoute';

// Public Pages
import LandingPage from './pages/public/LandingPage';
import ProjectDetailPage from './pages/public/ProjectDetailPage';

// Admin Pages
import LoginPage from './pages/admin/LoginPage';
import AdminDashboard from './pages/admin/AdminDashboard';
import NewProjectPage from './pages/admin/NewProjectPage';
import EditProjectPage from './pages/admin/EditProjectPage';

function App() {
  return (
    <AuthProvider>
      <ThemeProvider>
        {/* Atur warna latar belakang utama di sini */}
        <div className="min-h-screen bg-background-light text-text-dark dark:bg-background-dark dark:text-text-light"> {/* MODIFIED */}
          <Router>
            <Toaster position="top-right" />
            <Routes>
              {/* Public Routes */}
              <Route path="/" element={<LandingPage />} />
              <Route path="/project/:slug" element={<ProjectDetailPage />} />
              
              {/* Admin Routes */}
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
              
              {/* Fallback Route */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </Router>
        </div>
      </ThemeProvider>
    </AuthProvider>
  );
}

export default App;