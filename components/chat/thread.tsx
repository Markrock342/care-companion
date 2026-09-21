"use client";

import { useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { sendMessage } from "@/lib/actions/trips";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import type { Message } from "@/lib/types";
import { formatDateTime } from "@/lib/format";

export function ChatThread({
  tripId,
  userId,
  initial,
  locale,
}: {
  tripId: string;
  userId: string;
  initial: Message[];
  locale: string;
}) {
  const t = useTranslations("chat");
  const [messages, setMessages] = useState(initial);
  const [body, setBody] = useState("");
  const [sending, setSending] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMessages(initial);
  }, [initial]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length]);

  useEffect(() => {
    const supabase = createClient();
    const channel = supabase
      .channel(`trip-chat-${tripId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `trip_id=eq.${tripId}`,
        },
        (payload) => {
          const next = payload.new as Message;
          setMessages((current) =>
            current.some((item) => item.id === next.id) ? current : [...current, next],
          );
        },
      )
      .subscribe();
    return () => {
      void supabase.removeChannel(channel);
    };
  }, [tripId]);

  return (
    <div className="grid h-[min(70vh,640px)] grid-rows-[1fr_auto] overflow-hidden rounded-[28px] bg-paper shadow-[var(--shadow-raise)]">
      <div className="space-y-3 overflow-y-auto p-4">
        {messages.length === 0 ? (
          <p className="py-10 text-center text-ink-soft">{t("empty")}</p>
        ) : (
          messages.map((message) => {
            const mine = message.sender_id === userId;
            return (
              <div key={message.id} className={`flex ${mine ? "justify-end" : "justify-start"}`}>
                <div
                  className={`max-w-[80%] rounded-[22px] px-4 py-3 ${
                    mine ? "bg-flame text-paper" : "bg-mist text-ink"
                  }`}
                >
                  <p>{message.body}</p>
                  <p className={`mt-1 text-xs ${mine ? "text-paper/80" : "text-ink-soft"}`}>
                    {formatDateTime(message.created_at, locale)}
                  </p>
                </div>
              </div>
            );
          })
        )}
        <div ref={endRef} />
      </div>
      <form
        className="flex gap-2 border-t border-line/70 p-3"
        onSubmit={async (event) => {
          event.preventDefault();
          if (!body.trim()) return;
          setSending(true);
          await sendMessage(tripId, body);
          setBody("");
          setSending(false);
        }}
      >
        <input
          value={body}
          onChange={(e) => setBody(e.target.value)}
          placeholder={t("placeholder")}
          className="h-12 flex-1 rounded-full bg-mist px-4 outline-none"
        />
        <Button type="submit" loading={sending}>
          {t("send")}
        </Button>
      </form>
    </div>
  );
}
