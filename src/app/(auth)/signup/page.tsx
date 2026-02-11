"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { signUp } from "@/lib/auth-client";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Users, Palette } from "lucide-react";

type UserRole = "creator" | "fan";

export default function SignupPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [handle, setHandle] = useState("");
  const [role, setRole] = useState<UserRole>("fan");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState<"account" | "role" | "profile">("account");

  const handleAccountSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const result = await signUp.email({
        email,
        password,
        name,
      });

      if (result.error) {
        setError(result.error.message || result.error.code || "Signup failed");
        setLoading(false);
        return;
      }

      if (!result.data) {
        setError("Signup failed — please try again");
        setLoading(false);
        return;
      }

      // Move to role selection
      setStep("role");
      setLoading(false);
    } catch (err: any) {
      console.error("Signup error:", err);
      setError(err?.message || "An unexpected error occurred");
      setLoading(false);
    }
  };

  const handleRoleSubmit = () => {
    setStep("profile");
  };

  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      // Create profile via API
      const response = await fetch("/api/profile/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          handle,
          role,
          displayName: name,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        setError(data.error || "Failed to create profile");
        setLoading(false);
        return;
      }

      // Redirect based on role
      if (role === "creator") {
        router.push("/creator/dashboard");
      } else {
        router.push("/feed");
      }
      router.refresh();
    } catch (err) {
      setError("An unexpected error occurred");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen relative flex items-center justify-center px-4">
      {/* Background */}
      <div className="fixed inset-0 z-0">
        <Image src="/BG.jpg" alt="" fill className="object-cover" sizes="100vw" priority />
        <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
        <div className="absolute inset-0 bg-gradient-to-br from-amber-900/20 via-transparent to-purple-900/20" />
      </div>

      <div className="relative z-10 w-full max-w-md rounded-2xl border border-white/10 bg-card/80 backdrop-blur-xl shadow-2xl p-8">
        <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-white/5 via-transparent to-transparent pointer-events-none" />
        <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-white/20 to-transparent" />

        <div className="relative">
        <div className="text-center space-y-2 mb-6">
          <h1 className="text-3xl font-bold tracking-tight">
            {step === "account" && "Create Account"}
            {step === "role" && "Choose Your Role"}
            {step === "profile" && "Complete Your Profile"}
          </h1>
          <p className="text-muted-foreground">
            {step === "account" && "Join PayPerPlay today"}
            {step === "role" && "Are you a creator or a fan?"}
            {step === "profile" && "Set up your profile"}
          </p>
        </div>
          {error && (
            <div className="mb-4 p-3 rounded-md bg-red-500/10 border border-red-500/20 text-red-500 text-sm">
              {error}
            </div>
          )}

          {step === "account" && (
            <form onSubmit={handleAccountSubmit} className="space-y-4">
              <div className="space-y-2">
                <label htmlFor="name" className="text-sm font-medium">
                  Full Name
                </label>
                <Input
                  id="name"
                  type="text"
                  placeholder="John Doe"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  disabled={loading}
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="email" className="text-sm font-medium">
                  Email
                </label>
                <Input
                  id="email"
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  disabled={loading}
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="password" className="text-sm font-medium">
                  Password
                </label>
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  disabled={loading}
                  minLength={8}
                />
              </div>

              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? "Creating account..." : "Continue"}
              </Button>

              <div className="text-center text-sm text-muted-foreground">
                Already have an account?{" "}
                <Link href="/login" className="text-primary hover:underline">
                  Sign in
                </Link>
              </div>
            </form>
          )}

          {step === "role" && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <button
                  onClick={() => setRole("fan")}
                  className={`p-6 rounded-lg border-2 transition-all ${
                    role === "fan"
                      ? "border-primary bg-primary/10"
                      : "border-border hover:border-primary/50"
                  }`}
                >
                  <Users className="w-8 h-8 text-blue-400 mb-2" />
                  <div className="font-semibold">Fan</div>
                  <div className="text-xs text-muted-foreground mt-1">
                    Discover & support creators
                  </div>
                </button>

                <button
                  onClick={() => setRole("creator")}
                  className={`p-6 rounded-lg border-2 transition-all ${
                    role === "creator"
                      ? "border-primary bg-primary/10"
                      : "border-border hover:border-primary/50"
                  }`}
                >
                  <Palette className="w-8 h-8 text-amber-400 mb-2" />
                  <div className="font-semibold">Creator</div>
                  <div className="text-xs text-muted-foreground mt-1">
                    Share exclusive content
                  </div>
                </button>
              </div>

              <Button onClick={handleRoleSubmit} className="w-full">
                Continue as {role === "creator" ? "Creator" : "Fan"}
              </Button>
            </div>
          )}

          {step === "profile" && (
            <form onSubmit={handleProfileSubmit} className="space-y-4">
              <div className="space-y-2">
                <label htmlFor="handle" className="text-sm font-medium">
                  Username
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                    @
                  </span>
                  <Input
                    id="handle"
                    type="text"
                    placeholder="username"
                    value={handle}
                    onChange={(e) =>
                      setHandle(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ""))
                    }
                    required
                    disabled={loading}
                    className="pl-8"
                    minLength={3}
                    maxLength={20}
                  />
                </div>
                <p className="text-xs text-muted-foreground">
                  Your unique handle (letters, numbers, and underscores only)
                </p>
              </div>

              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? "Creating profile..." : "Complete Setup"}
              </Button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
