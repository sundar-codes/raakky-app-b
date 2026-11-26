export interface IndianPhoneValidationResult {
  isValid: boolean;
  e164: string;
  cleaned10: string;
  error?: string;
}

/**
 * Validates and canonicalizes an Indian mobile number (+91 followed by 10 digits starting with 6-9).
 * Rejects non-Indian country codes (e.g. +1, +44) and alphabetic characters.
 */
export function validateIndianPhoneNumber(rawPhone: unknown): IndianPhoneValidationResult {
  if (typeof rawPhone !== 'string') {
    return { isValid: false, e164: '', cleaned10: '', error: 'Mobile number is required' };
  }

  const trimmed = rawPhone.trim();
  if (!trimmed) {
    return { isValid: false, e164: '', cleaned10: '', error: 'Mobile number is required' };
  }

  // Reject alphabetic or unexpected characters immediately
  if (/[^0-9+\s\-().]/.test(trimmed)) {
    return {
      isValid: false,
      e164: '',
      cleaned10: '',
      error: 'Mobile number contains invalid characters',
    };
  }

  const compact = trimmed.replace(/[\s\-().]/g, '');
  if (!compact) {
    return { isValid: false, e164: '', cleaned10: '', error: 'Mobile number is required' };
  }

  let digits = '';
  if (compact.startsWith('+')) {
    if (!compact.startsWith('+91')) {
      return {
        isValid: false,
        e164: '',
        cleaned10: '',
        error: 'Only Indian mobile numbers with +91 country code are supported',
      };
    }
    const rest = compact.slice(3);
    if (!/^\d+$/.test(rest)) {
      return {
        isValid: false,
        e164: '',
        cleaned10: '',
        error: 'Please enter a valid 10-digit Indian mobile number after +91',
      };
    }
    digits = rest;
  } else {
    if (!/^\d+$/.test(compact)) {
      return {
        isValid: false,
        e164: '',
        cleaned10: '',
        error: 'Please enter a valid 10-digit Indian mobile number',
      };
    }
    digits = compact;
    if (digits.length === 11 && digits.startsWith('0')) {
      digits = digits.slice(1);
    } else if (digits.length === 12 && digits.startsWith('91')) {
      digits = digits.slice(2);
    }
  }

  if (digits.length !== 10) {
    return {
      isValid: false,
      e164: '',
      cleaned10: digits,
      error: 'Please enter a valid 10-digit mobile number with +91 country code',
    };
  }

  if (!/^[6-9]\d{9}$/.test(digits)) {
    return {
      isValid: false,
      e164: '',
      cleaned10: digits,
      error: 'Indian mobile numbers must start with 6, 7, 8, or 9',
    };
  }

  return {
    isValid: true,
    e164: `+91${digits}`,
    cleaned10: digits,
  };
}
