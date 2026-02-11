"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { useSession } from "@/lib/auth-client";
import { placeholderCreators } from "@/data/placeholder-creators";

interface LibraryContent {
  id: string;
  title: string;
  category: string;
  priceTzs: number;
  creator: {
    id: string;
    handle: string;
    displayName: string | null;
    avatarUrl: string | null;
  };
  grantedAt: string;
}

export default function LibraryPage() {
  const router = useRouter();
  const { data: session, isPending } = useSession();
  const [content, setContent] = useState<LibraryContent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isPending && !session) {
      router.push("/login");
      return;
    }

    if (session) {
      fetchLibrary();
    }
  }, [session, isPending, router]);

  const fetchLibrary = async () => {
    try {
      const response = await fetch("/api/library");
      if (response.ok) {
        const data = await response.json();
        setContent(data.content || []);
      }
    } catch (error) {
      console.error("Failed to fetch library:", error);
    } finally {
      setLoading(false);
    }
  };

  const getCreatorImage = (creatorId: string) => {
    const index = parseInt(creatorId.slice(-1), 16) % placeholderCreators.length;
    return placeholderCreators[index]?.image || placeholderCreators[0].image;
  };

  if (isPending || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading library...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold">My Library</h1>
              <p className="text-sm text-muted-foreground">
                Content you've purchased
              </p>
            </div>
            <Link href="/feed">
              <button className="px-4 py-2 rounded-full bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90">
                Discover More
              </button>
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {content.length === 0 ? (
          <div className="text-center py-16">
            <div className="text-6xl mb-4">📚</div>
            <h3 className="text-xl font-semibold mb-2">Your library is empty</h3>
            <p className="text-muted-foreground mb-6">
              Start discovering and purchasing exclusive content from creators
            </p>
            <Link href="/feed">
              <button className="px-6 py-3 rounded-full bg-primary text-primary-foreground font-medium hover:bg-primary/90">
                Browse Content
              </button>
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {content.map((item) => (
              <Link key={item.id} href={`/content/${item.id}`}>
                <div className="group cursor-pointer">
                  {/* Thumbnail */}
                  <div className="relative aspect-portrait overflow-hidden rounded-lg bg-muted mb-3">
                    <Image
                      src={getCreatorImage(item.creator.id)}
                      alt={item.title}
                      fill
                      className="object-cover group-hover:scale-105 transition-transform duration-300"
                      sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                    
                    {/* Owned Badge */}
                    <div className="absolute top-3 right-3 px-3 py-1 rounded-full bg-green-500/90 backdrop-blur text-white text-xs font-semibold">
                      ✓ Owned
                    </div>

                    {/* Play Button Overlay */}
                    <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                      <div className="w-16 h-16 rounded-full bg-white/90 flex items-center justify-center">
                        <svg className="w-8 h-8 text-black ml-1" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M8 5v14l11-7z" />
                        </svg>
                      </div>
                    </div>

                    {/* Creator Info */}
                    <div className="absolute bottom-3 left-3 right-3">
                      <div className="flex items-center gap-2">
                        <div className="relative w-8 h-8 rounded-full overflow-hidden border-2 border-white">
                          <Image
                            src={item.creator.avatarUrl || getCreatorImage(item.creator.id)}
                            alt={item.creator.displayName || item.creator.handle}
                            fill
                            className="object-cover"
                            sizes="32px"
                          />
                        </div>
                        <span className="text-white text-sm font-medium truncate">
                          {item.creator.displayName || `@${item.creator.handle}`}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Content Info */}
                  <div className="space-y-1">
                    <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors line-clamp-2">
                      {item.title}
                    </h3>
                    <div className="flex items-center gap-3 text-xs text-muted-foreground">
                      <span>{item.category}</span>
                      <span>•</span>
                      <span>Purchased {new Date(item.grantedAt).toLocaleDateString()}</span>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
