import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../pages/Context/AuthContext";

const ProtectedRoute = ({ children, allowedRoles }) => {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600 text-lg">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    if (
      allowedRoles &&
      (allowedRoles.includes("WAITER") || allowedRoles.includes("KITCHEN"))
    ) {
      return (
        <Navigate to="/employee-login" state={{ from: location }} replace />
      );
    }
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to="/unauthorized" replace />;
  }

  return children;
};

export const AdminRoute = ({ children }) => (
  <ProtectedRoute allowedRoles={["ADMIN"]}>{children}</ProtectedRoute>
);

export const EmployeeRoute = ({ children }) => (
  <ProtectedRoute allowedRoles={["WAITER", "KITCHEN"]}>
    {children}
  </ProtectedRoute>
);

export const WaiterRoute = ({ children }) => (
  <ProtectedRoute allowedRoles={["WAITER"]}>{children}</ProtectedRoute>
);

export const KitchenRoute = ({ children }) => (
  <ProtectedRoute allowedRoles={["KITCHEN"]}>{children}</ProtectedRoute>
);

export default ProtectedRoute;
