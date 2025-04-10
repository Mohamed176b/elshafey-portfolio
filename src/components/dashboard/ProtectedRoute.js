import { Navigate, useLocation } from "react-router-dom";
import { isAuthenticated } from "../../utils/authUtils";

const ProtectedRoute = ({ children }) => {
  // No longer need to get user from location state
  if (!isAuthenticated()) {
    console.warn("Unauthorized access attempt - Redirecting to login page");
    return <Navigate to="/admin" replace />; // Redirect to login page if user is not authenticated
  }

  return children; // Render protected content if user is authenticated
};

export default ProtectedRoute;