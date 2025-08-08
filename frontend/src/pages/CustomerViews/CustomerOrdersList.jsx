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

  // Check session status on mount
  useEffect(() => {
    const checkSessionStatus = async () => {
      try {
        const res = await axios.get(
          `http://localhost:8080/api/tables/${tableNumber}/session-status`
        );
        if (!res.data) {
          setSessionEnded(true);
          navigate(`/thank-you/${tableNumber}`);
        }
      } catch (error) {
        console.error("Failed to check session status:", error);
        toast.error("Failed to verify table session");
      }
    };

    checkSessionStatus();
  }, [tableNumber, navigate]);

  useEffect(() => {
    if (sessionEnded) return;

    let isMounted = true;

    const fetchOrders = async () => {
      setLoading(true);
      try {
        const ordersRes = await axios.get(
          `http://localhost:8080/api/orders/by-table/${tableNumber}`
        );

        if (isMounted) {
          const fetched = Array.isArray(ordersRes.data)
            ? ordersRes.data
            : [ordersRes.data];
          setOrders(
            fetched
              .filter((o) => o.statusOfOrder !== "COMPLETED")
              .sort((a, b) => new Date(b.time) - new Date(a.time))
          );
        }
      } catch (err) {
        toast.error("Failed to fetch orders");
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();

    const socket = new SockJS("http://localhost:8080/ws");
    const stompClient = new Client({
      webSocketFactory: () => socket,
      reconnectDelay: 5000,
      heartbeatIncoming: 4000,
      heartbeatOutgoing: 4000,
      onConnect: () => {
        // Subscribe to table-specific orders
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

              const merged = [...existing, updatedOrder];
              return merged.sort((a, b) => new Date(b.time) - new Date(a.time));
            });

            if (
              eventType === "UPDATE" &&
              updatedOrder.statusOfOrder === "READY"
            ) {
              toast.info(`Your order is ready for serving!`);
            }
          } catch (err) {
            console.error("CustomerOrdersList WebSocket error:", err);
          }
        });

        // Subscribe to session ended events
        stompClient.subscribe(
          `/topic/session-ended/${tableNumber}`,
          (message) => {
            if (!message?.body) return;
            try {
              const event = JSON.parse(message.body);
              if (event.eventType === "SESSION_ENDED") {
                navigate(`/thank-you/${tableNumber}`);
              }
            } catch (err) {
              console.error("Error parsing session message", err);
            }
          }
        );
      },
      onStompError: (frame) => {
        console.error("Broker reported error: " + frame.headers["message"]);
        console.error("Additional details: " + frame.body);
      },
    });

    stompClient.activate();
    clientRef.current = stompClient;

    return () => {
      isMounted = false;
      if (clientRef.current?.active) {
        clientRef.current.deactivate();
      }
    };
  }, [tableNumber, sessionEnded, navigate]);

  // Redirect to thank you page if session ended
  if (sessionEnded) {
    return <ThankYou />;
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <ToastContainer position="top-center" autoClose={3000} />
      <h2 className="text-2xl font-bold mb-4">
        Orders for Table #{tableNumber}
      </h2>
      {loading ? (
        <p className="text-center text-lg font-medium">Loading orders...</p>
      ) : orders.length === 0 ? (
        <>
          <p className="text-center p-4 bg-yellow-100 rounded-md text-yellow-800 font-semibold shadow mb-6">
            No active orders currently. Feel free to order something new!
          </p>
          <button
            onClick={() => {
              e.preventDefault();
              navigate(`/customerOrder/${tableNumber}`);
            }}
            className="block text-center bg-blue-600 text-white px-4 py-2 rounded-lg font-semibold shadow hover:bg-blue-700 transition mb-6"
          >
            Order More
          </button>
        </>
      ) : (
        <>
          <Link
            to={`/customerOrder/${tableNumber}`}
            className="block text-center bg-blue-600 text-white px-4 py-2 rounded-lg font-semibold shadow hover:bg-blue-700 transition mb-6"
          >
            Order More
          </Link>
          <ul className="space-y-6">
            {orders.map((order) => (
              <li
                key={order.id}
                className="border p-4 rounded shadow hover:shadow-lg transition"
              >
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <p>Ordered at: {new Date(order.time).toLocaleString()}</p>
                    <p>
                      Status:{" "}
                      <strong
                        className={`
                          ${
                            order.statusOfOrder === "READY"
                              ? "text-green-600"
                              : order.statusOfOrder === "IN_PROGRESS"
                              ? "text-orange-500"
                              : order.statusOfOrder ===
                                "WAITING_FOR_CONFIRMATION"
                              ? "text-blue-600"
                              : "text-red-500"
                          }`}
                      >
                        {order.statusOfOrder === "WAITING_FOR_CONFIRMATION" &&
                          "Waiting for confirmation"}
                        {order.statusOfOrder === "IN_PROGRESS" &&
                          "Being prepared"}
                        {order.statusOfOrder === "READY" &&
                          "Ready for serving!"}
                      </strong>
                    </p>
                  </div>
                </div>
                <ul className="list-disc ml-6">
                  {order.items.map((item, i) => (
                    <li key={i}>
                      {item.menuItem.name} × {item.quantity}
                      {item.instructions && (
                        <em className="ml-2 text-sm text-gray-600">
                          (Note: {item.instructions})
                        </em>
                      )}
                    </li>
                  ))}
                </ul>
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  );
}
