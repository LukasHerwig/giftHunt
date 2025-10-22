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
        <Button
          size={isMobile ? 'default' : 'lg'}
          className="bg-primary hover:bg-primary/90 text-primary-foreground">
          <Plus className="w-5 h-5" />
          <span className="ml-2">{t('manageWishlist.addItem')}</span>
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t('addItemDialog.title')}</DialogTitle>
          <DialogDescription>
            {t('addItemDialog.description')}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={onSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">{t('addItemDialog.titleLabel')} *</Label>
            <Input
              id="title"
              placeholder={t('addItemDialog.titlePlaceholder')}
              value={newItem.title}
              onChange={(e) =>
                setNewItem({ ...newItem, title: e.target.value })
              }
              className="text-base"
              disabled={adding}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">
              {t('addItemDialog.descriptionLabel')}
            </Label>
            <Textarea
              id="description"
              placeholder={t('addItemDialog.descriptionPlaceholder')}
              value={newItem.description}
              onChange={(e) =>
                setNewItem({ ...newItem, description: e.target.value })
              }
              className="text-base resize-none"
              rows={3}
              disabled={adding}
            />
          </div>

          {wishlist?.enable_links && (
            <div className="space-y-2">
              <Label htmlFor="link">{t('addItemDialog.linkLabel')}</Label>
              <Input
                id="link"
                placeholder={t('addItemDialog.linkPlaceholder')}
                value={newItem.link}
                onChange={(e) =>
                  setNewItem({ ...newItem, link: e.target.value })
                }
                className="text-base"
                disabled={adding}
              />
            </div>
          )}

          {wishlist?.enable_price && (
            <div className="space-y-2">
              <Label htmlFor="price">{t('addItemDialog.priceLabel')}</Label>
              <Input
                id="price"
                placeholder={t('addItemDialog.pricePlaceholder')}
                value={newItem.priceRange}
                onChange={(e) =>
                  setNewItem({ ...newItem, priceRange: e.target.value })
                }
                className="text-base"
                disabled={adding}
              />
            </div>
          )}

          {wishlist?.enable_priority && (
            <div className="space-y-2">
              <Label htmlFor="priority">
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
                <SelectTrigger>
                  <SelectValue
                    placeholder={t('addItemDialog.priorityPlaceholder')}
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
            className="w-full bg-primary hover:bg-primary/90 text-primary-foreground"
            disabled={adding}>
            {adding ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
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
