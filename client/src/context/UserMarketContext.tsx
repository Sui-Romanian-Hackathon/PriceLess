// src/context/UserMarketContext.tsx

import React, { createContext, useContext, useState, useMemo, type ReactNode, type FC } from 'react';
import type { BuyOffer, SellOffer } from '../types/marketTypes'; 
// 🚨 LINIA CRITICĂ: Verifică acest import și calea!
import { MOCK_BUY_OFFERS } from '../mocks/marketMockData'; 

// Adaugă logul de test la început pentru a confirma că modulul se încarcă
console.log("LOG TEST: Am ajuns la inceputul contextului!"); 

// Definim tipul de date trimis de modal
interface BuyOfferSubmitData {
    productId: string;
    type: 'TargetPrice' | 'Deadline';
    targetPrice: number | null;
    deadline: string | null;
}

// Interfața Contextului
interface UserMarketContextType {
    userBuyOffers: BuyOffer[];
    
    createBuyOffer: (data: BuyOfferSubmitData) => Promise<void>;
    deleteBuyOffer: (offerId: string) => Promise<void>;
    updateBuyOffer: (offerId: string, data: BuyOfferSubmitData) => Promise<void>;
    
    getBuyOffersByProductId: (productId: string) => BuyOffer[]; 
}

// Valoarea default
const defaultContextValue: UserMarketContextType = {
    userBuyOffers: [],
    createBuyOffer: async () => {},
    deleteBuyOffer: async () => {},
    updateBuyOffer: async () => {},
    getBuyOffersByProductId: () => [],
};

export const UserMarketContext = createContext<UserMarketContextType>(defaultContextValue);

const generateUniqueId = () => `b_user_${Date.now()}_${Math.random().toFixed(4).replace('0.', '')}`;

export const UserMarketProvider: FC<{ children: ReactNode }> = ({ children }) => {
    
    // 🎯 LOGURI DE DIAGNOSTICARE FINALE (imediate)
    console.log("DIAGNOSTIC MOCK: Tipul MOCK_BUY_OFFERS:", typeof MOCK_BUY_OFFERS);
    console.log("DIAGNOSTIC MOCK: Lungimea MOCK_BUY_OFFERS:", Array.isArray(MOCK_BUY_OFFERS) ? MOCK_BUY_OFFERS.length : 'NOT ARRAY');
    
    // Inițializăm starea cu datele mock. Dacă MOCK_BUY_OFFERS este undefined, folosește un array gol.
    const [userBuyOffers, setUserBuyOffers] = useState<BuyOffer[]>(MOCK_BUY_OFFERS || []);

    // Simulează latența rețelei Sui
    const mockSuiTransaction = () => new Promise<void>(resolve => setTimeout(resolve, 500)); 

    const createBuyOffer = async (data: BuyOfferSubmitData) => {
        await mockSuiTransaction(); 
        const newOffer: BuyOffer = {
            id: generateUniqueId(),
            type: data.type,
            targetPrice: data.targetPrice,
            deadline: data.deadline,
            productId: data.productId,
        };

        setUserBuyOffers(prevOffers => {
            const newOffers = [...prevOffers, newOffer];
            console.log("CONTEXT: Buy Offer Created. New count:", newOffers.length);
            return newOffers;
        });
    };

    const deleteBuyOffer = async (offerId: string) => {
        await mockSuiTransaction(); 
        
        setUserBuyOffers(prevOffers => {
            const newOffers = prevOffers.filter(offer => offer.id !== offerId);
            console.log(`CONTEXT: Offer ${offerId} Deleted. New count:`, newOffers.length);
            return newOffers;
        });
    };

    const updateBuyOffer = async (offerId: string, data: BuyOfferSubmitData) => {
        await mockSuiTransaction(); 

        const updatedOffer: BuyOffer = {
            id: offerId, 
            type: data.type,
            targetPrice: data.targetPrice,
            deadline: data.deadline,
            productId: data.productId,
        };

        setUserBuyOffers(prevOffers => 
            prevOffers.map(offer => 
                offer.id === offerId ? updatedOffer : offer
            )
        );
        console.log("CONTEXT: Offer updated.");
    };

    const getBuyOffersByProductId = (productId: string): BuyOffer[] => {
        return userBuyOffers.filter(offer => offer.productId === productId);
    };

    const contextValue = useMemo(() => ({
        userBuyOffers, 
        createBuyOffer,
        deleteBuyOffer,
        updateBuyOffer,
        getBuyOffersByProductId,
    }), [userBuyOffers]); 

    return (
        <UserMarketContext.Provider value={contextValue}>
            {children}
        </UserMarketContext.Provider>
    );
};

export const useUserMarket = () => {
    const context = useContext(UserMarketContext);
    if (context === undefined) {
        throw new Error('useUserMarket must be used within a UserMarketProvider');
    }
    return context;
};