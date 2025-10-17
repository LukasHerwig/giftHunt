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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>
        <Button variant="outline" size="lg" className="w-full sm:w-auto">
          <Settings className="w-5 h-5 mr-2" />
          {t('manageWishlist.settings')}
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t('manageWishlist.settingsTitle')}</DialogTitle>
          <DialogDescription>
            {t('manageWishlist.settingsDescription')}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={onSubmit} className="space-y-4">
          {/* Wishlist Basic Information */}
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="wishlist-title">
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
                className="text-base"
                disabled={updatingSettings}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="wishlist-description">
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
                className="text-base resize-none"
                rows={3}
                disabled={updatingSettings}
              />
            </div>
          </div>

          {/* Divider */}
          <div className="border-t border-border my-4"></div>

          {/* Field Configuration */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <label className="text-sm font-medium">
                  {t('createWishlist.enableLinks')}
                </label>
                <p className="text-xs text-muted-foreground">
                  {t('createWishlist.enableLinksDescription')}
                </p>
              </div>
              <Switch
                checked={settings.enableLinks}
                onCheckedChange={(checked) =>
                  setSettings({ ...settings, enableLinks: checked })
                }
                disabled={updatingSettings}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <label className="text-sm font-medium">
                  {t('createWishlist.enablePrice')}
                </label>
                <p className="text-xs text-muted-foreground">
                  {t('createWishlist.enablePriceDescription')}
                </p>
              </div>
              <Switch
                checked={settings.enablePrice}
                onCheckedChange={(checked) =>
                  setSettings({ ...settings, enablePrice: checked })
                }
                disabled={updatingSettings}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <label className="text-sm font-medium">
                  {t('createWishlist.enablePriority')}
                </label>
                <p className="text-xs text-muted-foreground">
                  {t('createWishlist.enablePriorityDescription')}
                </p>
              </div>
              <Switch
                checked={settings.enablePriority}
                onCheckedChange={(checked) =>
                  setSettings({ ...settings, enablePriority: checked })
                }
                disabled={updatingSettings}
              />
            </div>
          </div>

          <Button
            type="submit"
            className="w-full bg-gradient-to-r from-primary to-accent hover:opacity-90"
            disabled={updatingSettings}>
            {updatingSettings ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                {t('common.updating')}
              </>
            ) : (
              t('common.saveChanges')
            )}
          </Button>
        </form>

        {/* Danger Zone */}
        <div className="pt-4 border-t border-destructive/20">
          <h4 className="text-sm font-medium text-destructive mb-3">
            {t('manageWishlist.dangerZone')}
          </h4>
          <AlertDialog
            open={deleteDialogOpen}
            onOpenChange={setDeleteDialogOpen}>
            <AlertDialogTrigger asChild>
              <Button variant="destructive" className="w-full">
                <Trash2 className="w-4 h-4 mr-2" />
                {t('manageWishlist.deleteWishlist')}
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>
                  {t('deleteWishlistDialog.title')}
                </AlertDialogTitle>
                <AlertDialogDescription>
                  {t('deleteWishlistDialog.description', {
                    title: wishlist?.title,
                  })}
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>{t('common.cancel')}</AlertDialogCancel>
                <AlertDialogAction
                  onClick={onDeleteWishlist}
                  className="bg-destructive hover:bg-destructive/90">
                  {t('common.delete')}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </DialogContent>
    </Dialog>
  );
};
