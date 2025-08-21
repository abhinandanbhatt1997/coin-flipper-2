import { supabase } from './supabase';
import toast from 'react-hot-toast';

declare global {
  interface Window {
    Razorpay: any;
  }
}

export const loadRazorpayScript = (): Promise<boolean> => {
  return new Promise((resolve) => {
    // Check if Razorpay is already loaded
    if (window.Razorpay) {
      resolve(true);
      return;
    }

    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
};

interface RazorpayCheckoutOptions {
  orderId: string;
  amount: number; // Amount in paise
  userId: string;
  userEmail?: string;
  userPhone?: string;
  onSuccess?: () => void;
  onFailure?: (error: any) => void;
}

export const openRazorpayCheckout = async ({
  orderId,
  amount,
  userId,
  userEmail,
  userPhone,
  onSuccess,
  onFailure
}: RazorpayCheckoutOptions) => {
  try {
    // Load Razorpay script
    const isLoaded = await loadRazorpayScript();
    
    if (!isLoaded) {
      throw new Error('Failed to load Razorpay SDK');
    }

    const options = {
      key: 'rzp_test_R7vb9wFN6wVXig', // Your Razorpay Key ID
      amount: amount, // Amount in paise
      currency: 'INR',
      order_id: orderId,
      name: 'Coin Flip Fortune',
      description: 'Wallet Top-up',
      image: '/favicon.ico',
      prefill: {
        email: userEmail,
        contact: userPhone,
      },
      theme: {
        color: '#8B5CF6', // Purple theme to match your app
      },
      handler: async (response: any) => {
        try {
          // Call verify-payment edge function
          const { data, error } = await supabase.functions.invoke('verify-payment', {
            body: {
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
              userId: userId,
              amount: Math.floor(amount / 100) // Convert paise to rupees
            }
          });

          if (error) {
            throw new Error(error.message);
          }

          if (data.success) {
            toast.success(`Payment successful! ₹${Math.floor(amount / 100)} added to wallet`);
            onSuccess?.();
          } else {
            throw new Error(data.error || 'Payment verification failed');
          }
        } catch (error: any) {
          console.error('Payment verification error:', error);
          toast.error(error.message || 'Payment verification failed');
          onFailure?.(error);
        }
      },
      modal: {
        ondismiss: () => {
          toast.error('Payment cancelled');
          onFailure?.(new Error('Payment cancelled by user'));
        },
      },
    };

    const razorpay = new window.Razorpay(options);
    razorpay.open();
  } catch (error: any) {
    console.error('Razorpay checkout error:', error);
    toast.error(error.message || 'Failed to open payment gateway');
    onFailure?.(error);
  }
};