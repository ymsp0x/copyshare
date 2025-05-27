// project/src/components/auth/ProtectedRoute.tsx
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { session, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-500"></div> {/* MODIFIED */}
      </div>
    );
  }

  if (!session) {
    return <Navigate to="/admin/login" replace />;
  }

  return <>{children}</>;
}

export default ProtectedRoute;