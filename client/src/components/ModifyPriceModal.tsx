import { useState } from 'react';
import type { BuyOffer } from '../types/marketTypes';
import { X } from 'lucide-react';

interface ModifyPriceModalProps {
  isOpen: boolean;
  offer: BuyOffer | null;
  onClose: () => void;
  onConfirm: (newPrice: number) => void;
}

const ModifyPriceModal: React.FC<ModifyPriceModalProps> = ({
  isOpen,
  offer,
  onClose,
  onConfirm,
}) => {
  const [newPrice, setNewPrice] = useState<string>(
    offer?.targetPrice?.toString() || ''
  );

  if (!isOpen || !offer) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const price = parseFloat(newPrice);
    if (isNaN(price) || price < 0) {
      alert('Please enter a valid price');
      return;
    }
    onConfirm(price);
    setNewPrice('');
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-2xl font-bold text-gray-800">Modify Offer Price</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 transition"
          >
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Current Price: RON {offer.targetPrice?.toFixed(2) || 'N/A'}
            </label>
            <input
              type="number"
              step="0.01"
              min="0"
              value={newPrice}
              onChange={(e) => setNewPrice(e.target.value)}
              placeholder="Enter new price in RON"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              autoFocus
            />
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 bg-gray-300 text-gray-800 font-semibold rounded-lg hover:bg-gray-400 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition"
            >
              Update Price
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ModifyPriceModal;
