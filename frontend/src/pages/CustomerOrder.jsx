import axios from "axios";
import { useEffect, useState } from "react";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

export function CustomerOrder() {
  const [tableID, setTableID] = useState("");
  const [menuItem, setMenuItems] = useState([]);
  const [cart, setCart] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeCategory, setActiveCategory] = useState("All");
  const [isCartOpen, setIsCartOpen] = useState(false);

  useEffect(() => {
    axios
      .get("http://localhost:8080/api/menu")
      .then((res) => setMenuItems(res.data))
      .catch(() => toast.error("Failed to load menu items"));
  }, []);

  const uniqueCategory = [
    "All",
    ...new Set(menuItem.map((item) => item.category || "Uncategorized")),
  ];

  const filteredMenu = menuItem.filter((item) =>
    activeCategory === "All"
      ? true
      : (item.category || "Uncategorized") === activeCategory
  );

  const addToCart = (item) => {
    setCart((prev) => {
      const existing = prev.find((i) => i.id === item.id);
      if (existing) {
        return prev.map((i) =>
          i.id === item.id ? { ...i, quantity: i.quantity + 1 } : i
        );
      } else {
        return [...prev, { ...item, quantity: 1, instructions: "" }];
      }
    });
  };

  const updateQuantity = (id, newQuantity) => {
    if (newQuantity <= 0) return removeFromCart(id);
    setCart((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, quantity: newQuantity } : item
      )
    );
  };

  const removeFromCart = (id) => {
    setCart((prev) => prev.filter((i) => i.id !== id));
  };

  const handleSubmitOrder = () => {
    if (!tableID) return toast.warning("Please enter your table ID");
    if (cart.length === 0) return toast.warning("Cart is empty");

    const orderData = {
      tableNumber: tableID,
      items: cart.map((item) => ({
        menuItem: { id: item.id },
        quantity: item.quantity,
        instructions: item.instructions || "",
      })),
    };

    setIsSubmitting(true);
    axios
      .post("http://localhost:8080/api/orders", orderData)
      .then(() => {
        toast.success("Order Placed");
        setCart([]);
        setIsCartOpen(false);
      })
      .catch(() => toast.error("Failed to place order"))
      .finally(() => setIsSubmitting(false));
  };

  const handleHelpRequest = () => {
    if (!tableID) {
      toast.warning("Please enter your Table ID to request help!");
      return;
    }
    axios
      .post("http://localhost:8080/api/help-requests", {
        tableNumber: tableID,
      })
      .then(() => toast.success("Help request sent! A waiter is on the way."))
      .catch(() => toast.error("failed to send help request"));
  };

  return (
    <div className="max-w-5xl mx-auto p-6">
      <ToastContainer position="top-center" autoClose={3000} />
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Place Your Order</h1>
        <button
          onClick={() => setIsCartOpen(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
        >
          View Cart ({cart.length})
        </button>
      </div>

      <input
        type="text"
        placeholder="Enter Table ID"
        value={tableID}
        onChange={(e) => setTableID(e.target.value)}
        className="w-full px-4 py-2 border rounded-md mb-4"
      />

      <h2 className="text-xl font-semibold mb-2">Menu</h2>
      <div className="overflow-x-auto flex gap-2 mb-4 py-1">
        {uniqueCategory.map((category) => (
          <button
            key={category}
            onClick={() => setActiveCategory(category)}
            className={`px-3 py-1.5 text-sm rounded-full whitespace-nowrap font-medium transition ${
              activeCategory === category
                ? "bg-blue-600 text-white"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            }`}
          >
            {category}
          </button>
        ))}
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {filteredMenu.map((item) => (
          <div
            key={item.id}
            className="p-4 border rounded shadow-sm flex justify-between items-start"
          >
            <div>
              <h3 className="font-semibold">{item.name}</h3>
              <p className="text-gray-600 text-sm">
                ${parseFloat(item.price).toFixed(2)}
              </p>
              {item.description && (
                <p className="text-gray-400 text-xs">{item.description}</p>
              )}
              <button
                onClick={() => addToCart(item)}
                className="mt-2 px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm"
              >
                Add
              </button>
            </div>
          </div>
        ))}
      </div>
      <div
        className={`fixed top-0 right-0 h-full w-80 bg-white shadow-lg border-l z-50 transform transition-transform duration-300 ${
          isCartOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div className="flex justify-between items-center p-4 border-b">
          <h2 className="text-lg font-bold">Your Cart</h2>
          <button
            onClick={() => setIsCartOpen(false)}
            className="text-gray-500 hover:text-gray-800 text-xl"
          >
            &times;
          </button>
        </div>

        <div className="p-4 overflow-y-auto h-170">
          {cart.length === 0 ? (
            <p className="text-gray-500 text-center mt-4">Your cart is empty</p>
          ) : (
            cart.map((item) => (
              <div
                key={item.id}
                className="mb-4 border-b pb-2 flex flex-col gap-2"
              >
                <div className="flex justify-between items-center">
                  <div>
                    <h3 className="font-medium">{item.name}</h3>
                    <p className="text-sm text-gray-600">
                      ${parseFloat(item.price).toFixed(2)} x {item.quantity}
                    </p>
                  </div>
                  <div className="flex items-center gap-1">
                    <input
                      type="number"
                      min="1"
                      value={item.quantity}
                      onChange={(e) =>
                        updateQuantity(item.id, parseInt(e.target.value))
                      }
                      className="w-14 px-2 py-1 border rounded text-sm"
                    />
                    <button
                      onClick={() => removeFromCart(item.id)}
                      className="text-red-500 text-xs hover:underline"
                    >
                      Remove
                    </button>
                  </div>
                </div>
                <textarea
                  placeholder="Any Special Instructions"
                  value={item.instructions || ""}
                  onChange={(e) => {
                    const val = e.target.value;
                    setCart((prev) =>
                      prev.map((i) =>
                        i.id === item.id ? { ...i, instructions: val } : i
                      )
                    );
                  }}
                  className="w-full px-3 py-2 border rounded text-sm"
                />
              </div>
            ))
          )}
        </div>

        <div className="p-4 border-t">
          <div className="flex justify-between mb-3 font-semibold">
            <span>Total:</span>
            <span>
              $
              {cart
                .reduce(
                  (sum, item) => sum + item.quantity * parseFloat(item.price),
                  0
                )
                .toFixed(2)}
            </span>
          </div>
          <button
            onClick={handleSubmitOrder}
            disabled={isSubmitting}
            className={`w-full py-2 text-white font-medium rounded ${
              isSubmitting ? "bg-gray-400" : "bg-green-600 hover:bg-green-700"
            }`}
          >
            {isSubmitting ? "Submitting..." : "Submit Order"}
          </button>
        </div>
      </div>
      {isCartOpen && (
        <div onClick={() => setIsCartOpen(false)} className="fixed  z-40"></div>
      )}
      <button
        onClick={handleHelpRequest}
        className="fixed bottom-4 right-4 bg-yellow-500 hover:bg-yellow-600 text-white px-4 py-2 rounded-full shadow-lg z-30"
      >
        Request Help
      </button>
    </div>
  );
}
