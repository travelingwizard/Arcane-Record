import type { ReactNode } from 'react';

interface SheetSectionProps {
  id?: string;
  eyebrow?: string;
  title: string;
  description?: string;
  actions?: ReactNode;
  children: ReactNode;
  className?: string;
}

export function SheetSection({
  id,
  eyebrow,
  title,
  description,
  actions,
  children,
  className = '',
}: SheetSectionProps) {
  return (
    <section
      className={`sheet-section ${className}`.trim()}
      aria-labelledby={id ? `${id}-title` : undefined}
    >
      <div className="sheet-section__heading">
        <div>
          {eyebrow ? <p className="eyebrow">{eyebrow}</p> : null}
          <h2 id={id ? `${id}-title` : undefined}>{title}</h2>
          {description ? (
            <p className="sheet-section__description">{description}</p>
          ) : null}
        </div>
        {actions ? (
          <div className="sheet-section__actions">{actions}</div>
        ) : null}
      </div>
      {children}
    </section>
  );
}
