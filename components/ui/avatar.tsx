import { initials } from "@/lib/format";

export function Avatar({
  name,
  src,
  className = "size-10 text-sm",
}: {
  name: string;
  src: string | null | undefined;
  className?: string;
}) {
  return (
    <span
      className={`grid shrink-0 place-items-center overflow-hidden rounded-full bg-gold font-display text-ink ${className}`}
    >
      {src ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={src} alt="" className="size-full object-cover" referrerPolicy="no-referrer" />
      ) : (
        initials(name)
      )}
    </span>
  );
}
