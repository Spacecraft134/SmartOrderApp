import { useEffect, useState, useRef } from "react";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { motion, AnimatePresence } from "framer-motion";
import SockJS from "sockjs-client";
import { Client } from "@stomp/stompjs";
import axios from "axios";
import {
  FiCheck,
  FiClock,
  FiAlertTriangle,
  FiChevronDown,
  FiChevronUp,
  FiRotateCw,
} from "react-icons/fi";

// Cache for menu items by id
const menuItemCache = new Map();

// To avoid duplicate toasts by order id
const activeToasts = new Set();

const processOrderData = (order) => {
  if (!order) return null;

  return {
    ...order,
    items: (order.items || []).map((item) => {
      const cachedMenuItem = item.menuItem?.id
        ? menuItemCache.get(item.menuItem.id)
        : null;

      // Use cached menu item or fallback to item.menuItem or placeholder
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
  const initializedRef = useRef(false);

  // Store timers to clean them on unmount or re-complete
  const deletionTimersRef = useRef(new Map());

  // Fetch orders once or on refresh
  const fetchOrders = async () => {
    try {
      setIsLoading(true);
      const response = await axios.get("http://localhost:8080/api/orders", {
        params: { _: Date.now() },
        timeout: 5000,
      });
      const processed = Array.isArray(response.data)
        ? response.data.map(processOrderData).filter(Boolean)
        : [processOrderData(response.data)].filter(Boolean);
      setOrders(processed);
      initializedRef.current = true;
    } catch (error) {
      if (!activeToasts.has("fetch-error")) {
        toast.error("Connection issue. Retrying...", { autoClose: 3000 });
        activeToasts.add("fetch-error");
        setTimeout(() => activeToasts.delete("fetch-error"), 3000);
      }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();

    // Setup WebSocket
    const socket = new SockJS("http://localhost:8080/ws");
    const stompClient = new Client({
      webSocketFactory: () => socket,
      reconnectDelay: 5000,
      heartbeatIncoming: 4000,
      heartbeatOutgoing: 4000,
      debug: (str) => console.debug(str),

      onConnect: () => {
        stompClient.subscribe("/topic/orders", (message) => {
          if (!initializedRef.current) return;

          try {
            const newOrder = processOrderData(JSON.parse(message.body));
            if (!newOrder) return;

            setOrders((prev) => {
              const existingIndex = prev.findIndex((o) => o.id === newOrder.id);

              if (existingIndex >= 0) {
                // Update existing order, preserve cached menuItems
                return prev.map((o, i) =>
                  i === existingIndex
                    ? {
                        ...newOrder,
                        items: newOrder.items.map((item, idx) => ({
                          ...item,
                          menuItem:
                            prev[existingIndex].items[idx]?.menuItem ||
                            item.menuItem,
                        })),
                      }
                    : o
                );
              }

              // New order toast (without sound)
              if (!activeToasts.has(`new-${newOrder.id}`)) {
                toast.success(`New order from Table #${newOrder.tableNumber}`, {
                  autoClose: 2000,
                });
                activeToasts.add(`new-${newOrder.id}`);
                setTimeout(
                  () => activeToasts.delete(`new-${newOrder.id}`),
                  2000
                );
              }

              return [...prev, newOrder];
            });
          } catch (error) {
            console.error("WebSocket parse error:", error);
          }
        });
      },

      onDisconnect: () => {
        if (!activeToasts.has("disconnect")) {
          toast.warning("Reconnecting...", { autoClose: 2000 });
          activeToasts.add("disconnect");
          setTimeout(() => activeToasts.delete("disconnect"), 2000);
        }
      },
    });

    stompClient.activate();
    clientRef.current = stompClient;

    // Cleanup on unmount
    return () => {
      if (clientRef.current?.active) {
        clientRef.current.deactivate();
      }
      // Clear all pending timers to avoid memory leaks
      deletionTimersRef.current.forEach((timer) => clearTimeout(timer));
      deletionTimersRef.current.clear();
      activeToasts.clear();
    };
  }, []);

  // Complete order handler with 5min delayed removal
  const handleCompleteOrder = async (id) => {
    try {
      await axios.put(
        `http://localhost:8080/api/orders/${id}/status`,
        { status: "Completed" },
        { timeout: 3000 }
      );

      setOrders((prev) =>
        prev.map((order) =>
          order.id === id ? { ...order, statusOfOrder: "Completed" } : order
        )
      );

      if (!activeToasts.has(`complete-${id}`)) {
        toast.success("Order completed!", { autoClose: 2000 });
        activeToasts.add(`complete-${id}`);
        setTimeout(() => activeToasts.delete(`complete-${id}`), 2000);
      }

      // Clear existing timer if any, then schedule removal
      if (deletionTimersRef.current.has(id)) {
        clearTimeout(deletionTimersRef.current.get(id));
      }
      const timer = setTimeout(() => {
        setOrders((prev) => prev.filter((order) => order.id !== id));
        deletionTimersRef.current.delete(id);
      }, 300000); // 5 minutes

      deletionTimersRef.current.set(id, timer);
    } catch (error) {
      if (!activeToasts.has(`complete-error-${id}`)) {
        toast.error("Failed to complete order", { autoClose: 2000 });
        activeToasts.add(`complete-error-${id}`);
        setTimeout(() => activeToasts.delete(`complete-error-${id}`), 2000);
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

  const activeOrders = orders.filter((o) => o.statusOfOrder !== "Completed");

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <header className="bg-gradient-to-r from-blue-700 to-indigo-800 text-white py-8 px-6 shadow-xl">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-3xl font-bold">Kitchen Dashboard</h1>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-8 -mt-6">
        <div className="bg-white rounded-xl shadow-xl p-6 border border-gray-200">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-semibold text-gray-800 flex items-center gap-2">
              <FiClock className="text-blue-500" />
              {isLoading
                ? "Loading..."
                : `Active Orders (${activeOrders.length})`}
            </h2>
            <div className="flex gap-3">
              <button
                onClick={() => {
                  menuItemCache.clear();
                  fetchOrders();
                }}
                className="flex items-center gap-1 text-blue-600 hover:text-blue-800"
                disabled={isLoading}
              >
                <FiRotateCw className={isLoading ? "animate-spin" : ""} />
                Refresh
              </button>
            </div>
          </div>

          {isLoading ? (
            <div className="bg-gray-50 p-8 rounded-lg text-center">
              <p className="text-gray-500">Loading orders...</p>
            </div>
          ) : activeOrders.length === 0 ? (
            <div className="bg-gray-50 p-8 rounded-lg text-center">
              <p className="text-gray-500">No active orders</p>
            </div>
          ) : (
            <div className="space-y-4">
              {activeOrders.map((order) => {
                const isUrgent = order.items?.some((item) =>
                  item.instructions?.toLowerCase().includes("urgent")
                );

                return (
                  <motion.div
                    key={order.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3 }}
                    className={`rounded-xl shadow-md overflow-hidden ${
                      isUrgent
                        ? "border-l-4 border-red-500 bg-red-50"
                        : "border-l-4 border-blue-500"
                    }`}
                  >
                    <div className="p-5">
                      <div className="flex justify-between items-start">
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="text-lg font-bold">
                              Table #{order.tableNumber}
                            </h3>
                            {isUrgent && (
                              <span className="flex items-center gap-1 text-xs px-2 py-1 bg-red-100 text-red-800 rounded-full">
                                <FiAlertTriangle size={12} /> URGENT
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-2 text-sm text-gray-500">
                            <span>{calculateOrderAge(order.time)}</span>
                            <span>•</span>
                            <span>{order.items?.length || 0} items</span>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleCompleteOrder(order.id)}
                            className="flex items-center gap-1 bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded text-sm"
                          >
                            <FiCheck size={14} /> Complete
                          </button>
                          <button
                            onClick={() => toggleOrderExpand(order.id)}
                            className="text-gray-400 hover:text-gray-600 p-1"
                          >
                            {expandedOrders[order.id] ? (
                              <FiChevronUp />
                            ) : (
                              <FiChevronDown />
                            )}
                          </button>
                        </div>
                      </div>

                      <AnimatePresence>
                        {expandedOrders[order.id] && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: "auto", opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.2 }}
                            className="mt-4 overflow-hidden"
                          >
                            <div className="space-y-3">
                              {order.items?.map((item, index) => (
                                <div
                                  key={`${order.id}-${item.id || index}`}
                                  className="pb-3 border-b border-gray-100 last:border-0"
                                >
                                  <div className="flex justify-between">
                                    <div>
                                      <p className="font-medium">
                                        {item.menuItem?.name || "Unknown"} ×{" "}
                                        {item.quantity}
                                      </p>
                                      {item.instructions && (
                                        <p className="text-sm text-gray-600 mt-1">
                                          <span className="font-medium">
                                            Notes:
                                          </span>{" "}
                                          {item.instructions}
                                        </p>
                                      )}
                                    </div>
                                    <span className="text-sm font-medium">
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
        autoClose={2000}
        hideProgressBar={false}
        newestOnTop={true}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        toastClassName="shadow-lg"
        progressClassName="bg-gradient-to-r from-blue-500 to-indigo-500"
      />
    </div>
  );
}
