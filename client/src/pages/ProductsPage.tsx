import { useState, useMemo, type FC } from "react";
import { List, CornerUpLeft, User, LogOut } from "lucide-react";
import { mockProducts } from "../mocks/mockProducts";
import { useAuth } from "../context/AuthContext";
import { useUserMarket } from "../context/UserMarketContext";
import {
    useSuiClient,
    useCurrentAccount,
    useSignAndExecuteTransaction,
} from "@mysten/dapp-kit";
import type { Product } from "../types";
import ProductCard from "../components/ProductCard";
import ProductDetailView from "../components/ProductViewDetail";
import CreateBuyOfferModal from "../components/CreateBuyOfferModal";
import AccessBlocker from "../components/accessBlocker";
import { createManualBuyTransaction } from "../services/transactions/manualBuyTx";

import type { SellOffer, BuyOffer } from "../types/marketTypes";
import { getOffersByProductId } from "../mocks/marketMockData";

const CONFIG = {
    PRICELESS_PACKAGE: import.meta.env.VITE_PRICELESS_PACKAGE_ID || '0x...',
    PLATFORM_REGISTRY: import.meta.env.VITE_PLATFORM_REGISTRY_ID || '0x...',
    RON_PACKAGE_ID: import.meta.env.VITE_RON_PACKAGE_ID || '0x...',
    SHOP: import.meta.env.VITE_SHOP || '0x...',
};


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
      logout,
      userId,
      walletAddress,
  } = useAuth();

  const { userBuyOffers, createBuyOffer, deleteBuyOffer, updateBuyOffer } = useUserMarket();

  // Sui Hooks
  const suiClient = useSuiClient();
  const account = useCurrentAccount();
  const currentAddress = account?.address || null;

  const { mutateAsync: signAndExecute } = useSignAndExecuteTransaction(); 

  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [productToOffer, setProductToOffer] = useState<Product | null>(null);
  const [offerToEdit, setOfferToEdit] = useState<BuyOffer | null>(null); 
  

  const handleViewDetails = (product: Product) => {
    setSelectedProduct(product);
    window.scrollTo(0, 0);
  };

  const [sellOffersCache, setSellOffersCache] = useState<Map<string, SellOffer[]>>(new Map());

  const getCombinedOffers = useMemo(() => (productId: string) => {
      // Find the product to match by name
      const product = mockProducts.find(p => p.id === productId);

      // Match buy offers either by:
      // 1. productId (mock ID like '1', '2', '3', '4')
      // 2. productId matching product name (from blockchain)
      const buyOffers = userBuyOffers.filter(offer => {
        const matches = offer.productId === productId ||
               (product && offer.productId === product.name) ||
               (product && offer.productId.toLowerCase() === product.name.toLowerCase());

        if (matches) {
          console.log(`✅ MATCHED: Offer productId "${offer.productId}" matches Product ID "${productId}"`);

          // Fetch sell offers for this buy offer from database
          const buyOfferId = offer.id;
          if (!sellOffersCache.has(buyOfferId)) {
            fetch(`http://localhost:3000/api/sell-offers/buy-offer/${buyOfferId}`)
              .then(res => res.json())
              .then(data => {
                console.log(`📦 Sell offers for buy offer ${buyOfferId}:`, data.data);
                setSellOffersCache(prev => new Map(prev).set(buyOfferId, data.data || []));
              })
              .catch(err => console.error(`Error fetching sell offers for ${buyOfferId}:`, err));
          }
        }

        return matches;
      });

      // Collect all sell offers from cache for matched buy offers
      const sellOffers: SellOffer[] = [];
      buyOffers.forEach(offer => {
        const cachedOffers = sellOffersCache.get(offer.id);
        if (cachedOffers) {
          // Convert database sell offers to mock SellOffer type
          cachedOffers.forEach((dbOffer: any) => {
            sellOffers.push({
              id: dbOffer.sell_offer_id || `db-${dbOffer.id}`,
              buy_offer_id: offer.id, // Link to the buy offer
              price: Number(dbOffer.price) / 100, // Convert from base units
              agent: {
                name: dbOffer.agent_id || 'Database Agent',
                rating: 4.5,
                address: dbOffer.agent_address,
              },
              shop: dbOffer.store_link || '',
              quantity: 1,
              productId: offer.productId,
              agent_id: dbOffer.agent_id,
              agent_address: dbOffer.agent_address,
            });
          });
        }
      });

      // Fallback to mock data if no database offers found
      if (sellOffers.length === 0) {
        const { sellOffers: mockSellOffers } = getOffersByProductId(productId);
        return { sellOffers: mockSellOffers, buyOffers };
      }

      console.log(`🔍 DEBUG: Filtering for Product ID: ${productId}. Product: ${product?.name}. Found Buy Offers: ${buyOffers.length}. Sell Offers: ${sellOffers.length}`);

      return { sellOffers, buyOffers };
  }, [userBuyOffers, sellOffersCache]); 

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

  const handleBuySellOffer = async (offer: SellOffer) => {
      try {
          if (!currentAddress || !account) {
              throw new Error("Wallet not connected or account not found.");
          }

          if (!userId) {
              throw new Error("User ID not found. Please register first.");
          }

          // Get the matching buy offer using the buy_offer_id from sell offer
          const matchingBuyOffer = userBuyOffers.find(
              bo => bo.id === offer.buy_offer_id
          );

          if (!matchingBuyOffer) {
              throw new Error(`No matching buy offer found for sell offer ${offer.id}`);
          }

          console.log(`📦 Executing manual buy...`);
          console.log(`  Buy Offer ID: ${matchingBuyOffer.id}`);
          console.log(`  Buy Offer Full Data:`, matchingBuyOffer);
          console.log(`  Sell Offer ID: ${offer.id}`);
          console.log(`  Agent ID: ${offer.agent_id}`);
          console.log(`  User Address: ${userId}`);
          console.log(`  Sell Offer Price: RON ${offer.price}`);
          console.log(`  CONFIG:`, CONFIG);

          // Validate required fields
          if (!matchingBuyOffer.id) throw new Error("Missing Buy Offer ID");
          if (!offer.id) throw new Error("Missing Sell Offer ID");
          if (!offer.agent_id) throw new Error("Missing Agent ID - is it populated in the database?");
          if (!userId) throw new Error("Missing User Address");
          if (!CONFIG.PRICELESS_PACKAGE || CONFIG.PRICELESS_PACKAGE === '0x...') throw new Error("Missing VITE_PRICELESS_PACKAGE_ID env var");
          if (!CONFIG.PLATFORM_REGISTRY || CONFIG.PLATFORM_REGISTRY === '0x...') throw new Error("Missing VITE_PLATFORM_REGISTRY_ID env var");
          if (!CONFIG.RON_PACKAGE_ID || CONFIG.RON_PACKAGE_ID === '0x...') throw new Error("Missing VITE_RON_PACKAGE_ID env var");
          if (!CONFIG.SHOP || CONFIG.SHOP === '0x...') throw new Error("Missing VITE_SHOP_ID env var");

          // Calculate price difference with 5% fee added to total
          // Total to pay = sell_offer_price * 1.05 (5% fee)
          // Price difference = (sell_offer_price * 1.05) - buy_offer_price
          const sellOfferBaseUnits = Math.floor(offer.price * 100);
          const buyOfferBaseUnits = Math.floor((matchingBuyOffer.targetPrice || 0) * 100);

          const sellOfferWithFee = Math.floor((sellOfferBaseUnits * 105) / 100); // Add 5% fee
          const priceDifference = Math.max(0, sellOfferWithFee - buyOfferBaseUnits);

          console.log(`  Sell offer (base units): ${sellOfferBaseUnits}`);
          console.log(`  Sell offer with 5% fee: ${sellOfferWithFee}`);
          console.log(`  Buy offer (base units): ${buyOfferBaseUnits}`);
          console.log(`  Price difference to pay: ${priceDifference}`);

          // Build the transaction
          const tx = await createManualBuyTransaction({
              client: suiClient,
              currentAddress: currentAddress,
              buyOfferId: matchingBuyOffer.id,
              sellOfferId: offer.id,
              agentId: offer.agent_id, // Agent's object ID from SellOffer
              userAddress: userId,
              priceDifference: priceDifference,
              ...CONFIG,
          });

          // Execute transaction
          console.log("Submitting manual buy transaction for user signature...");

          const suiResult = await signAndExecute({
              transaction: tx,
              options: {
                  showEvents: true,
                  showObjectChanges: true,
                  showEffects: true,
              },
          } as any);

          console.log("Transaction response:", suiResult);
          const digest = (suiResult as any)?.digest;

          if (!digest) {
              throw new Error('Transaction failed: No digest returned');
          }

          console.log(`✅ Manual buy transaction successful! Digest: ${digest}`);
          alert(`Successfully purchased from ${offer.agent.name} for RON ${offer.price.toFixed(2)} + fee`);

      } catch (error) {
          console.error("Manual buy error:", error);
          alert(`Transaction Failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
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
                          onBuySellOffer={handleBuySellOffer}
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