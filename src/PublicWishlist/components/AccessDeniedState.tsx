import { useTranslation } from 'react-i18next';
import { Gift, Home } from 'lucide-react';
import { Link } from 'react-router-dom';

interface AccessDeniedStateProps {
  token?: string;
}

export const AccessDeniedState = ({ token }: AccessDeniedStateProps) => {
  const { t } = useTranslation();

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-ios-background">
      <div className="max-w-md w-full text-center">
        <div className="w-24 h-24 bg-ios-secondary rounded-[32px] flex items-center justify-center mx-auto mb-8 shadow-sm border border-ios-separator/5">
          <Gift className="w-12 h-12 text-ios-label-secondary" />
        </div>
        <h3 className="text-[28px] font-bold mb-3 tracking-tight text-foreground">
          {t('publicWishlist.accessNotAvailable')}
        </h3>
        <p className="text-[17px] text-ios-label-secondary leading-relaxed mb-10">
          {!token
            ? t('publicWishlist.requiresShareLink')
            : t('publicWishlist.invalidShareLink')}
        </p>

        <Link
          to="/"
          className="inline-flex items-center gap-2 bg-ios-blue text-white px-8 py-4 rounded-full font-semibold text-[17px] active:scale-95 transition-all shadow-lg shadow-ios-blue/20">
          <Home className="w-5 h-5" />
          {t('common.goHome')}
        </Link>
      </div>
    </div>
  );
};
