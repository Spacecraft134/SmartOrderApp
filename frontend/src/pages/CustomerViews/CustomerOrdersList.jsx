import React, { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import axios from "axios";
import { toast } from "react-toastify";

export function CustomerOrdersList() {
  const { tableNumber } = useParams();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setLoading(true);
    axios
      .get(`http://localhost:8080/api/orders/by-table/${tableNumber}`)
      .then((res) => {
        setOrders(Array.isArray(res.data) ? res.data : [res.data]);
      })
      .catch(() => toast.error("Failed to fetch orders"))
      .finally(() => setLoading(false));
  }, [tableNumber]);

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h2 className="text-2xl font-bold mb-4">
        Orders for Table #{tableNumber}
      </h2>

      <Link
        to={`/customerOrder/${tableNumber}`}
        className="mb-6 inline-block bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
      >
        Order More
      </Link>

      {loading ? (
        <p>Loading orders...</p>
      ) : orders.length === 0 ? (
        <p>No orders found for this table.</p>
      ) : (
        <ul className="space-y-4">
          {orders.map((order) => (
            <li
              key={order.id}
              className="border p-4 rounded shadow hover:shadow-lg transition"
            >
              <div className="flex justify-between items-center mb-2">
                <div>
                  <p>
                    Order placed at: {new Date(order.time).toLocaleString()}
                  </p>
                  <p>
                    Status: <strong>{order.statusOfOrder}</strong>
                  </p>
                </div>
                <Link
                  to={`/order-status/${order.id}`}
                  className="text-blue-600 hover:underline"
                >
                  View Details
                </Link>
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
      )}
    </div>
  );
}
