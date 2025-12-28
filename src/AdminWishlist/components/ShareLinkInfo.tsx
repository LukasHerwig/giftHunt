import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Copy, Check } from 'lucide-react';
import { useState } from 'react';

interface ShareLinkInfoProps {
  shareLink: string;
}

export const ShareLinkInfo = ({ shareLink }: ShareLinkInfoProps) => {
  const { t } = useTranslation();
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(shareLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="mb-10 bg-ios-secondary/50 backdrop-blur-xl border border-ios-separator/10 rounded-[24px] p-6">
      <div className="flex items-center justify-between gap-4">
        <div className="flex-1 min-w-0">
          <h3 className="text-[13px] font-medium text-ios-gray uppercase tracking-wider mb-2">
            {t('adminWishlist.activeShareLink')}
          </h3>
          <p className="text-[15px] text-foreground break-all font-mono bg-black/20 p-3 rounded-[12px] border border-white/5">
            {shareLink}
          </p>
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={handleCopy}
          className="flex-shrink-0 w-12 h-12 rounded-full bg-ios-blue/10 text-ios-blue hover:bg-ios-blue/20 transition-colors">
          {copied ? (
            <Check className="w-5 h-5" />
          ) : (
            <Copy className="w-5 h-5" />
          )}
        </Button>
      </div>
    </div>
  );
};
