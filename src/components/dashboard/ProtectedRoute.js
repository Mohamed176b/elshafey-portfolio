import { Navigate } from "react-router-dom";
import { memo, useCallback, useMemo } from "react";
import { isAuthenticated } from "../../utils/authUtils";

const ProtectedRoute = memo(({ children }) => {
  const isAuth = useMemo(() => isAuthenticated(), []);

  const handleUnauthorized = useCallback(() => {
    console.warn("Unauthorized access attempt - Redirecting to login page");
    return <Navigate to="/admin" replace />;
  }, []);

  try {
    if (!isAuth) {
      return handleUnauthorized();
    }
    return children;
  } catch (error) {
    console.error("Error in ProtectedRoute:", error);
    return handleUnauthorized();
  }
});

ProtectedRoute.displayName = "ProtectedRoute";

export default ProtectedRoute;
