import { AuthProvider } from "../pages/Context/AuthContext";
import MenuManager from "../pages/MenuManager";
import { KitchenDashboard } from "../pages/KitchenDashboard";
import { WaiterDashboard } from "../pages/WaiterDashboard";
import { CustomerOrdersList } from "../pages/CustomerViews/CustomerOrdersList";
import { CustomerOrder } from "../pages/CustomerViews/CustomerOrder";
import { TableQRGenerator } from "../pages/QRcode/TableQRGenerator";
import { AdminLayout } from "../pages/AdminViews/AdminLayout";
import { AdminDashboard } from "../pages/AdminViews/AdminDashboard";
import { PosterEditor } from "../pages/AdminViews/PosterEditor";
import { Setting } from "../pages/AdminViews/Setting";
import { LaunchPage } from "../pages/LaunchPage";
import LoginPage from "../pages/LoginPage";
import SignUpPage from "../pages/SignUpPage";
import { ThankYou } from "../pages/CustomerViews/ThankyouPage";
import ProtectedRoute from "../Router/ProtectedRoute ";
import { Route, Routes } from "react-router-dom";
import ErrorPage from "../pages/Utils/ErrorPage";
import ForgotPasswordPage from "../pages/ForgotPasswordPage";
import ResetPasswordPage from "../pages/ResetPasswordPage";
import UserManagement from "../pages/AdminViews/UserManagement";
import EmployeeLogin from "../pages/EmployeeLogin";
import EmployeeRouteGuard from "../pages/Utils/EmployeeRouteGuard";
import EmployeeLayout from "../pages/Utils/EmployeeLayout";
export default function ResturantAppRouter() {
  return (
    <AuthProvider>
      <Routes>
        {/* Public routes */}
        <Route path="/" element={<LaunchPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/signup" element={<SignUpPage />} />
        <Route path="/customerOrder/:tableNumber" element={<CustomerOrder />} />
        <Route
          path="/guest-orders/:tableNumber"
          element={<CustomerOrdersList />}
        />
        <Route path="/thank-you/:tableNumber" element={<ThankYou />} />

        <Route
          path="/tableQRs"
          element={
            <ProtectedRoute allowedRoles={["ADMIN"]}>
              <TableQRGenerator />
            </ProtectedRoute>
          }
        />

        <Route
          path="/admin"
          element={
            <ProtectedRoute allowedRoles={["ADMIN"]}>
              <AdminLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<AdminDashboard />} />
          <Route path="menu" element={<MenuManager />} />
          <Route path="QRCode" element={<TableQRGenerator />} />
          <Route path="poster" element={<PosterEditor />} />
          <Route path="users" element={<UserManagement />} />
          <Route path="setting" element={<Setting />} />
        </Route>
        <Route path="/error" element={<ErrorPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/reset-password/:token" element={<ResetPasswordPage />} />
        <Route path="/employee/login" element={<EmployeeLogin />} />
        <Route
          path="/employee/*"
          element={
            <EmployeeRouteGuard>
              <EmployeeLayout />
            </EmployeeRouteGuard>
          }
        >
          <Route path="waiter-dashboard" element={<WaiterDashboard />} />
          <Route path="kitchen-dashboard" element={<KitchenDashboard />} />
        </Route>
      </Routes>
    </AuthProvider>
  );
}
