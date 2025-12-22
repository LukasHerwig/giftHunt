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
import { Loader2, X, Check, Gift } from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';
import { Wishlist, ItemFormData } from '../types';

interface EditItemDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  wishlist: Wishlist | null;
  editItem: ItemFormData;
  setEditItem: (item: ItemFormData) => void;
  onSubmit: (e: React.FormEvent) => Promise<void>;
  updating: boolean;
}

interface FormContentProps {
  onSubmit: (e: React.FormEvent) => Promise<void>;
  onOpenChange: (open: boolean) => void;
  updating: boolean;
  editItem: ItemFormData;
  setEditItem: (item: ItemFormData) => void;
  wishlist: Wishlist | null;
  t: any;
}

const FormContent = ({
  onSubmit,
  onOpenChange,
  updating,
  editItem,
  setEditItem,
  wishlist,
  t,
}: FormContentProps) => (
  <form onSubmit={onSubmit} className="flex flex-col h-full">
    {/* Header */}
    <div className="flex items-center justify-between px-4 h-16">
      <button
        type="button"
        onClick={() => onOpenChange(false)}
        className="w-10 h-10 flex items-center justify-center bg-ios-background/50 rounded-full text-foreground active:opacity-50 transition-opacity">
        <X className="w-5 h-5" />
      </button>
      <h2 className="text-[20px] font-bold text-foreground">
        {t('editItemDialog.title')}
      </h2>
      <button
        type="submit"
        disabled={updating || !editItem.title.trim()}
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
        <div className="w-48 h-48 relative">
          <div className="absolute inset-0 bg-ios-blue/10 rounded-full blur-3xl" />
          <div className="relative w-full h-full flex items-center justify-center">
            <div className="relative">
              <Gift className="w-24 h-24 text-ios-blue opacity-20 absolute -top-4 -left-4" />
              <Gift className="w-24 h-24 text-ios-blue opacity-40 absolute top-4 left-4" />
              <Gift className="w-32 h-32 text-ios-blue relative z-10" />
            </div>
          </div>
        </div>
      </div>

      {/* Inputs */}
      <div className="space-y-6">
        <div className="bg-ios-background/50 rounded-[20px] px-5 py-4 border border-ios-separator/5">
          <input
            placeholder={t('editItemDialog.titlePlaceholder')}
            value={editItem.title}
            onChange={(e) => setNewItem({ ...editItem, title: e.target.value })}
            className="w-full bg-transparent text-[17px] outline-none placeholder-ios-gray text-foreground"
            disabled={updating}
            required
          />
        </div>

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
                  }>
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
      </div>
    </div>
  </form>
);

export const EditItemDialog = ({
  open,
  onOpenChange,
  wishlist,
  editItem,
  setEditItem,
  onSubmit,
  updating,
}: EditItemDialogProps) => {
  const { t } = useTranslation();
  const isMobile = useIsMobile();

  const formProps = {
    onSubmit,
    onOpenChange,
    updating,
    editItem,
    setEditItem,
    wishlist,
    t,
  };

  if (isMobile) {
    return (
      <Drawer open={open} onOpenChange={onOpenChange}>
        <DrawerContent className="h-[92vh] bg-ios-secondary border-none rounded-t-[20px]">
          <FormContent {...formProps} />
        </DrawerContent>
      </Drawer>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        hideClose
        className="sm:max-w-[425px] p-0 overflow-hidden bg-ios-secondary border-none rounded-[24px] shadow-2xl">
        <FormContent {...formProps} />
      </DialogContent>
    </Dialog>
  );
};
