import React, { useEffect, useState, useRef } from "react";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { motion } from "framer-motion";
import SockJS from "sockjs-client";
import { Client } from "@stomp/stompjs";
import api from "../pages/Utils/api";
import {
  FiCheck,
  FiClock,
  FiAlertTriangle,
  FiSearch,
  FiTrash2,
  FiPower,
  FiEye,
  FiLogOut,
  FiX,
} from "react-icons/fi";
import { Link, useNavigate } from "react-router-dom";
import notificationSound from "../assets/ding-101492.mp3";

export function WaiterDashboard() {
  const [requests, setRequests] = useState([]);
  const [orders, setOrders] = useState([]);
  const [activeTables, setActiveTables] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [userName, setUserName] = useState("");
  const [userRole, setUserRole] = useState(null);

  const navigate = useNavigate();
  const clientRef = useRef(null);
  const subscriptionsRef = useRef({});
  const audioRef = useRef(null);
  const reconnectAttemptsRef = useRef(0);

  const isAdminView =
    window.location.pathname.includes("/admin-view") ||
    new URLSearchParams(window.location.search).has("admin-view");

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
      setUserName("Admin View Mode");
      setUserRole("ADMIN_VIEW");
      return;
    }

    const employeeData = localStorage.getItem("employeeData");
    if (employeeData) {
      try {
        const { name, role } = JSON.parse(employeeData);
        setUserName(name || "Waiter");
        setUserRole(role || "WAITER");
      } catch (e) {
        setUserName("Waiter");
        setUserRole("WAITER");
      }
    }
  }, [isAdminView]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [requestsRes, ordersRes, tablesRes] = await Promise.all([
        api.get("/api/help-requests/all-active-request"),
        api.get("/api/orders/pending"),
        api.get("/api/tables/active"),
      ]);

      setRequests(requestsRes.data);
      setOrders(ordersRes.data);
      setActiveTables(tablesRes.data);
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to load data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    if (loading) return;

    const connectWebSocket = () => {
      const socket = new SockJS("http://3.145.210.221:8080/ws");
      const stompClient = new Client({
        webSocketFactory: () => socket,
        reconnectDelay: 5000,
        heartbeatIncoming: 4000,
        heartbeatOutgoing: 4000,
        onConnect: () => {
          reconnectAttemptsRef.current = 0;
          setupSubscriptions(stompClient);
        },
        onStompError: () => {
          handleReconnect();
        },
        onDisconnect: () => {
          handleReconnect();
        },
      });

      stompClient.activate();
      clientRef.current = stompClient;

      return () => {
        if (clientRef.current) {
          clientRef.current.deactivate();
        }
      };
    };

    const handleReconnect = () => {
      if (reconnectAttemptsRef.current < 5) {
        reconnectAttemptsRef.current += 1;
        const delay = Math.min(1000 * reconnectAttemptsRef.current, 10000);
        setTimeout(connectWebSocket, delay);
      } else {
        toast.error("Connection lost. Please refresh the page.");
      }
    };

    const setupSubscriptions = (stompClient) => {
      Object.values(subscriptionsRef.current).forEach((sub) =>
        sub?.unsubscribe()
      );
      subscriptionsRef.current = {};

      subscriptionsRef.current.helpRequests = stompClient.subscribe(
        "/topic/help-requests",
        (message) => handleHelpRequestUpdate(message)
      );

      subscriptionsRef.current.waiterOrders = stompClient.subscribe(
        "/topic/waiter-orders",
        (message) => handleWaiterOrderUpdate(message)
      );

      subscriptionsRef.current.activeTables = stompClient.subscribe(
        "/topic/active-tables",
        (message) => handleActiveTablesUpdate(message)
      );

      activeTables.forEach((tableNumber) => {
        const topic = `/topic/orders/${tableNumber}`;
        subscriptionsRef.current[`table_${tableNumber}`] =
          stompClient.subscribe(topic, (message) =>
            handleTableOrderUpdate(tableNumber, message)
          );
      });
    };

    const handleHelpRequestUpdate = (message) => {
      if (!message?.body) return;
      try {
        const event = JSON.parse(message.body);

        setRequests((prev) => {
          if (event.eventType === "DELETE") {
            return prev.filter((req) => req.id !== event.requestId);
          }

          const updatedRequest = event.request || event;
          const existingIndex = prev.findIndex(
            (r) => r.id === updatedRequest.id
          );

          if (existingIndex >= 0) {
            const updated = [...prev];
            updated[existingIndex] = updatedRequest;
            return updated;
          } else {
            playNotification();

            return [...prev, updatedRequest];
          }
        });
      } catch (err) {
        console.error("Error parsing help request:", err);
      }
    };

    const handleWaiterOrderUpdate = (message) => {
      if (!message?.body) return;
      try {
        const event = JSON.parse(message.body);

        if (event.eventType === "READY") {
          setOrders((prev) => prev.filter((o) => o.id !== event.order.id));
          playNotification();
        }
      } catch (err) {
        console.error("Error parsing waiter order:", err);
      }
    };

    const handleActiveTablesUpdate = (message) => {
      if (!message?.body) return;
      try {
        const event = JSON.parse(message.body);

        if (event.eventType === "SESSION_ENDED") {
          setActiveTables((prev) =>
            prev.filter((t) => t !== event.tableNumber)
          );
        } else if (event.eventType === "SESSION_STARTED") {
          setActiveTables((prev) => [...new Set([...prev, event.tableNumber])]);
        }
      } catch (err) {
        console.error("Error parsing active tables update:", err);
      }
    };

    const handleTableOrderUpdate = async (tableNumber, message) => {
      if (!message?.body) return;

      try {
        const event = JSON.parse(message.body);
        const response = await api.get("/api/orders/pending");
        setOrders(response.data);

        if (
          event.eventType !== "STATUS_CHANGE" &&
          event.order?.statusOfOrder === "WAITING_FOR_CONFIRMATION"
        ) {
          playNotification();
        }
      } catch (err) {
        console.error(`Error handling order update:`, err);
      }
    };

    const playNotification = () => {
      if (audioRef.current) {
        audioRef.current.currentTime = 0;
        audioRef.current.play().catch(() => {});
      }
    };

    connectWebSocket();

    return () => {
      if (clientRef.current) {
        clientRef.current.deactivate();
      }
    };
  }, [loading, activeTables]);

  const deleteRequest = async (id) => {
    if (isAdminView) {
      toast.warning("Read-only mode: Action disabled in admin view");
      return;
    }

    try {
      await api.delete(`/api/help-requests/${id}`);
      toast.success("Request deleted");
      setRequests((prev) => prev.filter((req) => req.id !== id));
    } catch (error) {
      toast.error(
        error.response?.data?.message ||
          "Failed to delete request. Please check your authentication."
      );
    }
  };

  const confirmOrder = async (id) => {
    if (isAdminView) {
      toast.warning("Read-only mode: Action disabled in admin view");
      return;
    }

    try {
      const token = localStorage.getItem("employeeAccessToken");
      if (!token) throw new Error("No token found");

      await api.put(
        `/api/orders/${id}/progress`,
        { status: "CONFIRMED" },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      setOrders((prev) => prev.filter((order) => order.id !== id));
    } catch (error) {
      if (error.response?.status === 401) {
        toast.error("Session expired. Please login again.");
        handleLogout();
      } else {
        toast.error(error.response?.data?.message || "Failed to confirm order");
      }
    }
  };

  const calculateWaitTime = (requestTime) => {
    const now = new Date();
    const requestDate = new Date(requestTime);
    const diffMinutes = Math.floor((now - requestDate) / (1000 * 60));
    if (diffMinutes < 1) return "Just now";
    if (diffMinutes < 60) return `${diffMinutes}m ago`;
    const diffHours = Math.floor(diffMinutes / 60);
    return `${diffHours}h ${diffMinutes % 60}m ago`;
  };

  const filteredRequests = requests
    .filter((request) => {
      const matchesFilter =
        filter === "all" ||
        (filter === "urgent" && request.isUrgent) ||
        (filter === "recent" &&
          Date.now() - new Date(request.requestTime) < 5 * 60 * 1000);

      const matchesSearch =
        searchTerm === "" ||
        request.tableNumber.toString().includes(searchTerm) ||
        (request.reason &&
          request.reason.toLowerCase().includes(searchTerm.toLowerCase()));

      return matchesFilter && matchesSearch;
    })
    .sort((a, b) => {
      if (a.isUrgent !== b.isUrgent) return a.isUrgent ? -1 : 1;
      return new Date(a.requestTime) - new Date(b.requestTime);
    });

  const processBillAndEndSession = async (tableNumber) => {
    if (isAdminView) {
      toast.warning("Read-only mode: Action disabled in admin view");
      return;
    }

    try {
      await api.post(`/api/tables/${tableNumber}/process-bill`);
      await api.post(`/api/tables/${tableNumber}/end-session`);

      toast.success(
        `Bill processed and session ended for Table ${tableNumber}`
      );
      setActiveTables((prev) => prev.filter((t) => t !== tableNumber));
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to process bill");
    }
  };

  const handleLogout = async () => {
    if (isAdminView) {
      window.history.back();
      return;
    }

    try {
      await api.post("/api/employee/logout");
      localStorage.removeItem("employeeData");
      localStorage.removeItem("employeeRefreshToken");
      localStorage.removeItem("employeeAccessToken");
      navigate("/employee/login");
    } catch (error) {
      toast.error("Logout failed. Please try again.");
    }
  };

  return (
    <div
      className={`min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 w-full ${
        isAdminView ? "fixed inset-0 z-50 bg-white" : ""
      }`}
    >
      {isAdminView && (
        <div className="fixed top-0 left-0 right-0 bg-yellow-500 text-white text-center py-3 z-50 shadow-lg flex items-center justify-center">
          <FiAlertTriangle className="mr-2" size={20} />
          <span className="font-bold">ADMIN VIEW MODE</span> - All actions are
          disabled. Your admin session remains secure.
        </div>
      )}

      <header
        className={`bg-gradient-to-r from-blue-600 to-indigo-700 text-white py-8 px-8 shadow-xl w-full ${
          isAdminView ? "mt-10" : ""
        }`}
      >
        <div className="max-w-full mx-auto flex justify-between items-center">
          <div>
            <h1 className="text-4xl font-bold">
              {isAdminView
                ? "Waiter Dashboard (Admin View)"
                : "Waiter Dashboard"}
            </h1>
            <h2 className="text-3xl font-bold mt-2">
              {isAdminView ? "View Only Mode" : `Hello, ${userName}`}
            </h2>
          </div>
          {isAdminView ? (
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 bg-white/20 hover:bg-white/30 px-6 py-3 rounded-xl text-lg transition-colors"
            >
              <FiX size={20} />
              Close View
            </button>
          ) : (
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 bg-white/20 hover:bg-white/30 px-6 py-3 rounded-xl text-lg transition-colors"
            >
              <FiLogOut size={20} />
              Logout
            </button>
          )}
        </div>
      </header>

      <main className="w-full px-8 py-8 -mt-4">
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-8 h-full">
          <div className="w-full">
            <motion.div
              className="bg-white rounded-2xl shadow-xl p-8 mb-8 border border-gray-200 h-full"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
            >
              <h2 className="text-2xl font-semibold text-gray-800 mb-6">
                Request Filters
              </h2>
              <div className="flex flex-wrap gap-4 mb-6">
                {["all", "urgent", "recent"].map((type) => (
                  <button
                    key={type}
                    onClick={() => setFilter(type)}
                    className={`px-6 py-3 rounded-xl text-lg font-medium transition-all ${
                      filter === type
                        ? type === "urgent"
                          ? "bg-red-600 text-white shadow-lg shadow-red-200"
                          : type === "recent"
                          ? "bg-green-600 text-white shadow-lg shadow-green-200"
                          : "bg-blue-600 text-white shadow-lg shadow-blue-200"
                        : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                    }`}
                  >
                    {type === "all"
                      ? "All Requests"
                      : type === "urgent"
                      ? "Urgent"
                      : "Recent (5m)"}
                  </button>
                ))}
              </div>

              <div className="mb-8">
                <label className="block text-lg font-medium text-gray-700 mb-3">
                  Search Requests
                </label>
                <div className="relative">
                  <FiSearch className="absolute left-4 top-4 text-gray-400 text-xl" />
                  <input
                    type="text"
                    placeholder="Table # or reason..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-12 pr-4 py-4 text-lg rounded-xl border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>

              {loading ? (
                <div className="flex justify-center py-16 h-64">
                  <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-blue-500"></div>
                </div>
              ) : filteredRequests.length === 0 ? (
                <div className="bg-gray-50 p-12 rounded-xl text-center h-64 flex items-center justify-center">
                  <p className="text-xl text-gray-500">
                    {requests.length === 0
                      ? "No active requests"
                      : "No requests match your filters"}
                  </p>
                </div>
              ) : (
                <div className="space-y-4 max-h-[500px] overflow-y-auto">
                  {filteredRequests.map((req) => (
                    <motion.div
                      key={req.id}
                      className={`bg-white rounded-xl shadow-lg border-l-8 ${
                        req.isUrgent
                          ? "border-red-500 animate-pulse"
                          : "border-blue-500"
                      }`}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.2 }}
                    >
                      <div className="p-6 flex justify-between items-start">
                        <div>
                          <div className="flex items-center gap-3 mb-2">
                            <h3 className="text-2xl font-bold">
                              Table #{req.tableNumber}
                            </h3>
                            {req.isUrgent && (
                              <span className="flex items-center gap-2 text-sm px-3 py-2 bg-red-100 text-red-800 rounded-full font-medium">
                                <FiAlertTriangle size={16} /> URGENT
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-3 text-lg text-gray-500">
                            <span>
                              <FiClock size={18} className="inline mr-2" />
                              {calculateWaitTime(req.requestTime)}
                            </span>
                            {req.reason && (
                              <>
                                <span>•</span>
                                <span className="capitalize font-medium text-indigo-600">
                                  {req.reason}
                                </span>
                              </>
                            )}
                          </div>
                        </div>
                        <button
                          onClick={() => deleteRequest(req.id)}
                          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-lg ${
                            isAdminView
                              ? "bg-gray-400 text-gray-700 cursor-not-allowed"
                              : "bg-red-600 hover:bg-red-700 text-white"
                          }`}
                          disabled={isAdminView}
                        >
                          <FiTrash2 size={18} />
                          Delete
                        </button>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </motion.div>
          </div>

          <div className="w-full">
            <div className="bg-white rounded-2xl shadow-xl p-8 mb-8 border border-gray-200 h-full">
              <h2 className="text-2xl font-semibold text-gray-800 mb-6">
                Pending Orders
              </h2>
              {loading ? (
                <div className="flex justify-center py-16 h-64">
                  <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-indigo-500"></div>
                </div>
              ) : orders.length === 0 ? (
                <div className="bg-gray-50 p-12 rounded-xl text-center h-64 flex items-center justify-center border-2 border-dashed">
                  <p className="text-xl text-gray-500">No pending orders</p>
                </div>
              ) : (
                <div className="space-y-4 max-h-[500px] overflow-y-auto">
                  {orders.map((order) => (
                    <motion.div
                      key={order.id}
                      className="bg-white rounded-xl shadow-lg border-l-8 border-indigo-500 p-6"
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.3 }}
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="text-2xl font-bold mb-2">
                            Table #{order.tableNumber}
                          </h3>
                          <p className="text-lg text-gray-500 flex items-center mb-4">
                            <FiClock className="mr-2" size={18} />
                            {calculateWaitTime(order.time)}
                          </p>
                          <div className="text-lg">
                            <p className="font-medium mb-2">Items:</p>
                            <ul className="list-disc ml-6 space-y-1">
                              {order.items.slice(0, 2).map((item, i) => (
                                <li key={i} className="truncate max-w-md">
                                  {item.menuItem.name} × {item.quantity}
                                </li>
                              ))}
                              {order.items.length > 2 && (
                                <li className="text-gray-500">
                                  +{order.items.length - 2} more items
                                </li>
                              )}
                            </ul>
                          </div>
                        </div>
                        <button
                          onClick={() => confirmOrder(order.id)}
                          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-lg ${
                            isAdminView
                              ? "bg-gray-400 text-gray-700 cursor-not-allowed"
                              : "bg-blue-600 hover:bg-blue-700 text-white"
                          }`}
                          disabled={isAdminView}
                        >
                          <FiCheck size={18} />
                          Confirm
                        </button>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        <motion.div
          className="mt-8 bg-white rounded-2xl shadow-xl p-8 border border-gray-200"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          <div className="flex justify-between items-center mb-8">
            <h2 className="text-2xl font-semibold text-gray-800">
              Active Table Sessions
            </h2>
            <span className="bg-blue-100 text-blue-800 text-lg font-medium px-6 py-3 rounded-full">
              {activeTables.length} active
            </span>
          </div>

          {loading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-blue-500"></div>
            </div>
          ) : activeTables.length === 0 ? (
            <div className="bg-gray-50 rounded-xl p-16 text-center border-2 border-dashed border-gray-200">
              <div className="max-w-md mx-auto">
                <div className="bg-gray-200 border-2 border-dashed rounded-xl w-24 h-24 mx-auto mb-6" />
                <h3 className="text-2xl font-medium text-gray-900 mb-2">
                  No active sessions
                </h3>
                <p className="text-xl text-gray-500">
                  Tables will appear here when customers scan QR codes
                </p>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {activeTables.map((table) => (
                <motion.div
                  key={table}
                  className="bg-gradient-to-br from-blue-50 to-indigo-50 border-2 border-blue-200 rounded-xl p-6 flex flex-col items-center shadow-lg hover:shadow-xl transition-shadow"
                  whileHover={{ y: -5 }}
                >
                  <div className="bg-blue-100 w-20 h-20 rounded-full flex items-center justify-center mb-6">
                    <span className="text-2xl font-bold text-blue-700">
                      T{table}
                    </span>
                  </div>
                  <h3 className="font-semibold text-gray-800 text-xl mb-4">
                    Table {table}
                  </h3>
                  <div className="mt-auto flex flex-col space-y-3 w-full">
                    <button
                      onClick={() => processBillAndEndSession(table)}
                      className={`flex items-center justify-center gap-2 px-4 py-2 rounded-xl text-lg font-medium transition-colors ${
                        isAdminView
                          ? "bg-gray-400 text-gray-700 cursor-not-allowed"
                          : "bg-red-600 hover:bg-red-700 text-white"
                      }`}
                      disabled={isAdminView}
                    >
                      <FiPower size={18} />
                      Process Bill & End
                    </button>
                    <Link
                      to={`/customerOrder/${table}`}
                      className="flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl text-lg font-medium transition-colors"
                    >
                      <FiEye size={18} />
                      View Menu
                    </Link>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </motion.div>
      </main>

      <ToastContainer
        position="top-center"
        autoClose={4000}
        toastClassName="shadow-xl rounded-xl text-lg"
        progressClassName="bg-gradient-to-r from-blue-500 to-indigo-500"
        bodyClassName="font-medium text-gray-800 p-4"
      />
    </div>
  );
}
