import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import axios from "axios";
import { toast, ToastContainer } from "react-toastify";

export function OrderStatusPage() {
  const { orderId } = useParams();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchOrder = async () => {
      setLoading(true);
      try {
        const res = await axios.get(
          `http://localhost:8080/api/orders/${orderId}`
        );
        setOrder(res.data);
      } catch {
        toast.error("Failed to fetch order status");
      } finally {
        setLoading(false);
      }
    };

    fetchOrder();

    const interval = setInterval(fetchOrder, 10000); // refresh every 10 seconds

    return () => clearInterval(interval);
  }, [orderId]);

  return (
    <div className="max-w-xl mx-auto p-6 border rounded shadow">
      <ToastContainer position="top-center" autoClose={3000} />
      <h2 className="text-2xl font-bold mb-4">Order Details (ID: {orderId})</h2>
      {loading ? (
        <p>Loading order...</p>
      ) : order ? (
        <>
          <p>
            Status: <strong>{order.statusOfOrder}</strong>
          </p>
          <p>Ordered at: {new Date(order.time).toLocaleString()}</p>
          <h3 className="mt-4 font-semibold">Items:</h3>
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
        </>
      ) : (
        <p>No order data available.</p>
      )}
    </div>
  );
}
