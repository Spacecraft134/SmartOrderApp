import { Link, Outlet } from "react-router-dom";

export function AdminLayout() {
  return (
    <div className="flex min-h-screen bg-gray-100">
      <aside className="w-64 bg-blue-900 text-white flex flex-col">
        <div className="p-6 font-bold text-xl border-b border-blue-700">
          Admin Panel
        </div>
        <nav className="flex-1 p-4 space-y-4">
          <Link to="/admin" className="block hover:bg-blue-800 p-2 rounded">
            Dashboard
          </Link>
          <Link
            to="/admin/menu"
            className="block hover:bg-blue-800 p-2 rounded"
          >
            Menu Manager
          </Link>
          <Link
            to="/admin/QRCode"
            className="block hover:bg-blue-800 p-2 rounded"
          >
            QR Code Generator
          </Link>
          <Link
            to="/admin/poster"
            className="block hover:bg-blue-800 p-2 rounded"
          >
            Poster Editor
          </Link>
          <Link
            to="/admin/upsell"
            className="block hover:bg-blue-800 p-2 rounded"
          >
            Upsell Setting
          </Link>
        </nav>
      </aside>

      <main className="flex-1 p-8">
        <Outlet />
      </main>
    </div>
  );
}
