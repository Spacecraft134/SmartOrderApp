import { useNavigate, useLocation } from "react-router-dom";
import { motion } from "framer-motion";

const ErrorPage = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const errorMessage = location.state?.error || "Unauthorized access";
  const returnPath = location.state?.returnPath || "/login";

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#0a0e27] to-[#0a1129] text-white flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md text-center"
      >
        <div className="bg-gradient-to-b from-gray-900/80 to-gray-900 backdrop-blur-xl rounded-2xl p-8 border border-white/10 shadow-2xl">
          <h1 className="text-3xl font-bold mb-4">Access Denied</h1>

          <div className="mb-6 p-3 bg-red-500/20 text-red-300 rounded-lg">
            {errorMessage}
          </div>

          <p className="text-gray-300 mb-6">
            You don't have permission to access this resource.
          </p>

          <button
            onClick={() => navigate(returnPath, { replace: true })}
            className="w-full py-3 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-500 font-medium mb-4"
          >
            Return to Login
          </button>

          <button
            onClick={() => navigate("/", { replace: true })}
            className="w-full py-3 rounded-xl bg-gray-700 font-medium"
          >
            Go to Home Page
          </button>
        </div>
      </motion.div>
    </div>
  );
};

export default ErrorPage;
