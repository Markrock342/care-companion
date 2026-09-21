// Gives every demo account (see supabase/seed-demo.sql) a mockup portrait.
// Photos come from randomuser.me and are uploaded into our own Supabase Storage "avatars"
// bucket, signed in as each demo user so the per-user storage policy applies.
//
// Usage (from care-companion/): node --env-file=.env.local scripts/seed-demo-avatars.mjs

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const PASSWORD = "Demo1234!";

// [demo email, randomuser.me portrait path]
const PORTRAITS = [
  ["admin@demo.test", "men/32"],
  ["customer@demo.test", "women/44"],
  ["companion@demo.test", "men/75"],
  ["nok@demo.test", "women/68"],
  ["ton@demo.test", "men/22"],
  ["ploy@demo.test", "women/12"],
  ["bank@demo.test", "men/46"],
  ["fah@demo.test", "women/26"],
  ["arm@demo.test", "men/52"],
  ["mint@demo.test", "women/33"],
  ["pending1@demo.test", "men/61"],
  ["pending2@demo.test", "women/57"],
  ["rejected@demo.test", "men/15"],
  ["somsri@demo.test", "women/79"],
  ["prasert@demo.test", "men/85"],
  ["malee@demo.test", "women/49"],
  ["wichai@demo.test", "men/67"],
  ["jiraporn@demo.test", "women/90"],
  ["anan@demo.test", "men/91"],
  ["suspended@demo.test", "men/5"],
];

if (!url || !key) throw new Error("Missing Supabase env; run with --env-file=.env.local");

async function call(path, init, token) {
  const res = await fetch(`${url}${path}`, {
    ...init,
    headers: { apikey: key, Authorization: `Bearer ${token ?? key}`, ...init.headers },
  });
  if (!res.ok) throw new Error(`${init.method ?? "GET"} ${path} -> ${res.status} ${await res.text()}`);
  return res;
}

for (const [email, portrait] of PORTRAITS) {
  try {
    const session = await (
      await call("/auth/v1/token?grant_type=password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password: PASSWORD }),
      })
    ).json();
    const userId = session.user.id;
    const token = session.access_token;

    const photo = await fetch(`https://randomuser.me/api/portraits/${portrait}.jpg`);
    if (!photo.ok) throw new Error(`portrait ${portrait} -> ${photo.status}`);
    const bytes = Buffer.from(await photo.arrayBuffer());

    const objectPath = `${userId}/demo-portrait.jpg`;
    await call(`/storage/v1/object/avatars/${objectPath}`, {
      method: "POST",
      headers: { "Content-Type": "image/jpeg", "x-upsert": "true", "Cache-Control": "3600" },
      body: bytes,
    }, token);

    const publicUrl = `${url}/storage/v1/object/public/avatars/${objectPath}`;
    await call(`/rest/v1/profiles?id=eq.${userId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json", Prefer: "return=minimal" },
      body: JSON.stringify({ avatar_url: publicUrl }),
    }, token);

    console.log(`ok   ${email}`);
  } catch (error) {
    console.log(`fail ${email}: ${error.message}`);
  }
}
