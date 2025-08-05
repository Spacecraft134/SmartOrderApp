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

export default function ResturantAppRouter() {
  return (
    <AuthProvider>
      <Routes>
        {/* Public routes */}
        <Route path="/" element={<LaunchPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/signup" element={<SignUpPage />} />
        <Route
          path="/customerOrder/:tableNumber?"
          element={<CustomerOrder />}
        />
        <Route
          path="/guest-orders/:tableNumber"
          element={<CustomerOrdersList />}
        />
        <Route path="/thank-you/:tableNumber" element={<ThankYou />} />

        {/* Protected routes */}
        <Route
          path="/waiter-dashboard"
          element={
            <ProtectedRoute allowedRoles={["WAITER", "ADMIN"]}>
              <WaiterDashboard />
            </ProtectedRoute>
          }
        />

        <Route
          path="/kitchen-dashboard"
          element={
            <ProtectedRoute allowedRoles={["KITCHEN", "ADMIN"]}>
              <KitchenDashboard />
            </ProtectedRoute>
          }
        />

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
          <Route path="setting" element={<Setting />} />
        </Route>
      </Routes>
    </AuthProvider>
  );
}
