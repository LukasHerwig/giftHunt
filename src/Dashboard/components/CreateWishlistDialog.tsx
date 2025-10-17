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
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t('createWishlistDialog.title')}</DialogTitle>
          <DialogDescription>
            {t('createWishlistDialog.description')}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={onSubmit} className="space-y-4">
          <div className="space-y-2">
            <Input
              placeholder={t('createWishlistDialog.titlePlaceholder')}
              value={newTitle}
              onChange={(e) => onTitleChange(e.target.value)}
              className="text-base"
              disabled={creating}
            />
          </div>
          <div className="space-y-2">
            <Textarea
              placeholder={t('createWishlistDialog.descriptionPlaceholder')}
              value={newDescription}
              onChange={(e) => onDescriptionChange(e.target.value)}
              className="text-base resize-none"
              rows={3}
              disabled={creating}
            />
          </div>

          {/* Configuration Options */}
          <div className="space-y-4 pt-2 border-t">
            <h4 className="text-sm font-medium text-muted-foreground">
              {t('createWishlistDialog.itemFeatures')}
            </h4>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label htmlFor="enable-links" className="text-sm">
                  {t('createWishlistDialog.enableLinks')}
                </Label>
                <Switch
                  id="enable-links"
                  checked={enableLinks}
                  onCheckedChange={onEnableLinksChange}
                  disabled={creating}
                />
              </div>

              <div className="flex items-center justify-between">
                <Label htmlFor="enable-price" className="text-sm">
                  {t('createWishlistDialog.enablePrice')}
                </Label>
                <Switch
                  id="enable-price"
                  checked={enablePrice}
                  onCheckedChange={onEnablePriceChange}
                  disabled={creating}
                />
              </div>

              <div className="flex items-center justify-between">
                <Label htmlFor="enable-priority" className="text-sm">
                  {t('createWishlistDialog.enablePriority')}
                </Label>
                <Switch
                  id="enable-priority"
                  checked={enablePriority}
                  onCheckedChange={onEnablePriorityChange}
                  disabled={creating}
                />
              </div>
            </div>
          </div>

          <Button
            type="submit"
            className="w-full bg-primary hover:bg-primary/90"
            disabled={creating}>
            {creating ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                {t('createWishlistDialog.creating')}
              </>
            ) : (
              t('createWishlistDialog.createButton')
            )}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
};
