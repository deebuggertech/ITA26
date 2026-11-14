import type { ReactNode } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import type { Portal } from "../lib";

export function ProtectedRoute({ portal, children }: { portal: Portal; children: ReactNode }) {
  const { session } = useAuth();
  if (!session || !portal.roles.includes(session.role)) return <Navigate to={`/login/${portal.slug}`} replace />;
  return <>{children}</>;
}
