import React from 'react';
import { useLanguage } from '../../contexts/LanguageContext';
import { ChefHat, Flame, Sparkles, Utensils, LayoutGrid, Disc, Drumstick, Feather } from 'lucide-react';

export interface UnifiedFilterItem {
  id: string;
  nameEn: string;
  nameTa: string;
  icon: 'all' | 'curry' | 'boneless' | 'drumstick' | 'fry' | 'chukka' | 'wings' | 'liver';
}

export const UNIFIED_MENU_FILTERS: UnifiedFilterItem[] = [
  { id: '', nameEn: 'All Chicken Cuts', nameTa: 'அனைத்து சிக்கன்', icon: 'all' },
  { id: 'curry-cut', nameEn: 'Curry Cut', nameTa: 'குழம்பு வெட்டு', icon: 'curry' },
  { id: 'boneless', nameEn: 'Boneless', nameTa: 'போன்லெஸ்', icon: 'boneless' },
  { id: 'leg-pieces', nameEn: 'Leg Pieces', nameTa: 'லெக் பீஸ்', icon: 'drumstick' },
  { id: '65-fry', nameEn: '65 Fry Pieces', nameTa: '65 வறுவல் துண்டுகள்', icon: 'fry' },
  { id: 'chukka', nameEn: 'Chukka Cut', nameTa: 'சுக்கா வெட்டு', icon: 'chukka' },
  { id: 'wings', nameEn: 'Wings', nameTa: 'விங்ஸ்', icon: 'wings' },
  { id: 'cat-curry-chukka', nameEn: 'Curry & Chukka', nameTa: 'குழம்பு & சுக்கா', icon: 'curry' },
  { id: 'cat-bone-in', nameEn: 'Bone-in Cuts', nameTa: 'எலும்புடன் சிக்கன்', icon: 'drumstick' },
  { id: 'cat-fry-cuts', nameEn: 'Fry Cuts', nameTa: 'வறுவல் துண்டுகள்', icon: 'fry' },
  { id: 'cat-liver-feet', nameEn: 'Liver & Feet', nameTa: 'ஈரல் & கோழிக்கால்', icon: 'liver' },
];

interface CategoryFilterProps {
  selectedCategory: string;
  onSelectCategory: (categoryId: string) => void;
}

export const CategoryFilter: React.FC<CategoryFilterProps> = ({
  selectedCategory,
  onSelectCategory,
}) => {
  const { isTamil } = useLanguage();

  const renderIcon = (type: string, isSelected: boolean) => {
    const iconClass = isSelected ? 'text-white' : 'text-raakky-red';
    switch (type) {
      case 'curry':
        return <ChefHat size={15} className={iconClass} />;
      case 'drumstick':
        return <Drumstick size={15} className={iconClass} />;
      case 'boneless':
        return <Flame size={15} className={iconClass} />;
      case 'fry':
        return <Sparkles size={15} className={iconClass} />;
      case 'chukka':
        return <Utensils size={15} className={iconClass} />;
      case 'wings':
        return <Feather size={15} className={iconClass} />;
      case 'liver':
        return <Disc size={15} className={iconClass} />;
      default:
        return <LayoutGrid size={15} className={iconClass} />;
    }
  };

  return (
    <div className="w-full overflow-x-auto no-scrollbar py-2">
      <div className="flex items-center gap-2 min-w-max px-0.5">
        {UNIFIED_MENU_FILTERS.map((item) => {
          const isSelected = selectedCategory === item.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => onSelectCategory(item.id)}
              className={`flex items-center gap-1.5 px-3 sm:px-3.5 py-2 rounded-2xl text-xs font-bold transition-all ${
                isSelected
                  ? 'bg-raakky-red text-white shadow-spicy scale-[1.02]'
                  : 'bg-white text-neutral-800 border border-stone-200/90 hover:bg-stone-50 hover:border-stone-300 shadow-2xs'
              }`}
            >
              {renderIcon(item.icon, isSelected)}
              <span className="whitespace-nowrap">
                {isTamil ? item.nameTa : item.nameEn}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
};
