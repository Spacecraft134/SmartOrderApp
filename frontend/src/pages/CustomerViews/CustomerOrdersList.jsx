import React, { useState, useEffect, useRef } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import axios from "axios";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import SockJS from "sockjs-client";
import { Client } from "@stomp/stompjs";
import { motion } from "framer-motion";
import { ThankYou } from "../CustomerViews/ThankyouPage";

export function CustomerOrdersList() {
  const { tableNumber } = useParams();
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [sessionEnded, setSessionEnded] = useState(false);
  const clientRef = useRef(null);
  const [isNavigating, setIsNavigating] = useState(false);
  const [wsConnected, setWsConnected] = useState(false);

  // Check session status
  const checkSession = async () => {
    try {
      const res = await axios.get(
        `http://localhost:8080/api/tables/${tableNumber}/session-status`
      );
      if (!res.data) {
        setSessionEnded(true);
        navigate(`/thank-you/${tableNumber}`);
      }
      return res.data;
    } catch (error) {
      console.error("Session check failed:", error);
      toast.error("Failed to verify session");
      return false;
    }
  };

  // Fetch orders
  const fetchOrders = async () => {
    setLoading(true);
    try {
      const ordersRes = await axios.get(
        `http://localhost:8080/api/orders/by-table/${tableNumber}`
      );
      const fetched = Array.isArray(ordersRes.data)
        ? ordersRes.data
        : [ordersRes.data];
      setOrders(
        fetched
          .filter((o) => o.statusOfOrder !== "COMPLETED")
          .sort((a, b) => new Date(b.time) - new Date(a.time))
      );
    } catch (err) {
      toast.error("Failed to load orders");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Initialize WebSocket
  const initWebSocket = () => {
    const socket = new SockJS("http://localhost:8080/ws");
    const stompClient = new Client({
      webSocketFactory: () => socket,
      reconnectDelay: 5000,
      heartbeatIncoming: 4000,
      heartbeatOutgoing: 4000,
      onConnect: () => {
        setWsConnected(true);

        // Subscribe to order updates
        stompClient.subscribe(`/topic/orders/${tableNumber}`, (message) => {
          if (!message?.body) return;
          try {
            const event = JSON.parse(message.body);
            const updatedOrder = event.order;
            const eventType = event.eventType;

            setOrders((prev) => {
              const existing = prev.filter((o) => o.id !== updatedOrder.id);
              if (
                eventType === "DELETE" ||
                updatedOrder.statusOfOrder === "COMPLETED"
              ) {
                return existing;
              }
              return [...existing, updatedOrder].sort(
                (a, b) => new Date(b.time) - new Date(a.time)
              );
            });

            if (
              eventType === "UPDATE" &&
              updatedOrder.statusOfOrder === "READY"
            ) {
              toast.info(`Order #${updatedOrder.id} is ready!`);
            }
          } catch (err) {
            console.error("Failed to process update:", err);
          }
        });

        // Subscribe to session events
        stompClient.subscribe(
          `/topic/session-ended/${tableNumber}`,
          (message) => {
            if (!message?.body) return;
            try {
              const event = JSON.parse(message.body);
              if (event.eventType === "SESSION_ENDED") {
                setSessionEnded(true);
                navigate(`/thank-you/${tableNumber}`);
              }
            } catch (err) {
              console.error("Failed to process session update:", err);
            }
          }
        );
      },
      onStompError: (frame) => {
        console.error("WebSocket error:", frame.headers["message"]);
        setWsConnected(false);
      },
      onDisconnect: () => {
        setWsConnected(false);
      },
    });

    stompClient.activate();
    clientRef.current = stompClient;
    return stompClient;
  };

  // Initial load
  useEffect(() => {
    let isMounted = true;
    let stompClient = null;

    const initialize = async () => {
      const sessionActive = await checkSession();
      if (!sessionActive || !isMounted) return;

      await fetchOrders();
      stompClient = initWebSocket();
    };

    initialize();

    return () => {
      isMounted = false;
      if (stompClient?.active) {
        stompClient.deactivate().catch((err) => {
          console.error("Failed to clean up WebSocket:", err);
        });
      }
    };
  }, [tableNumber]);

  // Handle order more button
  const handleOrderMore = async () => {
    setIsNavigating(true);
    try {
      // Verify session is still active
      const sessionActive = await checkSession();
      if (!sessionActive) return;

      // Clean up WebSocket if connected
      if (clientRef.current?.active) {
        await clientRef.current.deactivate();
      }

      // Navigate to order page
      navigate(`/customerOrder/${tableNumber}`);
    } catch (err) {
      console.error("Navigation failed:", err);
      toast.error("Failed to navigate to order page");
    } finally {
      setIsNavigating(false);
    }
  };

  // Status display helpers
  const getStatusText = (status) => {
    switch (status) {
      case "WAITING_FOR_CONFIRMATION":
        return "Waiting for confirmation";
      case "IN_PROGRESS":
        return "Being prepared";
      case "READY":
        return "Ready for serving!";
      case "COMPLETED":
        return "Completed";
      default:
        return status;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "READY":
        return "text-green-600";
      case "IN_PROGRESS":
        return "text-orange-500";
      case "WAITING_FOR_CONFIRMATION":
        return "text-blue-600";
      default:
        return "text-gray-500";
    }
  };

  if (sessionEnded) {
    return <ThankYou />;
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <ToastContainer position="top-center" autoClose={3000} />

      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">Orders for Table #{tableNumber}</h2>
        <div className="flex items-center gap-4">
          {!wsConnected && (
            <span className="text-sm text-yellow-600">
              Reconnecting to live updates...
            </span>
          )}
          <button
            onClick={handleOrderMore}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg font-semibold shadow hover:bg-blue-700 transition"
            disabled={loading || isNavigating}
          >
            {isNavigating ? "Redirecting..." : "Order More"}
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      ) : orders.length === 0 ? (
        <div className="text-center p-8 bg-gray-50 rounded-lg">
          <p className="text-lg text-gray-600 mb-4">
            No active orders currently.
          </p>
          <p className="text-gray-500">
            Use the "Order More" button above to place your order.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map((order) => (
            <motion.div
              key={order.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              className="border border-gray-200 rounded-lg shadow-sm p-6 hover:shadow-md transition-shadow"
            >
              <div className="flex justify-between items-start mb-4">
                <div>
                  <p className="text-gray-500">
                    Ordered: {new Date(order.time).toLocaleString()}
                  </p>
                  <p className="mt-1">
                    Status:{" "}
                    <span
                      className={`font-semibold ${getStatusColor(
                        order.statusOfOrder
                      )}`}
                    >
                      {getStatusText(order.statusOfOrder)}
                    </span>
                  </p>
                </div>
                <p className="text-gray-700 font-medium">Order #{order.id}</p>
              </div>

              <div className="border-t border-gray-200 pt-4">
                <h3 className="font-medium text-lg mb-2">Items:</h3>
                <ul className="space-y-2">
                  {order.items.map((item, i) => (
                    <li key={i} className="flex justify-between">
                      <div>
                        <span className="font-medium">
                          {item.menuItem.name}
                        </span>
                        {item.instructions && (
                          <p className="text-sm text-gray-500 mt-1">
                            Note: {item.instructions}
                          </p>
                        )}
                      </div>
                      <span className="text-gray-700">× {item.quantity}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
