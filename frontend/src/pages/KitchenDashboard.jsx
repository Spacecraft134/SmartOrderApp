import React, { useEffect, useState, useRef } from "react";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { motion, AnimatePresence } from "framer-motion";
import {
  FiCheck,
  FiClock,
  FiAlertTriangle,
  FiChevronDown,
  FiChevronUp,
  FiRotateCw,
  FiLogOut,
  FiPlay,
} from "react-icons/fi";
import api from "./Utils/api";
import { useNavigate } from "react-router-dom";

const menuItemCache = new Map();

const processOrderData = (order) => {
  if (!order) return null;

  return {
    ...order,
    items: (order.items || []).map((item) => {
      const cachedMenuItem = item.menuItem?.id
        ? menuItemCache.get(item.menuItem.id)
        : null;

      const menuItem = cachedMenuItem ||
        item.menuItem || {
          id: -1,
          name: "Loading...",
          price: 0,
          category: "",
        };

      if (item.menuItem?.id && !cachedMenuItem) {
        menuItemCache.set(item.menuItem.id, item.menuItem);
      }

      return {
        ...item,
        quantity: item.quantity || 1,
        instructions: item.instructions || "",
        menuItem,
      };
    }),
  };
};

export function KitchenDashboard() {
  const [orders, setOrders] = useState([]);
  const [expandedOrders, setExpandedOrders] = useState({});
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();
  const [userName, setUserName] = useState("Kitchen Staff");
  const refreshIntervalRef = useRef(null);

  const isAdminView = React.useMemo(() => {
    return (
      window.location.pathname.includes("admin") ||
      window.parent !== window ||
      document.referrer.includes("admin")
    );
  }, []);

  useEffect(() => {
    if (isAdminView) {
      const userData = localStorage.getItem("userData");
      if (userData) {
        try {
          const { name } = JSON.parse(userData);
          setUserName(name || "Admin");
        } catch (e) {
          setUserName("Admin");
        }
      }
    } else {
      const storedUserData = localStorage.getItem("employeeData");
      if (storedUserData) {
        try {
          const { name } = JSON.parse(storedUserData);
          setUserName(name || "Kitchen Staff");
        } catch (e) {
          setUserName("Kitchen Staff");
        }
      } else {
        navigate("/employee/login");
      }
    }
  }, [navigate, isAdminView]);

  const getAuthToken = () => {
    return isAdminView
      ? localStorage.getItem("accessToken")
      : localStorage.getItem("employeeAccessToken");
  };

  const fetchOrders = async () => {
    try {
      setIsLoading(true);
      const token = getAuthToken();
      if (!token) throw new Error("No authentication token found");

      const [pending, inProgress] = await Promise.all([
        api
          .get("/api/orders/pending", {
            headers: { Authorization: `Bearer ${token}` },
          })
          .then((res) => res.data || [])
          .catch(() => []),
        api
          .get("/api/orders/in-progress", {
            headers: { Authorization: `Bearer ${token}` },
          })
          .then((res) => res.data || [])
          .catch(() => []),
      ]);

      const processedOrders = [...pending, ...inProgress]
        .map(processOrderData)
        .filter(Boolean)
        .sort((a, b) => new Date(b.time) - new Date(a.time));

      setOrders(processedOrders);
    } catch (error) {
      toast.error("Failed to load orders");

      if (error.response?.status === 401 || error.response?.status === 403) {
        if (!isAdminView) navigate("/employee/login");
      }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();

    refreshIntervalRef.current = setInterval(fetchOrders, 15000);

    return () => {
      if (refreshIntervalRef.current) {
        clearInterval(refreshIntervalRef.current);
      }
    };
  }, []);

  const startOrderProgress = async (id) => {
    try {
      const token = getAuthToken();
      if (!token) {
        toast.error("Session expired. Please login again.");
        if (!isAdminView) navigate("/employee/login");
        return;
      }

      setIsLoading(true);
      await api.put(`/api/orders/${id}/progress`, null, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      toast.success("Order started!");
      fetchOrders();
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to start order");

      if (error.response?.status === 401 || error.response?.status === 403) {
        if (!isAdminView) navigate("/employee/login");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const markOrderReady = async (id) => {
    try {
      const token = getAuthToken();
      if (!token) throw new Error("No authentication token found");

      await api.put(`/api/orders/${id}/ready`, null, {
        headers: { Authorization: `Bearer ${token}` },
      });

      fetchOrders(); // Refresh orders after status change
    } catch (error) {
      toast.error("Failed to mark order ready");

      if (error.response?.status === 401 || error.response?.status === 403) {
        if (!isAdminView) navigate("/employee/login");
      }
    }
  };

  const toggleOrderExpand = (id) => {
    setExpandedOrders((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const calculateOrderAge = (orderTime) => {
    const diffMinutes = Math.floor((Date.now() - new Date(orderTime)) / 60000);
    if (diffMinutes < 1) return "Just now";
    if (diffMinutes < 60) return `${diffMinutes}m ago`;
    return `${Math.floor(diffMinutes / 60)}h ${diffMinutes % 60}m ago`;
  };

  const getOrderPriority = (order) => {
    const ageMinutes = Math.floor((Date.now() - new Date(order.time)) / 60000);
    const hasUrgentInstructions = order.items?.some((item) =>
      item.instructions?.toLowerCase().includes("urgent")
    );

    if (hasUrgentInstructions) return "urgent";
    if (ageMinutes > 30) return "overdue";
    if (ageMinutes > 15) return "warning";
    return "normal";
  };

  const handleLogout = async () => {
    try {
      if (!isAdminView) {
        await api.post("/api/employee/logout");
        localStorage.removeItem("employeeData");
        localStorage.removeItem("employeeAccessToken");
        localStorage.removeItem("employeeRefreshToken");
        navigate("/employee/login");
      } else if (window.parent !== window) {
        window.parent.postMessage({ action: "closeModal" }, "*");
      } else {
        navigate("/admin/dashboard");
      }
    } catch (error) {
      toast.error("Logout failed. Please try again.");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 w-full">
      <header className="bg-gradient-to-r from-blue-600 to-blue-600 text-white py-8 px-6 shadow-xl w-full">
        <div className="max-w-6xl mx-auto flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">Kitchen Dashboard</h1>
            <h2 className="text-lg opacity-90">
              {isAdminView ? `Admin View - ${userName}` : `Hello, ${userName}`}
            </h2>
          </div>
          <div className="flex items-center gap-4">
            {!isAdminView && (
              <button
                onClick={handleLogout}
                className="flex items-center gap-2 bg-white/20 hover:bg-white/30 px-6 py-3 rounded-xl text-lg transition-colors"
              >
                <FiLogOut size={20} />
                Logout
              </button>
            )}
          </div>
        </div>
      </header>

      <main className="w-full px-6 py-8 -mt-6">
        <div className="bg-white rounded-xl shadow-xl p-6 border border-gray-200 mx-auto max-w-6xl">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-semibold text-gray-800 flex items-center gap-2">
              <FiClock className="text-blue-500" />
              {isLoading ? "Loading..." : `Kitchen Queue (${orders.length})`}
            </h2>
            <button
              onClick={fetchOrders}
              className="flex items-center gap-1 text-blue-600 hover:text-blue-800 px-4 py-2 rounded-lg hover:bg-blue-50 transition-colors"
              disabled={isLoading}
            >
              <FiRotateCw className={isLoading ? "animate-spin" : ""} />
              Refresh
            </button>
          </div>

          {isLoading ? (
            <div className="bg-gray-50 p-8 rounded-lg text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-4"></div>
              <p className="text-gray-500">Loading kitchen orders...</p>
            </div>
          ) : orders.length === 0 ? (
            <div className="bg-gray-50 p-8 rounded-lg text-center">
              <p className="text-gray-500 text-lg">
                🎉 All caught up! No orders in queue.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {orders.map((order) => {
                const priority = getOrderPriority(order);
                const isExpanded = expandedOrders[order.id];

                let borderColor = "border-blue-500";
                let bgColor = "bg-white";
                let badgeColor = "bg-blue-100 text-blue-800";

                if (priority === "urgent") {
                  borderColor = "border-red-500";
                  bgColor = "bg-red-50";
                  badgeColor = "bg-red-100 text-red-800";
                } else if (priority === "overdue") {
                  borderColor = "border-red-400";
                  bgColor = "bg-red-25";
                  badgeColor = "bg-red-100 text-red-700";
                } else if (priority === "warning") {
                  borderColor = "border-yellow-500";
                  bgColor = "bg-yellow-25";
                  badgeColor = "bg-yellow-100 text-yellow-800";
                }

                return (
                  <motion.div
                    key={order.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3 }}
                    className={`rounded-xl shadow-md overflow-hidden border-l-4 ${borderColor} ${bgColor}`}
                  >
                    <div className="p-5">
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="text-lg font-bold">
                              Table #{order.tableNumber}
                            </h3>
                            <span
                              className={`px-2 py-1 rounded-full text-xs font-medium ${badgeColor}`}
                            >
                              {order.statusOfOrder ===
                              "WAITING_FOR_CONFIRMATION"
                                ? "NEW"
                                : "COOKING"}
                            </span>
                            {priority === "urgent" && (
                              <span className="flex items-center gap-1 text-xs px-2 py-1 bg-red-100 text-red-800 rounded-full">
                                <FiAlertTriangle size={12} /> URGENT
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-2 text-sm text-gray-600">
                            <span>{calculateOrderAge(order.time)}</span>
                            <span>•</span>
                            <span>{order.items?.length || 0} items</span>
                            <span>•</span>
                            <span className="font-medium">
                              $
                              {order.items
                                ?.reduce(
                                  (sum, item) =>
                                    sum +
                                    (item.menuItem?.price || 0) * item.quantity,
                                  0
                                )
                                .toFixed(2)}
                            </span>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          {order.statusOfOrder ===
                            "WAITING_FOR_CONFIRMATION" && (
                            <button
                              onClick={() => startOrderProgress(order.id)}
                              className="flex items-center gap-1 bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded text-sm transition-colors"
                            >
                              <FiPlay size={14} /> Start
                            </button>
                          )}
                          {order.statusOfOrder === "IN_PROGRESS" && (
                            <button
                              onClick={() => markOrderReady(order.id)}
                              className="flex items-center gap-1 bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded text-sm transition-colors"
                            >
                              <FiCheck size={14} /> Ready
                            </button>
                          )}
                          <button
                            onClick={() => toggleOrderExpand(order.id)}
                            className="text-gray-400 hover:text-gray-600 p-1 transition-colors"
                            aria-label={isExpanded ? "Collapse" : "Expand"}
                          >
                            {isExpanded ? <FiChevronUp /> : <FiChevronDown />}
                          </button>
                        </div>
                      </div>

                      <AnimatePresence>
                        {isExpanded && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: "auto", opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.2 }}
                            className="overflow-hidden"
                          >
                            <div className="space-y-3 pt-3 border-t border-gray-200">
                              {order.items?.map((item, index) => (
                                <div
                                  key={`${order.id}-${item.id || index}`}
                                  className="pb-3 border-b border-gray-100 last:border-0"
                                >
                                  <div className="flex justify-between">
                                    <div>
                                      <p className="font-medium text-gray-900">
                                        {item.menuItem?.name || "Unknown Item"}{" "}
                                        × {item.quantity}
                                      </p>
                                      {item.menuItem?.category && (
                                        <p className="text-xs text-gray-500 mt-1">
                                          Category: {item.menuItem.category}
                                        </p>
                                      )}
                                      {item.instructions && (
                                        <p className="text-sm text-gray-700 mt-1 bg-yellow-50 p-2 rounded">
                                          <span className="font-medium text-yellow-800">
                                            Special Instructions:
                                          </span>{" "}
                                          {item.instructions}
                                        </p>
                                      )}
                                    </div>
                                    <span className="text-sm font-medium text-gray-600">
                                      $
                                      {(
                                        (item.menuItem?.price || 0) *
                                        item.quantity
                                      ).toFixed(2)}
                                    </span>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
        </div>
      </main>

      <ToastContainer
        position="top-center"
        autoClose={4000}
        hideProgressBar={false}
        newestOnTop={true}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        toastClassName="shadow-lg"
        progressClassName="bg-gradient-to-r from-blue-500 to-blue-500"
      />
    </div>
  );
}
