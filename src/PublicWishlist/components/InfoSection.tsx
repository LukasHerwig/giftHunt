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
    <div className="bg-ios-secondary rounded-[12px] border border-ios-separator overflow-hidden">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="flex items-center justify-between p-4 active:bg-ios-tertiary transition-colors w-full text-left"
        aria-expanded={isExpanded}>
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-ios-blue/10 flex items-center justify-center">
            <Info className="h-5 w-5 text-ios-blue" />
          </div>
          <h3 className="text-[17px] font-medium">
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
        <div className="px-4 pb-4 space-y-4 animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <Heart className="h-5 w-5 mt-0.5 text-ios-red" />
              <p className="text-[15px] text-ios-label-primary leading-snug">
                {t('publicWishlist.howItWorksStep1')}
              </p>
            </div>

            <div className="flex items-start gap-3">
              <MessageCircle className="h-5 w-5 mt-0.5 text-ios-blue" />
              <p className="text-[15px] text-ios-label-primary leading-snug">
                {t('publicWishlist.howItWorksStep2')}
              </p>
            </div>
          </div>

          <div className="pt-3 border-t border-ios-separator">
            <p className="text-[13px] text-ios-label-secondary italic">
              {t('publicWishlist.changeOfMind')}
            </p>
          </div>
        </div>
      )}
    </div>
  );
};
