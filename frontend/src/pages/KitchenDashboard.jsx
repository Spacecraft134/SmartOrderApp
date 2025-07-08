import axios from "axios";
import { useEffect, useState, useRef } from "react";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import notificationSound from "../assets/mixkit-interface-option-select-2573.wav";
import { motion, AnimatePresence } from "framer-motion";
import {
  FiCheck,
  FiClock,
  FiAlertTriangle,
  FiChevronDown,
  FiChevronUp,
} from "react-icons/fi";

const ORDER_STATUSES = {
  PREPARING: "Preparing",
  COMPLETED: "Completed",
  URGENT: "Urgent",
};

export function KitchenDashboard() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [expandedOrders, setExpandedOrders] = useState({});
  const [filter, setFilter] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const previousOrdersCount = useRef(0);
  const audioRef = useRef(null);

  // Initialize audio and cleanup
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

  // Play notification sound
  const playNotification = () => {
    if (audioRef.current) {
      audioRef.current.currentTime = 0;
      audioRef.current.play().catch((error) => {
        console.warn("Audio playback prevented:", error);
        toast.info("New order received!", {
          position: "top-center",
          autoClose: 2000,
          toastId: "audio-fallback",
        });
      });
    }
  };

  // Cleanup old completed orders
  const cleanupOldCompletedOrders = (completedOrders) => {
    const MAX_COMPLETED = 10;
    if (completedOrders.length > MAX_COMPLETED) {
      const toDelete = completedOrders
        .sort((a, b) => new Date(a.time) - new Date(b.time))
        .slice(0, completedOrders.length - MAX_COMPLETED);

      toDelete.forEach((order) => {
        axios
          .delete(`http://localhost:8080/api/orders/${order.id}`)
          .catch(() => {
            toast.error(`Failed to delete order #${order.id}`);
          });
      });
    }
  };

  // Fetch orders from API
  const fetchOrders = () => {
    setLoading(true);
    axios
      .get("http://localhost:8080/api/orders")
      .then((res) => {
        const newOrders = res.data.map((order) => ({
          ...order,
          isUrgent: order.items.some((item) =>
            item.instructions?.toLowerCase().includes("urgent")
          ),
        }));

        setOrders(newOrders);

        const completed = newOrders.filter(
          (order) => order.statusOfOrder === ORDER_STATUSES.COMPLETED
        );
        cleanupOldCompletedOrders(completed);

        if (newOrders.length > previousOrdersCount.current) {
          playNotification();
        }
        previousOrdersCount.current = newOrders.length;
      })
      .catch(() => toast.error("Failed to load orders!"))
      .finally(() => setLoading(false));
  };

  // Poll for new orders
  useEffect(() => {
    fetchOrders();
    const interval = setInterval(fetchOrders, 5000);
    return () => clearInterval(interval);
  }, []);

  // Update order status
  const updateOrderStatus = (id, status) => {
    axios
      .put(`http://localhost:8080/api/orders/${id}/status?status=${status}`)
      .then(() => {
        toast.success(`Order marked as ${status.toLowerCase()}`);
        fetchOrders();
      })
      .catch(() => toast.error("Failed to update order"));
  };

  // Toggle order expansion
  const toggleOrderExpand = (orderId) => {
    setExpandedOrders((prev) => ({
      ...prev,
      [orderId]: !prev[orderId],
    }));
  };

  // Calculate order age
  const calculateOrderAge = (orderTime) => {
    const now = new Date();
    const orderDate = new Date(orderTime);
    const diffMinutes = Math.floor((now - orderDate) / (1000 * 60));
    if (diffMinutes < 1) return "Just now";
    if (diffMinutes < 60) return `${diffMinutes}m ago`;
    const diffHours = Math.floor(diffMinutes / 60);
    return `${diffHours}h ${diffMinutes % 60}m ago`;
  };

  // Get status color
  const getStatusColor = (status, isUrgent) => {
    if (isUrgent && status === ORDER_STATUSES.PREPARING) {
      return "bg-red-100 text-red-800";
    }
    switch (status) {
      case ORDER_STATUSES.PREPARING:
        return "bg-blue-100 text-blue-800";
      case ORDER_STATUSES.COMPLETED:
        return "bg-green-100 text-green-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  // Filter and sort orders
  const filteredOrders = orders
    .filter((order) => {
      const matchesFilter =
        filter === "all" ||
        (filter === "active" &&
          order.statusOfOrder !== ORDER_STATUSES.COMPLETED) ||
        (filter === "completed" &&
          order.statusOfOrder === ORDER_STATUSES.COMPLETED) ||
        (filter === "urgent" && order.isUrgent);

      const matchesSearch =
        searchTerm === "" ||
        order.tableNumber.toString().includes(searchTerm) ||
        order.items.some((item) =>
          item.menuItem.name.toLowerCase().includes(searchTerm.toLowerCase())
        );

      return matchesFilter && matchesSearch;
    })
    .sort((a, b) => {
      // Urgent orders first
      if (a.isUrgent !== b.isUrgent) return a.isUrgent ? -1 : 1;
      // Then by time (newest first)
      return new Date(b.time) - new Date(a.time);
    });

  const activeOrders = filteredOrders.filter(
    (order) => order.statusOfOrder !== ORDER_STATUSES.COMPLETED
  );

  const completedOrders = filteredOrders.filter(
    (order) => order.statusOfOrder === ORDER_STATUSES.COMPLETED
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Header */}
      <header className="bg-gradient-to-r from-indigo-700 to-purple-700 text-white py-8 px-6 shadow-xl">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center">
            <div>
              <h1 className="text-3xl md:text-4xl font-bold mb-2">
                Kitchen Command Center
              </h1>
              <p className="text-indigo-100">
                Real-time order tracking and management
              </p>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-6 py-8 -mt-6">
        {/* Control Panel */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.1 }}
          className="bg-white rounded-xl shadow-2xl p-6 mb-8 border border-gray-200"
        >
          <div className="flex flex-col md:flex-row gap-6">
            <div className="flex-1">
              <h2 className="text-xl font-semibold text-gray-800 mb-4">
                Order Filters
              </h2>
              <div className="flex flex-wrap gap-3">
                <button
                  onClick={() => setFilter("all")}
                  className={`px-4 py-2 rounded-lg ${
                    filter === "all"
                      ? "bg-blue-600 text-white"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  }`}
                >
                  All Orders
                </button>
                <button
                  onClick={() => setFilter("active")}
                  className={`px-4 py-2 rounded-lg ${
                    filter === "active"
                      ? "bg-blue-600 text-white"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  }`}
                >
                  Active
                </button>
                <button
                  onClick={() => setFilter("completed")}
                  className={`px-4 py-2 rounded-lg ${
                    filter === "completed"
                      ? "bg-blue-600 text-white"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  }`}
                >
                  Completed
                </button>
                <button
                  onClick={() => setFilter("urgent")}
                  className={`px-4 py-2 rounded-lg ${
                    filter === "urgent"
                      ? "bg-red-600 text-white"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  }`}
                >
                  Urgent
                </button>
              </div>
            </div>

            <div className="w-full md:w-64">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Search Orders
              </label>
              <input
                type="text"
                placeholder="Table # or item..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>
        </motion.div>

        {/* Orders Display */}
        {loading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Active Orders */}
            <div>
              <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center gap-2">
                <FiClock className="text-blue-500" />
                Active Orders ({activeOrders.length})
              </h2>

              {activeOrders.length === 0 ? (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="bg-white p-6 rounded-xl shadow border border-gray-200 text-center"
                >
                  <p className="text-gray-500">No active orders to display</p>
                </motion.div>
              ) : (
                <div className="space-y-4">
                  {activeOrders.map((order) => (
                    <motion.div
                      key={order.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3 }}
                      className={`bg-white rounded-xl shadow-lg border-l-4 overflow-hidden ${
                        order.isUrgent
                          ? "border-red-500 animate-pulse"
                          : "border-blue-500"
                      }`}
                    >
                      <div className="p-5">
                        <div className="flex justify-between items-start">
                          <div>
                            <div className="flex items-center gap-2 mb-1">
                              <h3 className="text-lg font-bold">
                                Table #{order.tableNumber}
                              </h3>
                              {order.isUrgent && (
                                <span className="flex items-center gap-1 text-xs px-2 py-1 bg-red-100 text-red-800 rounded-full">
                                  <FiAlertTriangle size={12} />
                                  URGENT
                                </span>
                              )}
                            </div>
                            <div className="flex items-center gap-2 text-sm text-gray-500">
                              <span>{calculateOrderAge(order.time)}</span>
                              <span>•</span>
                              <span>{order.items.length} items</span>
                              <span>•</span>
                              <span
                                className={`px-2 py-1 rounded-full text-xs ${getStatusColor(
                                  order.statusOfOrder,
                                  order.isUrgent
                                )}`}
                              >
                                {order.statusOfOrder}
                              </span>
                            </div>
                          </div>
                          <button
                            onClick={() => toggleOrderExpand(order.id)}
                            className="text-gray-400 hover:text-gray-600"
                          >
                            {expandedOrders[order.id] ? (
                              <FiChevronUp />
                            ) : (
                              <FiChevronDown />
                            )}
                          </button>
                        </div>

                        <div className="mt-4 flex gap-2">
                          <button
                            onClick={() =>
                              updateOrderStatus(
                                order.id,
                                ORDER_STATUSES.COMPLETED
                              )
                            }
                            className="flex items-center gap-1 bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded text-sm"
                          >
                            <FiCheck size={14} />
                            Mark Done
                          </button>
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
                              <h4 className="font-semibold mb-2 text-gray-700">
                                Order Details
                              </h4>
                              <ul className="space-y-3">
                                {order.items.map((item, index) => (
                                  <li
                                    key={index}
                                    className="pb-2 border-b border-gray-100 last:border-0"
                                  >
                                    <div className="flex justify-between">
                                      <div>
                                        <p className="font-medium">
                                          {item.menuItem.name} × {item.quantity}
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
                                          item.menuItem.price * item.quantity
                                        ).toFixed(2)}
                                      </span>
                                    </div>
                                  </li>
                                ))}
                              </ul>
                              <div className="mt-3 pt-3 border-t border-gray-200 flex justify-between items-center">
                                <span className="text-sm text-gray-500">
                                  Order ID: #{order.id}
                                </span>
                                <span className="font-medium">
                                  Total: $
                                  {order.items
                                    .reduce(
                                      (sum, item) =>
                                        sum +
                                        item.menuItem.price * item.quantity,
                                      0
                                    )
                                    .toFixed(2)}
                                </span>
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </div>

            {/* Completed Orders */}
            <div>
              <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center gap-2">
                <FiCheck className="text-green-500" />
                Recently Completed ({completedOrders.length})
              </h2>

              {completedOrders.length === 0 ? (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="bg-white p-6 rounded-xl shadow border border-gray-200 text-center"
                >
                  <p className="text-gray-500">
                    No completed orders to display
                  </p>
                </motion.div>
              ) : (
                <div className="space-y-3">
                  {completedOrders.slice(0, 10).map((order) => (
                    <motion.div
                      key={order.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3 }}
                      className="bg-white rounded-xl shadow border border-gray-200 overflow-hidden"
                    >
                      <div className="p-4">
                        <div className="flex justify-between items-center">
                          <div>
                            <h3 className="font-medium">
                              Table #{order.tableNumber}
                            </h3>
                            <div className="flex items-center gap-2 text-sm text-gray-500">
                              <span>{calculateOrderAge(order.time)}</span>
                              <span>•</span>
                              <span>{order.items.length} items</span>
                            </div>
                          </div>
                          <span
                            className={`px-2 py-1 rounded-full text-xs ${getStatusColor(
                              order.statusOfOrder
                            )}`}
                          >
                            {order.statusOfOrder}
                          </span>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </main>

      <ToastContainer
        position="top-center"
        autoClose={3000}
        toastClassName="shadow-lg"
        progressClassName="bg-gradient-to-r from-blue-500 to-indigo-500"
      />
    </div>
  );
}
