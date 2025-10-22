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
    <Card className="mb-6 border-primary/20 bg-primary/5 dark:bg-primary/10">
      <CardContent className="pt-6">
        <div className="flex items-center justify-between gap-4">
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-primary mb-1">
              {t('adminWishlist.activeShareLink')}
            </h3>
            <p className="text-sm text-muted-foreground break-all font-mono">
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
