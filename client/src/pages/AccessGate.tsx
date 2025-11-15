import { Navigate } from "react-router-dom";
import { User, Briefcase, Zap, Shield } from "lucide-react";
import type { FC } from "react";
import { useAuth } from "../context/AuthContext";
import type { UserRole } from "../types";

const AccessGate: FC = () => {
  const {
    isWalletConnected,
    userRole,
    setUserRole,
    hasAccess,
    walletAddress,
    simulateAccessGrant,
  } = useAuth();

  if (!isWalletConnected) {
    return <Navigate to="/" replace />;
  }

  if (hasAccess) {
    return <Navigate to="/profile" replace />;
  }

  // --- Section 1: Role Selection ---
  if (!userRole) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
        <h1 className="text-3xl font-bold text-gray-800 mb-6">
          Welcome! Choose Your Role
        </h1>
        <p className="text-center text-gray-600 mb-10">
          Your Wallet Address:{" "}
          <span className="font-mono text-sm text-green-600">
            {walletAddress?.slice(0, 8)}...{walletAddress?.slice(-6)}
          </span>
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 w-full max-w-4xl">
          {/* Card: User */}
          <div
            onClick={() => setUserRole("user" as UserRole)}
            className="bg-white p-8 rounded-xl shadow-2xl border-t-4 border-blue-500 hover:shadow-3xl transform hover:scale-[1.02] transition duration-300 cursor-pointer"
          >
            <User size={48} className="text-blue-500 mb-4" />
            <h2 className="text-2xl font-semibold mb-2 text-gray-900">
              User (Buyer)
            </h2>
            <p className="text-gray-600">
              I want to access the app to purchase the best offers from Agents.
            </p>
            <button className="mt-6 w-full py-2 bg-blue-500 text-white rounded-lg font-bold hover:bg-blue-600">
              Choose User
            </button>
          </div>

          {/* Card: Agent */}
          <div
            onClick={() => setUserRole("agent" as UserRole)}
            className="bg-white p-8 rounded-xl shadow-2xl border-t-4 border-green-500 hover:shadow-3xl transform hover:scale-[1.02] transition duration-300 cursor-pointer"
          >
            <Briefcase size={48} className="text-green-500 mb-4" />
            <h2 className="text-2xl font-semibold mb-2 text-gray-900">
              Agent (Offer Seller)
            </h2>
            <p className="text-gray-600">
              I want to provide the best deals I find and earn rewards.
            </p>
            <button className="mt-6 w-full py-2 bg-green-500 text-white rounded-lg font-bold hover:bg-green-600">
              Choose Agent
            </button>
          </div>
        </div>
      </div>
    );
  }

  // --- Section 2: Conditional Access (User: Subscription) ---
  if (userRole === "user") {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
        <h1 className="text-3xl font-bold text-blue-600 mb-8">
          User: Buy Subscription
        </h1>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 w-full max-w-4xl">
          {/* Option 1: Monthly */}
          <div className="bg-white p-8 rounded-xl shadow-2xl border-2 border-gray-200">
            <Zap size={32} className="text-blue-500 mb-4" />
            <h2 className="text-2xl font-semibold mb-2 text-gray-900">
              Monthly Subscription
            </h2>
            <p className="text-4xl font-extrabold text-gray-800 mb-4">
              5 SUI / month
            </p>
            <button
              onClick={() => simulateAccessGrant("user")}
              className="w-full py-3 bg-blue-600 text-white rounded-lg font-bold hover:bg-blue-700 transition"
            >
              Pay 5 SUI
            </button>
          </div>

          {/* Option 2: Annual (Recommended) */}
          <div className="bg-white p-8 rounded-xl shadow-2xl border-4 border-blue-500 relative">
            <span className="absolute top-0 right-0 bg-blue-500 text-white text-xs font-bold px-3 py-1 rounded-bl-lg">
              RECOMMENDED
            </span>
            <Shield size={32} className="text-blue-500 mb-4" />
            <h2 className="text-2xl font-semibold mb-2 text-gray-900">
              Annual Subscription
            </h2>
            <p className="text-4xl font-extrabold text-gray-800 mb-4">
              50 SUI / year
            </p>
            <button
              onClick={() => simulateAccessGrant("user")}
              className="w-full py-3 bg-blue-600 text-white rounded-lg font-bold hover:bg-blue-700 transition"
            >
              Pay 50 SUI
            </button>
          </div>
        </div>
        <button
          onClick={() => setUserRole(null)}
          className="mt-8 text-sm text-gray-500 hover:text-gray-700"
        >
          &larr; Back to Role Selection
        </button>
      </div>
    );
  }

  // --- Section 3: Conditional Access (Agent: Staking) ---
  if (userRole === "agent") {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
        <h1 className="text-3xl font-bold text-green-600 mb-8">
          Agent: Deposit SUI (Staking)
        </h1>
        <div className="bg-white p-10 rounded-xl shadow-2xl border-t-4 border-green-500 w-full max-w-md">
          <p className="text-gray-600 mb-4">
            To become an active **Agent** and post offers, you must **stake** a
            minimum amount of SUI as a good-faith guarantee.
          </p>
          <div className="my-6 p-4 bg-green-50 rounded-lg border border-green-200">
            <p className="text-lg font-semibold text-green-800">
              Minimum Staking Amount:
            </p>
            <p className="text-3xl font-extrabold text-green-600">100 SUI</p>
          </div>
          <button
            onClick={() => simulateAccessGrant("agent")}
            className="w-full py-3 bg-green-600 text-white rounded-lg font-bold hover:bg-green-700 transition"
          >
            Stake 100 SUI
          </button>
          <p className="text-xs text-gray-500 mt-4 text-center">
            This amount remains locked as long as you are an Agent.
          </p>
        </div>
        <button
          onClick={() => setUserRole(null)}
          className="mt-8 text-sm text-gray-500 hover:text-gray-700"
        >
          &larr; Back to Role Selection
        </button>
      </div>
    );
  }

  return <div className="p-10 text-center">Unknown Error.</div>;
};

export default AccessGate;
