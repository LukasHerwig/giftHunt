import { useTranslation } from 'react-i18next';

export const EmptyWishlistState = () => {
  const { t } = useTranslation();

  return (
    <div className="text-center py-12 px-4">
      <p className="text-[17px] text-ios-label-secondary">
        {t('publicWishlist.noItemsYet')}
      </p>
    </div>
  );
};
