"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Sparkles, Shield, Clock, CreditCard, Phone, CheckCircle, Loader2, AlertTriangle, Crown } from "lucide-react";

export default function SubscribePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [subStatus, setSubStatus] = useState<any>(null);
  const [phoneNumber, setPhoneNumber] = useState("");
  const [paying, setPaying] = useState(false);
  const [activatingTrial, setActivatingTrial] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    fetchStatus();
  }, []);

  const fetchStatus = async () => {
    try {
      const res = await fetch("/api/subscription/status");
      if (res.ok) {
        const data = await res.json();
        setSubStatus(data);
      }
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  const handleStartTrial = async () => {
    setActivatingTrial(true);
    setError("");
    setMessage("");
    try {
      const res = await fetch("/api/subscription/trial", { method: "POST" });
      const data = await res.json();
      if (res.ok) {
        setMessage(data.message || "Trial activated!");
        setTimeout(() => router.push("/"), 2000);
      } else {
        setError(data.error || "Failed to activate trial");
      }
    } catch {
      setError("Something went wrong");
    } finally {
      setActivatingTrial(false);
    }
  };

  const handleSubscribe = async () => {
    if (!phoneNumber.trim()) {
      setError("Please enter your M-Pesa phone number");
      return;
    }
    setPaying(true);
    setError("");
    setMessage("");
    try {
      const res = await fetch("/api/subscription/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phoneNumber }),
      });
      const data = await res.json();
      if (res.ok) {
        setMessage(data.instructions || "Payment request sent! Check your phone to confirm.");
        // Poll for status
        const pollInterval = setInterval(async () => {
          const statusRes = await fetch("/api/subscription/status");
          if (statusRes.ok) {
            const statusData = await statusRes.json();
            if (statusData.hasAccess) {
              clearInterval(pollInterval);
              setMessage("Subscription activated! Redirecting...");
              setTimeout(() => router.push("/"), 2000);
            }
          }
        }, 3000);
        // Stop polling after 2 minutes
        setTimeout(() => clearInterval(pollInterval), 120000);
      } else {
        setError(data.error || "Payment failed");
      }
    } catch {
      setError("Something went wrong");
    } finally {
      setPaying(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  // Already has access — redirect
  if (subStatus?.hasAccess && subStatus?.status !== "grace") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center space-y-4">
          <CheckCircle className="w-16 h-16 text-green-500 mx-auto" />
          <h1 className="text-2xl font-bold">You have an active subscription!</h1>
          <p className="text-muted-foreground">
            {subStatus.status === "trial"
              ? `Free trial — ${subStatus.daysRemaining} days remaining`
              : `Active — ${subStatus.daysRemaining} days remaining`}
          </p>
          <Button onClick={() => router.push("/")}>Browse Content</Button>
        </div>
      </div>
    );
  }

  const showTrialOption = !subStatus?.trialUsed && subStatus?.status !== "grace";
  const isGrace = subStatus?.status === "grace";
  const isExpired = subStatus?.status === "expired";

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-2xl mx-auto px-4 py-12">
        {/* Header */}
        <div className="text-center mb-10">
          <Crown className="w-16 h-16 text-yellow-500 mx-auto mb-4" />
          <h1 className="text-3xl font-bold mb-2">
            {isGrace
              ? "Your subscription has expired"
              : isExpired
              ? "Renew your subscription"
              : "Unlock PayPerPlay"}
          </h1>
          <p className="text-muted-foreground text-lg">
            {isGrace
              ? `You're in a grace period — ${subStatus.daysRemaining} day(s) left. Renew now to keep watching!`
              : isExpired
              ? "Your access has expired. Subscribe to continue watching."
              : "Get unlimited access to all free content on the platform"}
          </p>
        </div>

        {/* Grace period warning */}
        {isGrace && (
          <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-xl p-4 mb-8 flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-yellow-500 mt-0.5 shrink-0" />
            <div>
              <p className="font-semibold text-yellow-600 dark:text-yellow-400">Grace Period Active</p>
              <p className="text-sm text-muted-foreground">
                You still have access for {subStatus.daysRemaining} more day(s). Renew now to avoid losing access.
              </p>
            </div>
          </div>
        )}

        {/* What you get */}
        <div className="bg-card border rounded-xl p-6 mb-8">
          <h2 className="text-lg font-semibold mb-4">What you get</h2>
          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <Sparkles className="w-5 h-5 text-primary mt-0.5 shrink-0" />
              <div>
                <p className="font-medium">Unlimited free content</p>
                <p className="text-sm text-muted-foreground">Watch all free content from every creator on the platform</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Shield className="w-5 h-5 text-primary mt-0.5 shrink-0" />
              <div>
                <p className="font-medium">Premium content access</p>
                <p className="text-sm text-muted-foreground">Pay per view for premium creator content at their set prices</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Clock className="w-5 h-5 text-primary mt-0.5 shrink-0" />
              <div>
                <p className="font-medium">7-day access + 2-day grace</p>
                <p className="text-sm text-muted-foreground">Each subscription gives you 7 days of access, plus a 2-day grace period to renew</p>
              </div>
            </div>
          </div>
        </div>

        {/* Pricing */}
        <div className="bg-card border rounded-xl p-6 mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">Weekly Access Pass</h2>
            <div className="text-right">
              <p className="text-2xl font-bold text-primary">500 TZS</p>
              <p className="text-xs text-muted-foreground">per week</p>
            </div>
          </div>

          {/* Free trial option */}
          {showTrialOption && (
            <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-4 mb-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-semibold text-green-600 dark:text-green-400">🎉 30 Days Free!</p>
                  <p className="text-sm text-muted-foreground">Start with a free month — no payment required</p>
                </div>
                <Button
                  onClick={handleStartTrial}
                  disabled={activatingTrial}
                  className="bg-green-600 hover:bg-green-700"
                >
                  {activatingTrial ? <Loader2 className="w-4 h-4 animate-spin" /> : "Start Free Trial"}
                </Button>
              </div>
            </div>
          )}

          {/* Pay with M-Pesa */}
          <div className="space-y-3">
            <p className="text-sm font-medium text-muted-foreground">
              {showTrialOption ? "Or pay now:" : "Pay with M-Pesa:"}
            </p>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  type="tel"
                  placeholder="0712 345 678"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Button onClick={handleSubscribe} disabled={paying}>
                {paying ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    <CreditCard className="w-4 h-4 mr-2" />
                    Pay 500 TZS
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>

        {/* Messages */}
        {message && (
          <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-4 mb-4 text-center">
            <CheckCircle className="w-5 h-5 text-green-500 inline mr-2" />
            <span className="text-green-600 dark:text-green-400">{message}</span>
          </div>
        )}
        {error && (
          <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4 mb-4 text-center">
            <AlertTriangle className="w-5 h-5 text-red-500 inline mr-2" />
            <span className="text-red-600 dark:text-red-400">{error}</span>
          </div>
        )}

        {/* Back to browse */}
        <div className="text-center">
          <button
            onClick={() => router.push("/")}
            className="text-sm text-muted-foreground hover:text-foreground underline"
          >
            Browse content without subscribing
          </button>
        </div>
      </div>
    </div>
  );
}
