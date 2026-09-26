"use client";

import { useState, useCallback } from "react";
import { Hand, Undo2, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { useTranslations } from "next-intl";

interface AiThreadBannerProps {
  conversationId: string;
  /** `conversations.ai_autoreply_disabled` — bot paused on this thread. */
  disabled: boolean;
  /** `conversations.ai_handoff_summary` — note the bot left on handoff. */
  handoffSummary?: string | null;
  /** The acting agent — enabling handoff assigns the thread to them. */
  currentUserId?: string | null;
  /** Apply the saved state returned by the API to the selected conversation. */
  onChange: (patch: {
    ai_autoreply_disabled: boolean;
    assigned_agent_id?: string | null;
  }) => void;
}

/**
 * Header control for the selected conversation's Human Handoff state.
 */
export function AiThreadBanner({
  conversationId,
  disabled,
  handoffSummary,
  currentUserId,
  onChange,
}: AiThreadBannerProps) {
  const t = useTranslations("Inbox.aiBanner");
  const [busy, setBusy] = useState(false);

  const toggle = useCallback(
    async () => {
      if (busy) return;
      const nextPaused = !disabled;
      setBusy(true);
      try {
        const res = await fetch(`/api/ai/autoreply/${conversationId}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ paused: nextPaused, assign_to_me: nextPaused }),
        });
        const data = await res.json().catch(() => null);
        if (!res.ok) {
          toast.error(data?.error ?? t("updateError"));
          return;
        }
        if (data?.success !== true || typeof data.paused !== "boolean") {
          toast.error(t("updateError"));
          return;
        }
        const savedPaused = data.paused as boolean;
        onChange({
          ai_autoreply_disabled: savedPaused,
          ...(savedPaused
            ? currentUserId
              ? { assigned_agent_id: currentUserId }
              : {}
            : { assigned_agent_id: null }),
        });
        toast.success(savedPaused ? t("handoffEnabled") : t("handoffDisabled"));
      } catch {
        toast.error(t("networkError"));
      } finally {
        setBusy(false);
      }
    },
    [busy, conversationId, currentUserId, disabled, onChange, t],
  );

  const label = t(disabled ? "handoffOn" : "handoffOff");
  return (
    <button
      type="button"
      onClick={toggle}
      disabled={busy}
      aria-label={label}
      aria-pressed={disabled}
      title={disabled && handoffSummary ? handoffSummary : undefined}
      className={cn(
        "inline-flex min-h-8 flex-shrink-0 items-center gap-1.5 rounded-md border px-2.5 text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-wait disabled:opacity-60",
        disabled
          ? "border-amber-500/40 bg-amber-500/10 text-amber-700 hover:bg-amber-500/15 dark:text-amber-300"
          : "border-primary/30 bg-primary/10 text-primary hover:bg-primary/15",
      )}
    >
      {busy ? (
        <Loader2 className="h-3.5 w-3.5 animate-spin" />
      ) : disabled ? (
        <Undo2 className="h-3.5 w-3.5" />
      ) : (
        <Hand className="h-3.5 w-3.5" />
      )}
      <span>{label}</span>
    </button>
  );
}
