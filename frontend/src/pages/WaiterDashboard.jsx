import React, { useEffect, useState, useRef } from "react";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { motion } from "framer-motion";
import SockJS from "sockjs-client";
import { Client } from "@stomp/stompjs";
import axios from "axios";
import {
  FiCheck,
  FiClock,
  FiAlertTriangle,
  FiSearch,
  FiTrash2,
  FiPower,
  FiEye,
} from "react-icons/fi";
import { Link } from "react-router-dom";
import notificationSound from "../assets/ding-101492.mp3";

export function WaiterDashboard() {
  const [requests, setRequests] = useState([]);
  const [orders, setOrders] = useState([]);
  const [activeTables, setActiveTables] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
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
        toast.info("New help request or order received!");
      });
    }
  };

  useEffect(() => {
    setLoading(true);
    Promise.all([
      axios.get("http://localhost:8080/api/help-requests/all-active-request"),
      axios.get("http://localhost:8080/api/orders/pending"),
      axios.get("http://localhost:8080/api/tables/active"),
    ])
      .then(([reqRes, orderRes, tablesRes]) => {
        setRequests(reqRes.data);
        setOrders(orderRes.data);
        setActiveTables(tablesRes.data);
      })
      .catch(() => toast.error("Failed to load data"))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    const socket = new SockJS("http://localhost:8080/ws");
    const stompClient = new Client({
      webSocketFactory: () => socket,
      reconnectDelay: 5000,
      heartbeatIncoming: 4000,
      heartbeatOutgoing: 4000,
      onConnect: () => {
        // Help Requests Channel
        stompClient.subscribe("/topic/help-requests", (message) => {
          if (!message?.body) return;
          try {
            const event = JSON.parse(message.body);

            if (event.eventType === "DELETE") {
              setRequests((prev) =>
                prev.filter((req) => req.id !== event.requestId)
              );
              return;
            }

            const updatedRequest = event.request || event;
            setRequests((prev) => {
              const index = prev.findIndex((r) => r.id === updatedRequest.id);
              if (index >= 0) {
                const copy = [...prev];
                copy[index] = updatedRequest;
                return copy;
              } else {
                playNotification();
                return [...prev, updatedRequest];
              }
            });
          } catch (err) {
            console.error("Error parsing help request message", err);
          }
        });

        // Orders Channel
        stompClient.subscribe("/topic/orders", (message) => {
          if (!message?.body) return;
          try {
            const orderEvent = JSON.parse(message.body);
            const order = orderEvent.order;
            const eventType = orderEvent.eventType;

            setOrders((prev) => {
              if (
                eventType === "DELETE" ||
                order.statusOfOrder === "IN_PROGRESS"
              ) {
                return prev.filter((o) => o.id !== order.id);
              }

              if (order.statusOfOrder !== "WAITING_FOR_CONFIRMATION") {
                return prev;
              }

              const index = prev.findIndex((o) => o.id === order.id);
              if (index >= 0) {
                const updated = [...prev];
                updated[index] = order;
                return updated;
              } else {
                playNotification();
                return [...prev, order];
              }
            });
          } catch (err) {
            console.error("Error parsing order message", err);
          }
        });

        // Active Tables Channel
        stompClient.subscribe("/topic/active-tables", (message) => {
          if (!message?.body) return;
          try {
            const event = JSON.parse(message.body);
            if (event.eventType === "SESSION_ENDED") {
              setActiveTables((prev) =>
                prev.filter((table) => table !== event.tableNumber)
              );
            } else if (event.eventType === "SESSION_STARTED") {
              setActiveTables((prev) =>
                prev.includes(event.tableNumber)
                  ? prev
                  : [...prev, event.tableNumber]
              );
            }
          } catch (err) {
            console.error("Error parsing active tables message", err);
          }
        });
      },
      onStompError: (frame) => {
        console.error("Broker reported error: " + frame.headers["message"]);
        console.error("Additional details: " + frame.body);
      },
    });

    stompClient.activate();
    clientRef.current = stompClient;

    return () => {
      if (clientRef.current) {
        clientRef.current.deactivate();
      }
    };
  }, []);

  const deleteRequest = (id) => {
    axios
      .delete(`http://localhost:8080/api/help-requests/${id}`)
      .then(() => {
        toast.success("Request deleted");
      })
      .catch(() => toast.error("Failed to delete request"));
  };

  const confirmOrder = (id) => {
    axios
      .put(`http://localhost:8080/api/orders/${id}/progress`)
      .then(() => {
        toast.success("Order confirmed");
        setOrders((prev) => prev.filter((order) => order.id !== id));
      })
      .catch(() => toast.error("Failed to confirm order"));
  };

  const endSession = (tableNumber) => {
    axios
      .post(`http://localhost:8080/api/tables/${tableNumber}/end-session`)
      .then(() => {
        toast.success(`Session ended for Table ${tableNumber}`);
        // Update locally immediately for better UX
        setActiveTables((prev) => prev.filter((t) => t !== tableNumber));
      })
      .catch(() => toast.error("Failed to end session"));
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

  // Add this function to the WaiterDashboard component
  const processBillAndEndSession = async (tableNumber) => {
    try {
      // First mark the bill as processed
      await axios.post(
        `http://localhost:8080/api/tables/${tableNumber}/process-bill`
      );

      // Then end the session
      await axios.post(
        `http://localhost:8080/api/tables/${tableNumber}/end-session`
      );

      toast.success(
        `Bill processed and session ended for Table ${tableNumber}`
      );
    } catch (error) {
      toast.error("Failed to process bill and end session");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <header className="bg-gradient-to-r from-blue-600 to-indigo-700 text-white py-8 px-6 shadow-xl">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-3xl md:text-4xl font-bold mb-2">
            Waiter Dashboard
          </h1>
          <p className="text-blue-200">
            Manage requests, orders, and table sessions
          </p>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-8 -mt-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Left column: Help Requests */}
          <div>
            <motion.div
              className="bg-white rounded-xl shadow-2xl p-6 mb-6 border border-gray-200"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
            >
              <div className="flex flex-col md:flex-row gap-6">
                <div className="flex-1">
                  <h2 className="text-xl font-semibold text-gray-800 mb-4">
                    Request Filters
                  </h2>
                  <div className="flex flex-wrap gap-3">
                    {["all", "urgent", "recent"].map((type) => (
                      <button
                        key={type}
                        onClick={() => setFilter(type)}
                        className={`px-4 py-2 rounded-lg transition-all ${
                          filter === type
                            ? type === "urgent"
                              ? "bg-red-600 text-white shadow-red"
                              : type === "recent"
                              ? "bg-green-600 text-white shadow-green"
                              : "bg-blue-600 text-white shadow-blue"
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
                </div>

                <div className="w-full md:w-64">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Search Requests
                  </label>
                  <div className="relative">
                    <FiSearch className="absolute left-3 top-3 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Table # or reason..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                </div>
              </div>
            </motion.div>

            {loading ? (
              <div className="flex justify-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
              </div>
            ) : filteredRequests.length === 0 ? (
              <motion.div
                className="bg-white p-8 rounded-xl shadow border text-center"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
              >
                <p className="text-gray-500">
                  {requests.length === 0
                    ? "No active requests"
                    : "No requests match your filters"}
                </p>
              </motion.div>
            ) : (
              <div className="grid gap-4">
                {filteredRequests.map((req) => (
                  <motion.div
                    key={req.id}
                    className={`bg-white rounded-xl shadow-lg border-l-4 ${
                      req.isUrgent
                        ? "border-red-500 animate-pulse"
                        : "border-blue-500"
                    }`}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    <div className="p-5 flex justify-between items-start">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="text-lg font-bold">
                            Table #{req.tableNumber}
                          </h3>
                          {req.isUrgent && (
                            <span className="flex items-center gap-1 text-xs px-2 py-1 bg-red-100 text-red-800 rounded-full">
                              <FiAlertTriangle size={12} /> URGENT
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-2 text-sm text-gray-500">
                          <span>
                            <FiClock size={14} className="inline mr-1" />
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
                        className="flex items-center gap-1 bg-red-600 hover:bg-red-700 text-white px-3 py-2 rounded text-sm transition-colors"
                      >
                        <FiTrash2 size={14} />
                        Delete
                      </button>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </div>

          {/* Right column: Pending Orders */}
          <div>
            <div className="bg-white rounded-xl shadow-2xl p-6 mb-6 border border-gray-200">
              <h2 className="text-xl font-semibold text-gray-800 mb-4">
                Pending Orders
              </h2>
              {loading ? (
                <div className="flex justify-center py-4">
                  <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-indigo-500"></div>
                </div>
              ) : orders.length === 0 ? (
                <div className="bg-gray-50 p-6 rounded-lg text-center text-gray-500 border border-dashed">
                  No pending orders
                </div>
              ) : (
                <div className="grid gap-4">
                  {orders.map((order) => (
                    <motion.div
                      key={order.id}
                      className="bg-white rounded-xl shadow-lg border-l-4 border-indigo-500 p-5"
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.3 }}
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="text-lg font-bold mb-1">
                            Order #{order.id} – Table #{order.tableNumber}
                          </h3>
                          <p className="text-sm text-gray-500 flex items-center">
                            <FiClock className="mr-1" size={14} />
                            {calculateWaitTime(order.time)}
                          </p>
                          <div className="mt-2 text-sm">
                            <p className="font-medium">Items:</p>
                            <ul className="list-disc ml-5 mt-1">
                              {order.items.slice(0, 2).map((item, i) => (
                                <li key={i} className="truncate max-w-xs">
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
                          className="flex items-center gap-1 bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded text-sm transition-colors"
                        >
                          <FiCheck size={14} />
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

        {/* Active Tables Section */}
        <motion.div
          className="mt-8 bg-white rounded-xl shadow-2xl p-6 border border-gray-200"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-semibold text-gray-800">
              Active Table Sessions
            </h2>
            <span className="bg-blue-100 text-blue-800 text-sm font-medium px-3 py-1 rounded-full">
              {activeTables.length} active
            </span>
          </div>

          {loading ? (
            <div className="flex justify-center py-4">
              <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
            </div>
          ) : activeTables.length === 0 ? (
            <div className="bg-gray-50 rounded-lg p-8 text-center border-2 border-dashed border-gray-200">
              <div className="max-w-xs mx-auto">
                <div className="bg-gray-200 border-2 border-dashed rounded-xl w-16 h-16 mx-auto" />
                <h3 className="mt-4 text-lg font-medium text-gray-900">
                  No active sessions
                </h3>
                <p className="mt-1 text-gray-500">
                  Tables will appear here when customers scan QR codes
                </p>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {activeTables.map((table) => (
                <motion.div
                  key={table}
                  className="bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-5 flex flex-col items-center shadow-sm hover:shadow-md transition-shadow"
                  whileHover={{ y: -5 }}
                >
                  <div className="bg-blue-100 w-16 h-16 rounded-full flex items-center justify-center mb-4">
                    <span className="text-2xl font-bold text-blue-700">
                      T{table}
                    </span>
                  </div>
                  <h3 className="font-semibold text-gray-800 text-lg mb-2">
                    Table {table}
                  </h3>
                  <div className="mt-auto flex space-x-2 w-full">
                    <button
                      onClick={() => processBillAndEndSession(table)}
                      className="flex-1 flex items-center justify-center gap-1 bg-red-600 hover:bg-red-700 text-white px-3 py-2 rounded-lg text-sm transition-colors"
                    >
                      <FiPower size={14} />
                      Process Bill & End
                    </button>
                    <Link
                      to={`/customerOrder/${table}`}
                      className="flex-1 flex items-center justify-center gap-1 bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded-lg text-sm transition-colors"
                    >
                      <FiEye size={14} />
                      View
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
        autoClose={3000}
        toastClassName="shadow-lg rounded-xl"
        progressClassName="bg-gradient-to-r from-blue-500 to-indigo-500"
        bodyClassName="font-medium text-gray-800"
      />
    </div>
  );
}
