import { PayPalButtons } from '@paypal/react-paypal-js';
import { supabase, getAccountId } from '../lib/supabase';

interface PayPalButtonProps {
  amount: number;
  onSuccess: (message: string) => void;
  onError: (message: string) => void;
}

export default function PayPalButton({ amount, onSuccess, onError }: PayPalButtonProps) {
  const createOrder = async () => {
    try {
      const accountId = await getAccountId();
      if (!accountId) {
        throw new Error('Account not found');
      }

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/create-paypal-order`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
          },
          body: JSON.stringify({
            amount,
            accountId,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create order');
      }

      return data.orderId;
    } catch (error) {
      onError('Failed to create PayPal order');
      throw error;
    }
  };

  const onApprove = async (data: any) => {
    try {
      const accountId = await getAccountId();
      if (!accountId) {
        throw new Error('Account not found');
      }

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/capture-paypal-order`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
          },
          body: JSON.stringify({
            orderId: data.orderID,
            accountId,
          }),
        }
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to capture order');
      }

      const { error: creditError } = await supabase.rpc('add_credits', {
        p_account_id: accountId,
        p_amount: amount,
        p_description: `PayPal purchase - ${amount} credits`,
        p_metadata: {
          purchase_type: 'paypal',
          amount: amount,
          orderId: data.orderID,
          timestamp: new Date().toISOString(),
        },
      });

      if (creditError) {
        onError('Payment successful but failed to add credits. Please contact support.');
        return;
      }

      onSuccess(`Successfully purchased ${amount} credits via PayPal!`);
    } catch (error) {
      onError('Failed to complete payment');
    }
  };

  return (
    <div style={{ maxWidth: '300px', marginLeft: 'auto' }}>
      <PayPalButtons
        style={{
          layout: 'horizontal',
          color: 'blue',
          shape: 'rect',
          label: 'pay',
          height: 48,
        }}
        createOrder={createOrder}
        onApprove={onApprove}
        onError={(err) => {
          onError('PayPal payment failed');
        }}
      />
    </div>
  );
}
