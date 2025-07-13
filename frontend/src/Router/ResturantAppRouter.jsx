import { BrowserRouter, Route, Routes } from "react-router-dom";
import MenuManager from "../pages/MenuManager";
import HomeScreen from "../pages/HomeScreen";

import { KitchenDashboard } from "../pages/KitchenDashboard";
import { WaiterDashboard } from "../pages/WaiterDashboard";
import { CustomerOrdersList } from "../pages/CustomerViews/CustomerOrdersList";

import { CustomerOrder } from "../pages/CustomerViews/CustomerOrder";
import { TableQRGenerator } from "../pages/QRcode/TableQRGenerator";

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
      </Routes>
    </BrowserRouter>
  );
}
