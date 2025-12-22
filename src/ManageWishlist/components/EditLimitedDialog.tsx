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
      <DialogContent className="sm:max-w-[425px] rounded-[20px] bg-ios-secondary/95 backdrop-blur-xl border-ios-separator p-0 overflow-hidden">
        <DialogHeader className="p-6 pb-2">
          <DialogTitle className="text-center text-[17px] font-semibold">
            {t('editLimitedDialog.title')}
          </DialogTitle>
          <DialogDescription className="text-center text-[13px] text-ios-gray">
            {t('editLimitedDialog.description')}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={onSubmit} className="p-6 pt-2 space-y-6">
          <div className="bg-ios-background rounded-[12px] border border-ios-separator overflow-hidden">
            <div className="px-4 py-3 border-b border-ios-separator bg-ios-tertiary/30">
              <Label className="text-[13px] text-ios-gray uppercase tracking-wider mb-1 block">
                {t('editLimitedDialog.titleLabel')}
              </Label>
              <div className="text-[17px] text-ios-gray">{item?.title}</div>
              <p className="text-[11px] text-ios-gray/60 mt-1">
                {t('editLimitedDialog.titleReadonlyNote')}
              </p>
            </div>

            <div className="px-4 py-3 border-b border-ios-separator">
              <Label
                htmlFor="edit-description-only"
                className="text-[13px] text-ios-gray uppercase tracking-wider mb-1 block">
                {t('editLimitedDialog.descriptionLabel')}
              </Label>
              <Textarea
                id="edit-description-only"
                placeholder={t('editLimitedDialog.descriptionPlaceholder')}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="border-none bg-transparent p-0 h-auto text-[17px] focus-visible:ring-0 placeholder:text-ios-gray/50 resize-none min-h-[80px]"
                disabled={updating}
              />
            </div>

            {/* Link field - conditional logic based on current link state */}
            {wishlist?.enable_links && (
              <div className="px-4 py-3 border-b border-ios-separator">
                <Label
                  htmlFor="edit-link-limited"
                  className="text-[13px] text-ios-gray uppercase tracking-wider mb-1 block">
                  {t('editLimitedDialog.linkLabel')}
                </Label>
                {item?.link ? (
                  // Item already has a link - show as read-only
                  <div className="bg-ios-tertiary/30 rounded-[8px] p-2">
                    <div className="text-[15px] text-ios-gray">{item.link}</div>
                    <p className="text-[11px] text-ios-gray/60 mt-1">
                      {t('editLimitedDialog.linkReadonlyNote')}
                    </p>
                  </div>
                ) : (
                  // Item has no link - allow adding one
                  <>
                    <Input
                      id="edit-link-limited"
                      placeholder={t('editLimitedDialog.linkPlaceholder')}
                      value={link}
                      onChange={(e) => setLink(e.target.value)}
                      className="border-none bg-transparent p-0 h-auto text-[17px] focus-visible:ring-0 placeholder:text-ios-gray/50"
                      disabled={updating}
                    />
                    <p className="text-[11px] text-ios-gray/60 mt-1">
                      {t('editLimitedDialog.linkAddNote')}
                    </p>
                  </>
                )}
              </div>
            )}

            {/* Price Range field - conditional logic based on current price state */}
            {wishlist?.enable_price && (
              <div className="px-4 py-3 border-b border-ios-separator">
                <Label
                  htmlFor="edit-price-limited"
                  className="text-[13px] text-ios-gray uppercase tracking-wider mb-1 block">
                  {t('editLimitedDialog.priceLabel')}
                </Label>
                {item?.price_range ? (
                  // Item already has a price range - show as read-only
                  <div className="bg-ios-tertiary/30 rounded-[8px] p-2">
                    <div className="text-[15px] text-ios-gray">
                      {item.price_range}
                    </div>
                    <p className="text-[11px] text-ios-gray/60 mt-1">
                      {t('editLimitedDialog.priceReadonlyNote')}
                    </p>
                  </div>
                ) : (
                  // Item has no price range - allow adding one
                  <>
                    <Input
                      id="edit-price-limited"
                      placeholder={t('editLimitedDialog.pricePlaceholder')}
                      value={priceRange}
                      onChange={(e) => setPriceRange(e.target.value)}
                      className="border-none bg-transparent p-0 h-auto text-[17px] focus-visible:ring-0 placeholder:text-ios-gray/50"
                      disabled={updating}
                    />
                    <p className="text-[11px] text-ios-gray/60 mt-1">
                      {t('editLimitedDialog.priceAddNote')}
                    </p>
                  </>
                )}
              </div>
            )}

            {/* Priority field - conditional logic based on current priority state */}
            {wishlist?.enable_priority && (
              <div className="px-4 py-3">
                <Label
                  htmlFor="edit-priority-limited"
                  className="text-[13px] text-ios-gray uppercase tracking-wider mb-1 block">
                  {t('editLimitedDialog.priorityLabel')}
                </Label>
                {item?.priority && item.priority > 0 ? (
                  // Item already has a priority - show as read-only
                  <div className="bg-ios-tertiary/30 rounded-[8px] p-2">
                    <div className="text-[15px] text-ios-gray">
                      {item.priority === 3
                        ? t('priority.high')
                        : item.priority === 2
                        ? t('priority.medium')
                        : t('priority.low')}
                    </div>
                    <p className="text-[11px] text-ios-gray/60 mt-1">
                      {t('editLimitedDialog.priorityReadonlyNote')}
                    </p>
                  </div>
                ) : (
                  // Item has no priority - allow adding one
                  <>
                    <Select
                      value={priority?.toString() || 'none'}
                      onValueChange={(value) =>
                        setPriority(value === 'none' ? null : parseInt(value))
                      }>
                      <SelectTrigger className="border-none bg-transparent p-0 h-auto text-[17px] focus:ring-0 shadow-none">
                        <SelectValue
                          placeholder={t(
                            'editLimitedDialog.priorityPlaceholder'
                          )}
                        />
                      </SelectTrigger>
                      <SelectContent className="rounded-[12px] bg-ios-secondary/95 backdrop-blur-xl border-ios-separator">
                        <SelectItem value="none">
                          {t('priority.none')}
                        </SelectItem>
                        <SelectItem value="1">{t('priority.low')}</SelectItem>
                        <SelectItem value="2">
                          {t('priority.medium')}
                        </SelectItem>
                        <SelectItem value="3">{t('priority.high')}</SelectItem>
                      </SelectContent>
                    </Select>
                    <p className="text-[11px] text-ios-gray/60 mt-1">
                      {t('editLimitedDialog.priorityAddNote')}
                    </p>
                  </>
                )}
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
