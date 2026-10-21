import { useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/gh/EmptyState';

const NotFound = () => {
  const { t } = useTranslation();
  const location = useLocation();

  useEffect(() => {
    console.error('404 Error: User attempted to access non-existent route:', location.pathname);
  }, [location.pathname]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-gh-bg p-4 text-gh-ink">
      <EmptyState
        pose="lost"
        size="screen"
        headingAs="h1"
        title={t('notFound.message')}
        action={
          <Button asChild variant="outline" className="h-12 rounded-gh-md px-5 text-base font-semibold">
            <Link to="/">{t('notFound.returnHome')}</Link>
          </Button>
        }
      />
    </div>
  );
};

export default NotFound;
