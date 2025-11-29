// hoc/withSubscription.js
import { useContext } from "react";
import { AuthContext } from "../context/AuthContext";
import { FaSpinner } from "react-icons/fa";
import { motion } from "framer-motion";

/**
 * HOC to enforce subscription-based access to features.
 *
 * @param {React.Component} WrappedComponent - The component to wrap.
 * @param {string} featureKey - The key in the plan that unlocks this feature (e.g. "enable_chat").
 */
function withSubscription(WrappedComponent, featureKey) {
  return function SubscriptionGuard(props) {
    const { authDetails, isLoading } = useContext(AuthContext);
    const plan = authDetails?.plan;

    if (isLoading) {
      return (
        <div className="flex flex-col items-center justify-center h-screen bg-gray-900 text-green-400">
          <FaSpinner size={34} className="animate-spin" />
          <p className="mt-4 text-lg font-semibold tracking-wide">
            Checking clearance…
          </p>
        </div>
      );
    }

    // 2. No active plan
    if (!plan || plan?.status !== "active") {
      return (
        <div className="min-h-[50vh] flex items-center justify-center bg-gray-900 text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="max-w-md w-full bg-gray-800 rounded-2xl shadow-xl p-8 border border-green-500/40"
          >
            <h3 className="text-3xl font-extrabold text-green-400 mb-4">
              Access Restricted
            </h3>
            <p className="text-gray-300 mb-6">
              This module requires an active subscription. Secure your access to
              continue.
            </p>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="w-full py-3 rounded-xl bg-green-500 text-white font-semibold shadow-md hover:bg-green-600 transition"
            >
              View Subscription Plans
            </motion.button>
          </motion.div>
        </div>
      );
    }

    // 3. Feature access check
    const featureValue = plan?.[featureKey];
    const hasPermission =
      featureValue === "yes" ||
      (typeof featureValue === "number" && featureValue > 0);

    if (hasPermission) {
      return <WrappedComponent {...props} />;
    }

    // 4. Plan exists but feature not included
    return (
      <div className="min-h-[50vh] flex items-center justify-center bg-gray-900 text-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
          className="max-w-md w-full bg-gray-800 rounded-2xl shadow-lg p-8 border"
          style={{ borderColor: "#facc15" }} // amber-like hex border
        >
          <h3
            className="text-3xl font-bold mb-4"
            style={{ color: "#facc15" }} // amber text
          >
            Upgrade Required
          </h3>
          <p className="text-gray-300 mb-6">
            Your current plan{" "}
            <span className="font-semibold text-white">{plan?.name}</span> does
            not include access to{" "}
            <span className="font-semibold" style={{ color: "#fde047" }}>
              {featureKey.replace("enable_", "").toUpperCase()}
            </span>
            . Upgrade to unlock this feature.
          </p>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="w-full py-3 rounded-xl font-bold shadow-md transition"
            style={{
              backgroundColor: "#facc15",
              color: "#111827",
            }}
          >
            Upgrade Plan
          </motion.button>
        </motion.div>
      </div>
    );
  };
}

export default withSubscription;
