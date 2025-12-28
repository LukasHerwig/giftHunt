import { ReactNode } from 'react';

interface PageSubheaderProps {
  title?: string;
  description?: string;
  children?: ReactNode;
  actions?: ReactNode;
  trailing?: ReactNode;
}

const PageSubheader = ({
  title,
  description,
  children,
  actions,
  trailing,
}: PageSubheaderProps) => {
  return (
    <div className="px-4 py-6 bg-ios-background">
      <div className="flex items-center justify-between mb-1">
        <div className="flex-1 min-w-0">
          {title && (
            <h2 className="text-[34px] font-bold tracking-tight leading-tight">
              {title}
            </h2>
          )}
        </div>
        {(actions || trailing) && (
          <div className="flex items-center gap-2 ml-4">
            {actions}
            {trailing}
          </div>
        )}
      </div>
      {description && (
        <p className="text-[17px] text-ios-label-secondary leading-snug mt-1">
          {description}
        </p>
      )}
      {children && <div className="mt-4">{children}</div>}
    </div>
  );
};

export default PageSubheader;
