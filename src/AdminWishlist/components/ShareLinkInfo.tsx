import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Copy } from 'lucide-react';

interface ShareLinkInfoProps {
  shareLink: string;
}

export const ShareLinkInfo = ({ shareLink }: ShareLinkInfoProps) => {
  const { t } = useTranslation();

  return (
    <Card className="mb-6 border-accent/30 bg-accent/5 dark:bg-accent/10">
      <CardContent className="pt-6">
        <div className="flex items-center justify-between gap-4">
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-accent mb-1">
              {t('adminWishlist.activeShareLink')}
            </h3>
            <p className="text-sm text-accent/80 break-all font-mono">
              {shareLink}
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigator.clipboard.writeText(shareLink)}
            className="flex-shrink-0">
            <Copy className="w-4 h-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
