import { useEffect, useState, useRef } from "react";
import { toast, ToastContainer } from "react-toastify";
import { motion } from "framer-motion";
import SockJS from "sockjs-client";
import { Client } from "@stomp/stompjs";
import axios from "axios";

export function WaiterDashboard() {
  const [requests, setRequests] = useState([]);
  const clientRef = useRef(null);

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
              return [...prev, updatedRequest];
            }
          });
          toast.info("Help request updated!");
        });
      },
      onStompError: (frame) => {
        console.error("Broker reported error: " + frame.headers["message"]);
        console.error("Details: " + frame.body);
      },
    });

    stompClient.activate();
    clientRef.current = stompClient;

    return () => {
      if (clientRef.current) clientRef.current.deactivate();
    };
  }, []);

  const markedAsResolved = (id) => {
    axios
      .put(`http://localhost:8080/api/help-requests/${id}/resolve`)
      .then((res) => {
        toast.success("Marked as resolved");
        return axios.delete(`http://localhost:8080/api/help-requests/${id}`);
      })
      .then(() => {
        setRequests((prev) => prev.filter((req) => req.id !== id));
      })
      .catch(() => toast.error("Failed to resolve the request"));
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <ToastContainer position="top-center" autoClose={3000} />
      <h1 className="text-3xl font-bold mb-6">Waiter Dashboard</h1>

      {requests.length === 0 ? (
        <p className="text-gray-600">No active requests.</p>
      ) : (
        <div className="grid gap-4">
          {requests.map((req) => (
            <motion.div
              key={req.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              className="p-4 border rounded shadow flex justify-between items-center"
            >
              <div>
                <h2 className="text-lg font-semibold">
                  Table #{req.tableNumber}
                </h2>
                <p className="text-sm text-gray-500">
                  Requested at:{" "}
                  {new Date(req.requestTime).toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                    second: "2-digit",
                  })}
                </p>
                <p className="text-xs text-red-500 mt-1">
                  Waiting:{" "}
                  {Math.floor((Date.now() - new Date(req.requestTime)) / 60000)}{" "}
                  min
                </p>
              </div>
              <button
                onClick={() => markedAsResolved(req.id)}
                className="bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded"
              >
                Mark as Resolved
              </button>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
