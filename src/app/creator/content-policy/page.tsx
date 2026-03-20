"use client";

import Link from "next/link";
import { ArrowLeft, Shield, AlertTriangle, Scale, FileCheck, Ban, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function ContentPolicyPage() {
  return (
    <div className="p-4 lg:p-8 pb-24 lg:pb-8 max-w-3xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <Link href="/creator/dashboard" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-4">
          <ArrowLeft className="w-4 h-4" />
          Back to Dashboard
        </Link>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-500/15 flex items-center justify-center">
            <Shield className="w-5 h-5 text-amber-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">Content Policy & Creator Agreement</h1>
            <p className="text-sm text-muted-foreground">
              Last updated: March 2026
            </p>
          </div>
        </div>
      </div>

      <div className="space-y-8">
        {/* Declaration of Ownership */}
        <section className="border border-white/10 rounded-2xl bg-white/[0.02] p-6">
          <h2 className="text-lg font-semibold flex items-center gap-2 mb-4">
            <FileCheck className="w-5 h-5 text-emerald-400" />
            Declaration of Content Ownership
          </h2>
          <div className="space-y-3 text-sm text-muted-foreground leading-relaxed">
            <p>
              By uploading content to PayPerPlay, you confirm and declare that:
            </p>
            <ul className="list-disc list-inside space-y-2 ml-2">
              <li>
                <strong className="text-foreground">You are the original creator</strong> of the content, or you have obtained
                all necessary rights, licenses, and permissions to distribute it.
              </li>
              <li>
                <strong className="text-foreground">You hold full ownership or licensing rights</strong> to any music,
                visuals, graphics, audio, and all other elements contained in your content.
              </li>
              <li>
                <strong className="text-foreground">Your content does not infringe</strong> on any third-party copyrights,
                trademarks, intellectual property rights, privacy rights, or any other rights.
              </li>
              <li>
                <strong className="text-foreground">You grant PayPerPlay a non-exclusive license</strong> to host, display,
                stream, and distribute your content through our platform for the purpose of content delivery to your audience.
              </li>
            </ul>
          </div>
        </section>

        {/* Prohibited Content */}
        <section className="border border-red-500/20 rounded-2xl bg-red-500/[0.03] p-6">
          <h2 className="text-lg font-semibold flex items-center gap-2 mb-4">
            <Ban className="w-5 h-5 text-red-400" />
            Prohibited Content
          </h2>
          <div className="space-y-3 text-sm text-muted-foreground leading-relaxed">
            <p>
              The following types of content are <strong className="text-red-400">strictly prohibited</strong> on PayPerPlay:
            </p>
            <ul className="list-disc list-inside space-y-2 ml-2">
              <li><strong className="text-foreground">Adult/sexually explicit content</strong> — including nudity, pornography, or sexually suggestive material</li>
              <li><strong className="text-foreground">Copyrighted material</strong> — content you do not own or have rights to (movies, TV shows, music by other artists without license)</li>
              <li><strong className="text-foreground">Hate speech or harassment</strong> — content that promotes violence, discrimination, or harassment against any individual or group</li>
              <li><strong className="text-foreground">Illegal activities</strong> — content depicting or promoting illegal acts under Tanzanian law or international law</li>
              <li><strong className="text-foreground">Misinformation</strong> — deliberately false or misleading content designed to deceive or manipulate</li>
              <li><strong className="text-foreground">Violence or graphic content</strong> — excessively violent, gory, or disturbing material</li>
              <li><strong className="text-foreground">Content involving minors</strong> — any exploitative content involving children</li>
              <li><strong className="text-foreground">Spam or misleading content</strong> — deceptive thumbnails, titles, or descriptions designed to mislead viewers</li>
            </ul>
          </div>
        </section>

        {/* Copyright & DMCA */}
        <section className="border border-white/10 rounded-2xl bg-white/[0.02] p-6">
          <h2 className="text-lg font-semibold flex items-center gap-2 mb-4">
            <Scale className="w-5 h-5 text-blue-400" />
            Copyright & Takedown Policy
          </h2>
          <div className="space-y-3 text-sm text-muted-foreground leading-relaxed">
            <p>
              PayPerPlay respects intellectual property rights and complies with applicable copyright laws.
            </p>
            <ul className="list-disc list-inside space-y-2 ml-2">
              <li>If you believe your copyrighted work has been uploaded without authorization, you may submit a takedown request to <strong className="text-foreground">legal@payperplay.xyz</strong>.</li>
              <li>Repeat copyright infringers will have their accounts permanently suspended.</li>
              <li>Creators who receive three copyright strikes will be permanently banned from the platform.</li>
              <li>False takedown requests may result in legal liability.</li>
            </ul>
          </div>
        </section>

        {/* Liability */}
        <section className="border border-amber-500/20 rounded-2xl bg-amber-500/[0.03] p-6">
          <h2 className="text-lg font-semibold flex items-center gap-2 mb-4">
            <AlertTriangle className="w-5 h-5 text-amber-400" />
            Limitation of Liability
          </h2>
          <div className="space-y-3 text-sm text-muted-foreground leading-relaxed">
            <p>
              <strong className="text-foreground">PayPerPlay is a platform provider, not a content publisher.</strong>
            </p>
            <ul className="list-disc list-inside space-y-2 ml-2">
              <li>Creators are <strong className="text-foreground">solely responsible</strong> for the content they upload, publish, and monetize on PayPerPlay.</li>
              <li>PayPerPlay does not pre-screen or approve content before publication.</li>
              <li>Any legal claims, copyright disputes, or violations arising from uploaded content are the <strong className="text-foreground">full responsibility of the creator</strong>.</li>
              <li>PayPerPlay reserves the right to remove any content that violates this policy, at any time, without prior notice.</li>
              <li>Accounts found in violation may be suspended or terminated, and pending earnings may be withheld.</li>
            </ul>
          </div>
        </section>

        {/* Content Moderation */}
        <section className="border border-white/10 rounded-2xl bg-white/[0.02] p-6">
          <h2 className="text-lg font-semibold flex items-center gap-2 mb-4">
            <Eye className="w-5 h-5 text-purple-400" />
            Content Moderation
          </h2>
          <div className="space-y-3 text-sm text-muted-foreground leading-relaxed">
            <p>
              PayPerPlay uses a combination of automated tools and community reporting to moderate content:
            </p>
            <ul className="list-disc list-inside space-y-2 ml-2">
              <li>Users can report content that violates our policies.</li>
              <li>Reported content is reviewed and may be removed within 24-48 hours.</li>
              <li>Creators will be notified of any content removals and may appeal decisions.</li>
              <li>Repeated violations result in escalating penalties: warning, temporary suspension, permanent ban.</li>
            </ul>
          </div>
        </section>

        {/* Agreement */}
        <div className="border border-amber-500/30 rounded-2xl bg-gradient-to-r from-amber-500/10 to-orange-500/10 p-6 text-center">
          <p className="text-sm text-foreground">
            By uploading content to PayPerPlay, you acknowledge that you have read, understood,
            and agree to abide by this Content Policy & Creator Agreement.
          </p>
          <p className="text-xs text-muted-foreground mt-2">
            For questions, contact us at <strong>support@payperplay.xyz</strong>
          </p>
        </div>
      </div>
    </div>
  );
}
