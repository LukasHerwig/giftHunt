import { useTranslation } from 'react-i18next';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Settings, Loader2, Trash2 } from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';
import { Wishlist, SettingsFormData } from '../types';

interface SettingsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  wishlist: Wishlist | null;
  setWishlist: (wishlist: Wishlist | null) => void;
  settings: SettingsFormData;
  setSettings: (settings: SettingsFormData) => void;
  onSubmit: (e: React.FormEvent) => Promise<void>;
  onDeleteWishlist: () => Promise<void>;
  updatingSettings: boolean;
  deleteDialogOpen: boolean;
  setDeleteDialogOpen: (open: boolean) => void;
}

export const SettingsDialog = ({
  open,
  onOpenChange,
  wishlist,
  setWishlist,
  settings,
  setSettings,
  onSubmit,
  onDeleteWishlist,
  updatingSettings,
  deleteDialogOpen,
  setDeleteDialogOpen,
}: SettingsDialogProps) => {
  const { t } = useTranslation();
  const isMobile = useIsMobile();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="text-ios-blue hover:bg-transparent active:opacity-50 h-9 w-9">
          <Settings className="w-6 h-6" />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px] rounded-[20px] bg-ios-secondary/95 backdrop-blur-xl border-ios-separator p-0 overflow-hidden">
        <DialogHeader className="p-6 pb-2">
          <DialogTitle className="text-center text-[17px] font-semibold">
            {t('manageWishlist.settingsTitle')}
          </DialogTitle>
          <DialogDescription className="text-center text-[13px] text-ios-gray">
            {t('manageWishlist.settingsDescription')}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={onSubmit} className="p-6 pt-2 space-y-6">
          {/* Wishlist Basic Information */}
          <div className="bg-ios-background rounded-[12px] border border-ios-separator overflow-hidden">
            <div className="px-4 py-3 border-b border-ios-separator">
              <Label
                htmlFor="wishlist-title"
                className="text-[13px] text-ios-gray uppercase tracking-wider mb-1 block">
                {t('manageWishlist.wishlistTitle')} *
              </Label>
              <Input
                id="wishlist-title"
                placeholder={t('manageWishlist.wishlistTitlePlaceholder')}
                value={wishlist?.title || ''}
                onChange={(e) =>
                  setWishlist(
                    wishlist ? { ...wishlist, title: e.target.value } : null
                  )
                }
                className="border-none bg-transparent p-0 h-auto text-[17px] focus-visible:ring-0 placeholder:text-ios-gray/50"
                disabled={updatingSettings}
                required
              />
            </div>

            <div className="px-4 py-3">
              <Label
                htmlFor="wishlist-description"
                className="text-[13px] text-ios-gray uppercase tracking-wider mb-1 block">
                {t('manageWishlist.wishlistDescription')}
              </Label>
              <Textarea
                id="wishlist-description"
                placeholder={t('manageWishlist.wishlistDescriptionPlaceholder')}
                value={wishlist?.description || ''}
                onChange={(e) =>
                  setWishlist(
                    wishlist
                      ? { ...wishlist, description: e.target.value }
                      : null
                  )
                }
                className="border-none bg-transparent p-0 h-auto text-[17px] focus-visible:ring-0 placeholder:text-ios-gray/50 resize-none min-h-[80px]"
                disabled={updatingSettings}
              />
            </div>
          </div>

          {/* Feature Toggles */}
          <div className="bg-ios-background rounded-[12px] border border-ios-separator overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 border-b border-ios-separator">
              <div className="space-y-0.5">
                <Label className="text-[17px] font-normal text-foreground">
                  {t('createWishlist.enableLinks')}
                </Label>
                <p className="text-[12px] text-ios-gray">
                  {t('createWishlist.enableLinksDescription')}
                </p>
              </div>
              <Switch
                checked={settings.enableLinks}
                onCheckedChange={(checked) =>
                  setSettings({ ...settings, enableLinks: checked })
                }
                disabled={updatingSettings}
                className="data-[state=checked]:bg-ios-green"
              />
            </div>

            <div className="flex items-center justify-between px-4 py-3 border-b border-ios-separator">
              <div className="space-y-0.5">
                <Label className="text-[17px] font-normal text-foreground">
                  {t('createWishlist.enablePrice')}
                </Label>
                <p className="text-[12px] text-ios-gray">
                  {t('createWishlist.enablePriceDescription')}
                </p>
              </div>
              <Switch
                checked={settings.enablePrice}
                onCheckedChange={(checked) =>
                  setSettings({ ...settings, enablePrice: checked })
                }
                disabled={updatingSettings}
                className="data-[state=checked]:bg-ios-green"
              />
            </div>

            <div className="flex items-center justify-between px-4 py-3">
              <div className="space-y-0.5">
                <Label className="text-[17px] font-normal text-foreground">
                  {t('createWishlist.enablePriority')}
                </Label>
                <p className="text-[12px] text-ios-gray">
                  {t('createWishlist.enablePriorityDescription')}
                </p>
              </div>
              <Switch
                checked={settings.enablePriority}
                onCheckedChange={(checked) =>
                  setSettings({ ...settings, enablePriority: checked })
                }
                disabled={updatingSettings}
                className="data-[state=checked]:bg-ios-green"
              />
            </div>
          </div>

          <div className="space-y-3">
            <Button
              type="submit"
              className="w-full bg-ios-blue hover:bg-ios-blue/90 text-white rounded-[12px] py-6 font-semibold text-[17px] shadow-lg active:opacity-70 transition-all"
              disabled={updatingSettings}>
              {updatingSettings ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  {t('common.updating')}
                </>
              ) : (
                t('common.saveChanges')
              )}
            </Button>

            <AlertDialog
              open={deleteDialogOpen}
              onOpenChange={setDeleteDialogOpen}>
              <AlertDialogTrigger asChild>
                <Button
                  type="button"
                  variant="ghost"
                  className="w-full text-destructive hover:bg-transparent active:bg-ios-tertiary rounded-[12px] py-6 font-normal text-[17px]">
                  <Trash2 className="w-5 h-5 mr-2" />
                  {t('manageWishlist.deleteWishlist')}
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent className="rounded-[14px] bg-ios-secondary/95 backdrop-blur-xl border-ios-separator">
                <AlertDialogHeader>
                  <AlertDialogTitle className="text-center text-[17px] font-semibold">
                    {t('deleteWishlistDialog.title')}
                  </AlertDialogTitle>
                  <AlertDialogDescription className="text-center text-[13px] text-foreground">
                    {t('deleteWishlistDialog.description', {
                      title: wishlist?.title,
                    })}
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter className="flex-col sm:flex-col gap-0 border-t border-ios-separator mt-4">
                  <AlertDialogAction
                    onClick={onDeleteWishlist}
                    className="bg-transparent text-destructive hover:bg-transparent active:bg-ios-tertiary font-semibold text-[17px] py-3 rounded-none border-b border-ios-separator">
                    {t('common.delete')}
                  </AlertDialogAction>
                  <AlertDialogCancel className="bg-transparent border-none text-ios-blue hover:bg-transparent active:bg-ios-tertiary font-normal text-[17px] py-3 rounded-none">
                    {t('common.cancel')}
                  </AlertDialogCancel>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
