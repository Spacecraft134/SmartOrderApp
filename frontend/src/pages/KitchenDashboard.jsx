import React, { useEffect, useState, useRef } from "react";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { motion, AnimatePresence } from "framer-motion";
import notificationSound from "../assets/ding-101492.mp3";
import SockJS from "sockjs-client";
import { Client } from "@stomp/stompjs";
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
  const clientRef = useRef(null);
  const audioRef = useRef(null);
  const navigate = useNavigate();
  const [userName, setUserName] = useState("Kitchen Staff");
  const playedSoundOrders = useRef(new Set());

  // Better admin view detection
  const isAdminView = React.useMemo(() => {
    return (
      window.location.pathname.includes("admin") ||
      window.parent !== window || // In iframe/modal
      document.referrer.includes("admin")
    );
  }, []);

  useEffect(() => {
    audioRef.current = new Audio(notificationSound);
    audioRef.current.load();

    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    if (isAdminView) {
      // For admin view, get admin info
      const userData = localStorage.getItem("userData");
      if (userData) {
        try {
          const { name } = JSON.parse(userData);
          setUserName(name || "Admin");
        } catch (e) {
          setUserName("Admin");
        }
      } else {
        setUserName("Admin");
      }
    } else {
      // For normal kitchen staff access
      const storedUserData = localStorage.getItem("employeeData");
      if (storedUserData) {
        try {
          const { name } = JSON.parse(storedUserData);
          setUserName(name || "Kitchen Staff");
        } catch (e) {
          console.error("Failed to parse user data:", e);
          setUserName("Kitchen Staff");
        }
      } else {
        navigate("/employee/login");
      }
    }
  }, [navigate, isAdminView]);

  const playNotification = () => {
    if (audioRef.current) {
      audioRef.current.currentTime = 0;
      audioRef.current.play().catch(() => {
        toast.info("New order received!");
      });
    }
  };

  const getAuthToken = () => {
    if (isAdminView) {
      return localStorage.getItem("token");
    } else {
      return localStorage.getItem("employeeToken");
    }
  };

  const fetchOrders = async () => {
    try {
      setIsLoading(true);
      const token = getAuthToken();

      if (!token) {
        throw new Error("No authentication token found");
      }

      // Use the proper kitchen endpoints instead of generic orders
      const [pendingResponse, inProgressResponse] = await Promise.all([
        api
          .get("/api/orders/pending", {
            headers: { Authorization: `Bearer ${token}` },
          })
          .catch((err) => ({ data: [] })), // Handle errors gracefully
        api
          .get("/api/orders/in-progress", {
            headers: { Authorization: `Bearer ${token}` },
          })
          .catch((err) => ({ data: [] })),
      ]);

      const pendingOrders = (pendingResponse.data || [])
        .map(processOrderData)
        .filter(Boolean);
      const inProgressOrders = (inProgressResponse.data || [])
        .map(processOrderData)
        .filter(Boolean);

      // Combine and sort by time (newest first)
      const allOrders = [...pendingOrders, ...inProgressOrders].sort(
        (a, b) => new Date(b.time) - new Date(a.time)
      );

      setOrders(allOrders);
    } catch (error) {
      console.error("Failed to fetch orders:", error);
      toast.error("Failed to load orders");

      if (error.response?.status === 401 || error.response?.status === 403) {
        if (isAdminView) {
          toast.error("Admin authentication required");
        } else {
          navigate("/employee/login");
        }
      }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();

    const socket = new SockJS("http://localhost:8080/ws");
    const stompClient = new Client({
      webSocketFactory: () => socket,
      reconnectDelay: 5000,
      onConnect: () => {
        console.log("Kitchen Dashboard WebSocket connected");
        stompClient.subscribe("/topic/orders", (message) => {
          if (!message?.body) return;

          try {
            const orderEvent = JSON.parse(message.body);
            const order = processOrderData(orderEvent.order);
            const eventType = orderEvent.eventType;

            if (!order) return;

            setOrders((prev) => {
              // Remove order if it's completed, ready, or deleted
              if (
                eventType === "DELETE" ||
                order.statusOfOrder === "READY" ||
                order.statusOfOrder === "COMPLETED"
              ) {
                return prev.filter((o) => o.id !== order.id);
              }

              // Only include orders that are pending or in progress
              if (
                order.statusOfOrder !== "WAITING_FOR_CONFIRMATION" &&
                order.statusOfOrder !== "IN_PROGRESS"
              ) {
                return prev.filter((o) => o.id !== order.id);
              }

              const existingIndex = prev.findIndex((o) => o.id === order.id);
              if (existingIndex >= 0) {
                const updated = [...prev];
                updated[existingIndex] = order;
                return updated.sort(
                  (a, b) => new Date(b.time) - new Date(a.time)
                );
              } else {
                // New order - play notification
                if (!playedSoundOrders.current.has(order.id)) {
                  playNotification();
                  playedSoundOrders.current.add(order.id);
                  toast.success(`New order from Table ${order.tableNumber}!`);
                }
                return [...prev, order].sort(
                  (a, b) => new Date(b.time) - new Date(a.time)
                );
              }
            });
          } catch (error) {
            console.error("Failed to process WebSocket message:", error);
          }
        });
      },
      onStompError: (frame) => {
        console.error("Kitchen WebSocket error:", frame);
        toast.error("Connection error. Trying to reconnect...");
      },
      onWebSocketClose: () => {
        console.log("Kitchen WebSocket connection closed");
      },
    });

    stompClient.activate();
    clientRef.current = stompClient;

    return () => {
      clientRef.current?.deactivate();
    };
  }, [isAdminView]);

  const startOrderProgress = async (id) => {
    try {
      const token = getAuthToken();
      if (!token) {
        throw new Error("No authentication token found");
      }

      await api.put(`/api/orders/${id}/progress`, null, {
        headers: { Authorization: `Bearer ${token}` },
      });

      toast.success("Order started!");

      // Update local state
      setOrders((prev) =>
        prev.map((order) =>
          order.id === id ? { ...order, statusOfOrder: "IN_PROGRESS" } : order
        )
      );
    } catch (error) {
      console.error("Failed to start order:", error);
      toast.error("Failed to start order");

      if (error.response?.status === 401 || error.response?.status === 403) {
        if (isAdminView) {
          toast.error("Admin authentication required");
        } else {
          navigate("/employee/login");
        }
      }
    }
  };

  const markOrderReady = async (id) => {
    try {
      const token = getAuthToken();
      if (!token) {
        throw new Error("No authentication token found");
      }

      await api.put(`/api/orders/${id}/ready`, null, {
        headers: { Authorization: `Bearer ${token}` },
      });

      toast.success("Order marked READY for pickup!");

      // Remove from kitchen dashboard
      setOrders((prev) => prev.filter((order) => order.id !== id));
    } catch (error) {
      console.error("Failed to mark order ready:", error);
      toast.error("Failed to mark order ready");

      if (error.response?.status === 401 || error.response?.status === 403) {
        if (isAdminView) {
          toast.error("Admin authentication required");
        } else {
          navigate("/employee/login");
        }
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
        localStorage.removeItem("employeeToken");
        navigate("/employee/login");
      } else {
        // For admin view, just close modal or redirect
        if (window.parent !== window) {
          window.parent.postMessage({ action: "closeModal" }, "*");
        } else {
          navigate("/admin/dashboard");
        }
      }
    } catch (error) {
      console.error("Logout failed:", error);
      toast.error("Logout failed. Please try again.");
    }
  };

  const getPendingOrders = () =>
    orders.filter(
      (order) => order.statusOfOrder === "WAITING_FOR_CONFIRMATION"
    );
  const getInProgressOrders = () =>
    orders.filter((order) => order.statusOfOrder === "IN_PROGRESS");

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
              onClick={() => {
                menuItemCache.clear();
                fetchOrders();
              }}
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
