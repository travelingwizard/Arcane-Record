import { useId, useState, type KeyboardEvent } from 'react';

export function DescriptionPreview({
  name,
  description,
}: {
  name: string;
  description: string;
}) {
  const tooltipId = useId();
  const [open, setOpen] = useState(false);

  const handleKeyDown = (event: KeyboardEvent<HTMLButtonElement>) => {
    if (event.key === 'Escape') {
      event.preventDefault();
      setOpen(false);
    }
  };

  return (
    <span
      className="description-preview"
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
    >
      <button
        type="button"
        className="icon-button"
        aria-label={`Preview description for ${name}`}
        aria-describedby={open ? tooltipId : undefined}
        aria-expanded={open}
        onClick={() => setOpen(true)}
        onFocus={() => setOpen(true)}
        onBlur={() => setOpen(false)}
        onKeyDown={handleKeyDown}
      >
        i
      </button>
      {open ? (
        <span
          className="description-preview__tooltip"
          id={tooltipId}
          role="tooltip"
        >
          {description}
        </span>
      ) : null}
    </span>
  );
}
