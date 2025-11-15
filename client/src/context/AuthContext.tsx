import React, {
  createContext,
  useContext,
  useState,
  useMemo,
  type FC,
} from "react";
import {
  useCurrentAccount,
  useSuiClient,
  useSignAndExecuteTransaction,
} from "@mysten/dapp-kit";

import {
  createRegisterUserTransaction,
  type SubscriptionType,
  // Tipul pentru 'Monthly' | 'Yearly'
} from "../services/transactions/registerUserTx";

import type {
  AuthContextType,
  UserRole,
  UserMockData,
  AgentMockData,
} from "../types";
import type { SuiTransactionBlockResponse } from "@mysten/sui/client";

// --- CONFIGURATION CONSTANTS (Must be configured correctly) ---
const CONFIG = {
  // Replace these placeholders with your actual deployed IDs
  PRICELESS_PACKAGE:
    import.meta.env.VITE_PRICELESS_PACKAGE_ID ||
    "0xPRICELESS_PACKAGE_ID_MISSING",
  PLATFORM_REGISTRY:
    import.meta.env.VITE_PLATFORM_REGISTRY_ID || "0xPLATFORM_REGISTRY_MISSING",
  RON_PACKAGE_ID:
    import.meta.env.VITE_RON_PACKAGE_ID || "0xRON_PACKAGE_ID_MISSING",
};


// Extend the context type
interface AuthContextTypeExtended extends AuthContextType {
  registerAndSubscribe: (
    subscriptionType: SubscriptionType
  ) => Promise<SuiTransactionBlockResponse>;
}

const initialContext: AuthContextTypeExtended = {
  walletAddress: null,
  isWalletConnected: false,
  userRole: null,
  hasAccess: false,
  setUserRole: () => {},
  setHasAccess: () => {},
  simulateAccessGrant: () => {},
  logout: () => {},
  registerAndSubscribe: () =>
    Promise.reject(new Error("Function not initialized")),
  mockUserData: { subscriptionStatus: "", offersMade: 0, walletBalance: "" },
  mockAgentData: {
    agentName: "",
    rating: 0,
    offersSold: 0,
    stakedSui: "",
    offers: [],
  },
};

const AuthContext = createContext<AuthContextTypeExtended>(initialContext);

export const AuthProvider: FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const account = useCurrentAccount();
  const suiClient = useSuiClient();
  const [userRole, setUserRole] = useState<UserRole>(null);
  const [hasAccess, setHasAccess] = useState<boolean>(false);
  const { mutateAsync: signAndExecute } = useSignAndExecuteTransaction();



  const walletAddress: string | null = account?.address || null;

  const registerAndSubscribe = async (
    subscriptionType: SubscriptionType
  ): Promise<SuiTransactionBlockResponse> => {
    if (!walletAddress || !account) {
      throw new Error("Wallet not connected.");
    }

    // Fetch user data from backend using the wallet address
      const getUserResponse = await fetch(
        `http://localhost:3000/api/get_user?address=${walletAddress}`
      );

      if (!getUserResponse.ok) {
        console.warn("Failed to fetch user data from backend:", getUserResponse.statusText);
      } else {
        const userData = await getUserResponse.json();
        console.log("User data fetched from backend:", userData.data);
      }

    try {
      const tx = await createRegisterUserTransaction({
        client: suiClient,
        currentAddress: walletAddress,
        subscriptionType: subscriptionType,
        PRICELESS_PACKAGE: CONFIG.PRICELESS_PACKAGE,
        PLATFORM_REGISTRY: CONFIG.PLATFORM_REGISTRY,
        RON_PACKAGE_ID: CONFIG.RON_PACKAGE_ID,
      });

      const partialResult = await signAndExecute({
        transaction: tx,
      });

      const txDigest = partialResult.digest;

      const result: SuiTransactionBlockResponse =
        await suiClient.waitForTransaction({
          digest: txDigest,
          options: {
            showEffects: true,
            showObjectChanges: true,
            showEvents: true,
          },
        });

      console.log("Sui Full Transaction Result (via client):", result);

      if (result.effects?.status.status !== "success") {
        const errorMessage =
          result.effects?.status.error ||
          `Unknown transaction error. Digest: ${txDigest}`;
        throw new Error(`Transaction failed: ${errorMessage}`);
      }

      setHasAccess(true);
      setUserRole("user");

      return result;
    } catch (error) {
      console.error("Registration failed:", error);
      throw error;
    }
  };

  // Simulate granting access (MOCK for Agent)
  const simulateAccessGrant = (role: "user" | "agent") => {
    console.log(`Simulation: Granting access to ${role}...`);
    setTimeout(() => {
      setHasAccess(true);
      setUserRole(role);
      alert(`Access granted! You are now an ${role}.`);
    }, 1000);
  };

  const logout = () => {
    setUserRole(null);
    setHasAccess(false);
  };

  // Mock Data (Rămâne neschimbată)
  const mockUserData: UserMockData = useMemo(
    () => ({
      subscriptionStatus: hasAccess ? "Annual (Active)" : "No Subscription",
      offersMade: 5,
      walletBalance: "150 SUI",
    }),
    [hasAccess]
  );

  const mockAgentData: AgentMockData = useMemo(
    () => ({
      agentName: "The PriceLess Agent",
      rating: 4.8,
      offersSold: 42,
      stakedSui: "100 SUI",
      offers: [
        {
          id: 1,
          shop: "Kaufland",
          product: "Olive Oil",
          price: "45.99 RON",
          date: "2025-11-10",
        },
        {
          id: 2,
          shop: "Altex",
          product: "4K LED TV",
          price: "2199 RON",
          date: "2025-11-05",
        },
      ],
    }),
    []
  );

  // Memoized context value
  const contextValue: AuthContextTypeExtended = useMemo(
    () => ({
      walletAddress,
      isWalletConnected: !!walletAddress,
      userRole,
      setUserRole,
      hasAccess,
      setHasAccess,
      simulateAccessGrant,
      logout,
      registerAndSubscribe,
      mockUserData,
      mockAgentData,
    }),
    [
      walletAddress,
      userRole,
      hasAccess,
      mockUserData,
      mockAgentData,
      registerAndSubscribe,
    ]
  );

  return (
    <AuthContext.Provider value={contextValue}>{children}</AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
