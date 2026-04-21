"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { useSession } from "@/lib/auth-client";
import { placeholderCreators } from "@/data/placeholder-creators";
import { FanShell } from "@/components/fan/FanShell";

interface LibraryContent {
  id: string;
  title: string;
  category: string;
  priceTzs: number;
  creator: { id: string; handle: string; displayName: string | null; avatarUrl: string | null; };
  grantedAt: string;
}

export default function LibraryPage() {
  const router = useRouter();
  const { data: session, isPending } = useSession();
  const [content, setContent] = useState<LibraryContent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isPending && !session) { router.push("/login"); return; }
    if (session) fetchLibrary();
  }, [session, isPending, router]);

  const fetchLibrary = async () => {
    try {
      const response = await fetch("/api/library");
      if (response.ok) { const data = await response.json(); setContent(data.content || []); }
    } catch (error) { console.error("Failed to fetch library:", error); }
    finally { setLoading(false); }
  };

  const getCreatorImage = (creatorId: string) => {
    const index = parseInt(creatorId.slice(-1), 16) % placeholderCreators.length;
    return placeholderCreators[index]?.image || placeholderCreators[0].image;
  };

  if (isPending || loading) {
    return (
      <div className="min-h-screen bg-neutral-950 flex items-center justify-center">
        <div className="relative w-10 h-10">
          <div className="absolute inset-0 border border-amber-500/30 animate-spin" />
          <div className="absolute inset-1 border border-amber-500/20 animate-spin" style={{ animationDirection: "reverse", animationDuration: "1.5s" }} />
        </div>
      </div>
    );
  }

  return (
    <FanShell title="My Library" subtitle="Content you've purchased">
      {content.length === 0 ? (
        <div className="text-center py-16 border border-dashed border-white/10">
          <p className="text-[10px] font-mono text-white/20 uppercase tracking-widest mb-2">LIBRARY.EMPTY</p>
          <p className="font-mono text-sm text-white/40 mb-5">
            Start discovering and purchasing exclusive content from creators
          </p>
          <Link href="/feed"
            className="inline-flex h-9 items-center px-6 bg-amber-500 text-[10px] font-mono font-semibold text-black uppercase tracking-widest hover:bg-amber-400 transition-colors">
            Browse Content
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
          {content.map((item) => (
            <Link key={item.id} href={`/content/${item.id}`}
              className="group block border border-white/10 bg-neutral-950 hover:border-amber-500/30 transition-all amber-glow-hover overflow-hidden">
              <div className="relative aspect-video bg-neutral-900">
                <Image
                  src={item.creator.avatarUrl?.startsWith("http") ? item.creator.avatarUrl : getCreatorImage(item.creator.id)}
                  alt={item.title} fill className="object-cover group-hover:scale-105 transition-transform duration-300"
                  sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />

                {/* Owned badge */}
                <div className="absolute top-2 right-2">
                  <span className="px-2 py-0.5 bg-green-500/80 text-black text-[9px] font-mono font-semibold uppercase">✓ Owned</span>
                </div>

                {/* Play overlay */}
                <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                  <div className="w-12 h-12 bg-amber-500 flex items-center justify-center">
                    <span className="text-black font-mono font-black text-lg ml-0.5">▶</span>
                  </div>
                </div>

                {/* Creator info */}
                <div className="absolute bottom-2 left-2 right-2">
                  <div className="flex items-center gap-1.5">
                    <div className="w-6 h-6 border border-amber-500/40 bg-amber-500/10 flex items-center justify-center flex-shrink-0">
                      <span className="text-amber-400 text-[9px] font-bold font-mono">
                        {(item.creator.displayName || item.creator.handle).charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <span className="text-white text-[10px] font-mono font-medium truncate">
                      {item.creator.displayName || `@${item.creator.handle}`}
                    </span>
                  </div>
                </div>
              </div>

              <div className="p-3">
                <h3 className="font-mono font-medium text-xs text-white/70 line-clamp-2 group-hover:text-white transition-colors tracking-wide">
                  {item.title}
                </h3>
                <div className="flex items-center gap-2 mt-1.5 text-[9px] font-mono text-white/30 uppercase tracking-wider">
                  <span>{item.category}</span>
                  <span>·</span>
                  <span>Purchased {new Date(item.grantedAt).toLocaleDateString()}</span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </FanShell>
  );
}
