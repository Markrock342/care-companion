export function getSupabaseEnv() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
  // Supabase's newer publishable key (sb_publishable_…) works wherever the anon key does.
  const anonKey =
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";
  return { url, anonKey, configured: Boolean(url && anonKey) };
}

export function getAdminEmails() {
  return (process.env.ADMIN_EMAILS ?? "")
    .split(",")
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean);
}
