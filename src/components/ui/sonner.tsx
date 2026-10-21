import { useTheme } from "next-themes";
import { Toaster as Sonner, toast } from "sonner";

type ToasterProps = React.ComponentProps<typeof Sonner>;

const Toaster = ({ ...props }: ToasterProps) => {
  const { theme = "system" } = useTheme();

  return (
    <Sonner
      theme={theme as ToasterProps["theme"]}
      className="toaster group"
      position="bottom-right"
      visibleToasts={2}
      offset={{ bottom: 'calc(16px + env(safe-area-inset-bottom))', right: 16 }}
      mobileOffset={{ bottom: 'calc(16px + env(safe-area-inset-bottom))', left: 16, right: 16 }}
      toastOptions={{ unstyled: true }}
      {...props}
    />
  );
};

export { Toaster, toast };
