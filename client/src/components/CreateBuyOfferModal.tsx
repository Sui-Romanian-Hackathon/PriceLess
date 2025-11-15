// src/components/CreateBuyOfferModal.tsx (COMPLETAT)

import type { FC } from "react";
import { X, Target, Check, DollarSign, Clock } from "lucide-react";
import type { Product } from "../types";
import type { BuyOffer } from "../types/marketTypes";
import { useState, useEffect } from "react";

// Definim tipul de date trimis la confirmare (Create sau Update)
interface BuyOfferSubmitData {
    productId: string;
    type: 'TargetPrice' | 'Deadline';
    targetPrice: number | null;
    deadline: string | null;
}

interface CreateBuyOfferModalProps {
  isOpen: boolean;
  onClose: () => void;
  product: Product;
  offerToEdit: BuyOffer | null; 
  // onConfirm este ASINCRON și trimite ID-ul ofertei dacă e în edit mode
  onConfirm: (data: BuyOfferSubmitData, offerId: string | null) => Promise<void>; 
}

const CreateBuyOfferModal: FC<CreateBuyOfferModalProps> = ({ isOpen, onClose, product, offerToEdit, onConfirm }) => {
  
  const isEditMode = offerToEdit !== null;
  const modalTitle = isEditMode ? 'Edit Buy Offer' : 'Create Buy Offer';
  const submitButtonText = isEditMode ? 'Update Offer' : 'Confirm Buy Offer';

  const [offerType, setOfferType] = useState<'TargetPrice' | 'Deadline'>('TargetPrice');
  const [targetPrice, setTargetPrice] = useState<string>('');
  const [deadline, setDeadline] = useState<string>('');
  const [error, setError] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false); 

  // Setează starea inițială la deschidere sau când offerToEdit se schimbă
  useEffect(() => {
    if (offerToEdit) {
      setOfferType(offerToEdit.type);
      setTargetPrice(offerToEdit.targetPrice !== null ? offerToEdit.targetPrice.toString() : '');
      setDeadline(offerToEdit.deadline || '');
    } else {
      // Resetează pentru modul Create
      setOfferType('TargetPrice');
      setTargetPrice('');
      setDeadline('');
    }
    setError('');
  }, [offerToEdit, isOpen]);


  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    let data: BuyOfferSubmitData = {
        productId: product.id,
        type: offerType,
        targetPrice: null,
        deadline: null,
    };

    if (offerType === 'TargetPrice') {
        const price = parseFloat(targetPrice);
        if (isNaN(price) || price <= 0) {
            setError('Please enter a valid target price.');
            setIsLoading(false);
            return;
        }
        data.targetPrice = price;
    } else { // Deadline
        if (!deadline) {
            setError('Please select a deadline date.');
            setIsLoading(false);
            return;
        }
        data.deadline = deadline;
    }

    try {
        await onConfirm(data, isEditMode ? offerToEdit!.id : null);
        onClose(); 
    } catch (e) {
        setError("Transaction failed. Check console for details.");
    } finally {
        setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-gray-900 bg-opacity-75 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg overflow-hidden transform transition-all duration-300 scale-100">
        
        {/* Header */}
        <div className="p-6 border-b flex justify-between items-center bg-blue-500 text-white">
          <h2 className="text-2xl font-bold flex items-center">
            <DollarSign size={24} className="mr-2" /> {modalTitle}
          </h2>
          <button onClick={onClose} className="p-2 rounded-full hover:bg-blue-600 transition disabled:opacity-50" disabled={isLoading}>
            <X size={20} />
          </button>
        </div>

        {/* Product Info */}
        <div className="p-6 bg-gray-50 border-b">
            <p className="text-lg font-semibold text-gray-800">Product: **{product.name}**</p>
            <p className="text-sm text-gray-500">Current Best Price: ${product.bestPrice.toFixed(2)}</p>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          
          {/* ⬅️ RESTABILIT: Offer Type Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Select Offer Type:</label>
            <div className="flex space-x-4">
              <label 
                className={`flex items-center p-3 rounded-lg border cursor-pointer w-1/2 transition ${
                  offerType === 'TargetPrice' ? 'bg-indigo-100 border-indigo-500' : 'bg-white border-gray-300 hover:bg-gray-50'
                }`}
              >
                <input
                  type="radio"
                  name="offerType"
                  value="TargetPrice"
                  checked={offerType === 'TargetPrice'}
                  onChange={() => setOfferType('TargetPrice')}
                  className="mr-2 text-indigo-600 focus:ring-indigo-500"
                />
                <Target size={18} className="mr-2 text-indigo-600" />
                <span className="font-medium text-gray-800">Target Price</span>
              </label>

              <label 
                className={`flex items-center p-3 rounded-lg border cursor-pointer w-1/2 transition ${
                  offerType === 'Deadline' ? 'bg-orange-100 border-orange-500' : 'bg-white border-gray-300 hover:bg-gray-50'
                }`}
              >
                <input
                  type="radio"
                  name="offerType"
                  value="Deadline"
                  checked={offerType === 'Deadline'}
                  onChange={() => setOfferType('Deadline')}
                  className="mr-2 text-orange-600 focus:ring-orange-500"
                />
                <Clock size={18} className="mr-2 text-orange-600" />
                <span className="font-medium text-gray-800">Deadline</span>
              </label>
            </div>
          </div>

          {/* ⬅️ RESTABILIT: Input Fields based on Type */}
          {offerType === 'TargetPrice' ? (
            <div>
              <label htmlFor="targetPrice" className="block text-sm font-medium text-gray-700 mb-2">
                Target Price (The maximum price you are willing to pay)
              </label>
              <input
                id="targetPrice"
                type="number"
                step="0.01"
                min="0.01"
                value={targetPrice}
                onChange={(e) => setTargetPrice(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500 transition"
                placeholder={`e.g., ${product.bestPrice * 0.95}`}
                required
              />
            </div>
          ) : (
            <div>
              <label htmlFor="deadline" className="block text-sm font-medium text-gray-700 mb-2">
                Deadline (Automatically purchase the cheapest offer found until this date)
              </label>
              <input
                id="deadline"
                type="date"
                min={new Date().toISOString().split('T')[0]} 
                value={deadline}
                onChange={(e) => setDeadline(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-orange-500 focus:border-orange-500 transition"
                required
              />
            </div>
          )}


          {/* Error Message */}
          {error && (
            <div className="p-3 bg-red-100 border border-red-400 text-red-700 rounded-lg">
              {error}
            </div>
          )}

          {/* Submit Button */}
          <div className="pt-4">
            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 bg-green-600 text-white font-bold rounded-lg flex items-center justify-center hover:bg-green-700 transition shadow-lg disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <>Processing...</>
              ) : (
                <><Check size={20} className="mr-2" /> {submitButtonText}</>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateBuyOfferModal;