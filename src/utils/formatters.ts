import { Language } from '../types';

export function formatCurrency(amount: number): string {
  return `₹${Math.round(amount).toLocaleString('en-IN')}`;
}

export function formatWeight(grams: number, lang: Language = 'en'): string {
  if (grams >= 1000) {
    const kg = grams / 1000;
    const kgStr = Number.isInteger(kg) ? kg.toString() : kg.toFixed(1);
    return lang === 'ta' ? `${kgStr} கிலோ` : `${kgStr} kg`;
  }
  return lang === 'ta' ? `${grams} கிராம்` : `${grams}g`;
}

export function formatPhone(phone: string): string {
  const cleaned = phone.replace(/\D/g, '');
  if (cleaned.length === 10) {
    return `+91 ${cleaned.slice(0, 5)} ${cleaned.slice(5)}`;
  }
  if (cleaned.length === 12 && cleaned.startsWith('91')) {
    return `+91 ${cleaned.slice(2, 7)} ${cleaned.slice(7)}`;
  }
  return phone;
}

export function formatOrderDate(isoString: string, lang: Language = 'en'): string {
  try {
    const date = new Date(isoString);
    const options: Intl.DateTimeFormatOptions = {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
      timeZone: 'Asia/Kolkata',
    };
    return new Intl.DateTimeFormat(lang === 'ta' ? 'ta-IN' : 'en-IN', options).format(date);
  } catch {
    return isoString;
  }
}

export interface LiveShopTimeInfo {
  isOpen: boolean;
  statusLabelEn: string;
  statusLabelTa: string;
  todayHoursEn: string;
  todayHoursTa: string;
  weekday: string;
  openingLabelEn: string;
  openingLabelTa: string;
}

export function calculateCoimbatoreShopHours(now: Date = new Date()): LiveShopTimeInfo {
  try {
    const parts = new Intl.DateTimeFormat('en-IN', {
      timeZone: 'Asia/Kolkata',
      weekday: 'long',
      hour: '2-digit',
      minute: '2-digit',
      hourCycle: 'h23',
    }).formatToParts(now);

    const values = Object.fromEntries(parts.map(p => [p.type, p.value]));
    const weekday = (values.weekday || 'Monday') as string;
    const hour = parseInt(values.hour || '0', 10);
    const minute = parseInt(values.minute || '0', 10);
    const totalMinutes = hour * 60 + minute;

    // Sunday: 4:00 AM (240 min) to 9:00 PM (1260 min)
    // Weekdays (Mon-Sat): 7:00 AM (420 min) to 9:00 PM (1260 min)
    const isSunday = weekday === 'Sunday';
    const openingMinutes = isSunday ? 4 * 60 : 7 * 60;
    const closingMinutes = 21 * 60; // 9:00 PM

    const isOpen = totalMinutes >= openingMinutes && totalMinutes < closingMinutes;

    const openingLabelEn = isSunday ? '4:00 AM' : '7:00 AM';
    const openingLabelTa = isSunday ? 'காலை 4:00' : 'காலை 7:00';

    // Calculate tomorrow's opening
    const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);
    const tomorrowWeekday = new Intl.DateTimeFormat('en-IN', {
      timeZone: 'Asia/Kolkata',
      weekday: 'long',
    }).format(tomorrow);
    const isTomorrowSunday = tomorrowWeekday === 'Sunday';
    const tomorrowOpeningEn = isTomorrowSunday ? '4:00 AM' : '7:00 AM';
    const tomorrowOpeningTa = isTomorrowSunday ? 'காலை 4:00' : 'காலை 7:00';

    let statusLabelEn = 'OPEN NOW';
    let statusLabelTa = 'இப்போது திறந்துள்ளது';

    if (!isOpen) {
      if (totalMinutes >= closingMinutes) {
        statusLabelEn = `CLOSED · OPENS ${tomorrowOpeningEn} TOMORROW`;
        statusLabelTa = `மூடப்பட்டுள்ளது · நாளை ${tomorrowOpeningTa} மணிக்கு திறக்கும்`;
      } else {
        statusLabelEn = `CLOSED · OPENS ${openingLabelEn} TODAY`;
        statusLabelTa = `மூடப்பட்டுள்ளது · இன்று ${openingLabelTa} மணிக்கு திறக்கும்`;
      }
    }

    const todayHoursEn = isSunday ? '4:00 AM – 9:00 PM' : '7:00 AM – 9:00 PM';
    const todayHoursTa = isSunday ? 'அதிகாலை 4:00 – இரவு 9:00' : 'காலை 7:00 – இரவு 9:00';

    return {
      isOpen,
      statusLabelEn,
      statusLabelTa,
      todayHoursEn,
      todayHoursTa,
      weekday,
      openingLabelEn,
      openingLabelTa,
    };
  } catch (e) {
    return {
      isOpen: true,
      statusLabelEn: 'OPEN NOW',
      statusLabelTa: 'இப்போது திறந்துள்ளது',
      todayHoursEn: '7:00 AM – 9:00 PM',
      todayHoursTa: 'காலை 7:00 – இரவு 9:00',
      weekday: 'Today',
      openingLabelEn: '7:00 AM',
      openingLabelTa: 'காலை 7:00',
    };
  }
}
