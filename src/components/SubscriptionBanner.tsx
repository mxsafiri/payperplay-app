"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Clock, AlertTriangle, Crown, X } from "lucide-react";
import { Button } from "@/components/ui/button";

export function SubscriptionBanner() {
  const router = useRouter();
  const [sub, setSub] = useState<any>(null);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    fetch("/api/subscription/status")
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (data) setSub(data);
      })
      .catch(() => {});
  }, []);

  if (!sub || dismissed || sub.isCreator) return null;

  // Active subscription with plenty of time — no banner needed
  if (sub.status === "active" && sub.daysRemaining > 3) return null;

  // Trial active (informational)
  if (sub.status === "trial" && sub.daysRemaining > 5) {
    return (
      <div className="bg-primary/5 border-b border-primary/20 px-4 py-2.5">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-sm">
            <Crown className="w-4 h-4 text-primary shrink-0" />
            <span>
              <strong>Free trial active</strong> — {sub.daysRemaining} day{sub.daysRemaining !== 1 ? "s" : ""} remaining.
            </span>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <Button size="sm" variant="outline" onClick={() => router.push("/subscribe")}>
              Manage
            </Button>
            <button onClick={() => setDismissed(true)} className="text-muted-foreground hover:text-foreground">
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Trial ending soon
  if (sub.status === "trial" && sub.daysRemaining <= 5) {
    return (
      <div className="bg-blue-500/10 border-b border-blue-500/20 px-4 py-2.5">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-sm">
            <Crown className="w-4 h-4 text-blue-500 shrink-0" />
            <span>
              Free trial ends in <strong>{sub.daysRemaining} day{sub.daysRemaining !== 1 ? "s" : ""}</strong>.
              Subscribe for just 500 TZS/week to keep watching.
            </span>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <Button size="sm" variant="outline" onClick={() => router.push("/subscribe")}>
              Subscribe
            </Button>
            <button onClick={() => setDismissed(true)} className="text-muted-foreground hover:text-foreground">
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Active subscription expiring soon
  if (sub.status === "active" && sub.daysRemaining <= 3) {
    return (
      <div className="bg-amber-500/10 border-b border-amber-500/20 px-4 py-2.5">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-sm">
            <Clock className="w-4 h-4 text-amber-500 shrink-0" />
            <span>
              Subscription expires in <strong>{sub.daysRemaining} day{sub.daysRemaining !== 1 ? "s" : ""}</strong>.
              Renew now to avoid interruption.
            </span>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <Button size="sm" onClick={() => router.push("/subscribe")}>
              Renew
            </Button>
            <button onClick={() => setDismissed(true)} className="text-muted-foreground hover:text-foreground">
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Grace period
  if (sub.status === "grace") {
    return (
      <div className="bg-yellow-500/10 border-b border-yellow-500/20 px-4 py-2.5">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-sm">
            <AlertTriangle className="w-4 h-4 text-yellow-500 shrink-0" />
            <span>
              <strong>Grace period:</strong> Your subscription expired. You have <strong>{sub.daysRemaining} day{sub.daysRemaining !== 1 ? "s" : ""}</strong> left to renew before losing access.
            </span>
          </div>
          <Button size="sm" className="shrink-0 bg-yellow-600 hover:bg-yellow-700" onClick={() => router.push("/subscribe")}>
            Renew Now
          </Button>
        </div>
      </div>
    );
  }

  // Expired
  if (sub.status === "expired") {
    return (
      <div className="bg-red-500/10 border-b border-red-500/20 px-4 py-2.5">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-sm">
            <AlertTriangle className="w-4 h-4 text-red-500 shrink-0" />
            <span>
              <strong>Access expired.</strong> Subscribe for 500 TZS/week to continue watching content.
            </span>
          </div>
          <Button size="sm" className="shrink-0" onClick={() => router.push("/subscribe")}>
            Subscribe
          </Button>
        </div>
      </div>
    );
  }

  // No subscription at all
  if (sub.status === "none") {
    return (
      <div className="bg-primary/5 border-b border-primary/20 px-4 py-2.5">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-sm">
            <Crown className="w-4 h-4 text-primary shrink-0" />
            <span>
              <strong>Start your 30-day free trial</strong> to watch content on PayPerPlay!
            </span>
          </div>
          <Button size="sm" className="shrink-0" onClick={() => router.push("/subscribe")}>
            Start Free Trial
          </Button>
        </div>
      </div>
    );
  }

  return null;
}
