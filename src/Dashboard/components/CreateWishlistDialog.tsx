import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Loader2 } from 'lucide-react';

interface CreateWishlistDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (e: React.FormEvent) => Promise<void>;
  newTitle: string;
  onTitleChange: (title: string) => void;
  newDescription: string;
  onDescriptionChange: (description: string) => void;
  enableLinks: boolean;
  onEnableLinksChange: (enable: boolean) => void;
  enablePrice: boolean;
  onEnablePriceChange: (enable: boolean) => void;
  enablePriority: boolean;
  onEnablePriorityChange: (enable: boolean) => void;
  creating: boolean;
}

export const CreateWishlistDialog = ({
  open,
  onOpenChange,
  onSubmit,
  newTitle,
  onTitleChange,
  newDescription,
  onDescriptionChange,
  enableLinks,
  onEnableLinksChange,
  enablePrice,
  onEnablePriceChange,
  enablePriority,
  onEnablePriorityChange,
  creating,
}: CreateWishlistDialogProps) => {
  const { t } = useTranslation();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px] p-0 overflow-hidden bg-ios-secondary border-none rounded-[20px] shadow-2xl">
        <DialogHeader className="p-6 pb-2 text-center">
          <DialogTitle className="text-[17px] font-semibold text-ios-label-primary">
            {t('createWishlistDialog.title')}
          </DialogTitle>
          <DialogDescription className="text-[13px] text-ios-label-secondary">
            {t('createWishlistDialog.description')}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={onSubmit} className="p-4 space-y-6">
          <div className="space-y-0.5">
            <div className="bg-ios-background rounded-[10px] overflow-hidden divide-y divide-ios-separator border border-ios-separator/50">
              <div className="px-4">
                <input
                  placeholder={t('createWishlistDialog.titlePlaceholder')}
                  value={newTitle}
                  onChange={(e) => onTitleChange(e.target.value)}
                  className="w-full h-11 bg-transparent text-[17px] outline-none placeholder-ios-label-tertiary text-ios-label-primary"
                  disabled={creating}
                />
              </div>
              <div className="px-4 py-2">
                <textarea
                  placeholder={t('createWishlistDialog.descriptionPlaceholder')}
                  value={newDescription}
                  onChange={(e) => onDescriptionChange(e.target.value)}
                  className="w-full bg-transparent text-[17px] outline-none placeholder-ios-label-tertiary text-ios-label-primary resize-none"
                  rows={3}
                  disabled={creating}
                />
              </div>
            </div>
          </div>

          {/* Configuration Options */}
          <div className="space-y-2">
            <h4 className="px-4 text-[13px] font-normal text-ios-label-secondary uppercase tracking-wider">
              {t('createWishlistDialog.itemFeatures')}
            </h4>

            <div className="bg-ios-background rounded-[10px] overflow-hidden divide-y divide-ios-separator border border-ios-separator/50">
              <div className="flex items-center justify-between px-4 h-11">
                <Label
                  htmlFor="enable-links"
                  className="text-[17px] font-normal text-ios-label-primary">
                  {t('createWishlistDialog.enableLinks')}
                </Label>
                <Switch
                  id="enable-links"
                  checked={enableLinks}
                  onCheckedChange={onEnableLinksChange}
                  disabled={creating}
                  className="data-[state=checked]:bg-ios-green"
                />
              </div>

              <div className="flex items-center justify-between px-4 h-11">
                <Label
                  htmlFor="enable-price"
                  className="text-[17px] font-normal text-ios-label-primary">
                  {t('createWishlistDialog.enablePrice')}
                </Label>
                <Switch
                  id="enable-price"
                  checked={enablePrice}
                  onCheckedChange={onEnablePriceChange}
                  disabled={creating}
                  className="data-[state=checked]:bg-ios-green"
                />
              </div>

              <div className="flex items-center justify-between px-4 h-11">
                <Label
                  htmlFor="enable-priority"
                  className="text-[17px] font-normal text-ios-label-primary">
                  {t('createWishlistDialog.enablePriority')}
                </Label>
                <Switch
                  id="enable-priority"
                  checked={enablePriority}
                  onCheckedChange={onEnablePriorityChange}
                  disabled={creating}
                  className="data-[state=checked]:bg-ios-green"
                />
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-3 pt-2">
            <button
              type="submit"
              className="w-full h-12 bg-ios-blue text-white rounded-[12px] text-[17px] font-semibold active:opacity-70 transition-all disabled:opacity-50 flex items-center justify-center"
              disabled={creating}>
              {creating ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                t('createWishlistDialog.createButton')
              )}
            </button>
            <button
              type="button"
              onClick={() => onOpenChange(false)}
              className="w-full h-12 text-ios-blue text-[17px] font-normal active:opacity-50 transition-all"
              disabled={creating}>
              {t('common.cancel')}
            </button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
