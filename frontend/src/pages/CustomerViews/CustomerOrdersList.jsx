import React, { useState, useEffect, useRef } from "react";
import { useParams, Link } from "react-router-dom";
import axios from "axios";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import SockJS from "sockjs-client";
import { Client } from "@stomp/stompjs";

export function CustomerOrdersList() {
  const { tableNumber } = useParams();
  const [orders, setOrders] = useState([]);
  const [hiddenOrders, setHiddenOrders] = useState({});
  const [loading, setLoading] = useState(false);
  const clientRef = useRef(null);

  useEffect(() => {
    let isMounted = true;

    const fetchOrders = async () => {
      setLoading(true);
      try {
        const res = await axios.get(
          `http://localhost:8080/api/orders/by-table/${tableNumber}`
        );
        const fetched = Array.isArray(res.data) ? res.data : [res.data];
        if (isMounted) {
          setOrders(
            fetched
              .filter((o) => o.statusOfOrder !== "COMPLETED")
              .sort((a, b) => new Date(b.time) - new Date(a.time))
          );
        }
      } catch {
        toast.error("Failed to fetch orders");
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();

    const socket = new SockJS("http://localhost:8080/ws");
    const stompClient = new Client({
      webSocketFactory: () => socket,
      reconnectDelay: 5000,
      onConnect: () => {
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
              const timeoutTime = Date.now() + 3 * 60 * 1000;
              setHiddenOrders((prev) => ({
                ...prev,
                [updatedOrder.id]: timeoutTime,
              }));
              setTimeout(() => {
                setHiddenOrders((prev) => {
                  const updated = { ...prev };
                  delete updated[updatedOrder.id];
                  return updated;
                });
              }, 3 * 60 * 1000);
            }
          } catch (err) {
            console.error("CustomerOrdersList WebSocket error:", err);
          }
        });
      },
    });

    stompClient.activate();
    clientRef.current = stompClient;

    return () => {
      isMounted = false;
      if (clientRef.current?.active) {
        clientRef.current.deactivate().then(() => {
          console.log("CustomerOrdersList WebSocket cleaned up");
        });
      }
    };
  }, [tableNumber]);

  const visibleOrders = orders.filter((order) => {
    const hiddenUntil = hiddenOrders[order.id];
    if (order.statusOfOrder === "READY" && hiddenUntil) {
      return Date.now() < hiddenUntil;
    }
    return true;
  });

  return (
    <div className="max-w-4xl mx-auto p-6">
      <ToastContainer position="top-center" autoClose={3000} />
      <h2 className="text-2xl font-bold mb-4">
        Orders for Table #{tableNumber}
      </h2>
      {loading ? (
        <p className="text-center text-lg font-medium">Loading orders...</p>
      ) : visibleOrders.length === 0 ? (
        <>
          <p className="text-center p-4 bg-yellow-100 rounded-md text-yellow-800 font-semibold shadow mb-6">
            No active orders currently. Feel free to order something new!
          </p>
          <Link
            to={`/customerOrder/${tableNumber}`}
            className="block text-center bg-blue-600 text-white px-4 py-2 rounded-lg font-semibold shadow hover:bg-blue-700 transition"
          >
            Order More
          </Link>
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
            {visibleOrders.map((order) => (
              <li
                key={order.id}
                className="border p-4 rounded shadow hover:shadow-lg transition"
              >
                <div className="flex justify-between items-center mb-2">
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
                            : order.statusOfOrder === "WAITING_FOR_CONFIRMATION"
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
