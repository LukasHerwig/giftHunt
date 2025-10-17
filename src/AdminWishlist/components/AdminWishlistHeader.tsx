import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Share, Loader2 } from 'lucide-react';
import AppHeader from '@/components/AppHeader';
import PageSubheader from '@/components/PageSubheader';

interface AdminWishlistHeaderProps {
  generatingLink: boolean;
  shareLink: string | null;
  onCopyShareLink: () => Promise<void>;
}

export const AdminWishlistHeader = ({
  generatingLink,
  shareLink,
  onCopyShareLink,
}: AdminWishlistHeaderProps) => {
  const { t } = useTranslation();
  const navigate = useNavigate();

  return (
    <>
      <AppHeader />
      <PageSubheader
        actions={
          <div className="flex gap-2">
            <Button
              variant="ghost"
              onClick={() => navigate('/')}
              className="flex items-center">
              <ArrowLeft className="w-4 h-4 mr-2" />
              {t('common.back')}
            </Button>
          </div>
        }
        children={
          <Button
            onClick={onCopyShareLink}
            disabled={generatingLink}
            className="bg-gradient-to-r from-primary to-accent hover:opacity-90">
            {generatingLink ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                {t('adminWishlist.generating')}
              </>
            ) : (
              <>
                <Share className="w-4 h-4 mr-2" />
                {shareLink
                  ? t('adminWishlist.copyShareLink')
                  : t('adminWishlist.generateShareLink')}
              </>
            )}
          </Button>
        }
      />
    </>
  );
};
