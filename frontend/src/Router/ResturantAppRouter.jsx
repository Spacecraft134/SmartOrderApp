import { BrowserRouter, Route, Routes } from "react-router-dom";
import MenuManager from "../pages/MenuManager";
import HomeScreen from "../pages/HomeScreen";
import { CustomerOrder } from "../pages/CustomerOrder";
export default function ResturantAppRouter() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<HomeScreen />} />
        <Route path="/menuManager" element={<MenuManager />} />
        <Route path="/customerOrder" element={<CustomerOrder />} />
      </Routes>
    </BrowserRouter>
  );
}
