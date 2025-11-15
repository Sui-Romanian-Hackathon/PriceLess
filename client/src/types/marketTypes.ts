import type { Product } from ".";

export interface Agent {
  id: string;
  name: string;
  rating: number;
  address?: string; // Sui wallet address for agent
}

export interface SellOffer {
  id: string;
  buy_offer_id: string; // Added to match with BuyOffer
  agent: Agent;
  price: number;
  shop: string;
  quantity: number;
  productId: string;
  agent_id: string; // Agent's object ID from blockchain
  agent_address: string; // Agent's wallet address
}

export interface BuyOffer {
  id: string;
  type: 'TargetPrice' | 'Deadline';
  targetPrice: number | null;
  deadline: string | null; 
  productId: string;
}

// 🚨 NOU: Definiția și exportul BuyOfferSubmitData
export interface BuyOfferSubmitData {
    productId: string;
    type: 'TargetPrice' | 'Deadline';
    targetPrice: number | null;
    deadline: string | null;
}
// ----------------------------------------------------


export interface ProductCardProps {
  product: Product;
  sellOffers: SellOffer[];
  buyOffers: BuyOffer[];

  onViewDetails: (product: Product) => void;
  onCreateBuyOffer: (product: Product) => void;
  onBuySellOffer: (offer: SellOffer) => void;
  onUpdateBuyOffer: (offer: BuyOffer) => void;
  onDeleteBuyOffer: (offer: BuyOffer) => void;
}