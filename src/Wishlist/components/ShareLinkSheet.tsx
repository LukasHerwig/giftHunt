import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Check, Copy, Link2, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ConfirmBlock } from '@/components/gh/ConfirmBlock';
import { SwitchRow } from '@/components/gh/SwitchRow';
import { ResponsiveSheet } from '@/components/ResponsiveSheet';
import { cn } from '@/lib/utils';
import { shareUrl } from '../services/OrganizerService';
import type { ShareLinkRow } from '../types';

interface ShareLinkSheetProps {
  shareLink: ShareLinkRow | null;
  listTitle: string;
  busy: boolean;
  copied: boolean;
  onCreate: () => void;
  onCopy: () => void;
  onSetActive: (active: boolean) => void;
  onClose: () => void;
}

/** Only the organizer sees the link: it shows what is taken. Create, copy, turn off, turn on again. */
export const ShareLinkSheet = ({
  shareLink,
  listTitle,
  busy,
  copied,
  onCreate,
  onCopy,
  onSetActive,
  onClose,
}: ShareLinkSheetProps) => {
  const { t } = useTranslation();
  const [confirmingOff, setConfirmingOff] = useState(false);

  return (
    <ResponsiveSheet
      open
      onOpenChange={(next) => {
        if (!next) onClose();
      }}
      title={t('wishlist.org.share.title')}
      subtitle={listTitle}
      closeLabel={t('wishlist.form.close')}
      showTitleOnMobile>
      {!shareLink ? (
        <>
          <div className="flex flex-col gap-1">
            <h3 className="text-[18px] font-bold leading-6 text-gh-ink">{t('wishlist.org.share.noneTitle')}</h3>
            <p className="text-[16px] leading-6 text-gh-ink-2">{t('wishlist.org.share.noneLead')}</p>
          </div>
          <Button
            type="button"
            onClick={onCreate}
            disabled={busy}
            className="h-[52px] w-full gap-2 rounded-gh-md text-[17px] font-semibold">
            {busy ? <Loader2 className="animate-spin" aria-hidden="true" /> : <Link2 aria-hidden="true" />}
            {t('wishlist.org.share.create')}
          </Button>
        </>
      ) : (
        <>
          <div className="flex flex-col gap-2">
            <span className="text-[12px] font-semibold leading-4 tracking-[0.2px] text-gh-ink-2">
              {t('wishlist.org.share.urlLabel')}
            </span>
            <div className="flex flex-col gap-2 rounded-gh-md border border-gh-line-strong bg-gh-surface-300 p-3">
              <p
                className={cn(
                  'break-all text-[15px] leading-[22px]',
                  shareLink.is_active ? 'text-gh-ink' : 'text-gh-muted line-through',
                )}>
                {shareUrl(shareLink.token)}
              </p>
              {!shareLink.is_active && (
                <p className="text-[13px] font-semibold leading-[18px] text-gh-muted">
                  {t('wishlist.org.share.inactiveBadge')}
                </p>
              )}
            </div>
          </div>

          {shareLink.is_active && (
            <Button
              type="button"
              onClick={onCopy}
              className="h-[52px] w-full gap-2 rounded-gh-md text-[17px] font-semibold">
              {copied ? <Check aria-hidden="true" /> : <Copy aria-hidden="true" />}
              {copied ? t('wishlist.org.share.copied') : t('wishlist.org.share.copy')}
            </Button>
          )}

          {confirmingOff ? (
            <ConfirmBlock
              destructive
              question={t('wishlist.org.share.offQuestion')}
              context={t('wishlist.org.share.offContext')}
              confirmLabel={t('wishlist.org.share.offAction')}
              cancelLabel={t('wishlist.confirm.cancel')}
              loading={busy}
              onConfirm={() => {
                setConfirmingOff(false);
                onSetActive(false);
              }}
              onCancel={() => setConfirmingOff(false)}
            />
          ) : (
            <div className="overflow-hidden rounded-gh-lg border border-gh-line bg-gh-surface-200">
              <SwitchRow
                label={t('wishlist.org.share.active')}
                description={
                  shareLink.is_active ? t('wishlist.org.share.activeHelp') : t('wishlist.org.share.inactiveHelp')
                }
                checked={shareLink.is_active}
                onChange={(checked) => (checked ? onSetActive(true) : setConfirmingOff(true))}
              />
            </div>
          )}
        </>
      )}
    </ResponsiveSheet>
  );
};
