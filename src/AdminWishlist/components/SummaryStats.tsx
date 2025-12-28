import { useTranslation } from 'react-i18next';
import { WishlistItem } from '../types';
import { Gift, CheckCircle2, Package } from 'lucide-react';

interface SummaryStatsProps {
  items: WishlistItem[];
}

export const SummaryStats = ({ items }: SummaryStatsProps) => {
  const { t } = useTranslation();

  const takenItems = items.filter((item) => item.is_taken);
  const availableItems = items.filter((item) => !item.is_taken);

  return (
    <div className="grid grid-cols-3 gap-4 mb-8">
      <div className="bg-ios-secondary/50 backdrop-blur-xl rounded-[24px] p-4 border border-ios-separator/10 flex flex-col items-center justify-center text-center">
        <Package className="w-5 h-5 text-ios-blue mb-2 opacity-60" />
        <div className="text-[24px] font-bold text-foreground leading-none">
          {items.length}
        </div>
        <div className="text-[11px] font-medium text-ios-gray uppercase tracking-wider mt-1">
          {t('adminWishlist.totalItems')}
        </div>
      </div>

      <div className="bg-ios-secondary/50 backdrop-blur-xl rounded-[24px] p-4 border border-ios-separator/10 flex flex-col items-center justify-center text-center">
        <Gift className="w-5 h-5 text-ios-blue mb-2 opacity-60" />
        <div className="text-[24px] font-bold text-foreground leading-none">
          {availableItems.length}
        </div>
        <div className="text-[11px] font-medium text-ios-gray uppercase tracking-wider mt-1">
          {t('adminWishlist.available')}
        </div>
      </div>

      <div className="bg-ios-secondary/50 backdrop-blur-xl rounded-[24px] p-4 border border-ios-separator/10 flex flex-col items-center justify-center text-center">
        <CheckCircle2 className="w-5 h-5 text-ios-green mb-2 opacity-60" />
        <div className="text-[24px] font-bold text-foreground leading-none">
          {takenItems.length}
        </div>
        <div className="text-[11px] font-medium text-ios-gray uppercase tracking-wider mt-1">
          {t('adminWishlist.taken')}
        </div>
      </div>
    </div>
  );
};
