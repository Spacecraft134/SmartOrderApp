import { useEffect, useState } from "react";
import { Bar, Pie, Line } from "react-chartjs-2";
import axios from "axios";
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
import { useLocation } from "react-router-dom";
import api from "../Utils/api";
import { useAuth } from "../Context/AuthContext";

export function AdminDashboard() {
  const [statsData, setStatsData] = useState(null);
  const [busyHour, setBusyHours] = useState(null);
  const [topItems, setTopItems] = useState([]);
  const [salesData, setSalesData] = useState(null);
  const [categorySales, setCategorySales] = useState({ labels: [], data: [] });
  const [timeRange, setTimeRange] = useState("today");

  const [openCustomer, setOpenCustomer] = useState(false);
  const [openWaiter, setOpenWaiter] = useState(false);
  const [openKitchen, setOpenKitchen] = useState(false);

  const [openThankYou, setOpenThankYou] = useState(false);

  const location = useLocation();
  const adminName = location.state?.name || "Admin";
  const { user } = useAuth();
  useEffect(() => {
    if (!user) return;
    const fetchData = async () => {
      try {
        const today = new Date().toLocaleDateString("en-CA");

        // Use Promise.all for parallel requests
        const [dailyRes, busyRes, topRes, categoryRes] = await Promise.all([
          api.get(`/api/orders/daily/${today}`),
          api.get(`/api/orders/busy-hours/${today}`),
          api.get(`/api/orders/top-items/${today}`),
          api.get(`/api/orders/category-sales/${today}`),
        ]);

        setStatsData(dailyRes.data);
        setBusyHours(busyRes.data);
        setTopItems(topRes.data.slice(0, 6));

        const rawData = categoryRes.data;
        setCategorySales({
          labels: Object.keys(rawData),
          data: Object.values(rawData),
        });
      } catch (error) {
        console.error("Failed to fetch data:", error);
        // Handle unauthorized (403) errors
        if (error.response?.status === 403) {
          localStorage.removeItem("jwtToken");
          window.location.href = "/login";
        }
      }
    };

    fetchData();
  }, [user]);

  useEffect(() => {
    const fetchSalesData = async () => {
      try {
        const today = new Date();
        const todayStr = today.toLocaleDateString("en-CA");

        let response;
        if (timeRange === "today") {
          response = await api.get(`/api/orders/sales-performance/${todayStr}`);
        } else if (timeRange === "week") {
          response = await api.get(`/api/orders/weekly-sales-performance`);
        } else if (timeRange === "month") {
          const year = today.getFullYear();
          const month = today.getMonth() + 1;
          response = await api.get(
            `/api/orders/monthly-sales-performance/${year}/${month}`
          );
        }
        setSalesData(response.data);
      } catch (error) {
        console.error("Failed to fetch sales data:", error);
        if (error.response?.status === 403) {
          localStorage.removeItem("jwtToken");
          window.location.href = "/login";
        }
      }
    };

    fetchSalesData();
  }, [timeRange]);

  if (!statsData || !busyHour || !salesData)
    return <div className="p-6">Loading...</div>;

  const stats = [
    {
      title: "Today's Revenue",
      value: `$${statsData.todaysRevenue}`,
      icon: <FiDollarSign size={24} />,
    },
    {
      title: "Total Orders",
      value: `${statsData.totalOrders}`,
      icon: <FiShoppingBag size={24} />,
    },
    {
      title: "Avg. Order Value",
      value: `${statsData.avgOrderValue}`,
      icon: <FiTrendingUp size={24} />,
    },
    {
      title: "Preparation Time",
      value: `${statsData.avgPreparationTime} min`,
      icon: <FiClock size={24} />,
    },
  ];

  // Build sales performance chart data dynamically
  let chartData = { labels: [], datasets: [] };
  if (timeRange === "today") {
    chartData = {
      labels: salesData.labels,
      datasets: [
        {
          label: "Today",
          data: salesData.today,
          backgroundColor: "rgba(99,102,241,0.8)",
        },
        {
          label: "Yesterday",
          data: salesData.yesterday,
          backgroundColor: "rgba(200,200,200,0.5)",
        },
      ],
    };
  } else if (timeRange === "week") {
    chartData = {
      labels: salesData.labels,
      datasets: [
        {
          label: "This Week",
          data: salesData.thisWeek,
          backgroundColor: "rgba(99,102,241,0.8)",
        },
        {
          label: "Last Week",
          data: salesData.lastWeek,
          backgroundColor: "rgba(200,200,200,0.5)",
        },
      ],
    };
  } else if (timeRange === "month") {
    chartData = {
      labels: salesData.labels,
      datasets: [
        {
          label: "Current Month",
          data: salesData.currentMonth,
          backgroundColor: "rgba(99,102,241,0.8)",
        },
        {
          label: "Last Month",
          data: salesData.lastMonth,
          backgroundColor: "rgba(200,200,200,0.5)",
        },
      ],
    };
  }

  const categoriesData = {
    labels: categorySales.labels.length
      ? categorySales.labels
      : ["Main Courses", "Appetizers", "Drinks", "Desserts"],
    datasets: [
      {
        data: categorySales.data.length ? categorySales.data : [45, 25, 20, 10],
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
    // Prepare data for export
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
      csvContent += `Today's Revenue,$${statsData.todaysRevenue}\n`;
      csvContent += `Total Orders,${statsData.totalOrders}\n`;
      csvContent += `Avg. Order Value,$${statsData.avgOrderValue}\n`;
      csvContent += `Avg. Preparation Time,${statsData.avgPreparationTime} min\n\n`;

      csvContent += "BUSY HOURS\n";
      csvContent += "Hour,Predicted Orders,Actual Orders\n";
      busyHour.labels.forEach((hour, index) => {
        csvContent += `${hour},${busyHour.predicted[index]},${busyHour.actual[index]}\n`;
      });
      csvContent += "\n";

      csvContent += "TOP SELLING ITEMS\n";
      csvContent += "Rank,Name,Orders,Revenue\n";
      topItems.forEach((item, index) => {
        csvContent += `${index + 1},${item.name},${item.orders},$${
          item.revenue
        }\n`;
      });
      csvContent += "\n";

      csvContent += `SALES PERFORMANCE (${timeRange})\n`;
      csvContent += "Period,Current,Previous\n";
      salesData.labels.forEach((label, index) => {
        const current =
          timeRange === "today"
            ? salesData.today[index]
            : timeRange === "week"
            ? salesData.thisWeek[index]
            : salesData.currentMonth[index];

        const previous =
          timeRange === "today"
            ? salesData.yesterday[index]
            : timeRange === "week"
            ? salesData.lastWeek[index]
            : salesData.lastMonth[index];

        csvContent += `${label},${current},${previous}\n`;
      });
      csvContent += "\n";

      csvContent += "SALES BY CATEGORY\n";
      csvContent += "Category,Percentage\n";
      categorySales.labels.forEach((label, index) => {
        csvContent += `${label},${categorySales.data[index]}%\n`;
      });

      filename = `dashboard-export-${
        new Date().toISOString().split("T")[0]
      }.csv`;
      mimeType = "text/csv;charset=utf-8";
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
        </div>

        <div className="bg-white p-5 rounded-xl shadow-sm">
          <h2 className="text-lg font-semibold mb-4">Top Selling Items</h2>
          {topItems.map((item, index) => (
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
          ))}
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
          <Bar data={chartData} />
        </div>

        <div className="bg-white p-5 rounded-xl shadow-sm">
          <h2 className="text-lg font-semibold mb-4">Sales by Category</h2>
          <Pie data={categoriesData} />
        </div>
      </div>
    </div>
  );
}
