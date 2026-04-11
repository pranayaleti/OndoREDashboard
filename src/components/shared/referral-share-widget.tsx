/**
 * i18n keys used in this component (common namespace, "referral" section):
 *
 * referral.shareTitle
 * referral.shareDesc
 * referral.copyLink
 * referral.copied
 * referral.viewProgram
 * referral.errorLoading
 */

import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Gift, Copy, Check, ArrowRight } from "lucide-react";
import { referralApi } from "@/lib/api/clients/referrals";
import type { ReferralStats } from "@/lib/api/clients/referrals";
import { useAuth } from "@/lib/auth-context";
import { getDashboardPath } from "@/lib/auth-utils";
import { getDemoReferralLink } from "@/lib/seed-data";

export function ReferralShareWidget() {
  const { t } = useTranslation();
  const { user } = useAuth();

  const [stats, setStats] = useState<ReferralStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  const referralPath = user
    ? `${getDashboardPath(user.role)}/referrals`
    : "/referrals";

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    referralApi
      .getStats()
      .then((data) => {
        if (!cancelled) {
          setStats({
            ...data,
            shareUrl: data.shareUrl || getDemoReferralLink(user?.id),
          });
        }
      })
      .catch(() => {
        if (!cancelled) {
          setStats({
            code: user?.id ?? "demo-referral",
            shareUrl: getDemoReferralLink(user?.id),
            totalReferrals: 0,
            creditsEarned: 0,
            creditsAvailable: 0,
            maxCredits: 10,
            sweepstakesEntries: 0,
            leaderboardPosition: null,
          });
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const handleCopy = async () => {
    const referralLink = stats?.shareUrl || getDemoReferralLink(user?.id);
    if (!referralLink) return;
    await navigator.clipboard.writeText(referralLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Card className="border-orange-200 dark:border-orange-800">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <Gift className="h-4 w-4 text-orange-500" />
          {t("referral.shareTitle")}
        </CardTitle>
        <CardDescription className="text-xs">
          {t("referral.shareDesc")}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {loading ? (
          <>
            <Skeleton className="h-9 w-full" />
            <Skeleton className="h-8 w-32" />
          </>
        ) : (
          <>
            <div className="flex gap-1.5">
              <Input
                readOnly
                value={stats?.shareUrl || getDemoReferralLink(user?.id)}
                className="text-xs font-mono h-9 bg-muted"
                aria-label={t("referral.shareTitle")}
              />
              <Button
                variant="outline"
                size="icon"
                className="h-9 w-9 shrink-0"
                onClick={handleCopy}
                aria-label={t("referral.copyLink")}
              >
                {copied ? (
                  <Check className="h-3.5 w-3.5 text-green-600" />
                ) : (
                  <Copy className="h-3.5 w-3.5" />
                )}
              </Button>
            </div>
            <Button
              asChild
              variant="link"
              className="p-0 h-auto text-xs text-orange-600 dark:text-orange-400"
            >
              <Link to={referralPath}>
                {t("referral.viewProgram")}
                <ArrowRight className="h-3 w-3 ml-1" />
              </Link>
            </Button>
          </>
        )}
      </CardContent>
    </Card>
  );
}
