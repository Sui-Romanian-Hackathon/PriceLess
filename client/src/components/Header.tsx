// src/components/Header.tsx (Updated)
import { type FC } from "react";
import { Link, NavLink } from "react-router-dom";
import { ConnectButton } from "@mysten/dapp-kit";
import { useAuth } from "../context/AuthContext";
import { User, LogOut } from "lucide-react"; // Added LogOut for clarity

interface NavLinkItem {
  name: string;
  path: string;
}

const NavLinks: NavLinkItem[] = [
  { name: "Home", path: "/" },
  { name: "Products", path: "/products" },
  { name: 'Counter Test', path: '/counter' },
  { name: "Profile", path: "/profile" },
];

const Header: FC = () => {
  const { isWalletConnected, hasAccess, userRole, walletAddress, logout } =
    useAuth();

  return (
    <header className="bg-gray-800 text-white shadow-xl sticky top-0 z-50 border-b border-green-600/50">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between h-20">
        {" "}
        <Link
          to="/"
          className="text-3xl font-extrabold tracking-wider text-green-400 hover:text-green-300 transition-colors"
        >
          PriceLess
          <span className="text-sm font-light ml-1 text-gray-400">DApp</span>
        </Link>
        <nav className="hidden md:flex space-x-6">
          {" "}
          {NavLinks.map(link => {
            if (
              link.path === "/profile" &&
              (!isWalletConnected || !hasAccess)
            ) {
              return null;
            }

            return (
              <NavLink
                key={link.name}
                to={link.path}
                className={({ isActive }) =>
                  `px-3 py-2 rounded-lg text-base font-medium transition-colors border-2 border-transparent ${
                    isActive
                      ? "bg-green-600 text-white border-green-400 shadow-md"
                      : "text-gray-300 hover:bg-gray-700 hover:text-white"
                  }`
                }
              >
                {link.name}
              </NavLink>
            );
          })}
        </nav>
        {/* Right: Connect Wallet & User Profile */}
        <div className="flex items-center space-x-4">
          {" "}
          {isWalletConnected && hasAccess ? (
            <div className="group relative">
              <Link
                to="/profile"
                className="p-3 rounded-full bg-green-500 hover:bg-green-400 transition-colors shadow-lg w-10 h-10 flex items-center justify-center"
              >
                <User size={22} aria-label="User Profile" />
              </Link>
              {/* Dropdown Menu */}
              <div className="absolute right-0 mt-1 p-1 w-48 bg-white text-gray-900 rounded-lg shadow-2xl overflow-hidden hidden group-hover:block z-20">
                <div className="bg-white rounded-lg shadow-lg">
                  <div className="px-4 py-3 text-sm font-semibold bg-gray-100 truncate border-b">
                    {userRole === "agent" ? "Agent" : "User"}:{" "}
                    {walletAddress?.slice(0, 6)}...
                  </div>
                  <Link
                    to="/profile"
                    className="block px-4 py-2 text-sm hover:bg-gray-100"
                  >
                    View Profile
                  </Link>
                  <button
                    onClick={logout}
                    className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center"
                  >
                    <LogOut size={16} className="mr-2" /> Disconnect
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div
              className="p-3 rounded-full bg-gray-600 text-gray-400 shadow-inner"
              title="Inactive/Disconnected Account"
            >
              <User size={22} />
            </div>
          )}
          {/* Sui Connect Wallet Button */}
          <ConnectButton
            connectText="Connect Wallet"
            className="!bg-green-600 !hover:bg-green-700 !text-white !font-bold !py-2.5 !px-5 !rounded-lg !shadow-xl !text-base"
          />
        </div>
      </div>
    </header>
  );
};

export default Header;
