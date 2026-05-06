"use client";

interface ConversionBannerProps {
  creatorName: string;
}

export function ConversionBanner({ creatorName }: ConversionBannerProps) {
  return (
    <div className="bg-gradient-to-br from-amber-500/10 to-amber-600/5 border border-amber-500/20 rounded-2xl p-5">
      <h3 className="text-lg font-bold text-white mb-2">
        Want more from {creatorName}?
      </h3>
      <p className="text-sm text-zinc-400 mb-4 leading-relaxed">
        Join PayPerPlay to keep this video, discover more creators, and never miss
        exclusive drops. It takes 30 seconds.
      </p>

      <div className="space-y-2">
        <a
          href="/signup"
          className="block w-full bg-amber-500 hover:bg-amber-400 text-black font-bold py-3 rounded-xl text-center text-sm transition-colors"
        >
          Create Free Account
        </a>
        <a
          href="/dashboard"
          className="block w-full bg-zinc-800 hover:bg-zinc-700 text-white font-medium py-3 rounded-xl text-center text-sm transition-colors"
        >
          Explore PayPerPlay
        </a>
      </div>

      {/* Benefits */}
      <div className="mt-4 grid grid-cols-2 gap-2">
        {[
          { icon: "🎬", text: "Keep all purchases" },
          { icon: "🔔", text: "Get drop alerts" },
          { icon: "💰", text: "Tip your faves" },
          { icon: "🏆", text: "Earn rewards" },
        ].map((b) => (
          <div key={b.text} className="flex items-center gap-1.5 text-xs text-zinc-500">
            <span>{b.icon}</span>
            <span>{b.text}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
