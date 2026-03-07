import { Navigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useUser } from "@clerk/clerk-react";

interface Props {
  children: React.ReactNode;
  adminOnly?: boolean;
}

const ProtectedRoute = ({ children, adminOnly = false }: Props) => {
  const { isLoaded, isSignedIn } = useUser();
  const { loading, isAdmin } = useAuth();

  if (!isLoaded || loading) {
    return (
      <div className="min-h-screen gradient-dark flex items-center justify-center">
        <div className="font-display text-gold text-xl animate-pulse">Chargement...</div>
      </div>
    );
  }

  if (!isSignedIn) return <Navigate to="/auth" replace />;
  if (adminOnly && !isAdmin) return <Navigate to="/play" replace />;

  return <>{children}</>;
};

export default ProtectedRoute;
