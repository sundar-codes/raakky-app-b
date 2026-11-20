export interface RazorpayOptions {
  key: string;
  amount: number; // in paise
  currency: string;
  name: string;
  description: string;
  image?: string;
  order_id: string;
  prefill?: {
    name?: string;
    contact?: string;
    email?: string;
  };
  theme?: {
    color?: string;
  };
  handler: (response: {
    razorpay_payment_id: string;
    razorpay_order_id: string;
    razorpay_signature: string;
  }) => void;
  modal?: {
    ondismiss?: () => void;
  };
}

export async function loadRazorpayScript(): Promise<boolean> {
  return new Promise(resolve => {
    if ((window as any).Razorpay) {
      resolve(true);
      return;
    }
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
}

export async function openRazorpayCheckout(
  options: RazorpayOptions,
  isDevSimulation: boolean = false
): Promise<void> {
  const loaded = await loadRazorpayScript();

  if (!loaded || isDevSimulation || options.key.includes('rzp_test_raakky')) {
    const simulateSuccess = window.confirm(
      `[Razorpay Gateway Simulation]\n\nPay ₹${(options.amount / 100).toFixed(0)} to The Raakky Chicken?\n\nClick OK to simulate successful payment, or Cancel to simulate failure.`
    );

    if (simulateSuccess) {
      setTimeout(() => {
        options.handler({
          razorpay_payment_id: `pay_sim_${Date.now()}`,
          razorpay_order_id: options.order_id,
          razorpay_signature: `sig_sim_${Date.now()}`,
        });
      }, 500);
    } else {
      if (options.modal?.ondismiss) {
        options.modal.ondismiss();
      }
    }
    return;
  }

  const rzp = new (window as any).Razorpay(options);
  rzp.open();
}
