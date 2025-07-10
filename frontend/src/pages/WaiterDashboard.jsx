import { useEffect, useState, useRef } from "react";
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
  FiRefreshCw,
  FiSearch,
} from "react-icons/fi";
import notificationSound from "../assets//ding-101492.mp3";

export function WaiterDashboard() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const clientRef = useRef(null);
  const audioRef = useRef(null);
  const previousRequestsCount = useRef(0);

  // Initialize audio
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
        toast.info("New help request received!", {
          position: "top-center",
          autoClose: 2000,
        });
      });
    }
  };

  // Fetch initial requests
  useEffect(() => {
    setLoading(true);
    axios
      .get("http://localhost:8080/api/help-requests/all-active-request")
      .then((res) => {
        setRequests(res.data);
        previousRequestsCount.current = res.data.length;
      })
      .catch(() => toast.error("Failed to load requests"))
      .finally(() => setLoading(false));
  }, []);

  // WebSocket connection
  useEffect(() => {
    const socket = new SockJS("http://localhost:8080/ws");
    const stompClient = new Client({
      webSocketFactory: () => socket,
      reconnectDelay: 5000,
      onConnect: () => {
        stompClient.subscribe("/topic/help-requests", (message) => {
          const updatedRequest = JSON.parse(message.body);
          setRequests((prev) => {
            const index = prev.findIndex((r) => r.id === updatedRequest.id);
            if (index >= 0) {
              const copy = [...prev];
              copy[index] = updatedRequest;
              return copy;
            } else {
              if (prev.length < previousRequestsCount.current) {
                playNotification();
              }
              previousRequestsCount.current = prev.length + 1;
              return [...prev, updatedRequest];
            }
          });
        });
      },
      onStompError: (frame) => {
        console.error("WebSocket error:", frame);
        toast.error("Connection error - attempting to reconnect...");
      },
    });

    stompClient.activate();
    clientRef.current = stompClient;

    return () => {
      if (clientRef.current) clientRef.current.deactivate();
    };
  }, []);

  // Mark request as resolved
  const markedAsResolved = (id) => {
    axios
      .put(`http://localhost:8080/api/help-requests/${id}/resolve`)
      .then(() => axios.delete(`http://localhost:8080/api/help-requests/${id}`))
      .then(() => {
        setRequests((prev) => prev.filter((req) => req.id !== id));
        toast.success("Request marked as resolved");
      })
      .catch(() => toast.error("Failed to resolve the request"));
  };

  // Calculate wait time
  const calculateWaitTime = (requestTime) => {
    const now = new Date();
    const requestDate = new Date(requestTime);
    const diffMinutes = Math.floor((now - requestDate) / (1000 * 60));

    if (diffMinutes < 1) return "Just now";
    if (diffMinutes < 60) return `${diffMinutes}m ago`;
    const diffHours = Math.floor(diffMinutes / 60);
    return `${diffHours}h ${diffMinutes % 60}m ago`;
  };

  // Filter requests
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
        request.requestType?.toLowerCase().includes(searchTerm.toLowerCase());

      return matchesFilter && matchesSearch;
    })
    .sort((a, b) => {
      // Urgent requests first
      if (a.isUrgent !== b.isUrgent) return a.isUrgent ? -1 : 1;
      // Then by time (oldest first)
      return new Date(a.requestTime) - new Date(b.requestTime);
    });

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Header */}
      <header className="bg-gradient-to-r from-blue-600 to-indigo-700 text-white py-8 px-6 shadow-xl">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center">
            <div>
              <h1 className="text-3xl md:text-4xl font-bold mb-2">
                Waiter Dashboard
              </h1>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-6 py-8 -mt-6">
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
                Request Filters
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
                  All Requests
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
                <button
                  onClick={() => setFilter("recent")}
                  className={`px-4 py-2 rounded-lg ${
                    filter === "recent"
                      ? "bg-green-600 text-white"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  }`}
                >
                  Recent (5m)
                </button>
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
                  placeholder="Table # or type..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>
          </div>
        </motion.div>

        {/* Requests Display */}
        {loading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
          </div>
        ) : filteredRequests.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="bg-white p-8 rounded-xl shadow border border-gray-200 text-center"
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
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
                className={`bg-white rounded-xl shadow-lg border-l-4 overflow-hidden ${
                  req.isUrgent
                    ? "border-red-500 animate-pulse"
                    : "border-blue-500"
                }`}
              >
                <div className="p-5">
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="text-lg font-bold">
                          Table #{req.tableNumber}
                        </h3>
                        {req.isUrgent && (
                          <span className="flex items-center gap-1 text-xs px-2 py-1 bg-red-100 text-red-800 rounded-full">
                            <FiAlertTriangle size={12} />
                            URGENT
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 text-sm text-gray-500">
                        <span>
                          <FiClock size={14} className="inline mr-1" />
                          {calculateWaitTime(req.requestTime)}
                        </span>
                        {req.requestType && (
                          <>
                            <span>•</span>
                            <span className="capitalize">
                              {req.requestType}
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                    <button
                      onClick={() => markedAsResolved(req.id)}
                      className="flex items-center gap-1 bg-green-600 hover:bg-green-700 text-white px-3 py-2 rounded text-sm"
                    >
                      <FiCheck size={14} />
                      Resolve
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}
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
