/**
 * i18n keys used in this component (common namespace, "referral" section):
 *
 * referral.title
 * referral.subtitle
 * referral.totalReferrals
 * referral.creditsEarned
 * referral.creditsEarnedDetail   (interpolated: {{earned}} / {{max}})
 * referral.availableCredits
 * referral.redeemNow
 * referral.sweepstakesEntries
 * referral.prizeEntries
 * referral.capReachedBanner
 * referral.progressLabel         (interpolated: {{max}})
 * referral.yourLink
 * referral.copyLink
 * referral.copied
 * referral.yourCode
 * referral.linkInstruction
 * referral.howItWorks
 * referral.step1Title
 * referral.step1Desc
 * referral.step2Title
 * referral.step2Desc
 * referral.step3Title
 * referral.step3Desc
 * referral.redeemSection
 * referral.redeemDesc
 * referral.redeemButton
 * referral.redeemConfirmTitle
 * referral.redeemConfirmDesc
 * referral.leaderboard
 * referral.rank
 * referral.name
 * referral.referrals
 * referral.freeMonths
 * referral.you
 * referral.history
 * referral.date
 * referral.email
 * referral.status
 * referral.creditEarned
 * referral.statusClicked
 * referral.statusSignedUp
 * referral.statusConverted
 * referral.noHistory
 * referral.sweepstakesCta
 * referral.sweepstakesCtaDesc
 * referral.sweepstakesLinkBtn
 * referral.errorLoading
 * referral.previous
 * referral.next
 * referral.pageOf               (interpolated: {{page}} / {{total}})
 */

import { useState, useEffect, useCallback } from "react";
import { useTranslation } from "react-i18next";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import {
  Gift,
  Copy,
  Check,
  ExternalLink,
  Trophy,
  Share2,
  UserCheck,
  AlertTriangle,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { referralApi } from "@/lib/api/clients/referrals";
import type {
  ReferralStats,
  ReferralHistoryItem,
  LeaderboardEntry,
} from "@/lib/api/clients/referrals";
import { useAuth } from "@/lib/auth-context";
import { getDemoReferralLink } from "@/lib/seed-data";

const SWEEPSTAKES_URL =
  import.meta.env.VITE_UI_BASE_URL
    ? `${import.meta.env.VITE_UI_BASE_URL}/sweepstakes`
    : "https://ondorealestate.com/sweepstakes";

function maskEmail(email: string | null): string {
  if (!email) return "—";
  const [local, domain] = email.split("@");
  if (!domain) return email;
  return `${local[0]}***@${domain}`;
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function StatCardSkeleton() {
  return (
    <Card>
      <CardContent className="pt-6">
        <Skeleton className="h-4 w-24 mb-2" />
        <Skeleton className="h-8 w-16 mb-1" />
        <Skeleton className="h-3 w-20" />
      </CardContent>
    </Card>
  );
}

function TableRowSkeleton({ cols }: { cols: number }) {
  return (
    <TableRow>
      {Array.from({ length: cols }).map((_, i) => (
        <TableCell key={i}>
          <Skeleton className="h-4 w-full" />
        </TableCell>
      ))}
    </TableRow>
  );
}

export function ReferralProgram() {
  const { t } = useTranslation();
  const { toast } = useToast();
  const { user } = useAuth();

  const [stats, setStats] = useState<ReferralStats | null>(null);
  const [history, setHistory] = useState<ReferralHistoryItem[]>([]);
  const [historyTotal, setHistoryTotal] = useState(0);
  const [historyPage, setHistoryPage] = useState(1);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);

  const [loadingStats, setLoadingStats] = useState(true);
  const [loadingHistory, setLoadingHistory] = useState(true);
  const [loadingLeaderboard, setLoadingLeaderboard] = useState(true);
  const [redeeming, setRedeeming] = useState(false);
  const [copied, setCopied] = useState(false);

  const HISTORY_PAGE_SIZE = 10;
  const historyTotalPages = Math.max(
    1,
    Math.ceil(historyTotal / HISTORY_PAGE_SIZE)
  );

  const fetchStats = useCallback(async () => {
    setLoadingStats(true);
    try {
      const data = await referralApi.getStats();
      setStats({
        ...data,
        shareUrl: data.shareUrl || getDemoReferralLink(user?.id),
      });
    } catch {
      setStats((current) =>
        current ?? {
          code: user?.id ?? "demo-referral",
          shareUrl: getDemoReferralLink(user?.id),
          totalReferrals: 0,
          creditsEarned: 0,
          creditsAvailable: 0,
          maxCredits: 10,
          sweepstakesEntries: 0,
          leaderboardPosition: null,
        }
      );
      toast({
        title: t("referral.errorLoading"),
        variant: "destructive",
      });
    } finally {
      setLoadingStats(false);
    }
  }, [t, toast]);

  const fetchHistory = useCallback(
    async (page: number) => {
      setLoadingHistory(true);
      try {
        const data = await referralApi.getHistory(page, HISTORY_PAGE_SIZE);
        setHistory(data.referrals);
        setHistoryTotal(data.total);
      } catch {
        toast({
          title: t("referral.errorLoading"),
          variant: "destructive",
        });
      } finally {
        setLoadingHistory(false);
      }
    },
    [t, toast]
  );

  const fetchLeaderboard = useCallback(async () => {
    setLoadingLeaderboard(true);
    try {
      const data = await referralApi.getLeaderboard();
      setLeaderboard(data);
    } catch {
      // Non-critical — swallow silently
    } finally {
      setLoadingLeaderboard(false);
    }
  }, []);

  useEffect(() => {
    fetchStats();
    fetchLeaderboard();
  }, [fetchStats, fetchLeaderboard]);

  useEffect(() => {
    fetchHistory(historyPage);
  }, [fetchHistory, historyPage]);

  const handleCopy = async () => {
    const referralLink = stats?.shareUrl || getDemoReferralLink(user?.id);
    if (!referralLink) return;
    await navigator.clipboard.writeText(referralLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleRedeem = async () => {
    setRedeeming(true);
    try {
      await referralApi.redeemCredits(1);
      toast({ title: t("referral.redeemSuccess") });
      await fetchStats();
    } catch {
      toast({
        title: t("referral.errorLoading"),
        variant: "destructive",
      });
    } finally {
      setRedeeming(false);
    }
  };

  const atCap =
    stats !== null && stats.creditsEarned >= stats.maxCredits;
  const progressPct =
    stats !== null
      ? Math.min(100, (stats.creditsEarned / stats.maxCredits) * 100)
      : 0;

  return (
    <div className="p-6 space-y-8 max-w-5xl mx-auto">
      {/* Header */}
      <div className="rounded-2xl bg-gradient-to-r from-orange-500 to-red-800 p-8 text-white shadow-lg">
        <div className="flex items-center gap-3 mb-2">
          <Gift className="h-8 w-8" />
          <h1 className="text-3xl font-bold">{t("referral.title")}</h1>
        </div>
        <p className="text-orange-100 text-base max-w-xl">
          {t("referral.subtitle")}
        </p>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {loadingStats ? (
          <>
            <StatCardSkeleton />
            <StatCardSkeleton />
            <StatCardSkeleton />
            <StatCardSkeleton />
          </>
        ) : (
          <>
            <Card>
              <CardContent className="pt-6">
                <p className="text-sm text-muted-foreground mb-1">
                  {t("referral.totalReferrals")}
                </p>
                <p className="text-3xl font-bold text-foreground">
                  {stats?.totalReferrals ?? 0}
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <p className="text-sm text-muted-foreground mb-1">
                  {t("referral.creditsEarned")}
                </p>
                <p className="text-3xl font-bold text-foreground">
                  {stats?.creditsEarned ?? 0}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  {t("referral.creditsEarnedDetail", {
                    earned: stats?.creditsEarned ?? 0,
                    max: stats?.maxCredits ?? 24,
                  })}
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <p className="text-sm text-muted-foreground mb-1">
                  {t("referral.availableCredits")}
                </p>
                <p className="text-3xl font-bold text-foreground">
                  {stats?.creditsAvailable ?? 0}
                </p>
                <p className="text-xs text-orange-600 dark:text-orange-400 mt-1 font-medium">
                  {t("referral.redeemNow")}
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <p className="text-sm text-muted-foreground mb-1">
                  {t("referral.sweepstakesEntries")}
                </p>
                <p className="text-3xl font-bold text-foreground">
                  {stats?.sweepstakesEntries ?? 0}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  {t("referral.prizeEntries")}
                </p>
              </CardContent>
            </Card>
          </>
        )}
      </div>

      {/* Progress bar */}
      {!loadingStats && stats && (
        <Card>
          <CardContent className="pt-6 space-y-3">
            <div className="flex justify-between items-center">
              <p className="text-sm font-medium">
                {t("referral.progressLabel", { max: stats.maxCredits })}
              </p>
              <p className="text-sm text-muted-foreground">
                {stats.creditsEarned} / {stats.maxCredits}
              </p>
            </div>
            <div className="w-full bg-muted rounded-full h-3 overflow-hidden">
              <div
                className="h-3 rounded-full bg-gradient-to-r from-orange-500 to-red-700 transition-all duration-500"
                style={{ width: `${progressPct}%` }}
                role="progressbar"
                aria-valuenow={stats.creditsEarned}
                aria-valuemin={0}
                aria-valuemax={stats.maxCredits}
              />
            </div>
            {atCap && (
              <div className="flex items-center gap-2 rounded-lg bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700 p-3 text-amber-800 dark:text-amber-200">
                <AlertTriangle className="h-4 w-4 shrink-0" />
                <p className="text-sm">{t("referral.capReachedBanner")}</p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Your referral link */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Share2 className="h-5 w-5 text-orange-500" />
            {t("referral.yourLink")}
          </CardTitle>
          <CardDescription>{t("referral.linkInstruction")}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {loadingStats ? (
            <Skeleton className="h-10 w-full" />
          ) : (
            <>
              <div className="flex gap-2">
                <Input
                  readOnly
                  value={stats?.shareUrl ?? ""}
                  className="font-mono text-sm bg-muted"
                  aria-label={t("referral.yourLink")}
                />
                <Button
                  variant="outline"
                  size="icon"
                  onClick={handleCopy}
                  aria-label={t("referral.copyLink")}
                >
                  {copied ? (
                    <Check className="h-4 w-4 text-green-600" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                </Button>
              </div>
              {stats?.code && (
                <p className="text-sm text-muted-foreground">
                  {t("referral.yourCode")}:{" "}
                  <span className="font-mono font-semibold text-foreground">
                    {stats.code}
                  </span>
                </p>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* How it works */}
      <div>
        <h2 className="text-xl font-semibold mb-4">{t("referral.howItWorks")}</h2>
        <div className="grid md:grid-cols-3 gap-4">
          <Card className="relative overflow-hidden">
            <CardContent className="pt-6">
              <div className="flex items-center justify-center w-10 h-10 rounded-full bg-orange-100 dark:bg-orange-900/30 mb-4">
                <Share2 className="h-5 w-5 text-orange-600" />
              </div>
              <h3 className="font-semibold mb-1">{t("referral.step1Title")}</h3>
              <p className="text-sm text-muted-foreground">
                {t("referral.step1Desc")}
              </p>
              <span className="absolute top-4 right-4 text-4xl font-black text-orange-100 dark:text-orange-900/30 select-none">
                1
              </span>
            </CardContent>
          </Card>
          <Card className="relative overflow-hidden">
            <CardContent className="pt-6">
              <div className="flex items-center justify-center w-10 h-10 rounded-full bg-orange-100 dark:bg-orange-900/30 mb-4">
                <UserCheck className="h-5 w-5 text-orange-600" />
              </div>
              <h3 className="font-semibold mb-1">{t("referral.step2Title")}</h3>
              <p className="text-sm text-muted-foreground">
                {t("referral.step2Desc")}
              </p>
              <span className="absolute top-4 right-4 text-4xl font-black text-orange-100 dark:text-orange-900/30 select-none">
                2
              </span>
            </CardContent>
          </Card>
          <Card className="relative overflow-hidden">
            <CardContent className="pt-6">
              <div className="flex items-center justify-center w-10 h-10 rounded-full bg-orange-100 dark:bg-orange-900/30 mb-4">
                <Gift className="h-5 w-5 text-orange-600" />
              </div>
              <h3 className="font-semibold mb-1">{t("referral.step3Title")}</h3>
              <p className="text-sm text-muted-foreground">
                {t("referral.step3Desc")}
              </p>
              <span className="absolute top-4 right-4 text-4xl font-black text-orange-100 dark:text-orange-900/30 select-none">
                3
              </span>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Redeem credits */}
      {!loadingStats && stats && stats.creditsAvailable > 0 && (
        <Card className="border-orange-200 dark:border-orange-700">
          <CardHeader>
            <CardTitle>{t("referral.redeemSection")}</CardTitle>
            <CardDescription>{t("referral.redeemDesc")}</CardDescription>
          </CardHeader>
          <CardContent>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button
                  className="bg-gradient-to-r from-orange-500 to-red-700 text-white hover:from-orange-600 hover:to-red-800"
                  disabled={redeeming}
                >
                  <Gift className="h-4 w-4 mr-2" />
                  {t("referral.redeemButton")}
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>
                    {t("referral.redeemConfirmTitle")}
                  </AlertDialogTitle>
                  <AlertDialogDescription>
                    {t("referral.redeemConfirmDesc")}
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>{t("actions.cancel")}</AlertDialogCancel>
                  <AlertDialogAction onClick={handleRedeem}>
                    {t("actions.confirm")}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </CardContent>
        </Card>
      )}

      {/* Leaderboard */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Trophy className="h-5 w-5 text-orange-500" />
            {t("referral.leaderboard")}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-16">{t("referral.rank")}</TableHead>
                <TableHead>{t("referral.name")}</TableHead>
                <TableHead className="text-right">
                  {t("referral.referrals")}
                </TableHead>
                <TableHead className="text-right">
                  {t("referral.freeMonths")}
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loadingLeaderboard ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <TableRowSkeleton key={i} cols={4} />
                ))
              ) : leaderboard.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={4}
                    className="text-center text-muted-foreground py-8"
                  >
                    {t("referral.noHistory")}
                  </TableCell>
                </TableRow>
              ) : (
                leaderboard.map((entry) => (
                  <TableRow
                    key={entry.rank}
                    className={cn(
                      entry.isCurrentUser &&
                        "bg-orange-50 dark:bg-orange-900/10 font-semibold"
                    )}
                  >
                    <TableCell>
                      <span
                        className={cn(
                          "inline-flex items-center justify-center w-7 h-7 rounded-full text-sm font-bold",
                          entry.rank === 1
                            ? "bg-yellow-400 text-yellow-900"
                            : entry.rank === 2
                            ? "bg-muted text-slate-800"
                            : entry.rank === 3
                            ? "bg-amber-600 text-amber-50"
                            : "bg-muted text-muted-foreground"
                        )}
                      >
                        {entry.rank}
                      </span>
                    </TableCell>
                    <TableCell>
                      {entry.displayName}
                      {entry.isCurrentUser && (
                        <Badge
                          variant="outline"
                          className="ml-2 text-xs border-orange-400 text-orange-600"
                        >
                          {t("referral.you")}
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      {entry.totalReferrals}
                    </TableCell>
                    <TableCell className="text-right">
                      {entry.creditsEarned}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* History */}
      <Card>
        <CardHeader>
          <CardTitle>{t("referral.history")}</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t("referral.date")}</TableHead>
                <TableHead>{t("referral.email")}</TableHead>
                <TableHead>{t("referral.status")}</TableHead>
                <TableHead className="text-center">
                  {t("referral.creditEarned")}
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loadingHistory ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <TableRowSkeleton key={i} cols={4} />
                ))
              ) : history.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={4}
                    className="text-center text-muted-foreground py-8"
                  >
                    {t("referral.noHistory")}
                  </TableCell>
                </TableRow>
              ) : (
                history.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell className="text-sm">
                      {formatDate(item.createdAt)}
                    </TableCell>
                    <TableCell className="font-mono text-sm">
                      {maskEmail(item.referredEmail)}
                    </TableCell>
                    <TableCell>
                      <StatusBadge status={item.status} />
                    </TableCell>
                    <TableCell className="text-center">
                      {item.creditEarned ? (
                        <Check className="h-4 w-4 text-green-600 mx-auto" />
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>

          {/* Pagination */}
          {historyTotalPages > 1 && (
            <div className="flex items-center justify-between mt-4">
              <p className="text-sm text-muted-foreground">
                {t("referral.pageOf", {
                  page: historyPage,
                  total: historyTotalPages,
                })}
              </p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={historyPage <= 1 || loadingHistory}
                  onClick={() => setHistoryPage((p) => p - 1)}
                >
                  {t("referral.previous")}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={
                    historyPage >= historyTotalPages || loadingHistory
                  }
                  onClick={() => setHistoryPage((p) => p + 1)}
                >
                  {t("referral.next")}
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Sweepstakes CTA */}
      <Card className="bg-gradient-to-br from-orange-50 to-red-50 dark:from-orange-900/10 dark:to-red-900/10 border-orange-200 dark:border-orange-800">
        <CardContent className="pt-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <Trophy className="h-8 w-8 text-orange-500 shrink-0 mt-0.5" />
            <div>
              <h3 className="font-semibold text-foreground">
                {t("referral.sweepstakesCta")}
              </h3>
              <p className="text-sm text-muted-foreground mt-0.5">
                {t("referral.sweepstakesCtaDesc")}
              </p>
            </div>
          </div>
          <Button
            asChild
            variant="outline"
            className="border-orange-500 text-orange-600 hover:bg-orange-50 dark:hover:bg-orange-900/20 shrink-0"
          >
            <a href={SWEEPSTAKES_URL} target="_blank" rel="noopener noreferrer">
              {t("referral.sweepstakesLinkBtn")}
              <ExternalLink className="h-4 w-4 ml-2" />
            </a>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

function StatusBadge({ status }: { status: ReferralHistoryItem["status"] }) {
  const { t } = useTranslation();

  const config: Record<
    ReferralHistoryItem["status"],
    { label: string; className: string }
  > = {
    clicked: {
      label: t("referral.statusClicked"),
      className:
        "bg-muted text-slate-700 dark:bg-card dark:text-slate-300",
    },
    signed_up: {
      label: t("referral.statusSignedUp"),
      className:
        "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300",
    },
    converted: {
      label: t("referral.statusConverted"),
      className:
        "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300",
    },
  };

  const { label, className } = config[status];

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
        className
      )}
    >
      {label}
    </span>
  );
}
