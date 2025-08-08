import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../Context/AuthContext";

export default function EmployeeRouteGuard({ children }) {
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!user || (user.role !== "WAITER" && user.role !== "KITCHEN")) {
      navigate("/employee/login", { replace: true });
    }
    // Redirect to correct dashboard if trying to access wrong one
    else if (
      user.role === "WAITER" &&
      window.location.pathname.includes("kitchen-dashboard")
    ) {
      navigate("/employee/waiter-dashboard", { replace: true });
    } else if (
      user.role === "KITCHEN" &&
      window.location.pathname.includes("waiter-dashboard")
    ) {
      navigate("/employee/kitchen-dashboard", { replace: true });
    }
  }, [user, navigate]);

  return children;
}
