import axios from "axios";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

export default function MenuManager() {
  const [menuItems, setMenuItems] = useState([]);
  const [newItem, setNewItem] = useState({
    name: "",
    price: "",
    description: "",
    category: "",
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);
  const [activeTab, setActiveTab] = useState("All");
  const [editingId, setEditingId] = useState(null);
  const [editFormData, setEditFormData] = useState({
    name: "",
    price: "",
    description: "",
    category: "",
  });
  const [searchQuery, setSearchQuery] = useState("");
  const [sort, setSort] = useState("nameAsc");

  const navigate = useNavigate();

  const uniqueCategories = [
    "All",
    ...new Set(menuItems.map((i) => i.category || "Uncategorized")),
  ].filter(Boolean);

  const filteredItems = menuItems
    .filter((item) =>
      activeTab === "All"
        ? true
        : activeTab === "Uncategorized"
        ? !item.category
        : item.category === activeTab
    )
    .filter((item) =>
      item.name.toLowerCase().includes(searchQuery.toLowerCase())
    )
    .sort((a, b) => {
      switch (sort) {
        case "priceAsc":
          return a.price - b.price;
        case "priceDesc":
          return b.price - a.price;
        case "nameDesc":
          return b.name.localeCompare(a.name);
        default:
          return a.name.localeCompare(b.name);
      }
    });

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;
  const lastItemIndex = currentPage * itemsPerPage;
  const firstItemIndex = lastItemIndex - itemsPerPage;
  const paginatedItems = filteredItems.slice(firstItemIndex, lastItemIndex);
  const totalPages = Math.ceil(filteredItems.length / itemsPerPage);

  const handlePageChange = (pageNumber) => {
    setCurrentPage(pageNumber);
  };

  const fetchMenuItems = () => {
    setIsLoading(true);
    axios
      .get("http://localhost:8080/api/menu")
      .then((res) => {
        setMenuItems(res.data);
        setIsLoading(false);
      })
      .catch(() => {
        toast.error("Failed to load menu items");
        setIsLoading(false);
      });
  };

  useEffect(() => {
    fetchMenuItems();
  }, []);

  const handleAddItem = (e) => {
    e.preventDefault();
    if (!newItem.name || !newItem.price) {
      toast.warning("Name and Price are required");
      return;
    }

    setIsAdding(true);
    axios
      .post("http://localhost:8080/api/menu", newItem)
      .then(() => {
        fetchMenuItems();
        setNewItem({ name: "", price: "", description: "", category: "" });
        toast.success("Item added successfully!");
      })
      .catch(() => toast.error("Failed to add item"))
      .finally(() => setIsAdding(false));
  };

  const handleDeleteItem = (id) => {
    if (!window.confirm("Are you sure you want to delete this item?")) return;

    axios
      .delete(`http://localhost:8080/api/menu/${id}`)
      .then(() => {
        setMenuItems(menuItems.filter((item) => item.id !== id));
        toast.success("Item deleted successfully!");
      })
      .catch(() => toast.error("Failed to delete item"));
  };

  const handleUpdateItem = (id) => {
    axios
      .put(`http://localhost:8080/api/menu/${id}`, editFormData)
      .then((res) => {
        setMenuItems(
          menuItems.map((item) => (item.id === id ? res.data : item))
        );
        toast.success("Item updated successfully!");
        setEditingId(null);
      })
      .catch(() => toast.error("Failed to update item"));
  };

  const startEditing = (item) => {
    setEditingId(item.id);
    setEditFormData({
      name: item.name,
      price: item.price,
      category: item.category || "",
      description: item.description || "",
    });
  };

  const cancelEditing = () => {
    setEditingId(null);
  };

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <ToastContainer position="top-center" autoClose={3000} />
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Menu Manager</h1>
      </div>

      <form
        onSubmit={handleAddItem}
        className="bg-white shadow-sm border border-gray-200 rounded-lg p-5 space-y-4 mb-8"
      >
        <h2 className="text-xl font-semibold">Add Menu Item</h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <input
            placeholder="Name*"
            value={newItem.name}
            onChange={(e) => setNewItem({ ...newItem, name: e.target.value })}
            className="border px-3 py-2 rounded w-full"
            required
          />
          <input
            type="number"
            placeholder="Price*"
            value={newItem.price}
            onChange={(e) => setNewItem({ ...newItem, price: e.target.value })}
            className="border px-3 py-2 rounded w-full"
            required
          />
          <input
            placeholder="Category"
            value={newItem.category}
            onChange={(e) =>
              setNewItem({ ...newItem, category: e.target.value })
            }
            className="border px-3 py-2 rounded w-full"
          />
          <input
            placeholder="Description"
            value={newItem.description}
            onChange={(e) =>
              setNewItem({ ...newItem, description: e.target.value })
            }
            className="border px-3 py-2 rounded w-full"
          />
        </div>
        <button
          type="submit"
          disabled={isAdding}
          className={`px-4 py-2 rounded text-white ${
            isAdding ? "bg-blue-400" : "bg-blue-600 hover:bg-blue-700"
          }`}
        >
          {isAdding ? "Adding..." : "Add Item"}
        </button>
      </form>

      <div className="flex flex-wrap gap-2 mb-4">
        {uniqueCategories.map((cat) => (
          <button
            key={cat}
            onClick={() => setActiveTab(cat)}
            className={`px-3 py-1 rounded-full text-sm ${
              activeTab === cat
                ? "bg-blue-600 text-white"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            }`}
          >
            {cat}
          </button>
        ))}
      </div>
      <div className="flex flex-col md:flex-row gap-3 mb-4">
        <input
          type="text"
          placeholder="Search by name..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="flex-1 px-3 py-2 border border-gray-300 rounded-md"
        />
        <select
          value={sort}
          onChange={(e) => setSort(e.target.value)}
          className="w-full md:w-60 px-3 py-2 border border-gray-300 rounded-md"
        >
          <option value="nameAsc">Name (A-Z)</option>
          <option value="nameDesc">Name (Z-A)</option>
          <option value="priceAsc">Price (Low → High)</option>
          <option value="priceDesc">Price (High → Low)</option>
        </select>
      </div>
      <div className="space-y-4">
        {isLoading ? (
          <p>Loading...</p>
        ) : paginatedItems.length === 0 ? (
          <p className="text-gray-500">No items found.</p>
        ) : (
          paginatedItems.map((item) => (
            <div
              key={item.id}
              className="border border-gray-200 rounded-lg p-4 bg-white shadow-sm"
            >
              {editingId === item.id ? (
                <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
                  <input
                    value={editFormData.name}
                    onChange={(e) =>
                      setEditFormData({
                        ...editFormData,
                        name: e.target.value,
                      })
                    }
                    className="border px-2 py-1 rounded"
                  />
                  <input
                    type="number"
                    value={editFormData.price}
                    onChange={(e) =>
                      setEditFormData({
                        ...editFormData,
                        price: e.target.value,
                      })
                    }
                    className="border px-2 py-1 rounded"
                  />
                  <input
                    value={editFormData.category}
                    onChange={(e) =>
                      setEditFormData({
                        ...editFormData,
                        category: e.target.value,
                      })
                    }
                    className="border px-2 py-1 rounded"
                  />
                  <input
                    value={editFormData.description}
                    onChange={(e) =>
                      setEditFormData({
                        ...editFormData,
                        description: e.target.value,
                      })
                    }
                    className="border px-2 py-1 rounded"
                  />
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleUpdateItem(item.id)}
                      className="bg-green-600 text-white px-3 py-1 rounded"
                    >
                      Save
                    </button>
                    <button
                      onClick={cancelEditing}
                      className="bg-gray-200 px-3 py-1 rounded"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col md:flex-row md:justify-between">
                  <div>
                    <h3 className="font-medium">{item.name}</h3>
                    <p className="text-sm text-gray-500">
                      ${parseFloat(item.price).toFixed(2)}{" "}
                      {item.category && `• ${item.category}`}
                    </p>
                    {item.description && (
                      <p className="text-sm text-gray-600 mt-1">
                        {item.description}
                      </p>
                    )}
                  </div>
                  <div className="flex gap-2 mt-2 md:mt-0">
                    <button
                      onClick={() => startEditing(item)}
                      className="bg-blue-100 text-blue-700 px-3 py-1 rounded hover:bg-blue-200"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDeleteItem(item.id)}
                      className="bg-red-100 text-red-700 px-3 py-1 rounded hover:bg-red-200"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))
        )}
      </div>

      <div className="flex justify-center mt-6 space-x-2">
        {[...Array(totalPages).keys()].map((_, index) => {
          const page = index + 1;
          return (
            <button
              key={page}
              onClick={() => handlePageChange(page)}
              className={`px-3 py-1 rounded ${
                currentPage === page
                  ? "bg-blue-600 text-white"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              {page}
            </button>
          );
        })}
      </div>
    </div>
  );
}
