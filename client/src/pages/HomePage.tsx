import type { FC } from "react";
import { useAuth } from "../context/AuthContext";

const HomePage: FC = () => {
  const { isWalletConnected, hasAccess, userRole } = useAuth();

  const statusText: string = isWalletConnected
    ? hasAccess
      ? `Authenticated as ${userRole?.toUpperCase()}. You have full access!`
      : `Wallet connected, but no access! Please go to Access Gate.`
    : "Wallet is not connected.";

  return (
    <div className="p-10 text-center min-h-screen bg-gray-50">
      <h1 className="text-5xl font-extrabold text-gray-900 mb-4">
        Welcome to PriceLess!
      </h1>
      <p className="text-xl text-gray-600 mb-8">
        Your best deals platform, built on Sui.
      </p>
      <div
        className={`inline-block p-4 rounded-lg font-semibold ${
          hasAccess
            ? "bg-green-100 text-green-700"
            : "bg-yellow-100 text-yellow-700"
        }`}
      >
        Status: {statusText}
      </div>

      <p className="mt-12 text-gray-500">
        Connect your Sui wallet to get started.
      </p>
    </div>
  );
};

export default HomePage;
