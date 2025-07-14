import { Link, Outlet, useLocation } from "react-router-dom";
import {
  FiGrid as FiDashboard,
  FiMenu as FiMenuIcon,
  FiSettings,
  FiImage,
  FiCode,
  FiTrendingUp,
} from "react-icons/fi";
import { useState } from "react";

export function AdminLayout() {
  const location = useLocation();
  const [darkMode, setDarkMode] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const navItems = [
    {
      path: "/admin",
      name: "Dashboard",
      icon: <FiDashboard className="text-lg" />,
    },
    {
      path: "/admin/menu",
      name: "Menu Manager",
      icon: <FiMenuIcon className="text-lg" />,
    },
    {
      path: "/admin/QRCode",
      name: "QR Code",
      icon: <FiCode className="text-lg" />,
    },
    {
      path: "/admin/poster",
      name: "Poster Editor",
      icon: <FiImage className="text-lg" />,
    },
    {
      path: "/admin/upsell",
      name: "Upsell",
      icon: <FiTrendingUp className="text-lg" />,
    },
    {
      path: "/admin/setting",
      name: "Settings",
      icon: <FiSettings className="text-lg" />,
    },
  ];

  return (
    <div
      className={`flex min-h-screen ${
        darkMode ? "bg-gray-900 text-gray-100" : "bg-gray-50 text-gray-800"
      }`}
    >
      {/* Sidebar */}
      <aside
        className={`${
          sidebarOpen ? "w-64" : "w-20"
        } bg-blue-900 text-white flex flex-col transition-all duration-300 ease-in-out`}
      >
        <div className="p-6 font-bold text-xl border-b border-blue-700 flex items-center justify-between">
          {sidebarOpen ? "Admin Panel" : "AP"}
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-1 rounded-full hover:bg-blue-700"
          >
            {sidebarOpen ? "«" : "»"}
          </button>
        </div>

        <nav className="flex-1 p-4 space-y-2">
          {navItems.map((item, index) => (
            <Link
              key={index}
              to={item.path}
              className={`flex items-center p-3 rounded-lg transition-all hover:bg-blue-700 hover:shadow-md ${
                location.pathname === item.path ? "bg-blue-700 shadow-md" : ""
              }`}
            >
              <span className="flex-shrink-0">{item.icon}</span>
              {sidebarOpen && <span className="ml-3">{item.name}</span>}
            </Link>
          ))}
        </nav>
      </aside>

      {/* Main Content - Full Width */}
      <main
        className={`flex-1 transition-all duration-300 ${
          sidebarOpen ? "ml-64" : "ml-20"
        }`}
      >
        <div
          className={`min-h-screen ${
            darkMode ? "bg-gray-800" : "bg-white"
          } p-6`}
        >
          <Outlet />
        </div>
      </main>
    </div>
  );
}
