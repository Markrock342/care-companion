import { Link } from "@/i18n/navigation";

export default function NotFound() {
  return (
    <main className="grid min-h-[70svh] place-items-center px-4 text-center">
      <div>
        <p className="font-display text-6xl text-flame">404</p>
        <p className="mt-3 text-ink-soft">ไม่พบหน้านี้ / Page not found</p>
        <Link href="/" className="mt-6 inline-block font-semibold underline">
          Home
        </Link>
      </div>
    </main>
  );
}
