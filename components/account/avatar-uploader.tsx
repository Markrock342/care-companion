"use client";

import { useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { createClient } from "@/lib/supabase/client";
import { updateAvatar } from "@/lib/actions/profile";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";

const MAX_BYTES = 2 * 1024 * 1024;
const TYPES = ["image/jpeg", "image/png", "image/webp"];

export function AvatarUploader({
  userId,
  name,
  avatarUrl,
}: {
  userId: string;
  name: string;
  avatarUrl: string | null;
}) {
  const t = useTranslations("account");
  const router = useRouter();
  const input = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState(avatarUrl);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function upload(file: File) {
    setError(null);
    if (!TYPES.includes(file.type)) return setError(t("badType"));
    if (file.size > MAX_BYTES) return setError(t("tooBig"));

    setUploading(true);
    const ext = file.type.split("/")[1].replace("jpeg", "jpg");
    // Storage policy only allows writes inside the user's own folder.
    const path = `${userId}/avatar-${Date.now()}.${ext}`;
    const supabase = createClient();
    const { error: uploadError } = await supabase.storage
      .from("avatars")
      .upload(path, file, { contentType: file.type, cacheControl: "3600" });

    if (uploadError) {
      setUploading(false);
      return setError(t("failed"));
    }

    const result = await updateAvatar(path);
    setUploading(false);
    if ("error" in result) return setError(t("failed"));
    setPreview(result.url);
    router.refresh();
  }

  return (
    <div className="flex flex-wrap items-center gap-5">
      <Avatar name={name} src={preview} className="size-24 text-3xl" />
      <div className="grid gap-2">
        <input
          ref={input}
          type="file"
          accept={TYPES.join(",")}
          className="sr-only"
          onChange={(event) => {
            const file = event.target.files?.[0];
            if (file) void upload(file);
            event.target.value = "";
          }}
        />
        <Button variant="secondary" size="sm" loading={uploading} onClick={() => input.current?.click()}>
          {uploading ? t("uploading") : t("change")}
        </Button>
        <p className="text-xs text-ink-soft">{t("hint")}</p>
        {error ? (
          <p role="alert" className="text-sm text-danger">
            {error}
          </p>
        ) : null}
      </div>
    </div>
  );
}
