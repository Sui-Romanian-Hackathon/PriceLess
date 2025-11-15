import { useState, useMemo, type FC } from "react"; 
import { List, CornerUpLeft, User, LogOut } from "lucide-react";
import { mockProducts } from "../mocks/mockProducts";
import { useAuth } from "../context/AuthContext";
import { useUserMarket } from "../context/UserMArketContext"; 
import type { Product } from "../types"; 
import ProductCard from "../components/ProductCard";
import ProductDetailView from "../components/ProductViewDetail";
import CreateBuyOfferModal from "../components/CreateBuyOfferModal";
import AccessBlocker from "../components/accessBlocker";

import type { SellOffer, BuyOffer } from "../types/marketTypes";
import { getOffersByProductId } from "../mocks/marketMockData";


interface BuyOfferSubmitData {
    productId: string;
    type: 'TargetPrice' | 'Deadline';
    targetPrice: number | null;
    deadline: string | null;
}

const ProductsPage: FC = () => {
  const { 
      hasAccess, 
      userRole, 
      logout
  } = useAuth();
  
  const { userBuyOffers, createBuyOffer, deleteBuyOffer, updateBuyOffer } = useUserMarket(); 

  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [productToOffer, setProductToOffer] = useState<Product | null>(null);
  const [offerToEdit, setOfferToEdit] = useState<BuyOffer | null>(null); 
  

  const handleViewDetails = (product: Product) => {
    setSelectedProduct(product);
    window.scrollTo(0, 0);
  };

  const getCombinedOffers = useMemo(() => (productId: string) => {
      const { sellOffers } = getOffersByProductId(productId);
      const buyOffers = userBuyOffers.filter(offer => offer.productId === productId);
      
      console.log(`DEBUG: Filtering for Product ID: ${productId}. Found Buy Offers: ${buyOffers.length}`);
      
      return { sellOffers, buyOffers };
  }, [userBuyOffers]); 

  // --- Funcțiile ASYNC (Handlere pentru oferte) ---
  
  const handleConfirmBuyOffer = async (data: BuyOfferSubmitData, offerId: string | null) => {
      try {
          if (offerId) {
              await updateBuyOffer(offerId, data); 
              alert(`Success! Offer ${offerId} successfully updated on Sui. Interface updated.`); 
          } else {
              await createBuyOffer(data); 
              alert(`Success! New offer created on Sui. Interface updated.`);
          }
      } catch (error) {
          alert(`Transaction Failed: Could not process the Buy Offer.`);
          console.error("Sui Transaction Error:", error);
      } finally {
          setIsModalOpen(false); 
          setProductToOffer(null);
          setOfferToEdit(null);
      }
  };

  const handleDeleteBuyOffer = async (offer: BuyOffer) => {
      if(confirm(`Are you sure you want to delete Buy Offer ${offer.id}?`)) {
          try {
              await deleteBuyOffer(offer.id); 
              alert(`Success! Offer ${offer.id} deleted from Sui. Interface updated.`); 
          } catch (error) {
              alert(`Transaction Failed: Could not delete the Buy Offer.`);
              console.error("Sui Transaction Error:", error);
          }
      }
  };

  const handleCreateBuyOffer = (product: Product) => {
      setProductToOffer(product);
      setOfferToEdit(null); 
      setIsModalOpen(true);
  };
  
  const handleUpdateBuyOffer = (offer: BuyOffer) => {
      const product = mockProducts.find(p => p.id === offer.productId);
      if (!product) return alert("Product not found for editing.");

      setProductToOffer(product);
      setOfferToEdit(offer); 
      setIsModalOpen(true);
  };

  const handleBuySellOffer = (offer: SellOffer) => {
      alert(`Buying offer from ${offer.agent.name} for $${offer.price.toFixed(2)}. Transaction sent to Sui.`);
  };

  // ===================================================================
  // 1. BLOCUL DE VERIFICARE A ACCESULUI (PRIORITATE MAXIMĂ)
  // ===================================================================
  if (!hasAccess) {
    // 🚨 Utilizează componenta AccessBlocker pentru a afișa mesajul de restricție.
    return <AccessBlocker />; 
  }
  
  // ===================================================================
  // 2. BLOCUL DE VIZUALIZARE DETALIATĂ
  // ===================================================================
  if (selectedProduct) {
    const { sellOffers, buyOffers } = getCombinedOffers(selectedProduct.id);
    
    return (
      <>
        <div className="p-6 sm:p-8 min-h-screen bg-gray-50"> 
            <button
                onClick={() => setSelectedProduct(null)} 
                className="flex items-center text-blue-600 hover:text-blue-800 font-semibold mb-6 transition px-3 py-1 rounded-lg bg-white shadow-sm hover:shadow-md"
            >
                <CornerUpLeft size={18} className="mr-2" /> Back to List
            </button>
            <ProductDetailView
                product={selectedProduct}
                onBack={() => setSelectedProduct(null)}
                onCreateBuyOffer={handleCreateBuyOffer}
                onBuySellOffer={handleBuySellOffer}
                onUpdateBuyOffer={handleUpdateBuyOffer}
                onDeleteBuyOffer={handleDeleteBuyOffer}
                sellOffers={sellOffers}
                buyOffers={buyOffers}
            />
        </div>
        
        {/* Modalul */}
        {isModalOpen && productToOffer && (
            <CreateBuyOfferModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                product={productToOffer}
                offerToEdit={offerToEdit} 
                onConfirm={handleConfirmBuyOffer}
            />
        )}
      </>
    );
  }


  // ===================================================================
  // 3. BLOCUL DE VIZUALIZARE LISTĂ (DEFAULT)
  // ===================================================================
  return (
    <>
      {/* Controale de Rol și Logout */}
      <div className="bg-white shadow-md p-4 flex items-center justify-between sticky top-0 z-10">
          <div className="flex items-center space-x-4">
              <User size={24} className="text-blue-500" />
              <span className="font-semibold text-gray-700">Role: **{userRole}**</span>
          </div>
          <button
              onClick={logout}
              className="py-2 px-4 bg-red-500 text-white font-bold rounded-lg hover:bg-red-600 transition flex items-center"
          >
              <LogOut size={18} className="mr-1" /> Logout
          </button>
      </div>

      <div className="p-8 min-h-screen bg-gray-100">
        <h1 className="text-4xl font-bold text-gray-900 mb-10 text-center flex items-center justify-center">
          <List size={36} className="mr-3 text-blue-500" /> PriceLess Offers List
        </h1>
        <div className="p-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {mockProducts.map(product => {
                  const { sellOffers, buyOffers } = getCombinedOffers(product.id);
                  
                  return (
                      <ProductCard
                          key={product.id}
                          product={product}
                          sellOffers={sellOffers}
                          buyOffers={buyOffers}
                          onViewDetails={handleViewDetails} 
                      />
                  );
              })}
          </div>
      </div>
      
      {/* Modalul */}
      {isModalOpen && productToOffer && (
          <CreateBuyOfferModal
              isOpen={isModalOpen}
              onClose={() => setIsModalOpen(false)}
              product={productToOffer}
              offerToEdit={offerToEdit} 
              onConfirm={handleConfirmBuyOffer}
          />
      )}
    </>
  );
};

export default ProductsPage;