import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Drawer, DrawerContent } from '@/components/ui/drawer';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Loader2, X, Check, Gift, Trash2 } from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';
import { WishlistItem, Wishlist } from '../types';

interface EditLimitedDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  item: WishlistItem | null;
  wishlist: Wishlist | null;
  description: string;
  setDescription: (description: string) => void;
  link: string;
  setLink: (link: string) => void;
  url: string;
  setUrl: (url: string) => void;
  priceRange: string;
  setPriceRange: (priceRange: string) => void;
  priority: number | null;
  setPriority: (priority: number | null) => void;
  onSubmit: (e: React.FormEvent) => Promise<void>;
  onDelete?: () => void;
  updating: boolean;
}

interface FormContentProps extends EditLimitedDialogProps {
  t: any;
}

const FormContent = ({
  onOpenChange,
  item,
  wishlist,
  description,
  setDescription,
  link,
  setLink,
  url,
  setUrl,
  priceRange,
  setPriceRange,
  priority,
  setPriority,
  onSubmit,
  onDelete,
  updating,
  t,
}: FormContentProps) => {
  const [imageError, setImageError] = useState(false);

  useEffect(() => {
    setImageError(false);
  }, [url]);

  return (
    <form onSubmit={onSubmit} className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between px-4 h-16">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => onOpenChange(false)}
            className="w-10 h-10 flex items-center justify-center bg-ios-background/50 rounded-full text-foreground active:opacity-50 transition-opacity">
            <X className="w-5 h-5" />
          </button>
        </div>
        <h2 className="text-[20px] font-bold text-foreground">
          {t('editLimitedDialog.title')}
        </h2>
        <button
          type="submit"
          disabled={updating}
          className="w-10 h-10 flex items-center justify-center bg-ios-background/50 rounded-full text-ios-blue disabled:text-ios-gray active:opacity-50 transition-opacity">
          {updating ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : (
            <Check className="w-5 h-5" />
          )}
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-4 pb-10 pt-2 space-y-8">
        {/* Icon Placeholder */}
        <div className="flex flex-col items-center">
          <div className="w-48 h-48 relative rounded-[24px] overflow-hidden">
            {url && !imageError ? (
              <img
                src={url}
                alt="Preview"
                className="w-full h-full object-cover"
                referrerPolicy="no-referrer"
                onError={() => setImageError(true)}
              />
            ) : (
              <>
                <div className="absolute inset-0 bg-ios-blue/10 rounded-full blur-3xl" />
                <div className="relative w-full h-full flex items-center justify-center">
                  <div className="relative">
                    <Gift className="w-24 h-24 text-ios-blue opacity-20 absolute -top-4 -left-4" />
                    <Gift className="w-24 h-24 text-ios-blue opacity-40 absolute top-4 left-4" />
                    <Gift className="w-32 h-32 text-ios-blue relative z-10" />
                  </div>
                </div>
              </>
            )}
          </div>
          <p className="text-center text-[15px] text-ios-gray max-w-[260px] mt-4">
            {t('editLimitedDialog.description')}
          </p>
        </div>

        {/* Inputs */}
        <div className="space-y-6">
          <div className="space-y-2">
            <Label className="px-1 text-[13px] font-medium text-ios-gray uppercase tracking-wider">
              {t('editLimitedDialog.titleLabel')}
            </Label>
            <div className="bg-ios-tertiary/30 rounded-[20px] px-5 py-4 border border-ios-separator/5">
              <div className="text-[17px] text-ios-gray">{item?.title}</div>
              <p className="text-[11px] text-ios-gray/60 mt-1">
                {t('editLimitedDialog.titleReadonlyNote')}
              </p>
            </div>
          </div>

          <div className="space-y-2">
            <Label className="px-1 text-[13px] font-medium text-ios-gray uppercase tracking-wider">
              {t('editLimitedDialog.descriptionLabel')}
            </Label>
            <div className="bg-ios-background/50 rounded-[20px] px-5 py-4 border border-ios-separator/5">
              <textarea
                placeholder={t('editLimitedDialog.descriptionPlaceholder')}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full bg-transparent text-[17px] outline-none placeholder-ios-gray text-foreground resize-none"
                rows={3}
                disabled={updating}
              />
            </div>
          </div>

          {wishlist?.enable_links && (
            <div className="space-y-2">
              <Label className="px-1 text-[13px] font-medium text-ios-gray uppercase tracking-wider">
                {t('editLimitedDialog.linkLabel')}
              </Label>
              {item?.link ? (
                <div className="bg-ios-tertiary/30 rounded-[20px] px-5 py-4 border border-ios-separator/5">
                  <div className="text-[15px] text-ios-gray">{item.link}</div>
                  <p className="text-[11px] text-ios-gray/60 mt-1">
                    {t('editLimitedDialog.linkReadonlyNote')}
                  </p>
                </div>
              ) : (
                <div className="bg-ios-background/50 rounded-[20px] px-5 py-4 border border-ios-separator/5">
                  <input
                    placeholder={t('editLimitedDialog.linkPlaceholder')}
                    value={link}
                    onChange={(e) => setLink(e.target.value)}
                    className="w-full bg-transparent text-[17px] outline-none placeholder-ios-gray text-foreground"
                    disabled={updating}
                  />
                  <p className="text-[11px] text-ios-gray/60 mt-1">
                    {t('editLimitedDialog.linkAddNote')}
                  </p>
                </div>
              )}
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            {wishlist?.enable_price && (
              <div className="space-y-2">
                <Label className="px-1 text-[13px] font-medium text-ios-gray uppercase tracking-wider">
                  {t('editLimitedDialog.priceLabel')}
                </Label>
                {item?.price_range ? (
                  <div className="bg-ios-tertiary/30 rounded-[20px] px-5 py-4 border border-ios-separator/5">
                    <div className="text-[15px] text-ios-gray">
                      {item.price_range}
                    </div>
                    <p className="text-[11px] text-ios-gray/60 mt-1">
                      {t('editLimitedDialog.priceReadonlyNote')}
                    </p>
                  </div>
                ) : (
                  <div className="bg-ios-background/50 rounded-[20px] px-5 py-4 border border-ios-separator/5">
                    <input
                      placeholder={t('editLimitedDialog.pricePlaceholder')}
                      value={priceRange}
                      onChange={(e) => setPriceRange(e.target.value)}
                      className="w-full bg-transparent text-[17px] outline-none placeholder-ios-gray text-foreground"
                      disabled={updating}
                    />
                    <p className="text-[11px] text-ios-gray/60 mt-1">
                      {t('editLimitedDialog.priceAddNote')}
                    </p>
                  </div>
                )}
              </div>
            )}

            {wishlist?.enable_priority && (
              <div className="space-y-2">
                <Label className="px-1 text-[13px] font-medium text-ios-gray uppercase tracking-wider">
                  {t('editLimitedDialog.priorityLabel')}
                </Label>
                {item?.priority && item.priority > 0 ? (
                  <div className="bg-ios-tertiary/30 rounded-[20px] px-5 py-4 border border-ios-separator/5">
                    <div className="text-[15px] text-ios-gray">
                      {item.priority === 3
                        ? t('priority.high')
                        : item.priority === 2
                        ? t('priority.medium')
                        : t('priority.low')}
                    </div>
                    <p className="text-[11px] text-ios-gray/60 mt-1">
                      {t('editLimitedDialog.priorityReadonlyNote')}
                    </p>
                  </div>
                ) : (
                  <div className="bg-ios-background/50 rounded-[20px] px-5 py-4 border border-ios-separator/5">
                    <Select
                      value={priority?.toString() || 'none'}
                      onValueChange={(value) =>
                        setPriority(value === 'none' ? null : parseInt(value))
                      }>
                      <SelectTrigger className="border-none bg-transparent p-0 h-auto text-[17px] focus:ring-0 shadow-none text-foreground">
                        <SelectValue
                          placeholder={t(
                            'editLimitedDialog.priorityPlaceholder'
                          )}
                        />
                      </SelectTrigger>
                      <SelectContent className="rounded-[20px] bg-ios-secondary/95 backdrop-blur-xl border-ios-separator">
                        <SelectItem value="none">
                          {t('priority.none')}
                        </SelectItem>
                        <SelectItem value="1">{t('priority.low')}</SelectItem>
                        <SelectItem value="2">
                          {t('priority.medium')}
                        </SelectItem>
                        <SelectItem value="3">{t('priority.high')}</SelectItem>
                      </SelectContent>
                    </Select>
                    <p className="text-[11px] text-ios-gray/60 mt-1">
                      {t('editLimitedDialog.priorityAddNote')}
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>

          {onDelete && (
            <div className="pt-4">
              <button
                type="button"
                onClick={onDelete}
                className="w-full bg-ios-background/50 rounded-[20px] py-4 text-[17px] font-semibold text-destructive active:opacity-50 transition-opacity border border-ios-separator/5 flex items-center justify-center gap-2">
                <Trash2 className="w-5 h-5" />
                {t('editLimitedDialog.removeItem')}
              </button>
            </div>
          )}
        </div>
      </div>
    </form>
  );
};

export const EditLimitedDialog = (props: EditLimitedDialogProps) => {
  const { t } = useTranslation();
  const isMobile = useIsMobile();

  if (isMobile) {
    return (
      <Drawer open={props.open} onOpenChange={props.onOpenChange}>
        <DrawerContent className="h-[92vh] bg-ios-secondary border-none rounded-t-[20px]">
          <FormContent {...props} t={t} />
        </DrawerContent>
      </Drawer>
    );
  }

  return (
    <Dialog open={props.open} onOpenChange={props.onOpenChange}>
      <DialogContent
        hideClose
        className="sm:max-w-[425px] p-0 overflow-hidden bg-ios-secondary border-none rounded-[24px] shadow-2xl">
        <FormContent {...props} t={t} />
      </DialogContent>
    </Dialog>
  );
};
