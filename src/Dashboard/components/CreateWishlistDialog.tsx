import { useTranslation } from 'react-i18next';
import {
  SheetDialog,
  SheetDialogContent,
  SheetDialogHeader,
  SheetDialogBody,
} from '@/components/ui/sheet-dialog';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Loader2, X, Check, Gift } from 'lucide-react';

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
  t: ReturnType<typeof useTranslation>['t'];
}

const FormContent = (props: FormContentProps) => (
  <form onSubmit={props.onSubmit}>
    <SheetDialogHeader
      title={props.t('createWishlistDialog.title')}
      onClose={() => props.onOpenChange(false)}
      submitDisabled={props.creating || !props.newTitle.trim()}
      loading={props.creating}
      closeIcon={<X className="w-5 h-5" />}
      submitIcon={
        props.creating ? (
          <Loader2 className="w-5 h-5 animate-spin" />
        ) : (
          <Check className="w-5 h-5" />
        )
      }
    />

    <SheetDialogBody>
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
                className="text-[17px] font-normal text-foreground"
              >
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
                className="text-[17px] font-normal text-foreground"
              >
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
                className="text-[17px] font-normal text-foreground"
              >
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
    </SheetDialogBody>
  </form>
);

export const CreateWishlistDialog = (props: CreateWishlistDialogProps) => {
  const { t } = useTranslation();

  return (
    <SheetDialog open={props.open} onOpenChange={props.onOpenChange}>
      <SheetDialogContent>
        <FormContent {...props} t={t} />
      </SheetDialogContent>
    </SheetDialog>
  );
};
