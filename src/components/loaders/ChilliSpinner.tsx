import React from 'react';

interface ChilliSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  textEn?: string;
  textTa?: string;
  isTamil?: boolean;
}

export const ChilliSpinner: React.FC<ChilliSpinnerProps> = ({
  size = 'md',
  textEn,
  textTa,
  isTamil = false,
}) => {
  const sizeClasses = {
    sm: 'w-6 h-6',
    md: 'w-10 h-10',
    lg: 'w-16 h-16',
  };

  const text = isTamil ? textTa : textEn;

  return (
    <div className="flex flex-col items-center justify-center p-4 gap-3 text-center">
      <div className={`relative ${sizeClasses[size]} animate-spin-slow`}>
        <div className="absolute inset-0 rounded-full border-2 border-raakky-red/20 border-t-raakky-red animate-spin" />
        <div className="absolute inset-0 flex items-center justify-center">
          <svg
            viewBox="0 0 24 24"
            className="w-3/5 h-3/5 text-raakky-red drop-shadow-sm transition-transform hover:scale-110"
            fill="currentColor"
          >
            <path d="M12.5 3c-.5-1.5-2-2-3-2s-1 .5-1 1c0 1.5 1.5 2 1.5 2s-4.5 1-6 6c-2 6 2 12 7.5 13 6.5 1.2 9-4.5 9-9 0-4-3-8.5-8-11zm-.5 16.5c-4-.5-6.5-4.5-5.5-9 1-3.5 4-4.5 4-4.5s1 2.5 4 4.5c.5.5 1.5 1.5 1 4-1 3.5-2 5-3.5 5z" />
          </svg>
        </div>
      </div>
      {text && (
        <p className="text-xs font-medium text-neutral-600 animate-pulse tracking-wide font-sans">
          {text}
        </p>
      )}
    </div>
  );
};
