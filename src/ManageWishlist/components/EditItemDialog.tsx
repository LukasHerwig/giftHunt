import { useTranslation } from 'react-i18next';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Loader2 } from 'lucide-react';
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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px] rounded-[20px] bg-ios-secondary/95 backdrop-blur-xl border-ios-separator p-0 overflow-hidden">
        <DialogHeader className="p-6 pb-2">
          <DialogTitle className="text-center text-[17px] font-semibold">
            {t('editItemDialog.title')}
          </DialogTitle>
          <DialogDescription className="text-center text-[13px] text-ios-gray">
            {t('editItemDialog.description')}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={onSubmit} className="p-6 pt-2 space-y-6">
          <div className="bg-ios-background rounded-[12px] border border-ios-separator overflow-hidden">
            <div className="px-4 py-3 border-b border-ios-separator">
              <Label
                htmlFor="edit-title"
                className="text-[13px] text-ios-gray uppercase tracking-wider mb-1 block">
                {t('editItemDialog.titleLabel')} *
              </Label>
              <Input
                id="edit-title"
                placeholder={t('editItemDialog.titlePlaceholder')}
                value={editItem.title}
                onChange={(e) =>
                  setEditItem({ ...editItem, title: e.target.value })
                }
                className="border-none bg-transparent p-0 h-auto text-[17px] focus-visible:ring-0 placeholder:text-ios-gray/50"
                disabled={updating}
                required
              />
            </div>

            <div className="px-4 py-3 border-b border-ios-separator">
              <Label
                htmlFor="edit-description"
                className="text-[13px] text-ios-gray uppercase tracking-wider mb-1 block">
                {t('editItemDialog.descriptionLabel')}
              </Label>
              <Textarea
                id="edit-description"
                placeholder={t('editItemDialog.descriptionPlaceholder')}
                value={editItem.description}
                onChange={(e) =>
                  setEditItem({ ...editItem, description: e.target.value })
                }
                className="border-none bg-transparent p-0 h-auto text-[17px] focus-visible:ring-0 placeholder:text-ios-gray/50 resize-none min-h-[80px]"
                disabled={updating}
              />
            </div>

            {wishlist?.enable_links && (
              <div className="px-4 py-3 border-b border-ios-separator">
                <Label
                  htmlFor="edit-link"
                  className="text-[13px] text-ios-gray uppercase tracking-wider mb-1 block">
                  {t('editItemDialog.linkLabel')}
                </Label>
                <Input
                  id="edit-link"
                  placeholder={t('editItemDialog.linkPlaceholder')}
                  value={editItem.link}
                  onChange={(e) =>
                    setEditItem({ ...editItem, link: e.target.value })
                  }
                  className="border-none bg-transparent p-0 h-auto text-[17px] focus-visible:ring-0 placeholder:text-ios-gray/50"
                  disabled={updating}
                />
              </div>
            )}

            {wishlist?.enable_price && (
              <div className="px-4 py-3 border-b border-ios-separator">
                <Label
                  htmlFor="edit-price"
                  className="text-[13px] text-ios-gray uppercase tracking-wider mb-1 block">
                  {t('editItemDialog.priceLabel')}
                </Label>
                <Input
                  id="edit-price"
                  placeholder={t('editItemDialog.pricePlaceholder')}
                  value={editItem.priceRange}
                  onChange={(e) =>
                    setEditItem({ ...editItem, priceRange: e.target.value })
                  }
                  className="border-none bg-transparent p-0 h-auto text-[17px] focus-visible:ring-0 placeholder:text-ios-gray/50"
                  disabled={updating}
                />
              </div>
            )}

            {wishlist?.enable_priority && (
              <div className="px-4 py-3">
                <Label
                  htmlFor="edit-priority"
                  className="text-[13px] text-ios-gray uppercase tracking-wider mb-1 block">
                  {t('editItemDialog.priorityLabel')}
                </Label>
                <Select
                  value={editItem.priority?.toString() || 'none'}
                  onValueChange={(value) =>
                    setEditItem({
                      ...editItem,
                      priority: value === 'none' ? null : parseInt(value),
                    })
                  }>
                  <SelectTrigger className="border-none bg-transparent p-0 h-auto text-[17px] focus:ring-0 shadow-none">
                    <SelectValue
                      placeholder={t('editItemDialog.priorityPlaceholder')}
                    />
                  </SelectTrigger>
                  <SelectContent className="rounded-[12px] bg-ios-secondary/95 backdrop-blur-xl border-ios-separator">
                    <SelectItem value="none">{t('priority.none')}</SelectItem>
                    <SelectItem value="1">{t('priority.low')}</SelectItem>
                    <SelectItem value="2">{t('priority.medium')}</SelectItem>
                    <SelectItem value="3">{t('priority.high')}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>

          <Button
            type="submit"
            className="w-full bg-ios-blue hover:bg-ios-blue/90 text-white rounded-[12px] py-6 font-semibold text-[17px] shadow-lg active:opacity-70 transition-all"
            disabled={updating}>
            {updating ? (
              <>
                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                {t('editItemDialog.updating')}
              </>
            ) : (
              t('editItemDialog.updateButton')
            )}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
};
