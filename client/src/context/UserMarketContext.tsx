import React, {
  createContext,
  useContext,
  useState,
  useMemo,
  type FC,
  type ReactNode,
} from "react";
import {
    useSuiClient,
    useCurrentAccount,
    useSignAndExecuteTransaction
} from "@mysten/dapp-kit";
import type { BuyOfferSubmitData, BuyOffer, SellOffer } from "../types/marketTypes";
import { MOCK_BUY_OFFERS } from "../mocks/marketMockData";
import { useAuth } from "./AuthContext";

// --- Sui/Transaction Imports (PLACEHOLDERS) ---
import { createBuyOfferTransaction } from '../services/transactions/buyOfferTx';
import { extractBuyOfferId } from '../utils/suiUtils';
import type { SuiTransactionBlockResponse } from "@mysten/sui/client";

// --- Configuration Constants (Utilizați import.meta.env pentru Vite) ---
const CONFIG = {
    PRICELESS_PACKAGE: import.meta.env.VITE_PRICELESS_PACKAGE_ID || '0x...',
    PLATFORM_REGISTRY: import.meta.env.VITE_PLATFORM_REGISTRY_ID || '0x...',
    RON_PACKAGE_ID: import.meta.env.VITE_RON_PACKAGE_ID || '0x...',
};
// ----------------------------------------------------------------------

// Funcție utilitară locală pentru ID-uri temporare
const generateUniqueId = (): string => `temp-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;

interface UserMarketContextType {
  userBuyOffers: BuyOffer[];
  createBuyOffer: (data: BuyOfferSubmitData) => Promise<any>;
  updateBuyOffer: (offerId: string, data: BuyOfferSubmitData) => Promise<void>;
  deleteBuyOffer: (offerId: string) => Promise<void>;
}

const initialContext: UserMarketContextType = {
  userBuyOffers: MOCK_BUY_OFFERS,
  createBuyOffer: () => Promise.resolve(),
  updateBuyOffer: () => Promise.resolve(),
  deleteBuyOffer: () => Promise.resolve(),
};

const UserMarketContext = createContext<UserMarketContextType>(initialContext);

export const UserMarketProvider: FC<{ children: ReactNode }> = ({ children }) => {
  const [userBuyOffers, setUserBuyOffers] = useState<BuyOffer[]>(MOCK_BUY_OFFERS);
  const [isLoadingOffers, setIsLoadingOffers] = useState(false);

  // Sui Hooks
  const suiClient = useSuiClient();
  const account = useCurrentAccount();
  const currentAddress = account?.address || null;

  const { mutateAsync: signAndExecute } = useSignAndExecuteTransaction();

  // Auth Hook (called at component level, not inside functions)
  const { userId, walletAddress } = useAuth();

  // Fetch buy offers from database for the current user
  const fetchUserBuyOffers = async (ownerAddress: string) => {
    setIsLoadingOffers(true);
    console.log(`🔄 Fetching buy offers for owner: ${ownerAddress}`);

    try {
      const url = `http://localhost:3000/api/buy-offers/owner/${ownerAddress}`;
      console.log(`📍 Calling endpoint: ${url}`);

      const response = await fetch(url);

      if (!response.ok) {
        console.warn(`❌ Failed to fetch buy offers: ${response.status} ${response.statusText}`);
        return;
      }

      const data = await response.json();
      console.log("✅ Buy offers from database:", data.data);
      console.log(`📊 Found ${data.data?.length || 0} offers`);

      // Map database BuyOffers to our BuyOffer type
      const dbOffers: BuyOffer[] = (data.data || []).map((offer: any) => {
        const mappedOffer: BuyOffer = {
          id: offer.buy_offer_id || `db-${offer.id}`,
          type: offer.offer_type_is_time_based ? 'Deadline' : 'TargetPrice',
          targetPrice: offer.offer_type_is_time_based ? null : Number(offer.price) / 100, // Convert from base units
          deadline: offer.offer_type_is_time_based ? new Date(Number(offer.deadline) * 1000).toISOString() : null,
          productId: offer.product, // Product name from blockchain
        };
        console.log("📦 Mapped offer:", mappedOffer);
        return mappedOffer;
      });

      console.log(`✨ Setting ${dbOffers.length} offers in state:`, dbOffers);
      setUserBuyOffers(dbOffers);
      console.log(`🎯 Context updated! userBuyOffers should now contain:`, dbOffers);
    } catch (error) {
      console.error("❌ Error fetching buy offers:", error);
    } finally {
      setIsLoadingOffers(false);
    }
  };

  // Fetch offers when wallet address changes
  React.useEffect(() => {
    if (walletAddress) {
      fetchUserBuyOffers(walletAddress);
    }
  }, [walletAddress]);

  // --- Core Function: CREATE BUY OFFER (SUI INTEGRATION) ---
  const createBuyOffer = async (data: BuyOfferSubmitData) => {
    if (!currentAddress || !account) {
        throw new Error("Wallet not connected or account not found.");
    }

    if (!userId) {
        throw new Error("User ID not found. Please register first.");
    }

    const priceRaw = data.targetPrice !== null ? data.targetPrice * 100 : 0;
    const deadlineMs = data.deadline ? new Date(data.deadline).getTime() : null;

    // 2. Build the Transaction
    const tx = await createBuyOfferTransaction({
        client: suiClient,
        currentAddress: currentAddress,
        productName: data.productId,
        price: priceRaw,
        offerType: data.type,
        deadlineTimestampMs: deadlineMs,
        ...CONFIG,
        USER_ADDR: userId,
    });

    // 3. Execute Transaction
    console.log("Submitting Buy Offer transaction for user signature...");

    const suiResult = await signAndExecute({
        transaction: tx,
        options: {
            showEvents: true,
            showObjectChanges: true,
            showEffects: true
        },
    } as any);

    console.log("Transaction response:", suiResult);
    console.log("Transaction digest:", (suiResult as any)?.digest);

    // 4. Process Result
    // The dApp Kit returns a digest if successful (transaction was executed on-chain)
    const digest = (suiResult as any)?.digest;

    if (!digest) {
        throw new Error('Transaction failed: No digest returned');
    }

    console.log(`✅ Buy Offer transaction successful! Digest: ${digest}`);

    // Fetch full transaction details to get object changes
    let newOfferObjectId: string | null = null;
    try {
        const fullTxResult = await suiClient.getTransactionBlock({
            digest: digest,
            options: {
                showObjectChanges: true,
                showEffects: true,
            },
        });

        console.log("Full transaction result:", fullTxResult);
        newOfferObjectId = extractBuyOfferId(fullTxResult);
    } catch (error) {
        console.warn("Could not fetch full transaction details:", error);
    }

    if (!newOfferObjectId) {
         console.warn("Could not find new BuyOffer Object ID. The transaction succeeded, but the local state might use a temporary ID.");
    }

    console.log("Waiting for indexer to sync transaction to database...");

    // Wait a bit for the indexer to process the transaction and update the database
    await new Promise(resolve => setTimeout(resolve, 2000));

    // 5. Refresh buy offers from database
    if (walletAddress) {
      console.log("Refreshing buy offers from database...");
      await fetchUserBuyOffers(walletAddress);
    } else {
      // Fallback: update local state with the new offer
      const newOffer: BuyOffer = {
        id: newOfferObjectId || generateUniqueId(),
        type: data.type,
        targetPrice: data.targetPrice,
        deadline: data.deadline,
        productId: data.productId,
      };

      setUserBuyOffers(prevOffers => {
          const newOffers = [...prevOffers, newOffer];
          return newOffers;
      });
    }

    return suiResult;
  };
  
  // --- Core Function: UPDATE BUY OFFER (MOCK) ---
  const updateBuyOffer = async (offerId: string, data: BuyOfferSubmitData) => {
    await new Promise(resolve => setTimeout(resolve, 500)); 

    setUserBuyOffers(prevOffers => {
        return prevOffers.map(offer => 
            offer.id === offerId ? { ...offer, ...data } : offer
        );
    });
  };

  // --- Core Function: DELETE BUY OFFER (MOCK) ---
  const deleteBuyOffer = async (offerId: string) => {
    await new Promise(resolve => setTimeout(resolve, 500)); 
    
    setUserBuyOffers(prevOffers => prevOffers.filter(offer => offer.id !== offerId));
  };


  const contextValue: UserMarketContextType = useMemo(
    () => ({
      userBuyOffers,
      createBuyOffer,
      updateBuyOffer,
      deleteBuyOffer,
    }),
    [userBuyOffers, createBuyOffer, updateBuyOffer, deleteBuyOffer, userId]
  );

  return (
    <UserMarketContext.Provider value={contextValue}>
      {children}
    </UserMarketContext.Provider>
  );
};

export const useUserMarket = () => useContext(UserMarketContext);