import { useState, useEffect } from "react";
import {
  FiUserPlus,
  FiMail,
  FiUser,
  FiKey,
  FiCheck,
  FiX,
  FiEdit2,
  FiTrash2,
  FiRefreshCw,
} from "react-icons/fi";
import { useAuth } from "../Context/AuthContext";
import api from "../Utils/api";
import { toast } from "react-toastify";

export default function UserManagement() {
  const { user } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [isCreating, setIsCreating] = useState(false);
  const [isInviting, setIsInviting] = useState(false);
  const [passwordError, setPasswordError] = useState("");
  const [newUser, setNewUser] = useState({
    name: "",
    username: "",
    role: "WAITER",
    sendInvite: false,
    password: "",
    restaurantCode: "",
  });

  const validatePassword = (password) => {
    if (password.length < 8) return "Password must be at least 8 characters";
    if (!/[A-Z]/.test(password)) return "Include at least one uppercase letter";
    if (!/[0-9]/.test(password)) return "Include at least one number";
    return "";
  };

  const fetchUsers = async () => {
    try {
      if (!user?.restaurantId) {
        toast.error("No restaurant associated with this account");
        return;
      }

      const response = await api.get(`/restaurant/${user.restaurantId}`);
      setUsers(response.data);
    } catch (error) {
      console.error("Error fetching users:", error);
      toast.error(error.response?.data?.message || "Failed to fetch users");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user?.restaurantId) {
      fetchUsers();
    } else {
      setLoading(false);
      toast.error("No restaurant associated with this account");
    }
  }, [user?.restaurantId]);

  const handleCreateUser = async (e) => {
    e.preventDefault();

    // Add password validation
    if (!newUser.password) {
      toast.error("Password is required");
      return;
    }

    const passwordError = validatePassword(newUser.password);
    if (passwordError) {
      toast.error(passwordError);
      return;
    }

    setIsCreating(true);
    try {
      const response = await api.post(`/restaurant/${user.restaurantId}`, {
        name: newUser.name,
        username: newUser.username,
        password: newUser.password,
        role: newUser.role,
      });

      toast.success("User created successfully!");
      setShowCreateModal(false);
      resetForm();
      fetchUsers();
    } catch (error) {
      console.error("Creation error:", error.response?.data);
      toast.error(
        error.response?.data?.message ||
          "Failed to create user. Please check all fields."
      );
    } finally {
      setIsCreating(false);
    }
  };

  const resetForm = () => {
    setNewUser({
      name: "",
      username: "",
      role: "WAITER",
      sendInvite: false,
      password: "",
      restaurantCode: "",
    });
    setEditingUser(null);
    setPasswordError("");
  };

  const handleEditUser = (user) => {
    setEditingUser(user);
    setNewUser({
      name: user.name,
      username: user.username,
      role: user.role,
      password: "",
      restaurantCode: "",
    });
    setShowCreateModal(true);
  };

  const handleUpdateUser = async (e) => {
    e.preventDefault();
    setIsCreating(true);
    try {
      await api.put(`/api/users/${editingUser.id}`, {
        ...newUser,
        id: editingUser.id,
        restaurantId: user.restaurantId,
      });
      toast.success("User updated successfully!");
      setShowCreateModal(false);
      setEditingUser(null);
      fetchUsers();
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to update user");
    } finally {
      setIsCreating(false);
    }
  };

  const handleDeleteUser = async (userId) => {
    if (window.confirm("Are you sure you want to delete this user?")) {
      try {
        await api.delete(`/${userId}`);
        toast.success("User deleted successfully!");
        fetchUsers();
      } catch (error) {
        toast.error(error.response?.data?.message || "Failed to delete user");
      }
    }
  };

  const handleActivateUser = async (userId, currentActiveStatus) => {
    try {
      const targetUser = users.find((u) => u.id === userId);

      if (targetUser?.role === "ADMIN") {
        toast.error("Admin accounts cannot be deactivated");
        return;
      }

      await api.patch(`/api/users/${userId}/status`, {
        active: !currentActiveStatus,
      });
      toast.success(
        `User ${
          currentActiveStatus ? "deactivated" : "activated"
        } successfully!`
      );
      fetchUsers();
    } catch (error) {
      toast.error(
        error.response?.data?.message || "Failed to update user status"
      );
    }
  };

  const renderRoleBadge = (role) => {
    const baseClasses = "px-2 py-1 text-xs rounded-full";
    switch (role) {
      case "ADMIN":
        return (
          <span className={`${baseClasses} bg-purple-100 text-purple-800`}>
            {role}
          </span>
        );
      case "WAITER":
        return (
          <span className={`${baseClasses} bg-blue-100 text-blue-800`}>
            {role}
          </span>
        );
      default:
        return (
          <span className={`${baseClasses} bg-orange-100 text-orange-800`}>
            {role}
          </span>
        );
    }
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">User Management</h1>
        <div className="flex space-x-3">
          <button
            onClick={() => {
              resetForm();
              setShowCreateModal(true);
            }}
            className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            <FiUserPlus className="mr-2" /> Create User
          </button>

          <button
            onClick={fetchUsers}
            className="flex items-center px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
            disabled={loading}
          >
            <FiRefreshCw className={`mr-2 ${loading ? "animate-spin" : ""}`} />
            {loading ? "Refreshing..." : "Refresh"}
          </button>
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        {loading ? (
          <div className="p-8 text-center">Loading users...</div>
        ) : users.length === 0 ? (
          <div className="p-8 text-center">
            <FiUser className="mx-auto text-4xl text-gray-400 mb-2" />
            <p className="text-gray-500">No users found for this restaurant</p>
            {user?.role === "ADMIN" && (
              <button
                onClick={() => setShowCreateModal(true)}
                className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Create First User
              </button>
            )}
          </div>
        ) : (
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Username
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Role
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {users.map((userItem) => (
                <tr key={userItem.id}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {userItem.name}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {userItem.username}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {renderRoleBadge(userItem.role)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {userItem.role === "ADMIN" ? (
                      <span className="px-2 py-1 text-xs rounded-full bg-purple-100 text-purple-800">
                        Admin (Always Active)
                      </span>
                    ) : (
                      <button
                        onClick={() =>
                          handleActivateUser(userItem.id, userItem.active)
                        }
                        className={`px-2 py-1 text-xs rounded-full ${
                          userItem.active
                            ? "bg-green-100 text-green-800"
                            : "bg-red-100 text-red-800"
                        }`}
                      >
                        {userItem.active ? "Active" : "Inactive"}
                      </button>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap space-x-2">
                    <button
                      onClick={() => handleEditUser(userItem)}
                      className="p-1 text-blue-600 hover:text-blue-800"
                      disabled={
                        userItem.role === "ADMIN" || userItem.id === user.id
                      }
                      title={
                        userItem.role === "ADMIN"
                          ? "Admin users cannot be edited"
                          : userItem.id === user.id
                          ? "You cannot edit your own account"
                          : "Edit user"
                      }
                    >
                      <FiEdit2 />
                    </button>
                    <button
                      onClick={() => handleDeleteUser(userItem.id)}
                      className="p-1 text-red-600 hover:text-red-800"
                      disabled={
                        userItem.role === "ADMIN" || userItem.id === user.id
                      }
                      title={
                        userItem.role === "ADMIN"
                          ? "Admin users cannot be deleted"
                          : userItem.id === user.id
                          ? "You cannot delete your own account"
                          : "Delete user"
                      }
                    >
                      <FiTrash2 />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Create/Edit User Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="w-full max-w-md bg-white rounded-lg shadow-xl">
            <div className="bg-blue-600 p-4 rounded-t-lg flex justify-between items-center">
              <h3 className="text-lg font-semibold text-white">
                {editingUser ? "Edit User" : "Create New User"}
              </h3>
              <button
                onClick={() => {
                  setShowCreateModal(false);
                  resetForm();
                }}
                className="text-white hover:text-blue-200"
              >
                <FiX />
              </button>
            </div>
            <form
              onSubmit={editingUser ? handleUpdateUser : handleCreateUser}
              className="p-6"
            >
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">
                    Full Name
                  </label>
                  <input
                    type="text"
                    value={newUser.name}
                    onChange={(e) =>
                      setNewUser({ ...newUser, name: e.target.value })
                    }
                    className="w-full px-3 py-2 border rounded-md"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">
                    Username (Email)
                  </label>
                  <input
                    type="email"
                    value={newUser.username}
                    onChange={(e) =>
                      setNewUser({ ...newUser, username: e.target.value })
                    }
                    className="w-full px-3 py-2 border rounded-md"
                    required
                    disabled={!!editingUser}
                  />
                </div>
                {!editingUser && (
                  <>
                    <div>
                      <label className="block text-sm font-medium mb-1">
                        Password
                      </label>
                      <input
                        type="password"
                        value={newUser.password}
                        onChange={(e) => {
                          const error = validatePassword(e.target.value);
                          setPasswordError(error);
                          setNewUser({ ...newUser, password: e.target.value });
                        }}
                        className="w-full px-3 py-2 border rounded-md"
                        required={!editingUser}
                        minLength="8"
                      />
                      {passwordError && (
                        <p className="text-red-500 text-xs mt-1">
                          {passwordError}
                        </p>
                      )}
                    </div>
                    {newUser.role === "ADMIN" && !editingUser && (
                      <div>
                        <label className="block text-sm font-medium mb-1">
                          Restaurant Code
                        </label>
                        <input
                          type="text"
                          value={newUser.restaurantCode}
                          onChange={(e) =>
                            setNewUser({
                              ...newUser,
                              restaurantCode: e.target.value,
                            })
                          }
                          className="w-full px-3 py-2 border rounded-md"
                          required={newUser.role === "ADMIN"}
                          pattern="[A-Za-z0-9-]{4,20}"
                          title="4-20 alphanumeric characters"
                        />
                      </div>
                    )}
                  </>
                )}
                <div>
                  <label className="block text-sm font-medium mb-1">Role</label>
                  <select
                    value={newUser.role}
                    onChange={(e) =>
                      setNewUser({ ...newUser, role: e.target.value })
                    }
                    className="w-full px-3 py-2 border rounded-md"
                    disabled={editingUser?.role === "ADMIN"}
                  >
                    <option value="WAITER">Waiter</option>
                    <option value="KITCHEN">Kitchen Staff</option>
                  </select>
                </div>
              </div>
              <div className="mt-6 flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => {
                    setShowCreateModal(false);
                    resetForm();
                  }}
                  className="px-4 py-2 bg-gray-200 rounded-md hover:bg-gray-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center justify-center"
                  disabled={
                    isCreating ||
                    (newUser.role === "ADMIN" && !newUser.restaurantCode)
                  }
                >
                  {isCreating ? (
                    <>
                      <FiRefreshCw className="animate-spin mr-2" />
                      {editingUser ? "Updating..." : "Creating..."}
                    </>
                  ) : editingUser ? (
                    "Update User"
                  ) : (
                    "Create User"
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Invite User Modal */}
      {showInviteModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="w-full max-w-md bg-white rounded-lg shadow-xl">
            <div className="bg-green-600 p-4 rounded-t-lg flex justify-between items-center">
              <h3 className="text-lg font-semibold text-white">Invite User</h3>
              <button
                onClick={() => {
                  setShowInviteModal(false);
                  resetForm();
                }}
                className="text-white hover:text-green-200"
              >
                <FiX />
              </button>
            </div>
            <form onSubmit={handleInviteUser} className="p-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">
                    Full Name
                  </label>
                  <input
                    type="text"
                    value={newUser.name}
                    onChange={(e) =>
                      setNewUser({ ...newUser, name: e.target.value })
                    }
                    className="w-full px-3 py-2 border rounded-md"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">
                    Email
                  </label>
                  <input
                    type="email"
                    value={newUser.username}
                    onChange={(e) =>
                      setNewUser({ ...newUser, username: e.target.value })
                    }
                    className="w-full px-3 py-2 border rounded-md"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Role</label>
                  <select
                    value={newUser.role}
                    onChange={(e) =>
                      setNewUser({ ...newUser, role: e.target.value })
                    }
                    className="w-full px-3 py-2 border rounded-md"
                  >
                    <option value="WAITER">Waiter</option>
                    <option value="KITCHEN">Kitchen Staff</option>
                  </select>
                </div>
                <p className="text-sm text-gray-500">
                  An invitation email will be sent with instructions to create
                  their own credentials.
                </p>
              </div>
              <div className="mt-6 flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => {
                    setShowInviteModal(false);
                    resetForm();
                  }}
                  className="px-4 py-2 bg-gray-200 rounded-md hover:bg-gray-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 flex items-center justify-center"
                  disabled={isInviting}
                >
                  {isInviting ? (
                    <>
                      <FiRefreshCw className="animate-spin mr-2" />
                      Sending...
                    </>
                  ) : (
                    "Send Invitation"
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
