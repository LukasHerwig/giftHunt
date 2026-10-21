import { useRef, type ReactNode } from 'react';
import { X } from 'lucide-react';
import * as DialogPrimitive from '@radix-ui/react-dialog';
import { Sheet } from 'react-modal-sheet';
import { useIsMobile } from '@/hooks/use-mobile';

interface ResponsiveSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Heading of the desktop panel (the mobile sheet has none). */
  title: string;
  /** Muted line under the desktop heading. */
  subtitle?: string;
  closeLabel: string;
  /** Mobile has no header; forms show the title as a heading above the content. */
  showTitleOnMobile?: boolean;
  children: ReactNode;
}

/**
 * Content, choices and input open as a bottom sheet on mobile and a side panel
 * on desktop (the GiftHunt BottomSheet / SidePanel).
 */
export const ResponsiveSheet = ({
  open,
  onOpenChange,
  title,
  subtitle,
  closeLabel,
  showTitleOnMobile = false,
  children,
}: ResponsiveSheetProps) => {
  const isMobile = useIsMobile();
  // The panel is opened from code, not from a Radix trigger, so remember what had
  // focus (the item row) and give it back when the panel closes.
  const returnFocusTo = useRef<HTMLElement | null>(null);

  if (isMobile) {
    return (
      <Sheet
        isOpen={open}
        onClose={() => onOpenChange(false)}
        detent="content"
        avoidKeyboard={true}
        modalEffectRootId="app-root">
        <Sheet.Container className="!rounded-t-gh-sheet !bg-gh-surface-200 !shadow-gh-sheet">
          <Sheet.Header className="pb-0">
            <div className="mx-auto mb-2 mt-3 h-1.5 w-9 rounded-gh-pill bg-gh-line-strong" />
          </Sheet.Header>
          <Sheet.Content scrollClassName="pb-safe">
            <div className="flex flex-col gap-4 px-4 pb-6 pt-2">
              {showTitleOnMobile && (
                <div className="flex flex-col gap-1">
                  <h2 className="text-[22px] font-bold leading-7 text-gh-ink">{title}</h2>
                  {subtitle && <p className="text-[13px] leading-[18px] text-gh-muted">{subtitle}</p>}
                </div>
              )}
              {children}
            </div>
          </Sheet.Content>
        </Sheet.Container>
        <Sheet.Backdrop onTap={() => onOpenChange(false)} className="!bg-gh-scrim" />
      </Sheet>
    );
  }

  return (
    <DialogPrimitive.Root open={open} onOpenChange={onOpenChange}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-gh-scrim data-[state=closed]:animate-out data-[state=open]:animate-in data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 motion-reduce:animate-none" />
        <DialogPrimitive.Content
          aria-describedby={undefined}
          onOpenAutoFocus={() => {
            returnFocusTo.current = document.activeElement as HTMLElement | null;
          }}
          onCloseAutoFocus={(event) => {
            if (returnFocusTo.current?.isConnected) {
              event.preventDefault();
              returnFocusTo.current.focus();
            }
          }}
          className="fixed inset-y-0 right-0 z-50 flex w-full max-w-[440px] flex-col bg-gh-surface-100 shadow-gh-panel duration-300 data-[state=closed]:animate-out data-[state=open]:animate-in data-[state=closed]:slide-out-to-right data-[state=open]:slide-in-from-right motion-reduce:animate-none">
          <div className="flex min-h-[64px] shrink-0 items-center gap-2 border-b border-gh-line px-3">
            <DialogPrimitive.Close
              aria-label={closeLabel}
              className="flex h-11 w-11 items-center justify-center rounded-gh-md text-gh-ink hover:bg-gh-surface-400 active:scale-[0.97]">
              <X className="h-5 w-5" aria-hidden="true" />
            </DialogPrimitive.Close>
            <div className="min-w-0 flex-1">
              <DialogPrimitive.Title className="text-[22px] font-bold leading-7 text-gh-ink">
                {title}
              </DialogPrimitive.Title>
              {subtitle && (
                <p className="truncate text-[13px] leading-[18px] text-gh-muted">{subtitle}</p>
              )}
            </div>
          </div>
          <div className="flex flex-1 flex-col gap-4 overflow-y-auto p-5">{children}</div>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
};
