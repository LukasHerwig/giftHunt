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
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t('editItemDialog.title')}</DialogTitle>
          <DialogDescription>
            {t('editItemDialog.description')}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={onSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="edit-title">
              {t('editItemDialog.titleLabel')} *
            </Label>
            <Input
              id="edit-title"
              placeholder={t('editItemDialog.titlePlaceholder')}
              value={editItem.title}
              onChange={(e) =>
                setEditItem({ ...editItem, title: e.target.value })
              }
              className="text-base"
              disabled={updating}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="edit-description">
              {t('editItemDialog.descriptionLabel')}
            </Label>
            <Textarea
              id="edit-description"
              placeholder={t('editItemDialog.descriptionPlaceholder')}
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
              <Label htmlFor="edit-link">{t('editItemDialog.linkLabel')}</Label>
              <Input
                id="edit-link"
                placeholder={t('editItemDialog.linkPlaceholder')}
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
              <Label htmlFor="edit-price">
                {t('editItemDialog.priceLabel')}
              </Label>
              <Input
                id="edit-price"
                placeholder={t('editItemDialog.pricePlaceholder')}
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
              <Label htmlFor="edit-priority">
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
                <SelectTrigger>
                  <SelectValue
                    placeholder={t('editItemDialog.priorityPlaceholder')}
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

          <Button
            type="submit"
            className="w-full bg-gradient-to-r from-primary to-accent hover:opacity-90"
            disabled={updating}>
            {updating ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
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
