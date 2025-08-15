import React, { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import {
  FiShoppingCart,
  FiX,
  FiPlus,
  FiMinus,
  FiHelpCircle,
  FiSearch,
  FiChevronDown,
  FiChevronUp,
} from "react-icons/fi";
import { motion, AnimatePresence } from "framer-motion";
import SockJS from "sockjs-client";
import { Client } from "@stomp/stompjs";

export function CustomerOrder() {
  const { tableNumber: tableNumberParam } = useParams();
  const navigate = useNavigate();
  const [tableID, setTableID] = useState(tableNumberParam || "");
  const [isTableIdLocked, setIsTableIdLocked] = useState(!!tableNumberParam);
  const [menuItems, setMenuItems] = useState([]);
  const [cart, setCart] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeCategory, setActiveCategory] = useState("All");
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [helpRequestSending, setHelpRequestSending] = useState(false);
  const [helpRequested, setHelpRequested] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [isHelpDropdownOpen, setIsHelpDropdownOpen] = useState(false);
  const [helpReason, setHelpReason] = useState("Need assistance");
  const [connectionState, setConnectionState] = useState("DISCONNECTED");

  const clientRef = useRef(null);
  const subscriptionsRef = useRef({});

  const helpReasons = [
    "Need assistance",
    "Need bill",
    "Questions about food",
    "Cutlery/napkins request",
    "Table issue",
    "Other request",
  ];

  useEffect(() => {
    if (!tableID) return;

    const socket = new SockJS("http://13.58.52.22:8080/ws");
    const stompClient = new Client({
      webSocketFactory: () => socket,
      reconnectDelay: 5000,
      heartbeatIncoming: 4000,
      heartbeatOutgoing: 4000,
      onConnect: () => {
        setConnectionState("CONNECTED");
        const sub = stompClient.subscribe(
          `/topic/session-ended/${tableID}`,
          (message) => {
            try {
              const event = JSON.parse(message.body);
              if (event.eventType === "SESSION_PROPERLY_ENDED") {
                navigate(`/thank-you/${tableID}`);
              }
            } catch (err) {
              // Error handling without console.log
            }
          }
        );
        subscriptionsRef.current.sessionEnded = sub;
      },
      onStompError: (frame) => {
        setConnectionState("ERROR");
      },
      onWebSocketError: (error) => {
        setConnectionState("ERROR");
      },
      onDisconnect: () => {
        setConnectionState("DISCONNECTED");
      },
    });

    stompClient.activate();
    clientRef.current = stompClient;

    return () => {
      if (clientRef.current) {
        if (subscriptionsRef.current.sessionEnded) {
          subscriptionsRef.current.sessionEnded.unsubscribe();
        }
        clientRef.current.deactivate();
      }
    };
  }, [tableID, navigate]);

  useEffect(() => {
    const loadMenu = async () => {
      try {
        const res = await axios.get("http://13.58.52.22:8080/api/menu/public");
        setMenuItems(res.data);
      } catch (error) {
        toast.error("Failed to load menu: " + error.message);
      } finally {
        setIsLoading(false);
      }
    };

    loadMenu();
  }, []);

  const uniqueCategory = [
    "All",
    ...new Set(menuItems.map((item) => item.category || "Uncategorized")),
  ];

  const filteredMenu = menuItems.filter((item) => {
    const categoryMatch =
      activeCategory === "All" ||
      (item.category || "Uncategorized") === activeCategory;

    const nameMatch = searchTerm
      ? item.name.toLowerCase().includes(searchTerm.toLowerCase())
      : true;

    return categoryMatch && nameMatch;
  });

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

    toast.success(`Added ${item.name} to cart`, {
      icon: "🛒",
      position: "bottom-right",
      autoClose: 1000,
      hideProgressBar: true,
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
    setCart((prev) => prev.filter((item) => item.id !== id));
    toast.info("Item removed from cart", {
      position: "bottom-right",
      autoClose: 1000,
      hideProgressBar: true,
    });
  };

  const handleSubmitOrder = async () => {
    if (!tableID) {
      toast.warning("Please enter your Table ID!");
      return;
    }
    if (cart.length === 0) {
      toast.warning("Your cart is empty!");
      return;
    }

    setIsSubmitting(true);

    try {
      await axios.post(
        `http://13.58.52.22:8080/api/tables/${tableID}/start-session`
      );

      const orderData = {
        tableNumber: tableID,
        items: cart.map((item) => ({
          menuItem: { id: item.id },
          quantity: item.quantity,
          instructions: item.instructions || "",
        })),
      };

      await axios.post("http://13.58.52.22:8080/api/orders", orderData, {
        headers: {
          "Content-Type": "application/json",
        },
      });

      toast.success("Order Placed Successfully!");
      setCart([]);
      setIsCartOpen(false);

      navigate(`/guest-orders/${tableID}`);
    } catch (error) {
      toast.error(error.response?.data?.message || "Order failed");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleHelpRequest = (reason = helpReason) => {
    if (!tableID) {
      toast.warning("Please enter your Table ID to request help!");
      return;
    }
    if (helpRequestSending) return;

    setHelpRequestSending(true);

    axios
      .post("http://13.58.52.22:8080/api/help-requests", {
        tableNumber: tableID,
        reason: reason,
      })
      .then(() => {
        toast.success("Help request sent! A waiter is on the way.", {
          position: "top-center",
          autoClose: 3000,
        });
        setHelpRequested(true);
        setIsHelpDropdownOpen(false);
        setTimeout(() => setHelpRequested(false), 30000);

        if (reason === "Need bill") {
          if (clientRef.current) {
            clientRef.current.publish({
              destination: "/app/notify-bill",
              body: JSON.stringify({ tableNumber: tableID }),
            });
            toast.info("Bill request sent to staff");
          }
        }
      })
      .catch(() => toast.error("Failed to send help request"))
      .finally(() => setHelpRequestSending(false));
  };

  const cartTotal = cart.reduce((sum, item) => {
    const price = parseFloat(item.price);
    return sum + (isNaN(price) ? 0 : price) * item.quantity;
  }, 0);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const tableId = params.get("table");
    if (tableId) {
      setTableID(tableId);
      setIsTableIdLocked(true);
    }
  }, []);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-16 w-16 border-t-4 border-blue-600"></div>
          <p className="mt-4 text-gray-600 font-medium">Loading menu...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <ToastContainer position="top-center" autoClose={3000} />

      {/* Shopping cart button */}
      <motion.button
        onClick={() => setIsCartOpen(true)}
        className="fixed right-6 bottom-6 z-40 bg-blue-600 text-white p-4 rounded-full shadow-xl hover:bg-blue-700 transition-all flex items-center justify-center"
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
      >
        <FiShoppingCart className="text-xl" />
        {cart.length > 0 && (
          <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs font-bold rounded-full h-6 w-6 flex items-center justify-center">
            {cart.length}
          </span>
        )}
      </motion.button>

      {/* Help button with dropdown */}
      <div className="fixed left-6 bottom-6 z-40 flex flex-col items-end">
        <AnimatePresence>
          {isHelpDropdownOpen && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              className="mb-2 w-48 bg-white rounded-lg shadow-xl overflow-hidden"
            >
              {helpReasons.map((reason) => (
                <button
                  key={reason}
                  onClick={() => {
                    setHelpReason(reason);
                    handleHelpRequest(reason);
                  }}
                  disabled={helpRequestSending || helpRequested}
                  className={`w-full px-4 py-3 text-left text-sm ${
                    helpReason === reason
                      ? "bg-blue-100 text-blue-700"
                      : "hover:bg-gray-50"
                  } transition-colors`}
                >
                  {reason}
                </button>
              ))}
            </motion.div>
          )}
        </AnimatePresence>

        <motion.button
          onClick={() => {
            if (helpRequested || helpRequestSending) return;
            setIsHelpDropdownOpen(!isHelpDropdownOpen);
          }}
          disabled={helpRequestSending || helpRequested}
          className={`p-4 rounded-full shadow-xl transition-all flex items-center ${
            helpRequestSending
              ? "bg-gray-400 cursor-not-allowed text-white"
              : helpRequested
              ? "bg-green-600 text-white cursor-default"
              : "bg-amber-500 text-white hover:bg-amber-600"
          }`}
          whileHover={{ scale: helpRequestSending || helpRequested ? 1 : 1.05 }}
          whileTap={{ scale: helpRequestSending || helpRequested ? 1 : 0.95 }}
        >
          <FiHelpCircle className="text-xl" />
          {!helpRequested && !helpRequestSending && (
            <span className="ml-2">
              {isHelpDropdownOpen ? <FiChevronUp /> : <FiChevronDown />}
            </span>
          )}
        </motion.button>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8">
          <div>
            <h1 className="text-4xl font-extrabold text-gray-900 mb-2">
              Welcome to <span className="text-blue-600">Kutty leaf</span>
            </h1>
            <p className="text-lg text-gray-600">
              Browse our exquisite menu and place your order
            </p>
          </div>

          <div className="mt-4 md:mt-0 w-full md:w-auto">
            <div className="relative">
              <input
                type="text"
                value={tableID}
                readOnly={isTableIdLocked}
                onChange={(e) => {
                  if (!isTableIdLocked) setTableID(e.target.value);
                }}
                placeholder="Enter your Table ID"
                className={`w-full px-5 py-3 rounded-lg border-2 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition duration-200 ${
                  isTableIdLocked
                    ? "border-gray-300 bg-gray-100 cursor-not-allowed"
                    : "border-gray-200 bg-white"
                }`}
              />
              {!isTableIdLocked && tableID && (
                <button
                  onClick={() => setTableID("")}
                  className="absolute right-3 top-3 text-gray-400 hover:text-gray-600"
                  aria-label="Clear Table ID"
                >
                  <FiX />
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Search bar */}
        <div className="mb-6">
          <div className="relative">
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search menu items by name..."
              className="w-full px-5 py-3 rounded-lg border-2 border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition duration-200 pl-12"
            />
            <FiSearch className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 text-xl" />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm("")}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                aria-label="Clear search"
              >
                <FiX />
              </button>
            )}
          </div>
        </div>

        {/* Category filter */}
        <div className="mb-8">
          <div className="flex space-x-2 overflow-x-auto pb-2 scrollbar-hide">
            {uniqueCategory.map((category) => (
              <button
                key={category}
                onClick={() => setActiveCategory(category)}
                className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all duration-200 ${
                  activeCategory === category
                    ? "bg-blue-600 text-white shadow-md"
                    : "bg-white text-gray-700 hover:bg-gray-100 shadow-sm"
                }`}
              >
                {category}
              </button>
            ))}
          </div>
        </div>

        {/* Menu grid */}
        {filteredMenu.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16">
            <div className="bg-gray-200 border-2 border-dashed rounded-xl w-16 h-16 flex items-center justify-center mb-4">
              <FiSearch className="text-gray-500 text-2xl" />
            </div>
            <h2 className="text-2xl font-bold text-gray-700 mb-2">
              No matching items found
            </h2>
            <p className="text-gray-500 text-center max-w-md">
              We couldn't find any menu items matching "{searchTerm}". Try
              another search term or clear your search to see all items.
            </p>
            <button
              onClick={() => setSearchTerm("")}
              className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Clear Search
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {filteredMenu.map((item) => (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
                className="bg-white rounded-xl shadow-sm overflow-hidden hover:shadow-md transition-shadow duration-200 border border-gray-100 relative"
              >
                <div className="h-48 bg-gray-100 flex items-center justify-center relative">
                  {item.imageUrl ? (
                    <img
                      src={
                        item.imageUrl.startsWith("http")
                          ? item.imageUrl
                          : `http://13.58.52.22:8080${item.imageUrl}`
                      }
                      alt={item.name}
                      className={`w-full h-full object-cover ${
                        !item.available ? "opacity-50 grayscale" : ""
                      }`}
                    />
                  ) : (
                    <div className="text-gray-400 text-sm">
                      No image available
                    </div>
                  )}
                  {!item.available && (
                    <span className="absolute top-2 right-2 bg-red-600 text-white px-2 py-1 text-xs font-semibold rounded">
                      Not Available
                    </span>
                  )}
                </div>

                <div className="p-4">
                  <div className="flex justify-between items-start mb-2">
                    <h3
                      className={`font-bold text-lg text-gray-900 ${
                        !item.available ? "line-through text-gray-400" : ""
                      }`}
                    >
                      {item.name}
                    </h3>
                    <span
                      className={`font-bold text-blue-600 ${
                        !item.available ? "text-gray-400" : ""
                      }`}
                    >
                      ${parseFloat(item.price).toFixed(2)}
                    </span>
                  </div>

                  {item.description && (
                    <p
                      className={`text-gray-500 text-sm mb-4 line-clamp-2 ${
                        !item.available ? "text-gray-400" : ""
                      }`}
                    >
                      {item.description}
                    </p>
                  )}

                  <button
                    onClick={() => addToCart(item)}
                    disabled={!item.available}
                    className={`w-full py-2 rounded-lg font-medium flex items-center justify-center gap-2 transition duration-200 ${
                      item.available
                        ? "bg-blue-600 hover:bg-blue-700 text-white cursor-pointer"
                        : "bg-gray-300 text-gray-500 cursor-not-allowed"
                    }`}
                  >
                    <FiPlus />
                    Add to Order
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* Cart Drawer */}
      <AnimatePresence>
        {isCartOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsCartOpen(false)}
              className="fixed inset-0 bg-opacity-50 backdrop-blur-xs z-50"
            />

            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 30 }}
              className="fixed top-0 right-0 h-full w-full sm:w-96 bg-white shadow-xl z-50 flex flex-col"
            >
              <div className="p-6 border-b border-gray-200 flex justify-between items-center">
                <h2 className="text-2xl font-bold text-gray-900">Your Order</h2>
                <button
                  onClick={() => setIsCartOpen(false)}
                  className="text-gray-500 hover:text-gray-700 p-1 rounded-full hover:bg-gray-100"
                >
                  <FiX className="text-xl" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto px-6 py-4">
                {cart.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full text-center">
                    <FiShoppingCart className="text-5xl text-gray-300 mb-4" />
                    <h3 className="text-xl font-medium text-gray-500 mb-2">
                      Your cart is empty
                    </h3>
                    <p className="text-gray-400">
                      Add items from the menu to get started
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {cart.map((item) => (
                      <motion.div
                        key={item.id}
                        layout
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="bg-gray-50 rounded-lg p-4"
                      >
                        <div className="flex justify-between items-start mb-2">
                          <div>
                            <h3 className="font-medium text-gray-900">
                              {item.name}
                            </h3>
                            <p className="text-sm text-blue-600">
                              ${parseFloat(item.price).toFixed(2)} ×{" "}
                              {item.quantity} = $
                              {(item.quantity * parseFloat(item.price)).toFixed(
                                2
                              )}
                            </p>
                          </div>
                          <div className="flex items-center space-x-2">
                            <button
                              onClick={() =>
                                updateQuantity(item.id, item.quantity - 1)
                              }
                              className="p-1 text-gray-500 hover:text-blue-600 rounded-full hover:bg-gray-200"
                            >
                              <FiMinus size={16} />
                            </button>
                            <span className="w-8 text-center">
                              {item.quantity}
                            </span>
                            <button
                              onClick={() =>
                                updateQuantity(item.id, item.quantity + 1)
                              }
                              className="p-1 text-gray-500 hover:text-blue-600 rounded-full hover:bg-gray-200"
                            >
                              <FiPlus size={16} />
                            </button>
                          </div>
                        </div>
                        <textarea
                          placeholder="Special instructions (allergies, preferences, etc.)"
                          value={item.instructions || ""}
                          onChange={(e) => {
                            const val = e.target.value;
                            setCart((prev) =>
                              prev.map((i) =>
                                i.id === item.id
                                  ? { ...i, instructions: val }
                                  : i
                              )
                            );
                          }}
                          className="w-full px-3 py-2 text-sm border border-gray-200 rounded-md focus:border-blue-500 focus:ring-1 focus:ring-blue-200 outline-none transition duration-200"
                          rows={2}
                        />
                        <button
                          onClick={() => removeFromCart(item.id)}
                          className="mt-2 text-xs text-red-500 hover:text-red-700 hover:underline"
                        >
                          Remove item
                        </button>
                      </motion.div>
                    ))}
                  </div>
                )}
              </div>

              <div className="border-t border-gray-200 p-6">
                <div className="flex justify-between items-center mb-6">
                  <span className="font-medium text-gray-700">Subtotal</span>
                  <span className="font-bold text-gray-900">
                    ${cartTotal.toFixed(2)}
                  </span>
                </div>
                <p className="text-sm text-gray-500 mb-4">
                  *Tax will be calculated and applied at the counter.
                </p>
                <button
                  onClick={handleSubmitOrder}
                  disabled={isSubmitting || cart.length === 0 || !tableID}
                  className={`w-full py-3 rounded-lg font-bold text-white transition duration-200 ${
                    isSubmitting
                      ? "bg-gray-400 cursor-not-allowed"
                      : cart.length === 0 || !tableID
                      ? "bg-gray-300 cursor-not-allowed"
                      : "bg-blue-600 hover:bg-blue-700"
                  }`}
                >
                  {!tableID ? (
                    "Enter Table ID to Order"
                  ) : isSubmitting ? (
                    <span className="flex items-center justify-center">
                      <svg
                        className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                      >
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                        ></circle>
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        ></path>
                      </svg>
                      Processing...
                    </span>
                  ) : (
                    "Place Order"
                  )}
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
