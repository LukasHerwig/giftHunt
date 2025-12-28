import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Info,
  Heart,
  MessageCircle,
  ChevronDown,
  ChevronRight,
} from 'lucide-react';

export const InfoSection = () => {
  const { t } = useTranslation();
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div className="bg-ios-secondary rounded-[24px] border border-ios-separator/5 shadow-sm overflow-hidden">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="flex items-center justify-between p-5 active:bg-ios-tertiary transition-colors w-full text-left"
        aria-expanded={isExpanded}>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-ios-blue/10 flex items-center justify-center">
            <Info className="h-5 w-5 text-ios-blue" />
          </div>
          <h3 className="text-[17px] font-semibold tracking-tight">
            {t('publicWishlist.howItWorks')}
          </h3>
        </div>
        {isExpanded ? (
          <ChevronDown className="h-5 w-5 text-ios-label-secondary" />
        ) : (
          <ChevronRight className="h-5 w-5 text-ios-label-secondary" />
        )}
      </button>

      {isExpanded && (
        <div className="px-5 pb-5 space-y-4 animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="space-y-4">
            <div className="flex items-start gap-4">
              <div className="w-8 h-8 rounded-full bg-ios-red/10 flex items-center justify-center shrink-0">
                <Heart className="h-4 w-4 text-ios-red" />
              </div>
              <p className="text-[15px] text-ios-label-primary leading-snug pt-1.5">
                {t('publicWishlist.howItWorksStep1')}
              </p>
            </div>

            <div className="flex items-start gap-4">
              <div className="w-8 h-8 rounded-full bg-ios-blue/10 flex items-center justify-center shrink-0">
                <MessageCircle className="h-4 w-4 text-ios-blue" />
              </div>
              <p className="text-[15px] text-ios-label-primary leading-snug pt-1.5">
                {t('publicWishlist.howItWorksStep2')}
              </p>
            </div>
          </div>

          <div className="pt-4 border-t border-ios-separator/10">
            <p className="text-[13px] text-ios-label-secondary italic">
              {t('publicWishlist.changeOfMind')}
            </p>
          </div>
        </div>
      )}
    </div>
  );
};
