import React from 'react';
import { Minus, Plus, Trash2 } from 'lucide-react';
import { CartItem } from '../../types';
import { useLanguage } from '../../contexts/LanguageContext';
import { formatCurrency, formatWeight } from '../../utils/formatters';

interface CartItemRowProps {
  item: CartItem;
  onUpdateQuantity: (cartItemId: string, qty: number) => void;
  onRemove: (item: CartItem) => void;
}

export const CartItemRow: React.FC<CartItemRowProps> = ({
  item,
  onUpdateQuantity,
  onRemove,
}) => {
  const { isTamil, language } = useLanguage();

  const getCutLabel = (cut: string) => {
    switch (cut) {
      case 'curry_medium':
        return isTamil ? 'நடுத்தர குழம்பு வெட்டு' : 'Medium Curry Cut';
      case 'curry_small':
        return isTamil ? 'சிறிய குழம்பு வெட்டு' : 'Small Curry Cut';
      case 'chukka_cut':
        return isTamil ? 'சுக்கா வெட்டு' : 'Chukka Roast Cut';
      case 'fry_bite_size':
        return isTamil ? '65 வறுவல் துண்டுகள்' : '65 Fry Pieces (Unseasoned)';
      case 'drumstick_cut':
        return isTamil ? 'லெக் பீஸ்' : 'Drumsticks';
      case 'wings_cut':
        return isTamil ? 'விங்ஸ்' : 'Wings';
      case 'thigh_bone_in':
        return isTamil ? 'எலும்புள்ள தொடை' : 'Bone-in Thigh';
      case 'thigh_boneless':
        return isTamil ? 'எலும்பில்லாத தொடை' : 'Boneless Thigh';
      case 'boneless_cubes':
        return isTamil ? 'எலும்பில்லாத க்யூப்ஸ்' : 'Boneless Cubes';
      default:
        return cut.replace(/_/g, ' ');
    }
  };

  return (
    <div className="bg-white p-4 sm:p-5 rounded-3xl border border-stone-200/80 shadow-card flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
      <div className="flex items-start gap-4 flex-1 min-w-0">
        <img
          src={item.imageUrl}
          alt={item.productNameEn}
          className="w-20 h-20 rounded-2xl object-cover bg-stone-100 flex-shrink-0 border border-stone-200/60"
          onError={(e) => {
            (e.target as HTMLImageElement).src = '/images/storefront.jpg';
          }}
        />
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <h4 className="text-base font-bold text-neutral-900 leading-snug">
              {isTamil ? item.productNameTa : item.productNameEn}
            </h4>
            <button
              onClick={() => onRemove(item)}
              className="sm:hidden p-1.5 text-stone-400 hover:text-raakky-red transition-colors"
              aria-label="Remove item"
            >
              <Trash2 size={16} />
            </button>
          </div>

          <p className="text-xs text-raakky-red font-bold mt-1">
            {formatWeight(item.weightGrams, language)} · {formatCurrency(item.unitPrice)}
          </p>

          <div className="mt-2 flex flex-wrap gap-1.5 text-[11px]">
            <span className="px-2.5 py-0.5 rounded-lg bg-stone-100 text-stone-700 font-medium">
              {item.cuttingPreference.skinType === 'skin_on'
                ? (isTamil ? 'தோலுடன்' : 'Skin-on')
                : (isTamil ? 'தோல் நீக்கியது' : 'Skinless')}
            </span>
            <span className="px-2.5 py-0.5 rounded-lg bg-stone-100 text-stone-700 font-medium">
              {getCutLabel(item.cuttingPreference.cutType)}
            </span>
          </div>

          {item.cuttingPreference.specialInstructions && (
            <p className="text-[11px] text-stone-500 italic mt-1.5 bg-stone-50 p-2 rounded-xl border border-stone-200/60">
              "{item.cuttingPreference.specialInstructions}"
            </p>
          )}
        </div>
      </div>

      <div className="w-full sm:w-auto flex items-center justify-between sm:justify-end gap-6 pt-3 sm:pt-0 border-t sm:border-t-0 border-stone-100">
        <div className="flex items-center border border-stone-200 rounded-2xl overflow-hidden bg-stone-50 shadow-xs p-0.5">
          <button
            onClick={() => {
              if (item.quantity <= 1) {
                onRemove(item);
              } else {
                onUpdateQuantity(item.cartItemId, item.quantity - 1);
              }
            }}
            className="p-2 hover:bg-stone-200 text-stone-700 transition-colors"
            aria-label="Decrease quantity"
          >
            <Minus size={15} />
          </button>
          <span className="px-3.5 text-xs font-black text-neutral-900 select-none">
            {item.quantity}
          </span>
          <button
            onClick={() => onUpdateQuantity(item.cartItemId, item.quantity + 1)}
            className="p-2 hover:bg-stone-200 text-stone-700 transition-colors"
            aria-label="Increase quantity"
          >
            <Plus size={15} />
          </button>
        </div>

        <div className="text-right">
          <span className="text-base font-black text-neutral-900 font-sans block">
            {formatCurrency(item.unitPrice * item.quantity)}
          </span>
          <span className="text-[10px] text-stone-400">
            {isTamil ? 'மொத்தம்' : 'Subtotal'}
          </span>
        </div>
      </div>
    </div>
  );
};
