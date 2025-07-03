import axios from "axios";
import { useEffect, useState, useRef } from "react";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import notificationSound from "../assets/mixkit-interface-option-select-2573.wav";

const ORDER_STATUSES = {
  PREPARING: "Preparing",
  COMPLETED: "Completed",
};

export function KitchenDashboard() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [expandedOrders, setExpandedOrders] = useState({});
  const previousOrdersCount = useRef(0);
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

  const cleanupOldCompletedOrders = (completedOrders) => {
    const MAX_COMPLETED = 5;
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

  const fetchOrders = () => {
    setLoading(true);
    axios
      .get("http://localhost:8080/api/orders")
      .then((res) => {
        const newOrders = res.data;
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

  useEffect(() => {
    fetchOrders();
    const interval = setInterval(fetchOrders, 10000);
    return () => clearInterval(interval);
  }, []);

  const markAsCompleted = (id) => {
    axios
      .put(`http://localhost:8080/api/orders/${id}/status?status=Completed`)
      .then(() => {
        toast.success("Order marked as completed");
        fetchOrders();
      })
      .catch(() => toast.error("Failed to update order"));
  };

  const toggleOrderExpand = (orderId) => {
    setExpandedOrders((prev) => ({
      ...prev,
      [orderId]: !prev[orderId],
    }));
  };

  const calculateOrderAge = (orderTime) => {
    const now = new Date();
    const orderDate = new Date(orderTime);
    const diffMinutes = Math.floor((now - orderDate) / (1000 * 60));
    if (diffMinutes < 1) return "Just now";
    if (diffMinutes < 60) return `${diffMinutes}m ago`;
    const diffHours = Math.floor(diffMinutes / 60);
    return `${diffHours}h ${diffMinutes % 60}m ago`;
  };

  const getStatusColor = (status) => {
    switch (status) {
      case ORDER_STATUSES.PREPARING:
        return "bg-blue-100 text-blue-800";
      case ORDER_STATUSES.COMPLETED:
        return "bg-green-100 text-green-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const activeOrders = orders.filter(
    (order) => order.statusOfOrder !== ORDER_STATUSES.COMPLETED
  );

  const completedOrders = orders.filter(
    (order) => order.statusOfOrder === ORDER_STATUSES.COMPLETED
  );

  return (
    <div className="max-w-5xl mx-auto p-4 md:p-6">
      <ToastContainer position="top-center" autoClose={3000} />
      <div className="mb-6">
        <h1 className="text-2xl md:text-3xl font-bold">Kitchen Dashboard</h1>
      </div>

      {loading ? (
        <div className="flex justify-center py-8">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      ) : (
        <>
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">Preparing Orders</h2>
            <button
              onClick={fetchOrders}
              className="bg-blue-600 text-white px-3 py-1 rounded text-sm hover:bg-blue-700"
            >
              Refresh
            </button>
          </div>

          {activeOrders.length === 0 ? (
            <p className="text-gray-500 p-4 bg-gray-50 rounded-lg">
              No orders currently being prepared
            </p>
          ) : (
            <div className="grid gap-4 mb-8">
              {activeOrders
                .sort((a, b) => new Date(b.time) - new Date(a.time))
                .map((order) => (
                  <div
                    key={order.id}
                    className="p-4 border rounded-lg shadow-sm hover:shadow-md transition-shadow"
                  >
                    <div className="flex flex-wrap items-center gap-2 mb-2">
                      <h2 className="text-lg font-semibold">
                        Table #{order.tableNumber}
                      </h2>
                      <span
                        className={`text-xs px-2 py-1 rounded-full ${getStatusColor(
                          order.statusOfOrder
                        )}`}
                      >
                        {order.statusOfOrder}
                      </span>
                      <span className="text-sm text-gray-500">
                        {calculateOrderAge(order.time)}
                      </span>
                    </div>

                    <div className="flex gap-2 mt-2">
                      <button
                        onClick={() => markAsCompleted(order.id)}
                        className="bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded text-sm"
                      >
                        Mark as Done
                      </button>
                      <button
                        onClick={() => toggleOrderExpand(order.id)}
                        className="text-gray-600 hover:text-gray-800 text-sm underline"
                      >
                        {expandedOrders[order.id] ? "Show Less" : "Show More"}
                      </button>
                    </div>

                    {expandedOrders[order.id] && (
                      <div className="mt-4">
                        <h3 className="font-semibold mb-2">Items:</h3>
                        <ul className="space-y-2">
                          {order.items.map((item, index) => (
                            <li
                              key={index}
                              className="flex justify-between items-start"
                            >
                              <div>
                                <span className="font-medium">
                                  {item.menuItem.name} × {item.quantity}
                                </span>
                                {item.instructions && (
                                  <p className="text-sm text-gray-600 mt-1">
                                    <span className="font-medium">Notes:</span>{" "}
                                    {item.instructions}
                                  </p>
                                )}
                              </div>
                              <span className="text-sm text-gray-500">
                                $
                                {(item.menuItem.price * item.quantity).toFixed(
                                  2
                                )}
                              </span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                ))}
            </div>
          )}

          <h2 className="text-xl font-semibold mb-2">Recently Completed</h2>
          {completedOrders.length === 0 ? (
            <p className="text-gray-500 p-4 bg-gray-50 rounded-lg">
              No orders completed yet
            </p>
          ) : (
            <div className="grid gap-4">
              {completedOrders
                .sort((a, b) => new Date(b.time) - new Date(a.time))
                .slice(0, 5)
                .map((order) => (
                  <div
                    key={order.id}
                    className="p-4 border rounded-lg bg-green-50 shadow-sm"
                  >
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="text-lg font-semibold">
                        Table #{order.tableNumber}
                      </h2>
                      <span
                        className={`text-xs px-2 py-1 rounded-full ${getStatusColor(
                          order.statusOfOrder
                        )}`}
                      >
                        {order.statusOfOrder}
                      </span>
                      <span className="text-sm text-gray-500">
                        {calculateOrderAge(order.time)}
                      </span>
                    </div>
                  </div>
                ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
