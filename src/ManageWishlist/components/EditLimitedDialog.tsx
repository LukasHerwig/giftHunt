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
  priceRange: string;
  setPriceRange: (priceRange: string) => void;
  priority: number | null;
  setPriority: (priority: number | null) => void;
  onSubmit: (e: React.FormEvent) => Promise<void>;
  updating: boolean;
}

export const EditLimitedDialog = ({
  open,
  onOpenChange,
  item,
  wishlist,
  description,
  setDescription,
  link,
  setLink,
  priceRange,
  setPriceRange,
  priority,
  setPriority,
  onSubmit,
  updating,
}: EditLimitedDialogProps) => {
  const { t } = useTranslation();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t('editLimitedDialog.title')}</DialogTitle>
          <DialogDescription>
            {t('editLimitedDialog.description')}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={onSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="item-title-readonly">
              {t('editLimitedDialog.titleLabel')}
            </Label>
            <div className="px-3 py-2 text-sm bg-muted text-muted-foreground rounded-md border">
              {item?.title}
            </div>
            <p className="text-xs text-muted-foreground">
              {t('editLimitedDialog.titleReadonlyNote')}
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="edit-description-only">
              {t('editLimitedDialog.descriptionLabel')}
            </Label>
            <Textarea
              id="edit-description-only"
              placeholder={t('editLimitedDialog.descriptionPlaceholder')}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="text-base resize-none"
              rows={3}
              disabled={updating}
            />
          </div>

          {/* Link field - conditional logic based on current link state */}
          {wishlist?.enable_links && (
            <div className="space-y-2">
              <Label htmlFor="edit-link-limited">
                {t('editLimitedDialog.linkLabel')}
              </Label>
              {item?.link ? (
                // Item already has a link - show as read-only
                <>
                  <div className="px-3 py-2 text-sm bg-muted text-muted-foreground rounded-md border">
                    {item.link}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {t('editLimitedDialog.linkReadonlyNote')}
                  </p>
                </>
              ) : (
                // Item has no link - allow adding one
                <>
                  <Input
                    id="edit-link-limited"
                    placeholder={t('editLimitedDialog.linkPlaceholder')}
                    value={link}
                    onChange={(e) => setLink(e.target.value)}
                    className="text-base"
                    disabled={updating}
                  />
                  <p className="text-xs text-muted-foreground">
                    {t('editLimitedDialog.linkAddNote')}
                  </p>
                </>
              )}
            </div>
          )}

          {/* Price Range field - conditional logic based on current price state */}
          {wishlist?.enable_price && (
            <div className="space-y-2">
              <Label htmlFor="edit-price-limited">
                {t('editLimitedDialog.priceLabel')}
              </Label>
              {item?.price_range ? (
                // Item already has a price range - show as read-only
                <>
                  <div className="px-3 py-2 text-sm bg-muted text-muted-foreground rounded-md border">
                    {item.price_range}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {t('editLimitedDialog.priceReadonlyNote')}
                  </p>
                </>
              ) : (
                // Item has no price range - allow adding one
                <>
                  <Input
                    id="edit-price-limited"
                    placeholder={t('editLimitedDialog.pricePlaceholder')}
                    value={priceRange}
                    onChange={(e) => setPriceRange(e.target.value)}
                    className="text-base"
                    disabled={updating}
                  />
                  <p className="text-xs text-muted-foreground">
                    {t('editLimitedDialog.priceAddNote')}
                  </p>
                </>
              )}
            </div>
          )}

          {/* Priority field - conditional logic based on current priority state */}
          {wishlist?.enable_priority && (
            <div className="space-y-2">
              <Label htmlFor="edit-priority-limited">
                {t('editLimitedDialog.priorityLabel')}
              </Label>
              {item?.priority && item.priority > 0 ? (
                // Item already has a priority - show as read-only
                <>
                  <div className="px-3 py-2 text-sm bg-muted text-muted-foreground rounded-md border">
                    {item.priority === 3
                      ? t('priority.high')
                      : item.priority === 2
                      ? t('priority.medium')
                      : t('priority.low')}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {t('editLimitedDialog.priorityReadonlyNote')}
                  </p>
                </>
              ) : (
                // Item has no priority - allow adding one
                <>
                  <Select
                    value={priority?.toString() || 'none'}
                    onValueChange={(value) =>
                      setPriority(value === 'none' ? null : parseInt(value))
                    }>
                    <SelectTrigger>
                      <SelectValue
                        placeholder={t('editLimitedDialog.priorityPlaceholder')}
                      />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">{t('priority.none')}</SelectItem>
                      <SelectItem value="1">{t('priority.low')}</SelectItem>
                      <SelectItem value="2">{t('priority.medium')}</SelectItem>
                      <SelectItem value="3">{t('priority.high')}</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground">
                    {t('editLimitedDialog.priorityAddNote')}
                  </p>
                </>
              )}
            </div>
          )}

          <Button
            type="submit"
            className="w-full bg-gradient-to-r from-primary to-accent hover:opacity-90"
            disabled={updating}>
            {updating ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                {t('editLimitedDialog.updating')}
              </>
            ) : (
              t('editLimitedDialog.updateButton')
            )}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
};
