import { ReactNode } from 'react';

interface PageSubheaderProps {
  title?: string;
  description?: string;
  children?: ReactNode;
  actions?: ReactNode;
}

const PageSubheader = ({
  title,
  description,
  children,
  actions,
}: PageSubheaderProps) => {
  return (
    <div className="container mx-auto px-4 py-4">
      <div className="flex items-center justify-between">
        {actions && <div className="flex items-center gap-2">{actions}</div>}
        <div className="flex-1">
          {title && <h2 className="text-xl font-semibold">{title}</h2>}
          {description && (
            <p className="text-muted-foreground text-sm mt-1">{description}</p>
          )}
          {children}
        </div>
      </div>
    </div>
  );
};

export default PageSubheader;
