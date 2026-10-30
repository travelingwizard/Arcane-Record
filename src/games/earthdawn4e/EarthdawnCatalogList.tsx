import {
  useEffect,
  useMemo,
  useRef,
  useState,
  Fragment,
  type KeyboardEvent,
  type PointerEvent,
  type ReactNode,
} from 'react';

export type EarthdawnListColumn<Row> = {
  id: string;
  label: string;
  width?: number;
  minWidth?: number;
  maxWidth?: number;
  render: (row: Row) => ReactNode;
  sortValue?: (row: Row) => string | number;
};

export function EarthdawnCatalogList<Row extends { id: string }>({
  preferenceKey,
  columns,
  rows,
  action,
  details,
}: {
  preferenceKey: string;
  columns: EarthdawnListColumn<Row>[];
  rows: readonly Row[];
  action?: (row: Row) => ReactNode;
  details?: (row: Row) => ReactNode;
}) {
  const defaults = useMemo(
    () =>
      Object.fromEntries(
        columns.map((column) => [column.id, column.width ?? 160]),
      ),
    [columns],
  );
  const [widths, setWidths] = useState<Record<string, number>>(() => {
    try {
      const stored = JSON.parse(
        window.localStorage.getItem(`${preferenceKey}:columns`) ?? '{}',
      ) as Record<string, unknown>;
      return Object.fromEntries(
        columns.map((column) => {
          const value = stored[column.id];
          const minimum = column.minWidth ?? 88;
          const maximum = column.maxWidth ?? 480;
          return [
            column.id,
            typeof value === 'number' && Number.isFinite(value)
              ? Math.min(maximum, Math.max(minimum, value))
              : (column.width ?? 160),
          ];
        }),
      );
    } catch {
      return defaults;
    }
  });
  const [sort, setSort] = useState<{ id: string; direction: 1 | -1 } | null>(
    null,
  );
  const [expanded, setExpanded] = useState<Set<string>>(() => new Set());
  const dragRef = useRef<{
    id: string;
    startX: number;
    startWidth: number;
  } | null>(null);

  useEffect(() => {
    window.localStorage.setItem(
      `${preferenceKey}:columns`,
      JSON.stringify(widths),
    );
  }, [preferenceKey, widths]);

  const resize = (column: EarthdawnListColumn<Row>, next: number) =>
    setWidths((current) => ({
      ...current,
      [column.id]: Math.min(
        column.maxWidth ?? 480,
        Math.max(column.minWidth ?? 88, next),
      ),
    }));

  const pointerDown = (
    event: PointerEvent<HTMLButtonElement>,
    column: EarthdawnListColumn<Row>,
  ) => {
    event.currentTarget.setPointerCapture(event.pointerId);
    dragRef.current = {
      id: column.id,
      startX: event.clientX,
      startWidth: widths[column.id] ?? column.width ?? 160,
    };
  };
  const pointerMove = (
    event: PointerEvent<HTMLButtonElement>,
    column: EarthdawnListColumn<Row>,
  ) => {
    const drag = dragRef.current;
    if (!drag || drag.id !== column.id) return;
    resize(column, drag.startWidth + event.clientX - drag.startX);
  };
  const resizeKey = (
    event: KeyboardEvent<HTMLButtonElement>,
    column: EarthdawnListColumn<Row>,
  ) => {
    if (!['ArrowLeft', 'ArrowRight', 'Home'].includes(event.key)) return;
    event.preventDefault();
    if (event.key === 'Home') resize(column, column.width ?? 160);
    else
      resize(
        column,
        (widths[column.id] ?? column.width ?? 160) +
          (event.key === 'ArrowRight' ? 1 : -1) * (event.shiftKey ? 24 : 8),
      );
  };
  const sorted = useMemo(() => {
    if (!sort) return [...rows];
    const column = columns.find(({ id }) => id === sort.id);
    if (!column?.sortValue) return [...rows];
    return [...rows].sort(
      (left, right) =>
        String(column.sortValue?.(left) ?? '').localeCompare(
          String(column.sortValue?.(right) ?? ''),
          undefined,
          { numeric: true, sensitivity: 'base' },
        ) * sort.direction,
    );
  }, [columns, rows, sort]);

  return (
    <div className="earthdawn-catalog-list-region">
      <div className="earthdawn-catalog-list-actions">
        <button
          type="button"
          className="secondary-button compact-button"
          onClick={() => setWidths(defaults)}
        >
          Reset columns
        </button>
      </div>
      <div className="earthdawn-catalog-list-scroll" tabIndex={0}>
        <table className="earthdawn-catalog-list">
          <colgroup>
            {columns.map((column) => (
              <col key={column.id} style={{ width: widths[column.id] }} />
            ))}
            {details ? <col style={{ width: 52 }} /> : null}
            {action ? <col style={{ width: 56 }} /> : null}
          </colgroup>
          <thead>
            <tr>
              {columns.map((column) => (
                <th key={column.id} scope="col">
                  <button
                    type="button"
                    className="earthdawn-catalog-list-sort"
                    disabled={!column.sortValue}
                    onClick={() =>
                      setSort((current) =>
                        current?.id === column.id
                          ? {
                              id: column.id,
                              direction: current.direction === 1 ? -1 : 1,
                            }
                          : { id: column.id, direction: 1 },
                      )
                    }
                  >
                    {column.label}
                    {sort?.id === column.id
                      ? sort.direction === 1
                        ? ' ↑'
                        : ' ↓'
                      : ''}
                  </button>
                  <button
                    type="button"
                    className="earthdawn-column-resizer"
                    aria-label={`Resize ${column.label} column`}
                    title="Drag or use arrow keys to resize; Home resets"
                    onPointerDown={(event) => pointerDown(event, column)}
                    onPointerMove={(event) => pointerMove(event, column)}
                    onPointerUp={() => (dragRef.current = null)}
                    onKeyDown={(event) => resizeKey(event, column)}
                  />
                </th>
              ))}
              {details ? (
                <th scope="col">
                  <span className="sr-only">Details</span>
                </th>
              ) : null}
              {action ? (
                <th scope="col">
                  <span className="sr-only">Action</span>
                </th>
              ) : null}
            </tr>
          </thead>
          <tbody>
            {sorted.map((row) => (
              <Fragment key={row.id}>
                <tr key={row.id}>
                  {columns.map((column) => (
                    <td
                      key={column.id}
                      title={String(column.sortValue?.(row) ?? '')}
                    >
                      <span className="earthdawn-catalog-list-cell">
                        {column.render(row)}
                      </span>
                    </td>
                  ))}
                  {details ? (
                    <td>
                      <button
                        type="button"
                        className="icon-button"
                        aria-label={`${expanded.has(row.id) ? 'Hide' : 'Show'} details`}
                        aria-expanded={expanded.has(row.id)}
                        onClick={() =>
                          setExpanded((current) => {
                            const next = new Set(current);
                            if (next.has(row.id)) next.delete(row.id);
                            else next.add(row.id);
                            return next;
                          })
                        }
                      >
                        …
                      </button>
                    </td>
                  ) : null}
                  {action ? <td>{action(row)}</td> : null}
                </tr>
                {details && expanded.has(row.id) ? (
                  <tr
                    className="earthdawn-catalog-list-details"
                    key={`${row.id}:details`}
                  >
                    <td colSpan={columns.length + 2}>{details(row)}</td>
                  </tr>
                ) : null}
              </Fragment>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
