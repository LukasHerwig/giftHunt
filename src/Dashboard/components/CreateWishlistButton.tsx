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
    <div className="mb-8">
      <Button
        size="lg"
        className="w-full sm:w-auto bg-primary hover:bg-primary/90"
        onClick={onClick}>
        <Plus className="w-5 h-5 mr-2" />
        {t('dashboard.createNewWishlist')}
      </Button>
    </div>
  );
};
