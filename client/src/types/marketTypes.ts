import type { Product } from ".";

export interface Agent {
  id: string;
  name: string;
  rating: number;
}

export interface SellOffer {
  id: string;
  agent: Agent;
  price: number;
  shop: string; 
  quantity: number;
  productId: string;
}

export interface BuyOffer {
  id: string;
  type: 'TargetPrice' | 'Deadline';
  targetPrice: number | null;
  deadline: string | null; 
  productId: string;
}

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