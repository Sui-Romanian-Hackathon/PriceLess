// src/components/ProductDetailView.tsx

import type { FC } from "react";
import {
  DollarSign,
  Info,
  CornerUpLeft,
  ChevronRight,
  ShoppingCart,
  MapPin, 
} from "lucide-react";
import type { Product } from "../types";
import type { SellOffer, BuyOffer } from "../types/marketTypes"; 
import ProductCardOffersPanel from "./ProductCardOffersPanel"; // ⬅️ ASIGURĂ-TE CĂ ACESTA ESTE CORECT

// INTERFAȚĂ CORECTĂ
interface ProductDetailViewProps {
  product: Product;
  onBack: () => void;
  onCreateBuyOffer: (product: Product) => void;
  onBuySellOffer: (offer: SellOffer) => void;
  onUpdateBuyOffer: (offer: BuyOffer) => void;
  onDeleteBuyOffer: (offer: BuyOffer) => void;
  
  sellOffers: SellOffer[];
  buyOffers: BuyOffer[];
}

const ProductDetailView: FC<ProductDetailViewProps> = ({
  product,
  onBack,
  onCreateBuyOffer,
  onBuySellOffer,
  onUpdateBuyOffer,
  onDeleteBuyOffer,
  sellOffers, 
  buyOffers,  
}) => {
  
  // Găsirea celei mai bune oferte pentru butonul Quick Buy
  const bestSellOffer = sellOffers.length > 0
    ? sellOffers.reduce((min, offer) => offer.price < min.price ? offer : min, sellOffers[0])
    : null;

  return (
    <div className="min-h-screen bg-gray-50 p-6 sm:p-8 font-sans">
      <div className="max-w-4xl mx-auto">
        
        {/* Buton Înapoi */}
        <button
          onClick={onBack}
          className="flex items-center text-blue-600 hover:text-blue-800 font-semibold mb-6 transition px-3 py-1 rounded-lg bg-white shadow-sm hover:shadow-md"
        >
          <CornerUpLeft size={18} className="mr-2" /> Back to List
        </button>

        {/* --- Secțiunea de Detalii Produs (2 Coloane) --- */}
        <div className="bg-white p-6 sm:p-8 rounded-2xl shadow-xl border-t-4 border-blue-500 mb-8">
          {/* ... (Antetul și cele 2 coloane cu preț/descriere) ... */}
          <h1 className="text-4xl font-extrabold text-gray-900 mb-6">
            {product.name}
          </h1>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Coloana 1: Preț și Best Offer */}
            <div className="border-r md:border-r-2 border-gray-100 pr-4">
              <h2 className="text-2xl font-bold text-gray-700 mb-3 flex items-center">
                <DollarSign size={24} className="mr-2 text-green-600" /> Best Price Offer
              </h2>
              <p className="text-5xl font-extrabold text-green-600 mb-3 leading-tight">
                RON {product.bestPrice.toFixed(2)}
              </p>
              <p className="text-md text-gray-600 flex items-center">
                <MapPin size={16} className="mr-2 text-red-400" /> Found at: **{product.bestShop}**
              </p>
              <button 
                onClick={() => bestSellOffer && onBuySellOffer(bestSellOffer)}
                disabled={!bestSellOffer}
                className="mt-4 w-full py-3 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 transition shadow-md disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
              >
                <ShoppingCart size={20} className="mr-2" /> Purchase Current Best Offer
              </button>
            </div>

            {/* Coloana 2: Descriere și Specificatii */}
            <div className="pl-4">
              <h2 className="text-2xl font-bold text-gray-700 mb-3 flex items-center">
                <Info size={24} className="mr-2 text-blue-500" /> Description & Specs
              </h2>
              <p className="text-gray-700 italic mb-4">
                {product.description}
              </p>
              <ul className="space-y-2 text-gray-600 text-sm">
                {product.details.map((detail, index) => (
                  <li key={index} className="flex items-start">
                    <ChevronRight size={18} className="mr-2 mt-0.5 text-blue-500 flex-shrink-0" />
                    <span className="flex-grow">{detail}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
        
        {/* --- Secțiunea de Liste de Oferte (Panoul Principal) --- */}
        <div className="mt-10">
          <ProductCardOffersPanel // ⬅️ ACEASTA ESTE COMPONENTA CHEIE
            product={product}
            sellOffers={sellOffers}
            buyOffers={buyOffers}
            onCreateBuyOffer={onCreateBuyOffer}
            onBuySellOffer={onBuySellOffer}
            onUpdateBuyOffer={onUpdateBuyOffer} 
            onDeleteBuyOffer={onDeleteBuyOffer} 
          />
        </div>
      </div>
    </div>
  );
};

export default ProductDetailView;