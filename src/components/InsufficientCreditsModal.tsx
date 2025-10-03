import { X, CreditCard } from 'lucide-react';

interface InsufficientCreditsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddCredits: () => void;
  currentBalance: number;
  requiredCredits: number;
}

export default function InsufficientCreditsModal({
  isOpen,
  onClose,
  onAddCredits,
  currentBalance,
  requiredCredits
}: InsufficientCreditsModalProps) {
  if (!isOpen) return null;

  const creditsNeeded = requiredCredits - currentBalance;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />

      <div className="relative bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 md:p-8 animate-in fade-in zoom-in duration-200">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-gray-400 hover:text-gray-600 transition-colors rounded-lg hover:bg-gray-100"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex flex-col items-center text-center mb-6">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
            <CreditCard className="w-8 h-8 text-red-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Insufficient Credits</h2>
          <p className="text-gray-600">
            You need <span className="font-bold text-red-600">{creditsNeeded} more credit{creditsNeeded !== 1 ? 's' : ''}</span> to perform this analysis.
          </p>
        </div>

        <div className="bg-gray-50 rounded-xl p-4 mb-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-600">Current Balance</span>
            <span className="text-lg font-bold text-gray-900">{currentBalance} credits</span>
          </div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-600">Required</span>
            <span className="text-lg font-bold text-gray-900">{requiredCredits} credits</span>
          </div>
          <div className="border-t border-gray-200 my-2" />
          <div className="flex items-center justify-between">
            <span className="text-sm font-semibold text-gray-700">Need to Purchase</span>
            <span className="text-lg font-bold text-red-600">{creditsNeeded} credits</span>
          </div>
        </div>

        <div className="flex flex-col gap-3">
          <button
            onClick={onAddCredits}
            className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-semibold px-6 py-3 rounded-xl transition-all hover:shadow-lg flex items-center justify-center gap-2"
          >
            <CreditCard className="w-5 h-5" />
            Add Credits
          </button>
          <button
            onClick={onClose}
            className="w-full bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold px-6 py-3 rounded-xl transition-all"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
