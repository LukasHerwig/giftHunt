import { useTranslation } from 'react-i18next';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
} from '@/components/ui/drawer';
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
import { Loader2, X, Check, Trash2, Undo2 } from 'lucide-react';
import { Wishlist, WishlistItem, ItemFormData } from '../types';
import { useIsMobile } from '@/hooks/use-mobile';

interface AdminEditItemDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  wishlist: Wishlist | null;
  editItem: ItemFormData;
  setEditItem: (item: ItemFormData) => void;
  onSubmit: (e: React.FormEvent) => Promise<void>;
  updating: boolean;
  selectedItem?: WishlistItem | null;
  onDelete?: (item: WishlistItem) => void;
  onUntake?: (item: WishlistItem) => void;
}

const FormContent = ({
  wishlist,
  editItem,
  setEditItem,
  onSubmit,
  updating,
  selectedItem,
  onOpenChange,
  onDelete,
  onUntake,
}: Omit<AdminEditItemDialogProps, 'open'>) => {
  const { t } = useTranslation();
  const isTakenItem = selectedItem?.is_taken;

  return (
    <form onSubmit={onSubmit} className="space-y-6 p-4 md:p-0">
      {isTakenItem && selectedItem && (
        <div className="bg-ios-secondary/50 border border-ios-separator/10 p-4 rounded-[20px]">
          <p className="text-[13px] text-ios-gray font-medium mb-1">
            {t('adminWishlist.editTakenItem.warning')}
          </p>
          <p className="text-[15px] text-foreground font-semibold">
            {t('adminWishlist.editTakenItem.takenBy')}:{' '}
            {selectedItem.taken_by_name}
          </p>
        </div>
      )}

      <div className="space-y-4">
        <div className="space-y-2">
          <Label
            htmlFor="admin-edit-title"
            className="text-[13px] font-medium text-ios-gray ml-1">
            {t('adminWishlist.editItem.titleLabel')}
          </Label>
          <Input
            id="admin-edit-title"
            placeholder={t('adminWishlist.editItem.titlePlaceholder')}
            value={editItem.title}
            onChange={(e) =>
              setEditItem({ ...editItem, title: e.target.value })
            }
            className="h-12 bg-ios-secondary border-none rounded-[12px] text-[17px] focus-visible:ring-1 focus-visible:ring-ios-blue"
            disabled={updating}
            required
          />
        </div>

        <div className="space-y-2">
          <Label
            htmlFor="admin-edit-description"
            className="text-[13px] font-medium text-ios-gray ml-1">
            {t('adminWishlist.editItem.descriptionLabel')}
          </Label>
          <Textarea
            id="admin-edit-description"
            placeholder={t('adminWishlist.editItem.descriptionPlaceholder')}
            value={editItem.description}
            onChange={(e) =>
              setEditItem({ ...editItem, description: e.target.value })
            }
            className="bg-ios-secondary border-none rounded-[12px] text-[17px] focus-visible:ring-1 focus-visible:ring-ios-blue min-h-[100px] resize-none"
            disabled={updating}
          />
        </div>

        {wishlist?.enable_links && (
          <div className="space-y-2">
            <Label
              htmlFor="admin-edit-link"
              className="text-[13px] font-medium text-ios-gray ml-1">
              {t('adminWishlist.editItem.linkLabel')}
            </Label>
            <Input
              id="admin-edit-link"
              placeholder={t('adminWishlist.editItem.linkPlaceholder')}
              value={editItem.link}
              onChange={(e) =>
                setEditItem({ ...editItem, link: e.target.value })
              }
              className="h-12 bg-ios-secondary border-none rounded-[12px] text-[17px] focus-visible:ring-1 focus-visible:ring-ios-blue"
              disabled={updating}
            />
          </div>
        )}

        {wishlist?.enable_price && (
          <div className="space-y-2">
            <Label
              htmlFor="admin-edit-price"
              className="text-[13px] font-medium text-ios-gray ml-1">
              {t('adminWishlist.editItem.priceLabel')}
            </Label>
            <Input
              id="admin-edit-price"
              placeholder={t('adminWishlist.editItem.pricePlaceholder')}
              value={editItem.priceRange}
              onChange={(e) =>
                setEditItem({ ...editItem, priceRange: e.target.value })
              }
              className="h-12 bg-ios-secondary border-none rounded-[12px] text-[17px] focus-visible:ring-1 focus-visible:ring-ios-blue"
              disabled={updating}
            />
          </div>
        )}

        {wishlist?.enable_priority && (
          <div className="space-y-2">
            <Label
              htmlFor="admin-edit-priority"
              className="text-[13px] font-medium text-ios-gray ml-1">
              {t('adminWishlist.editItem.priorityLabel')}
            </Label>
            <Select
              value={editItem.priority?.toString() || 'none'}
              onValueChange={(value) =>
                setEditItem({
                  ...editItem,
                  priority: value === 'none' ? null : parseInt(value),
                })
              }>
              <SelectTrigger className="h-12 bg-ios-secondary border-none rounded-[12px] text-[17px] focus:ring-1 focus:ring-ios-blue">
                <SelectValue
                  placeholder={t('adminWishlist.editItem.priorityPlaceholder')}
                />
              </SelectTrigger>
              <SelectContent className="bg-ios-secondary border-ios-separator/10 rounded-[12px]">
                <SelectItem value="none">{t('priority.none')}</SelectItem>
                <SelectItem value="1">{t('priority.low')}</SelectItem>
                <SelectItem value="2">{t('priority.medium')}</SelectItem>
                <SelectItem value="3">{t('priority.high')}</SelectItem>
              </SelectContent>
            </Select>
          </div>
        )}
      </div>

      <div className="space-y-3 pt-4">
        {isTakenItem && selectedItem && onUntake && (
          <Button
            type="button"
            variant="outline"
            onClick={() => onUntake(selectedItem)}
            className="w-full h-12 rounded-[12px] border-ios-separator/10 text-ios-blue font-semibold"
            disabled={updating}>
            <Undo2 className="w-4 h-4 mr-2" />
            {t('adminWishlist.untakeItem')}
          </Button>
        )}

        {selectedItem && onDelete && (
          <Button
            type="button"
            variant="ghost"
            onClick={() => onDelete(selectedItem)}
            className="w-full h-12 rounded-[12px] text-ios-red hover:text-ios-red hover:bg-ios-red/10 font-semibold"
            disabled={updating}>
            <Trash2 className="w-4 h-4 mr-2" />
            {t('adminWishlist.deleteItem.title')}
          </Button>
        )}
      </div>
    </form>
  );
};

export const AdminEditItemDialog = (props: AdminEditItemDialogProps) => {
  const { open, onOpenChange, updating, onSubmit, selectedItem } = props;
  const { t } = useTranslation();
  const isMobile = useIsMobile();
  const isTakenItem = selectedItem?.is_taken;

  const title = isTakenItem
    ? t('adminWishlist.editTakenItem.title')
    : t('adminWishlist.editItem.title');

  if (isMobile) {
    return (
      <Drawer open={open} onOpenChange={onOpenChange}>
        <DrawerContent className="bg-ios-background border-ios-separator/10 max-h-[90vh]">
          <DrawerHeader className="border-b border-ios-separator/10 pb-4 flex flex-row items-center justify-between px-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onOpenChange(false)}
              className="text-ios-blue hover:bg-transparent p-0 h-auto w-auto">
              <X className="w-6 h-6" />
            </Button>
            <DrawerTitle className="text-[17px] font-semibold">
              {title}
            </DrawerTitle>
            <Button
              onClick={(e) => onSubmit(e as any)}
              disabled={updating}
              variant="ghost"
              className="text-ios-blue hover:bg-transparent font-semibold p-0 h-auto w-auto">
              {updating ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <Check className="w-6 h-6" />
              )}
            </Button>
          </DrawerHeader>
          <div className="overflow-y-auto pb-8">
            <FormContent {...props} />
          </div>
        </DrawerContent>
      </Drawer>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-ios-background border-ios-separator/10 sm:max-w-[425px] p-0 overflow-hidden rounded-[24px]">
        <DialogHeader className="p-6 pb-0 flex flex-row items-center justify-between">
          <DialogTitle className="text-[20px] font-bold">{title}</DialogTitle>
          <div className="flex items-center gap-2">
            <Button
              onClick={(e) => onSubmit(e as any)}
              disabled={updating}
              className="bg-ios-blue hover:bg-ios-blue/90 text-white rounded-full px-4 h-9">
              {updating ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                t('adminWishlist.editItem.updateButton')
              )}
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onOpenChange(false)}
              className="rounded-full bg-ios-secondary hover:bg-ios-secondary/80">
              <X className="w-4 h-4" />
            </Button>
          </div>
        </DialogHeader>
        <div className="p-6 pt-4">
          <FormContent {...props} />
        </div>
      </DialogContent>
    </Dialog>
  );
};
