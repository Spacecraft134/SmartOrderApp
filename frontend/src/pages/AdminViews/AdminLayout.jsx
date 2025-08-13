import { Link, Outlet, useLocation, useNavigate } from "react-router-dom";
import {
  FiGrid as FiDashboard,
  FiMenu as FiMenuIcon,
  FiSettings,
  FiImage,
  FiCode,
  FiLogOut,
  FiX,
  FiUsers,
} from "react-icons/fi";
import { useState } from "react";
import { useAuth } from "../Context/AuthContext";

export function AdminLayout() {
  const location = useLocation();
  const [darkMode] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const { logout } = useAuth();

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
      path: "/admin/users",
      name: "User Management",
      icon: <FiUsers className="text-lg" />,
    },
    {
      path: "/admin/setting",
      name: "Settings",
      icon: <FiSettings className="text-lg" />,
    },
  ];

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error("Logout error:", error);
    } finally {
      setShowLogoutModal(false);
    }
  };

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
        } bg-blue-900 text-white flex flex-col justify-between transition-all duration-300 ease-in-out`}
      >
        <div>
          <div className="p-6 font-bold text-xl border-b border-blue-700 flex items-center justify-between">
            {sidebarOpen ? "Admin Panel" : "AP"}
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="p-1 rounded-full hover:bg-blue-700"
            >
              {sidebarOpen ? "«" : "»"}
            </button>
          </div>

          <nav className="p-4 space-y-2">
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
        </div>

        <div className="p-4 border-t border-blue-700">
          <button
            onClick={() => setShowLogoutModal(true)}
            className={`flex items-center w-full p-3 rounded-lg transition-all hover:bg-blue-700 hover:shadow-md`}
          >
            <span className="flex-shrink-0">
              <FiLogOut className="text-lg" />
            </span>
            {sidebarOpen && <span className="ml-3">Logout</span>}
          </button>
        </div>
      </aside>

      {/* Main Content */}
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
      {showLogoutModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div
            className={`w-full max-w-md p-6 rounded-xl shadow-2xl transform transition-all duration-300 scale-95 animate-in fade-in zoom-in ${
              darkMode ? "bg-slate-800" : "bg-white"
            }`}
          >
            <div className="bg-gradient-to-r from-blue-600 to-blue-500 p-4 -m-6 mb-4 rounded-t-lg">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-bold text-white">Confirm Logout</h3>
                <button
                  onClick={() => setShowLogoutModal(false)}
                  className="p-1 rounded-full hover:bg-blue-700/30 transition-colors"
                >
                  <FiX className="text-lg text-white" />
                </button>
              </div>
            </div>

            <div className="py-4">
              <div className="flex justify-center mb-4">
                <div className="p-3 bg-blue-100/50 dark:bg-blue-900/30 rounded-full">
                  <FiLogOut className="text-3xl text-blue-600 dark:text-blue-400" />
                </div>
              </div>
              <p className="text-center text-black dark:text-gray-800 mb-6">
                Are you sure you want to log out of your admin account?
              </p>
            </div>
            <div className="flex justify-center space-x-4">
              <button
                onClick={() => setShowLogoutModal(false)}
                className={`px-5 py-2.5 rounded-lg font-medium transition-all duration-200 ${
                  darkMode
                    ? "bg-slate-700 hover:bg-slate-600 text-gray-300"
                    : "bg-gray-200 hover:bg-gray-300 text-gray-700"
                }`}
              >
                Cancel
              </button>
              <button
                onClick={handleLogout}
                className="px-5 py-2.5 rounded-lg font-medium bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white shadow-md hover:shadow-lg transition-all duration-200"
              >
                Yes, Logout
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
