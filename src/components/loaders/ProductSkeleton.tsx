import React from 'react';

export const ProductSkeleton: React.FC = () => {
  return (
    <div className="bg-white rounded-2xl border border-neutral-100 overflow-hidden shadow-card flex flex-col animate-pulse">
      <div className="aspect-[4/3] bg-neutral-200/80 w-full" />
      <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
        <div className="space-y-2">
          <div className="h-4 bg-neutral-200 rounded w-3/4" />
          <div className="h-3 bg-neutral-100 rounded w-full" />
          <div className="h-3 bg-neutral-100 rounded w-2/3" />
        </div>
        <div className="space-y-3 pt-3 border-t border-neutral-100">
          <div className="flex gap-2">
            <div className="h-7 bg-neutral-200 rounded-lg flex-1" />
            <div className="h-7 bg-neutral-200 rounded-lg flex-1" />
          </div>
          <div className="flex items-center justify-between">
            <div className="h-6 bg-neutral-200 rounded w-20" />
            <div className="h-9 bg-neutral-300 rounded-xl w-28" />
          </div>
        </div>
      </div>
    </div>
  );
};

export const FullPageLoader: React.FC<{ messageEn?: string; messageTa?: string; isTamil?: boolean }> = ({
  messageEn = 'Loading fresh cuts from Raakky Counter...',
  messageTa = 'ராக்கி கடையிலிருந்து புதிய வகைகள் ஏற்றப்படுகின்றன...',
  isTamil = false,
}) => {
  return (
    <div className="min-h-[60vh] flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <div className="w-16 h-16 relative">
          <div className="absolute inset-0 rounded-2xl bg-raakky-red/10 animate-ping opacity-60" />
          <div className="relative w-16 h-16 rounded-2xl bg-gradient-to-tr from-raakky-red to-raakky-orange flex items-center justify-center shadow-spicy text-white font-condensed font-bold text-3xl">
            R
          </div>
        </div>
        <div className="h-1 w-24 bg-neutral-200 rounded-full overflow-hidden mt-2">
          <div className="h-full bg-raakky-red animate-[shimmer_1.5s_infinite] w-full" />
        </div>
        <p className="text-sm font-medium text-neutral-600 font-sans">
          {isTamil ? messageTa : messageEn}
        </p>
      </div>
    </div>
  );
};
