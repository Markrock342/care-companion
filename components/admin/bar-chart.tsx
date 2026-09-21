/** Two-series weekly bars, drawn with plain divs so it works without a chart library. */
export function WeeklyBars({
  data,
  labels,
}: {
  data: { label: string; created: number; completed: number }[];
  labels: { created: string; completed: string };
}) {
  const max = Math.max(1, ...data.map((row) => row.created));

  return (
    <figure className="m-0">
      <div className="flex items-end gap-2 overflow-x-auto pb-1" role="img" aria-label={labels.created}>
        {data.map((row) => (
          <div key={row.label} className="flex min-w-10 flex-1 flex-col items-center gap-2">
            <span className="text-xs font-bold text-ink-soft">{row.created}</span>
            <div className="relative flex h-32 w-full items-end justify-center">
              <div
                className="w-full rounded-t-lg bg-ink/15"
                style={{ height: `${Math.max(3, (row.created / max) * 100)}%` }}
                title={`${labels.created}: ${row.created}`}
              />
              <div
                className="absolute bottom-0 w-full rounded-t-lg bg-flame"
                style={{ height: `${Math.max(row.completed ? 3 : 0, (row.completed / max) * 100)}%` }}
                title={`${labels.completed}: ${row.completed}`}
              />
            </div>
            <span className="whitespace-nowrap text-[11px] text-ink-soft">{row.label}</span>
          </div>
        ))}
      </div>
      <figcaption className="mt-3 flex flex-wrap gap-4 text-xs text-ink-soft">
        <span className="flex items-center gap-1.5">
          <span className="inline-block size-3 rounded bg-ink/15" aria-hidden />
          {labels.created}
        </span>
        <span className="flex items-center gap-1.5">
          <span className="inline-block size-3 rounded bg-flame" aria-hidden />
          {labels.completed}
        </span>
      </figcaption>
    </figure>
  );
}

/** Horizontal share-of-total rows. */
export function BreakdownBars({ rows }: { rows: { label: string; value: number }[] }) {
  const total = Math.max(1, rows.reduce((sum, row) => sum + row.value, 0));
  return (
    <ul className="grid gap-2.5">
      {rows.map((row) => (
        <li key={row.label} className="grid gap-1">
          <div className="flex items-baseline justify-between gap-3 text-sm">
            <span className="truncate">{row.label}</span>
            <span className="shrink-0 font-bold">
              {row.value}
              <span className="ml-1 text-xs font-normal text-ink-soft">
                {Math.round((row.value / total) * 100)}%
              </span>
            </span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-mist">
            <div className="h-full rounded-full bg-flame" style={{ width: `${(row.value / total) * 100}%` }} />
          </div>
        </li>
      ))}
    </ul>
  );
}
