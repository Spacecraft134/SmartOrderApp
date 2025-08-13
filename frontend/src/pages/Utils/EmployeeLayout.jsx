import { Outlet, useNavigate } from "react-router-dom";
import { useAuth } from "../Context/AuthContext";
import { useEffect } from "react";

export default function EmployeeLayout() {
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (window.location.pathname === "/employee") {
      if (user?.role === "WAITER") {
        navigate("/employee/waiter-dashboard", { replace: true });
      } else if (user?.role === "KITCHEN") {
        navigate("/employee/kitchen-dashboard", { replace: true });
      }
    }
  }, [user, navigate]);

  return (
    <div className="flex h-screen bg-gray-100">
      <Outlet />
    </div>
  );
}
