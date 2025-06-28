import { BrowserRouter, Route, Routes } from "react-router-dom";
import MenuManager from "../pages/MenuManager";
import HomeScreen from "../pages/HomeScreen";
export default function ResturantAppRouter() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<HomeScreen />} />
        <Route path="/menuManager" element={<MenuManager />} />
      </Routes>
    </BrowserRouter>
  );
}
