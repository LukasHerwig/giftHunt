import { useTranslation } from 'react-i18next';
import { ExternalLink, Gift } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toStoreUrl } from '../lib/itemFormat';
import type { Receipt, Wishlist } from '../types';

interface ClaimReceiptProps {
  receipt: Receipt;
  wishlist: Wishlist;
  onDone: () => void;
}

/** What the sheet turns into after a claim: a receipt, never a toast. */
export const ClaimReceipt = ({ receipt, wishlist, onDone }: ClaimReceiptProps) => {
  const { t } = useTranslation();
  const organizer = wishlist.organizer_name;
  const owner = wishlist.creator_name;
  const rows = [
    { label: t('publicWishlist.receiptItem'), value: receipt.title },
    ...(receipt.price ? [{ label: t('publicWishlist.receiptPrice'), value: receipt.price }] : []),
  ];

  return (
    <div className="flex flex-col items-center gap-2 py-4 text-center text-gh-ink">
      <Gift
        className="h-12 w-12 text-gh-primary-strong duration-300 animate-in zoom-in-90 motion-reduce:animate-none"
        aria-hidden="true"
      />
      <h2 className="mt-2 text-[22px] font-bold leading-7">
        {t('publicWishlist.receiptTitle', { title: receipt.title })}
      </h2>
      <p className="text-[16px] leading-6 text-gh-ink-2">
        {owner
          ? t('publicWishlist.receiptLead', { name: owner })
          : t('publicWishlist.receiptLeadNoName')}
      </p>
      <span className="inline-flex min-h-[32px] items-center rounded-gh-pill border border-gh-line-strong bg-gh-surface-300 px-3 text-[16px] font-semibold leading-6">
        {receipt.name}
      </span>
      <dl className="mt-2 w-full">
        {rows.map((row) => (
          <div
            key={row.label}
            className="flex items-baseline justify-between gap-4 border-t border-gh-line py-2 text-left">
            <dt className="text-[13px] leading-[18px] text-gh-muted">{row.label}</dt>
            <dd className="min-w-0 text-right text-[16px] leading-6">{row.value}</dd>
          </div>
        ))}
      </dl>
      <p className="text-[13px] leading-[18px] text-gh-muted">
        {organizer
          ? t('publicWishlist.receiptUndo', { name: organizer })
          : t('publicWishlist.receiptUndoNoOrganizer')}
      </p>
      <div className="mt-4 flex w-full flex-col gap-3">
        {receipt.link && (
          <Button asChild variant="outline" className="h-12 w-full rounded-gh-md text-base font-semibold">
            <a href={toStoreUrl(receipt.link)} target="_blank" rel="noopener noreferrer">
              {t('publicWishlist.openStore')}
              <ExternalLink aria-hidden="true" />
            </a>
          </Button>
        )}
        <Button
          type="button"
          onClick={onDone}
          className="h-[52px] w-full rounded-gh-md text-[17px] font-semibold">
          {t('publicWishlist.done')}
        </Button>
      </div>
    </div>
  );
};
