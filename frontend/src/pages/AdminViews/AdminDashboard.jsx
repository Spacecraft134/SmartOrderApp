import { useState } from "react";
import { Link } from "react-router-dom";
import {
  FiActivity,
  FiUsers,
  FiDollarSign,
  FiCoffee,
  FiPieChart,
  FiTrendingUp,
  FiClock,
  FiShoppingBag,
  FiAlertTriangle,
  FiThumbsUp,
  FiThumbsDown,
  FiBarChart2,
  FiTarget,
  FiBell,
  FiPlus,
  FiUpload,
} from "react-icons/fi";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  PointElement,
  LineElement,
} from "chart.js";
import { Bar, Pie, Line } from "react-chartjs-2";

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  PointElement,
  LineElement
);

export function AdminDashboard() {
  // Stats Data
  const stats = [
    {
      title: "Today's Revenue",
      value: "$2,450",
      change: "+12%",
      icon: <FiDollarSign size={24} />,
      trend: "up",
    },
    {
      title: "Active Orders",
      value: "18",
      change: "+5%",
      icon: <FiShoppingBag size={24} />,
      trend: "up",
    },
    {
      title: "Avg. Order Value",
      value: "$45.60",
      change: "+8%",
      icon: <FiTrendingUp size={24} />,
      trend: "up",
    },
    {
      title: "Preparation Time",
      value: "23 min",
      change: "-2 min",
      icon: <FiClock size={24} />,
      trend: "down",
    },
  ];

  // Sales Chart Data
  const salesData = {
    labels: ["6AM", "9AM", "12PM", "3PM", "6PM", "9PM"],
    datasets: [
      {
        label: "Today",
        data: [1200, 1900, 3200, 2800, 4200, 3100],
        backgroundColor: "rgba(99, 102, 241, 0.8)",
      },
      {
        label: "Yesterday",
        data: [900, 1500, 2800, 2400, 3800, 2700],
        backgroundColor: "rgba(200, 200, 200, 0.5)",
      },
    ],
  };

  // Popular Categories Data
  const categoriesData = {
    labels: ["Main Courses", "Appetizers", "Drinks", "Desserts"],
    datasets: [
      {
        data: [45, 25, 20, 10],
        backgroundColor: [
          "rgba(99, 102, 241, 0.8)",
          "rgba(167, 139, 250, 0.8)",
          "rgba(59, 130, 246, 0.8)",
          "rgba(16, 185, 129, 0.8)",
        ],
        borderWidth: 0,
      },
    ],
  };

  // Recent Orders Data
  const recentOrders = [
    {
      id: "#1234",
      items: "Butter Chicken, Naan",
      amount: "$24.50",
      status: "delivered",
      time: "12 min ago",
    },
    {
      id: "#1235",
      items: "Margherita Pizza",
      amount: "$18.75",
      status: "preparing",
      time: "18 min ago",
    },
    {
      id: "#1236",
      items: "Chicken Wings, Fries",
      amount: "$16.90",
      status: "pending",
      time: "25 min ago",
    },
    {
      id: "#1237",
      items: "Steak, Mashed Potatoes",
      amount: "$32.20",
      status: "delivered",
      time: "42 min ago",
    },
  ];

  // Top Selling Items
  const topItems = [
    { name: "Butter Chicken", orders: 28, revenue: "$684.50" },
    { name: "Margherita Pizza", orders: 22, revenue: "$412.50" },
    { name: "Garlic Naan", orders: 19, revenue: "$95.00" },
    { name: "Chicken Tikka", orders: 17, revenue: "$425.00" },
  ];

  // NEW FEATURE 1: Dynamic "Busy Hours" Predictor
  const busyHoursData = {
    labels: ["11AM", "1PM", "3PM", "5PM", "7PM", "9PM"],
    datasets: [
      {
        label: "Predicted",
        data: [35, 60, 40, 85, 95, 70],
        borderColor: "rgba(99, 102, 241, 1)",
        backgroundColor: "rgba(99, 102, 241, 0.2)",
        tension: 0.4,
        fill: true,
      },
      {
        label: "Actual",
        data: [30, 65, 45, 80, 90, 65],
        borderColor: "rgba(16, 185, 129, 1)",
        backgroundColor: "rgba(16, 185, 129, 0.2)",
        tension: 0.4,
      },
    ],
  };

  // NEW FEATURE 2: Menu Item "Alive or Dead?"
  const menuItems = [
    { name: "Butter Chicken", orders: 28, margin: 45, trend: "up" },
    { name: "Margherita Pizza", orders: 22, margin: 38, trend: "up" },
    { name: "Lobster Bisque", orders: 5, margin: -8, trend: "down" },
    { name: "Garlic Naan", orders: 19, margin: 42, trend: "up" },
    { name: "Truffle Fries", orders: 8, margin: 5, trend: "down" },
  ];

  // NEW FEATURE 3: Competitor Price Comparison
  const competitorPrices = [
    { item: "Margherita Pizza", yourPrice: 14.5, avgCompetitor: 12.8 },
    { item: "Butter Chicken", yourPrice: 16.9, avgCompetitor: 15.2 },
    { item: "Garlic Naan", yourPrice: 3.5, avgCompetitor: 2.9 },
    { item: "Chicken Wings", yourPrice: 11.5, avgCompetitor: 10.8 },
  ];

  // NEW FEATURE 4: "What If?" Profit Simulator
  const [priceAdjustment, setPriceAdjustment] = useState(0);
  const [volumeImpact, setVolumeImpact] = useState(0);

  const calculateProfitImpact = () => {
    const baseProfit = 2450;
    const adjustedProfit =
      baseProfit * (1 + priceAdjustment / 100) * (1 - volumeImpact / 100);
    return adjustedProfit.toFixed(2);
  };

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">
            Dashboard Overview
          </h1>
          <p className="text-gray-500">
            Welcome back! Here's what's happening today.
          </p>
        </div>
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <span className="text-sm text-gray-500">Today:</span>
            <span className="font-medium">June 15, 2023</span>
          </div>
          <button className="p-2 rounded-full bg-gray-100 hover:bg-gray-200 relative">
            <FiBell size={20} />
            <span className="absolute top-0 right-0 w-2 h-2 bg-red-500 rounded-full"></span>
          </button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
        {stats.map((stat, index) => (
          <div
            key={index}
            className="bg-white rounded-xl shadow-sm p-5 hover:shadow-md transition-all duration-200"
          >
            <div className="flex justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">
                  {stat.title}
                </p>
                <h3 className="text-2xl font-bold mt-1">{stat.value}</h3>
              </div>
              <div
                className={`p-3 rounded-full ${
                  stat.trend === "up"
                    ? "bg-green-100 text-green-600"
                    : "bg-blue-100 text-blue-600"
                }`}
              >
                {stat.icon}
              </div>
            </div>
            <div
              className={`mt-4 flex items-center text-sm ${
                stat.change.startsWith("+") ? "text-green-500" : "text-blue-500"
              }`}
            >
              <span>{stat.change}</span>
              <span className="ml-1">vs yesterday</span>
            </div>
          </div>
        ))}
      </div>

      {/* NEW: Quick Actions */}
      <div className="flex space-x-3">
        <button className="flex items-center px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700">
          <FiPlus size={18} className="mr-2" />
          Add Menu Item
        </button>
        <button className="flex items-center px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">
          <FiUpload size={18} className="mr-2" />
          Export Reports
        </button>
      </div>

      {/* Predictive Analytics Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Busy Hours Predictor */}
        <div className="bg-white rounded-xl shadow-sm p-5">
          <h2 className="text-lg font-semibold mb-4 flex items-center">
            <FiClock className="mr-2" /> Busy Hours Predictor
          </h2>
          <div className="h-64">
            <Line
              data={busyHoursData}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                  legend: { position: "top" },
                  tooltip: {
                    callbacks: {
                      label: (context) =>
                        `${context.dataset.label}: ${context.raw} orders`,
                    },
                  },
                },
                scales: {
                  y: {
                    beginAtZero: true,
                    title: { display: true, text: "Orders" },
                    grid: { color: "rgba(0, 0, 0, 0.05)" },
                  },
                  x: {
                    grid: { display: false },
                  },
                },
              }}
            />
          </div>
        </div>

        {/* Menu Item "Alive or Dead?" */}
        <div className="bg-white rounded-xl shadow-sm p-5">
          <h2 className="text-lg font-semibold mb-4 flex items-center">
            <FiThumbsUp className="mr-2" /> Menu Item Health
          </h2>
          <div className="space-y-3">
            {menuItems.map((item, index) => (
              <div
                key={index}
                className="flex items-center justify-between p-3 hover:bg-gray-50 rounded-lg"
              >
                <div className="flex items-center">
                  {item.margin > 20 ? (
                    <FiThumbsUp className="text-green-500 mr-3" />
                  ) : (
                    <FiThumbsDown className="text-red-500 mr-3" />
                  )}
                  <div>
                    <p className="font-medium">{item.name}</p>
                    <p className="text-sm text-gray-500">
                      {item.orders} orders
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p
                    className={`font-medium ${
                      item.margin > 0 ? "text-green-600" : "text-red-600"
                    }`}
                  >
                    {item.margin}% margin
                  </p>
                  {item.margin < 10 && (
                    <button className="text-xs text-red-600 mt-1 hover:underline">
                      Remove?
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Competitive Analysis */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Competitor Price Comparison */}
        <div className="bg-white rounded-xl shadow-sm p-5">
          <h2 className="text-lg font-semibold mb-4 flex items-center">
            <FiBarChart2 className="mr-2" /> Competitor Price Comparison
          </h2>
          <div className="space-y-4">
            {competitorPrices.map((item, index) => {
              const diff = (
                ((item.yourPrice - item.avgCompetitor) / item.avgCompetitor) *
                100
              ).toFixed(1);
              return (
                <div key={index} className="flex justify-between items-center">
                  <div className="w-1/3">
                    <p className="font-medium truncate">{item.item}</p>
                  </div>
                  <div className="w-1/3 text-center">
                    <p className="text-sm">${item.yourPrice.toFixed(2)}</p>
                  </div>
                  <div className="w-1/3 text-right">
                    <p
                      className={`text-sm ${
                        diff > 0 ? "text-red-500" : "text-green-500"
                      }`}
                    >
                      {diff > 0 ? `+${diff}%` : `${diff}%`} vs market
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
          <div className="mt-4 p-3 bg-yellow-50 rounded-lg">
            <p className="text-sm text-yellow-800">
              <span className="font-medium">Insight:</span> Your Margherita
              Pizza is 13% above market average
            </p>
          </div>
        </div>

        {/* "What If?" Profit Simulator */}
        <div className="bg-white rounded-xl shadow-sm p-5">
          <h2 className="text-lg font-semibold mb-4 flex items-center">
            <FiTarget className="mr-2" /> Profit Simulator
          </h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Price Adjustment: {priceAdjustment}%
              </label>
              <input
                type="range"
                min="-20"
                max="20"
                value={priceAdjustment}
                onChange={(e) => setPriceAdjustment(parseInt(e.target.value))}
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Volume Impact: {volumeImpact}%
              </label>
              <input
                type="range"
                min="0"
                max="30"
                value={volumeImpact}
                onChange={(e) => setVolumeImpact(parseInt(e.target.value))}
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
              />
            </div>
            <div className="p-4 bg-gray-50 rounded-lg">
              <h3 className="font-medium">Projected Profit Impact</h3>
              <p
                className={`text-2xl mt-2 ${
                  calculateProfitImpact() > 2450
                    ? "text-green-600"
                    : "text-red-600"
                }`}
              >
                ${calculateProfitImpact()} (
                {(((calculateProfitImpact() - 2450) / 2450) * 100).toFixed(1)}%)
              </p>
              <p className="text-sm text-gray-500 mt-1">
                Current daily profit: $2,450
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Sales Chart */}
        <div className="lg:col-span-2 bg-white rounded-xl shadow-sm p-5">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold">Hourly Sales Performance</h2>
            <select className="border border-gray-200 rounded-md px-2 py-1 text-sm bg-gray-50">
              <option>Today</option>
              <option>This Week</option>
              <option>This Month</option>
            </select>
          </div>
          <div className="h-72">
            <Bar
              data={salesData}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                  legend: {
                    position: "top",
                  },
                },
                scales: {
                  y: {
                    beginAtZero: true,
                    grid: {
                      color: "rgba(0, 0, 0, 0.05)",
                    },
                  },
                  x: {
                    grid: {
                      display: false,
                    },
                  },
                },
              }}
            />
          </div>
        </div>

        {/* Categories Chart */}
        <div className="bg-white rounded-xl shadow-sm p-5">
          <h2 className="text-lg font-semibold mb-4">Sales by Category</h2>
          <div className="h-72">
            <Pie
              data={categoriesData}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                  legend: {
                    position: "right",
                  },
                },
              }}
            />
          </div>
        </div>
      </div>

      {/* Bottom Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Recent Orders */}
        <div className="bg-white rounded-xl shadow-sm p-5">
          <h2 className="text-lg font-semibold mb-4">Recent Orders</h2>
          <div className="space-y-4">
            {recentOrders.map((order) => (
              <div
                key={order.id}
                className="flex justify-between items-center p-3 hover:bg-gray-50 rounded-lg border-b border-gray-100 last:border-0"
              >
                <div>
                  <p className="font-medium">{order.id}</p>
                  <p className="text-sm text-gray-500">{order.items}</p>
                </div>
                <div className="text-right">
                  <p className="font-medium">{order.amount}</p>
                  <div className="flex items-center justify-end space-x-2 mt-1">
                    <span
                      className={`text-xs px-2 py-1 rounded-full ${
                        order.status === "delivered"
                          ? "bg-green-100 text-green-800"
                          : order.status === "preparing"
                          ? "bg-yellow-100 text-yellow-800"
                          : "bg-gray-100 text-gray-800"
                      }`}
                    >
                      {order.status}
                    </span>
                    <span className="text-xs text-gray-400">{order.time}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Top Selling Items */}
        <div className="bg-white rounded-xl shadow-sm p-5">
          <h2 className="text-lg font-semibold mb-4">Top Selling Items</h2>
          <div className="space-y-4">
            {topItems.map((item, index) => (
              <div
                key={index}
                className="flex items-center p-3 hover:bg-gray-50 rounded-lg"
              >
                <div className="w-10 h-10 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center mr-4 font-medium">
                  {index + 1}
                </div>
                <div className="flex-1">
                  <p className="font-medium">{item.name}</p>
                  <p className="text-sm text-gray-500">{item.orders} orders</p>
                </div>
                <div className="text-right">
                  <p className="font-medium">{item.revenue}</p>
                  <p className="text-xs text-green-500 mt-1">
                    +12% from last week
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Activity Timeline */}
      <div className="bg-white rounded-xl shadow-sm p-5">
        <h2 className="text-lg font-semibold mb-4">Recent Activity</h2>
        <div className="space-y-4">
          {[
            {
              time: "10:42 AM",
              action: "New order #1245 placed",
              user: "John D.",
            },
            { time: "9:30 AM", action: "Menu item updated", user: "You" },
            {
              time: "8:15 AM",
              action: "New customer registered",
              user: "Sarah M.",
            },
            { time: "Yesterday", action: "Special offer created", user: "You" },
          ].map((activity, index) => (
            <div key={index} className="flex items-start">
              <div className="p-1.5 rounded-full bg-blue-100 text-blue-600 mr-4 mt-1">
                <FiActivity size={14} />
              </div>
              <div className="flex-1">
                <p className="font-medium">{activity.action}</p>
                <div className="flex items-center text-sm text-gray-500 mt-1">
                  <span>{activity.time}</span>
                  <span className="mx-2">•</span>
                  <span>{activity.user}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
