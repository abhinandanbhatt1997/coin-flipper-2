import { RazorpayPayment } from '../types';

declare global {
  interface Window {
    Razorpay: any;
  }
}

export const loadRazorpayScript = (): Promise<boolean> => {
  return new Promise((resolve) => {
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
};

interface RazorpayOptions {
  amount: number;
  currency: string;
  orderId: string;
  userDetails: {
    name: string;
    email?: string;
    contact?: string;
  };
  onSuccess: (payment: RazorpayPayment) => void;
  onFailure: (error: any) => void;
}

export const openRazorpayCheckout = async (options: RazorpayOptions) => {
  const isLoaded = await loadRazorpayScript();
  
  if (!isLoaded) {
    throw new Error('Failed to load Razorpay SDK');
  }

  const razorpayOptions = {
    key: import.meta.env.VITE_RAZORPAY_KEY_ID,
    amount: options.amount,
    currency: options.currency,
    order_id: options.orderId,
    name: 'Money Pool Game',
    description: 'Wallet Top-up',
    image: '/favicon.ico',
    prefill: {
      name: options.userDetails.name,
      email: options.userDetails.email,
      contact: options.userDetails.contact,
    },
    theme: {
      color: '#10B981',
    },
    handler: options.onSuccess,
    modal: {
      ondismiss: () => {
        options.onFailure(new Error('Payment cancelled'));
      },
    },
  };

  const razorpay = new window.Razorpay(razorpayOptions);
  razorpay.open();
};