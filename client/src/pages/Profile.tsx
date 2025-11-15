// src/pages/Profile.tsx
import React, { type FC } from "react";
import { Navigate } from "react-router-dom";
import {
  Package,
  DollarSign,
  Wallet,
  Shield,
  Star,
  Briefcase,
  User,
  Icon as LucideIcon,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";

interface DetailCardProps {
  icon: React.ReactElement<typeof LucideIcon>;
  title: string;
  value: string | number;
}

const DetailCard: FC<DetailCardProps> = ({ icon, title, value }) => (
  <div className="bg-gray-50 p-4 rounded-lg shadow-inner">
    <div className="flex items-center text-gray-500 mb-2">
      {icon}
      <span className="ml-2 text-sm font-medium uppercase">{title}</span>
    </div>
    <p className="text-lg font-bold text-gray-900 break-words">{value}</p>
  </div>
);

const Profile: FC = () => {
  const {
    isWalletConnected,
    hasAccess,
    userRole,
    walletAddress,
    mockUserData,
    mockAgentData,
    // Eliminăm: mintMockRonCoins, hasMockRonCoins
  } = useAuth();

  if (!isWalletConnected || !hasAccess) {
    return <Navigate to="/access-gate" replace />;
  }

  const RenderUserView: FC = () => (
    <div className="p-8 bg-white rounded-xl shadow-lg border-t-4 border-blue-500">
      <h2 className="text-3xl font-bold text-gray-800 mb-6 flex items-center">
        <User size={30} className="mr-3 text-blue-500" /> User Profile
      </h2>

      {/* Basic Details */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
        <DetailCard
          icon={<Wallet size={24} />}
          title="Wallet Address"
          value={`${walletAddress?.slice(0, 8)}...${walletAddress?.slice(-6)}`}
        />
        <DetailCard
          icon={<Shield size={24} />}
          title="Subscription Status"
          value={mockUserData.subscriptionStatus}
        />
        <DetailCard
          icon={<DollarSign size={24} />}
          title="Available Funds"
          value={mockUserData.walletBalance}
        />
      </div>

      {/* Saved Offers List */}
      <h3 className="text-2xl font-semibold text-gray-800 border-b pb-2 mb-4">
        Saved/Purchased Offers
      </h3>
      <div className="bg-gray-50 p-4 rounded-lg">
        <p className="text-gray-600">
          You have **{mockUserData.offersMade}** offers on your watchlist.
        </p>
      </div>
    </div>
  );

  const RenderAgentView: FC = () => (
    <div className="p-8 bg-white rounded-xl shadow-lg border-t-4 border-green-500">
      <h2 className="text-3xl font-bold text-gray-800 mb-6 flex items-center">
        <Briefcase size={30} className="mr-3 text-green-500" /> Agent Profile
      </h2>

      {/* Basic Details */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-10">
        <DetailCard
          icon={<User size={24} />}
          title="Agent Name"
          value={mockAgentData.agentName}
        />
        <DetailCard
          icon={<Star size={24} />}
          title="Rating"
          value={`${mockAgentData.rating} / 5.0`}
        />
        <DetailCard
          icon={<Package size={24} />}
          title="Offers Sold"
          value={mockAgentData.offersSold}
        />
        <DetailCard
          icon={<DollarSign size={24} />}
          title="Staked SUI"
          value={mockAgentData.stakedSui}
        />
      </div>

      {/* Posted Offers List */}
      <h3 className="text-2xl font-semibold text-gray-800 border-b pb-2 mb-4">
        List of Posted Offers
      </h3>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Product
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Shop
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Price
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Date
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {mockAgentData.offers.map(offer => (
              <tr key={offer.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                  {offer.product}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {offer.shop}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-green-600 font-bold">
                  {offer.price}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {offer.date}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-6xl mx-auto">
        {userRole === "user" ? <RenderUserView /> : <RenderAgentView />}
      </div>
    </div>
  );
};

export default Profile;