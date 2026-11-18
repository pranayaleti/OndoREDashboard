/**
 * "Refer a renter": the referral page for owners, managers and admins.
 * Tenants refer from Rewards instead (/tenant/rewards#refer), where a referral
 * earns points.
 *
 * Staff do not earn anything for referrals: Ondo rents out its own homes, and
 * paying people for real estate referrals needs a license. The link still
 * matters: a renter who signs a lease after using it gets a welcome bonus in
 * Ondo Rewards, and the page shows who opened, signed up and signed a lease.
 *
 * Strings: common namespace, "referral" section.
 */

import { useState, useEffect, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { Check, Copy, Mail, MessageSquare, Share2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { referralApi } from "@/lib/api/clients/referrals";
import type { ReferralStats, ReferralHistoryItem } from "@/lib/api/clients/referrals";
import { useAuth } from "@/lib/auth-context";
import { getDemoReferralLink } from "@/lib/seed-data";
import { OndoMural } from "@/components/art/ondo-mural";

const PAGE_SIZE = 10;

function maskEmail(email: string | null): string {
  if (!email) return "No email";
  const [local, domain] = email.split("@");
  if (!domain) return email;
  return `${local[0]}***@${domain}`;
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
}

export function ReferralProgram() {
  const { t } = useTranslation();
  const { toast } = useToast();
  const { user } = useAuth();

  const [stats, setStats] = useState<ReferralStats | null>(null);
  const [history, setHistory] = useState<ReferralHistoryItem[] | null>(null);
  const [page, setPage] = useState(1);
  const [copied, setCopied] = useState(false);

  const load = useCallback(async () => {
    const [s, h] = await Promise.allSettled([referralApi.getStats(), referralApi.getHistory(1, 100)]);
    if (s.status === "fulfilled") {
      setStats({ ...s.value, shareUrl: s.value.shareUrl || getDemoReferralLink(user?.id) });
    } else {
      setStats({
        code: "",
        shareUrl: getDemoReferralLink(user?.id),
        totalReferrals: 0,
        creditsEarned: 0,
        creditsAvailable: 0,
        maxCredits: 0,
        sweepstakesEntries: 0,
        leaderboardPosition: null,
      });
    }
    setHistory(h.status === "fulfilled" ? h.value.referrals ?? [] : []);
    if (s.status === "rejected" || h.status === "rejected") {
      toast({ title: t("referral.errorLoading"), variant: "destructive" });
    }
  }, [t, toast, user?.id]);

  useEffect(() => {
    void load();
  }, [load]);

  const url = stats?.shareUrl ?? "";
  const message = t("referral.shareMessage");
  const canShare = typeof navigator !== "undefined" && typeof navigator.share === "function";

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast({ title: t("referral.copyFailed") });
    }
  };

  const rows = history ?? [];
  const opened = rows.length;
  const signedUp = rows.filter((r) => r.status !== "clicked").length;
  const leased = rows.filter((r) => r.status === "converted").length;
  const totalPages = Math.max(1, Math.ceil(rows.length / PAGE_SIZE));
  const pageRows = rows.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  return (
    <div className="mx-auto max-w-5xl space-y-8 p-6">
      {/* Header: two homes joined by a string of lights */}
      <div className="overflow-hidden rounded-2xl border bg-card">
        <div className="aspect-[12/3.6]">
          <OndoMural scene="neighbors" />
        </div>
        <div className="p-6 sm:p-8">
          <h1 className="text-3xl font-bold tracking-tight">{t("referral.title")}</h1>
          <p className="mt-2 max-w-2xl text-muted-foreground">{t("referral.subtitle")}</p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-5">
        <Card className="lg:col-span-3">
          <CardHeader>
            <CardTitle className="text-xl">{t("referral.yourLink")}</CardTitle>
            <CardDescription>{t("referral.linkInstruction")}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {stats === null ? (
              <Skeleton className="h-10 w-full" />
            ) : (
              <>
                <div className="flex gap-2">
                  <Input
                    readOnly
                    value={url}
                    className="font-mono text-sm"
                    aria-label={t("referral.yourLink")}
                    onFocus={(e) => e.currentTarget.select()}
                  />
                  <Button onClick={() => void copy()} className="shrink-0">
                    {copied ? <Check className="mr-2 h-4 w-4" /> : <Copy className="mr-2 h-4 w-4" />}
                    {copied ? t("referral.copied") : t("referral.copyLink")}
                  </Button>
                </div>
                {stats.code && (
                  <p className="text-sm text-muted-foreground">
                    {t("referral.yourCode")}:{" "}
                    <span className="font-mono font-semibold text-foreground">{stats.code}</span>
                  </p>
                )}
                <div className="flex flex-wrap gap-2">
                  {canShare && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => void navigator.share({ title: "Ondo homes for rent", text: message, url }).catch(() => {})}
                    >
                      <Share2 className="mr-2 h-4 w-4" />
                      {t("referral.share")}
                    </Button>
                  )}
                  <Button variant="outline" size="sm" asChild>
                    <a href={`sms:?&body=${encodeURIComponent(`${message} ${url}`)}`}>
                      <MessageSquare className="mr-2 h-4 w-4" />
                      {t("referral.textIt")}
                    </a>
                  </Button>
                  <Button variant="outline" size="sm" asChild>
                    <a
                      href={`mailto:?subject=${encodeURIComponent(t("referral.emailSubject"))}&body=${encodeURIComponent(
                        `${message}\n\n${url}`,
                      )}`}
                    >
                      <Mail className="mr-2 h-4 w-4" />
                      {t("referral.emailIt")}
                    </a>
                  </Button>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        <Card className="self-start lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-xl">{t("referral.statsTitle")}</CardTitle>
          </CardHeader>
          <CardContent>
            {history === null ? (
              <Skeleton className="h-28 w-full" />
            ) : (
              <dl className="divide-y">
                {[
                  { label: t("referral.statOpened"), value: opened },
                  { label: t("referral.statSignedUp"), value: signedUp },
                  { label: t("referral.statLeased"), value: leased },
                ].map(({ label, value }) => (
                  <div key={label} className="flex items-center justify-between py-3">
                    <dt className="text-sm">{label}</dt>
                    <dd className="text-xl font-semibold tabular-nums">{value}</dd>
                  </div>
                ))}
              </dl>
            )}
            <p className="mt-3 text-sm text-muted-foreground">{t("referral.pointsNote")}</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-xl">{t("referral.history")}</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t("referral.date")}</TableHead>
                <TableHead>{t("referral.email")}</TableHead>
                <TableHead>{t("referral.status")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {history === null ? (
                Array.from({ length: 3 }).map((_, i) => (
                  <TableRow key={i}>
                    {[0, 1, 2].map((c) => (
                      <TableCell key={c}>
                        <Skeleton className="h-4 w-full" />
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              ) : pageRows.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={3} className="py-8 text-center text-muted-foreground">
                    {t("referral.noHistory")}
                  </TableCell>
                </TableRow>
              ) : (
                pageRows.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell className="text-sm">{formatDate(item.createdAt)}</TableCell>
                    <TableCell className={cn("text-sm", item.referredEmail && "font-mono")}>
                      {maskEmail(item.referredEmail)}
                    </TableCell>
                    <TableCell>
                      <StatusBadge status={item.status} />
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>

          {totalPages > 1 && (
            <div className="mt-4 flex items-center justify-between">
              <p className="text-sm text-muted-foreground">{t("referral.pageOf", { page, total: totalPages })}</p>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
                  {t("referral.previous")}
                </Button>
                <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)}>
                  {t("referral.next")}
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function StatusBadge({ status }: { status: ReferralHistoryItem["status"] }) {
  const { t } = useTranslation();
  const label =
    status === "converted"
      ? t("referral.statusConverted")
      : status === "signed_up"
        ? t("referral.statusSignedUp")
        : t("referral.statusClicked");
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium",
        status === "converted" && "border-primary/50 text-foreground",
        status !== "converted" && "text-muted-foreground",
      )}
    >
      {label}
    </span>
  );
}
