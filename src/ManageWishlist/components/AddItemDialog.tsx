import { useTranslation } from 'react-i18next';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
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
import { Plus, Loader2 } from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';
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
  const isMobile = useIsMobile();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>
        <Button className="bg-ios-blue hover:bg-ios-blue/90 text-white rounded-full px-4 py-2 h-auto font-medium text-[15px] shadow-sm active:opacity-70 transition-all">
          <Plus className="w-4 h-4 mr-1.5" />
          {t('manageWishlist.addItem')}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px] rounded-[20px] bg-ios-secondary/95 backdrop-blur-xl border-ios-separator p-0 overflow-hidden">
        <DialogHeader className="p-6 pb-2">
          <DialogTitle className="text-center text-[17px] font-semibold">
            {t('addItemDialog.title')}
          </DialogTitle>
          <DialogDescription className="text-center text-[13px] text-ios-gray">
            {t('addItemDialog.description')}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={onSubmit} className="p-6 pt-2 space-y-6">
          <div className="bg-ios-background rounded-[12px] border border-ios-separator overflow-hidden">
            <div className="px-4 py-3 border-b border-ios-separator">
              <Label
                htmlFor="title"
                className="text-[13px] text-ios-gray uppercase tracking-wider mb-1 block">
                {t('addItemDialog.titleLabel')} *
              </Label>
              <Input
                id="title"
                placeholder={t('addItemDialog.titlePlaceholder')}
                value={newItem.title}
                onChange={(e) =>
                  setNewItem({ ...newItem, title: e.target.value })
                }
                className="border-none bg-transparent p-0 h-auto text-[17px] focus-visible:ring-0 placeholder:text-ios-gray/50"
                disabled={adding}
                required
              />
            </div>

            <div className="px-4 py-3 border-b border-ios-separator">
              <Label
                htmlFor="description"
                className="text-[13px] text-ios-gray uppercase tracking-wider mb-1 block">
                {t('addItemDialog.descriptionLabel')}
              </Label>
              <Textarea
                id="description"
                placeholder={t('addItemDialog.descriptionPlaceholder')}
                value={newItem.description}
                onChange={(e) =>
                  setNewItem({ ...newItem, description: e.target.value })
                }
                className="border-none bg-transparent p-0 h-auto text-[17px] focus-visible:ring-0 placeholder:text-ios-gray/50 resize-none min-h-[80px]"
                disabled={adding}
              />
            </div>

            {wishlist?.enable_links && (
              <div className="px-4 py-3 border-b border-ios-separator">
                <Label
                  htmlFor="link"
                  className="text-[13px] text-ios-gray uppercase tracking-wider mb-1 block">
                  {t('addItemDialog.linkLabel')}
                </Label>
                <Input
                  id="link"
                  placeholder={t('addItemDialog.linkPlaceholder')}
                  value={newItem.link}
                  onChange={(e) =>
                    setNewItem({ ...newItem, link: e.target.value })
                  }
                  className="border-none bg-transparent p-0 h-auto text-[17px] focus-visible:ring-0 placeholder:text-ios-gray/50"
                  disabled={adding}
                />
              </div>
            )}

            {wishlist?.enable_price && (
              <div className="px-4 py-3 border-b border-ios-separator">
                <Label
                  htmlFor="price"
                  className="text-[13px] text-ios-gray uppercase tracking-wider mb-1 block">
                  {t('addItemDialog.priceLabel')}
                </Label>
                <Input
                  id="price"
                  placeholder={t('addItemDialog.pricePlaceholder')}
                  value={newItem.priceRange}
                  onChange={(e) =>
                    setNewItem({ ...newItem, priceRange: e.target.value })
                  }
                  className="border-none bg-transparent p-0 h-auto text-[17px] focus-visible:ring-0 placeholder:text-ios-gray/50"
                  disabled={adding}
                />
              </div>
            )}

            {wishlist?.enable_priority && (
              <div className="px-4 py-3">
                <Label
                  htmlFor="priority"
                  className="text-[13px] text-ios-gray uppercase tracking-wider mb-1 block">
                  {t('addItemDialog.priorityLabel')}
                </Label>
                <Select
                  value={newItem.priority?.toString() || 'none'}
                  onValueChange={(value) =>
                    setNewItem({
                      ...newItem,
                      priority: value === 'none' ? null : parseInt(value),
                    })
                  }>
                  <SelectTrigger className="border-none bg-transparent p-0 h-auto text-[17px] focus:ring-0 shadow-none">
                    <SelectValue
                      placeholder={t('addItemDialog.priorityPlaceholder')}
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
            disabled={adding}>
            {adding ? (
              <>
                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                {t('addItemDialog.adding')}
              </>
            ) : (
              t('addItemDialog.addButton')
            )}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
};
