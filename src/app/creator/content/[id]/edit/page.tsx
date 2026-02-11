"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

interface ContentItem {
  id: string;
  title: string;
  description: string | null;
  category: string;
  status: string;
  contentType: string;
  priceTzs: number;
  viewCount: number;
  likeCount: number;
  commentCount: number;
  publishedAt: string | null;
  createdAt: string;
}

export default function ContentEditPage() {
  const router = useRouter();
  const params = useParams();
  const contentId = params.id as string;
  const [content, setContent] = useState<ContentItem | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchContent();
  }, [contentId]);

  const fetchContent = async () => {
    try {
      const res = await fetch(`/api/creator/content/${contentId}`);
      if (res.ok) {
        const data = await res.json();
        setContent(data.content);
      }
    } catch (error) {
      console.error("Failed to fetch content:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
      </div>
    );
  }

  if (!content) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-2">Content Not Found</h2>
          <p className="text-muted-foreground mb-4">This content may have been deleted.</p>
          <Link href="/creator/dashboard">
            <Button>Back to Dashboard</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button variant="ghost" onClick={() => router.push("/creator/dashboard")}>
                ← Back
              </Button>
              <div>
                <h1 className="text-2xl font-bold">{content.title}</h1>
                <p className="text-sm text-muted-foreground">
                  {content.category} • {content.priceTzs} TZS
                </p>
              </div>
            </div>
            <span
              className={`px-3 py-1 rounded-full text-xs font-medium ${
                content.status === "published"
                  ? "bg-green-500/10 text-green-500"
                  : content.status === "draft"
                  ? "bg-yellow-500/10 text-yellow-500"
                  : "bg-neutral-500/10 text-neutral-500"
              }`}
            >
              {content.status}
            </span>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardHeader>
              <div className="text-sm text-muted-foreground">Views</div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{content.viewCount}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <div className="text-sm text-muted-foreground">Likes</div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{content.likeCount}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <div className="text-sm text-muted-foreground">Comments</div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{content.commentCount}</div>
            </CardContent>
          </Card>
        </div>

        {content.description && (
          <Card className="mb-6">
            <CardHeader>
              <h2 className="text-lg font-semibold">Description</h2>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">{content.description}</p>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader>
            <h2 className="text-lg font-semibold">Content Details</h2>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Type</span>
                <span className="font-medium">
                  {content.contentType === "youtube_preview" ? "YouTube Early Access" : "Upload"}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Price</span>
                <span className="font-medium">{content.priceTzs} TZS</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Published</span>
                <span className="font-medium">
                  {content.publishedAt
                    ? new Date(content.publishedAt).toLocaleDateString()
                    : "Not published"}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Created</span>
                <span className="font-medium">
                  {new Date(content.createdAt).toLocaleDateString()}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="flex items-center justify-between mt-8">
          <Link href="/creator/dashboard">
            <Button variant="outline">Back to Dashboard</Button>
          </Link>
          <Link href="/creator/content/new">
            <Button>Create Another</Button>
          </Link>
        </div>
      </main>
    </div>
  );
}
