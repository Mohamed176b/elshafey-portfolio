import { Navigate } from "react-router-dom";
import { memo, useCallback, useEffect, useState } from "react";
import {
  isAuthenticated,
  validateSessionWithSupabase,
} from "../../utils/authUtils";

const ProtectedRoute = memo(({ children }) => {
  const [isValidating, setIsValidating] = useState(true);
  const [isValid, setIsValid] = useState(false);

  const validateSession = useCallback(async () => {
    try {
      // First check local session
      if (!isAuthenticated()) {
        setIsValid(false);
        setIsValidating(false);
        return;
      }

      // Then validate against Supabase
      const isValidSession = await validateSessionWithSupabase();
      setIsValid(isValidSession);
    } catch (error) {
      console.error("Error in session validation:", error);
      setIsValid(false);
    } finally {
      setIsValidating(false);
    }
  }, []);

  useEffect(() => {
    validateSession();
  }, [validateSession]);

  if (isValidating) {
    return <div className="page-spin"></div>;
  }

  if (!isValid) {
    console.warn("Unauthorized access attempt - Redirecting to login page");
    return <Navigate to="/admin" replace />;
  }

  return children;
});

ProtectedRoute.displayName = "ProtectedRoute";

export default ProtectedRoute;
