import { getTranslations, setRequestLocale } from "next-intl/server";
import { SiteFooter, SiteHeader } from "@/components/layout/site-header";
import { AvatarUploader } from "@/components/account/avatar-uploader";
import { ButtonLink } from "@/components/ui/button";
import { SignOutButton } from "@/components/layout/sign-out-button";
import { requireProfile } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { EmergencyContactForm } from "@/components/account/emergency-contact-form";
import type { EmergencyContact } from "@/lib/types";

export default async function AccountPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("account");
  const tr = await getTranslations("role");
  const { user, profile } = await requireProfile();
  const ts = await getTranslations("safety");
  const supabase = await createClient();
  const { data: contact } = await supabase
    .from("emergency_contacts")
    .select("name, relation, phone")
    .eq("user_id", user.id)
    .maybeSingle();

  return (
    <>
      <SiteHeader variant="app" />
      <main id="main" className="mx-auto w-full max-w-2xl flex-1 px-4 py-10">
        <h1 className="font-display text-4xl">{t("title")}</h1>
        <section className="mt-8 rounded-[28px] bg-mist p-6">
          <AvatarUploader userId={user.id} name={profile.full_name} avatarUrl={profile.avatar_url} />
          <dl className="mt-6 grid gap-3 text-sm sm:grid-cols-2">
            <div>
              <dt className="text-ink-soft">{t("name")}</dt>
              <dd className="font-semibold">{profile.full_name}</dd>
            </div>
            <div>
              <dt className="text-ink-soft">{t("email")}</dt>
              <dd className="font-semibold break-all">{user.email}</dd>
            </div>
            <div>
              <dt className="text-ink-soft">{t("role")}</dt>
              <dd className="font-semibold">{tr(profile.role)}</dd>
            </div>
          </dl>
          <div className="mt-6 flex flex-wrap items-center gap-3">
            {profile.role === "companion" ? (
              <ButtonLink href="/companion/profile" variant="ghost" size="sm">
                {t("editCompanion")}
              </ButtonLink>
            ) : null}
            <SignOutButton variant="secondary" />
          </div>
        </section>

        <section id="emergency" className="mt-6 rounded-[28px] bg-mist p-6">
          <h2 className="font-display text-2xl">{ts("contactTitle")}</h2>
          <p className="mt-1 mb-5 text-sm text-ink-soft">{ts("contactIntro")}</p>
          <EmergencyContactForm initial={(contact as EmergencyContact | null) ?? null} />
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
