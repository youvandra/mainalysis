import { useState } from 'react';
import { Plus, Mail, CreditCard } from 'lucide-react';
import { PayPalScriptProvider } from '@paypal/react-paypal-js';
import { supabase, getAccountId } from '../lib/supabase';
import { walletManager } from '../lib/wallet';
import PayPalButton from './PayPalButton';
import domainIcon from '../assets/DOM(3).svg';

export default function CreditPurchaseCard() {
  const [customAmount, setCustomAmount] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
  const [showPayPal, setShowPayPal] = useState(false);
  const [paypalAmount, setPaypalAmount] = useState(0);

  const quickAmounts = [10, 50, 100, 500];

  const handleCustomAdd = () => {
    const amount = parseInt(customAmount);
    if (isNaN(amount) || amount <= 0) {
      setMessage({ type: 'error', text: 'Please enter a valid amount' });
      return;
    }
    handlePayPalPurchase(amount);
  };

  const handleRequestCredits = () => {
    const walletAddress = walletManager.getAddress();
    if (!walletAddress) {
      setMessage({ type: 'error', text: 'Please connect your wallet first' });
      return;
    }

    const subject = `Mainalysis Request Free Credits: ${walletAddress}`;
    const mailtoLink = `mailto:kucingplaygame@gmail.com?subject=${encodeURIComponent(subject)}`;
    window.location.href = mailtoLink;
  };

  const handlePayPalPurchase = (amount: number) => {
    if (!walletManager.isConnected()) {
      setMessage({ type: 'error', text: 'Please connect your wallet first' });
      return;
    }
    setMessage(null);
    setPaypalAmount(amount);
    setCustomAmount('');
    setShowPayPal(true);
  };

  const handlePayPalSuccess = (msg: string) => {
    setMessage({ type: 'success', text: msg });
    setShowPayPal(false);
    setPaypalAmount(0);
    setCustomAmount('');
  };

  const handlePayPalError = (msg: string) => {
    setMessage({ type: 'error', text: msg });
    setShowPayPal(false);
    setPaypalAmount(0);
  };

  const paypalClientId = import.meta.env.VITE_PAYPAL_CLIENT_ID;
  const hasPayPalConfig = paypalClientId && paypalClientId !== 'your_paypal_client_id_here';

  return (
    <div className="space-y-6">
      {message && (
        <div className={`p-3 rounded-lg ${
          message.type === 'success' ? 'bg-green-50 text-green-800 border border-green-200' : 'bg-red-50 text-red-800 border border-red-200'
        }`}>
          {message.text}
        </div>
      )}

      {hasPayPalConfig && (
        <>
          <div>
            <label className="text-sm font-medium text-gray-700 mb-2 block">Purchase Credits</label>
            {showPayPal && paypalAmount > 0 ? (
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg border border-blue-200">
                  <div className="flex items-center gap-2">
                    <CreditCard className="w-5 h-5 text-blue-600" />
                    <span className="font-semibold text-blue-900">{paypalAmount} Credits</span>
                  </div>
                  <span className="text-lg font-bold text-blue-900">${(paypalAmount * 0.50).toFixed(2)}</span>
                </div>
                <PayPalScriptProvider options={{ clientId: paypalClientId, currency: 'USD' }}>
                  <PayPalButton
                    amount={paypalAmount}
                    onSuccess={handlePayPalSuccess}
                    onError={handlePayPalError}
                  />
                </PayPalScriptProvider>
                <button
                  onClick={() => { setShowPayPal(false); setPaypalAmount(0); }}
                  className="w-full py-2 text-sm text-gray-600 hover:text-gray-900 transition-colors"
                >
                  Cancel
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-3">
                {quickAmounts.map((amount) => (
                  <button
                    key={amount}
                    onClick={() => handlePayPalPurchase(amount)}
                    className="flex items-center justify-between py-3 px-4 bg-gradient-to-r from-blue-50 to-blue-100 hover:from-blue-100 hover:to-blue-200 text-blue-700 font-semibold rounded-xl border-2 border-blue-200 transition-all hover:shadow-md"
                  >
                    <div className="flex items-center gap-2">
                      <img src={domainIcon} alt="Credit" className="w-4 h-4" />
                      <span>{amount}</span>
                    </div>
                    <span className="text-xs font-medium">${(amount * 0.50).toFixed(2)}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </>
      )}

      {!showPayPal && (
        <div>
          <label className="text-sm font-medium text-gray-700 mb-2 block">Custom Amount</label>
          <div className="flex gap-2">
            <div className="flex-1 relative">
              <input
                type="number"
                min="1"
                value={customAmount}
                onChange={(e) => setCustomAmount(e.target.value)}
                placeholder="Enter credits amount"
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-blue-500 transition-colors"
              />
            </div>
            <button
              onClick={handleCustomAdd}
              disabled={!customAmount}
              className="px-6 py-3 bg-gradient-to-r from-blue-50 to-blue-100 hover:from-blue-100 hover:to-blue-200 text-blue-700 font-semibold rounded-xl border-2 border-blue-200 transition-all hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              <span>Buy</span>
            </button>
          </div>
        </div>
      )}

      <div className="p-4 bg-gray-50 rounded-xl border border-gray-200">
        <p className="text-sm font-medium text-gray-900 mb-2"><b>GET FREE CREDITS</b></p>
        <p className="text-xs text-gray-600 mb-3">
          Free credits will be added to your account within 1 minute of sending the email.
        </p>
        <button
          onClick={handleRequestCredits}
          className="w-full flex items-center justify-center gap-2 py-2.5 px-4 bg-gradient-to-r from-gray-100 to-gray-200 hover:from-gray-200 hover:to-gray-300 text-gray-700 font-medium rounded-lg border border-gray-300 transition-all hover:shadow-sm text-sm"
        >
          <Mail className="w-4 h-4" />
          <span>Request Credits</span>
        </button>
      </div>
    </div>
  );
}
