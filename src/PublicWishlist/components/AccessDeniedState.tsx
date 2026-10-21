import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/gh/EmptyState';

/** Unknown, expired or turned-off share link. */
export const AccessDeniedState = () => {
  const { t } = useTranslation();

  return (
    <div className="flex min-h-screen items-center justify-center bg-gh-bg p-4">
      <EmptyState
        size="screen"
        headingAs="h1"
        pose="locked"
        title={t('publicWishlist.inactiveTitle')}
        text={t('publicWishlist.inactiveText')}
        action={
          <Button asChild variant="outline" className="h-12 rounded-gh-md px-5 text-base font-semibold">
            <Link to="/auth">{t('publicWishlist.createOwnLink')}</Link>
          </Button>
        }
      />
    </div>
  );
};
