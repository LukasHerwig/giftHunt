import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  SheetDialog,
  SheetDialogContent,
  SheetDialogHeader,
  SheetDialogBody,
} from '@/components/ui/sheet-dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
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
import { Loader2, X, Check, Trash2, Undo2, Gift } from 'lucide-react';
import { Wishlist, WishlistItem, ItemFormData } from '../types';

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
  const [showGiftcardConfirm, setShowGiftcardConfirm] = useState(false);

  const handleGiftcardToggle = () => {
    setShowGiftcardConfirm(true);
  };

  const confirmGiftcardToggle = () => {
    setEditItem({ ...editItem, isGiftcard: !editItem.isGiftcard });
    setShowGiftcardConfirm(false);
  };

  return (
    <>
      <AlertDialog
        open={showGiftcardConfirm}
        onOpenChange={setShowGiftcardConfirm}
      >
        <AlertDialogContent className="bg-ios-secondary border-ios-separator/10 rounded-[20px]">
          <AlertDialogHeader>
            <AlertDialogTitle>
              {editItem.isGiftcard
                ? t('adminWishlist.giftcardConfirm.disableTitle')
                : t('adminWishlist.giftcardConfirm.enableTitle')}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {editItem.isGiftcard
                ? t('adminWishlist.giftcardConfirm.disableDescription')
                : t('adminWishlist.giftcardConfirm.enableDescription')}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-full">
              {t('common.cancel')}
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmGiftcardToggle}
              className="bg-ios-blue hover:bg-ios-blue/90 rounded-full"
            >
              {t('common.confirm')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <form onSubmit={onSubmit}>
        <SheetDialogHeader
          title={
            isTakenItem
              ? t('adminWishlist.editTakenItem.title')
              : t('adminWishlist.editItem.title')
          }
          onClose={() => onOpenChange(false)}
          submitDisabled={updating}
          loading={updating}
          closeIcon={<X className="w-5 h-5" />}
          submitIcon={
            updating ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <Check className="w-5 h-5" />
            )
          }
        />

        <SheetDialogBody>
          {/* Preview Image */}
          <div className="flex flex-col items-center mb-2">
            <div className="w-48 h-48 relative rounded-[24px] overflow-hidden">
              {editItem.url ? (
                <img
                  src={editItem.url}
                  alt="Preview"
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-ios-secondary">
                  <Gift className="w-20 h-20 text-ios-blue opacity-20" />
                </div>
              )}
            </div>
          </div>

          {/* Regular taken item */}
          {isTakenItem &&
            selectedItem &&
            !selectedItem.is_giftcard &&
            !selectedItem.claims?.length && (
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

          {/* Item with claimers */}
          {selectedItem?.claims && selectedItem.claims.length > 0 && (
            <div className="bg-ios-purple/10 border border-ios-purple/20 p-4 rounded-[20px]">
              <p className="text-[13px] text-ios-gray font-medium mb-2">
                {t('adminWishlist.editTakenItem.giftcardClaimers', {
                  count: selectedItem.claims.length,
                })}
              </p>
              <ul className="space-y-1">
                {selectedItem.claims.map((claim) => (
                  <li
                    key={claim.id}
                    className="text-[15px] text-foreground font-semibold flex items-center gap-2"
                  >
                    <span className="w-2 h-2 rounded-full bg-ios-purple" />
                    {claim.claimer_name}
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div className="space-y-4">
            <div className="space-y-2">
              <Label
                htmlFor="admin-edit-title"
                className="text-[13px] font-medium text-ios-gray ml-1"
              >
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
                className="text-[13px] font-medium text-ios-gray ml-1"
              >
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
                  className="text-[13px] font-medium text-ios-gray ml-1"
                >
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
                  className="text-[13px] font-medium text-ios-gray ml-1"
                >
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
                  className="text-[13px] font-medium text-ios-gray ml-1"
                >
                  {t('adminWishlist.editItem.priorityLabel')}
                </Label>
                <Select
                  value={editItem.priority?.toString() || 'none'}
                  onValueChange={(value) =>
                    setEditItem({
                      ...editItem,
                      priority: value === 'none' ? null : parseInt(value),
                    })
                  }
                >
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

            {/* Gift Card Toggle */}
            <div className="space-y-2">
              <button
                type="button"
                onClick={handleGiftcardToggle}
                disabled={updating}
                className={`w-full bg-ios-secondary rounded-[12px] px-4 py-3 flex items-center justify-between ${
                  updating ? 'opacity-50' : ''
                }`}
              >
                <div className="flex flex-col items-start">
                  <span className="text-[15px] font-medium text-foreground">
                    {t('adminWishlist.editItem.isGiftcard')}
                  </span>
                  <span className="text-[12px] text-ios-gray mt-0.5">
                    {t('adminWishlist.editItem.isGiftcardDescription')}
                  </span>
                </div>
                <div
                  className={`w-[51px] h-[31px] rounded-full transition-colors ${
                    editItem.isGiftcard ? 'bg-ios-green' : 'bg-ios-gray/30'
                  }`}
                >
                  <div
                    className={`w-[27px] h-[27px] bg-white rounded-full shadow-sm mt-[2px] transition-transform ${
                      editItem.isGiftcard
                        ? 'translate-x-[22px]'
                        : 'translate-x-[2px]'
                    }`}
                  />
                </div>
              </button>
            </div>
          </div>

          <div className="space-y-3 pt-4">
            {isTakenItem && selectedItem && onUntake && (
              <Button
                type="button"
                variant="outline"
                onClick={() => onUntake(selectedItem)}
                className="w-full h-12 rounded-[12px] border-ios-separator/10 text-ios-blue font-semibold"
                disabled={updating}
              >
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
                disabled={updating}
              >
                <Trash2 className="w-4 h-4 mr-2" />
                {t('adminWishlist.deleteItem.title')}
              </Button>
            )}
          </div>
        </SheetDialogBody>
      </form>
    </>
  );
};

export const AdminEditItemDialog = (props: AdminEditItemDialogProps) => {
  const { open, onOpenChange } = props;

  return (
    <SheetDialog open={open} onOpenChange={onOpenChange}>
      <SheetDialogContent>
        <FormContent {...props} />
      </SheetDialogContent>
    </SheetDialog>
  );
};
