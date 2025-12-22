import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';

interface CreateWishlistButtonProps {
  onClick: () => void;
}

export const CreateWishlistButton = ({
  onClick,
}: CreateWishlistButtonProps) => {
  const { t } = useTranslation();

  return (
    <button
      onClick={onClick}
      className="w-14 h-14 bg-ios-blue text-white rounded-full flex items-center justify-center shadow-2xl active:scale-90 transition-all hover:bg-ios-blue/90"
      aria-label={t('dashboard.createNewWishlist')}>
      <Plus className="w-8 h-8" />
    </button>
  );
};
