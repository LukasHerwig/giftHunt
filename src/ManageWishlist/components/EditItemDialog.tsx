import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import {
  SheetDialog,
  SheetDialogContent,
  SheetDialogHeader,
  SheetDialogBody,
} from '@/components/ui/sheet-dialog';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Loader2, X, Check, Gift, Trash2 } from 'lucide-react';
import { Wishlist, ItemFormData } from '../types';

interface EditItemDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  wishlist: Wishlist | null;
  editItem: ItemFormData;
  setEditItem: (item: ItemFormData) => void;
  onSubmit: (e: React.FormEvent) => Promise<void>;
  onDelete?: () => void;
  updating: boolean;
  hasActiveShareLink?: boolean;
}

interface FormContentProps {
  onSubmit: (e: React.FormEvent) => Promise<void>;
  onOpenChange: (open: boolean) => void;
  onDelete?: () => void;
  updating: boolean;
  editItem: ItemFormData;
  setEditItem: (item: ItemFormData) => void;
  wishlist: Wishlist | null;
  hasActiveShareLink?: boolean;
  t: ReturnType<typeof useTranslation>['t'];
}

const FormContent = ({
  onSubmit,
  onOpenChange,
  onDelete,
  updating,
  editItem,
  setEditItem,
  wishlist,
  hasActiveShareLink = false,
  t,
}: FormContentProps) => {
  const [imageError, setImageError] = useState(false);

  useEffect(() => {
    setImageError(false);
  }, [editItem.url]);

  return (
    <form onSubmit={onSubmit}>
      <SheetDialogHeader
        title={t('editItemDialog.title')}
        onClose={() => onOpenChange(false)}
        submitDisabled={updating || !editItem.title.trim()}
        loading={updating}
        closeIcon={<X className="w-5 h-5" />}
        submitIcon={
          updating ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : (
            <Check className="w-5 h-5" />
          )
        }
      />

      <SheetDialogBody>
        {/* Icon Placeholder */}
        <div className="flex flex-col items-center">
          <div className="w-48 h-48 relative rounded-[24px] overflow-hidden">
            {editItem.url && !imageError ? (
              <img
                src={editItem.url}
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
        </div>

        {/* Title Input */}
        <div className="space-y-6">
          <div className="bg-ios-background/50 rounded-[20px] px-5 py-4 border border-ios-separator/5">
            <input
              placeholder={t('editItemDialog.titlePlaceholder')}
              value={editItem.title}
              onChange={(e) =>
                setEditItem({ ...editItem, title: e.target.value })
              }
              className="w-full bg-transparent text-[17px] outline-none placeholder-ios-gray text-foreground"
              disabled={updating}
              required
            />
          </div>
        </div>

        {/* Description */}
        <div className="space-y-2">
          <Label className="px-1 text-[13px] font-medium text-ios-gray uppercase tracking-wider">
            {t('editItemDialog.descriptionLabel')}
          </Label>
          <div className="bg-ios-background/50 rounded-[20px] px-5 py-4 border border-ios-separator/5">
            <textarea
              placeholder={t('editItemDialog.descriptionPlaceholder')}
              value={editItem.description}
              onChange={(e) =>
                setEditItem({ ...editItem, description: e.target.value })
              }
              className="w-full bg-transparent text-[17px] outline-none placeholder-ios-gray text-foreground resize-none"
              rows={3}
              disabled={updating}
            />
          </div>
        </div>

        {/* Link */}
        {wishlist?.enable_links && (
          <div className="space-y-2">
            <Label className="px-1 text-[13px] font-medium text-ios-gray uppercase tracking-wider">
              {t('editItemDialog.linkLabel')}
            </Label>
            <div className="bg-ios-background/50 rounded-[20px] px-5 py-4 border border-ios-separator/5">
              <input
                placeholder={t('editItemDialog.linkPlaceholder')}
                value={editItem.link}
                onChange={(e) =>
                  setEditItem({ ...editItem, link: e.target.value })
                }
                className="w-full bg-transparent text-[17px] outline-none placeholder-ios-gray text-foreground"
                disabled={updating}
              />
            </div>
          </div>
        )}

        {/* Price & Priority */}
        <div className="grid grid-cols-2 gap-4">
          {wishlist?.enable_price && (
            <div className="space-y-2">
              <Label className="px-1 text-[13px] font-medium text-ios-gray uppercase tracking-wider">
                {t('editItemDialog.priceLabel')}
              </Label>
              <div className="bg-ios-background/50 rounded-[20px] px-5 py-4 border border-ios-separator/5">
                <input
                  placeholder={t('editItemDialog.pricePlaceholder')}
                  value={editItem.priceRange}
                  onChange={(e) =>
                    setEditItem({ ...editItem, priceRange: e.target.value })
                  }
                  className="w-full bg-transparent text-[17px] outline-none placeholder-ios-gray text-foreground"
                  disabled={updating}
                />
              </div>
            </div>
          )}

          {wishlist?.enable_priority && (
            <div className="space-y-2">
              <Label className="px-1 text-[13px] font-medium text-ios-gray uppercase tracking-wider">
                {t('editItemDialog.priorityLabel')}
              </Label>
              <div className="bg-ios-background/50 rounded-[20px] px-5 py-4 border border-ios-separator/5">
                <Select
                  value={editItem.priority?.toString() || 'none'}
                  onValueChange={(value) =>
                    setEditItem({
                      ...editItem,
                      priority: value === 'none' ? null : parseInt(value),
                    })
                  }
                >
                  <SelectTrigger className="border-none bg-transparent p-0 h-auto text-[17px] focus:ring-0 shadow-none text-foreground">
                    <SelectValue
                      placeholder={t('editItemDialog.priorityPlaceholder')}
                    />
                  </SelectTrigger>
                  <SelectContent className="rounded-[20px] bg-ios-secondary/95 backdrop-blur-xl border-ios-separator">
                    <SelectItem value="none">{t('priority.none')}</SelectItem>
                    <SelectItem value="1">{t('priority.low')}</SelectItem>
                    <SelectItem value="2">{t('priority.medium')}</SelectItem>
                    <SelectItem value="3">{t('priority.high')}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}
        </div>

        {/* Gift Card Toggle */}
        <div className="space-y-2">
          <button
            type="button"
            onClick={() =>
              setEditItem({ ...editItem, isGiftcard: !editItem.isGiftcard })
            }
            disabled={updating}
            className={`w-full bg-ios-background/50 rounded-[20px] px-5 py-4 border border-ios-separator/5 flex items-center justify-between ${
              updating ? 'opacity-50' : ''
            }`}
          >
            <div className="flex flex-col items-start">
              <span className="text-[17px] font-medium text-foreground">
                {t('editItemDialog.isGiftcard')}
              </span>
              <span className="text-[13px] text-ios-gray mt-0.5">
                {t('editItemDialog.isGiftcardDescription')}
              </span>
            </div>
            <div
              className={`w-[51px] h-[31px] rounded-full transition-colors ${
                editItem.isGiftcard ? 'bg-ios-green' : 'bg-ios-gray/30'
              }`}
            >
              <div
                className={`w-[27px] h-[27px] bg-white rounded-full shadow-sm mt-[2px] transition-transform ${
                  editItem.isGiftcard
                    ? 'translate-x-[22px]'
                    : 'translate-x-[2px]'
                }`}
              />
            </div>
          </button>
        </div>

        {/* Delete Button */}
        {onDelete && (
          <div className="pt-4 space-y-3">
            <button
              type="button"
              onClick={hasActiveShareLink ? undefined : onDelete}
              disabled={hasActiveShareLink}
              className="w-full bg-ios-background/50 rounded-[20px] py-4 text-[17px] font-semibold text-destructive active:opacity-50 transition-opacity border border-ios-separator/5 flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed disabled:active:opacity-40 disabled:pointer-events-none"
            >
              <Trash2 className="w-5 h-5" />
              {t('editItemDialog.removeItem')}
            </button>
            {hasActiveShareLink && (
              <div className="bg-muted/50 border border-border/40 p-4 rounded-[16px]">
                <p className="text-[13px] text-muted-foreground leading-relaxed text-center">
                  {t('editItemDialog.contactAdminToDelete')}
                </p>
              </div>
            )}
          </div>
        )}
      </SheetDialogBody>
    </form>
  );
};

export const EditItemDialog = ({
  open,
  onOpenChange,
  wishlist,
  editItem,
  setEditItem,
  onSubmit,
  onDelete,
  updating,
  hasActiveShareLink = false,
}: EditItemDialogProps) => {
  const { t } = useTranslation();

  return (
    <SheetDialog open={open} onOpenChange={onOpenChange}>
      <SheetDialogContent>
        <FormContent
          onSubmit={onSubmit}
          onOpenChange={onOpenChange}
          onDelete={onDelete}
          updating={updating}
          editItem={editItem}
          setEditItem={setEditItem}
          wishlist={wishlist}
          hasActiveShareLink={hasActiveShareLink}
          t={t}
        />
      </SheetDialogContent>
    </SheetDialog>
  );
};
