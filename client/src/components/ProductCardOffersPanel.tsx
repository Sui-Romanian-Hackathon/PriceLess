// src/components/ProductCardOffersPanel.tsx

import { Plus, Calendar, Target } from "lucide-react";
import type { FC } from "react";
import type { Product } from "../types";
import type { SellOffer, BuyOffer } from "../types/marketTypes";

interface ProductCardOffersPanelProps {
  product: Product;
  sellOffers: SellOffer[];
  buyOffers: BuyOffer[];
  onCreateBuyOffer: (product: Product) => void;
  onBuySellOffer: (offer: SellOffer) => void;
  onUpdateBuyOffer: (offer: BuyOffer) => void;
  onDeleteBuyOffer: (offer: BuyOffer) => void;
}

const ProductCardOffersPanel: FC<ProductCardOffersPanelProps> = ({ 
    product, 
    sellOffers, 
    buyOffers,  
    onCreateBuyOffer,
    onBuySellOffer,
    onUpdateBuyOffer,
    onDeleteBuyOffer
}) => {
  
  const formatRating = (rating: number) => {
    return '★'.repeat(Math.floor(rating)) + '☆'.repeat(5 - Math.floor(rating)) + ` (${rating})`;
  };

  const BuyOfferDisplay = ({ offer }: { offer: BuyOffer }) => {
    if (offer.type === 'TargetPrice' && offer.targetPrice) {
        return (
            <span className="text-indigo-600 font-bold flex items-center">
                <Target size={14} className="mr-1" /> Limit Price: RON {offer.targetPrice.toFixed(2)}
            </span>
        );
    }
    if (offer.type === 'Deadline' && offer.deadline) {
        return (
            <span className="text-orange-600 font-bold flex items-center">
                <Calendar size={14} className="mr-1" /> Deadline: {new Date(offer.deadline).toLocaleDateString()}
            </span>
        );
    }
    return null;
  };

  // 1. Găsirea celei mai bune oferte (Prețul cel mai mic)
  const bestSellOffer = sellOffers.length > 0
    ? sellOffers.reduce((min, offer) => offer.price < min.price ? offer : min, sellOffers[0])
    : null;

  return (
    <div className="bg-white p-6 rounded-2xl shadow-xl border-t-4 border-blue-500 flex flex-col">

      {/* --- Buton "Create a Buy Offer" (only show if no offers exist) --- */}
      {buyOffers.length === 0 && (
        <button
          onClick={() => onCreateBuyOffer(product)}
          className="mb-6 w-full py-3 bg-indigo-600 text-white rounded-lg font-bold flex items-center justify-center hover:bg-indigo-700 transition shadow-md text-lg"
        >
          <Plus size={20} className="mr-2" /> Create Your Buy Offer
        </button>
      )}

      {/* --- Lista Ofertelor de Cumpărare (Buy Offers) --- */}
      <div className="mb-6 border-b pb-4">
        <h4 className="text-xl font-bold text-gray-700 mb-3 flex items-center">
            Your Buy Offers ({buyOffers.length})
        </h4>
        {buyOffers.length === 0 ? (
            <p className="text-gray-500 italic text-sm">You have no active Buy Offers.</p>
        ) : (
            <div className="space-y-3">
                {buyOffers.map(offer => (
                    <div
                        key={offer.id}
                        className="flex items-center p-3 bg-indigo-100 rounded-lg border border-indigo-300 shadow-sm"
                    >
                        <BuyOfferDisplay offer={offer} />
                    </div>
                ))}
            </div>
        )}
      </div>

      {/* --- Lista Ofertelor de Vânzare (Sell Offers) --- */}
      <div className="flex-grow">
        <h4 className="text-xl font-bold text-gray-700 mb-3 border-t pt-4">
            Available Sell Offers ({sellOffers.length})
        </h4>
        <div className="space-y-3">
          {sellOffers.length === 0 ? (
            <p className="text-gray-500 italic text-sm">No current Sell Offers.</p>
          ) : (
            sellOffers.map(offer => {
              const isBestOffer = bestSellOffer && offer.id === bestSellOffer.id;

              return (
                <div 
                  key={offer.id} 
                  // Aplică stiluri de evidențiere pentru cea mai bună ofertă
                  className={`flex items-center justify-between p-3 bg-white border rounded-lg shadow-sm hover:bg-gray-50 transition 
                    ${isBestOffer 
                        ? 'border-green-500 ring-2 ring-green-200' 
                        : 'border-gray-200'
                    }`}
                >
                  {/* Detalii Ofertă */}
                  <div className="flex flex-col flex-1 min-w-0">
                    <p className="text-2xl font-extrabold text-red-600">RON {offer.price.toFixed(2)}</p>
                    <p className="text-xs text-gray-500 truncate">
                      at: <span className="font-semibold">{offer.shop}</span>
                    </p>
                  </div>
                  
                  {/* Stea/Badge pentru cea mai bună ofertă */}
                  {isBestOffer && (
                      <span className="text-lg text-yellow-500 mr-2" title="Best Price Available">
                          🌟
                      </span>
                  )}

                  {/* Detalii Agent */}
                  <div className="flex flex-col items-end mx-4 min-w-[120px]">
                      <p className="text-sm font-semibold text-gray-800 truncate" title={offer.agent.name}>
                          {offer.agent.name}
                      </p>
                      <p className="text-xs text-yellow-600 font-medium">
                          {formatRating(offer.agent.rating)}
                      </p>
                  </div>

                  {/* Buy Button */}
                  <button
                    onClick={() => onBuySellOffer(offer)}
                    className="py-2 px-4 bg-green-500 text-white rounded-lg font-bold text-sm hover:bg-green-600 transition shadow-md"
                  >
                    Buy
                  </button>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};

export default ProductCardOffersPanel;