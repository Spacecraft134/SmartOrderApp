import axios from "axios";
import { useEffect, useState } from "react";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

export default function MenuManager() {
  const [menuItems, setMenuItems] = useState([]);
  const [newItem, setNewItem] = useState({
    name: "",
    price: "",
    description: "",
    category: "",
    image: null,
  });
  const [previewImage, setPreviewImage] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);
  const [activeTab, setActiveTab] = useState("All");
  const [editingId, setEditingId] = useState(null);
  const [editFormData, setEditFormData] = useState({
    name: "",
    price: "",
    description: "",
    category: "",
    imageUrl: "",
  });
  const [editPreviewImage, setEditPreviewImage] = useState(null);
  const [editImageFile, setEditImageFile] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [sort, setSort] = useState("nameAsc");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  // Fetch menu items
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

  useEffect(() => fetchMenuItems(), []);

  // Add new item
  const handleAddItem = (e) => {
    e.preventDefault();
    if (!newItem.name || !newItem.price) {
      toast.warning("Name and Price are required");
      return;
    }

    setIsAdding(true);
    const formData = new FormData();
    formData.append(
      "item",
      JSON.stringify({
        name: newItem.name,
        price: newItem.price,
        description: newItem.description,
        category: newItem.category,
      })
    );

    if (newItem.image) {
      formData.append("image", newItem.image);
    }

    axios
      .post("http://localhost:8080/api/menu", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      })
      .then(() => {
        fetchMenuItems();
        setNewItem({
          name: "",
          price: "",
          description: "",
          category: "",
          image: null,
        });
        setPreviewImage(null);
        toast.success("Item added successfully!");
      })
      .catch(() => toast.error("Failed to add item"))
      .finally(() => setIsAdding(false));
  };

  // Update item
  const handleUpdateItem = (id) => {
    const formData = new FormData();
    formData.append(
      "item",
      JSON.stringify({
        name: editFormData.name,
        price: editFormData.price,
        description: editFormData.description,
        category: editFormData.category,
        imageUrl: editImageFile ? null : editFormData.imageUrl, // Clear if new image uploaded
      })
    );

    if (editImageFile) {
      formData.append("image", editImageFile);
    }

    axios
      .put(`http://localhost:8080/api/menu/${id}`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      })
      .then((res) => {
        setMenuItems(
          menuItems.map((item) => (item.id === id ? res.data : item))
        );
        toast.success("Item updated successfully!");
        cancelEditing();
      })
      .catch(() => toast.error("Failed to update item"));
  };

  // Delete item
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

  // Image handling
  const handleImageChange = (e, isEdit = false) => {
    const file = e.target.files[0];
    if (!file) return;

    if (isEdit) {
      setEditImageFile(file);
      setEditPreviewImage(URL.createObjectURL(file));
    } else {
      setNewItem({ ...newItem, image: file });
      setPreviewImage(URL.createObjectURL(file));
    }
  };

  // Start editing
  const startEditing = (item) => {
    setEditingId(item.id);
    setEditFormData({
      name: item.name,
      price: item.price,
      category: item.category || "",
      description: item.description || "",
      imageUrl: item.imageUrl || "",
    });
    setEditPreviewImage(
      item.imageUrl ? `http://localhost:8080${item.imageUrl}` : null
    );
    setEditImageFile(null);
  };

  // Cancel editing
  const cancelEditing = () => {
    setEditingId(null);
    setEditPreviewImage(null);
    setEditImageFile(null);
  };

  // Filtering and pagination
  const uniqueCategories = [
    "All",
    ...new Set(menuItems.map((i) => i.category || "Uncategorized")),
  ];
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

  // Pagination
  const lastItemIndex = currentPage * itemsPerPage;
  const firstItemIndex = lastItemIndex - itemsPerPage;
  const paginatedItems = filteredItems.slice(firstItemIndex, lastItemIndex);
  const totalPages = Math.ceil(filteredItems.length / itemsPerPage);

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <ToastContainer position="top-center" autoClose={3000} />
      <h1 className="text-3xl font-bold mb-6">Menu Manager</h1>

      {/* Add Item Form */}
      <form
        onSubmit={handleAddItem}
        className="bg-white shadow-md rounded-lg p-6 mb-8"
      >
        <h2 className="text-xl font-semibold mb-4">Add Menu Item</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          <div className="lg:col-span-2">
            <label className="block text-sm font-medium mb-1">Name*</label>
            <input
              value={newItem.name}
              onChange={(e) => setNewItem({ ...newItem, name: e.target.value })}
              className="w-full px-3 py-2 border rounded-md"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Price*</label>
            <input
              type="number"
              value={newItem.price}
              onChange={(e) =>
                setNewItem({ ...newItem, price: e.target.value })
              }
              className="w-full px-3 py-2 border rounded-md"
              required
              min="0"
              step="0.01"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Category</label>
            <input
              value={newItem.category}
              onChange={(e) =>
                setNewItem({ ...newItem, category: e.target.value })
              }
              className="w-full px-3 py-2 border rounded-md"
            />
          </div>

          <div className="lg:col-span-5">
            <label className="block text-sm font-medium mb-1">
              Description
            </label>
            <textarea
              value={newItem.description}
              onChange={(e) =>
                setNewItem({ ...newItem, description: e.target.value })
              }
              className="w-full px-3 py-2 border rounded-md"
              rows="2"
            />
          </div>

          <div className="lg:col-span-3">
            <label className="block text-sm font-medium mb-1">Image</label>
            <input
              type="file"
              accept="image/*"
              onChange={(e) => handleImageChange(e, false)}
              className="w-full px-3 py-2 border rounded-md"
            />
          </div>

          <div className="lg:col-span-2 flex justify-center">
            {previewImage ? (
              <img
                src={previewImage}
                alt="Preview"
                className="w-32 h-32 object-cover rounded-md border"
              />
            ) : (
              <div className="bg-gray-200 border-2 border-dashed rounded-xl w-32 h-32 flex items-center justify-center text-gray-500">
                No image
              </div>
            )}
          </div>

          <div className="lg:col-span-5 flex justify-end">
            <button
              type="submit"
              disabled={isAdding}
              className={`px-6 py-2 rounded-md text-white ${
                isAdding ? "bg-blue-400" : "bg-blue-600 hover:bg-blue-700"
              }`}
            >
              {isAdding ? "Adding..." : "Add Item"}
            </button>
          </div>
        </div>
      </form>

      {/* Category Tabs */}
      <div className="flex flex-wrap gap-2 mb-6">
        {uniqueCategories.map((cat) => (
          <button
            key={cat}
            onClick={() => {
              setActiveTab(cat);
              setCurrentPage(1);
            }}
            className={`px-4 py-2 rounded-full text-sm font-medium ${
              activeTab === cat
                ? "bg-blue-600 text-white"
                : "bg-gray-100 text-gray-800 hover:bg-gray-200"
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Search and Sort */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <div>
          <label className="block text-sm font-medium mb-1">Search</label>
          <input
            type="text"
            placeholder="Search by name..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full px-3 py-2 border rounded-md"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Sort By</label>
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value)}
            className="w-full px-3 py-2 border rounded-md"
          >
            <option value="nameAsc">Name (A-Z)</option>
            <option value="nameDesc">Name (Z-A)</option>
            <option value="priceAsc">Price (Low → High)</option>
            <option value="priceDesc">Price (High → Low)</option>
          </select>
        </div>
      </div>

      {/* Menu Items List */}
      <div className="space-y-4">
        {isLoading ? (
          <div className="text-center py-10">
            <div className="spinner-border text-blue-500" role="status"></div>
            <p className="mt-2">Loading menu items...</p>
          </div>
        ) : paginatedItems.length === 0 ? (
          <div className="text-center py-10 bg-gray-50 rounded-lg">
            <p className="text-gray-500 text-lg">No menu items found</p>
          </div>
        ) : (
          paginatedItems.map((item) => (
            <div
              key={item.id}
              className="bg-white rounded-lg shadow-md overflow-hidden"
            >
              <div className="md:flex">
                {item.imageUrl && (
                  <div className="md:w-1/4">
                    <img
                      src={`http://localhost:8080${item.imageUrl}`}
                      alt={item.name}
                      className="w-full h-48 object-cover"
                    />
                  </div>
                )}

                <div className={`p-4 ${item.imageUrl ? "md:w-3/4" : "w-full"}`}>
                  {editingId === item.id ? (
                    <div className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium mb-1">
                            Name*
                          </label>
                          <input
                            value={editFormData.name}
                            onChange={(e) =>
                              setEditFormData({
                                ...editFormData,
                                name: e.target.value,
                              })
                            }
                            className="w-full px-3 py-2 border rounded-md"
                            required
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium mb-1">
                            Price*
                          </label>
                          <input
                            type="number"
                            value={editFormData.price}
                            onChange={(e) =>
                              setEditFormData({
                                ...editFormData,
                                price: e.target.value,
                              })
                            }
                            className="w-full px-3 py-2 border rounded-md"
                            required
                            min="0"
                            step="0.01"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium mb-1">
                            Category
                          </label>
                          <input
                            value={editFormData.category}
                            onChange={(e) =>
                              setEditFormData({
                                ...editFormData,
                                category: e.target.value,
                              })
                            }
                            className="w-full px-3 py-2 border rounded-md"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium mb-1">
                            Image
                          </label>
                          <input
                            type="file"
                            accept="image/*"
                            onChange={(e) => handleImageChange(e, true)}
                            className="w-full px-3 py-2 border rounded-md"
                          />
                        </div>

                        <div className="md:col-span-2">
                          <label className="block text-sm font-medium mb-1">
                            Description
                          </label>
                          <textarea
                            value={editFormData.description}
                            onChange={(e) =>
                              setEditFormData({
                                ...editFormData,
                                description: e.target.value,
                              })
                            }
                            className="w-full px-3 py-2 border rounded-md"
                            rows="2"
                          />
                        </div>
                      </div>

                      <div className="flex space-x-3">
                        <button
                          onClick={() => handleUpdateItem(item.id)}
                          className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
                        >
                          Save Changes
                        </button>
                        <button
                          onClick={cancelEditing}
                          className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-col md:flex-row justify-between">
                      <div className="flex-1">
                        <div className="flex justify-between">
                          <h3 className="text-xl font-semibold">{item.name}</h3>
                          <span className="text-lg font-medium">
                            ${parseFloat(item.price).toFixed(2)}
                          </span>
                        </div>

                        {item.category && (
                          <span className="inline-block bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full mt-1">
                            {item.category}
                          </span>
                        )}

                        {item.description && (
                          <p className="mt-2 text-gray-600">
                            {item.description}
                          </p>
                        )}
                      </div>

                      <div className="flex space-x-2 mt-4 md:mt-0 md:ml-4">
                        <button
                          onClick={() => startEditing(item)}
                          className="px-3 py-1 bg-blue-100 text-blue-700 rounded-md hover:bg-blue-200"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDeleteItem(item.id)}
                          className="px-3 py-1 bg-red-100 text-red-700 rounded-md hover:bg-red-200"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center mt-8 space-x-2">
          <button
            onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
            disabled={currentPage === 1}
            className="px-4 py-2 bg-gray-200 rounded-md disabled:opacity-50"
          >
            Previous
          </button>

          {[...Array(totalPages)].map((_, i) => (
            <button
              key={i + 1}
              onClick={() => setCurrentPage(i + 1)}
              className={`px-4 py-2 rounded-md ${
                currentPage === i + 1
                  ? "bg-blue-600 text-white"
                  : "bg-gray-200 hover:bg-gray-300"
              }`}
            >
              {i + 1}
            </button>
          ))}

          <button
            onClick={() =>
              setCurrentPage((prev) => Math.min(totalPages, prev + 1))
            }
            disabled={currentPage === totalPages}
            className="px-4 py-2 bg-gray-200 rounded-md disabled:opacity-50"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}
