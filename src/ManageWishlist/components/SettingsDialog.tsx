import { useTranslation } from 'react-i18next';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Drawer, DrawerContent } from '@/components/ui/drawer';
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
import { Label } from '@/components/ui/switch';
import { Switch } from '@/components/ui/switch';
import { Loader2, Trash2, X, Check, Settings } from 'lucide-react';
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

interface FormContentProps {
  onSubmit: (e: React.FormEvent) => Promise<void>;
  onOpenChange: (open: boolean) => void;
  updatingSettings: boolean;
  wishlist: Wishlist | null;
  setWishlist: (wishlist: Wishlist | null) => void;
  settings: SettingsFormData;
  setSettings: (settings: SettingsFormData) => void;
  onDeleteWishlist: () => Promise<void>;
  deleteDialogOpen: boolean;
  setDeleteDialogOpen: (open: boolean) => void;
  t: any;
}

const FormContent = ({
  onSubmit,
  onOpenChange,
  updatingSettings,
  wishlist,
  setWishlist,
  settings,
  setSettings,
  onDeleteWishlist,
  deleteDialogOpen,
  setDeleteDialogOpen,
  t,
}: FormContentProps) => (
  <form onSubmit={onSubmit} className="flex flex-col h-full">
    {/* Header */}
    <div className="flex items-center justify-between px-4 h-16">
      <button
        type="button"
        onClick={() => onOpenChange(false)}
        className="w-10 h-10 flex items-center justify-center bg-ios-background/50 rounded-full text-foreground active:opacity-50 transition-opacity">
        <X className="w-5 h-5" />
      </button>
      <h2 className="text-[20px] font-bold text-foreground">
        {t('manageWishlist.settingsTitle')}
      </h2>
      <button
        type="submit"
        disabled={updatingSettings || !wishlist?.title.trim()}
        className="w-10 h-10 flex items-center justify-center bg-ios-background/50 rounded-full text-ios-blue disabled:text-ios-gray active:opacity-50 transition-opacity">
        {updatingSettings ? (
          <Loader2 className="w-5 h-5 animate-spin" />
        ) : (
          <Check className="w-5 h-5" />
        )}
      </button>
    </div>

    <div className="flex-1 overflow-y-auto px-4 pb-10 pt-2 space-y-8">
      {/* Icon Placeholder */}
      <div className="flex flex-col items-center">
        <div className="w-48 h-48 relative">
          <div className="absolute inset-0 bg-ios-blue/10 rounded-full blur-3xl" />
          <div className="relative w-full h-full flex items-center justify-center">
            <div className="relative">
              <Settings className="w-24 h-24 text-ios-blue opacity-20 absolute -top-4 -left-4" />
              <Settings className="w-24 h-24 text-ios-blue opacity-40 absolute top-4 left-4" />
              <Settings className="w-32 h-32 text-ios-blue relative z-10" />
            </div>
          </div>
        </div>
      </div>

      {/* Inputs */}
      <div className="space-y-6">
        <div className="space-y-2">
          <label className="px-1 text-[13px] font-medium text-ios-gray uppercase tracking-wider">
            {t('manageWishlist.wishlistTitle')}
          </label>
          <div className="bg-ios-background/50 rounded-[20px] px-5 py-4 border border-ios-separator/5">
            <input
              placeholder={t('manageWishlist.wishlistTitlePlaceholder')}
              value={wishlist?.title || ''}
              onChange={(e) =>
                setWishlist(
                  wishlist ? { ...wishlist, title: e.target.value } : null
                )
              }
              className="w-full bg-transparent text-[17px] outline-none placeholder-ios-gray text-foreground"
              disabled={updatingSettings}
              required
            />
          </div>
        </div>

        <div className="space-y-2">
          <label className="px-1 text-[13px] font-medium text-ios-gray uppercase tracking-wider">
            {t('manageWishlist.wishlistDescription')}
          </label>
          <div className="bg-ios-background/50 rounded-[20px] px-5 py-4 border border-ios-separator/5">
            <textarea
              placeholder={t('manageWishlist.wishlistDescriptionPlaceholder')}
              value={wishlist?.description || ''}
              onChange={(e) =>
                setWishlist(
                  wishlist ? { ...wishlist, description: e.target.value } : null
                )
              }
              className="w-full bg-transparent text-[17px] outline-none placeholder-ios-gray text-foreground resize-none"
              rows={3}
              disabled={updatingSettings}
            />
          </div>
        </div>

        {/* Feature Toggles */}
        <div className="space-y-4">
          <label className="px-1 text-[13px] font-medium text-ios-gray uppercase tracking-wider">
            {t('manageWishlist.featuresLabel')}
          </label>
          <div className="bg-ios-background/50 rounded-[24px] border border-ios-separator/5 overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-ios-separator/10">
              <div className="space-y-0.5">
                <span className="text-[17px] font-normal text-foreground">
                  {t('createWishlist.enableLinks')}
                </span>
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

            <div className="flex items-center justify-between px-5 py-4 border-b border-ios-separator/10">
              <div className="space-y-0.5">
                <span className="text-[17px] font-normal text-foreground">
                  {t('createWishlist.enablePrice')}
                </span>
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

            <div className="flex items-center justify-between px-5 py-4">
              <div className="space-y-0.5">
                <span className="text-[17px] font-normal text-foreground">
                  {t('createWishlist.enablePriority')}
                </span>
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
        </div>

        {/* Danger Zone */}
        <div className="pt-4">
          <AlertDialog
            open={deleteDialogOpen}
            onOpenChange={setDeleteDialogOpen}>
            <AlertDialogTrigger asChild>
              <Button
                type="button"
                variant="ghost"
                className="w-full text-destructive hover:bg-destructive/10 hover:text-destructive rounded-[20px] py-6 font-medium text-[17px] border border-destructive/20">
                <Trash2 className="w-5 h-5 mr-2" />
                {t('manageWishlist.deleteWishlist')}
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent className="rounded-[24px] bg-ios-secondary/95 backdrop-blur-xl border-ios-separator max-w-[90vw] sm:max-w-[400px]">
              <AlertDialogHeader>
                <AlertDialogTitle className="text-center text-[17px] font-semibold">
                  {t('deleteWishlistDialog.title')}
                </AlertDialogTitle>
                <AlertDialogDescription className="text-center text-[13px] text-ios-gray">
                  {t('deleteWishlistDialog.description', {
                    title: wishlist?.title,
                  })}
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter className="flex-col sm:flex-col gap-2 mt-4">
                <AlertDialogAction
                  onClick={onDeleteWishlist}
                  className="bg-destructive hover:bg-destructive/90 text-white rounded-[14px] py-6 font-semibold text-[17px] w-full">
                  {t('common.delete')}
                </AlertDialogAction>
                <AlertDialogCancel className="bg-ios-tertiary hover:bg-ios-tertiary/80 border-none rounded-[14px] py-6 font-medium text-[17px] w-full">
                  {t('common.cancel')}
                </AlertDialogCancel>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>
    </div>
  </form>
);

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

  const formProps = {
    onSubmit,
    onOpenChange,
    updatingSettings,
    wishlist,
    setWishlist,
    settings,
    setSettings,
    onDeleteWishlist,
    deleteDialogOpen,
    setDeleteDialogOpen,
    t,
  };

  if (isMobile) {
    return (
      <Drawer open={open} onOpenChange={onOpenChange}>
        <DrawerContent className="h-[92vh] bg-ios-secondary border-none rounded-t-[20px]">
          <FormContent {...formProps} />
        </DrawerContent>
      </Drawer>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        hideClose
        className="sm:max-w-[425px] p-0 overflow-hidden bg-ios-secondary border-none rounded-[24px] shadow-2xl">
        <FormContent {...formProps} />
      </DialogContent>
    </Dialog>
  );
};
