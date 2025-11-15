import type { UserRole } from "./Role";
import type { Offer } from "./Offer";

export interface UserMockData {
  subscriptionStatus: string;
  offersMade: number;
  walletBalance: string;
}

export interface AgentMockData {
  agentName: string;
  rating: number;
  offersSold: number;
  stakedSui: string;
  offers: Offer[];
}

export interface AuthContextType {
  walletAddress: string | null;
  isWalletConnected: boolean;
  userRole: UserRole;
  hasAccess: boolean;
  setUserRole: (role: UserRole) => void;
  setHasAccess: (access: boolean) => void;
  simulateAccessGrant: (role: "user" | "agent") => void;
  logout: () => void;
  mockUserData: UserMockData;
  mockAgentData: AgentMockData;
}
