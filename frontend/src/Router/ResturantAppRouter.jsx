import { BrowserRouter, Route, Routes } from "react-router-dom";
import MenuManager from "../pages/MenuManager";
import HomeScreen from "../pages/HomeScreen";

import { KitchenDashboard } from "../pages/KitchenDashboard";
import { WaiterDashboard } from "../pages/WaiterDashboard";
import { CustomerOrdersList } from "../pages/CustomerViews/CustomerOrdersList";

import { CustomerOrder } from "../pages/CustomerViews/CustomerOrder";
import { TableQRGenerator } from "../pages/QRcode/TableQRGenerator";
import { AdminLayout } from "../pages/AdminViews/AdminLayout";
import { AdminDashboard } from "../pages/AdminViews/AdminDashboard";
import { PosterEditor } from "../pages/AdminViews/PosterEditor";
import { UpsellSettings } from "../pages/AdminViews/UpsellSettings";

export default function ResturantAppRouter() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<HomeScreen />} />
        <Route path="/menuManager" element={<MenuManager />} />
        <Route
          path="/customerOrder/:tableNumber?"
          element={<CustomerOrder />}
        />
        <Route path="/kitchenDashboard" element={<KitchenDashboard />} />
        <Route path="/waiterDashboard" element={<WaiterDashboard />} />
        <Route
          path="/guest-orders/:tableNumber"
          element={<CustomerOrdersList />}
        />

        <Route path="/tableQRs" element={<TableQRGenerator />} />

        <Route path="/admin" element={<AdminLayout />}>
          <Route index element={<AdminDashboard />} />
          <Route path="menu" element={<MenuManager />} />
          <Route path="QRCode" element={<TableQRGenerator />} />
          <Route path="poster" element={<PosterEditor />} />
          <Route path="upsell" element={<UpsellSettings />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
