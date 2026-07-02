"use client";

import { useMemo, useState } from "react";
import { Check, Copy, Eye, KeyRound, Share2, TriangleAlert } from "lucide-react";
import type { Tournament } from "@/lib/types";
import { storeKind } from "@/lib/store";
import { Modal } from "./Modal";

function LinkRow({
  icon: Icon,
  title,
  hint,
  url,
}: {
  icon: typeof Eye;
  title: string;
  hint: string;
  url: string;
}) {
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    } catch {
      /* clipboard unavailable */
    }
  };
  return (
    <div className="rounded-xl border border-ink-700/60 bg-ink-900/60 p-3">
      <div className="mb-1.5 flex items-center gap-2">
        <Icon className="h-4 w-4 text-gold-200" />
        <span className="text-sm font-bold text-cream">{title}</span>
      </div>
      <p className="mb-2 text-xs text-muted">{hint}</p>
      <div className="flex items-center gap-2">
        <code className="min-w-0 flex-1 truncate rounded-lg bg-ink-950/60 px-2.5 py-1.5 font-mono text-[11px] text-muted">
          {url}
        </code>
        <button onClick={copy} className="btn-subtle shrink-0 px-3 py-1.5 text-xs">
          {copied ? <Check className="h-3.5 w-3.5 text-win" /> : <Copy className="h-3.5 w-3.5" />}
          {copied ? "Copied" : "Copy"}
        </button>
      </div>
    </div>
  );
}

export function ShareModal({ tournament: t, onClose }: { tournament: Tournament; onClose: () => void }) {
  const [qrFailed, setQrFailed] = useState(false);

  const { viewUrl, orgUrl } = useMemo(() => {
    const base = `${window.location.origin}${window.location.pathname}?id=${t.id}`;
    return { viewUrl: base, orgUrl: `${base}&key=${t.adminCode}` };
  }, [t.id, t.adminCode]);

  const nativeShare = async () => {
    try {
      await navigator.share({ title: `${t.name} — Grandmaster`, url: viewUrl });
    } catch {
      /* dismissed or unsupported */
    }
  };

  return (
    <Modal title="Invite your club" onClose={onClose}>
      <div className="space-y-3">
        <LinkRow
          icon={Eye}
          title="Watch link"
          hint="Anyone with this link sees the live bracket, standings and games."
          url={viewUrl}
        />
        <LinkRow
          icon={KeyRound}
          title="Organizer link"
          hint="Unlocks result entry automatically — only send to co-organizers."
          url={orgUrl}
        />

        <div className="flex items-center justify-center gap-4 rounded-xl border border-ink-700/60 bg-ink-900/60 p-3">
          {!qrFailed && (
            <span className="rounded-lg bg-white p-1.5">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={`https://api.qrserver.com/v1/create-qr-code/?size=132x132&margin=6&data=${encodeURIComponent(viewUrl)}`}
                alt={`QR code linking to ${t.name}`}
                width={132}
                height={132}
                onError={() => setQrFailed(true)}
              />
            </span>
          )}
          <div className="min-w-0">
            <p className="text-sm font-bold text-cream">Playing in person?</p>
            <p className="mt-1 text-xs text-muted">
              {qrFailed
                ? "Copy the watch link above and drop it in the group chat."
                : "Point a phone camera at the code — everyone lands on the live bracket."}
            </p>
            {typeof navigator !== "undefined" && "share" in navigator && (
              <button onClick={nativeShare} className="btn-ghost mt-3 px-3 py-1.5 text-xs">
                <Share2 className="h-3.5 w-3.5" /> Share…
              </button>
            )}
          </div>
        </div>

        {storeKind() === "local" && (
          <p className="flex items-start gap-2 rounded-xl border border-gold-500/30 bg-gold-500/10 px-3 py-2.5 text-xs leading-relaxed text-gold-100/90">
            <TriangleAlert className="mt-0.5 h-3.5 w-3.5 shrink-0" />
            You&apos;re in Local mode — this tournament lives in your browser, so friends opening the
            link on their own devices won&apos;t see it yet. Connect Supabase (see the README) to sync
            everywhere.
          </p>
        )}
      </div>
    </Modal>
  );
}
