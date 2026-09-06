import type { HTMLAttributes, LabelHTMLAttributes, ReactNode } from 'react';

export type SheetGridColumns = 1 | 2 | 3 | 4 | 'auto';

const classes = (...values: Array<string | false | null | undefined>) =>
  values.filter(Boolean).join(' ');

export function SheetFieldGrid({
  columns = 'auto',
  className,
  children,
  ...props
}: HTMLAttributes<HTMLDivElement> & {
  columns?: SheetGridColumns;
}) {
  return (
    <div
      {...props}
      className={classes('sheet-field-grid', className)}
      data-columns={columns}
    >
      {children}
    </div>
  );
}

export function SheetField({
  label,
  className,
  children,
  ...props
}: Omit<LabelHTMLAttributes<HTMLLabelElement>, 'children'> & {
  label: ReactNode;
  children: ReactNode;
}) {
  return (
    <label {...props} className={classes('sheet-field', className)}>
      <span className="sheet-field__label">{label}</span>
      {children}
    </label>
  );
}

export function SheetCard({
  className,
  density = 'standard',
  selected = false,
  children,
  ...props
}: HTMLAttributes<HTMLElement> & {
  density?: 'standard' | 'compact';
  selected?: boolean;
}) {
  return (
    <article
      {...props}
      className={classes(
        'sheet-card',
        density === 'compact' && 'sheet-card--compact',
        selected && 'sheet-card--selected',
        className,
      )}
    >
      {children}
    </article>
  );
}

export function SheetToolbar({
  className,
  children,
  ...props
}: HTMLAttributes<HTMLDivElement>) {
  return (
    <div {...props} className={classes('sheet-toolbar', className)}>
      {children}
    </div>
  );
}

export function SheetNotice({
  className,
  tone = 'info',
  children,
  ...props
}: HTMLAttributes<HTMLDivElement> & {
  tone?: 'info' | 'success' | 'warning' | 'danger';
}) {
  return (
    <div
      {...props}
      className={classes('sheet-notice', `sheet-notice--${tone}`, className)}
    >
      {children}
    </div>
  );
}

export function SheetBadge({
  className,
  tone = 'neutral',
  children,
  ...props
}: HTMLAttributes<HTMLSpanElement> & {
  tone?: 'neutral' | 'accent' | 'success' | 'warning' | 'danger';
}) {
  return (
    <span
      {...props}
      className={classes('sheet-badge', `sheet-badge--${tone}`, className)}
    >
      {children}
    </span>
  );
}

export function SheetEmptyState({
  className,
  children,
  ...props
}: HTMLAttributes<HTMLParagraphElement>) {
  return (
    <p {...props} className={classes('sheet-empty-state', className)}>
      {children}
    </p>
  );
}
