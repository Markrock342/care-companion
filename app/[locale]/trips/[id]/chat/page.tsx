import { getTranslations, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import { redirect } from "@/i18n/navigation";
import { SiteFooter, SiteHeader } from "@/components/layout/site-header";
import { ChatThread } from "@/components/chat/thread";
import { requireProfile } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { canChat } from "@/lib/format";
import type { Message, Trip } from "@/lib/types";

export default async function ChatPage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { locale, id } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("chat");
  const { user, profile } = await requireProfile();

  const supabase = await createClient();
  const { data } = await supabase.from("trips").select("*").eq("id", id).maybeSingle();
  if (!data) notFound();
  const trip = data as Trip;
  const allowed =
    user.id === trip.customer_id ||
    user.id === trip.companion_id ||
    profile.role === "admin";
  if (!allowed) redirect({ href: `/trips/${id}`, locale });

  if (!canChat(trip.status)) {
    return (
      <>
        <SiteHeader variant="app" />
        <main id="main" className="mx-auto max-w-xl flex-1 px-4 py-16">
          <h1 className="font-display text-3xl">{t("title")}</h1>
          <p className="mt-4 text-ink-soft">{t("locked")}</p>
        </main>
        <SiteFooter />
      </>
    );
  }

  const { data: rows } = await supabase
    .from("messages")
    .select("*")
    .eq("trip_id", id)
    .order("created_at", { ascending: true });

  return (
    <>
      <SiteHeader variant="app" />
      <main id="main" className="mx-auto w-full max-w-3xl flex-1 px-4 py-10">
        <h1 className="mb-4 font-display text-3xl">{t("title")}</h1>
        <ChatThread
          tripId={id}
          userId={user.id}
          initial={(rows ?? []) as Message[]}
          locale={locale}
        />
      </main>
      <SiteFooter />
    </>
  );
}
