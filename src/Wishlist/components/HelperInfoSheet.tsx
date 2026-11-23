import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ConfirmBlock } from '@/components/gh/ConfirmBlock';
import { ResponsiveSheet } from '@/components/ResponsiveSheet';

interface HelperInfoSheetProps {
  ownerName: string;
  listTitle: string;
  busy: boolean;
  onLeave: () => void;
  onClose: () => void;
}

/** What a helper may do, who made the list, and the way out. */
export const HelperInfoSheet = ({ ownerName, listTitle, busy, onLeave, onClose }: HelperInfoSheetProps) => {
  const { t } = useTranslation();
  const [confirming, setConfirming] = useState(false);

  return (
    <ResponsiveSheet
      open
      onOpenChange={(next) => {
        if (!next) onClose();
      }}
      title={t('wishlist.helper.sheet.title')}
      subtitle={listTitle}
      closeLabel={t('wishlist.form.close')}
      showTitleOnMobile>
      <div className="flex items-center gap-3">
        <span
          aria-hidden="true"
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gh-surface-300 text-[15px] font-semibold text-gh-ink">
          {ownerName.trim().charAt(0).toUpperCase()}
        </span>
        <div className="flex min-w-0 flex-col">
          <span className="truncate text-[16px] font-semibold leading-6 text-gh-ink">{ownerName}</span>
          <span className="text-[13px] leading-[18px] text-gh-muted">{t('wishlist.helper.sheet.owner')}</span>
        </div>
      </div>
      <p className="text-[16px] leading-6 text-gh-ink-2">{t('wishlist.helper.sheet.body', { name: ownerName })}</p>
      {confirming ? (
        <ConfirmBlock
          destructive
          question={t('wishlist.helper.sheet.leaveQuestion', { title: listTitle })}
          context={t('wishlist.helper.sheet.leaveContext', { name: ownerName })}
          confirmLabel={t('wishlist.helper.sheet.leave')}
          cancelLabel={t('wishlist.confirm.cancel')}
          loading={busy}
          onConfirm={onLeave}
          onCancel={() => setConfirming(false)}
        />
      ) : (
        <Button
          type="button"
          variant="outline"
          onClick={() => setConfirming(true)}
          className="h-[52px] w-full gap-2 rounded-gh-md border-gh-danger text-[17px] font-semibold text-gh-danger">
          <LogOut aria-hidden="true" />
          {t('wishlist.helper.sheet.leave')}
        </Button>
      )}
    </ResponsiveSheet>
  );
};
