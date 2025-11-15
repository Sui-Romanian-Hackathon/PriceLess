// src/components/ProductCard.tsx

import { ShoppingBag, DollarSign, MapPin, ChevronRight, Calendar, Target } from "lucide-react";
import type { FC } from "react";
import type { Product } from '../types'; 
import type { SellOffer, BuyOffer } from '../types/marketTypes'; 

interface ProductCardProps {
  product: Product;
  sellOffers: SellOffer[];
  buyOffers: BuyOffer[];
  
  onViewDetails: (product: Product) => void;
}

const ProductCard: FC<ProductCardProps> = ({ 
  product,
  sellOffers,
  buyOffers,
  onViewDetails,
}) => {
  
  const formatRating = (rating: number) => {
    return '★'.repeat(Math.floor(rating)) + '☆'.repeat(5 - Math.floor(rating)) + ` (${rating.toFixed(1)})`;
  };

  const BuyOfferDisplay = ({ offer }: { offer: BuyOffer }) => {
    if (offer.type === 'TargetPrice' && offer.targetPrice) {
        return (
            <span className="text-indigo-600 font-bold text-sm flex items-center">
                <Target size={14} className="mr-1" /> Limit Price: ${offer.targetPrice.toFixed(2)}
            </span>
        );
    }
    if (offer.type === 'Deadline' && offer.deadline) {
        return (
            <span className="text-orange-600 font-bold text-sm flex items-center">
                <Calendar size={14} className="mr-1" /> Deadline: {new Date(offer.deadline).toLocaleDateString()}
            </span>
        );
    }
    return null;
  };


  return (
    <div className="bg-white p-6 rounded-xl shadow-lg hover:shadow-2xl transition duration-300 transform hover:-translate-y-1 border-t-4 border-blue-500 flex flex-col">
      
      <div>
        <ShoppingBag size={32} className="text-blue-500 mb-3" />
        <h3
          className="text-2xl font-bold text-gray-900 mb-4 truncate"
          title={product.name}
        >
          {product.name}
        </h3>
      </div>
      
      <div className="my-3 p-3 bg-green-50 rounded-lg border border-green-200">
        <p className="text-sm text-green-700 font-medium flex items-center mb-1">
          <DollarSign size={16} className="mr-1" /> Best Price Offer:
        </p>
        <p className="text-3xl font-extrabold text-green-600">
          ${product.bestPrice.toFixed(2)}
        </p>
        <p className="text-sm text-gray-600 flex items-center mt-1">
          <MapPin size={14} className="mr-1 text-gray-500" /> Found at: **
          {product.bestShop}**
        </p>
      </div>
      
      {/* --- Lista Ofertelor de Cumpărare (Buy Offers) --- */}
      <div className="mb-6 border-b pb-4">
        <h4 className="text-xl font-bold text-gray-700 mb-3">
            Your Buy Offers ({buyOffers.length})
        </h4>
        {buyOffers.length === 0 ? (
            <p className="text-gray-500 italic text-sm">You have no active Buy Offers.</p>
        ) : (
            <div className="space-y-3">
                {buyOffers.slice(0, 2).map(offer => ( 
                    <div 
                        key={offer.id} 
                        className="flex items-center justify-between p-2 bg-indigo-100 rounded-lg border border-indigo-300 shadow-sm"
                    >
                        <BuyOfferDisplay offer={offer} /> 
                    </div>
                ))}
                {buyOffers.length > 2 && (
                    <p className="text-xs text-gray-500 mt-1">... and {buyOffers.length - 2} more. View Details to manage.</p>
                )}
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
            sellOffers.slice(0, 2).map(offer => ( 
              <div 
                key={offer.id} 
                className="flex items-center justify-between p-2 bg-white border rounded-lg shadow-sm"
              >
                <div className="flex flex-col flex-1 min-w-0">
                  <p className="text-xl font-extrabold text-red-600">${offer.price.toFixed(2)}</p>
                  <p className="text-xs text-gray-500 truncate">
                    Agent: <span className="font-semibold">{offer.agent.name}</span>
                  </p>
                </div>

                <div className="flex flex-col items-end mx-4 min-w-[100px]">
                    <p className="text-xs text-yellow-600 font-medium">
                        {formatRating(offer.agent.rating)}
                    </p>
                </div>
              </div>
            ))
          )}
          {sellOffers.length > 2 && (
             <p className="text-xs text-gray-500 mt-1">... and {sellOffers.length - 2} more. View Details to purchase.</p>
          )}
        </div>
      </div>

      <button
        onClick={() => onViewDetails(product)}
        className="mt-6 w-full py-3 bg-blue-600 text-white rounded-lg font-bold flex items-center justify-center hover:bg-blue-700 transition"
      >
        View Product Details
        <ChevronRight size={20} className="ml-2" />
      </button>
    </div>
  );
};

export default ProductCard;