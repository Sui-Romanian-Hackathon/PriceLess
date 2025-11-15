import React, {
  createContext,
  useContext,
  useState,
  useMemo,
  type FC,
} from "react";
import { useCurrentAccount } from "@mysten/dapp-kit";

import type {
  AuthContextType,
  UserRole,
  UserMockData,
  AgentMockData,
} from "../types";

const initialContext: AuthContextType = {
  walletAddress: null,
  isWalletConnected: false,
  userRole: null,
  hasAccess: false,
  setUserRole: () => {},
  setHasAccess: () => {},
  simulateAccessGrant: () => {},
  logout: () => {},
  mockUserData: { subscriptionStatus: "", offersMade: 0, walletBalance: "" },
  mockAgentData: {
    agentName: "",
    rating: 0,
    offersSold: 0,
    stakedSui: "",
    offers: [],
  },
};

const AuthContext = createContext<AuthContextType>(initialContext);

export const AuthProvider: FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const account = useCurrentAccount();
  const [userRole, setUserRole] = useState<UserRole>(null);
  const [hasAccess, setHasAccess] = useState<boolean>(false);

  const walletAddress: string | null = account?.address || null;

  // Simulate granting access (mock)
  const simulateAccessGrant = (role: "user" | "agent") => {
    console.log(`Simulation: Granting access to ${role}...`);
    setTimeout(() => {
      setHasAccess(true);
      alert(`Access granted! You are now an ${role}.`);
    }, 1000);
  };

  const logout = () => {
    setUserRole(null);
    setHasAccess(false);
  };

  // Mock for User
  const mockUserData: UserMockData = useMemo(
    () => ({
      subscriptionStatus: hasAccess ? "Anuală (Activă)" : "Nicio Subscripție",
      offersMade: 5,
      walletBalance: "150 SUI",
    }),
    [hasAccess]
  );

  // Mock for Agent
  const mockAgentData: AgentMockData = useMemo(
    () => ({
      agentName: "Agentul PriceLess",
      rating: 4.8,
      offersSold: 42,
      stakedSui: "100 SUI",
      offers: [
        {
          id: 1,
          shop: "Kaufland",
          product: "Ulei de Măsline",
          price: "45.99 RON",
          date: "2025-11-10",
        },
        {
          id: 2,
          shop: "Altex",
          product: "TV LED 4K",
          price: "2199 RON",
          date: "2025-11-05",
        },
      ],
    }),
    []
  );

  // Context value memoizat
  const contextValue: AuthContextType = useMemo(
    () => ({
      walletAddress,
      isWalletConnected: !!walletAddress,
      userRole,
      setUserRole,
      hasAccess,
      setHasAccess,
      simulateAccessGrant,
      logout,
      mockUserData,
      mockAgentData,
    }),
    [walletAddress, userRole, hasAccess, mockUserData, mockAgentData]
  );

  return (
    <AuthContext.Provider value={contextValue}>{children}</AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
