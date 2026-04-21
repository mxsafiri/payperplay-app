"use client";

import Link from "next/link";
import { ArrowLeft, Shield, AlertTriangle, Scale, FileCheck, Ban, Eye } from "lucide-react";

export default function ContentPolicyPage() {
  return (
    <div className="p-4 lg:p-8 pb-24 lg:pb-8 max-w-3xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <Link
          href="/creator/dashboard"
          className="inline-flex items-center gap-2 text-[11px] font-mono text-white/40 uppercase tracking-wider hover:text-white border border-white/10 hover:border-white/25 px-3 py-1.5 transition-all mb-6"
        >
          <ArrowLeft className="w-3 h-3" />
          Dashboard
        </Link>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 border border-amber-500/30 bg-amber-500/10 flex items-center justify-center flex-shrink-0">
            <Shield className="w-5 h-5 text-amber-400" />
          </div>
          <div>
            <div className="flex items-center gap-2 mb-0.5">
              <div className="h-px w-4 bg-amber-500/40" />
              <span className="text-[9px] font-mono text-amber-500/50 tracking-widest uppercase">Creator.Studio</span>
            </div>
            <h1 className="text-lg font-bold font-mono tracking-tight text-white">Content Policy</h1>
            <p className="text-[10px] font-mono text-white/30 uppercase tracking-widest mt-0.5">Last updated: March 2026</p>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        {/* Declaration of Ownership */}
        <section className="border border-white/10 bg-neutral-950 relative">
          <div className="absolute top-0 left-0 w-3 h-3 border-t border-l border-amber-500/20" />
          <div className="p-5">
            <div className="flex items-center gap-2 mb-4">
              <FileCheck className="w-4 h-4 text-green-400" />
              <div className="text-[9px] font-mono text-white/20 uppercase tracking-widest">DECLARATION.OF.OWNERSHIP</div>
            </div>
            <div className="space-y-2 text-[12px] font-mono text-white/40 leading-relaxed">
              <p>By uploading content to PayPerPlay, you confirm and declare that:</p>
              <ul className="space-y-2 mt-2">
                {[
                  ["You are the original creator", "of the content, or you have obtained all necessary rights, licenses, and permissions to distribute it."],
                  ["You hold full ownership or licensing rights", "to any music, visuals, graphics, audio, and all other elements contained in your content."],
                  ["Your content does not infringe", "on any third-party copyrights, trademarks, intellectual property rights, privacy rights, or any other rights."],
                  ["You grant PayPerPlay a non-exclusive license", "to host, display, stream, and distribute your content through our platform for the purpose of content delivery to your audience."],
                ].map(([bold, rest], i) => (
                  <li key={i} className="flex gap-2">
                    <span className="text-amber-500/40 flex-shrink-0">◈</span>
                    <span><span className="text-white/70">{bold}</span> {rest}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </section>

        {/* Prohibited Content */}
        <section className="border border-red-500/20 bg-red-500/[0.02] relative">
          <div className="absolute top-0 left-0 w-3 h-3 border-t border-l border-red-500/30" />
          <div className="p-5">
            <div className="flex items-center gap-2 mb-4">
              <Ban className="w-4 h-4 text-red-400" />
              <div className="text-[9px] font-mono text-red-400/50 uppercase tracking-widest">PROHIBITED.CONTENT</div>
            </div>
            <div className="space-y-2 text-[12px] font-mono text-white/40 leading-relaxed">
              <p>The following types of content are <span className="text-red-400">strictly prohibited</span> on PayPerPlay:</p>
              <ul className="space-y-2 mt-2">
                {[
                  ["Adult/sexually explicit content", "— nudity, pornography, or sexually suggestive material"],
                  ["Copyrighted material", "— content you do not own or have rights to"],
                  ["Hate speech or harassment", "— content promoting violence, discrimination, or harassment"],
                  ["Illegal activities", "— content depicting or promoting illegal acts under Tanzanian or international law"],
                  ["Misinformation", "— deliberately false or misleading content"],
                  ["Violence or graphic content", "— excessively violent, gory, or disturbing material"],
                  ["Content involving minors", "— any exploitative content involving children"],
                  ["Spam or misleading content", "— deceptive thumbnails, titles, or descriptions"],
                ].map(([bold, rest], i) => (
                  <li key={i} className="flex gap-2">
                    <span className="text-red-500/40 flex-shrink-0">✕</span>
                    <span><span className="text-white/70">{bold}</span> {rest}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </section>

        {/* Copyright & DMCA */}
        <section className="border border-white/10 bg-neutral-950 relative">
          <div className="absolute top-0 left-0 w-3 h-3 border-t border-l border-amber-500/20" />
          <div className="p-5">
            <div className="flex items-center gap-2 mb-4">
              <Scale className="w-4 h-4 text-blue-400" />
              <div className="text-[9px] font-mono text-white/20 uppercase tracking-widest">COPYRIGHT.TAKEDOWN.POLICY</div>
            </div>
            <div className="space-y-2 text-[12px] font-mono text-white/40 leading-relaxed">
              <p>PayPerPlay respects intellectual property rights and complies with applicable copyright laws.</p>
              <ul className="space-y-2 mt-2">
                {[
                  "If you believe your copyrighted work was uploaded without authorization, submit a takedown request to legal@payperplay.xyz.",
                  "Repeat copyright infringers will have their accounts permanently suspended.",
                  "Creators who receive three copyright strikes will be permanently banned from the platform.",
                  "False takedown requests may result in legal liability.",
                ].map((item, i) => (
                  <li key={i} className="flex gap-2">
                    <span className="text-amber-500/40 flex-shrink-0">◈</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </section>

        {/* Liability */}
        <section className="border border-amber-500/20 bg-amber-500/[0.02] relative">
          <div className="absolute top-0 left-0 w-3 h-3 border-t border-l border-amber-500/30" />
          <div className="p-5">
            <div className="flex items-center gap-2 mb-4">
              <AlertTriangle className="w-4 h-4 text-amber-400" />
              <div className="text-[9px] font-mono text-amber-500/50 uppercase tracking-widest">LIMITATION.OF.LIABILITY</div>
            </div>
            <div className="space-y-2 text-[12px] font-mono text-white/40 leading-relaxed">
              <p><span className="text-white/70">PayPerPlay is a platform provider, not a content publisher.</span></p>
              <ul className="space-y-2 mt-2">
                {[
                  "Creators are solely responsible for the content they upload, publish, and monetize on PayPerPlay.",
                  "PayPerPlay does not pre-screen or approve content before publication.",
                  "Any legal claims, copyright disputes, or violations arising from uploaded content are the full responsibility of the creator.",
                  "PayPerPlay reserves the right to remove any content that violates this policy, at any time, without prior notice.",
                  "Accounts found in violation may be suspended or terminated, and pending earnings may be withheld.",
                ].map((item, i) => (
                  <li key={i} className="flex gap-2">
                    <span className="text-amber-500/40 flex-shrink-0">◈</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </section>

        {/* Content Moderation */}
        <section className="border border-white/10 bg-neutral-950 relative">
          <div className="absolute top-0 left-0 w-3 h-3 border-t border-l border-amber-500/20" />
          <div className="p-5">
            <div className="flex items-center gap-2 mb-4">
              <Eye className="w-4 h-4 text-purple-400" />
              <div className="text-[9px] font-mono text-white/20 uppercase tracking-widest">CONTENT.MODERATION</div>
            </div>
            <div className="space-y-2 text-[12px] font-mono text-white/40 leading-relaxed">
              <p>PayPerPlay uses a combination of automated tools and community reporting to moderate content:</p>
              <ul className="space-y-2 mt-2">
                {[
                  "Users can report content that violates our policies.",
                  "Reported content is reviewed and may be removed within 24-48 hours.",
                  "Creators will be notified of any content removals and may appeal decisions.",
                  "Repeated violations result in escalating penalties: warning, temporary suspension, permanent ban.",
                ].map((item, i) => (
                  <li key={i} className="flex gap-2">
                    <span className="text-amber-500/40 flex-shrink-0">◈</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </section>

        {/* Agreement */}
        <div className="border border-amber-500/30 bg-amber-500/5 p-5 text-center relative">
          <div className="absolute top-0 left-0 w-3 h-3 border-t border-l border-amber-500/40" />
          <div className="absolute top-0 right-0 w-3 h-3 border-t border-r border-amber-500/40" />
          <div className="absolute bottom-0 left-0 w-3 h-3 border-b border-l border-amber-500/40" />
          <div className="absolute bottom-0 right-0 w-3 h-3 border-b border-r border-amber-500/40" />
          <p className="text-[11px] font-mono text-white/60 leading-relaxed">
            By uploading content to PayPerPlay, you acknowledge that you have read, understood, and agree to abide by this Content Policy & Creator Agreement.
          </p>
          <p className="text-[10px] font-mono text-white/30 mt-2 uppercase tracking-widest">
            Questions → support@payperplay.xyz
          </p>
        </div>
      </div>
    </div>
  );
}
