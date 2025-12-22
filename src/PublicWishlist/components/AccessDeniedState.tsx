import { useTranslation } from 'react-i18next';
import { Gift } from 'lucide-react';

interface AccessDeniedStateProps {
  token?: string;
}

export const AccessDeniedState = ({ token }: AccessDeniedStateProps) => {
  const { t } = useTranslation();

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-ios-background">
      <div className="max-w-md text-center">
        <div className="w-20 h-20 bg-ios-secondary rounded-[20px] flex items-center justify-center mx-auto mb-6 shadow-sm">
          <Gift className="w-10 h-10 text-ios-label-secondary" />
        </div>
        <h3 className="text-[22px] font-bold mb-2 tracking-tight">
          {t('publicWishlist.accessNotAvailable')}
        </h3>
        <p className="text-[17px] text-ios-label-secondary leading-relaxed">
          {!token
            ? t('publicWishlist.requiresShareLink')
            : t('publicWishlist.invalidShareLink')}
        </p>
      </div>
    </div>
  );
};
