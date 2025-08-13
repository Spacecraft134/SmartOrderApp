import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { motion } from "framer-motion";
import SockJS from "sockjs-client";
import { Client } from "@stomp/stompjs";

export function CustomerOrdersList() {
  const { tableNumber } = useParams();
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sessionEnded, setSessionEnded] = useState(false);
  const clientRef = useRef(null);
  const [wsConnected, setWsConnected] = useState(false);
  const [hasOrders, setHasOrders] = useState(false);
  const [sessionActive, setSessionActive] = useState(false);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const ordersRes = await axios.get(
        `http://localhost:8080/api/orders/by-table/${tableNumber}`
      );

      let fetched = [];
      if (ordersRes.data && Array.isArray(ordersRes.data)) {
        fetched = ordersRes.data;
      } else if (ordersRes.data) {
        fetched = [ordersRes.data];
      }

      const activeOrders = fetched
        .filter((o) => o.statusOfOrder !== "COMPLETED")
        .sort((a, b) => new Date(b.time) - new Date(a.time));

      setOrders(activeOrders);
      setHasOrders(activeOrders.length > 0);

      if (activeOrders.length === 0) {
        toast.info("Your order is being processed. Please wait...");
      }
    } catch (err) {
      toast.error("Failed to load orders. Please refresh the page.");
      setOrders([]);
      setHasOrders(false);
    } finally {
      setLoading(false);
    }
  };

  const initWebSocket = () => {
    const socket = new SockJS("http://localhost:8080/ws");
    const stompClient = new Client({
      webSocketFactory: () => socket,
      reconnectDelay: 5000,
      heartbeatIncoming: 4000,
      heartbeatOutgoing: 4000,
      onConnect: () => {
        setWsConnected(true);
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
            // Error handling
          }
        });

        stompClient.subscribe(
          `/topic/session-ended/${tableNumber}`,
          (message) => {
            if (!message?.body) return;
            try {
              const event = JSON.parse(message.body);
              if (event.eventType === "SESSION_PROPERLY_ENDED") {
                setSessionEnded(true);
                navigate(`/thank-you/${tableNumber}`);
              }
            } catch (err) {
              // Error handling
            }
          }
        );
      },
      onStompError: (frame) => {
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

  useEffect(() => {
    let isMounted = true;
    let stompClient = null;

    const initialize = async () => {
      if (!isMounted) return;

      try {
        const res = await axios.get(
          `http://localhost:8080/api/tables/${tableNumber}/session-status`
        );
        setSessionActive(res.data);
      } catch (error) {
        setSessionActive(false);
      }

      await fetchOrders();

      if (isMounted) {
        stompClient = initWebSocket();
      }
    };

    initialize();

    return () => {
      isMounted = false;
      if (stompClient?.active) {
        stompClient.deactivate();
      }
    };
  }, [tableNumber]);

  const handleOrderMore = () => {
    navigate(`/customerOrder/${tableNumber}`);
  };

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
    return <div>Redirecting to thank you page...</div>;
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

          <div
            className={`text-sm px-2 py-1 rounded ${
              sessionActive
                ? "bg-green-100 text-green-800"
                : "bg-red-100 text-red-800"
            }`}
          >
            {sessionActive ? "Session Active" : "Session Inactive"}
          </div>

          <button
            onClick={handleOrderMore}
            className="bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold shadow hover:bg-blue-700 transition-colors"
          >
            Order More
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
            {sessionActive
              ? "No active orders found. Your order may still be processing."
              : "Your session is not active. Please place a new order."}
          </p>
          {sessionActive && (
            <button
              onClick={handleOrderMore}
              className="bg-blue-600 text-white px-8 py-3 rounded-lg font-semibold shadow hover:bg-blue-700 transition-colors text-lg"
            >
              Place New Order
            </button>
          )}
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
