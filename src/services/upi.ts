/**
 * UPI Payment Engine for The Raakky Chicken
 * Supports Direct UPI Payments: Google Pay, PhonePe, Paytm, Any UPI App, and Dynamic QR Code.
 * 0% Gateway Fees - Direct to Counter Bank Account.
 */

export const RAAKKY_UPI_CONFIG = {
  vpa: '9843599030@okaxis', // Primary Raakky Chicken Counter UPI ID
  merchantName: 'The Raakky Chicken',
  storePhone: '+919843599030',
  outletName: 'Press Colony Counter, Coimbatore',
};

export interface UpiPaymentIntentOptions {
  amount: number; // in Rupees, e.g. 240
  orderNumber: string;
  customerName?: string;
  customVpa?: string;
}

/**
 * Builds standard NPCI UPI specification URL
 * Format: upi://pay?pa={vpa}&pn={name}&am={amount}&cu=INR&tn={note}&tr={ref}
 */
export function buildStandardUpiUrl(options: UpiPaymentIntentOptions): string {
  const vpa = options.customVpa || RAAKKY_UPI_CONFIG.vpa;
  const note = `Raakky Order ${options.orderNumber}`;
  const ref = `TRC_${options.orderNumber}_${Date.now().toString().slice(-4)}`;

  const params = new URLSearchParams({
    pa: vpa,
    pn: RAAKKY_UPI_CONFIG.merchantName,
    am: options.amount.toFixed(2),
    cu: 'INR',
    tn: note,
    tr: ref,
  });

  return `upi://pay?${params.toString()}`;
}

/**
 * Generates app-specific intent URLs for mobile deep-linking
 */
export function buildAppIntentUrl(
  app: 'gpay' | 'phonepe' | 'paytm' | 'generic',
  options: UpiPaymentIntentOptions
): string {
  const standardUrl = buildStandardUpiUrl(options);
  const query = standardUrl.replace('upi://pay?', '');

  switch (app) {
    case 'gpay':
      // Google Pay UPI Intent
      return `tez://upi/pay?${query}`;
    case 'phonepe':
      // PhonePe UPI Intent
      return `phonepe://pay?${query}`;
    case 'paytm':
      // Paytm UPI Intent
      return `paytmmp://pay?${query}`;
    case 'generic':
    default:
      return standardUrl;
  }
}

/**
 * Generates an SVG or high-res QR code URL for the given UPI pay string
 */
export function getUpiQrCodeUrl(upiUrl: string, size: number = 280): string {
  // Uses standard public QR Code generator with error correction
  const encoded = encodeURIComponent(upiUrl);
  return `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&margin=10&data=${encoded}`;
}

/**
 * Validates standard 12-digit UPI Transaction Reference (UTR)
 */
export function isValidUtrNumber(utr: string): boolean {
  const cleaned = utr.trim().replace(/\s+/g, '');
  return /^[0-9a-zA-Z]{12}$/.test(cleaned);
}
