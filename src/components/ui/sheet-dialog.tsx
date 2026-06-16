import * as React from 'react';
import * as DialogPrimitive from '@radix-ui/react-dialog';
import { Sheet } from 'react-modal-sheet';
import { cn } from '@/lib/utils';
import { useIsMobile } from '@/hooks/use-mobile';

const SheetDialogContext = React.createContext<{ isMobile: boolean }>({
  isMobile: true,
});

interface SheetDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  children: React.ReactNode;
}

export const SheetDialog = ({
  open,
  onOpenChange,
  children,
}: SheetDialogProps) => {
  const isMobile = useIsMobile();

  if (isMobile) {
    return (
      <SheetDialogContext.Provider value={{ isMobile: true }}>
        <Sheet
          isOpen={open}
          onClose={() => onOpenChange(false)}
          detent="content"
          avoidKeyboard={true}
          modalEffectRootId="app-root">
          {children}
          <Sheet.Backdrop
            onTap={() => onOpenChange(false)}
            className="!bg-black/60"
          />
        </Sheet>
      </SheetDialogContext.Provider>
    );
  }

  return (
    <SheetDialogContext.Provider value={{ isMobile: false }}>
      <DialogPrimitive.Root open={open} onOpenChange={onOpenChange}>
        {children}
      </DialogPrimitive.Root>
    </SheetDialogContext.Provider>
  );
};

interface SheetDialogContentProps {
  children: React.ReactNode;
  className?: string;
}

export const SheetDialogContent = React.forwardRef<
  HTMLDivElement,
  SheetDialogContentProps
>(({ className, children }, ref) => {
  const { isMobile } = React.useContext(SheetDialogContext);

  if (isMobile) {
    return (
      <Sheet.Container
        className={cn(
          '!bg-ios-secondary rounded-t-[20px] shadow-2xl',
          className,
        )}>
        <Sheet.Header className="pb-0">
          <div className="mx-auto mt-3 mb-2 h-1.5 w-12 rounded-full bg-ios-separator/30" />
        </Sheet.Header>
        <Sheet.Content scrollClassName="pb-safe">
          <div ref={ref} className="flex flex-col">
            {children}
          </div>
        </Sheet.Content>
      </Sheet.Container>
    );
  }

  return (
    <DialogPrimitive.Portal>
      <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-black/60" />
      <DialogPrimitive.Content
        ref={ref}
        className={cn(
          'fixed left-[50%] top-[50%] z-50 w-full max-w-md translate-x-[-50%] translate-y-[-50%]',
          'bg-ios-secondary rounded-[24px] shadow-2xl',
          'overflow-y-auto max-h-[85vh]',
          className,
        )}>
        <div className="flex flex-col">{children}</div>
      </DialogPrimitive.Content>
    </DialogPrimitive.Portal>
  );
});
SheetDialogContent.displayName = 'SheetDialogContent';

interface SheetDialogHeaderProps {
  title: string;
  onClose: () => void;
  onSubmit?: () => void;
  submitDisabled?: boolean;
  loading?: boolean;
  showSubmit?: boolean;
  submitIcon?: React.ReactNode;
  closeIcon?: React.ReactNode;
}

export const SheetDialogHeader = ({
  title,
  onClose,
  onSubmit,
  submitDisabled = false,
  loading = false,
  showSubmit = true,
  submitIcon,
  closeIcon,
}: SheetDialogHeaderProps) => {
  return (
    <div className="flex items-center justify-between px-4 h-16 shrink-0">
      <button
        type="button"
        onClick={onClose}
        className="w-10 h-10 flex items-center justify-center bg-ios-background/50 rounded-full text-foreground active:opacity-50 transition-opacity">
        {closeIcon}
      </button>
      <h2 className="text-[20px] font-bold text-foreground">{title}</h2>
      {showSubmit ? (
        <button
          type="submit"
          onClick={onSubmit}
          disabled={submitDisabled || loading}
          className="w-10 h-10 flex items-center justify-center bg-ios-background/50 rounded-full text-ios-blue disabled:text-ios-gray active:opacity-50 transition-opacity">
          {submitIcon}
        </button>
      ) : (
        <div className="w-10 h-10" />
      )}
    </div>
  );
};

interface SheetDialogBodyProps {
  children: React.ReactNode;
  className?: string;
}

export const SheetDialogBody = ({
  children,
  className,
}: SheetDialogBodyProps) => {
  return (
    <div className={cn('px-4 pb-10 pt-2 space-y-8', className)}>{children}</div>
  );
};
