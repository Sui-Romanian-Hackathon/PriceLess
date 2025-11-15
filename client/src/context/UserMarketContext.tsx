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
// Nu mai avem nevoie de useAuth pentru hasMockRonCoins
// import { useAuth } from "./AuthContext"; // Importul nu mai este necesar dacă nu este folosit altundeva

// --- Sui/Transaction Imports (PLACEHOLDERS) ---
import { createBuyOfferTransaction } from '../services/transactions/buyOfferTx';
import { extractBuyOfferId } from '../utils/suiUtils'; 
import type { SuiTransactionBlockResponse } from "@mysten/sui/client";

// --- Configuration Constants (Utilizați import.meta.env pentru Vite) ---
const CONFIG = {
    PRICELESS_PACKAGE: import.meta.env.VITE_PRICELESS_PACKAGE_ID || '0x...',
    PLATFORM_REGISTRY: import.meta.env.VITE_PLATFORM_REGISTRY_ID || '0x...',
    RON_PACKAGE_ID: import.meta.env.VITE_RON_PACKAGE_ID || '0x...',
    USER_OBJECT_ID: import.meta.env.VITE_USER_OBJECT_ID || '0xUSER_OBJECT_ID' 
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
  
  // Sui Hooks
  const suiClient = useSuiClient();
  const account = useCurrentAccount();
  const currentAddress = account?.address || null;
  
  const { mutateAsync: signAndExecute } = useSignAndExecuteTransaction();

  // --- Core Function: CREATE BUY OFFER (SUI INTEGRATION) ---
  const createBuyOffer = async (data: BuyOfferSubmitData) => {
    if (!currentAddress || !account) {
        throw new Error("Wallet not connected or account not found.");
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
        USER_ADDR: CONFIG.USER_OBJECT_ID,
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
    } as any) as unknown as SuiTransactionBlockResponse; 

    // 4. Process Result
    if (suiResult.effects?.status.status !== 'success') {
        throw new Error(`Transaction failed: ${suiResult.effects?.status.error}`);
    }
    
    const newOfferObjectId = extractBuyOfferId(suiResult); 

    if (!newOfferObjectId) {
         console.warn("Could not find new BuyOffer Object ID. The transaction succeeded, but the local state might use a temporary ID.");
    }
    
    // 5. Update Local State
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
    [userBuyOffers, createBuyOffer, updateBuyOffer, deleteBuyOffer]
  );

  return (
    <UserMarketContext.Provider value={contextValue}>
      {children}
    </UserMarketContext.Provider>
  );
};

export const useUserMarket = () => useContext(UserMarketContext);