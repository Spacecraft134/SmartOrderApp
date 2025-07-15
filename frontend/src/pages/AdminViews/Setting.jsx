import { useState } from "react";
import {
  FiUser,
  FiLock,
  FiShield,
  FiMail,
  FiCheck,
  FiEdit,
} from "react-icons/fi";

export function Setting() {
  const [activeTab, setActiveTab] = useState("account");

  return (
    <div className="max-w-3xl mx-auto p-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Account Settings</h1>
        <button className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors flex items-center text-sm">
          <FiCheck className="mr-2" /> Save Changes
        </button>
      </div>

      {/* Settings Navigation */}
      <div className="flex mb-8 border-b border-gray-200">
        <button
          onClick={() => setActiveTab("account")}
          className={`px-4 py-2 font-medium ${
            activeTab === "account"
              ? "border-b-2 border-blue-600 text-blue-600"
              : "text-gray-600 hover:text-gray-900"
          }`}
        >
          Account
        </button>
        <button
          onClick={() => setActiveTab("security")}
          className={`px-4 py-2 font-medium ${
            activeTab === "security"
              ? "border-b-2 border-blue-600 text-blue-600"
              : "text-gray-600 hover:text-gray-900"
          }`}
        >
          Security & Privacy
        </button>
        <button
          onClick={() => setActiveTab("password")}
          className={`px-4 py-2 font-medium ${
            activeTab === "password"
              ? "border-b-2 border-blue-600 text-blue-600"
              : "text-gray-600 hover:text-gray-900"
          }`}
        >
          Password
        </button>
        <button
          onClick={() => setActiveTab("profile")}
          className={`px-4 py-2 font-medium ${
            activeTab === "profile"
              ? "border-b-2 border-blue-600 text-blue-600"
              : "text-gray-600 hover:text-gray-900"
          }`}
        >
          Profile
        </button>
        <button
          onClick={() => setActiveTab("email")}
          className={`px-4 py-2 font-medium ${
            activeTab === "email"
              ? "border-b-2 border-blue-600 text-blue-600"
              : "text-gray-600 hover:text-gray-900"
          }`}
        >
          Email Notifications
        </button>
      </div>

      {/* Content Area */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        {/* Account Tab */}
        {activeTab === "account" && (
          <div className="p-6 space-y-6">
            <div className="flex items-center">
              <FiUser className="text-blue-500 mr-3 text-lg" />
              <h2 className="text-lg font-semibold">Basic Information</h2>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Username
                </label>
                <input
                  type="text"
                  defaultValue="yourusername"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email
                </label>
                <div className="flex">
                  <input
                    type="email"
                    defaultValue="user@example.com"
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-l-md focus:ring-blue-500 focus:border-blue-500"
                  />
                  <button className="px-3 py-2 bg-gray-100 border border-l-0 border-gray-300 rounded-r-md text-sm font-medium hover:bg-gray-200">
                    Verify
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Security & Privacy Tab */}
        {activeTab === "security" && (
          <div className="p-6 space-y-6">
            <div className="flex items-center">
              <FiShield className="text-blue-500 mr-3 text-lg" />
              <h2 className="text-lg font-semibold">Security & Privacy</h2>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-medium text-gray-700">
                    Two-factor authentication
                  </h3>
                  <p className="text-xs text-gray-500">
                    Add an extra layer of security
                  </p>
                </div>
                <button className="px-3 py-1 bg-gray-100 hover:bg-gray-200 rounded-md text-sm font-medium">
                  Enable
                </button>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-medium text-gray-700">
                    Data privacy
                  </h3>
                  <p className="text-xs text-gray-500">
                    Manage your data sharing preferences
                  </p>
                </div>
                <button className="px-3 py-1 bg-gray-100 hover:bg-gray-200 rounded-md text-sm font-medium">
                  Manage
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Password Tab */}
        {activeTab === "password" && (
          <div className="p-6 space-y-6">
            <div className="flex items-center">
              <FiLock className="text-blue-500 mr-3 text-lg" />
              <h2 className="text-lg font-semibold">Password</h2>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Current Password
                </label>
                <input
                  type="password"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  New Password
                </label>
                <input
                  type="password"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Confirm New Password
                </label>
                <input
                  type="password"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>
          </div>
        )}

        {/* Profile Tab */}
        {activeTab === "profile" && (
          <div className="p-6 space-y-6">
            <div className="flex items-center">
              <FiUser className="text-blue-500 mr-3 text-lg" />
              <h2 className="text-lg font-semibold">Profile Information</h2>
            </div>

            <div className="space-y-4">
              <div className="flex items-center space-x-4">
                <div className="w-16 h-16 rounded-full bg-gray-200 flex items-center justify-center">
                  <FiUser className="text-gray-500 text-xl" />
                </div>
                <div>
                  <button className="px-3 py-1 bg-gray-100 hover:bg-gray-200 rounded-md text-sm font-medium">
                    Change Photo
                  </button>
                  <p className="text-xs text-gray-500 mt-1">
                    JPG, GIF or PNG. Max size 2MB
                  </p>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Display Name
                </label>
                <input
                  type="text"
                  defaultValue="John Doe"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Bio
                </label>
                <textarea
                  rows={3}
                  defaultValue="Product designer, photographer, and tech enthusiast."
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>
          </div>
        )}

        {/* Email Notifications Tab */}
        {activeTab === "email" && (
          <div className="p-6 space-y-6">
            <div className="flex items-center">
              <FiMail className="text-blue-500 mr-3 text-lg" />
              <h2 className="text-lg font-semibold">Email Notifications</h2>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-medium text-gray-700">
                    Account activity
                  </h3>
                  <p className="text-xs text-gray-500">
                    Important notifications about your account
                  </p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    className="sr-only peer"
                    defaultChecked
                  />
                  <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-600"></div>
                </label>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-medium text-gray-700">
                    Promotional emails
                  </h3>
                  <p className="text-xs text-gray-500">
                    Updates about new features and offers
                  </p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" className="sr-only peer" />
                  <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-600"></div>
                </label>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
