import { useEffect, useState } from "react";
import { Bar, Pie, Line } from "react-chartjs-2";
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
import {
  FiBell,
  FiClock,
  FiShoppingBag,
  FiDollarSign,
  FiTrendingUp,
  FiUpload,
} from "react-icons/fi";
import { saveAs } from "file-saver";

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

import { Dialog, DialogTitle, DialogContent, IconButton } from "@mui/material";
import { Close } from "@mui/icons-material";

import { CustomerOrder } from "../CustomerViews/CustomerOrder";
import { WaiterDashboard } from "../WaiterDashboard";
import { KitchenDashboard } from "../KitchenDashboard";
import EditableThankYou from "../AdminViews/EditableThankYou";
import api from "../Utils/api";
import { useAuth } from "../Context/AuthContext";

export function AdminDashboard() {
  const { user } = useAuth();
  const [loading, setLoading] = useState({
    stats: true,
    sales: true,
    categories: true,
  });
  const [statsData, setStatsData] = useState(null);
  const [busyHour, setBusyHours] = useState(null);
  const [topItems, setTopItems] = useState([]);
  const [salesData, setSalesData] = useState(null);
  const [categorySales, setCategorySales] = useState({ labels: [], data: [] });
  const [timeRange, setTimeRange] = useState("today");
  const [error, setError] = useState(null);

  // Modal states
  const [openCustomer, setOpenCustomer] = useState(false);
  const [openWaiter, setOpenWaiter] = useState(false);
  const [openKitchen, setOpenKitchen] = useState(false);
  const [openThankYou, setOpenThankYou] = useState(false);

  const [adminName, setAdminName] = useState("Admin");

  useEffect(() => {
    const token = localStorage.getItem("token");
    const userData = JSON.parse(localStorage.getItem("userData"));

    if (!token || !userData) {
      window.location.href = "/login";
      return;
    }

    const fetchInitialData = async () => {
      try {
        const userName = user?.name || "Admin";
        setAdminName(userName);
        const today = new Date().toLocaleDateString("en-CA");

        // First check if token exists
        const token = localStorage.getItem("token");
        if (!token) {
          setError("Session expired. Please login again.");
          window.location.href = "/login";
          return;
        }

        // Use Promise.all for parallel requests
        const [dailyRes, busyRes, topRes, categoryRes] = await Promise.all([
          api.get(`/api/orders/daily/${today}`),
          api.get(`/api/orders/busy-hours/${today}`),
          api.get(`/api/orders/top-items/${today}`),
          api.get(`/api/orders/category-sales/${today}`),
        ]);

        // Handle responses
        setStatsData({
          todaysRevenue: dailyRes.data?.todaysRevenue || 0,
          totalOrders: dailyRes.data?.totalOrders || 0,
          avgOrderValue: dailyRes.data?.avgOrderValue || 0,
          avgPreparationTime: dailyRes.data?.avgPreparationTime || 0,
        });

        setBusyHours({
          labels: busyRes.data?.labels || [],
          predicted: busyRes.data?.predicted || [],
          actual: busyRes.data?.actual || [],
        });

        setTopItems(topRes.data?.slice(0, 6) || []);

        setCategorySales({
          labels: categoryRes.data ? Object.keys(categoryRes.data) : [],
          data: categoryRes.data ? Object.values(categoryRes.data) : [],
        });

        setError(null);
      } catch (error) {
        console.error("Initial data fetch error:", error);
        if (error.response?.status === 403 || error.response?.status === 401) {
          setError("Session expired. Please login again.");
          localStorage.removeItem("token");
          window.location.href = "/login";
        } else {
          setError("Failed to load dashboard data. Please try again later.");
        }
      } finally {
        setLoading((prev) => ({ ...prev, stats: false, categories: false }));
      }
    };

    fetchInitialData();
  }, [user]);

  useEffect(() => {
    const fetchSalesData = async () => {
      try {
        setLoading((prev) => ({ ...prev, sales: true }));
        const today = new Date();
        let response;

        try {
          if (timeRange === "today") {
            const todayStr = today.toLocaleDateString("en-CA");
            response = await api
              .get(`/api/orders/sales-performance/${todayStr}`)
              .catch(() => null);
          } else if (timeRange === "week") {
            response = await api
              .get(`/api/orders/weekly-sales-performance`)
              .catch(() => null);
          } else if (timeRange === "month") {
            response = await api
              .get(
                `/api/orders/monthly-sales-performance/${today.getFullYear()}/${
                  today.getMonth() + 1
                }`
              )
              .catch(() => null);
          }

          setSalesData(
            response?.data || {
              labels: [],
              today: [],
              yesterday: [],
              thisWeek: [],
              lastWeek: [],
              currentMonth: [],
              lastMonth: [],
            }
          );
          setError(null);
        } catch (error) {
          console.error("Sales data fetch error:", error);
          setSalesData({
            labels: [],
            today: [],
            yesterday: [],
            thisWeek: [],
            lastWeek: [],
            currentMonth: [],
            lastMonth: [],
          });
        }
      } finally {
        setLoading((prev) => ({ ...prev, sales: false }));
      }
    };

    fetchSalesData();
  }, [timeRange]);

  if (error) {
    return (
      <div className="p-6">
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative">
          {error}
        </div>
      </div>
    );
  }

  if (loading.stats || loading.sales || loading.categories) {
    return <div className="p-6">Loading dashboard data...</div>;
  }

  const stats = [
    {
      title: "Today's Revenue",
      value: `$${statsData?.todaysRevenue || 0}`,
      icon: <FiDollarSign size={24} />,
    },
    {
      title: "Total Orders",
      value: `${statsData?.totalOrders || 0}`,
      icon: <FiShoppingBag size={24} />,
    },
    {
      title: "Avg. Order Value",
      value: `$${statsData?.avgOrderValue || 0}`,
      icon: <FiTrendingUp size={24} />,
    },
    {
      title: "Preparation Time",
      value: `${statsData?.avgPreparationTime || 0} min`,
      icon: <FiClock size={24} />,
    },
  ];

  // Build sales performance chart data dynamically
  let chartData = { labels: [], datasets: [] };
  if (salesData) {
    if (timeRange === "today") {
      chartData = {
        labels: salesData.labels || [],
        datasets: [
          {
            label: "Today",
            data: salesData.today || [],
            backgroundColor: "rgba(99,102,241,0.8)",
          },
          {
            label: "Yesterday",
            data: salesData.yesterday || [],
            backgroundColor: "rgba(200,200,200,0.5)",
          },
        ],
      };
    } else if (timeRange === "week") {
      chartData = {
        labels: salesData.labels || [],
        datasets: [
          {
            label: "This Week",
            data: salesData.thisWeek || [],
            backgroundColor: "rgba(99,102,241,0.8)",
          },
          {
            label: "Last Week",
            data: salesData.lastWeek || [],
            backgroundColor: "rgba(200,200,200,0.5)",
          },
        ],
      };
    } else if (timeRange === "month") {
      chartData = {
        labels: salesData.labels || [],
        datasets: [
          {
            label: "Current Month",
            data: salesData.currentMonth || [],
            backgroundColor: "rgba(99,102,241,0.8)",
          },
          {
            label: "Last Month",
            data: salesData.lastMonth || [],
            backgroundColor: "rgba(200,200,200,0.5)",
          },
        ],
      };
    }
  }

  const categoriesData = {
    labels: categorySales?.labels?.length
      ? categorySales.labels
      : ["No data available"],
    datasets: [
      {
        data: categorySales?.data?.length ? categorySales.data : [100],
        backgroundColor: [
          "rgba(99,102,241,0.8)",
          "rgba(167,139,250,0.8)",
          "rgba(59,130,246,0.8)",
          "rgba(16,185,129,0.8)",
        ],
        borderWidth: 0,
      },
    ],
  };

  const handleExport = (format) => {
    const exportData = {
      stats: statsData,
      busyHours: busyHour,
      topItems,
      salesData,
      categorySales,
      timeRange,
    };

    let content, filename, mimeType;

    if (format === "json") {
      content = JSON.stringify(exportData, null, 2);
      filename = `dashboard-export-${
        new Date().toISOString().split("T")[0]
      }.json`;
      mimeType = "application/json";
    } else if (format === "csv") {
      let csvContent = "DASHBOARD EXPORT\n\n";

      csvContent += `Generated at,${new Date().toLocaleString()}\n\n`;

      csvContent += "STATISTICS\n";
      csvContent += "Metric,Value\n";
      csvContent += `Today's Revenue,$${statsData?.todaysRevenue || 0}\n`;
      csvContent += `Total Orders,${statsData?.totalOrders || 0}\n`;
      csvContent += `Avg. Order Value,$${statsData?.avgOrderValue || 0}\n`;
      csvContent += `Avg. Preparation Time,${
        statsData?.avgPreparationTime || 0
      } min\n\n`;

      csvContent += "BUSY HOURS\n";
      csvContent += "Hour,Predicted Orders,Actual Orders\n";
      (busyHour?.labels || []).forEach((hour, index) => {
        csvContent += `${hour},${busyHour?.predicted?.[index] || 0},${
          busyHour?.actual?.[index] || 0
        }\n`;
      });
      csvContent += "\n";

      csvContent += "TOP SELLING ITEMS\n";
      csvContent += "Rank,Name,Orders,Revenue\n";
      (topItems || []).forEach((item, index) => {
        csvContent += `${index + 1},${item?.name || "N/A"},${
          item?.orders || 0
        },$${item?.revenue || 0}\n`;
      });
      csvContent += "\n";

      csvContent += `SALES PERFORMANCE (${timeRange})\n`;
      csvContent += "Period,Current,Previous\n";
      (salesData?.labels || []).forEach((label, index) => {
        const current =
          timeRange === "today"
            ? salesData?.today?.[index] || 0
            : timeRange === "week"
            ? salesData?.thisWeek?.[index] || 0
            : salesData?.currentMonth?.[index] || 0;

        const previous =
          timeRange === "today"
            ? salesData?.yesterday?.[index] || 0
            : timeRange === "week"
            ? salesData?.lastWeek?.[index] || 0
            : salesData?.lastMonth?.[index] || 0;

        csvContent += `${label},${current},${previous}\n`;
      });
      csvContent += "\n";

      csvContent += "SALES BY CATEGORY\n";
      csvContent += "Category,Percentage\n";
      (categorySales?.labels || []).forEach((label, index) => {
        csvContent += `${label},${categorySales?.data?.[index] || 0}%\n`;
      });

      filename = `dashboard-export-${
        new Date().toISOString().split("T")[0]
      }.csv`;
      mimeType = "text/csv;charset=utf-8;";
      content = csvContent;
    }

    const blob = new Blob([content], { type: mimeType });
    saveAs(blob, filename);
  };

  return (
    <div className="space-y-6 p-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Welcome, {adminName}!</h1>
          <p className="text-gray-500">Here's your dashboard overview.</p>
        </div>
        <button className="p-2 bg-gray-100 rounded-full">
          <FiBell size={20} />
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
        {stats.map((stat, index) => (
          <div key={index} className="bg-white p-5 rounded-xl shadow-sm">
            <div className="flex justify-between">
              <div>
                <p className="text-sm text-gray-500">{stat.title}</p>
                <h3 className="text-2xl font-bold mt-1">{stat.value}</h3>
              </div>
              <div className="p-3 rounded-full bg-gray-100">{stat.icon}</div>
            </div>
          </div>
        ))}
      </div>

      <div className="flex space-x-3">
        <div className="relative group">
          <button className="flex items-center px-4 py-2 border rounded-lg hover:bg-gray-50">
            <FiUpload size={18} className="mr-2" /> Export Reports
          </button>
          <div className="absolute hidden group-hover:block bg-white shadow-lg rounded-md mt-1 z-10 w-40">
            <button
              onClick={() => handleExport("json")}
              className="block w-full text-left px-4 py-2 hover:bg-gray-100 rounded-t-md"
            >
              Export as JSON
            </button>
            <button
              onClick={() => handleExport("csv")}
              className="block w-full text-left px-4 py-2 hover:bg-gray-100 rounded-b-md"
            >
              Export as CSV
            </button>
          </div>
        </div>
      </div>

      <div className="flex space-x-4 mt-8">
        <button
          onClick={() => setOpenCustomer(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center"
        >
          <span className="mr-2">👨‍💼</span> Customer View
        </button>

        <button
          onClick={() => setOpenWaiter(true)}
          className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg flex items-center"
        >
          <span className="mr-2">👨‍🍳</span> Waiter View
        </button>

        <button
          onClick={() => setOpenKitchen(true)}
          className="bg-orange-600 hover:bg-orange-700 text-white px-4 py-2 rounded-lg flex items-center"
        >
          <span className="mr-2">🍳</span> Kitchen View
        </button>

        <button
          onClick={() => setOpenThankYou(true)}
          className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg flex items-center"
        >
          <span className="mr-2">🙏</span> Thank You Page
        </button>
      </div>

      <Dialog
        open={openCustomer}
        onClose={() => setOpenCustomer(false)}
        fullScreen
        PaperProps={{
          style: {
            backgroundColor: "#f8fafc",
          },
        }}
      >
        <DialogTitle className="flex justify-between items-center bg-white shadow-sm sticky top-0 z-10">
          <span className="text-xl font-semibold">
            Admin View: Customer DashBoard
          </span>
          <IconButton
            onClick={() => setOpenCustomer(false)}
            className="hover:bg-gray-100"
            size="large"
          >
            <Close className="text-gray-600" />
          </IconButton>
        </DialogTitle>
        <DialogContent className="overflow-y-auto p-0">
          <div className="h-full">
            <CustomerOrder />
          </div>
        </DialogContent>
      </Dialog>

      <Dialog
        open={openWaiter}
        onClose={() => setOpenWaiter(false)}
        fullScreen
        PaperProps={{
          style: {
            backgroundColor: "#f8fafc",
          },
        }}
      >
        <DialogTitle className="flex justify-between items-center bg-white shadow-sm sticky top-0 z-10">
          <span className="text-xl font-semibold">
            Admin View: Waiter DashBoard
          </span>
          <IconButton
            onClick={() => setOpenWaiter(false)}
            className="hover:bg-gray-100"
            size="large"
          >
            <Close className="text-gray-600" />
          </IconButton>
        </DialogTitle>
        <DialogContent className="overflow-y-auto p-0">
          <div className="h-full">
            <WaiterDashboard />
          </div>
        </DialogContent>
      </Dialog>

      <Dialog
        open={openKitchen}
        onClose={() => setOpenKitchen(false)}
        fullScreen
        PaperProps={{
          style: {
            backgroundColor: "#f8fafc",
          },
        }}
      >
        <DialogTitle className="flex justify-between items-center bg-white shadow-sm sticky top-0 z-10">
          <span className="text-xl font-semibold">
            Admin View: Kitchen DashBoard
          </span>
          <IconButton
            onClick={() => setOpenKitchen(false)}
            className="hover:bg-gray-100"
            size="large"
          >
            <Close className="text-gray-600" />
          </IconButton>
        </DialogTitle>
        <DialogContent className="overflow-y-auto p-0">
          <div className="h-full">
            <KitchenDashboard />
          </div>
        </DialogContent>
      </Dialog>

      <Dialog
        open={openThankYou}
        onClose={() => setOpenThankYou(false)}
        fullScreen
        PaperProps={{
          style: {
            backgroundColor: "#f8fafc",
          },
        }}
      >
        <DialogTitle className="flex justify-between items-center bg-white shadow-sm sticky top-0 z-10">
          <span className="text-xl font-semibold">Edit Thank You Page</span>
          <IconButton
            onClick={() => setOpenThankYou(false)}
            className="hover:bg-gray-100"
            size="large"
          >
            <Close className="text-gray-600" />
          </IconButton>
        </DialogTitle>
        <DialogContent className="overflow-y-auto p-0">
          <div className="h-full">
            <EditableThankYou />
          </div>
        </DialogContent>
      </Dialog>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <div className="bg-white p-5 rounded-xl shadow-sm">
          <h2 className="text-lg font-semibold mb-4">Busy Hours Predictor</h2>
          {busyHour?.labels?.length > 0 ? (
            <Line
              data={{
                labels: busyHour.labels,
                datasets: [
                  {
                    label: "Predicted",
                    data: busyHour.predicted,
                    borderColor: "rgba(99,102,241,1)",
                    tension: 0.4,
                  },
                  {
                    label: "Actual",
                    data: busyHour.actual,
                    borderColor: "rgba(16,185,129,1)",
                  },
                ],
              }}
            />
          ) : (
            <div className="flex flex-col items-center justify-center h-64 text-gray-500">
              <FiClock className="text-4xl mb-2" />
              <p>No busy hours data available</p>
            </div>
          )}
        </div>

        <div className="bg-white p-5 rounded-xl shadow-sm">
          <h2 className="text-lg font-semibold mb-4">Top Selling Items</h2>
          {topItems?.length > 0 ? (
            topItems.map((item, index) => (
              <div
                key={index}
                className="flex items-center p-3 hover:bg-gray-50 rounded-lg"
              >
                <div className="w-10 h-10 bg-indigo-50 text-indigo-600 flex items-center justify-center mr-4">
                  {index + 1}
                </div>
                <div className="flex-1">
                  <p className="font-medium">{item.name}</p>
                  <p className="text-sm text-gray-500">{item.orders} orders</p>
                </div>
                <div className="text-right">
                  <p className="font-medium">${item.revenue}</p>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-8 text-gray-500">
              No top items data available
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className="lg:col-span-2 bg-white p-5 rounded-xl shadow-sm">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold">Sales Performance</h2>
            <select
              value={timeRange}
              onChange={(e) => setTimeRange(e.target.value)}
              className="border rounded-md px-2 py-1 text-sm"
            >
              <option value="today">Today</option>
              <option value="week">This Week</option>
              <option value="month">This Month</option>
            </select>
          </div>
          {chartData.labels.length > 0 ? (
            <Bar data={chartData} />
          ) : (
            <div className="flex flex-col items-center justify-center h-64 text-gray-500">
              <FiTrendingUp className="text-4xl mb-2" />
              <p>No sales data available for selected period</p>
            </div>
          )}
        </div>

        <div className="bg-white p-5 rounded-xl shadow-sm">
          <h2 className="text-lg font-semibold mb-4">Sales by Category</h2>
          {categorySales?.data?.length > 0 ? (
            <Pie data={categoriesData} />
          ) : (
            <div className="flex flex-col items-center justify-center h-64 text-gray-500">
              <FiDollarSign className="text-4xl mb-2" />
              <p>No category sales data available</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
