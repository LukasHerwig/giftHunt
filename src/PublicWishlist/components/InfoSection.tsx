import { useTranslation } from 'react-i18next';
import { Card } from '@/components/ui/card';
import { Info, Heart, MessageCircle } from 'lucide-react';

export const InfoSection = () => {
  const { t } = useTranslation();

  return (
    <Card className="bg-muted/50 border-dashed border-muted-foreground/30">
      <div className="p-6 space-y-4">
        <div className="flex items-center gap-2 text-muted-foreground">
          <Info className="h-5 w-5" />
          <h3 className="font-medium">{t('publicWishlist.howItWorks')}</h3>
        </div>

        <div className="space-y-3 text-sm text-muted-foreground">
          <div className="flex items-start gap-3">
            <Heart className="h-4 w-4 mt-0.5 text-primary/60" />
            <p>{t('publicWishlist.howItWorksStep1')}</p>
          </div>

          <div className="flex items-start gap-3">
            <MessageCircle className="h-4 w-4 mt-0.5 text-primary/60" />
            <p>{t('publicWishlist.howItWorksStep2')}</p>
          </div>
        </div>

        <div className="pt-2 border-t border-muted-foreground/20">
          <p className="text-xs text-muted-foreground/80">
            {t('publicWishlist.changeOfMind')}
          </p>
        </div>
      </div>
    </Card>
  );
};
