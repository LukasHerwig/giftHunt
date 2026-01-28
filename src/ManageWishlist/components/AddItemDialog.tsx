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
import { Loader2, X, Check, Gift } from 'lucide-react';
import { Wishlist, ItemFormData } from '../types';

interface AddItemDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  wishlist: Wishlist | null;
  newItem: ItemFormData;
  setNewItem: (item: ItemFormData) => void;
  onSubmit: (e: React.FormEvent) => Promise<void>;
  adding: boolean;
}

interface FormContentProps {
  onSubmit: (e: React.FormEvent) => Promise<void>;
  onOpenChange: (open: boolean) => void;
  adding: boolean;
  newItem: ItemFormData;
  setNewItem: (item: ItemFormData) => void;
  wishlist: Wishlist | null;
  t: ReturnType<typeof useTranslation>['t'];
}

const FormContent = ({
  onSubmit,
  onOpenChange,
  adding,
  newItem,
  setNewItem,
  wishlist,
  t,
}: FormContentProps) => {
  const [imageError, setImageError] = useState(false);

  useEffect(() => {
    setImageError(false);
  }, [newItem.url]);

  return (
    <form onSubmit={onSubmit}>
      <SheetDialogHeader
        title={t('addItemDialog.title')}
        onClose={() => onOpenChange(false)}
        submitDisabled={adding || !newItem.title.trim()}
        loading={adding}
        closeIcon={<X className="w-5 h-5" />}
        submitIcon={
          adding ? (
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
            {newItem.url && !imageError ? (
              <img
                src={newItem.url}
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
              placeholder={t('addItemDialog.titlePlaceholder')}
              value={newItem.title}
              onChange={(e) =>
                setNewItem({ ...newItem, title: e.target.value })
              }
              className="w-full bg-transparent text-[17px] outline-none placeholder-ios-gray text-foreground"
              disabled={adding}
            />
          </div>
        </div>

        {/* Description */}
        <div className="space-y-2">
          <Label className="px-1 text-[13px] font-medium text-ios-gray uppercase tracking-wider">
            {t('addItemDialog.descriptionLabel')}
          </Label>
          <div className="bg-ios-background/50 rounded-[20px] px-5 py-4 border border-ios-separator/5">
            <textarea
              placeholder={t('addItemDialog.descriptionPlaceholder')}
              value={newItem.description}
              onChange={(e) =>
                setNewItem({ ...newItem, description: e.target.value })
              }
              className="w-full bg-transparent text-[17px] outline-none placeholder-ios-gray text-foreground resize-none"
              rows={3}
              disabled={adding}
            />
          </div>
        </div>

        {/* Link */}
        {wishlist?.enable_links && (
          <div className="space-y-2">
            <Label className="px-1 text-[13px] font-medium text-ios-gray uppercase tracking-wider">
              {t('addItemDialog.linkLabel')}
            </Label>
            <div className="bg-ios-background/50 rounded-[20px] px-5 py-4 border border-ios-separator/5">
              <input
                placeholder={t('addItemDialog.linkPlaceholder')}
                value={newItem.link}
                onChange={(e) =>
                  setNewItem({ ...newItem, link: e.target.value })
                }
                className="w-full bg-transparent text-[17px] outline-none placeholder-ios-gray text-foreground"
                disabled={adding}
              />
            </div>
          </div>
        )}

        {/* Price & Priority */}
        <div className="grid grid-cols-2 gap-4">
          {wishlist?.enable_price && (
            <div className="space-y-2">
              <Label className="px-1 text-[13px] font-medium text-ios-gray uppercase tracking-wider">
                {t('addItemDialog.priceLabel')}
              </Label>
              <div className="bg-ios-background/50 rounded-[20px] px-5 py-4 border border-ios-separator/5">
                <input
                  placeholder={t('addItemDialog.pricePlaceholder')}
                  value={newItem.priceRange}
                  onChange={(e) =>
                    setNewItem({ ...newItem, priceRange: e.target.value })
                  }
                  className="w-full bg-transparent text-[17px] outline-none placeholder-ios-gray text-foreground"
                  disabled={adding}
                />
              </div>
            </div>
          )}

          {wishlist?.enable_priority && (
            <div className="space-y-2">
              <Label className="px-1 text-[13px] font-medium text-ios-gray uppercase tracking-wider">
                {t('addItemDialog.priorityLabel')}
              </Label>
              <div className="bg-ios-background/50 rounded-[20px] px-5 py-4 border border-ios-separator/5">
                <Select
                  value={newItem.priority?.toString() || 'none'}
                  onValueChange={(value) =>
                    setNewItem({
                      ...newItem,
                      priority: value === 'none' ? null : parseInt(value),
                    })
                  }
                >
                  <SelectTrigger className="border-none bg-transparent p-0 h-auto text-[17px] focus:ring-0 shadow-none text-foreground">
                    <SelectValue
                      placeholder={t('addItemDialog.priorityPlaceholder')}
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
              setNewItem({ ...newItem, isGiftcard: !newItem.isGiftcard })
            }
            disabled={adding}
            className={`w-full bg-ios-background/50 rounded-[20px] px-5 py-4 border border-ios-separator/5 flex items-center justify-between ${
              adding ? 'opacity-50' : ''
            }`}
          >
            <div className="flex flex-col items-start">
              <span className="text-[17px] font-medium text-foreground">
                {t('addItemDialog.isGiftcard')}
              </span>
              <span className="text-[13px] text-ios-gray mt-0.5">
                {t('addItemDialog.isGiftcardDescription')}
              </span>
            </div>
            <div
              className={`w-[51px] h-[31px] rounded-full transition-colors ${
                newItem.isGiftcard ? 'bg-ios-green' : 'bg-ios-gray/30'
              }`}
            >
              <div
                className={`w-[27px] h-[27px] bg-white rounded-full shadow-sm mt-[2px] transition-transform ${
                  newItem.isGiftcard
                    ? 'translate-x-[22px]'
                    : 'translate-x-[2px]'
                }`}
              />
            </div>
          </button>
        </div>
      </SheetDialogBody>
    </form>
  );
};

export const AddItemDialog = ({
  open,
  onOpenChange,
  wishlist,
  newItem,
  setNewItem,
  onSubmit,
  adding,
}: AddItemDialogProps) => {
  const { t } = useTranslation();

  return (
    <SheetDialog open={open} onOpenChange={onOpenChange}>
      <SheetDialogContent>
        <FormContent
          onSubmit={onSubmit}
          onOpenChange={onOpenChange}
          adding={adding}
          newItem={newItem}
          setNewItem={setNewItem}
          wishlist={wishlist}
          t={t}
        />
      </SheetDialogContent>
    </SheetDialog>
  );
};
