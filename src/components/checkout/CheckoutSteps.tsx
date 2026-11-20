import React from 'react';
import { Check, CreditCard, MapPin, ShoppingBag, User } from 'lucide-react';
import { useLanguage } from '../../contexts/LanguageContext';

interface CheckoutStepsProps {
  currentStep: number;
  onStepClick?: (step: number) => void;
}

export const CheckoutSteps: React.FC<CheckoutStepsProps> = ({ currentStep, onStepClick }) => {
  const { t } = useLanguage();

  const steps = [
    { number: 1, label: t('checkout.step1'), icon: User },
    { number: 2, label: t('checkout.step2'), icon: MapPin },
    { number: 3, label: t('checkout.step3'), icon: CreditCard },
    { number: 4, label: t('checkout.step4'), icon: ShoppingBag },
  ];

  return (
    <div className="w-full py-4">
      <div className="flex items-center justify-between max-w-xl mx-auto relative">
        <div className="absolute top-1/2 left-6 right-6 -translate-y-1/2 h-0.5 bg-neutral-200 z-0">
          <div
            className="h-full bg-raakky-red transition-all duration-300"
            style={{ width: `${((currentStep - 1) / (steps.length - 1)) * 100}%` }}
          />
        </div>

        {steps.map(step => {
          const isCompleted = currentStep > step.number;
          const isCurrent = currentStep === step.number;
          const { icon: StepIcon } = step;

          return (
            <div
              key={step.number}
              onClick={() => {
                if (isCompleted && onStepClick) onStepClick(step.number);
              }}
              className={`relative z-10 flex flex-col items-center gap-1.5 ${
                isCompleted ? 'cursor-pointer' : 'cursor-default'
              }`}
            >
              <div
                className={`w-10 h-10 rounded-2xl flex items-center justify-center font-bold text-xs transition-all ${
                  isCompleted
                    ? 'bg-emerald-600 text-white shadow-md'
                    : isCurrent
                    ? 'bg-raakky-red text-white shadow-spicy scale-110 ring-4 ring-raakky-red/10'
                    : 'bg-white text-neutral-400 border border-neutral-300'
                }`}
              >
                {isCompleted ? <Check size={16} strokeWidth={3} /> : <StepIcon size={16} />}
              </div>
              <span
                className={`text-[11px] font-bold tracking-tight text-center ${
                  isCurrent ? 'text-raakky-red' : isCompleted ? 'text-neutral-800' : 'text-neutral-400'
                }`}
              >
                {step.label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};
