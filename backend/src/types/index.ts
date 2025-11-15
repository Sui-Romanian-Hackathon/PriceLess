import { User, BuyOffer, SellOffer, ManualBuy, ShopPurchase } from "@prisma/client";

// Response types
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  timestamp: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    pages: number;
  };
  timestamp: string;
}

// Entity types (can be extended with additional fields if needed)
export type UserResponse = User;
export type BuyOfferResponse = BuyOffer & {
  user?: UserResponse;
  sellOffers?: SellOfferResponse[];
};
export type SellOfferResponse = SellOffer & {
  buyOffer?: BuyOfferResponse;
};
export type ManualBuyResponse = ManualBuy;
export type ShopPurchaseResponse = ShopPurchase;

// Request body types
export interface CreateUserBody {
  user_id: string;
  user_object_address: string;
  user_owner_address: string;
  subscription_fee: bigint;
  subscription_deadline: bigint;
  timestamp: bigint;
}

export interface UpdateUserBody {
  subscription_fee?: bigint;
  subscription_deadline?: bigint;
}

export interface CreateBuyOfferBody {
  buy_offer_id: string;
  owner: string;
  product: string;
  price: bigint;
  offer_type_is_time_based: boolean;
  deadline: bigint;
  created_at: bigint;
}

export interface UpdateBuyOfferBody {
  product?: string;
  price?: bigint;
  deadline?: bigint;
}

export interface CreateSellOfferBody {
  buy_offer_id: string;
  sell_offer_id: string;
  agent_id: string;
  agent_address: string;
  store_link: string;
  price: bigint;
  is_update: boolean;
}

export interface UpdateSellOfferBody {
  store_link?: string;
  price?: bigint;
  is_update?: boolean;
}

export interface CreateManualBuyBody {
  buy_offer_id: string;
  buyer: string;
  agent_id: string;
  sell_offer_id: string;
  store_link: string;
  product_price: bigint;
  agent_fee: bigint;
  total_paid: bigint;
}

export interface CreateShopPurchaseBody {
  agent_id: string;
  sell_offer_id: string;
  store_link: string;
  product_price: bigint;
  agent_fee: bigint;
  platform_fee: bigint;
}

// Query parameters
export interface PaginationParams {
  page?: number;
  limit?: number;
}

export interface FilterParams extends PaginationParams {
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}
