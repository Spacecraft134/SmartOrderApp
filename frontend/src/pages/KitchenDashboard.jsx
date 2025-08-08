import React, { useEffect, useState, useRef } from "react";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { motion, AnimatePresence } from "framer-motion";
import notificationSound from "../assets/ding-101492.mp3";
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

  const playNotification = () => {
    if (audioRef.current) {
      audioRef.current.currentTime = 0;
      audioRef.current.play().catch(() => {
        toast.info("New order received!");
      });
    }
  };

  // Update your fetchOrders function
  const fetchOrders = async () => {
    try {
      setIsLoading(true);
      const token = localStorage.getItem("token"); // Get token from storage

      const response = await axios.get("http://localhost:8080/api/orders", {
        params: { status: "IN_PROGRESS" },
        headers: {
          Authorization: `Bearer ${token}`, // Add authorization header
        },
      });

      const processed = response.data
        .map(processOrderData)
        .filter(Boolean)
        .filter((order) => order.statusOfOrder === "IN_PROGRESS");
      setOrders(processed);
    } catch (error) {
      if (error.response?.status === 401) {
        toast.error("Session expired. Please login again.");
        // Redirect to login or handle token refresh
        window.location.href = "/login";
      } else {
        toast.error("Failed to load orders");
      }
    } finally {
      setIsLoading(false);
    }
  };
  const playedSoundOrders = useRef(new Set());
  useEffect(() => {
    fetchOrders();

    const socket = new SockJS("http://localhost:8080/ws");
    const stompClient = new Client({
      webSocketFactory: () => socket,
      reconnectDelay: 5000,
      onConnect: () => {
        stompClient.subscribe("/topic/orders", (message) => {
          if (!message?.body) return;

          try {
            const orderEvent = JSON.parse(message.body);
            const order = processOrderData(orderEvent.order);
            const eventType = orderEvent.eventType;

            setOrders((prev) => {
              if (
                eventType === "DELETE" ||
                order.statusOfOrder !== "IN_PROGRESS"
              ) {
                return prev.filter((o) => o.id !== order.id);
              }

              const existingIndex = prev.findIndex((o) => o.id === order.id);
              if (existingIndex >= 0) {
                const updated = [...prev];
                updated[existingIndex] = order;
                return updated;
              } else {
                if (!playedSoundOrders.current.has(order.id)) {
                  playNotification();
                  playedSoundOrders.current.add(order.id);
                }
                return [...prev, order];
              }
            });
          } catch (error) {
            console.error("Failed to process WebSocket message:", error);
          }
        });
      },
      onStompError: (frame) => {
        console.error("WebSocket error:", frame);
        toast.error("WebSocket connection error. Trying to reconnect...");
      },
      onWebSocketClose: () => {
        console.log("WebSocket connection closed");
      },
    });

    stompClient.activate();
    clientRef.current = stompClient;

    return () => {
      clientRef.current?.deactivate();
      console.log("WebSocket connection cleaned up");
    };
  }, []);

  const markOrderReady = (id) => {
    axios
      .put(`http://localhost:8080/api/orders/${id}/ready`)
      .then(() => {
        toast.success("Order marked READY");
        setOrders((prev) => prev.filter((order) => order.id !== id));
      })
      .catch(() => toast.error("Failed to mark order READY"));
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
              {isLoading ? "Loading..." : `Active Orders (${orders.length})`}
            </h2>
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

          {isLoading ? (
            <div className="bg-gray-50 p-8 rounded-lg text-center">
              <p className="text-gray-500">Loading orders...</p>
            </div>
          ) : orders.length === 0 ? (
            <div className="bg-gray-50 p-8 rounded-lg text-center">
              <p className="text-gray-500">No active orders</p>
            </div>
          ) : (
            <div className="space-y-4">
              {orders.map((order) => {
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
                            onClick={() => markOrderReady(order.id)}
                            className="flex items-center gap-1 bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded text-sm"
                          >
                            <FiCheck size={14} /> Ready
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
        autoClose={3000}
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
