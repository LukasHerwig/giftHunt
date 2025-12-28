import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
} from '@/components/ui/drawer';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Loader2, X, Check, Gift, Camera } from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';

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

interface FormContentProps extends CreateWishlistDialogProps {
  t: any;
}

const FormContent = (props: FormContentProps) => (
  <form onSubmit={props.onSubmit} className="flex flex-col h-full">
    {/* Header */}
    <div className="flex items-center justify-between px-4 h-16">
      <button
        type="button"
        onClick={() => props.onOpenChange(false)}
        className="w-10 h-10 flex items-center justify-center bg-ios-background/50 rounded-full text-foreground active:opacity-50 transition-opacity">
        <X className="w-5 h-5" />
      </button>
      <h2 className="text-[20px] font-bold text-foreground">
        {props.t('createWishlistDialog.title')}
      </h2>
      <button
        type="submit"
        disabled={props.creating || !props.newTitle.trim()}
        className="w-10 h-10 flex items-center justify-center bg-ios-background/50 rounded-full text-ios-blue disabled:text-ios-gray active:opacity-50 transition-opacity">
        {props.creating ? (
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
              <Gift className="w-24 h-24 text-ios-blue opacity-20 absolute -top-4 -left-4" />
              <Gift className="w-24 h-24 text-ios-blue opacity-40 absolute top-4 left-4" />
              <Gift className="w-32 h-32 text-ios-blue relative z-10" />
            </div>
          </div>
        </div>
      </div>

      {/* Inputs */}
      <div className="space-y-6">
        <div className="bg-ios-background/50 rounded-[16px] px-4 py-4 border border-ios-separator/5">
          <input
            placeholder={props.t('createWishlistDialog.titlePlaceholder')}
            value={props.newTitle}
            onChange={(e) => props.onTitleChange(e.target.value)}
            className="w-full bg-transparent text-[17px] outline-none placeholder-ios-gray text-foreground"
            disabled={props.creating}
          />
        </div>

        <div className="bg-ios-background/50 rounded-[16px] px-4 py-4 border border-ios-separator/5">
          <textarea
            placeholder={props.t('createWishlistDialog.descriptionPlaceholder')}
            value={props.newDescription}
            onChange={(e) => props.onDescriptionChange(e.target.value)}
            className="w-full bg-transparent text-[17px] outline-none placeholder-ios-gray text-foreground resize-none"
            rows={2}
            disabled={props.creating}
          />
        </div>

        {/* Configuration Options */}
        <div className="space-y-2">
          <h4 className="px-1 text-[13px] font-medium text-ios-gray uppercase tracking-wider">
            {props.t('createWishlistDialog.itemFeatures')}
          </h4>

          <div className="bg-ios-background/50 rounded-[16px] overflow-hidden divide-y divide-ios-separator/10 border border-ios-separator/5">
            <div className="flex items-center justify-between px-4 h-12">
              <Label
                htmlFor="enable-links"
                className="text-[17px] font-normal text-foreground">
                {props.t('createWishlistDialog.enableLinks')}
              </Label>
              <Switch
                id="enable-links"
                checked={props.enableLinks}
                onCheckedChange={props.onEnableLinksChange}
                disabled={props.creating}
                className="data-[state=checked]:bg-ios-blue"
              />
            </div>

            <div className="flex items-center justify-between px-4 h-12">
              <Label
                htmlFor="enable-price"
                className="text-[17px] font-normal text-foreground">
                {props.t('createWishlistDialog.enablePrice')}
              </Label>
              <Switch
                id="enable-price"
                checked={props.enablePrice}
                onCheckedChange={props.onEnablePriceChange}
                disabled={props.creating}
                className="data-[state=checked]:bg-ios-blue"
              />
            </div>

            <div className="flex items-center justify-between px-4 h-12">
              <Label
                htmlFor="enable-priority"
                className="text-[17px] font-normal text-foreground">
                {props.t('createWishlistDialog.enablePriority')}
              </Label>
              <Switch
                id="enable-priority"
                checked={props.enablePriority}
                onCheckedChange={props.onEnablePriorityChange}
                disabled={props.creating}
                className="data-[state=checked]:bg-ios-blue"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  </form>
);

export const CreateWishlistDialog = (props: CreateWishlistDialogProps) => {
  const isMobile = useIsMobile();
  const { t } = useTranslation();

  if (isMobile) {
    return (
      <Drawer open={props.open} onOpenChange={props.onOpenChange}>
        <DrawerContent className="h-[92vh] bg-ios-secondary border-none rounded-t-[20px]">
          <FormContent {...props} t={t} />
        </DrawerContent>
      </Drawer>
    );
  }

  return (
    <Dialog open={props.open} onOpenChange={props.onOpenChange}>
      <DialogContent
        hideClose
        className="sm:max-w-[425px] p-0 overflow-hidden bg-ios-secondary border-none rounded-[24px] shadow-2xl">
        <FormContent {...props} t={t} />
      </DialogContent>
    </Dialog>
  );
};
