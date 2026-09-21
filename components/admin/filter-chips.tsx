import { Link } from "@/i18n/navigation";

/** One-tap filters that keep the other query params intact. */
export function FilterChips({
  basePath,
  param,
  current,
  options,
  params = {},
}: {
  basePath: string;
  param: string;
  current: string;
  options: { value: string; label: string; count?: number }[];
  params?: Record<string, string | undefined>;
}) {
  function hrefFor(value: string) {
    const query = new URLSearchParams();
    for (const [key, item] of Object.entries(params)) {
      if (item && key !== param) query.set(key, item);
    }
    if (value) query.set(param, value);
    const qs = query.toString();
    return `${basePath}${qs ? `?${qs}` : ""}`;
  }

  return (
    <div className="-mx-1 flex gap-2 overflow-x-auto px-1 py-1">
      {options.map((option) => {
        const active = option.value === current;
        return (
          <Link
            key={option.value || "all"}
            href={hrefFor(option.value)}
            aria-current={active ? "true" : undefined}
            className={`flex shrink-0 items-center gap-1.5 rounded-full px-3.5 py-2 text-sm font-semibold transition-colors ${
              active ? "bg-ink text-paper" : "bg-mist text-ink hover:text-flame"
            }`}
          >
            {option.label}
            {option.count !== undefined ? (
              <span className={`rounded-full px-1.5 text-xs ${active ? "bg-paper/20" : "bg-paper"}`}>{option.count}</span>
            ) : null}
          </Link>
        );
      })}
    </div>
  );
}
