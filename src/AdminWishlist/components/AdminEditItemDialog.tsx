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
import { Wishlist, WishlistItem } from '../types';

interface ItemFormData {
  title: string;
  description: string;
  link: string;
  priceRange: string;
  priority: number | null;
}

interface AdminEditItemDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  wishlist: Wishlist | null;
  editItem: ItemFormData;
  setEditItem: (item: ItemFormData) => void;
  onSubmit: (e: React.FormEvent) => Promise<void>;
  updating: boolean;
  selectedItem?: WishlistItem | null;
}

export const AdminEditItemDialog = ({
  open,
  onOpenChange,
  wishlist,
  editItem,
  setEditItem,
  onSubmit,
  updating,
  selectedItem,
}: AdminEditItemDialogProps) => {
  const { t } = useTranslation();
  const isTakenItem = selectedItem?.is_taken;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {isTakenItem
              ? t('adminWishlist.editTakenItem.title')
              : t('adminWishlist.editItem.title')}
          </DialogTitle>
          <DialogDescription>
            {isTakenItem
              ? t('adminWishlist.editTakenItem.description')
              : t('adminWishlist.editItem.description')}
          </DialogDescription>
        </DialogHeader>

        {isTakenItem && selectedItem && (
          <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 p-3 rounded-md">
            <p className="text-sm text-amber-800 dark:text-amber-200 font-medium mb-1">
              {t('adminWishlist.editTakenItem.warning')}
            </p>
            <p className="text-sm text-amber-700 dark:text-amber-300">
              {t('adminWishlist.editTakenItem.takenBy')}:{' '}
              {selectedItem.taken_by_name}
            </p>
          </div>
        )}
        <form onSubmit={onSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="admin-edit-title">
              {t('adminWishlist.editItem.titleLabel')} *
            </Label>
            <Input
              id="admin-edit-title"
              placeholder={t('adminWishlist.editItem.titlePlaceholder')}
              value={editItem.title}
              onChange={(e) =>
                setEditItem({ ...editItem, title: e.target.value })
              }
              className="text-base"
              disabled={updating}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="admin-edit-description">
              {t('adminWishlist.editItem.descriptionLabel')}
            </Label>
            <Textarea
              id="admin-edit-description"
              placeholder={t('adminWishlist.editItem.descriptionPlaceholder')}
              value={editItem.description}
              onChange={(e) =>
                setEditItem({ ...editItem, description: e.target.value })
              }
              className="text-base resize-none"
              rows={3}
              disabled={updating}
            />
          </div>

          {wishlist?.enable_links && (
            <div className="space-y-2">
              <Label htmlFor="admin-edit-link">
                {t('adminWishlist.editItem.linkLabel')}
              </Label>
              <Input
                id="admin-edit-link"
                placeholder={t('adminWishlist.editItem.linkPlaceholder')}
                value={editItem.link}
                onChange={(e) =>
                  setEditItem({ ...editItem, link: e.target.value })
                }
                className="text-base"
                disabled={updating}
              />
            </div>
          )}

          {wishlist?.enable_price && (
            <div className="space-y-2">
              <Label htmlFor="admin-edit-price">
                {t('adminWishlist.editItem.priceLabel')}
              </Label>
              <Input
                id="admin-edit-price"
                placeholder={t('adminWishlist.editItem.pricePlaceholder')}
                value={editItem.priceRange}
                onChange={(e) =>
                  setEditItem({ ...editItem, priceRange: e.target.value })
                }
                className="text-base"
                disabled={updating}
              />
            </div>
          )}

          {wishlist?.enable_priority && (
            <div className="space-y-2">
              <Label htmlFor="admin-edit-priority">
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
                <SelectTrigger>
                  <SelectValue
                    placeholder={t(
                      'adminWishlist.editItem.priorityPlaceholder'
                    )}
                  />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">{t('priority.none')}</SelectItem>
                  <SelectItem value="1">{t('priority.low')}</SelectItem>
                  <SelectItem value="2">{t('priority.medium')}</SelectItem>
                  <SelectItem value="3">{t('priority.high')}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="flex gap-3 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="flex-1"
              disabled={updating}>
              {t('adminWishlist.editItem.cancel')}
            </Button>
            <Button
              type="submit"
              className="flex-1 bg-gradient-to-r from-primary to-accent hover:opacity-90"
              disabled={updating}>
              {updating ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  {t('adminWishlist.editItem.updating')}
                </>
              ) : (
                t('adminWishlist.editItem.updateButton')
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
